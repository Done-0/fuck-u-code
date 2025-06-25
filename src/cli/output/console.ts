/**
 * Console output formatter with colored terminal display and playful style
 */

import chalk, { type ChalkInstance } from 'chalk';
import type {
  ProjectAnalysisResult,
  FileAnalysisResult,
  MetricResult,
} from '../../metrics/types.js';
import type { RuntimeConfig } from '../../config/schema.js';
import { t } from '../../i18n/index.js';
import { LANGUAGE_DISPLAY_NAMES, type Language } from '../../parser/types.js';
import { aggregateProjectStats, collectWorstFunctions } from './stats.js';
import {
  getTerminalWidth,
  displayWidth,
  padEndByWidth,
  truncateByWidth,
} from '../../utils/terminal.js';

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

export class ConsoleOutput {
  private config: RuntimeConfig;

  constructor(config: RuntimeConfig) {
    this.config = config;
  }

  render(result: ProjectAnalysisResult): void {
    this.renderHeader();
    this.renderOverallScore(result.overallScore);
    this.renderQualityLevel(result.overallScore);
    this.renderSummary(result);
    if (this.config.verbose) {
      this.renderProjectOverview(result);
    }
    this.renderMetricsDetails(result);
    this.renderWorstFiles(result.fileResults);
    if (this.config.verbose) {
      this.renderWorstFunctions(result);
    }
    this.renderConclusion(result.overallScore);
    this.renderFooter(result);
  }

  private renderHeader(): void {
    this.printDivider();
    console.log(chalk.bold.yellow(`\n  🌸 ${t('report_title')} 🌸\n`));
    this.printDivider();
  }

  private renderOverallScore(score: number): void {
    const invertedScore = 100 - score;
    const comment = this.getScoreComment(invertedScore);
    const color = this.getScoreColor(score);

    console.log();
    console.log(
      chalk.bold.cyan(`  ${t('report_overall_score', { score: score.toFixed(2) })}`) +
        ' - ' +
        color(comment)
    );
  }

  private renderQualityLevel(score: number): void {
    const invertedScore = 100 - score;
    const level = this.getQualityLevel(invertedScore);

    console.log(
      chalk.cyan(`  ${t('report_level', { level: t(level.nameKey) })}`) +
        chalk.cyan(` - ${t(level.descKey)}`)
    );
    console.log();
  }

  private renderSummary(result: ProjectAnalysisResult): void {
    console.log(chalk.gray(`  ${t('filesAnalyzed', { count: result.analyzedFiles })}`));
    if (result.skippedFiles > 0) {
      console.log(chalk.gray(`  ${t('skippedFiles', { count: result.skippedFiles })}`));
    }
  }

  private renderProjectOverview(result: ProjectAnalysisResult): void {
    console.log();
    console.log(chalk.bold.magenta(`◆ ${t('verbose_project_overview')}`));
    console.log();

    const stats = aggregateProjectStats(result);

    const labels = [
      t('verbose_total_code_lines'),
      t('verbose_total_comment_lines'),
      t('verbose_overall_comment_ratio'),
      t('verbose_avg_file_size'),
    ];
    if (stats.largestFile) {
      labels.push(t('verbose_largest_file'));
    }
    const maxLabelWidth = Math.max(...labels.map((l) => displayWidth(l)));

    const values: [string, string][] = [
      [t('verbose_total_code_lines'), String(stats.totalCodeLines)],
      [t('verbose_total_comment_lines'), String(stats.totalCommentLines)],
      [t('verbose_overall_comment_ratio'), `${stats.commentRatio}%`],
      [t('verbose_avg_file_size'), t('verbose_lines', { count: stats.avgFileSize })],
    ];
    if (stats.largestFile) {
      values.push([t('verbose_largest_file'), `${stats.largestFile} (${stats.largestFileLines})`]);
    }

    for (const [label, value] of values) {
      console.log(chalk.white(`  ${padEndByWidth(label, maxLabelWidth)}: `) + chalk.cyan(value));
    }

    if (stats.languageCounts.length > 0) {
      console.log();
      console.log(chalk.white(`  ${t('verbose_language_distribution')}:`));
      const firstEntry = stats.languageCounts[0];
      const maxCount = firstEntry ? firstEntry[1] : 1;
      const barMaxWidth = Math.min(30, getTerminalWidth() - 30);

      for (const [lang, count] of stats.languageCounts) {
        const displayName = LANGUAGE_DISPLAY_NAMES[lang as Exclude<Language, 'unknown'>] || lang;
        const barLen = Math.max(1, Math.round((count / maxCount) * barMaxWidth));
        const bar = '█'.repeat(barLen);
        console.log(
          chalk.white(`    ${padEndByWidth(displayName, 14)}`) +
            chalk.cyan(bar) +
            chalk.gray(` ${count}`)
        );
      }
    }
  }

