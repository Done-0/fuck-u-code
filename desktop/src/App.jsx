import { useCallback, useMemo } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { AppShell } from '@astryxdesign/core/AppShell';
import { I18nContext, createTranslator } from './i18n.js';
import { TitleBar } from './components/TitleBar.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { DropOverlay } from './components/DropOverlay.jsx';
import { ViewRouter } from './views/ViewRouter.jsx';
import { RemoveProjectDialog, useRemoveProject } from './components/ProjectMenu.jsx';
import { useNavigation } from './hooks/useNavigation.js';
import { useSettings } from './hooks/useSettings.js';
import { useProject, useRestoreLastProject } from './hooks/useProject.js';
import { useReview } from './hooks/useReview.js';
import { useFolderDrop } from './hooks/useFolderDrop.js';

// Views that belong to the open project, so the title bar names it.
const PROJECT_VIEWS = new Set(['overview', 'files', 'functions', 'ai']);

function windowTitle(view, project) {
  if (project.run) return project.run.name;
  return PROJECT_VIEWS.has(view) ? project.report?.projectName : null;
}

/** App shell: wires the state hooks together and lays out chrome around the current view. */
export default function App() {
  const nav = useNavigation();
  const prefs = useSettings();
  const reviews = useReview();

  // A report (re)appears: drop the file selection and show that project's saved AI review.
  const { clearSelection } = nav;
  const { restore: restoreReview } = reviews;
  const resetForNewReport = useCallback(
    (payload) => {
      clearSelection();
      restoreReview(payload.reviews ?? []);
    },
    [clearSelection, restoreReview]
  );

  const project = useProject({
    navigate: nav.go,
    onRecentProjects: prefs.setRecentProjects,
    onShown: resetForNewReport,
  });
  useRestoreLastProject(prefs.settings, project.reopen);

  const removal = useRemoveProject(async (projectPath) => {
    await prefs.forgetProject(projectPath);
    project.close(projectPath);
  });
  // Shared by the sidebar and the home screen's recent list.
  const projectActions = {
    onOpen: project.openProject,
    onReanalyze: project.analyze,
    onRemove: removal.ask,
  };

  const locale = prefs.settings?.locale ?? 'en';
  const t = useMemo(() => createTranslator(locale), [locale]);

  const drop = useFolderDrop({
    isDisabled: Boolean(project.run),
    onFolder: project.analyze,
    onNotFolder: () => project.fail(t('home_drop_not_folder')),
  });

  if (!prefs.settings) return null;
  const { settings } = prefs;

  return (
    <I18nContext.Provider value={t}>
      <Theme theme={neutralTheme} mode={settings.theme}>
        <div className="app" {...drop.handlers}>
          <TitleBar title={windowTitle(nav.view, project)} theme={settings.theme} />
          <div className="app-body">
            <AppShell
              height="fill"
              contentPadding={0}
              mobileNav={false}
              sideNav={
                <Sidebar
                  view={nav.view}
                  hasReport={Boolean(project.report)}
                  isBusy={Boolean(project.run)}
                  report={project.report}
                  recentProjects={settings.recentProjects}
                  onNavigate={nav.go}
                  onNew={() => nav.go('home')}
                  projectActions={projectActions}
                />
              }
            >
              <ViewRouter
                nav={nav}
                prefs={prefs}
                project={project}
                reviews={reviews}
                projectActions={projectActions}
              />
            </AppShell>
          </div>
          {drop.isDragging && <DropOverlay />}
          <RemoveProjectDialog {...removal.dialogProps} />
        </div>
      </Theme>
    </I18nContext.Provider>
  );
}
