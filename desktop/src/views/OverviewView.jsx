import { useMemo } from 'react';
import { Layout, LayoutContent, LayoutHeader } from '@astryxdesign/core/Layout';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Stack';
import { Grid } from '@astryxdesign/core/Grid';
import { Card } from '@astryxdesign/core/Card';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { Divider } from '@astryxdesign/core/Divider';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { useT } from '../i18n.js';
import {
  TONE_PROGRESS,
  countIssues,
  fmt,
  fmtDuration,
  fmtInt,
  languageName,
  metricComment,
  qualityLevel,
  scoreComment,
  toMess,
  tone,
} from '../score.js';
import { ScoreGauge } from '../components/ScoreGauge.jsx';
import { LevelScale } from '../components/LevelScale.jsx';
import { ExportMenu } from '../components/ExportMenu.jsx';
import {
  FilePath,
  MessBadge,
  RelativeTime,
  SectionHeading,
  StatTile,
} from '../components/common.jsx';
import { NextIcon, RefreshIcon } from '../icons.jsx';
import { LevelEmoji } from '../components/Emoji.jsx';

const PREVIEW_ROWS = 8;
const CATEGORY_ORDER = [
  'complexity',
  'duplication',
  'size',
  'structure',
  'error',
  'documentation',
  'naming',
];

