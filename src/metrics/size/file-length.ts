/**
 * File length metric
 *
 * Industry thresholds (based on Clean Code, SonarQube):
 * - 1-200 lines: Excellent, focused file
 * - 201-400 lines: Good, manageable
 * - 401-800 lines: Moderate, consider splitting
 * - 800+ lines: Poor, should be split
 */

import type { Metric, MetricResult, MetricCategory, Severity } from '../types.js';
import type { ParseResult } from '../../parser/types.js';
import { t } from '../../i18n/index.js';

const THRESHOLDS = {
  EXCELLENT: 200,
  GOOD: 400,
  ACCEPTABLE: 800,
  POOR: 1500,
} as const;

export class FileLengthMetric implements Metric {
  readonly name = 'file_length';
  readonly category: MetricCategory = 'size';
  readonly weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  calculate(parseResult: ParseResult): MetricResult {
    const { totalLines, codeLines } = parseResult;

    let normalizedScore: number;
    if (codeLines <= THRESHOLDS.EXCELLENT) {
      normalizedScore = 100;
    } else if (codeLines <= THRESHOLDS.GOOD) {
      normalizedScore =
        100 - ((codeLines - THRESHOLDS.EXCELLENT) / (THRESHOLDS.GOOD - THRESHOLDS.EXCELLENT)) * 15;
    } else if (codeLines <= THRESHOLDS.ACCEPTABLE) {
      normalizedScore =
        85 - ((codeLines - THRESHOLDS.GOOD) / (THRESHOLDS.ACCEPTABLE - THRESHOLDS.GOOD)) * 35;
    } else if (codeLines <= THRESHOLDS.POOR) {
      normalizedScore =
        50 - ((codeLines - THRESHOLDS.ACCEPTABLE) / (THRESHOLDS.POOR - THRESHOLDS.ACCEPTABLE)) * 35;
    } else {
      normalizedScore = Math.max(0, 15 * Math.exp(-(codeLines - THRESHOLDS.POOR) / 500));
    }

    let severity: Severity;
    if (codeLines <= THRESHOLDS.EXCELLENT) {
      severity = 'info';
    } else if (codeLines <= THRESHOLDS.GOOD) {
      severity = 'warning';
    } else if (codeLines <= THRESHOLDS.ACCEPTABLE) {
      severity = 'error';
    } else {
      severity = 'critical';
    }

    return {
      name: this.name,
      category: this.category,
      value: codeLines,
      normalizedScore: Math.round(normalizedScore * 10) / 10,
      severity,
      details: t('detail_file_length', { code: codeLines, total: totalLines }),
    };
  }
}
