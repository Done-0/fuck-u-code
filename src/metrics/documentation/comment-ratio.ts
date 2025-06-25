/**
 * Comment ratio metric
 *
 * Industry thresholds
 * - 10-25%: Optimal range for most codebases
 * - <5%: Under-documented, may be hard to maintain
 * - >40%: Over-documented, may indicate code smell
 *
 * Note: Quality of comments matters more than quantity.
 * This metric is a heuristic, not a definitive measure.
 */

import type { Metric, MetricResult, MetricCategory, Severity } from '../types.js';
import type { ParseResult } from '../../parser/types.js';
import { t } from '../../i18n/index.js';

const THRESHOLDS = {
  MIN_OPTIMAL: 10,
  MAX_OPTIMAL: 25,
  MIN_ACCEPTABLE: 5,
  MAX_ACCEPTABLE: 40,
} as const;

export class CommentRatioMetric implements Metric {
  readonly name = 'comment_ratio';
  readonly category: MetricCategory = 'documentation';
  readonly weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  calculate(parseResult: ParseResult): MetricResult {
    const { codeLines, commentLines } = parseResult;

    if (codeLines === 0) {
      return {
        name: this.name,
        category: this.category,
        value: 0,
        normalizedScore: 100,
        severity: 'info',
        details: t('detail_no_code_lines'),
      };
    }

    const ratio = (commentLines / codeLines) * 100;

    let normalizedScore: number;
    if (ratio >= THRESHOLDS.MIN_OPTIMAL && ratio <= THRESHOLDS.MAX_OPTIMAL) {
      normalizedScore = 100;
    } else if (ratio < THRESHOLDS.MIN_OPTIMAL) {
      if (ratio >= THRESHOLDS.MIN_ACCEPTABLE) {
        normalizedScore =
          70 +
          ((ratio - THRESHOLDS.MIN_ACCEPTABLE) /
            (THRESHOLDS.MIN_OPTIMAL - THRESHOLDS.MIN_ACCEPTABLE)) *
            30;
      } else {
        normalizedScore = Math.max(0, ratio * 14);
      }
    } else {
      if (ratio <= THRESHOLDS.MAX_ACCEPTABLE) {
        normalizedScore =
          100 -
          ((ratio - THRESHOLDS.MAX_OPTIMAL) /
            (THRESHOLDS.MAX_ACCEPTABLE - THRESHOLDS.MAX_OPTIMAL)) *
            40;
      } else {
        normalizedScore = Math.max(0, 60 - (ratio - THRESHOLDS.MAX_ACCEPTABLE) * 1.5);
      }
    }

    let severity: Severity;
    if (ratio >= THRESHOLDS.MIN_OPTIMAL && ratio <= THRESHOLDS.MAX_OPTIMAL) {
      severity = 'info';
    } else if (ratio >= THRESHOLDS.MIN_ACCEPTABLE && ratio <= THRESHOLDS.MAX_ACCEPTABLE) {
      severity = 'warning';
    } else {
      severity = 'error';
    }

    return {
      name: this.name,
      category: this.category,
      value: ratio,
      normalizedScore: Math.round(normalizedScore * 10) / 10,
      severity,
      details: t('detail_ratio', {
        ratio: ratio.toFixed(1),
        comments: String(commentLines),
        code: String(codeLines),
      }),
    };
  }
}
