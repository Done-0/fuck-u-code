import { Center } from '@astryxdesign/core/Center';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack } from '@astryxdesign/core/Stack';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { useT } from '../i18n.js';
import { RefreshIcon } from '../icons.jsx';
import { Emoji } from '../components/Emoji.jsx';

/** A recent project with no saved report: analysis waits for the user's go-ahead. */
export function NoReportView({ name, onAnalyze, onBack }) {
  const t = useT();
  return (
    <Center height="100%">
      <EmptyState
        title={t('no_report_title')}
        description={t('no_report_desc', { name })}
        icon={<Emoji name="open-folder" size={64} />}
        actions={
          <HStack gap={2}>
            <Button
              label={t('no_report_analyze')}
              variant="primary"
              icon={<Icon icon={RefreshIcon} size="sm" />}
              onClick={onAnalyze}
            />
            <Button label={t('action_back')} variant="secondary" onClick={onBack} />
          </HStack>
        }
      />
    </Center>
  );
}
