/**
 * Stand-in for the Electron preload when the renderer runs in a plain browser
 * (`FUC_BROWSER_PREVIEW=1 npx vite`). Analysis goes through the dev server;
 * desktop-only actions are no-ops. Never bundled into the app.
 */

export function installBrowserBridge() {
  let settings = {
    locale: 'zh',
    theme: 'system',
    concurrency: 8,
    exclude: [],
    recentProjects: [],
    ai: { provider: 'openai', model: '', baseUrl: '', hasApiKey: false },
  };

  const noop = () => () => {};

  window.fuc = {
    platform: 'win32',
    getAppInfo: async () => ({ version: 'dev', coreVersion: 'dev', platform: 'browser' }),
    getSettings: async () => settings,
    updateSettings: async (patch) => {
      settings = { ...settings, ...patch, ai: { ...settings.ai, ...(patch.ai ?? {}) } };
      return settings;
    },
    forgetProject: async (path) => {
      settings = {
        ...settings,
        recentProjects: settings.recentProjects.filter((p) => p.path !== path),
      };
      return settings.recentProjects;
    },
    pickFolder: async () =>
      new URLSearchParams(location.search).get('project') ?? window.prompt('Project path'),
    getPathForFile: () => null,
    openProject: async () => null,
    analyze: async (projectPath) => {
      const response = await fetch('/__fuc/analyze', {
        method: 'POST',
        body: JSON.stringify({
          projectPath,
          exclude: settings.exclude,
          concurrency: settings.concurrency,
          locale: settings.locale,
        }),
      });
      const payload = await response.json();
      if (!payload.ok) throw new Error(payload.error);
      const result = payload.data;
      settings.recentProjects = [
        {
          path: result.projectPath,
          name: result.projectName,
          score: 100 - result.overallScore,
          analyzedAt: new Date().toISOString(),
        },
        ...settings.recentProjects.filter((p) => p.path !== result.projectPath),
      ];
      return { result, recentProjects: settings.recentProjects };
    },
    onAnalysisProgress: noop,
    exportReport: async () => null,
    reviewFiles: async () => {
      throw new Error('AI review needs the desktop app');
    },
    onReviewProgress: noop,
    clearReviews: async () => {},
    // Preview data only; the desktop app queries the provider.
    listModels: async () => ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'o3', 'o4-mini'],
    exportReviews: async () => null,
    openFile: async () => {},
    showInFolder: async () => {},
    revealProject: async () => {},
    setTitleBarColors: () => {},
  };
}