export function OverviewView({ report, onReanalyze, onNavigate, onOpenFile }) {
  const t = useT();
  const mess = toMess(report.overallScore);
  const level = qualityLevel(mess);

  const functionCount = useMemo(
    () => report.fileResults.reduce((sum, file) => sum + file.parseResult.functions.length, 0),
    [report]
  );

  const metrics = useMemo(
    () => [...report.aggregatedMetrics].sort((a, b) => a.average - b.average),
    [report]
  );

  const categories = useMemo(() => {
    const groups = new Map();
    for (const metric of report.aggregatedMetrics) {
      const group = groups.get(metric.category) ?? [];
      group.push(metric.average);
      groups.set(metric.category, group);
    }
    return CATEGORY_ORDER.filter((c) => groups.has(c)).map((category) => {
      const values = groups.get(category);
      return { category, mess: toMess(values.reduce((a, b) => a + b, 0) / values.length) };
    });
  }, [report]);

  const worstFiles = useMemo(
    () => [...report.fileResults].sort((a, b) => a.score - b.score).slice(0, PREVIEW_ROWS),
    [report]
  );

  const languageTotal = report.stats.languageCounts.reduce((sum, [, count]) => sum + count, 0);

  return (
    <Layout
      height="fill"
      contentWidth={1280}
      header={
        <LayoutHeader padding={6} hasDivider>
          <HStack gap={3} vAlign="center" wrap="wrap">
            <StackItem size="fill">
              <VStack gap={1}>
                <Heading level={1}>{report.projectName}</Heading>
                <HStack gap={2} vAlign="center" wrap="wrap">
                  <Text type="supporting" color="secondary" maxLines={1}>
                    {report.projectPath}
                  </Text>
                  <Text type="supporting" color="secondary">
                    ·
                  </Text>
                  <Text type="supporting" color="secondary">
                    {t('recent_analyzed')}
                  </Text>
                  <RelativeTime value={report.analyzedAt} />
                </HStack>
              </VStack>
            </StackItem>
            <Button
              label={t('report_reanalyze')}
              variant="secondary"
              icon={<Icon icon={RefreshIcon} size="sm" />}
              onClick={onReanalyze}
            />
            <ExportMenu
              label={t('report_export')}
              formats={['html', 'markdown', 'json']}
              onExport={(format) => window.fuc.exportReport(format, report.projectName)}
            />
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <VStack gap={8}>
            <Card padding={6}>
              <div className="hero-score">
                <ScoreGauge mess={mess} label={t('score_label')} hint={t('score_hint')} />
                <VStack gap={6}>
                  <HStack gap={4} vAlign="center">
                    <span className={`level-emoji tone-${tone(mess)}`}>
                      <LevelEmoji level={level} size={40} />
                    </span>
                    <VStack gap={1}>
                      <Text type="supporting" color="secondary">
                        {t('quality_level')}
                      </Text>
                      <Heading level={2}>{t(level.key)}</Heading>
                      <Text color="secondary">{t(`${level.key}_desc`)}</Text>
                    </VStack>
                  </HStack>
                  <LevelScale mess={mess} />
                  <p className="hero-quip">{scoreComment(t, mess)}</p>
                </VStack>
              </div>
            </Card>

            <Grid columns={{ minWidth: 170, repeat: 'fit' }} gap={3}>
              <StatTile
                label={t('stat_files')}
                value={fmtInt(report.analyzedFiles)}
                detail={`${t('stat_skipped')} ${fmtInt(report.skippedFiles)}`}
              />
              <StatTile label={t('stat_code_lines')} value={fmtInt(report.stats.totalCodeLines)} />
              <StatTile label={t('stat_comment_ratio')} value={`${report.stats.commentRatio}%`} />
              <StatTile label={t('stat_functions')} value={fmtInt(functionCount)} />
              <StatTile label={t('stat_time')} value={fmtDuration(report.analysisTime)} />
            </Grid>

            <div className="overview-split">
              <Card padding={6}>
                <VStack gap={5}>
                  <SectionHeading title={t('section_metrics')} />
                  {metrics.map((metric) => {
                    const metricMess = toMess(metric.average);
                    return (
                      <VStack gap={1.5} key={metric.name}>
                        <HStack hAlign="between" vAlign="center" gap={3}>
                          <Text weight="medium">{t(`metric_${metric.name}`)}</Text>
                          <span className={`metric-value tone-${tone(metricMess)}`}>
                            {fmt(metricMess)}
                          </span>
                        </HStack>
                        <ProgressBar
                          label={t(`metric_${metric.name}`)}
                          isLabelHidden
                          value={metricMess}
                          max={100}
                          variant={TONE_PROGRESS[tone(metricMess)]}
                        />
                        <HStack hAlign="between" gap={3} wrap="wrap">
                          <Text type="supporting" color="secondary">
                            {metricComment(t, metric.name, metricMess)}
                          </Text>
                          <Text type="supporting" color="secondary">
                            {t('metric_range', {
                              min: fmt(toMess(metric.max), 0),
                              median: fmt(toMess(metric.median), 0),
                              max: fmt(toMess(metric.min), 0),
                            })}
                          </Text>
                        </HStack>
                      </VStack>
                    );
                  })}
                </VStack>
              </Card>

              <VStack gap={4}>
                <Card padding={6}>
                  <VStack gap={4}>
                    <SectionHeading title={t('section_categories')} />
                    {categories.map(({ category, mess: categoryMess }) => (
                      <div className="bar-row" key={category}>
                        <Text>{t(category)}</Text>
                        <div className="bar-track">
                          <div
                            className={`bar-fill tone-${tone(categoryMess)}`}
                            style={{ width: `${Math.max(2, categoryMess)}%` }}
                          />
                        </div>
                        <span className={`metric-value tone-${tone(categoryMess)}`}>
                          {fmt(categoryMess, 0)}
                        </span>
                      </div>
                    ))}
                  </VStack>
                </Card>
                <Card padding={6}>
                  <VStack gap={4}>
                    <SectionHeading title={t('section_languages')} />
                    {report.stats.languageCounts.map(([language, count], index) => (
                      <div className="bar-row" key={language}>
                        <Text>{languageName(language)}</Text>
                        <div className="bar-track">
                          <div
                            className={`bar-fill lang-${index % 6}`}
                            style={{ width: `${(count / languageTotal) * 100}%` }}
                          />
                        </div>
                        <Text type="supporting" color="secondary" hasTabularNumbers>
                          {count}
                        </Text>
                      </div>
                    ))}
                  </VStack>
                </Card>
              </VStack>
            </div>

            <div className="overview-split">
              <Card padding={6}>
                <VStack gap={3}>
                  <SectionHeading
                    title={t('section_worst_files')}
                    end={
                      <Button
                        label={t('view_all')}
                        variant="ghost"
                        size="sm"
                        endContent={<Icon icon={NextIcon} size="sm" />}
                        onClick={() => onNavigate('files')}
                      />
                    }
                  />
                  <ol className="rank-list">
                    {worstFiles.map((file, index) => (
                      <li key={file.filePath}>
                        {index > 0 && <Divider />}
                        <button
                          type="button"
                          className="rank-row"
                          onClick={() => onOpenFile(file.filePath)}
                        >
                          <span className="rank-index">{index + 1}</span>
                          <FilePath path={file.filePath} />
                          <Text type="supporting" color="secondary" hasTabularNumbers>
                            {t('unit_issues', { count: countIssues(file) })}
                          </Text>
                          <MessBadge mess={toMess(file.score)} />
                        </button>
                      </li>
                    ))}
                  </ol>
                </VStack>
              </Card>

              <Card padding={6}>
                <VStack gap={3}>
                  <SectionHeading
                    title={t('section_worst_functions')}
                    end={
                      <Button
                        label={t('view_all')}
                        variant="ghost"
                        size="sm"
                        endContent={<Icon icon={NextIcon} size="sm" />}
                        onClick={() => onNavigate('functions')}
                      />
                    }
                  />
                  <ol className="rank-list">
                    {report.worstFunctions.slice(0, PREVIEW_ROWS).map((fn, index) => (
                      <li key={`${fn.filePath}:${fn.name}:${index}`}>
                        {index > 0 && <Divider />}
                        <button
                          type="button"
                          className="rank-row"
                          onClick={() => onOpenFile(fn.filePath)}
                        >
                          <span className="rank-index">{index + 1}</span>
                          <span className="file-path" title={fn.filePath}>
                            <span className="file-path-name code">{fn.name}</span>
                            <span className="file-path-dir">{fn.filePath}</span>
                          </span>
                          <Text type="supporting" color="secondary" hasTabularNumbers>
                            {t('unit_lines', { count: fn.lineCount })}
                          </Text>
                          <span className="complexity-pill">{fn.complexity}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </VStack>
              </Card>
            </div>
          </VStack>
        </LayoutContent>
      }
    />
  );
}
