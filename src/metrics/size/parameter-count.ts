/**
 * Parameter count metric
 *
 * Industry thresholds (based on Clean Code, SonarQube):
 * - 0-3: Excellent, easy to understand and test
 * - 4-5: Good, acceptable
 * - 6-7: Moderate, consider using object parameter
 * - 8+: Poor, should be refactored
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

export class ParameterCountMetric implements Metric {
  readonly name = 'parameter_count';
  readonly category: MetricCategory = 'size';
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

    let totalParams = 0;
    let maxParams = 0;
    const locations: MetricLocation[] = [];

    for (const func of functions) {
      totalParams += func.parameterCount;
      if (func.parameterCount > maxParams) {
        maxParams = func.parameterCount;
      }
      if (func.parameterCount > THRESHOLDS.GOOD) {
        locations.push({
          filePath,
          line: func.startLine,
          functionName: func.name,
          message: `${func.parameterCount} ${t('metric_parameter_count')}`,
        });
      }
    }

    const avgParams = totalParams / functions.length;

    let normalizedScore: number;
    if (maxParams <= THRESHOLDS.EXCELLENT) {
      normalizedScore = 100;
    } else if (maxParams <= THRESHOLDS.GOOD) {
      normalizedScore =
        100 - ((maxParams - THRESHOLDS.EXCELLENT) / (THRESHOLDS.GOOD - THRESHOLDS.EXCELLENT)) * 15;
    } else if (maxParams <= THRESHOLDS.ACCEPTABLE) {
      normalizedScore =
        85 - ((maxParams - THRESHOLDS.GOOD) / (THRESHOLDS.ACCEPTABLE - THRESHOLDS.GOOD)) * 35;
    } else if (maxParams <= THRESHOLDS.POOR) {
      normalizedScore =
        50 - ((maxParams - THRESHOLDS.ACCEPTABLE) / (THRESHOLDS.POOR - THRESHOLDS.ACCEPTABLE)) * 35;
    } else {
      normalizedScore = Math.max(0, 15 * Math.exp(-(maxParams - THRESHOLDS.POOR) / 3));
    }

    let severity: Severity;
    if (maxParams <= THRESHOLDS.EXCELLENT) {
      severity = 'info';
    } else if (maxParams <= THRESHOLDS.GOOD) {
      severity = 'warning';
    } else if (maxParams <= THRESHOLDS.ACCEPTABLE) {
      severity = 'error';
    } else {
      severity = 'critical';
    }

    return {
      name: this.name,
      category: this.category,
      value: maxParams,
      normalizedScore: Math.round(normalizedScore * 10) / 10,
      severity,
      details: t('detail_avg_max', { avg: avgParams.toFixed(1), max: String(maxParams) }),
      locations: locations.length > 0 ? locations : undefined,
    };
  }
}
