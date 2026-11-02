import { useCallback, useEffect, useState } from 'react';

/** Persisted settings and app info, loaded once from the main process. */
export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [appInfo, setAppInfo] = useState(null);
  const locale = settings?.locale;

  useEffect(() => {
    window.fuc.getAppInfo().then(setAppInfo);
    window.fuc.getSettings().then(setSettings);
  }, []);

  // Keep <html lang> in step so fonts and screen readers pick the right language.
  useEffect(() => {
    if (locale) document.documentElement.lang = locale.replace('_', '-');
  }, [locale]);

  const saveSettings = useCallback(async (patch) => {
    const next = await window.fuc.updateSettings(patch);
    setSettings(next);
    return next;
  }, []);

  // The main process owns the recent list; it hands back the new one after each change.
  const setRecentProjects = useCallback((recentProjects) => {
    setSettings((prev) => ({ ...prev, recentProjects }));
  }, []);

  const forgetProject = useCallback(
    async (path) => setRecentProjects(await window.fuc.forgetProject(path)),
    [setRecentProjects]
  );

  return { settings, appInfo, saveSettings, setRecentProjects, forgetProject };
}
