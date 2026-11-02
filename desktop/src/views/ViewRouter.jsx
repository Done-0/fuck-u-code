import { HomeView } from './HomeView.jsx';
import { AnalyzingView } from './AnalyzingView.jsx';
import { OverviewView } from './OverviewView.jsx';
import { FilesView } from './FilesView.jsx';
import { FunctionsView } from './FunctionsView.jsx';
import { AIReviewView } from './AIReviewView.jsx';
import { SettingsView } from './SettingsView.jsx';
import { ErrorView } from './ErrorView.jsx';
import { NoReportView } from './NoReportView.jsx';

/**
 * One render function per view. A route that returns nothing (e.g. a report
 * view with no report open) falls back to the home screen.
 * Each receives the app's state groups: nav, prefs, project, reviews.
 */
const ROUTES = {
  analyzing: ({ project }) => project.run && <AnalyzingView run={project.run} />,

  error: ({ nav, project }) =>
    project.error && (
      <ErrorView
        error={project.error}
        onRetry={
          project.error.projectPath ? () => project.analyze(project.error.projectPath) : undefined
        }
        onBack={() => nav.go(project.report ? 'overview' : 'home')}
      />
    ),

  'no-report': ({ nav, project }) =>
    project.missing && (
      <NoReportView
        name={project.missing.name}
        onAnalyze={() => project.analyze(project.missing.projectPath)}
        onBack={() => nav.go(project.report ? 'overview' : 'home')}
      />
    ),

  settings: ({ nav, prefs }) => (
    <SettingsView
      settings={prefs.settings}
      appInfo={prefs.appInfo}
      onSave={prefs.saveSettings}
      section={nav.settingsSection}
      onSectionChange={nav.setSettingsSection}
    />
  ),

  ai: ({ nav, prefs, project, reviews }) => (
    <AIReviewView
      report={project.report}
      settings={prefs.settings}
      review={reviews.review}
      onStart={reviews.start}
      onClear={reviews.clear}
      onOpenSettings={() => nav.openSettings('ai')}
      onOpenFile={nav.openFile}
    />
  ),

  overview: ({ nav, project }) =>
    project.report && (
      <OverviewView
        report={project.report}
        onReanalyze={() => project.analyze(project.report.projectPath)}
        onNavigate={nav.go}
        onOpenFile={nav.openFile}
      />
    ),

  files: ({ nav, project, reviews }) =>
    project.report && (
      <FilesView
        report={project.report}
        selectedFile={nav.selectedFile}
        onSelectFile={nav.selectFile}
        onReview={(filePath) => {
          nav.go('ai');
          reviews.start([filePath]);
        }}
        isReviewing={reviews.review.running}
      />
    ),

  functions: ({ nav, project }) =>
    project.report && <FunctionsView report={project.report} onOpenFile={nav.openFile} />,
};

export function ViewRouter(state) {
  const { prefs, project, projectActions } = state;
  return (
    ROUTES[state.nav.view]?.(state) || (
      <HomeView
        recentProjects={prefs.settings.recentProjects}
        onPick={async () => project.analyze(await window.fuc.pickFolder())}
        projectActions={projectActions}
      />
    )
  );
}
