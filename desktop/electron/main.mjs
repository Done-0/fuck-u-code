/**
 * Electron main process: window management and IPC.
 */

import { app, BrowserWindow, dialog, ipcMain, Menu, nativeTheme, shell } from 'electron';
import { writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  deleteReport,
  loadReport,
  loadReviews,
  pruneReports,
  saveReport,
  saveReviews,
} from './report-cache.mjs';
import { listModels } from './models.mjs';
import {
  CORE_VERSION,
  currentProjectPath,
  currentSnapshot,
  renderReport,
  renderReviews,
  resolveProjectPath,
  restoreAnalysis,
  restoreReviews,
  reviewFiles,
  runAnalysis,
} from './service.mjs';
import {
  forgetProject,
  getAISettings,
  getLocale,
  getPublicSettings,
  rememberProject,
  updateSettings,
} from './settings.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isMac = process.platform === 'darwin';
const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const TITLE_BAR_HEIGHT = 40;

const EXPORT_FORMATS = {
  html: { ext: 'html', name: 'HTML' },
  markdown: { ext: 'md', name: 'Markdown' },
  json: { ext: 'json', name: 'JSON' },
};

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 980,
    minHeight: 620,
    show: false,
    title: 'fuck-u-code',
    icon: join(__dirname, '..', 'build', 'icon.png'),
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#141414' : '#ffffff',
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    ...(isMac
      ? { trafficLightPosition: { x: 14, y: 13 } }
      : {
          titleBarOverlay: {
            color: nativeTheme.shouldUseDarkColors ? '#141414' : '#ffffff',
            symbolColor: nativeTheme.shouldUseDarkColors ? '#e5e5e5' : '#262626',
            height: TITLE_BAR_HEIGHT,
          },
        }),
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Links open in the system browser; the app window never navigates away.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) {
      event.preventDefault();
      if (/^https?:\/\//.test(url)) shell.openExternal(url);
    }
  });

  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.type === 'keyDown' && input.key === 'F12' && !app.isPackaged) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(join(__dirname, '..', 'out', 'renderer', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function buildMenu() {
  // Windows/Linux draw their own title bar, so the menu bar would only get in the way.
  if (!isMac) {
    Menu.setApplicationMenu(null);
    return;
  }
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { role: 'appMenu' },
      { role: 'editMenu' },
      {
        role: 'viewMenu',
        submenu: app.isPackaged
          ? [{ role: 'togglefullscreen' }]
          : [{ role: 'reload' }, { role: 'toggleDevTools' }, { role: 'togglefullscreen' }],
      },
      { role: 'windowMenu' },
    ])
  );
}

/** Register an invoke handler whose errors reach the renderer as plain messages. */
function handle(channel, fn) {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return { ok: true, data: await fn(event, ...args) };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}

/** Move a project to the top of the recent list and drop caches that fell off it. */
async function remember(result) {
  const recentProjects = await rememberProject({
    path: result.projectPath,
    name: result.projectName,
    score: 100 - result.overallScore,
    analyzedAt: result.analyzedAt,
  });
  await pruneReports(recentProjects.map((project) => project.path));
  return recentProjects;
}

/** Saved review entries of the open project, also loaded for exports. */
async function reviewsFor(projectPath) {
  const items = await loadReviews(projectPath);
  restoreReviews(items);
  return items;
}

async function saveText(defaultName, format, text) {
  const { ext, name } = EXPORT_FORMATS[format];
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `${defaultName}.${ext}`,
    filters: [{ name, extensions: [ext] }],
  });
  if (canceled || !filePath) return null;
  await writeFile(filePath, text, 'utf8');
  return filePath;
}

