/**
 * Nesting depth metric
 *
 * Language-specific thresholds based on official linter defaults.
 * See src/metrics/thresholds/language-thresholds.ts for sources.
 */

import type { Metric, MetricResult, MetricCategory, MetricLocation, Severity } from '../types.js';
import type { ParseResult, Language } from '../../parser/types.js';
import { t } from '../../i18n/index.js';
import { getThresholds } from '../thresholds/language-thresholds.js';

export class NestingDepthMetric implements Metric {
  readonly name = 'nesting_depth';
  readonly category: MetricCategory = 'complexity';
  readonly weight: number;
  private readonly language: Language;

  constructor(weight: number, language: Language) {
    this.weight = weight;
    this.language = language;
  }

  calculate(parseResult: ParseResult): MetricResult {
    const { functions, filePath } = parseResult;
    const thresholds = getThresholds(this.language, 'nestingDepth');

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
      if (func.nestingDepth > thresholds.excellent) {
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
    if (maxDepth <= thresholds.excellent) {
      normalizedScore = 100;
    } else if (maxDepth <= thresholds.good) {
      normalizedScore =
        100 - ((maxDepth - thresholds.excellent) / (thresholds.good - thresholds.excellent)) * 20;
    } else if (maxDepth <= thresholds.acceptable) {
      normalizedScore =
        80 - ((maxDepth - thresholds.good) / (thresholds.acceptable - thresholds.good)) * 35;
    } else if (maxDepth <= thresholds.poor) {
      normalizedScore =
        45 - ((maxDepth - thresholds.acceptable) / (thresholds.poor - thresholds.acceptable)) * 30;
    } else {
      normalizedScore = Math.max(0, 15 * Math.exp(-(maxDepth - thresholds.poor) / 3));
    }

    let severity: Severity;
    if (maxDepth <= thresholds.excellent) {
      severity = 'info';
    } else if (maxDepth <= thresholds.good) {
      severity = 'warning';
    } else if (maxDepth <= thresholds.acceptable) {
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
