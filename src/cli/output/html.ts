/**
 * HTML output formatter with styled report
 */

import type {
  ProjectAnalysisResult,
  FileAnalysisResult,
  MetricResult,
} from '../../metrics/types.js';
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

export class HtmlOutput {
  private config: RuntimeConfig;

  constructor(config: RuntimeConfig) {
    this.config = config;
  }

  render(result: ProjectAnalysisResult): string {
    const invertedScore = 100 - result.overallScore;
    const level = this.getQualityLevel(invertedScore);
    const scoreColor = this.getScoreColor(result.overallScore);
    const verbose = this.config.verbose;

    return `<!DOCTYPE html>
<html lang="${t('html_lang')}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🌸 ${t('report_title')} 🌸</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; line-height: 1.6; padding: 2rem; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { text-align: center; font-size: 1.8rem; margin-bottom: 2rem; color: #f0c674; }
    h2 { color: #bd93f9; margin: 1.5rem 0 1rem; font-size: 1.3rem; border-bottom: 1px solid #21262d; padding-bottom: 0.5rem; }
    h3 { color: #ff79c6; margin: 1rem 0 0.5rem; font-size: 1.1rem; }
    .score-card { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 2rem; }
    .score-value { font-size: 3rem; font-weight: bold; color: ${scoreColor}; }
    .score-label { font-size: 1.1rem; color: #8b949e; margin-top: 0.5rem; }
    .level { font-size: 1.2rem; margin-top: 1rem; }
    .stats { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .stat-card { flex: 1; min-width: 120px; background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1rem; text-align: center; }
    .stat-value { font-size: 1.5rem; font-weight: bold; color: #58a6ff; }
    .stat-label { font-size: 0.85rem; color: #8b949e; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th { background: #161b22; color: #bd93f9; text-align: left; padding: 0.75rem; border-bottom: 2px solid #30363d; }
    td { padding: 0.75rem; border-bottom: 1px solid #21262d; }
    tr:hover { background: #161b22; }
    .file-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; }
    .file-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .file-name { color: #d2a8ff; font-weight: 600; }
    .file-score { font-weight: bold; padding: 0.25rem 0.75rem; border-radius: 4px; }
    .issue-list { list-style: none; padding: 0; }
    .issue-list li { padding: 0.25rem 0; color: #8b949e; font-size: 0.9rem; }
    .categories { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
    .category-tag { font-size: 0.8rem; padding: 0.15rem 0.5rem; border-radius: 4px; background: #21262d; }
    .func-table { font-size: 0.9rem; margin-top: 0.5rem; }
    .func-table td { padding: 0.4rem 0.6rem; }
    .metric-scores { display: flex; gap: 0.5rem; flex-wrap: wrap; margin: 0.5rem 0; }
    .metric-score { font-size: 0.8rem; padding: 0.15rem 0.5rem; border-radius: 4px; background: #21262d; }
    .footer { text-align: center; margin-top: 2rem; color: #484f58; font-size: 0.85rem; border-top: 1px solid #21262d; padding-top: 1rem; }
    .good { color: #3fb950; } .warn { color: #d29922; } .bad { color: #f85149; }
    .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .overview-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1rem; }
    .overview-card h3 { color: #bd93f9; font-size: 1rem; margin-bottom: 0.75rem; }
    .overview-item { display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.9rem; }
    .overview-item .label { color: #8b949e; }
    .overview-item .value { color: #58a6ff; font-weight: 500; }
    .lang-bar { display: flex; align-items: center; gap: 0.5rem; padding: 0.2rem 0; font-size: 0.85rem; }
    .lang-bar .bar { background: #58a6ff; height: 8px; border-radius: 4px; min-width: 4px; }
    .lang-bar .name { color: #c9d1d9; min-width: 80px; }
    .lang-bar .count { color: #8b949e; }
    .fn-table { font-size: 0.85rem; }
    .fn-table td, .fn-table th { padding: 0.5rem; }
    .metric-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; margin: 0.5rem 0; }
    .metric-tag { font-size: 0.75rem; padding: 0.1rem 0.4rem; border-radius: 3px; background: #21262d; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌸 ${t('report_title')} 🌸</h1>

    <div class="score-card">
      <div class="score-value">${result.overallScore.toFixed(1)}</div>
      <div class="score-label">${t('report_overall_score', { score: result.overallScore.toFixed(2) })}</div>
      <div class="level">${level.emoji} ${t(level.nameKey)} - ${t(level.descKey)}</div>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${result.analyzedFiles}</div>
        <div class="stat-label">${t('verbose_total_files')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${result.skippedFiles}</div>
        <div class="stat-label">${t('html_skipped')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${result.analysisTime}ms</div>
        <div class="stat-label">${t('html_time')}</div>
      </div>
    </div>

${verbose ? this.renderProjectOverview(result) : ''}
    <h2>📊 ${t('report_metrics_details')}</h2>
    <table>
      <thead>
        <tr><th>${t('metricsSummary')}</th><th>${t('score')}</th>${verbose ? '<th>Min</th><th>Max</th><th>Median</th>' : ''}<th>${t('html_status')}</th></tr>
      </thead>
      <tbody>
${this.renderMetricsRows(result)}
      </tbody>
    </table>

    <h2>📋 ${t('report_worst_files')}</h2>
${this.renderWorstFiles(result.fileResults)}

${verbose ? this.renderWorstFunctionsSection(result) : ''}
    <h2>🔍 ${t('report_conclusion')}</h2>
    <div class="score-card">
      <div class="level">${level.emoji} ${t(level.nameKey)}</div>
      <div class="score-label">${t(level.descKey)}</div>
    </div>

    <div class="footer">
      ${t('output_generated_by', { tool: '<a href="https://github.com/Done-0/fuck-u-code" style="color: #58a6ff;">fuck-u-code</a>' })}
    </div>
  </div>
</body>
</html>`;
  }