  private renderMetricsDetails(result: ProjectAnalysisResult): void {
    if (result.aggregatedMetrics.length === 0) return;

    console.log();
    console.log(chalk.bold.magenta(`◆ ${t('report_metrics_details')}`));
    console.log();

    const maxNameWidth = Math.max(
      ...result.aggregatedMetrics.map((m) => {
        const name = t(`metric_${m.name}`) || m.name;
        return displayWidth(name);
      })
    );

    for (const metric of result.aggregatedMetrics) {
      const invertedScore = 100 - metric.average;
      const statusEmoji = this.getStatusEmoji(invertedScore);
      const statusColor = this.getStatusColor(invertedScore);
      const comment = this.getMetricComment(metric.name, invertedScore);

      const scoreStr = `${invertedScore.toFixed(1)}%`.padStart(7);
      const metricName = t(`metric_${metric.name}`) || metric.name;
      const paddedName = padEndByWidth(metricName, maxNameWidth + 2);

      console.log(
        statusColor(`  ${statusEmoji} `) +
          chalk.white(paddedName) +
          chalk.cyan(scoreStr) +
          chalk.gray(`  ${comment}`)
      );

      // Verbose: show min/max/median breakdown with colored values
      if (this.config.verbose) {
        const minVal = (100 - metric.max).toFixed(1);
        const maxVal = (100 - metric.min).toFixed(1);
        const medianVal = (100 - metric.median).toFixed(1);
        console.log(
          chalk.gray('        min: ') +
            chalk.green(`${minVal}%`) +
            chalk.gray('  max: ') +
            chalk.red(`${maxVal}%`) +
            chalk.gray('  median: ') +
            chalk.yellow(`${medianVal}%`)
        );
      }
    }
  }

