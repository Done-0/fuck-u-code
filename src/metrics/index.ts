/**
 * Metrics factory and exports
 */

import { CyclomaticComplexityMetric } from './complexity/cyclomatic.js';
import { CognitiveComplexityMetric } from './complexity/cognitive.js';
import { NestingDepthMetric } from './complexity/nesting-depth.js';
import { FunctionLengthMetric } from './size/function-length.js';
import { FileLengthMetric } from './size/file-length.js';
import { ParameterCountMetric } from './size/parameter-count.js';
import { CommentRatioMetric } from './documentation/comment-ratio.js';
import { NamingConventionMetric } from './naming/convention.js';
import { CodeDuplicationMetric } from './duplication/code-duplication.js';
import { ErrorHandlingMetric } from './error/error-handling.js';
import { StructureAnalysisMetric } from './structure/structure-analysis.js';
import type { Metric } from './types.js';
import type { RuntimeConfig } from '../config/schema.js';
import type { Language } from '../parser/types.js';

/**
 * Create all metrics with configured weights and language-specific thresholds
 *
 * Weight distribution based on industry standards (SonarQube, CodeClimate, NASA, Microsoft):
 * - Complexity: 32% (3 metrics, each gets 32%/3 = 10.67%)
 * - Duplication: 20% (1 metric)
 * - Size: 18% (3 metrics, each gets 18%/3 = 6%)
 * - Structure: 12% (1 metric)
 * - Error: 8% (1 metric)
 * - Documentation: 5% (1 metric)
 * - Naming: 5% (1 metric)
 * Total: 100%
 */
export function createMetrics(config: RuntimeConfig, language: Language): Metric[] {
  const weights = config.metrics.weights;

  const complexityWeight = weights.complexity;
  const complexityMetricsCount = 3;
  const complexityPerMetric = complexityWeight / complexityMetricsCount;

  const sizeWeight = weights.size;
  const sizeMetricsCount = 3;
  const sizePerMetric = sizeWeight / sizeMetricsCount;

  return [
    new CyclomaticComplexityMetric(complexityPerMetric, language),
    new CognitiveComplexityMetric(complexityPerMetric, language),
    new NestingDepthMetric(complexityPerMetric, language),
    new FunctionLengthMetric(sizePerMetric, language),
    new FileLengthMetric(sizePerMetric, language),
    new ParameterCountMetric(sizePerMetric, language),
    new CodeDuplicationMetric(weights.duplication),
    new StructureAnalysisMetric(weights.structure),
    new ErrorHandlingMetric(weights.error),
    new CommentRatioMetric(weights.documentation),
    new NamingConventionMetric(weights.naming),
  ];
}

export type { Metric, MetricResult, MetricCategory, Severity } from './types.js';
