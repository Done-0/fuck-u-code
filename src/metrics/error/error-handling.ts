/**
 * Error handling metric
 *
 * Detects ignored errors and unhandled error-prone API calls.
 *
 * Industry thresholds (based on Go error handling, SonarQube):
 * - 0-5%: Excellent, nearly all errors handled
 * - 5-15%: Good, most errors handled
 * - 15-30%: Moderate, many errors ignored
 * - 30%+: Poor, critical errors likely missed
 */

import type { Metric, MetricResult, MetricCategory, MetricLocation, Severity } from '../types.js';
import type { ParseResult } from '../../parser/types.js';
import { t } from '../../i18n/index.js';

const THRESHOLDS = {
  EXCELLENT: 5,
  GOOD: 15,
  ACCEPTABLE: 30,
  POOR: 50,
} as const;

const ERROR_PRONE_PATTERNS = [
  /\b(open|read|write|close|create|remove|rename|mkdir|readFile|writeFile|readdir|stat|access)\s*\(/,
  /\b(fetch|get|post|put|delete|request|send|connect|listen|accept)\s*\(/,
  /\b(parse|stringify|marshal|unmarshal|decode|encode)\s*\(/,
  /\b(query|exec|execute|prepare|transaction|commit|rollback)\s*\(/,
];

export class ErrorHandlingMetric implements Metric {
  readonly name = 'error_handling';
  readonly category: MetricCategory = 'error';
  readonly weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  calculate(parseResult: ParseResult): MetricResult {
    const { functions, filePath, content } = parseResult;

    if (functions.length === 0 || !content) {
      return {
        name: this.name,
        category: this.category,
        value: 0,
        normalizedScore: 100,
        severity: 'info',
        details: t('detail_no_functions'),
      };
    }

    const { errorProneCallCount, locations } = this.analyzeErrorHandling(content, filePath);

    if (errorProneCallCount === 0) {
      return {
        name: this.name,
        category: this.category,
        value: 0,
        normalizedScore: 100,
        severity: 'info',
        details: t('detail_no_error_prone_calls'),
      };
    }

    const ignoredCount = locations.length;
    const ignoredPercent = (ignoredCount / errorProneCallCount) * 100;

    let normalizedScore: number;
    if (ignoredPercent <= THRESHOLDS.EXCELLENT) {
      normalizedScore = 100;
    } else if (ignoredPercent <= THRESHOLDS.GOOD) {
      normalizedScore =
        100 -
        ((ignoredPercent - THRESHOLDS.EXCELLENT) / (THRESHOLDS.GOOD - THRESHOLDS.EXCELLENT)) * 20;
    } else if (ignoredPercent <= THRESHOLDS.ACCEPTABLE) {
      normalizedScore =
        80 - ((ignoredPercent - THRESHOLDS.GOOD) / (THRESHOLDS.ACCEPTABLE - THRESHOLDS.GOOD)) * 35;
    } else if (ignoredPercent <= THRESHOLDS.POOR) {
      normalizedScore =
        45 -
        ((ignoredPercent - THRESHOLDS.ACCEPTABLE) / (THRESHOLDS.POOR - THRESHOLDS.ACCEPTABLE)) * 30;
    } else {
      normalizedScore = Math.max(0, 15 * Math.exp(-(ignoredPercent - THRESHOLDS.POOR) / 20));
    }

    let severity: Severity;
    if (ignoredPercent <= THRESHOLDS.EXCELLENT) {
      severity = 'info';
    } else if (ignoredPercent <= THRESHOLDS.GOOD) {
      severity = 'warning';
    } else if (ignoredPercent <= THRESHOLDS.ACCEPTABLE) {
      severity = 'error';
    } else {
      severity = 'critical';
    }

    return {
      name: this.name,
      category: this.category,
      value: ignoredPercent,
      normalizedScore: Math.round(normalizedScore * 10) / 10,
      severity,
      details: t('detail_errors_ignored', {
        ignored: ignoredCount,
        total: errorProneCallCount,
        percent: ignoredPercent.toFixed(1),
      }),
      locations: locations.length > 0 ? locations : undefined,
    };
  }

  private analyzeErrorHandling(
    content: string,
    filePath: string
  ): { errorProneCallCount: number; locations: MetricLocation[] } {
    const lines = content.split('\n');
    const locations: MetricLocation[] = [];
    let errorProneCallCount = 0;
    let insideTryCatch = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const trimmed = line.trim();

      // Track try-catch block depth
      if (/\btry\s*\{/.test(trimmed)) {
        insideTryCatch++;
        continue;
      }
      if (/\bcatch\s*[({]/.test(trimmed)) {
        continue;
      }
      if (insideTryCatch > 0 && trimmed === '}') {
        insideTryCatch--;
        continue;
      }

      // Skip lines that are error handling themselves
      if (/\.(catch|then)\s*\(/.test(trimmed) || /\bthrow\b/.test(trimmed)) {
        continue;
      }

      if (!this.isErrorProneCall(trimmed)) continue;

      errorProneCallCount++;

      // Inside try-catch: considered handled
      if (insideTryCatch > 0) continue;

      const lineNum = i + 1;

      // Ignored with underscore assignment: _ = readFile(...)
      if (/\b_\s*[=:]/.test(trimmed)) {
        locations.push({
          filePath,
          line: lineNum,
          message: t('issue_ignored_error'),
        });
        continue;
      }

      // Unhandled: bare call without assignment or return
      if (
        !/\b(const|let|var)\s+\w/.test(trimmed) &&
        !/\breturn\b/.test(trimmed) &&
        !trimmed.includes('=')
      ) {
        locations.push({
          filePath,
          line: lineNum,
          message: t('issue_unhandled_error'),
        });
      }
    }

    return { errorProneCallCount, locations };
  }

  private isErrorProneCall(line: string): boolean {
    return ERROR_PRONE_PATTERNS.some((pattern) => pattern.test(line));
  }
}