  private renderWorstFiles(fileResults: FileAnalysisResult[]): void {
    const top = this.config.output.top;
    const maxIssues = this.config.verbose ? Infinity : this.config.output.maxIssues;
    const worst = [...fileResults].sort((a, b) => a.score - b.score).slice(0, top);

    if (worst.length === 0) {
      console.log();
      console.log(chalk.green(`  🎉 ${t('report_no_issues')}`));
      return;
    }

    console.log();
    console.log(chalk.bold.magenta(`◆ ${t('report_worst_files')}`));
    console.log();

    worst.forEach((file, index) => {
      const invertedScore = 100 - file.score;
      const scoreColor = this.getScoreColor(file.score);
      const scoreText = `(${t('report_file_score', { score: invertedScore.toFixed(2) })})`;
      const scoreWidth = displayWidth(scoreText);
      // Reserve space for: "  N. " (5) + score + 2 gap
      const pathMaxWidth = Math.max(20, getTerminalWidth() - 7 - scoreWidth);

      console.log(
        chalk.white(`  ${index + 1}. `) +
          chalk.magenta(padEndByWidth(truncateByWidth(file.filePath, pathMaxWidth), pathMaxWidth)) +
          '  ' +
          scoreColor(scoreText)
      );

      // Verbose: parse statistics line
      if (this.config.verbose) {
        const pr = file.parseResult;
        console.log(
          chalk.gray(
            `     ${t('verbose_file_stats', {
              total: pr.totalLines,
              code: pr.codeLines,
              comment: pr.commentLines,
              functions: pr.functions.length,
              classes: pr.classes.length,
            })}`
          )
        );
      }

      const issueCategories = this.categorizeIssues(file.metrics);
      if (Object.keys(issueCategories).length > 0) {
        const categoryStrs: string[] = [];
        const categoryInfo: Record<string, { icon: string; color: ChalkInstance }> = {
          complexity: { icon: '🔄', color: chalk.magenta },
          comment: { icon: '📝', color: chalk.blue },
          naming: { icon: '🏷️', color: chalk.cyan },
          structure: { icon: '🏗️', color: chalk.yellow },
          duplication: { icon: '📋', color: chalk.red },
          error: { icon: '❌', color: chalk.redBright },
          other: { icon: '⚠️', color: chalk.yellowBright },
        };

        for (const [category, count] of Object.entries(issueCategories)) {
          if (count > 0) {
            const info = categoryInfo[category] ??
              categoryInfo.other ?? { icon: '⚠️', color: chalk.yellowBright };
            categoryStrs.push(`${info.icon} ${t(`issue_category_${category}`)}: ${count}`);
          }
        }

        if (categoryStrs.length > 0) {
          console.log(chalk.gray(`     ${categoryStrs.join('   ')}`));
        }
      }

      // Verbose: per-file metric scores (wrapped to fit terminal width)
      if (this.config.verbose && file.metrics.length > 0) {
        const prefix = `     ${t('verbose_per_file_metrics')}: `;
        const prefixWidth = displayWidth(prefix);
        const termWidth = getTerminalWidth();
        const separator = chalk.gray(' | ');
        const separatorWidth = 3; // " | "

        const metricParts: { text: string; width: number }[] = [];
        for (const m of file.metrics) {
          const metricName = t(`metric_${m.name}`) || m.name;
          const score = m.normalizedScore;
          const color = score >= 70 ? chalk.green : score >= 40 ? chalk.yellow : chalk.red;
          const plain = `${metricName}: ${score.toFixed(0)}`;
          metricParts.push({
            text: `${metricName}: ${color(score.toFixed(0))}`,
            width: displayWidth(plain),
          });
        }

        let currentLine = chalk.gray(prefix);
        let currentWidth = prefixWidth;
        const indentStr = ' '.repeat(prefixWidth);

        for (const [i, part] of metricParts.entries()) {
          const needSep = i > 0 && currentWidth > prefixWidth;
          const addedWidth = (needSep ? separatorWidth : 0) + part.width;

          if (currentWidth + addedWidth > termWidth && currentWidth > prefixWidth) {
            console.log(currentLine);
            currentLine = chalk.gray(indentStr) + part.text;
            currentWidth = prefixWidth + part.width;
          } else {
            if (needSep) {
              currentLine += separator;
              currentWidth += separatorWidth;
            }
            currentLine += part.text;
            currentWidth += part.width;
          }
        }
        if (currentWidth > prefixWidth) {
          console.log(currentLine);
        }
      }

      // Verbose: function-level detail table
      if (this.config.verbose && file.parseResult.functions.length > 0) {
        console.log();
        console.log(chalk.cyan(`     ${t('verbose_function_details')}:`));

        const termWidth = getTerminalWidth();
        const indent = 5;
        const wRange = 14;
        const wCount = 8;
        const wCx = 8;
        const wNest = 8;

        // Determine which optional columns fit: params and doc are lower priority
        const coreFixed = indent + wRange + wCount + wCx + wNest;
        const wParams = 8;
        const wDoc = 4;
        const showParams = termWidth >= coreFixed + wParams + 20 + 5; // 20 min func + 5 seps
        const showDoc = showParams && termWidth >= coreFixed + wParams + wDoc + 20 + 6;

        const colSeps = 4 + (showParams ? 1 : 0) + (showDoc ? 1 : 0);
        const fixedWidth =
          indent +
          wRange +
          wCount +
          wCx +
          wNest +
          colSeps +
          (showParams ? wParams : 0) +
          (showDoc ? wDoc : 0);
        const wFunc = Math.max(12, termWidth - fixedWidth);
        const tableWidth = Math.min(
          termWidth - indent,
          wFunc +
            wRange +
            wCount +
            wCx +
            wNest +
            colSeps +
            (showParams ? wParams : 0) +
            (showDoc ? wDoc : 0)
        );

        // Header
        let header =
          `${padEndByWidth(t('verbose_col_function'), wFunc)} ` +
          `${padEndByWidth(t('verbose_col_range'), wRange)} ` +
          `${padEndByWidth(t('verbose_col_line_count'), wCount)} ` +
          `${padEndByWidth(t('verbose_col_complexity'), wCx)} ` +
          padEndByWidth(t('verbose_col_nesting'), wNest);
        if (showParams) header += ` ${padEndByWidth(t('verbose_col_params'), wParams)}`;
        if (showDoc) header += ` ${t('verbose_col_docstring')}`;

        console.log(chalk.gray(`${' '.repeat(indent)}${header}`));
        console.log(chalk.gray(`${' '.repeat(indent)}${'─'.repeat(tableWidth)}`));

        const sortedFuncs = [...file.parseResult.functions].sort(
          (a, b) => b.complexity - a.complexity
        );

        for (const fn of sortedFuncs) {
          const nameStr = truncateByWidth(fn.name, wFunc - 2);
          const rangeStr = `L${fn.startLine}-${fn.endLine}`;
          const cxColor =
            fn.complexity > 15 ? chalk.red : fn.complexity > 10 ? chalk.yellow : chalk.white;
          const nestColor =
            fn.nestingDepth > 4 ? chalk.red : fn.nestingDepth > 3 ? chalk.yellow : chalk.white;

          let row =
            chalk.white(`${' '.repeat(indent)}${padEndByWidth(nameStr, wFunc)} `) +
            chalk.gray(`${rangeStr.padEnd(wRange)} `) +
            chalk.white(`${String(fn.lineCount).padEnd(wCount)} `) +
            cxColor(`${String(fn.complexity).padEnd(wCx)} `) +
            nestColor(String(fn.nestingDepth).padEnd(wNest));
          if (showParams) {
            row += chalk.white(` ${String(fn.parameterCount).padEnd(wParams)}`);
          }
          if (showDoc) {
            const docStr = fn.hasDocstring ? '✓' : '✗';
            row += ' ' + (fn.hasDocstring ? chalk.green(docStr) : chalk.red(docStr));
          }
          console.log(row);
        }
      }

      // Issues
      const allIssues = file.metrics
        .filter((m) => m.severity !== 'info')
        .flatMap((m) => (m.locations || []).map((loc) => ({ ...loc, category: m.category })));

      const issues = allIssues.slice(0, maxIssues);

      if (issues.length > 0) {
        console.log();
        if (this.config.verbose) {
          console.log(chalk.cyan(`     ${t('verbose_all_issues', { count: allIssues.length })}:`));
        }
        for (const issue of issues) {
          const icon = this.getIssueIcon(issue.category);
          const color = this.getIssueColor(issue.category);
          const funcInfo = issue.functionName ? `${issue.functionName}() ` : '';
          const lineInfo = issue.line ? `L${issue.line}: ` : '';
          console.log(color(`     ${icon} ${funcInfo}${lineInfo}${issue.message || ''}`));
        }

        if (!this.config.verbose && allIssues.length > maxIssues) {
          console.log(
            chalk.yellow(
              `     🔍 ${t('report_more_issues', { count: allIssues.length - maxIssues })}`
            )
          );
        }
      } else {
        console.log(chalk.green(`     ✓ ${t('verbose_file_good_quality')}`));
      }

      // Verbose: metric details
      if (this.config.verbose) {
        const detailMetrics = file.metrics.filter((m) => m.details);
        if (detailMetrics.length > 0) {
          console.log();
          console.log(chalk.cyan(`     ${t('verbose_metric_details')}:`));
          for (const m of detailMetrics) {
            const metricName = t(`metric_${m.name}`) || m.name;
            console.log(chalk.gray(`       ${metricName}: ${m.details}`));
          }
        }
      }

      console.log();
    });
  }

