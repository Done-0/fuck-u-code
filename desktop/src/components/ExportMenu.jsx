import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { Icon } from '@astryxdesign/core/Icon';
import { useToast } from '@astryxdesign/core/Toast';
import { useT } from '../i18n.js';
import { ExportIcon } from '../icons.jsx';

const FORMAT_LABELS = { html: 'HTML', markdown: 'Markdown', json: 'JSON' };

/** Export button: asks main for a save location and reports where the file went. */
export function ExportMenu({ label, formats, onExport, isDisabled }) {
  const t = useT();
  const showToast = useToast();

  const run = async (format) => {
    try {
      const path = await onExport(format);
      if (path) showToast({ body: t('export_done', { path }), type: 'info' });
    } catch (error) {
      showToast({ body: error.message, type: 'error' });
    }
  };

  return (
    <DropdownMenu
      button={{
        label,
        variant: 'secondary',
        isDisabled,
        icon: <Icon icon={ExportIcon} size="sm" />,
      }}
      alignment="end"
      items={formats.map((format) => ({
        id: format,
        label: FORMAT_LABELS[format],
        onClick: () => run(format),
      }))}
    />
  );
}
