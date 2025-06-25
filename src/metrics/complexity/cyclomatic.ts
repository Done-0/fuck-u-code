/**
 * Cyclomatic complexity metric
 *
 * Industry standard thresholds (based on SonarQube, ESLint, CodeClimate):
 * - 1-10: Low complexity, easy to test and maintain
 * - 11-20: Moderate complexity, consider refactoring
 * - 21-50: High complexity, should be refactored
 * - 50+: Very high complexity, must be refactored
 *
 * Formula: CC = 1 + (if) + (loops) + (case) + (catch) + (&&/||) + (ternary)
 */

import type { Metric, MetricResult, MetricCategory, MetricLocation, Severity } from '../types.js';
import type { ParseResult } from '../../parser/types.js';
import { t } from '../../i18n/index.js';

// Industry-standard thresholds (SonarQube defaults)
const THRESHOLDS = {
  EXCELLENT: 5,
  GOOD: 10,
  ACCEPTABLE: 20,
  POOR: 30,
} as const;

export class CyclomaticComplexityMetric implements Metric {
  readonly name = 'cyclomatic_complexity';
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
        value: 1,
        normalizedScore: 100,
        severity: 'info',
        details: t('detail_no_functions'),
      };
    }

    // Calculate complexity statistics
    let totalComplexity = 0;
    let maxComplexity = 0;
    const locations: MetricLocation[] = [];

    for (const func of functions) {
      totalComplexity += func.complexity;
      if (func.complexity > maxComplexity) {
        maxComplexity = func.complexity;
      }
      // Flag functions exceeding acceptable threshold
      if (func.complexity > THRESHOLDS.GOOD) {
        locations.push({
          filePath,
          line: func.startLine,
          functionName: func.name,
          message: `${t('complexity')}: ${func.complexity}`,
        });
      }
    }

    const avgComplexity = totalComplexity / functions.length;

    // Calculate normalized score using non-linear curve
    // Score decreases more rapidly as complexity increases
    let normalizedScore: number;
    if (avgComplexity <= THRESHOLDS.EXCELLENT) {
      normalizedScore = 100;
    } else if (avgComplexity <= THRESHOLDS.GOOD) {
      // Linear decrease from 100 to 80
      normalizedScore =
        100 -
        ((avgComplexity - THRESHOLDS.EXCELLENT) / (THRESHOLDS.GOOD - THRESHOLDS.EXCELLENT)) * 20;
    } else if (avgComplexity <= THRESHOLDS.ACCEPTABLE) {
      // Steeper decrease from 80 to 50
      normalizedScore =
        80 - ((avgComplexity - THRESHOLDS.GOOD) / (THRESHOLDS.ACCEPTABLE - THRESHOLDS.GOOD)) * 30;
    } else if (avgComplexity <= THRESHOLDS.POOR) {
      // Even steeper decrease from 50 to 20
      normalizedScore =
        50 -
        ((avgComplexity - THRESHOLDS.ACCEPTABLE) / (THRESHOLDS.POOR - THRESHOLDS.ACCEPTABLE)) * 30;
    } else {
      // Exponential decay for very high complexity
      normalizedScore = Math.max(0, 20 * Math.exp(-(avgComplexity - THRESHOLDS.POOR) / 20));
    }

    // Determine severity based on max complexity (worst case matters)
    let severity: Severity;
    if (maxComplexity <= THRESHOLDS.GOOD) {
      severity = 'info';
    } else if (maxComplexity <= THRESHOLDS.ACCEPTABLE) {
      severity = 'warning';
    } else if (maxComplexity <= THRESHOLDS.POOR) {
      severity = 'error';
    } else {
      severity = 'critical';
    }

    return {
      name: this.name,
      category: this.category,
      value: avgComplexity,
      normalizedScore: Math.round(normalizedScore * 10) / 10,
      severity,
      details: t('detail_avg_max', { avg: avgComplexity.toFixed(1), max: String(maxComplexity) }),
      locations: locations.length > 0 ? locations : undefined,
    };
  }
}
