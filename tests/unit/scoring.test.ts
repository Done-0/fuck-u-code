import { describe, it, expect } from 'vitest';
import { calculateScore, aggregateMetrics } from '../../src/scoring/index.js';
import type { MetricResult, FileAnalysisResult } from '../../src/metrics/types.js';
import type { RuntimeConfig } from '../../src/config/schema.js';

const createMockConfig = (): RuntimeConfig => ({
  projectPath: '/test',
  exclude: [],
  include: ['**/*'],
  concurrency: 8,
  verbose: false,
  output: {
    format: 'console',
    top: 10,
    maxIssues: 100,
    showDetails: true,
  },
  metrics: {
    weights: {
      complexity: 0.3,
      size: 0.2,
      duplication: 0.15,
      documentation: 0.15,
      naming: 0.1,
      structure: 0.1,
      error: 0.0,
    },
  },
  ai: {
    enabled: false,
  },
  i18n: {
    locale: 'en',
  },
});

const createMockMetricResult = (overrides: Partial<MetricResult> = {}): MetricResult => ({
  name: 'test_metric',
  category: 'complexity',
  value: 5,
  normalizedScore: 80,
  severity: 'info',
  ...overrides,
});

describe('calculateScore', () => {
  const config = createMockConfig();

  it('should return 100 for empty metrics', () => {
    const score = calculateScore([], config);
    expect(score).toBe(100);
  });

  it('should calculate weighted average', () => {
    const metrics: MetricResult[] = [
      createMockMetricResult({ category: 'complexity', normalizedScore: 100 }),
      createMockMetricResult({ category: 'size', normalizedScore: 50 }),
    ];

    const score = calculateScore(metrics, config);
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThan(100);
  });

  it('should weight complexity higher than size', () => {
    const highComplexity: MetricResult[] = [
      createMockMetricResult({ category: 'complexity', normalizedScore: 100 }),
      createMockMetricResult({ category: 'size', normalizedScore: 0 }),
    ];

    const highSize: MetricResult[] = [
      createMockMetricResult({ category: 'complexity', normalizedScore: 0 }),
      createMockMetricResult({ category: 'size', normalizedScore: 100 }),
    ];

    const scoreHighComplexity = calculateScore(highComplexity, config);
    const scoreHighSize = calculateScore(highSize, config);

    expect(scoreHighComplexity).toBeGreaterThan(scoreHighSize);
  });
});

describe('aggregateMetrics', () => {
  const config = createMockConfig();

  it('should return empty array for no files', () => {
    const result = aggregateMetrics([], config);
    expect(result).toEqual([]);
  });

  it('should aggregate metrics across files', () => {
    const fileResults: FileAnalysisResult[] = [
      {
        filePath: 'file1.ts',
        parseResult: {
          filePath: 'file1.ts',
          language: 'typescript',
          totalLines: 100,
          codeLines: 80,
          commentLines: 10,
          blankLines: 10,
          functions: [],
          classes: [],
          imports: [],
          errors: [],
        },
        metrics: [
          createMockMetricResult({ name: 'complexity', normalizedScore: 80 }),
        ],
        score: 80,
      },
      {
        filePath: 'file2.ts',
        parseResult: {
          filePath: 'file2.ts',
          language: 'typescript',
          totalLines: 50,
          codeLines: 40,
          commentLines: 5,
          blankLines: 5,
          functions: [],
          classes: [],
          imports: [],
          errors: [],
        },
        metrics: [
          createMockMetricResult({ name: 'complexity', normalizedScore: 60 }),
        ],
        score: 60,
      },
    ];

    const result = aggregateMetrics(fileResults, config);

    expect(result.length).toBe(1);
    expect(result[0]?.name).toBe('complexity');
    expect(result[0]?.average).toBe(70);
    expect(result[0]?.min).toBe(60);
    expect(result[0]?.max).toBe(80);
  });
});
