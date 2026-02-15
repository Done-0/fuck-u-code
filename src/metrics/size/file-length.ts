/**
 * File length metric
 *
 * Language-specific thresholds based on official linter defaults.
 * See src/metrics/thresholds/language-thresholds.ts for sources.
 */

import type { Metric, MetricResult, MetricCategory, Severity } from '../types.js';
import type { ParseResult, Language } from '../../parser/types.js';
import { t } from '../../i18n/index.js';
import { getThresholds } from '../thresholds/language-thresholds.js';

export class FileLengthMetric implements Metric {
  readonly name = 'file_length';
  readonly category: MetricCategory = 'size';
  readonly weight: number;
  private readonly language: Language;

  constructor(weight: number, language: Language) {
    this.weight = weight;
    this.language = language;
  }

  calculate(parseResult: ParseResult): MetricResult {
    const { totalLines, codeLines } = parseResult;
    const thresholds = getThresholds(this.language, 'fileLength');

    let normalizedScore: number;
    if (codeLines <= thresholds.excellent) {
      normalizedScore = 100;
    } else if (codeLines <= thresholds.good) {
      normalizedScore =
        100 - ((codeLines - thresholds.excellent) / (thresholds.good - thresholds.excellent)) * 15;
    } else if (codeLines <= thresholds.acceptable) {
      normalizedScore =
        85 - ((codeLines - thresholds.good) / (thresholds.acceptable - thresholds.good)) * 35;
    } else if (codeLines <= thresholds.poor) {
      normalizedScore =
        50 - ((codeLines - thresholds.acceptable) / (thresholds.poor - thresholds.acceptable)) * 35;
    } else {
      normalizedScore = Math.max(0, 15 * Math.exp(-(codeLines - thresholds.poor) / 500));
    }

    let severity: Severity;
    if (codeLines <= thresholds.excellent) {
      severity = 'info';
    } else if (codeLines <= thresholds.good) {
      severity = 'warning';
    } else if (codeLines <= thresholds.acceptable) {
      severity = 'error';
    } else {
      severity = 'critical';
    }

    return {
      name: this.name,
      category: this.category,
      value: codeLines,
      normalizedScore: Math.round(normalizedScore * 10) / 10,
      severity,
      details: t('detail_file_length', { code: codeLines, total: totalLines }),
    };
  }
}
