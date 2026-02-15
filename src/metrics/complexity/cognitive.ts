/**
 * Cognitive complexity metric
 *
 * Measures how difficult code is to understand (SonarSource standard).
 * Unlike cyclomatic complexity, cognitive complexity penalizes:
 * - Nested control flow structures (exponential penalty)
 * - Breaks in linear flow (continue, break, goto)
 * - Recursion
 *
 * Language-specific thresholds based on official linter defaults.
 * See src/metrics/thresholds/language-thresholds.ts for sources.
 */

import type { Metric, MetricResult, MetricCategory, MetricLocation, Severity } from '../types.js';
import type { ParseResult, Language } from '../../parser/types.js';
import { t } from '../../i18n/index.js';
import { getThresholds } from '../thresholds/language-thresholds.js';

export class CognitiveComplexityMetric implements Metric {
  readonly name = 'cognitive_complexity';
  readonly category: MetricCategory = 'complexity';
  readonly weight: number;
  private readonly language: Language;

  constructor(weight: number, language: Language) {
    this.weight = weight;
    this.language = language;
  }

  calculate(parseResult: ParseResult): MetricResult {
    const { functions, filePath } = parseResult;
    const thresholds = getThresholds(this.language, 'cognitiveComplexity');

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

    let totalCognitive = 0;
    let maxCognitive = 0;
    const locations: MetricLocation[] = [];

    for (const func of functions) {
      const cognitive = func.complexity + func.nestingDepth * 2;
      totalCognitive += cognitive;
      if (cognitive > maxCognitive) {
        maxCognitive = cognitive;
      }
      if (cognitive > thresholds.good) {
        locations.push({
          filePath,
          line: func.startLine,
          functionName: func.name,
          message: `${t('metric_cognitive_complexity')}: ${cognitive}`,
        });
      }
    }

    const avgCognitive = totalCognitive / functions.length;

    let normalizedScore: number;
    if (avgCognitive <= thresholds.excellent) {
      normalizedScore = 100;
    } else if (avgCognitive <= thresholds.good) {
      normalizedScore =
        100 -
        ((avgCognitive - thresholds.excellent) / (thresholds.good - thresholds.excellent)) * 20;
    } else if (avgCognitive <= thresholds.acceptable) {
      normalizedScore =
        80 - ((avgCognitive - thresholds.good) / (thresholds.acceptable - thresholds.good)) * 35;
    } else if (avgCognitive <= thresholds.poor) {
      normalizedScore =
        45 -
        ((avgCognitive - thresholds.acceptable) / (thresholds.poor - thresholds.acceptable)) * 30;
    } else {
      normalizedScore = Math.max(0, 15 * Math.exp(-(avgCognitive - thresholds.poor) / 15));
    }

    let severity: Severity;
    if (maxCognitive <= thresholds.good) {
      severity = 'info';
    } else if (maxCognitive <= thresholds.acceptable) {
      severity = 'warning';
    } else if (maxCognitive <= thresholds.poor) {
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
