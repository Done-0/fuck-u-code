/**
 * Markdown output formatter with playful style
 */

import type { ProjectAnalysisResult, MetricResult } from '../../metrics/types.js';
import type { RuntimeConfig } from '../../config/schema.js';
import { t } from '../../i18n/index.js';
import { LANGUAGE_DISPLAY_NAMES, type Language } from '../../parser/types.js';
import { aggregateProjectStats, collectWorstFunctions } from './stats.js';

interface QualityLevel {
  minScore: number;
  nameKey: string;
  descKey: string;
  emoji: string;
}

const QUALITY_LEVELS: QualityLevel[] = [
  { minScore: 0, nameKey: 'level_clean', descKey: 'level_clean_desc', emoji: '🌱' },
  { minScore: 5, nameKey: 'level_mild', descKey: 'level_mild_desc', emoji: '🌸' },
  { minScore: 15, nameKey: 'level_moderate', descKey: 'level_moderate_desc', emoji: '😐' },
  { minScore: 25, nameKey: 'level_bad', descKey: 'level_bad_desc', emoji: '😷' },
  { minScore: 40, nameKey: 'level_terrible', descKey: 'level_terrible_desc', emoji: '💩' },
  { minScore: 55, nameKey: 'level_disaster', descKey: 'level_disaster_desc', emoji: '🤕' },
  { minScore: 65, nameKey: 'level_severe', descKey: 'level_severe_desc', emoji: '☣️' },
  { minScore: 75, nameKey: 'level_very_bad', descKey: 'level_very_bad_desc', emoji: '🧟' },
  { minScore: 85, nameKey: 'level_extreme', descKey: 'level_extreme_desc', emoji: '☢️' },
  { minScore: 95, nameKey: 'level_worst', descKey: 'level_worst_desc', emoji: '🪦' },
  { minScore: 100, nameKey: 'level_ultimate', descKey: 'level_ultimate_desc', emoji: '👑💩' },
];

export class MarkdownOutput {
  private config: RuntimeConfig;

  constructor(config: RuntimeConfig) {
    this.config = config;
  }

