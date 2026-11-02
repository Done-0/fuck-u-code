import { useMemo, useState } from 'react';
import { Layout, LayoutContent, LayoutHeader } from '@astryxdesign/core/Layout';
import { Center } from '@astryxdesign/core/Center';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Stack';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Card } from '@astryxdesign/core/Card';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { Banner } from '@astryxdesign/core/Banner';
import { Divider } from '@astryxdesign/core/Divider';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Markdown } from '@astryxdesign/core/Markdown';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Spinner } from '@astryxdesign/core/Spinner';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { useT } from '../i18n.js';
import { countIssues, toMess } from '../score.js';
import { providerLabel } from '../providers.js';
import { ExportMenu } from '../components/ExportMenu.jsx';
import { FilePath, MessBadge } from '../components/common.jsx';
import {
  AIActionIcon,
  AIIcon,
  CheckIcon,
  ClearIcon,
  ExpandIcon,
  OverviewIcon,
  PrivacyIcon,
  SettingsIcon,
} from '../icons.jsx';

const STATUS_DOT = { idle: 'neutral', waiting: 'neutral', done: 'success', error: 'error' };
const MAX_FILES = 20;

function QueueItem({ item, index, file, isExpanded, onToggle, onOpenFile }) {
  const t = useT();
  const mess = file ? toMess(file.score) : undefined;
  const hasBody = item.status === 'done' || item.status === 'error';
  const bodyId = `review-body-${index}`;
  const toggle = hasBody ? () => onToggle(item.filePath) : undefined;

  return (
    <Card padding={0}>
      {/* The whole header toggles a finished review; the chevron button is the keyboard path. */}
      <div className={`queue-row${hasBody ? ' is-toggleable' : ''}`} onClick={toggle}>
        <span className="rank-index">{index + 1}</span>
        <button
          type="button"
          className="link-button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenFile(item.filePath);
          }}
        >
          <FilePath path={item.filePath} />
        </button>
        {item.status === 'running' ? (
          // One visible "reviewing" label; the spinner's name is for screen readers only.
          <span className="queue-status">
            {t('ai_status_running')}
            <Spinner size="sm" aria-label={t('ai_status_running')} />
          </span>
        ) : (
          <span className="queue-status">
            <StatusDot variant={STATUS_DOT[item.status]} label={t(`ai_status_${item.status}`)} />
            {t(`ai_status_${item.status}`)}
          </span>
        )}
        <Text type="supporting" color="secondary" hasTabularNumbers>
          {file ? t('unit_issues', { count: countIssues(file) }) : ''}
        </Text>
        {mess !== undefined ? <MessBadge mess={mess} /> : <span />}
        {hasBody ? (
          <button
            type="button"
            className={`expand-toggle${isExpanded ? ' is-expanded' : ''}`}
            aria-expanded={isExpanded}
            aria-controls={bodyId}
            aria-label={isExpanded ? t('ai_collapse') : t('ai_expand')}
            title={isExpanded ? t('ai_collapse') : t('ai_expand')}
            onClick={(event) => {
              event.stopPropagation();
              toggle();
            }}
          >
            <Icon icon={ExpandIcon} size="sm" />
          </button>
        ) : (
          <span />
        )}
      </div>
      {hasBody && isExpanded && (
        <div id={bodyId}>
          <Divider />
          <div className="review-body">
            {item.status === 'done' ? (
              <Markdown headingLevelStart={3}>{item.review || '—'}</Markdown>
            ) : (
              <p className="text-error">{item.error}</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <Text type="supporting" color="secondary">
        {label}
      </Text>
      <Text weight="medium" maxLines={1}>
        {value}
      </Text>
    </div>
  );
}

function ModelCard({ ai, onOpenSettings }) {
  const t = useT();
  return (
    <Card padding={5}>
      <VStack gap={4}>
        <HStack gap={2} vAlign="center">
          <Icon icon={AIIcon} size="sm" color="accent" />
          <Heading level={4}>{t('ai_model_title')}</Heading>
        </HStack>
        {ai.model ? (
          <VStack gap={3}>
            <InfoRow label={t('settings_provider')} value={providerLabel(ai.provider)} />
            <InfoRow label={t('settings_model')} value={ai.model} />
            <InfoRow label={t('settings_base_url')} value={ai.baseUrl || t('ai_base_default')} />
            <InfoRow
              label={t('settings_api_key')}
              value={ai.hasApiKey ? t('ai_key_saved') : t('ai_key_missing')}
            />
          </VStack>
        ) : (
          <Text color="secondary">{t('ai_using_env')}</Text>
        )}
        <HStack>
          <Button
            label={t('ai_change')}
            variant="secondary"
            size="sm"
            icon={<Icon icon={SettingsIcon} size="sm" />}
            onClick={onOpenSettings}
          />
        </HStack>
      </VStack>
    </Card>
  );
}

export function AIReviewView({
  report,
  settings,
  review,
  onStart,
  onClear,
  onOpenSettings,
  onOpenFile,
}) {
  const t = useT();
  const [count, setCount] = useState(5);
  // Finished reviews start collapsed so a long run stays scannable.
  const [expanded, setExpanded] = useState(() => new Set());
  const toggleExpanded = (filePath) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) next.delete(filePath);
      else next.add(filePath);
      return next;
    });

  const fileByPath = useMemo(
    () => new Map((report?.fileResults ?? []).map((file) => [file.filePath, file])),
    [report]
  );

  const worstPaths = useMemo(
    () =>
      [...(report?.fileResults ?? [])]
        .sort((a, b) => a.score - b.score)
        .slice(0, count)
        .map((file) => file.filePath),
    [report, count]
  );

  if (!report) {
    return (
      <Center height="100%">
        <EmptyState
          title={t('ai_need_analysis')}
          description={t('ai_need_analysis_desc')}
          icon={<Icon icon={OverviewIcon} size="lg" color="secondary" />}
        />
      </Center>
    );
  }

  // Before a run, the queue previews the files that would be sent.
  const hasRun = review.items.length > 0;
  const items = hasRun
    ? review.items
    : worstPaths.map((filePath) => ({ filePath, status: 'idle' }));
  const finished = review.items.filter((i) => i.status === 'done' || i.status === 'error').length;
  const hasResults = review.items.some((item) => item.status === 'done');
  const finishedPaths = review.items
    .filter((item) => item.status === 'done' || item.status === 'error')
    .map((item) => item.filePath);
  const allExpanded = finishedPaths.length > 0 && finishedPaths.every((p) => expanded.has(p));

  return (
    <Layout
      height="fill"
      contentWidth={1200}
      header={
        <LayoutHeader padding={6} hasDivider>
          <HStack gap={3} vAlign="center" wrap="wrap">
            <StackItem size="fill">
              <VStack gap={1}>
                <Heading level={1}>{t('ai_title')}</Heading>
                <Text type="supporting" color="secondary">
                  {t('ai_subtitle')}
                </Text>
              </VStack>
            </StackItem>
            <ExportMenu
              label={t('ai_export')}
              formats={['markdown', 'html']}
              isDisabled={!hasResults || review.running}
              onExport={(format) => window.fuc.exportReviews(format, report.projectName)}
            />
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <div className="ai-layout">
            <VStack gap={3}>
              <Card padding={5}>
                <VStack gap={4}>
                  <HStack gap={3} vAlign="center" wrap="wrap">
                    <StackItem size="fill">
                      <VStack gap={1}>
                        <Heading level={3}>
                          {hasRun ? t('ai_results_title') : t('ai_queue_title')}
                        </Heading>
                        <Text type="supporting" color="secondary">
                          {hasRun
                            ? t('files_count', { count: review.items.length })
                            : t('ai_count_desc')}
                        </Text>
                      </VStack>
                    </StackItem>
                    {!hasRun && (
                      <NumberInput
                        label={t('ai_count')}
                        isLabelHidden
                        value={count}
                        min={1}
                        max={Math.min(MAX_FILES, report.fileResults.length)}
                        onChange={(value) => setCount(value ?? 1)}
                        width={88}
                      />
                    )}
                    {finishedPaths.length > 0 && (
                      <Button
                        label={allExpanded ? t('ai_collapse_all') : t('ai_expand_all')}
                        variant="ghost"
                        icon={<Icon icon={ExpandIcon} size="sm" />}
                        onClick={() => setExpanded(new Set(allExpanded ? [] : finishedPaths))}
                      />
                    )}
                    {hasRun && !review.running && (
                      <Button
                        label={t('ai_clear')}
                        variant="ghost"
                        icon={<Icon icon={ClearIcon} size="sm" />}
                        onClick={onClear}
                      />
                    )}
                    <Button
                      label={t('ai_start')}
                      variant="primary"
                      icon={<Icon icon={AIActionIcon} size="sm" />}
                      isLoading={review.running}
                      isDisabled={review.running || items.length === 0}
                      onClick={() => onStart(items.map((item) => item.filePath))}
                    />
                  </HStack>
                  {review.running && (
                    <ProgressBar
                      label={t('ai_progress', {
                        current: Math.min(finished + 1, review.items.length),
                        total: review.items.length,
                      })}
                      value={finished}
                      max={review.items.length}
                      variant="accent"
                    />
                  )}
                </VStack>
              </Card>

              {review.error && (
                <Banner status="error" title={t('aiReviewFailed')} description={review.error} />
              )}

              {items.map((item, index) => (
                <QueueItem
                  key={item.filePath}
                  item={item}
                  index={index}
                  file={fileByPath.get(item.filePath)}
                  isExpanded={expanded.has(item.filePath)}
                  onToggle={toggleExpanded}
                  onOpenFile={onOpenFile}
                />
              ))}
            </VStack>

            <VStack gap={3}>
              <ModelCard ai={settings.ai} onOpenSettings={onOpenSettings} />

              <Card padding={5}>
                <VStack gap={3}>
                  <Heading level={4}>{t('ai_expect_title')}</Heading>
                  <ul className="check-list">
                    {[1, 2, 3, 4].map((n) => (
                      <li key={n}>
                        <Icon icon={CheckIcon} size="sm" color="success" />
                        <Text>{t(`ai_review_request_${n}`)}</Text>
                      </li>
                    ))}
                  </ul>
                </VStack>
              </Card>

              <Card padding={5}>
                <VStack gap={2}>
                  <HStack gap={2} vAlign="center">
                    <Icon icon={PrivacyIcon} size="sm" color="secondary" />
                    <Heading level={4}>{t('ai_privacy_title')}</Heading>
                  </HStack>
                  <Text type="supporting" color="secondary">
                    {t('ai_privacy_desc')}
                  </Text>
                </VStack>
              </Card>
            </VStack>
          </div>
        </LayoutContent>
      }
    />
  );
}
