/**
 * Scoring system
 */

import type { MetricResult, FileAnalysisResult, AggregatedMetric } from '../metrics/types.js';
import type { RuntimeConfig } from '../config/schema.js';

/**
 * Calculate weighted score from metric results
 */
export function calculateScore(metrics: MetricResult[], config: RuntimeConfig): number {
  if (metrics.length === 0) return 100;

  const weights = config.metrics.weights;
  let totalWeight = 0;
  let weightedSum = 0;

  for (const metric of metrics) {
    const categoryWeight = getCategoryWeight(metric.category, weights);
    totalWeight += categoryWeight;
    weightedSum += metric.normalizedScore * categoryWeight;
  }

  if (totalWeight === 0) return 100;
  return weightedSum / totalWeight;
}

/**
 * Aggregate metrics across all files
 */
export function aggregateMetrics(
  fileResults: FileAnalysisResult[],
  config: RuntimeConfig
): AggregatedMetric[] {
  if (fileResults.length === 0) return [];

  const metricGroups = new Map<string, { values: number[]; category: string; weight: number }>();

  for (const file of fileResults) {
    for (const metric of file.metrics) {
      const existing = metricGroups.get(metric.name);
      if (existing) {
        existing.values.push(metric.normalizedScore);
      } else {
        const weights = config.metrics.weights;
        metricGroups.set(metric.name, {
          values: [metric.normalizedScore],
          category: metric.category,
          weight: getCategoryWeight(metric.category, weights),
        });
      }
    }
  }

  const aggregated: AggregatedMetric[] = [];

  for (const [name, data] of metricGroups) {
    const sorted = [...data.values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    aggregated.push({
      name,
      category: data.category as AggregatedMetric['category'],
      average: sum / sorted.length,
      min: sorted[0] ?? 0,
      max: sorted[sorted.length - 1] ?? 0,
      median: getMedian(sorted),
      weight: data.weight,
    });
  }

  return aggregated;
}

function getCategoryWeight(category: string, weights: Record<string, number | undefined>): number {
  const defaultWeights: Record<string, number> = {
    complexity: 0.32, // 32% - Highest priority, strongest correlation with defects (0.7-0.8)
    duplication: 0.2, // 20% - Second priority, impacts maintenance cost significantly
    size: 0.18, // 18% - Code size and structure
    structure: 0.12, // 12% - Nesting depth, file organization
    error: 0.08, // 8%  - Error handling patterns
    documentation: 0.05, // 5%  - Comment ratio
    naming: 0.05, // 5%  - Naming conventions
  };

  return weights[category] ?? defaultWeights[category] ?? 0.1;
}

function getMedian(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }
  return sorted[mid] ?? 0;
}
