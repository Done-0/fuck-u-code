/**
 * Code duplication metric
 *
 * Detects duplicate code by analyzing control flow signature patterns.
 *
 * Industry thresholds (based on SonarQube, PMD CPD):
 * - 0-5%: Excellent, minimal duplication
 * - 5-10%: Good, acceptable level
 * - 10-20%: Moderate, consider refactoring
 * - 20%+: Poor, significant duplication
 */

import type { Metric, MetricResult, MetricCategory, MetricLocation, Severity } from '../types.js';
import type { ParseResult, FunctionInfo } from '../../parser/types.js';
import { t } from '../../i18n/index.js';

const THRESHOLDS = {
  EXCELLENT: 5,
  GOOD: 10,
  ACCEPTABLE: 20,
  POOR: 35,
} as const;

const MIN_SIGNATURE_LENGTH = 4;

export class CodeDuplicationMetric implements Metric {
  readonly name = 'code_duplication';
  readonly category: MetricCategory = 'duplication';
  readonly weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  calculate(parseResult: ParseResult): MetricResult {
    const { functions, filePath, content } = parseResult;

    if (functions.length < 3 || !content) {
      return {
        name: this.name,
        category: this.category,
        value: 0,
        normalizedScore: 100,
        severity: 'info',
        details: t('detail_no_functions'),
      };
    }

    const signatureMap = this.buildSignatureMap(functions, content);
    const { duplicateCount, locations } = this.findDuplicates(signatureMap, filePath);
    const duplicationPercent = (duplicateCount / functions.length) * 100;

    let normalizedScore: number;
    if (duplicationPercent <= THRESHOLDS.EXCELLENT) {
      normalizedScore = 100;
    } else if (duplicationPercent <= THRESHOLDS.GOOD) {
      normalizedScore =
        100 -
        ((duplicationPercent - THRESHOLDS.EXCELLENT) / (THRESHOLDS.GOOD - THRESHOLDS.EXCELLENT)) *
          20;
    } else if (duplicationPercent <= THRESHOLDS.ACCEPTABLE) {
      normalizedScore =
        80 -
        ((duplicationPercent - THRESHOLDS.GOOD) / (THRESHOLDS.ACCEPTABLE - THRESHOLDS.GOOD)) * 35;
    } else if (duplicationPercent <= THRESHOLDS.POOR) {
      normalizedScore =
        45 -
        ((duplicationPercent - THRESHOLDS.ACCEPTABLE) / (THRESHOLDS.POOR - THRESHOLDS.ACCEPTABLE)) *
          30;
    } else {
      normalizedScore = Math.max(0, 15 * Math.exp(-(duplicationPercent - THRESHOLDS.POOR) / 20));
    }

    let severity: Severity;
    if (duplicationPercent <= THRESHOLDS.EXCELLENT) {
      severity = 'info';
    } else if (duplicationPercent <= THRESHOLDS.GOOD) {
      severity = 'warning';
    } else if (duplicationPercent <= THRESHOLDS.ACCEPTABLE) {
      severity = 'error';
    } else {
      severity = 'critical';
    }

    return {
      name: this.name,
      category: this.category,
      value: duplicationPercent,
      normalizedScore: Math.round(normalizedScore * 10) / 10,
      severity,
      details: t('detail_duplication', {
        percent: duplicationPercent.toFixed(1),
        duplicates: duplicateCount,
        total: functions.length,
      }),
      locations: locations.length > 0 ? locations : undefined,
    };
  }

  private buildSignatureMap(
    functions: FunctionInfo[],
    content: string
  ): Map<string, FunctionInfo[]> {
    const signatureMap = new Map<string, FunctionInfo[]>();
    const lines = content.split('\n');

    for (const func of functions) {
      const signature = this.extractControlFlowSignature(func, lines);
      if (signature.length < MIN_SIGNATURE_LENGTH) continue;

      const existing = signatureMap.get(signature);
      if (existing) {
        existing.push(func);
      } else {
        signatureMap.set(signature, [func]);
      }
    }

    return signatureMap;
  }

  private extractControlFlowSignature(func: FunctionInfo, lines: string[]): string {
    const signature: string[] = [];
    const startIdx = func.startLine - 1;
    const endIdx = Math.min(func.endLine, lines.length);

    for (let i = startIdx; i < endIdx; i++) {
      const line = lines[i];
      if (!line) continue;

      const trimmed = line.trim();
      if (!trimmed) continue;

      if (/^if\s*\(/.test(trimmed) || /^}\s*else\s+if\s*\(/.test(trimmed)) {
        signature.push('I');
      } else if (/^for\s*[\s(]/.test(trimmed)) {
        signature.push('F');
      } else if (/^while\s*\(/.test(trimmed)) {
        signature.push('W');
      } else if (/^switch\s*\(/.test(trimmed)) {
        signature.push('S');
      } else if (/^case\s+/.test(trimmed)) {
        signature.push('C');
      } else if (/^return\b/.test(trimmed)) {
        signature.push('R');
      } else if (
        /^(const|let|var)\s+\w/.test(trimmed) ||
        (trimmed.includes('=') && !/[=!<>]=/.test(trimmed))
      ) {
        signature.push('A');
      }
    }

    return signature.join('');
  }

  private findDuplicates(
    signatureMap: Map<string, FunctionInfo[]>,
    filePath: string
  ): { duplicateCount: number; locations: MetricLocation[] } {
    const locations: MetricLocation[] = [];
    let duplicateCount = 0;

    for (const [, group] of signatureMap.entries()) {
      if (group.length > 1) {
        duplicateCount += group.length - 1;
        const funcNames = group.map((f) => f.name).join(', ');
        const firstFunc = group[0];
        if (firstFunc) {
          locations.push({
            filePath,
            line: firstFunc.startLine,
            functionName: firstFunc.name,
            message: t('issue_duplicate_pattern', { names: funcNames }),
          });
        }
      }
    }

    return { duplicateCount, locations };
  }
}