  render(result: ProjectAnalysisResult): string {
    const lines: string[] = [];
    const invertedScore = 100 - result.overallScore;
    const level = this.getQualityLevel(invertedScore);
    const scoreComment = this.getScoreComment(invertedScore);

    lines.push(`# 🌸 ${t('report_title')} 🌸`);
    lines.push('');

    // Table of contents
    lines.push(`## 📑 ${t('output_table_of_contents')}`);
    lines.push('');
    lines.push(`- [${t('overallScore')}](#overall-score)`);
    lines.push(`- [${t('report_metrics_details')}](#metrics-details)`);
    lines.push(`- [${t('report_worst_files')}](#problem-files)`);
    lines.push(`- [${t('report_conclusion')}](#conclusion)`);
    lines.push('');

    // Score badge
    const badgeColor = this.getScoreBadgeColor(result.overallScore);
    lines.push(
      `![Score](https://img.shields.io/badge/Score-${result.overallScore.toFixed(0)}%25-${badgeColor})`
    );
    lines.push('');

    lines.push(`## ${t('overallScore')} {#overall-score}`);
    lines.push('');
    lines.push(`| ${t('metricsSummary')} | ${t('score')} |`);
    lines.push('|------|-------|');
    lines.push(`| **${t('overallScore')}** | **${result.overallScore.toFixed(2)}/100** |`);
    lines.push(
      `| ${t('report_level', { level: '' }).split(':')[0]} | ${level.emoji} ${t(level.nameKey)} |`
    );
    lines.push('');
    lines.push(`> ${scoreComment}`);
    lines.push('');

    lines.push(`### 📊 ${t('output_statistics')}`);
    lines.push('');
    lines.push(`| ${t('output_metric')} | ${t('output_value')} |`);
    lines.push('|--------|-------|');
    lines.push(`| ${t('verbose_total_files')} | ${result.analyzedFiles} |`);
    lines.push(`| ${t('output_skipped')} | ${result.skippedFiles} |`);
    lines.push(`| ${t('output_time')} | ${result.analysisTime}ms |`);
    lines.push('');

    // Verbose: project overview
    if (this.config.verbose) {
      lines.push(`### 📋 ${t('verbose_project_overview')}`);
      lines.push('');

      const stats = aggregateProjectStats(result);

      lines.push(`| ${t('output_metric')} | ${t('output_value')} |`);
      lines.push('|--------|-------|');
      lines.push(`| ${t('verbose_total_code_lines')} | ${stats.totalCodeLines} |`);
      lines.push(`| ${t('verbose_total_comment_lines')} | ${stats.totalCommentLines} |`);
      lines.push(`| ${t('verbose_overall_comment_ratio')} | ${stats.commentRatio}% |`);
      lines.push(
        `| ${t('verbose_avg_file_size')} | ${t('verbose_lines', { count: stats.avgFileSize })} |`
      );
      if (stats.largestFile) {
        lines.push(
          `| ${t('verbose_largest_file')} | \`${stats.largestFile}\` (${stats.largestFileLines}) |`
        );
      }
      lines.push('');

      if (stats.languageCounts.length > 0) {
        lines.push(`#### ${t('verbose_language_distribution')}`);
        lines.push('');
        lines.push(`| ${t('verbose_language')} | ${t('verbose_file_count')} |`);
        lines.push('|:-----|------:|');
        for (const [lang, count] of stats.languageCounts) {
          const displayName = LANGUAGE_DISPLAY_NAMES[lang as Exclude<Language, 'unknown'>] || lang;
          lines.push(`| ${displayName} | ${count} |`);
        }
        lines.push('');
      }
    }

    lines.push(`## ${t('report_metrics_details')} {#metrics-details}`);
    lines.push('');
    if (this.config.verbose) {
      lines.push(
        `| ${t('metricsSummary')} | ${t('score')} | Min | Max | Median | ${t('output_status')} |`
      );
      lines.push('|:-----|------:|------:|------:|------:|:------:|');

      for (const metric of result.aggregatedMetrics) {
        const metricInverted = 100 - metric.average;
        const statusEmoji = this.getStatusEmoji(metricInverted);
        const metricName = t(`metric_${metric.name}`) || metric.name;
        const min = (100 - metric.max).toFixed(1);
        const max = (100 - metric.min).toFixed(1);
        const median = (100 - metric.median).toFixed(1);
        lines.push(
          `| ${metricName} | ${metricInverted.toFixed(2)}% | ${min}% | ${max}% | ${median}% | ${statusEmoji} |`
        );
      }
    } else {
      lines.push(`| ${t('metricsSummary')} | ${t('score')} | ${t('output_status')} |`);
      lines.push('|:-----|------:|:------:|');

      for (const metric of result.aggregatedMetrics) {
        const metricInverted = 100 - metric.average;
        const statusEmoji = this.getStatusEmoji(metricInverted);
        const metricName = t(`metric_${metric.name}`) || metric.name;
        lines.push(`| ${metricName} | ${metricInverted.toFixed(2)}% | ${statusEmoji} |`);
      }
    }
    lines.push('');

    lines.push(`## ${t('report_worst_files')} {#problem-files}`);
    lines.push('');

    const top = this.config.output.top;
    const maxIssues = this.config.verbose ? Infinity : this.config.output.maxIssues;
    const worst = [...result.fileResults].sort((a, b) => a.score - b.score).slice(0, top);

    if (worst.length === 0) {
      lines.push(`🎉 ${t('report_no_issues')}`);
    } else {
      for (const [i, file] of worst.entries()) {
        const fileInverted = 100 - file.score;

        lines.push(`### ${i + 1}. ${file.filePath}`);
        lines.push('');
        lines.push(`**${t('report_file_score', { score: fileInverted.toFixed(2) })}**`);
        lines.push('');

        // Verbose: parse statistics
        if (this.config.verbose) {
          const pr = file.parseResult;
          lines.push(
            `> ${t('verbose_file_stats', {
              total: pr.totalLines,
              code: pr.codeLines,
              comment: pr.commentLines,
              functions: pr.functions.length,
              classes: pr.classes.length,
            })}`
          );
          lines.push('');
        }

        const issueCategories = this.categorizeIssues(file.metrics);
        const categoryParts: string[] = [];
        const categoryIcons: Record<string, string> = {
          complexity: '🔄',
          comment: '📝',
          naming: '🏷️',
          structure: '🏗️',
          duplication: '📋',
          error: '❌',
          other: '⚠️',
        };

        for (const [category, count] of Object.entries(issueCategories)) {
          if (count > 0) {
            const icon = categoryIcons[category] ?? '⚠️';
            categoryParts.push(`${icon} ${t(`issue_category_${category}`)}: ${count}`);
          }
        }

        if (categoryParts.length > 0) {
          lines.push(`**${t('output_issues')}**: ${categoryParts.join(', ')}`);
          lines.push('');
        }

        // Verbose: function detail table
        if (this.config.verbose && file.parseResult.functions.length > 0) {
          lines.push(`#### ${t('verbose_function_details')}`);
          lines.push('');
          lines.push(
            `| ${t('verbose_col_function')} | ${t('verbose_col_range')} | ${t('verbose_col_line_count')} | ${t('verbose_col_complexity')} | ${t('verbose_col_nesting')} | ${t('verbose_col_params')} | ${t('verbose_col_docstring')} |`
          );
          lines.push('|:-----|------:|------:|------:|------:|------:|:------:|');

          const sortedFuncs = [...file.parseResult.functions].sort(
            (a, b) => b.complexity - a.complexity
          );

          for (const fn of sortedFuncs) {
            const docStr = fn.hasDocstring ? '✓' : '✗';
            lines.push(
              `| \`${fn.name}\` | L${fn.startLine}-${fn.endLine} | ${fn.lineCount} | ${fn.complexity} | ${fn.nestingDepth} | ${fn.parameterCount} | ${docStr} |`
            );
          }
          lines.push('');
        }

        // Issues
        const allIssues = file.metrics
          .filter((m) => m.severity !== 'info')
          .flatMap((m) => (m.locations || []).map((loc) => ({ ...loc, category: m.category })));

        const issues = allIssues.slice(0, maxIssues);

        if (issues.length > 0) {
          if (this.config.verbose) {
            lines.push(`**${t('verbose_all_issues', { count: allIssues.length })}**`);
            lines.push('');
          }
          for (const issue of issues) {
            const icon = this.getIssueIcon(issue.category);
            const funcInfo = issue.functionName ? `\`${issue.functionName}()\` ` : '';
            const lineInfo = issue.line ? `L${issue.line}: ` : '';
            lines.push(`- ${icon} ${funcInfo}${lineInfo}${issue.message || ''}`);
          }

          if (!this.config.verbose && allIssues.length > maxIssues) {
            lines.push(`- 🔍 ${t('report_more_issues', { count: allIssues.length - maxIssues })}`);
          }
        } else {
          lines.push(`✓ ${t('verbose_file_good_quality')}`);
        }

        // Verbose: metric details
        if (this.config.verbose) {
          const detailMetrics = file.metrics.filter((m) => m.details);
          if (detailMetrics.length > 0) {
            lines.push('');
            lines.push(`**${t('verbose_metric_details')}**:`);
            for (const m of detailMetrics) {
              const metricName = t(`metric_${m.name}`) || m.name;
              lines.push(`- ${metricName}: ${m.details}`);
            }
          }
        }

        lines.push('');
      }
    }

    // Verbose: top 10 worst functions across all files
    if (this.config.verbose) {
      const top10 = collectWorstFunctions(result, 10);

      if (top10.length > 0) {
        lines.push(`## ${t('verbose_top_worst_functions')}`);
        lines.push('');
        lines.push(
          `| ${t('verbose_col_function')} | ${t('verbose_col_file')} | ${t('verbose_col_complexity')} | ${t('verbose_col_nesting')} | ${t('verbose_col_line_count')} |`
        );
        lines.push('|:-----|:-----|------:|------:|------:|');

        for (const fn of top10) {
          lines.push(
            `| \`${fn.name}\` | ${fn.filePath} | ${fn.complexity} | ${fn.nestingDepth} | ${fn.lineCount} |`
          );
        }
        lines.push('');
      }
    }

    lines.push(`## ${t('report_conclusion')} {#conclusion}`);
    lines.push('');
    lines.push(`🌸 **${t(level.nameKey)}** - ${t(level.descKey)}`);
    lines.push('');

    if (level.minScore < 30) {
      lines.push(`👍 ${t('advice_good')}`);
    } else if (level.minScore < 60) {
      lines.push(`🔧 ${t('advice_moderate')}`);
    } else {
      lines.push(`🧨 ${t('advice_bad')}`);
    }
    lines.push('');

    lines.push('---');
    lines.push('');
    lines.push(
      `*${t('output_generated_by', { tool: '[fuck-u-code](https://github.com/Done-0/fuck-u-code)' })}*`
    );

    return lines.join('\n');
  }

