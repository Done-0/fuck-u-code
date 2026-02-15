import { describe, it, expect } from 'vitest';
import { CyclomaticComplexityMetric } from '../../src/metrics/complexity/cyclomatic.js';
import { FunctionLengthMetric } from '../../src/metrics/size/function-length.js';
import { CommentRatioMetric } from '../../src/metrics/documentation/comment-ratio.js';
import type { ParseResult } from '../../src/parser/types.js';

const createMockParseResult = (overrides: Partial<ParseResult> = {}): ParseResult => ({
  filePath: 'test.ts',
  language: 'typescript',
  totalLines: 100,
  codeLines: 80,
  commentLines: 15,
  blankLines: 5,
  functions: [
    {
      name: 'testFunction',
      startLine: 1,
      endLine: 20,
      lineCount: 20,
      complexity: 5,
      parameterCount: 2,
      nestingDepth: 2,
      hasDocstring: true,
    },
  ],
  classes: [],
  imports: [],
  errors: [],
  ...overrides,
});

describe('CyclomaticComplexityMetric', () => {
  const metric = new CyclomaticComplexityMetric(0.3, 'typescript');

  it('should return high score for low complexity', () => {
    const result = metric.calculate(createMockParseResult({
      functions: [
        { name: 'simple', startLine: 1, endLine: 5, lineCount: 5, complexity: 2, parameterCount: 1, nestingDepth: 1, hasDocstring: false },
      ],
    }));

    expect(result.normalizedScore).toBeGreaterThan(90);
    expect(result.severity).toBe('info');
  });

  it('should return low score for high complexity', () => {
    const result = metric.calculate(createMockParseResult({
      functions: [
        { name: 'complex', startLine: 1, endLine: 100, lineCount: 100, complexity: 35, parameterCount: 5, nestingDepth: 5, hasDocstring: false },
      ],
    }));

    expect(result.normalizedScore).toBeLessThan(50);
    expect(['error', 'critical']).toContain(result.severity);
  });

  it('should handle empty functions array', () => {
    const result = metric.calculate(createMockParseResult({ functions: [] }));

    expect(result.normalizedScore).toBe(100);
    expect(result.severity).toBe('info');
  });
});

describe('FunctionLengthMetric', () => {
  const metric = new FunctionLengthMetric(0.2, 'typescript');

  it('should return high score for short functions', () => {
    const result = metric.calculate(createMockParseResult({
      functions: [
        { name: 'short', startLine: 1, endLine: 10, lineCount: 10, complexity: 2, parameterCount: 1, nestingDepth: 1, hasDocstring: false },
      ],
    }));

    expect(result.normalizedScore).toBeGreaterThan(90);
  });

  it('should return low score for long functions', () => {
    const result = metric.calculate(createMockParseResult({
      functions: [
        { name: 'long', startLine: 1, endLine: 200, lineCount: 200, complexity: 10, parameterCount: 3, nestingDepth: 3, hasDocstring: false },
      ],
    }));

    expect(result.normalizedScore).toBeLessThan(85);
  });
});

describe('CommentRatioMetric', () => {
  const metric = new CommentRatioMetric(0.15);

  it('should return high score for optimal comment ratio', () => {
    const result = metric.calculate(createMockParseResult({
      codeLines: 100,
      commentLines: 20,
    }));

    expect(result.normalizedScore).toBe(100);
  });

  it('should return lower score for too few comments', () => {
    const result = metric.calculate(createMockParseResult({
      codeLines: 100,
      commentLines: 2,
    }));

    expect(result.normalizedScore).toBeLessThan(50);
  });

  it('should return lower score for too many comments', () => {
    const result = metric.calculate(createMockParseResult({
      codeLines: 100,
      commentLines: 80,
    }));

    expect(result.normalizedScore).toBeLessThan(50);
  });
});
