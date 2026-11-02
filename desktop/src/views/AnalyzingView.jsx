import { useEffect, useState } from 'react';
import { Center } from '@astryxdesign/core/Center';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/Stack';
import { Heading, Text } from '@astryxdesign/core/Text';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { useT } from '../i18n.js';
import { Emoji } from '../components/Emoji.jsx';

const QUIP_INTERVAL_MS = 2600;
const QUIP_KEYS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((n) => `score_comment_${n}`);

export function AnalyzingView({ run }) {
  const t = useT();
  const [quip, setQuip] = useState(() => Math.floor(Math.random() * QUIP_KEYS.length));
  const { phase, current, total } = run.progress;
  const isDiscovering = phase === 'discovering' || total === 0;

  useEffect(() => {
    const timer = setInterval(() => setQuip((i) => (i + 1) % QUIP_KEYS.length), QUIP_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <Center height="100%">
      <Card padding={8} width={520}>
        <VStack gap={6}>
          <VStack gap={2}>
            <Emoji name="nose" size={56} className="sniff-mark" />
            <Heading level={2}>{t('progress_title', { name: run.name })}</Heading>
            <Text type="supporting" color="secondary" maxLines={1}>
              {run.projectPath}
            </Text>
          </VStack>
          <VStack gap={2}>
            <ProgressBar
              label={isDiscovering ? t('progress_discovering') : t('progress_analyzing')}
              value={current}
              max={Math.max(total, 1)}
              isIndeterminate={isDiscovering}
              variant="accent"
            />
            <Text type="supporting" color="secondary">
              {isDiscovering ? t('progress_discovering') : t('progress_files', { current, total })}
            </Text>
          </VStack>
          <Text color="secondary" key={quip}>
            <span className="quip">“{t(QUIP_KEYS[quip])}”</span>
          </Text>
        </VStack>
      </Card>
    </Center>
  );
}