  private getScoreBadgeColor(score: number): string {
    if (score >= 80) return 'brightgreen';
    if (score >= 60) return 'green';
    if (score >= 40) return 'yellow';
    if (score >= 20) return 'orange';
    return 'red';
  }

  private getQualityLevel(invertedScore: number): QualityLevel {
    for (let i = QUALITY_LEVELS.length - 1; i >= 0; i--) {
      const level = QUALITY_LEVELS[i];
      if (level && invertedScore >= level.minScore) {
        return level;
      }
    }
    const fallback = QUALITY_LEVELS[0];
    if (!fallback) {
      return { minScore: 0, nameKey: 'level_clean', descKey: 'level_clean_desc', emoji: '🌱' };
    }
    return fallback;
  }

  private getScoreComment(invertedScore: number): string {
    const range = Math.min(Math.floor(invertedScore / 10) * 10, 90);
    return t(`score_comment_${range}`);
  }

  private getStatusEmoji(invertedScore: number): string {
    if (invertedScore < 20) return '✓✓';
    if (invertedScore < 35) return '✓';
    if (invertedScore < 50) return '○';
    if (invertedScore < 60) return '•';
    if (invertedScore < 70) return '⚠';
    if (invertedScore < 80) return '!';
    if (invertedScore < 90) return '!!';
    return '✗';
  }

  private categorizeIssues(metrics: MetricResult[]): Record<string, number> {
    const categoryMap: Record<string, string> = {
      complexity: 'complexity',
      documentation: 'comment',
      naming: 'naming',
      structure: 'structure',
      duplication: 'duplication',
      error: 'error',
      size: 'other',
    };

    const categories: Record<string, number> = {};

    for (const metric of metrics) {
      if (metric.severity === 'info') continue;
      const category = categoryMap[metric.category] || 'other';
      categories[category] = (categories[category] || 0) + (metric.locations?.length || 1);
    }

    return categories;
  }

  private getIssueIcon(category: string): string {
    const icons: Record<string, string> = {
      complexity: '🔄',
      documentation: '📝',
      naming: '🏷️',
      structure: '🏗️',
      duplication: '📋',
      error: '❌',
      size: '📏',
    };
    return icons[category] || '⚠️';
  }
}