  private renderMetricsRows(result: ProjectAnalysisResult): string {
    const verbose = this.config.verbose;
    return result.aggregatedMetrics
      .map((metric) => {
        const inverted = 100 - metric.average;
        const status = this.getStatusEmoji(inverted);
        const metricName = t(`metric_${metric.name}`) || metric.name;
        const cssClass = inverted < 30 ? 'good' : inverted < 60 ? 'warn' : 'bad';
        const minMax = verbose
          ? `<td class="good">${(100 - metric.max).toFixed(1)}%</td><td class="bad">${(100 - metric.min).toFixed(1)}%</td><td class="warn">${(100 - metric.median).toFixed(1)}%</td>`
          : '';
        return `        <tr><td>${metricName}</td><td class="${cssClass}">${inverted.toFixed(1)}%</td>${minMax}<td>${status}</td></tr>`;
      })
      .join('\n');
  }

  private renderWorstFiles(fileResults: FileAnalysisResult[]): string {
    const top = this.config.output.top;
    const verbose = this.config.verbose;
    const maxIssues = verbose ? Infinity : this.config.output.maxIssues;
    const worst = [...fileResults].sort((a, b) => a.score - b.score).slice(0, top);

    if (worst.length === 0) {
      return `    <p class="good">🎉 ${t('report_no_issues')}</p>`;
    }

    return worst
      .map((file, i) => {
        const inverted = 100 - file.score;
        const cssClass = file.score >= 70 ? 'good' : file.score >= 40 ? 'warn' : 'bad';
        const categories = this.categorizeIssues(file.metrics);
        const categoryHtml = Object.entries(categories)
          .filter(([, count]) => count > 0)
          .map(
            ([cat, count]) =>
              `<span class="category-tag">${t(`issue_category_${cat}`)}: ${count}</span>`
          )
          .join('');

        // Per-file metric scores (verbose)
        let metricScoresHtml = '';
        if (verbose && file.metrics.length > 0) {
          const scores = file.metrics
            .map((m) => {
              const metricName = t(`metric_${m.name}`) || m.name;
              const cls =
                m.normalizedScore >= 70 ? 'good' : m.normalizedScore >= 40 ? 'warn' : 'bad';
              return `<span class="metric-score ${cls}">${metricName}: ${m.normalizedScore.toFixed(0)}</span>`;
            })
            .join('');
          metricScoresHtml = `<div class="metric-scores">${scores}</div>`;
        }

        // Function details table (verbose)
        let funcTableHtml = '';
        if (verbose && file.parseResult.functions.length > 0) {
          const sortedFuncs = [...file.parseResult.functions].sort(
            (a, b) => b.complexity - a.complexity
          );
          const rows = sortedFuncs
            .map((fn) => {
              const cxClass = fn.complexity > 15 ? 'bad' : fn.complexity > 10 ? 'warn' : 'good';
              const nestClass = fn.nestingDepth > 4 ? 'bad' : fn.nestingDepth > 3 ? 'warn' : 'good';
              return `<tr><td><code>${this.escapeHtml(fn.name)}</code></td><td>L${fn.startLine}-${fn.endLine}</td><td class="${cxClass}">${fn.complexity}</td><td class="${nestClass}">${fn.nestingDepth}</td><td>${fn.lineCount}</td><td>${fn.hasDocstring ? '✓' : '✗'}</td></tr>`;
            })
            .join('');
          funcTableHtml = `
      <h3>${t('verbose_function_details')}</h3>
      <table class="func-table">
        <thead><tr><th>${t('verbose_col_function')}</th><th>${t('verbose_col_range')}</th><th>${t('verbose_col_complexity')}</th><th>${t('verbose_col_nesting')}</th><th>${t('verbose_col_line_count')}</th><th>${t('verbose_col_docstring')}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
        }

        const allIssues = file.metrics
          .filter((m) => m.severity !== 'info')
          .flatMap((m) => m.locations || []);
        const issues = allIssues.slice(0, maxIssues);

        let issueHtml = '';
        if (issues.length > 0) {
          const issueItems = issues
            .map((issue) => {
              const funcInfo = issue.functionName
                ? `<code>${this.escapeHtml(issue.functionName)}()</code> `
                : '';
              const lineInfo = issue.line ? `L${issue.line}: ` : '';
              return `<li>${funcInfo}${lineInfo}${this.escapeHtml(issue.message || '')}</li>`;
            })
            .join('');
          const countLabel = verbose ? ` <small>(${allIssues.length})</small>` : '';
          issueHtml = `<ul class="issue-list">${countLabel}${issueItems}</ul>`;
        }

        return `    <div class="file-card">
      <div class="file-header">
        <span class="file-name">${i + 1}. ${this.escapeHtml(file.filePath)}</span>
        <span class="file-score ${cssClass}">${t('report_file_score', { score: inverted.toFixed(1) })}</span>
      </div>
      <div class="categories">${categoryHtml}</div>
      ${metricScoresHtml}
      ${issueHtml}
      ${funcTableHtml}
    </div>`;
      })
      .join('\n');
  }

  private renderProjectOverview(result: ProjectAnalysisResult): string {
    const stats = aggregateProjectStats(result);

    const langBarsHtml = stats.languageCounts
      .map(([lang, count]) => {
        const displayName = LANGUAGE_DISPLAY_NAMES[lang as Exclude<Language, 'unknown'>] || lang;
        const firstEntry = stats.languageCounts[0];
        const maxCount = firstEntry ? firstEntry[1] : 1;
        const barWidth = Math.max(4, Math.round((count / maxCount) * 100));
        return `<div class="lang-bar"><span class="name">${this.escapeHtml(displayName)}</span><span class="bar" style="width:${barWidth}px"></span><span class="count">${count}</span></div>`;
      })
      .join('');

    return `    <h2>📋 ${t('verbose_project_overview')}</h2>
    <div class="overview-grid">
      <div class="overview-card">
        <h3>${t('output_statistics')}</h3>
        <div class="overview-item"><span class="label">${t('verbose_total_code_lines')}</span><span class="value">${stats.totalCodeLines}</span></div>
        <div class="overview-item"><span class="label">${t('verbose_total_comment_lines')}</span><span class="value">${stats.totalCommentLines}</span></div>
        <div class="overview-item"><span class="label">${t('verbose_overall_comment_ratio')}</span><span class="value">${stats.commentRatio}%</span></div>
        <div class="overview-item"><span class="label">${t('verbose_avg_file_size')}</span><span class="value">${t('verbose_lines', { count: stats.avgFileSize })}</span></div>
        ${stats.largestFile ? `<div class="overview-item"><span class="label">${t('verbose_largest_file')}</span><span class="value">${this.escapeHtml(stats.largestFile)} (${stats.largestFileLines})</span></div>` : ''}
      </div>
      <div class="overview-card">
        <h3>${t('verbose_language_distribution')}</h3>
        ${langBarsHtml || '<span style="color:#8b949e">—</span>'}
      </div>
    </div>
`;
  }

  private renderWorstFunctionsSection(result: ProjectAnalysisResult): string {
    const top10 = collectWorstFunctions(result, 10);
    if (top10.length === 0) return '';

    const rows = top10
      .map((fn) => {
        const cxClass = fn.complexity > 15 ? 'bad' : fn.complexity > 10 ? 'warn' : 'good';
        const nestClass = fn.nestingDepth > 4 ? 'bad' : fn.nestingDepth > 3 ? 'warn' : 'good';
        return `<tr><td><code>${this.escapeHtml(fn.name)}</code></td><td>${this.escapeHtml(fn.filePath)}</td><td class="${cxClass}">${fn.complexity}</td><td class="${nestClass}">${fn.nestingDepth}</td><td>${fn.lineCount}</td></tr>`;
      })
      .join('');

    return `
    <h2>🔥 ${t('verbose_top_worst_functions')}</h2>
    <table>
      <thead><tr><th>${t('verbose_col_function')}</th><th>${t('verbose_col_file')}</th><th>${t('verbose_col_complexity')}</th><th>${t('verbose_col_nesting')}</th><th>${t('verbose_col_line_count')}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
`;
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

  private getQualityLevel(invertedScore: number): QualityLevel {
    for (let i = QUALITY_LEVELS.length - 1; i >= 0; i--) {
      const level = QUALITY_LEVELS[i];
      if (level && invertedScore >= level.minScore) return level;
    }
    const defaultLevel = QUALITY_LEVELS[0];
    return (
      defaultLevel ?? {
        minScore: 0,
        nameKey: 'level_clean',
        descKey: 'level_clean_desc',
        emoji: '🌱',
      }
    );
  }

  private getStatusEmoji(invertedScore: number): string {
    if (invertedScore < 20) return '✅';
    if (invertedScore < 40) return '✓';
    if (invertedScore < 60) return '⚠️';
    if (invertedScore < 80) return '❗';
    return '❌';
  }

  private getScoreColor(score: number): string {
    if (score >= 80) return '#3fb950';
    if (score >= 60) return '#58a6ff';
    if (score >= 40) return '#d29922';
    return '#f85149';
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
