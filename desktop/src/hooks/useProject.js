import { useCallback, useEffect, useRef, useState } from 'react';

const INITIAL_PROGRESS = { phase: 'discovering', current: 0, total: 0 };

function projectName(projectPath) {
  return projectPath.split(/[\\/]/).filter(Boolean).pop() ?? projectPath;
}

/**
 * The open report and the analysis that produces it.
 *
 * @param navigate          switches the visible view
 * @param onRecentProjects  receives the updated recent list after each open
 * @param onShown           runs with the open payload whenever a report appears
 */
export function useProject({ navigate, onRecentProjects, onShown }) {
  const [report, setReport] = useState(null);
  const [run, setRun] = useState(null); // { projectPath, name, progress } while analyzing
  const [error, setError] = useState(null); // { message, projectPath? }
  const [missing, setMissing] = useState(null); // { projectPath, name } of a project without a saved report

  const show = useCallback(
    (payload) => {
      setReport(payload.result);
      onRecentProjects(payload.recentProjects);
      onShown(payload);
      navigate('overview');
    },
    [navigate, onRecentProjects, onShown]
  );

  // projectPath is optional: errors without one have no "try again".
  const fail = useCallback(
    (message, projectPath) => {
      setError({ message, projectPath });
      navigate('error');
    },
    [navigate]
  );

  const analyze = useCallback(
    async (projectPath) => {
      if (!projectPath) return;
      setRun({ projectPath, name: projectName(projectPath), progress: INITIAL_PROGRESS });
      navigate('analyzing');
      const unsubscribe = window.fuc.onAnalysisProgress((progress) =>
        setRun((prev) => prev && { ...prev, progress })
      );
      try {
        show(await window.fuc.analyze(projectPath));
      } catch (err) {
        fail(err.message, projectPath);
      } finally {
        unsubscribe();
        setRun(null);
      }
    },
    [navigate, show, fail]
  );

  // Opens a project from its saved report. Resolves false when there is none; rejects on errors.
  const reopen = useCallback(
    async (projectPath) => {
      const opened = await window.fuc.openProject(projectPath);
      if (opened) show(opened);
      return Boolean(opened);
    },
    [show]
  );

  // Known projects only ever open from their saved report. Analysis runs when the
  // user asks for it (Re-analyze, or the button on the no-report page), never on its own.
  const openProject = useCallback(
    async (projectPath) => {
      if (report?.projectPath === projectPath) {
        navigate('overview');
        return;
      }
      try {
        if (!(await reopen(projectPath))) {
          setMissing({ projectPath, name: projectName(projectPath) });
          navigate('no-report');
        }
      } catch (err) {
        fail(err.message);
      }
    },
    [report, navigate, reopen, fail]
  );

  // A removed project can't stay on screen: fall back to home if it was the open one.
  const close = useCallback(
    (projectPath) => {
      if (report?.projectPath !== projectPath) return;
      setReport(null);
      navigate('home');
    },
    [report, navigate]
  );

  return { report, run, error, missing, analyze, openProject, reopen, fail, close };
}

/** On launch, pick up where the user left off, but only from cache: never analyze. */
export function useRestoreLastProject(settings, reopen) {
  const attempted = useRef(false);

  useEffect(() => {
    if (!settings || attempted.current) return;
    attempted.current = true;
    const last = settings.recentProjects[0];
    // Silent on purpose: without a saved report the app simply starts at home.
    if (last) reopen(last.path).catch(() => {});
  }, [settings, reopen]);
}
