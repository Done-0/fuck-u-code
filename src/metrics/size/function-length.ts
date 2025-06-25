/**
 * Function length metric
 *
 * Industry thresholds (based on SonarQube, real-world projects):
 * - 1-50 lines: Excellent, concise and clear
 * - 51-150 lines: Good, typical business logic
 * - 151-300 lines: Acceptable, complex but manageable
 * - 301-500 lines: Poor, consider refactoring
 * - 500+ lines: Critical, needs refactoring
 */

import type { Metric, MetricResult, MetricCategory, MetricLocation, Severity } from '../types.js';
import type { ParseResult } from '../../parser/types.js';
import { t } from '../../i18n/index.js';

const THRESHOLDS = {
  EXCELLENT: 50,
  GOOD: 150,
  ACCEPTABLE: 300,
  POOR: 500,
} as const;

export class FunctionLengthMetric implements Metric {
  readonly name = 'function_length';
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

    let totalLength = 0;
    let maxLength = 0;
    const locations: MetricLocation[] = [];

    for (const func of functions) {
      totalLength += func.lineCount;
      if (func.lineCount > maxLength) {
        maxLength = func.lineCount;
      }
      if (func.lineCount > THRESHOLDS.GOOD) {
        locations.push({
          filePath,
          line: func.startLine,
          functionName: func.name,
          message: `${func.lineCount} ${t('size')}`,
        });
      }
    }

    const avgLength = totalLength / functions.length;

    let normalizedScore: number;
    if (avgLength <= THRESHOLDS.EXCELLENT) {
      normalizedScore = 100;
    } else if (avgLength <= THRESHOLDS.GOOD) {
      normalizedScore =
        100 - ((avgLength - THRESHOLDS.EXCELLENT) / (THRESHOLDS.GOOD - THRESHOLDS.EXCELLENT)) * 15;
    } else if (avgLength <= THRESHOLDS.ACCEPTABLE) {
      normalizedScore =
        85 - ((avgLength - THRESHOLDS.GOOD) / (THRESHOLDS.ACCEPTABLE - THRESHOLDS.GOOD)) * 35;
    } else if (avgLength <= THRESHOLDS.POOR) {
      normalizedScore =
        50 - ((avgLength - THRESHOLDS.ACCEPTABLE) / (THRESHOLDS.POOR - THRESHOLDS.ACCEPTABLE)) * 35;
    } else {
      normalizedScore = Math.max(0, 15 * Math.exp(-(avgLength - THRESHOLDS.POOR) / 50));
    }

    let severity: Severity;
    if (maxLength <= THRESHOLDS.GOOD) {
      severity = 'info';
    } else if (maxLength <= THRESHOLDS.ACCEPTABLE) {
      severity = 'warning';
    } else if (maxLength <= THRESHOLDS.POOR) {
      severity = 'error';
    } else {
      severity = 'critical';
    }

    return {
      name: this.name,
      category: this.category,
      value: avgLength,
      normalizedScore: Math.round(normalizedScore * 10) / 10,
      severity,
      details: t('detail_avg_lines_max_lines', {
        avg: avgLength.toFixed(1),
        max: String(maxLength),
      }),
      locations: locations.length > 0 ? locations : undefined,
    };
  }
}
