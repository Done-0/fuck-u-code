/**
 * Cyclomatic complexity metric
 *
 * Language-specific thresholds based on official linter defaults.
 * See src/metrics/thresholds/language-thresholds.ts for sources.
 *
 * Formula: CC = 1 + (if) + (loops) + (case) + (catch) + (&&/||) + (ternary)
 */

import type { Metric, MetricResult, MetricCategory, MetricLocation, Severity } from '../types.js';
import type { ParseResult, Language } from '../../parser/types.js';
import { t } from '../../i18n/index.js';
import { getThresholds } from '../thresholds/language-thresholds.js';

export class CyclomaticComplexityMetric implements Metric {
  readonly name = 'cyclomatic_complexity';
  readonly category: MetricCategory = 'complexity';
  readonly weight: number;
  private readonly language: Language;

  constructor(weight: number, language: Language) {
    this.weight = weight;
    this.language = language;
  }

  calculate(parseResult: ParseResult): MetricResult {
    const { functions, filePath } = parseResult;
    const thresholds = getThresholds(this.language, 'cyclomaticComplexity');

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

    let totalComplexity = 0;
    let maxComplexity = 0;
    const locations: MetricLocation[] = [];

    for (const func of functions) {
      totalComplexity += func.complexity;
      if (func.complexity > maxComplexity) {
        maxComplexity = func.complexity;
      }
      if (func.complexity > thresholds.good) {
        locations.push({
          filePath,
          line: func.startLine,
          functionName: func.name,
          message: `${t('complexity')}: ${func.complexity}`,
        });
      }
    }

    const avgComplexity = totalComplexity / functions.length;

    let avgScore: number;
    if (avgComplexity <= thresholds.excellent) {
      avgScore = 100;
    } else if (avgComplexity <= thresholds.good) {
      avgScore =
        100 -
        ((avgComplexity - thresholds.excellent) / (thresholds.good - thresholds.excellent)) * 20;
    } else if (avgComplexity <= thresholds.acceptable) {
      avgScore =
        80 - ((avgComplexity - thresholds.good) / (thresholds.acceptable - thresholds.good)) * 30;
    } else if (avgComplexity <= thresholds.poor) {
      avgScore =
        50 -
        ((avgComplexity - thresholds.acceptable) / (thresholds.poor - thresholds.acceptable)) * 50;
    } else {
      avgScore = 0;
    }

    let maxScore: number;
    if (maxComplexity <= thresholds.excellent) {
      maxScore = 100;
    } else if (maxComplexity <= thresholds.good) {
      maxScore =
        100 -
        ((maxComplexity - thresholds.excellent) / (thresholds.good - thresholds.excellent)) * 20;
    } else if (maxComplexity <= thresholds.acceptable) {
      maxScore =
        80 - ((maxComplexity - thresholds.good) / (thresholds.acceptable - thresholds.good)) * 30;
    } else if (maxComplexity <= thresholds.poor) {
      maxScore =
        50 -
        ((maxComplexity - thresholds.acceptable) / (thresholds.poor - thresholds.acceptable)) * 50;
    } else {
      maxScore = 0;
    }

    const normalizedScore = avgScore * 0.5 + maxScore * 0.5;

    let severity: Severity;
    if (maxComplexity <= thresholds.good) {
      severity = 'info';
    } else if (maxComplexity <= thresholds.acceptable) {
      severity = 'warning';
    } else if (maxComplexity <= thresholds.poor) {
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
