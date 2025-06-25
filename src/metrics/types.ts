/**
 * Metrics system type definitions
 */

import type { ParseResult } from '../parser/types.js';

/** Metric category */
export type MetricCategory =
  | 'complexity'
  | 'size'
  | 'duplication'
  | 'documentation'
  | 'naming'
  | 'structure'
  | 'error';

/** Metric severity level */
export type Severity = 'info' | 'warning' | 'error' | 'critical';

/** Single metric result */
export interface MetricResult {
  name: string;
  category: MetricCategory;
  value: number;
  normalizedScore: number; // 0-100, 100 is best
  severity: Severity;
  details?: string;
  locations?: MetricLocation[];
}

/** Metric location information */
export interface MetricLocation {
  filePath: string;
  line: number;
  column?: number;
  functionName?: string;
  message: string;
}

/** Metric interface */
export interface Metric {
  name: string;
  category: MetricCategory;
  weight: number;
  calculate(parseResult: ParseResult): MetricResult;
}

/** File analysis result */
export interface FileAnalysisResult {
  filePath: string;
  parseResult: ParseResult;
  metrics: MetricResult[];
  score: number; // 0-100, 100 is best
}

/** Project analysis result */
export interface ProjectAnalysisResult {
  projectPath: string;
  totalFiles: number;
  analyzedFiles: number;
  skippedFiles: number;
  fileResults: FileAnalysisResult[];
  aggregatedMetrics: AggregatedMetric[];
  overallScore: number;
  analysisTime: number; // milliseconds
}

/** Aggregated metric */
export interface AggregatedMetric {
  name: string;
  category: MetricCategory;
  average: number;
  min: number;
  max: number;
  median: number;
  weight: number;
}

/** Metric thresholds configuration */
export interface MetricThresholds {
  excellent: number;
  good: number;
  acceptable: number;
  poor: number;
}

/** Language-specific thresholds */
export type LanguageThresholds = Record<string, MetricThresholds>;
