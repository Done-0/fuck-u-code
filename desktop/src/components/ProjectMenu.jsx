import { useState } from 'react';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { ContextMenu } from '@astryxdesign/core/ContextMenu';
import { MoreMenu } from '@astryxdesign/core/MoreMenu';
import { useT } from '../i18n.js';
import { ClearIcon, OverviewIcon, RefreshIcon, RevealIcon } from '../icons.jsx';

/**
 * Actions for a recent project. `actions` holds onOpen, onReanalyze and onRemove;
 * removal itself goes through useRemoveProject so it always asks first.
 */
function menuItems(t, project, actions) {
  return [
    {
      id: 'open',
      label: t('project_open'),
      icon: OverviewIcon,
      onClick: () => actions.onOpen(project.path),
    },
    {
      id: 'reanalyze',
      label: t('report_reanalyze'),
      icon: RefreshIcon,
      onClick: () => actions.onReanalyze(project.path),
    },
    {
      id: 'reveal',
      label: t('file_reveal'),
      icon: RevealIcon,
      onClick: () => window.fuc.revealProject(project.path).catch(() => {}),
    },
    { type: 'divider' },
    {
      id: 'remove',
      label: t('project_remove'),
      icon: ClearIcon,
      variant: 'destructive',
      onClick: () => actions.onRemove(project),
    },
  ];
}

/** Right-click anywhere on `children` opens the project menu. */
export function ProjectContextMenu({ project, actions, isDisabled, children }) {
  const t = useT();
  return (
    <ContextMenu
      items={menuItems(t, project, actions)}
      label={project.name}
      isDisabled={isDisabled}
      menuWidth={200}
    >
      {children}
    </ContextMenu>
  );
}

/** The "⋯" button with the same menu, for mouse users who don't think of right-clicking. */
export function ProjectMoreButton({ project, actions, isDisabled, onOpenChange }) {
  const t = useT();
  return (
    // Keep clicks on the button and its menu (a React portal, so it bubbles here too)
    // from also activating the row underneath.
    <span className="project-more" onClick={(event) => event.stopPropagation()}>
      <MoreMenu
        size="sm"
        label={t('project_more', { name: project.name })}
        items={menuItems(t, project, actions)}
        isDisabled={isDisabled}
        onOpenChange={onOpenChange}
        alignment="end"
      />
    </span>
  );
}

/**
 * Confirm-then-remove state. Call `ask(project)` from any menu and render
 * <RemoveProjectDialog {...dialogProps} /> once, inside the i18n provider.
 */
export function useRemoveProject(onConfirm) {
  const [pending, setPending] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const confirm = async () => {
    setIsRemoving(true);
    try {
      await onConfirm(pending.path);
    } finally {
      setIsRemoving(false);
      setPending(null);
    }
  };

  return {
    ask: setPending,
    dialogProps: {
      project: pending,
      isRemoving,
      onConfirm: confirm,
      onCancel: () => setPending(null),
    },
  };
}

export function RemoveProjectDialog({ project, isRemoving, onConfirm, onCancel }) {
  const t = useT();
  return (
    <AlertDialog
      isOpen={project !== null}
      onOpenChange={(isOpen) => !isOpen && onCancel()}
      title={t('project_remove_title', { name: project?.name ?? '' })}
      description={t('project_remove_desc')}
      actionLabel={t('project_remove')}
      actionVariant="destructive"
      cancelLabel={t('action_cancel')}
      isActionLoading={isRemoving}
      onAction={onConfirm}
      width={420}
    />
  );
}
