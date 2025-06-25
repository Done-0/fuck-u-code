/**
 * Nesting depth metric
 *
 * Industry thresholds:
 * - 1-3: Excellent, easy to follow
 * - 4-5: Good, acceptable
 * - 6-7: Moderate, consider refactoring
 * - 8+: Poor, must be refactored
 */

import type { Metric, MetricResult, MetricCategory, MetricLocation, Severity } from '../types.js';
import type { ParseResult } from '../../parser/types.js';
import { t } from '../../i18n/index.js';

const THRESHOLDS = {
  EXCELLENT: 3,
  GOOD: 5,
  ACCEPTABLE: 7,
  POOR: 10,
} as const;

export class NestingDepthMetric implements Metric {
  readonly name = 'nesting_depth';
  readonly category: MetricCategory = 'complexity';
  readonly weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  calculate(parseResult: ParseResult): MetricResult {
    const { functions, filePath } = parseResult;

    if (functions.length === 0) {
      return {
        name: this.name,
        category: this.category,
        value: 0,
        normalizedScore: 100,
        severity: 'info',
        details: t('detail_no_functions'),
      };
    }

    let totalDepth = 0;
    let maxDepth = 0;
    const locations: MetricLocation[] = [];

    for (const func of functions) {
      totalDepth += func.nestingDepth;
      if (func.nestingDepth > maxDepth) {
        maxDepth = func.nestingDepth;
      }
      if (func.nestingDepth > THRESHOLDS.EXCELLENT) {
        locations.push({
          filePath,
          line: func.startLine,
          functionName: func.name,
          message: `${t('metric_nesting_depth')}: ${func.nestingDepth}`,
        });
      }
    }

    const avgDepth = totalDepth / functions.length;

    let normalizedScore: number;
    if (maxDepth <= THRESHOLDS.EXCELLENT) {
      normalizedScore = 100;
    } else if (maxDepth <= THRESHOLDS.GOOD) {
      normalizedScore =
        100 - ((maxDepth - THRESHOLDS.EXCELLENT) / (THRESHOLDS.GOOD - THRESHOLDS.EXCELLENT)) * 20;
    } else if (maxDepth <= THRESHOLDS.ACCEPTABLE) {
      normalizedScore =
        80 - ((maxDepth - THRESHOLDS.GOOD) / (THRESHOLDS.ACCEPTABLE - THRESHOLDS.GOOD)) * 35;
    } else if (maxDepth <= THRESHOLDS.POOR) {
      normalizedScore =
        45 - ((maxDepth - THRESHOLDS.ACCEPTABLE) / (THRESHOLDS.POOR - THRESHOLDS.ACCEPTABLE)) * 30;
    } else {
      normalizedScore = Math.max(0, 15 * Math.exp(-(maxDepth - THRESHOLDS.POOR) / 3));
    }

    let severity: Severity;
    if (maxDepth <= THRESHOLDS.EXCELLENT) {
      severity = 'info';
    } else if (maxDepth <= THRESHOLDS.GOOD) {
      severity = 'warning';
    } else if (maxDepth <= THRESHOLDS.ACCEPTABLE) {
      severity = 'error';
    } else {
      severity = 'critical';
    }

    return {
      name: this.name,
      category: this.category,
      value: maxDepth,
      normalizedScore: Math.round(normalizedScore * 10) / 10,
      severity,
      details: t('detail_avg_max', { avg: avgDepth.toFixed(1), max: String(maxDepth) }),
      locations: locations.length > 0 ? locations : undefined,
    };
  }
}
