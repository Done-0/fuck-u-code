/**
 * Structure analysis metric
 *
 * Analyzes code structure quality across multiple dimensions.
 *
 * Industry thresholds (SonarQube, Clean Code):
 * - Nesting: >=5 problematic, >=3 needs attention
 * - File size: >1000 lines large, >500 needs review
 * - Functions: >50 per file too many, >30 needs attention
 * - Imports: >20 high coupling, >15 needs attention
 */

import type { Metric, MetricResult, MetricCategory, MetricLocation, Severity } from '../types.js';
import type { ParseResult } from '../../parser/types.js';
import { t } from '../../i18n/index.js';

const THRESHOLDS = {
  NESTING_HIGH: 5,
  NESTING_MEDIUM: 3,
  FILE_LARGE: 1000,
  FILE_MEDIUM: 500,
  FUNCTIONS_HIGH: 50,
  FUNCTIONS_MEDIUM: 30,
  IMPORTS_HIGH: 20,
  IMPORTS_MEDIUM: 15,
} as const;

export class StructureAnalysisMetric implements Metric {
  readonly name = 'structure_analysis';
  readonly category: MetricCategory = 'structure';
  readonly weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  calculate(parseResult: ParseResult): MetricResult {
    const { functions, totalLines, filePath, content } = parseResult;

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

    if (!content) {
      return this.calculateSimplified(parseResult);
    }

    let deepNesting = 0;
    let mediumNesting = 0;
    const locations: MetricLocation[] = [];

    for (const func of functions) {
      if (func.nestingDepth >= THRESHOLDS.NESTING_HIGH) {
        deepNesting++;
        locations.push({
          filePath,
          line: func.startLine,
          functionName: func.name,
          message: t('issue_high_nesting', { depth: func.nestingDepth }),
        });
      } else if (func.nestingDepth >= THRESHOLDS.NESTING_MEDIUM) {
        mediumNesting++;
        locations.push({
          filePath,
          line: func.startLine,
          functionName: func.name,
          message: t('issue_medium_nesting', { depth: func.nestingDepth }),
        });
      }
    }

    const largeFile = totalLines > THRESHOLDS.FILE_LARGE;
    const mediumFile = totalLines > THRESHOLDS.FILE_MEDIUM && !largeFile;
    const tooManyFunctions = functions.length > THRESHOLDS.FUNCTIONS_HIGH;
    const manyFunctions = functions.length > THRESHOLDS.FUNCTIONS_MEDIUM && !tooManyFunctions;

    const importCount = this.countImports(content);
    const tooManyImports = importCount > THRESHOLDS.IMPORTS_HIGH;
    const manyImports = importCount > THRESHOLDS.IMPORTS_MEDIUM && !tooManyImports;

    const circularCount = this.detectCircular(content);

    if (largeFile) {
      locations.push({
        filePath,
        line: 1,
        message: t('issue_file_too_large', { lines: totalLines }),
      });
    }
    if (tooManyFunctions) {
      locations.push({
        filePath,
        line: 1,
        message: t('issue_too_many_functions', { count: functions.length }),
      });
    }
    if (tooManyImports) {
      locations.push({
        filePath,
        line: 1,
        message: t('issue_too_many_imports', { count: importCount }),
      });
    }
    if (circularCount > 0) {
      locations.push({
        filePath,
        line: 1,
        message: t('issue_circular_deps', { count: circularCount }),
      });
    }

    // Weighted scoring: nesting 60%, file organization 25%, imports 15%
    let nestingScore = 100 - deepNesting * 15 - mediumNesting * 5;
    nestingScore = Math.max(0, nestingScore);

    let fileScore = 100;
    if (largeFile) fileScore -= 40;
    else if (mediumFile) fileScore -= 20;
    if (tooManyFunctions) fileScore -= 40;
    else if (manyFunctions) fileScore -= 20;
    fileScore = Math.max(0, fileScore);

    let importScore = 100;
    if (tooManyImports) importScore -= 50;
    else if (manyImports) importScore -= 25;
    if (circularCount > 0) importScore -= circularCount * 30;
    importScore = Math.max(0, importScore);

    const normalizedScore = nestingScore * 0.6 + fileScore * 0.25 + importScore * 0.15;

    let severity: Severity;
    if (circularCount > 0 || deepNesting >= 3) {
      severity = 'critical';
    } else if (largeFile || tooManyFunctions || tooManyImports || deepNesting > 0) {
      severity = 'error';
    } else if (mediumFile || manyFunctions || manyImports || mediumNesting > 0) {
      severity = 'warning';
    } else {
      severity = 'info';
    }

    const totalIssues =
      deepNesting +
      mediumNesting +
      (largeFile ? 1 : 0) +
      (tooManyFunctions ? 1 : 0) +
      (tooManyImports ? 1 : 0) +
      circularCount;

    return {
      name: this.name,
      category: this.category,
      value: totalIssues,
      normalizedScore: Math.round(normalizedScore * 10) / 10,
      severity,
      details: t('detail_structure_issues', { count: totalIssues }),
      locations: locations.length > 0 ? locations : undefined,
    };
  }

  private calculateSimplified(parseResult: ParseResult): MetricResult {
    const { functions, totalLines } = parseResult;

    let deepNesting = 0;
    for (const func of functions) {
      if (func.nestingDepth >= THRESHOLDS.NESTING_HIGH) deepNesting++;
    }

    const largeFile = totalLines > THRESHOLDS.FILE_LARGE;
    const tooManyFunctions = functions.length > THRESHOLDS.FUNCTIONS_HIGH;
    const totalIssues = deepNesting + (largeFile ? 1 : 0) + (tooManyFunctions ? 1 : 0);
    const score = 100 - deepNesting * 15 - (largeFile ? 15 : 0) - (tooManyFunctions ? 15 : 0);

    return {
      name: this.name,
      category: this.category,
      value: totalIssues,
      normalizedScore: Math.max(0, Math.round(score * 10) / 10),
      severity: totalIssues > 3 ? 'error' : totalIssues > 0 ? 'warning' : 'info',
      details: t('detail_structure_issues', { count: totalIssues }),
    };
  }

  private countImports(content: string): number {
    const lines = content.split('\n');
    let count = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        /^import\s+/.test(trimmed) ||
        /^from\s+.*\s+import\s+/.test(trimmed) ||
        /^#include\s+/.test(trimmed) ||
        /^using\s+/.test(trimmed) ||
        /\brequire\s*\(/.test(trimmed)
      ) {
        count++;
      }
    }

    return count;
  }

  private detectCircular(content: string): number {
    const lines = content.split('\n');
    let moduleName = '';

    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i]?.trim();
      if (!line) continue;

      const packageMatch = /^package\s+(\w+)/.exec(line);
      const moduleMatch = /^module\s+['"]([^'"]+)['"]/.exec(line);
      if (packageMatch?.[1]) {
        moduleName = packageMatch[1];
        break;
      }
      if (moduleMatch?.[1]) {
        moduleName = moduleMatch[1];
        break;
      }
    }

    if (!moduleName) return 0;

    let count = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        (/^import\s+/.test(trimmed) ||
          /^from\s+/.test(trimmed) ||
          /\brequire\s*\(/.test(trimmed)) &&
        trimmed.includes(moduleName)
      ) {
        count++;
      }
    }

    return count;
  }
}
