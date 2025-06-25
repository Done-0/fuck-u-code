/**
 * Naming convention metric
 *
 * Checks if identifiers follow language-specific naming conventions.
 * Based on official style guides:
 * - Go: Effective Go
 * - JavaScript/TypeScript: Airbnb Style Guide
 * - Python: PEP 8
 * - Java: Oracle Code Conventions
 * - Rust: Rust API Guidelines
 * - C#: Microsoft Naming Guidelines
 */

import type { Metric, MetricResult, MetricCategory, MetricLocation, Severity } from '../types.js';
import type { ParseResult, Language } from '../../parser/types.js';
import { t } from '../../i18n/index.js';

// Naming patterns
const PATTERNS = {
  camelCase: /^[a-z][a-zA-Z0-9]*$/,
  PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
  snake_case: /^[a-z][a-z0-9_]*$/,
  UPPER_SNAKE_CASE: /^[A-Z][A-Z0-9_]*$/,
} as const;

// Language-specific function naming rules
const FUNCTION_RULES: Record<Language, (keyof typeof PATTERNS)[]> = {
  go: ['PascalCase', 'camelCase'],
  javascript: ['camelCase', 'PascalCase'],
  typescript: ['camelCase', 'PascalCase'],
  python: ['snake_case'],
  java: ['camelCase'],
  c: ['snake_case', 'camelCase'],
  cpp: ['camelCase', 'snake_case', 'PascalCase'],
  rust: ['snake_case'],
  csharp: ['PascalCase'],
  lua: ['camelCase', 'snake_case'],
  unknown: ['camelCase', 'snake_case', 'PascalCase'],
};

export class NamingConventionMetric implements Metric {
  readonly name = 'naming_convention';
  readonly category: MetricCategory = 'naming';
  readonly weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  calculate(parseResult: ParseResult): MetricResult {
    const { functions, classes, language, filePath } = parseResult;
    const allowedRules = FUNCTION_RULES[language];

    let violations = 0;
    let total = 0;
    const locations: MetricLocation[] = [];

    // Check function names
    for (const func of functions) {
      total++;
      let matches = false;
      for (const ruleName of allowedRules) {
        if (PATTERNS[ruleName].test(func.name)) {
          matches = true;
          break;
        }
      }
      if (!matches) {
        violations++;
        locations.push({
          filePath,
          line: func.startLine,
          functionName: func.name,
          message: `"${func.name}" - ${allowedRules.join('/')}`,
        });
      }
    }

    // Check class names
    for (const cls of classes) {
      total++;
      if (!PATTERNS.PascalCase.test(cls.name)) {
        violations++;
        locations.push({
          filePath,
          line: cls.startLine,
          message: `"${cls.name}" - PascalCase`,
        });
      }
    }

    if (total === 0) {
      return {
        name: this.name,
        category: this.category,
        value: 100,
        normalizedScore: 100,
        severity: 'info',
        details: t('detail_no_violations'),
      };
    }

    const complianceRate = ((total - violations) / total) * 100;

    let severity: Severity;
    if (complianceRate >= 90) {
      severity = 'info';
    } else if (complianceRate >= 70) {
      severity = 'warning';
    } else if (complianceRate >= 50) {
      severity = 'error';
    } else {
      severity = 'critical';
    }

    return {
      name: this.name,
      category: this.category,
      value: complianceRate,
      normalizedScore: Math.round(complianceRate * 10) / 10,
      severity,
      details:
        violations > 0
          ? t('detail_violations', { count: String(violations) })
          : t('detail_no_violations'),
      locations: locations.length > 0 ? locations.slice(0, 10) : undefined,
    };
  }
}