function registerIpc() {
  handle('app:info', () => ({
    version: app.getVersion(),
    coreVersion: CORE_VERSION,
    electronVersion: process.versions.electron,
    platform: process.platform,
  }));

  handle('settings:get', () => getPublicSettings());

  handle('settings:update', async (_event, patch) => {
    const settings = await updateSettings(patch);
    nativeTheme.themeSource = settings.theme;
    return settings;
  });

  handle('projects:forget', async (_event, path) => {
    await deleteReport(path);
    return forgetProject(path);
  });

  handle('dialog:pick-folder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    });
    return canceled ? null : (filePaths[0] ?? null);
  });

  handle('analysis:run', async (event, projectPath) => {
    const settings = await getPublicSettings();
    const result = await runAnalysis(
      {
        projectPath,
        exclude: settings.exclude,
        concurrency: settings.concurrency,
        locale: settings.locale,
      },
      (progress) => event.sender.send('analysis:progress', progress)
    );
    // A failed cache write costs a re-analysis later, not this result.
    await saveReport(currentSnapshot()).catch((error) =>
      console.error('[report-cache] could not save report:', error)
    );
    const recentProjects = await remember(result);
    // Reviews outlive re-analysis: only a new review run replaces them.
    return { result, recentProjects, reviews: await reviewsFor(result.projectPath) };
  });

  // Reopen a project from its cached report; null means it has to be analyzed.
  handle('analysis:open', async (_event, projectPath) => {
    const snapshot = await loadReport(resolve(projectPath));
    if (!snapshot) return null;
    const settings = await getPublicSettings();
    const result = await restoreAnalysis(snapshot, {
      exclude: settings.exclude,
      concurrency: settings.concurrency,
    });
    const recentProjects = await remember(result);
    return { result, recentProjects, reviews: await reviewsFor(result.projectPath) };
  });

  handle('analysis:export', async (_event, { format, projectName }) => {
    const text = renderReport(format, await getLocale());
    return saveText(`${projectName}-fuck-u-code-report`, format, text);
  });

  // Finished entries are saved even when the run stops early, replacing the previous review.
  handle('ai:review', async (event, filePaths) => {
    const projectPath = currentProjectPath();
    const finished = new Map();
    try {
      return await reviewFiles(
        { filePaths, ai: await getAISettings(), locale: await getLocale() },
        (progress) => {
          const { filePath, status, review, error } = progress;
          if (status === 'done' || status === 'error') {
            finished.set(filePath, { filePath, status, review, error });
          }
          event.sender.send('ai:progress', progress);
        }
      );
    } finally {
      await saveReviews(projectPath, [...finished.values()]).catch((error) =>
        console.error('[report-cache] could not save reviews:', error)
      );
    }
  });

  handle('ai:clear-reviews', async () => {
    restoreReviews([]);
    await saveReviews(currentProjectPath(), []);
  });

  // A key typed in the form wins; otherwise reuse the saved key for the same provider.
  handle('ai:list-models', async (_event, { provider, baseUrl, apiKey }) => {
    const saved = await getAISettings();
    const key =
      apiKey ||
      (saved.provider === provider ? saved.apiKey : '') ||
      process.env[`${String(provider).toUpperCase()}_API_KEY`] ||
      '';
    return listModels({ provider, baseUrl, apiKey: key });
  });

  handle('ai:export', async (_event, { format, projectName }) => {
    const text = renderReviews(format, await getLocale());
    return saveText(`${projectName}-ai-review`, format, text);
  });

  handle('shell:open-file', (_event, filePath) => shell.openPath(resolveProjectPath(filePath)));

  handle('shell:show-in-folder', (_event, filePath) => {
    shell.showItemInFolder(resolveProjectPath(filePath));
  });

  // Only folders already in the recent list, so the renderer cannot reveal arbitrary paths.
  handle('shell:reveal-project', async (_event, projectPath) => {
    const { recentProjects } = await getPublicSettings();
    if (!recentProjects.some((project) => project.path === projectPath)) {
      throw new Error('Not a recent project');
    }
    shell.openPath(projectPath);
  });

  ipcMain.on('window:title-bar', (_event, { color, symbolColor }) => {
    if (!isMac && mainWindow && typeof color === 'string' && typeof symbolColor === 'string') {
      mainWindow.setTitleBarOverlay({ color, symbolColor, height: TITLE_BAR_HEIGHT });
    }
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    nativeTheme.themeSource = (await getPublicSettings()).theme;
    buildMenu();
    registerIpc();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (!isMac) app.quit();
  });
}