  private renderWorstFunctions(result: ProjectAnalysisResult): void {
    const top10 = collectWorstFunctions(result, 10);
    if (top10.length === 0) return;

    console.log();
    console.log(chalk.bold.magenta(`◆ ${t('verbose_top_worst_functions')}`));
    console.log();

    const termWidth = getTerminalWidth();
    const indent = 2;
    const wCx = 8;
    const wNest = 8;
    const wCount = 6;
    const separators = 4;
    const fixedWidth = indent + wCx + wNest + wCount + separators;
    const remaining = Math.max(32, termWidth - fixedWidth);
    const wFunc = Math.max(12, Math.round(remaining * 0.35));
    const wFile = Math.max(12, remaining - wFunc);
    const tableWidth = Math.min(
      termWidth - indent,
      wFunc + wFile + wCx + wNest + wCount + separators
    );

    console.log(
      chalk.gray(
        `${' '.repeat(indent)}${padEndByWidth(t('verbose_col_function'), wFunc)} ${padEndByWidth(t('verbose_col_file'), wFile)} ${padEndByWidth(t('verbose_col_complexity'), wCx)} ${padEndByWidth(t('verbose_col_nesting'), wNest)} ${t('verbose_col_line_count')}`
      )
    );
    console.log(chalk.gray(`${' '.repeat(indent)}${'─'.repeat(tableWidth)}`));

    for (const fn of top10) {
      const nameStr = truncateByWidth(fn.name, wFunc - 2);
      const fileStr = truncateByWidth(fn.filePath, wFile - 2);
      const cxColor =
        fn.complexity > 15 ? chalk.red : fn.complexity > 10 ? chalk.yellow : chalk.white;
      const nestColor =
        fn.nestingDepth > 4 ? chalk.red : fn.nestingDepth > 3 ? chalk.yellow : chalk.white;

      console.log(
        chalk.white(`${' '.repeat(indent)}${padEndByWidth(nameStr, wFunc)} `) +
          chalk.gray(`${padEndByWidth(fileStr, wFile)} `) +
          cxColor(`${String(fn.complexity).padEnd(wCx)} `) +
          nestColor(`${String(fn.nestingDepth).padEnd(wNest)} `) +
          chalk.white(String(fn.lineCount))
      );
    }
  }

