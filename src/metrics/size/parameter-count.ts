/**
 * Parameter count metric
 *
 * Language-specific thresholds based on official linter defaults.
 * See src/metrics/thresholds/language-thresholds.ts for sources.
 */

import type { Metric, MetricResult, MetricCategory, MetricLocation, Severity } from '../types.js';
import type { ParseResult, Language } from '../../parser/types.js';
import { t } from '../../i18n/index.js';
import { getThresholds } from '../thresholds/language-thresholds.js';

export class ParameterCountMetric implements Metric {
  readonly name = 'parameter_count';
  readonly category: MetricCategory = 'size';
  readonly weight: number;
  private readonly language: Language;

  constructor(weight: number, language: Language) {
    this.weight = weight;
    this.language = language;
  }

  calculate(parseResult: ParseResult): MetricResult {
    const { functions, filePath } = parseResult;
    const thresholds = getThresholds(this.language, 'parameterCount');

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
      if (func.parameterCount > thresholds.good) {
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
    if (maxParams <= thresholds.excellent) {
      normalizedScore = 100;
    } else if (maxParams <= thresholds.good) {
      normalizedScore =
        100 - ((maxParams - thresholds.excellent) / (thresholds.good - thresholds.excellent)) * 15;
    } else if (maxParams <= thresholds.acceptable) {
      normalizedScore =
        85 - ((maxParams - thresholds.good) / (thresholds.acceptable - thresholds.good)) * 35;
    } else if (maxParams <= thresholds.poor) {
      normalizedScore =
        50 - ((maxParams - thresholds.acceptable) / (thresholds.poor - thresholds.acceptable)) * 35;
    } else {
      normalizedScore = Math.max(0, 15 * Math.exp(-(maxParams - thresholds.poor) / 3));
    }

    let severity: Severity;
    if (maxParams <= thresholds.excellent) {
      severity = 'info';
    } else if (maxParams <= thresholds.good) {
      severity = 'warning';
    } else if (maxParams <= thresholds.acceptable) {
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
