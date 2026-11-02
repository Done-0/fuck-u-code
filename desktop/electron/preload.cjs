/**
 * Preload bridge: the only API the renderer gets, exposed as window.fuc.
 */

const { contextBridge, ipcRenderer, webUtils } = require('electron');

async function call(channel, ...args) {
  let response;
  try {
    response = await ipcRenderer.invoke(channel, ...args);
  } catch (error) {
    // Only when the main process predates this preload (an app left running across an update).
    if (String(error.message).includes('No handler registered')) {
      throw new Error(
        `Restart the app to finish updating / 应用需要重启才能使用这个功能 (${channel})`
      );
    }
    throw error;
  }
  if (!response.ok) throw new Error(response.error);
  return response.data;
}

function subscribe(channel, callback) {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('fuc', {
  platform: process.platform,

  getAppInfo: () => call('app:info'),
  getSettings: () => call('settings:get'),
  updateSettings: (patch) => call('settings:update', patch),
  forgetProject: (path) => call('projects:forget', path),

  pickFolder: () => call('dialog:pick-folder'),
  getPathForFile: (file) => webUtils.getPathForFile(file),

  analyze: (projectPath) => call('analysis:run', projectPath),
  openProject: (projectPath) => call('analysis:open', projectPath),
  onAnalysisProgress: (callback) => subscribe('analysis:progress', callback),
  exportReport: (format, projectName) => call('analysis:export', { format, projectName }),

  reviewFiles: (filePaths) => call('ai:review', filePaths),
  clearReviews: () => call('ai:clear-reviews'),
  listModels: (options) => call('ai:list-models', options),
  onReviewProgress: (callback) => subscribe('ai:progress', callback),
  exportReviews: (format, projectName) => call('ai:export', { format, projectName }),

  openFile: (filePath) => call('shell:open-file', filePath),
  showInFolder: (filePath) => call('shell:show-in-folder', filePath),
  revealProject: (projectPath) => call('shell:reveal-project', projectPath),

  setTitleBarColors: (colors) => ipcRenderer.send('window:title-bar', colors),
});