  private renderConclusion(score: number): void {
    const invertedScore = 100 - score;
    const level = this.getQualityLevel(invertedScore);

    console.log(chalk.bold.magenta(`◆ ${t('report_conclusion')}`));
    console.log();
    console.log(`  🌸 ${chalk.cyan(t(level.nameKey))} - ${chalk.gray(t(level.descKey))}`);
    console.log();

    if (level.minScore < 30) {
      console.log(chalk.green(`  👍 ${t('advice_good')}`));
    } else if (level.minScore < 60) {
      console.log(chalk.yellow(`  🔧 ${t('advice_moderate')}`));
    } else {
      console.log(chalk.red(`  🧨 ${t('advice_bad')}`));
    }
    console.log();
  }

  private renderFooter(result: ProjectAnalysisResult): void {
    this.printDivider();
    console.log(chalk.gray(`  ${t('analysisTime', { time: result.analysisTime })}`));
    console.log();
  }

  private printDivider(): void {
    console.log(chalk.gray('─'.repeat(getTerminalWidth())));
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

  private getMetricComment(metricName: string, invertedScore: number): string {
    let level: string;
    if (invertedScore < 20) {
      level = 'good';
    } else if (invertedScore < 60) {
      level = 'medium';
    } else {
      level = 'bad';
    }

    const lowerName = metricName.toLowerCase();
    let metricType = '';

    if (
      lowerName.includes('complexity') ||
      lowerName.includes('cyclomatic') ||
      lowerName.includes('cognitive')
    ) {
      metricType = 'complexity';
    } else if (
      lowerName.includes('length') ||
      lowerName.includes('function') ||
      lowerName.includes('file')
    ) {
      metricType = 'length';
    } else if (lowerName.includes('comment') || lowerName.includes('ratio')) {
      metricType = 'comment';
    } else if (lowerName.includes('naming') || lowerName.includes('convention')) {
      metricType = 'naming';
    } else if (
      lowerName.includes('nesting') ||
      lowerName.includes('depth') ||
      lowerName.includes('structure')
    ) {
      metricType = 'structure';
    }

    if (metricType) {
      return t(`metric_${metricType}_${level}`);
    }

    if (invertedScore < 20) {
      return t('metric_complexity_good');
    } else if (invertedScore < 60) {
      return t('metric_complexity_medium');
    } else {
      return t('metric_complexity_bad');
    }
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

  private getStatusColor(invertedScore: number): ChalkInstance {
    if (invertedScore < 20) return chalk.bold.green;
    if (invertedScore < 35) return chalk.green;
    if (invertedScore < 50) return chalk.cyanBright;
    if (invertedScore < 60) return chalk.blue;
    if (invertedScore < 70) return chalk.yellowBright;
    if (invertedScore < 80) return chalk.yellow;
    if (invertedScore < 90) return chalk.redBright;
    return chalk.red;
  }

  private getScoreColor(score: number): ChalkInstance {
    if (score >= 80) return chalk.bold.green;
    if (score >= 65) return chalk.green;
    if (score >= 50) return chalk.cyanBright;
    if (score >= 40) return chalk.blue;
    if (score >= 30) return chalk.yellowBright;
    if (score >= 20) return chalk.yellow;
    if (score >= 10) return chalk.redBright;
    return chalk.red;
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
      naming: '🏷️ ',
      structure: '🏗️ ',
      duplication: '📋',
      error: '❌',
      size: '📏',
    };
    return icons[category] || '⚠️ ';
  }

  private getIssueColor(category: string): ChalkInstance {
    const colors: Record<string, ChalkInstance> = {
      complexity: chalk.magenta,
      documentation: chalk.blue,
      naming: chalk.cyan,
      structure: chalk.yellow,
      duplication: chalk.red,
      error: chalk.redBright,
      size: chalk.yellowBright,
    };
    return colors[category] || chalk.yellowBright;
  }
}
