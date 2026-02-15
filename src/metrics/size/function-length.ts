/**
 * Function length metric
 *
 * Language-specific thresholds based on official linter defaults.
 * See src/metrics/thresholds/language-thresholds.ts for sources.
 */

import type { Metric, MetricResult, MetricCategory, MetricLocation, Severity } from '../types.js';
import type { ParseResult, Language } from '../../parser/types.js';
import { t } from '../../i18n/index.js';
import { getThresholds } from '../thresholds/language-thresholds.js';

export class FunctionLengthMetric implements Metric {
  readonly name = 'function_length';
  readonly category: MetricCategory = 'size';
  readonly weight: number;
  private readonly language: Language;

  constructor(weight: number, language: Language) {
    this.weight = weight;
    this.language = language;
  }

  calculate(parseResult: ParseResult): MetricResult {
    const { functions, filePath } = parseResult;
    const thresholds = getThresholds(this.language, 'functionLength');

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
      if (func.lineCount > thresholds.good) {
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
    if (avgLength <= thresholds.excellent) {
      normalizedScore = 100;
    } else if (avgLength <= thresholds.good) {
      normalizedScore =
        100 - ((avgLength - thresholds.excellent) / (thresholds.good - thresholds.excellent)) * 15;
    } else if (avgLength <= thresholds.acceptable) {
      normalizedScore =
        85 - ((avgLength - thresholds.good) / (thresholds.acceptable - thresholds.good)) * 35;
    } else if (avgLength <= thresholds.poor) {
      normalizedScore =
        50 - ((avgLength - thresholds.acceptable) / (thresholds.poor - thresholds.acceptable)) * 35;
    } else {
      normalizedScore = Math.max(0, 15 * Math.exp(-(avgLength - thresholds.poor) / 50));
    }

    let severity: Severity;
    if (maxLength <= thresholds.good) {
      severity = 'info';
    } else if (maxLength <= thresholds.acceptable) {
      severity = 'warning';
    } else if (maxLength <= thresholds.poor) {
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
