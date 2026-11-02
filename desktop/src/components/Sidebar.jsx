import { useState } from 'react';
import { SideNav, SideNavHeading, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import { Divider } from '@astryxdesign/core/Divider';
import { useT } from '../i18n.js';
import { MessChip } from './MessChip.jsx';
import {
  AIIcon,
  FilesNavIcon,
  FunctionsIcon,
  NewAnalysisIcon,
  OverviewIcon,
  ProjectIcon,
  SettingsIcon,
} from '../icons.jsx';
import { Emoji } from './Emoji.jsx';
import { ProjectContextMenu, ProjectMoreButton } from './ProjectMenu.jsx';

const MAX_RECENT_IN_NAV = 8;

/** A recent project: the score shows at rest, a "⋯" menu on hover; right-click opens the same menu. */
function RecentNavItem({ project, isBusy, projectActions }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const showMenu = (isHovered || isMenuOpen) && !isBusy;

  return (
    <div
      className="recent-nav-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ProjectContextMenu project={project} actions={projectActions} isDisabled={isBusy}>
        <SideNavItem
          label={project.name}
          icon={ProjectIcon}
          isDisabled={isBusy}
          onClick={() => projectActions.onOpen(project.path)}
          // endContent sits inside the row's button, so the interactive menu uses `actions`.
          endContent={showMenu ? undefined : <MessChip mess={project.score} />}
          actions={
            showMenu ? (
              <ProjectMoreButton
                project={project}
                actions={projectActions}
                onOpenChange={setIsMenuOpen}
              />
            ) : undefined
          }
        />
      </ProjectContextMenu>
    </div>
  );
}

export function Sidebar({
  view,
  hasReport,
  isBusy,
  report,
  recentProjects,
  onNavigate,
  onNew,
  projectActions,
}) {
  const t = useT();

  return (
    <SideNav
      resizable={{ defaultWidth: 248, minWidth: 208, maxWidth: 360 }}
      header={
        <SideNavHeading
          heading="fuck-u-code"
          subheading={t('report_title')}
          icon={<Emoji name="cherry-blossom" size={30} />}
        />
      }
      footer={
        <SideNavSection title={t('nav_settings')} isHeaderHidden>
          <SideNavItem
            label={t('nav_settings')}
            icon={SettingsIcon}
            isSelected={view === 'settings'}
            onClick={() => onNavigate('settings')}
          />
        </SideNavSection>
      }
    >
      <SideNavSection title={t('nav_new')} isHeaderHidden>
        <SideNavItem
          label={t('nav_new')}
          icon={NewAnalysisIcon}
          isSelected={view === 'home'}
          isDisabled={isBusy}
          onClick={onNew}
        />
      </SideNavSection>

      {hasReport && (
        <SideNavSection title={report.projectName}>
          <SideNavItem
            label={t('nav_overview')}
            icon={OverviewIcon}
            isSelected={view === 'overview'}
            isDisabled={isBusy}
            onClick={() => onNavigate('overview')}
            endContent={<MessChip mess={100 - report.overallScore} />}
          />
          <SideNavItem
            label={t('nav_files')}
            icon={FilesNavIcon}
            isSelected={view === 'files'}
            isDisabled={isBusy}
            onClick={() => onNavigate('files')}
            endContent={<span className="nav-count">{report.analyzedFiles}</span>}
          />
          <SideNavItem
            label={t('nav_functions')}
            icon={FunctionsIcon}
            isSelected={view === 'functions'}
            isDisabled={isBusy}
            onClick={() => onNavigate('functions')}
          />
          <SideNavItem
            label={t('nav_ai')}
            icon={AIIcon}
            isSelected={view === 'ai'}
            isDisabled={isBusy}
            onClick={() => onNavigate('ai')}
          />
        </SideNavSection>
      )}

      {recentProjects.length > 0 && (
        <>
          <Divider />
          <SideNavSection title={t('nav_recent')}>
            {recentProjects.slice(0, MAX_RECENT_IN_NAV).map((project) => (
              <RecentNavItem
                key={project.path}
                project={project}
                isBusy={isBusy}
                projectActions={projectActions}
              />
            ))}
          </SideNavSection>
        </>
      )}
    </SideNav>
  );
}
