import { Center } from '@astryxdesign/core/Center';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack } from '@astryxdesign/core/Stack';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { useT } from '../i18n.js';
import { WarnIcon } from '../icons.jsx';

export function ErrorView({ error, onRetry, onBack }) {
  const t = useT();
  return (
    <Center height="100%">
      <EmptyState
        title={t('error_title')}
        description={error.message}
        icon={<Icon icon={WarnIcon} size="lg" color="error" />}
        actions={
          <HStack gap={2}>
            {onRetry && <Button label={t('action_retry')} variant="primary" onClick={onRetry} />}
            <Button label={t('action_back')} variant="secondary" onClick={onBack} />
          </HStack>
        }
      />
    </Center>
  );
}
