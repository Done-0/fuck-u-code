import { useMemo } from 'react';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Stack';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';
import { Badge } from '@astryxdesign/core/Badge';
import { Divider } from '@astryxdesign/core/Divider';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { useToast } from '@astryxdesign/core/Toast';
import { useT } from '../i18n.js';
import { SEVERITY_BADGE, TONE_PROGRESS, fmt, languageName, toMess, tone } from '../score.js';
import { MessBadge, SectionHeading } from '../components/common.jsx';
import { AIActionIcon, CloseIcon, OpenExternalIcon, RevealIcon } from '../icons.jsx';

const MAX_ISSUES = 200;
const MAX_FUNCTIONS = 100;

export function FileDetail({ file, onClose, onReview, isReviewing }) {
  const t = useT();
  const showToast = useToast();
  const { parseResult } = file;
  const mess = toMess(file.score);

  const issues = useMemo(
    () =>
      file.metrics
        .flatMap((metric) =>
          (metric.locations ?? []).map((location) => ({
            ...location,
            metric: metric.name,
            severity: metric.severity,
          }))
        )
        .sort((a, b) => a.line - b.line),
    [file]
  );

  const functions = useMemo(
    () =>
      [...parseResult.functions]
        .sort((a, b) => b.complexity - a.complexity)
        .slice(0, MAX_FUNCTIONS),
    [parseResult]
  );

  const metrics = useMemo(
    () => [...file.metrics].sort((a, b) => a.normalizedScore - b.normalizedScore),
    [file]
  );

  const guard = (action) => async () => {
    try {
      await action();
    } catch (error) {
      showToast({ body: error.message, type: 'error' });
    }
  };

  return (
    <VStack gap={0} height="100%">
      <VStack gap={4} padding={5}>
        <HStack gap={2} vAlign="start">
          <StackItem size="fill">
            <VStack gap={1}>
              <Heading level={3}>{file.filePath.split(/[\\/]/).pop()}</Heading>
              <Text type="supporting" color="secondary" wordBreak="break-all">
                {file.filePath}
              </Text>
            </VStack>
          </StackItem>
          <IconButton
            label={t('file_close')}
            variant="ghost"
            size="sm"
            icon={<Icon icon={CloseIcon} size="sm" />}
            onClick={onClose}
          />
        </HStack>
        <HStack gap={2} vAlign="center" wrap="wrap">
          <MessBadge mess={mess} />
          <Badge variant="neutral" label={languageName(parseResult.language)} />
          <Text type="supporting" color="secondary">
            {t('file_lines_summary', {
              code: parseResult.codeLines,
              comment: parseResult.commentLines,
              blank: parseResult.blankLines,
            })}
          </Text>
        </HStack>
        <HStack gap={2} wrap="wrap">
          <Button
            label={t('file_open')}
            size="sm"
            variant="secondary"
            icon={<Icon icon={OpenExternalIcon} size="sm" />}
            onClick={guard(() => window.fuc.openFile(file.filePath))}
          />
          <Button
            label={t('file_reveal')}
            size="sm"
            variant="secondary"
            icon={<Icon icon={RevealIcon} size="sm" />}
            onClick={guard(() => window.fuc.showInFolder(file.filePath))}
          />
          <Button
            label={t('file_ai')}
            size="sm"
            variant="primary"
            isDisabled={isReviewing}
            icon={<Icon icon={AIActionIcon} size="sm" />}
            onClick={onReview}
          />
        </HStack>
      </VStack>
      <Divider />
      <VStack gap={6} padding={5} isScrollable>
        <VStack gap={4}>
          <SectionHeading title={t('file_metrics')} />
          {metrics.map((metric) => {
            const metricMess = toMess(metric.normalizedScore);
            return (
              <VStack gap={1} key={metric.name}>
                <HStack hAlign="between" gap={2}>
                  <Text weight="medium">{t(`metric_${metric.name}`)}</Text>
                  <span className={`metric-value tone-${tone(metricMess)}`}>
                    {fmt(metricMess, 0)}
                  </span>
                </HStack>
                <ProgressBar
                  label={t(`metric_${metric.name}`)}
                  isLabelHidden
                  value={metricMess}
                  max={100}
                  variant={TONE_PROGRESS[tone(metricMess)]}
                />
                {metric.details && (
                  <Text type="supporting" color="secondary">
                    {metric.details}
                  </Text>
                )}
              </VStack>
            );
          })}
        </VStack>

        <VStack gap={3}>
          <SectionHeading
            title={t('file_issues')}
            hint={issues.length ? String(issues.length) : undefined}
          />
          {issues.length === 0 ? (
            <Text color="secondary">{t('file_no_issues')}</Text>
          ) : (
            <ul className="issue-list">
              {issues.slice(0, MAX_ISSUES).map((issue, index) => (
                <li key={`${issue.metric}-${issue.line}-${index}`} className="issue-row">
                  <span className="issue-line">{t('file_line', { line: issue.line })}</span>
                  <VStack gap={0.5}>
                    <Text>{issue.message}</Text>
                    <HStack gap={2} vAlign="center" wrap="wrap">
                      <Badge
                        variant={SEVERITY_BADGE[issue.severity] ?? 'neutral'}
                        label={t(`severity_${issue.severity}`)}
                      />
                      <Text type="supporting" color="secondary">
                        {t(`metric_${issue.metric}`)}
                        {issue.functionName ? ` · ${issue.functionName}` : ''}
                      </Text>
                    </HStack>
                  </VStack>
                </li>
              ))}
            </ul>
          )}
        </VStack>

        {functions.length > 0 && (
          <VStack gap={3}>
            <SectionHeading
              title={t('file_functions')}
              hint={String(parseResult.functions.length)}
            />
            <table className="mini-table">
              <thead>
                <tr>
                  <th>{t('col_function')}</th>
                  <th className="num">{t('col_complexity')}</th>
                  <th className="num">{t('col_nesting')}</th>
                  <th className="num">{t('col_length')}</th>
                </tr>
              </thead>
              <tbody>
                {functions.map((fn, index) => (
                  <tr key={`${fn.name}-${fn.startLine}-${index}`}>
                    <td>
                      <span className="code">{fn.name}</span>
                      <span className="mini-sub">
                        {t('file_line', { line: fn.startLine })}–{fn.endLine}
                      </span>
                    </td>
                    <td className="num">
                      <span className="complexity-pill">{fn.complexity}</span>
                    </td>
                    <td className="num">{fn.nestingDepth}</td>
                    <td className="num">{fn.lineCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </VStack>
        )}
      </VStack>
    </VStack>
  );
}
