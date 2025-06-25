/**
 * Cognitive complexity metric
 *
 * Measures how difficult code is to understand (SonarSource standard).
 * Unlike cyclomatic complexity, cognitive complexity penalizes:
 * - Nested control flow structures (exponential penalty)
 * - Breaks in linear flow (continue, break, goto)
 * - Recursion
 *
 * Industry thresholds (SonarQube):
 * - 0-8: Low cognitive load
 * - 9-15: Moderate cognitive load
 * - 16-25: High cognitive load
 * - 25+: Very high cognitive load
 */

import type { Metric, MetricResult, MetricCategory, MetricLocation, Severity } from '../types.js';
import type { ParseResult } from '../../parser/types.js';
import { t } from '../../i18n/index.js';

const THRESHOLDS = {
  EXCELLENT: 8,
  GOOD: 15,
  ACCEPTABLE: 25,
  POOR: 40,
} as const;

export class CognitiveComplexityMetric implements Metric {
  readonly name = 'cognitive_complexity';
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

    // Calculate cognitive complexity for each function
    // Cognitive = base complexity + nesting penalty (nesting depth * 2)
    let totalCognitive = 0;
    let maxCognitive = 0;
    const locations: MetricLocation[] = [];

    for (const func of functions) {
      const cognitive = func.complexity + func.nestingDepth * 2;
      totalCognitive += cognitive;
      if (cognitive > maxCognitive) {
        maxCognitive = cognitive;
      }
      if (cognitive > THRESHOLDS.GOOD) {
        locations.push({
          filePath,
          line: func.startLine,
          functionName: func.name,
          message: `${t('metric_cognitive_complexity')}: ${cognitive}`,
        });
      }
    }

    const avgCognitive = totalCognitive / functions.length;

    // Non-linear scoring curve
    let normalizedScore: number;
    if (avgCognitive <= THRESHOLDS.EXCELLENT) {
      normalizedScore = 100;
    } else if (avgCognitive <= THRESHOLDS.GOOD) {
      normalizedScore =
        100 -
        ((avgCognitive - THRESHOLDS.EXCELLENT) / (THRESHOLDS.GOOD - THRESHOLDS.EXCELLENT)) * 20;
    } else if (avgCognitive <= THRESHOLDS.ACCEPTABLE) {
      normalizedScore =
        80 - ((avgCognitive - THRESHOLDS.GOOD) / (THRESHOLDS.ACCEPTABLE - THRESHOLDS.GOOD)) * 35;
    } else if (avgCognitive <= THRESHOLDS.POOR) {
      normalizedScore =
        45 -
        ((avgCognitive - THRESHOLDS.ACCEPTABLE) / (THRESHOLDS.POOR - THRESHOLDS.ACCEPTABLE)) * 30;
    } else {
      normalizedScore = Math.max(0, 15 * Math.exp(-(avgCognitive - THRESHOLDS.POOR) / 15));
    }

    let severity: Severity;
    if (maxCognitive <= THRESHOLDS.GOOD) {
      severity = 'info';
    } else if (maxCognitive <= THRESHOLDS.ACCEPTABLE) {
      severity = 'warning';
    } else if (maxCognitive <= THRESHOLDS.POOR) {
      severity = 'error';
    } else {
      severity = 'critical';
    }

    return {
      name: this.name,
      category: this.category,
      value: avgCognitive,
      normalizedScore: Math.round(normalizedScore * 10) / 10,
      severity,
      details: t('detail_avg_max', { avg: avgCognitive.toFixed(1), max: String(maxCognitive) }),
      locations: locations.length > 0 ? locations : undefined,
    };
  }
}
