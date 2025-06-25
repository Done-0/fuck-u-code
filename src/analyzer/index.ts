/**
 * Main analyzer module
 */

import { discoverFiles } from './file-discovery.js';
import { analyzeFilesConcurrently } from './concurrent-analyzer.js';
import { aggregateMetrics } from '../scoring/index.js';
import type { RuntimeConfig } from '../config/schema.js';
import type { ProjectAnalysisResult } from '../metrics/types.js';

export interface AnalyzerCallbacks {
  onDiscoveryStart?: () => void;
  onDiscoveryComplete?: (fileCount: number) => void;
  onAnalysisProgress?: (current: number, total: number) => void;
}

/**
 * Analyzer class for code quality analysis
 */
export class Analyzer {
  private config: RuntimeConfig;
  private callbacks?: AnalyzerCallbacks;

  constructor(config: RuntimeConfig, callbacks?: AnalyzerCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Execute analysis on the project
   */
  async analyze(): Promise<ProjectAnalysisResult> {
    const startTime = Date.now();

    // Discover files
    this.callbacks?.onDiscoveryStart?.();
    const discovery = await discoverFiles(this.config);
    this.callbacks?.onDiscoveryComplete?.(discovery.files.length);

    if (discovery.files.length === 0) {
      return {
        projectPath: this.config.projectPath,
        totalFiles: discovery.totalScanned,
        analyzedFiles: 0,
        skippedFiles: discovery.skippedCount,
        fileResults: [],
        aggregatedMetrics: [],
        overallScore: 100,
        analysisTime: Date.now() - startTime,
      };
    }

    // Analyze files concurrently
    const fileResults = await analyzeFilesConcurrently(
      discovery.files,
      this.config,
      this.callbacks?.onAnalysisProgress
    );

    // Aggregate metrics
    const aggregatedMetrics = aggregateMetrics(fileResults, this.config);

    // Calculate overall score
    const overallScore =
      fileResults.length > 0
        ? fileResults.reduce((sum, r) => sum + r.score, 0) / fileResults.length
        : 100;

    return {
      projectPath: this.config.projectPath,
      totalFiles: discovery.totalScanned,
      analyzedFiles: fileResults.length,
      skippedFiles: discovery.skippedCount,
      fileResults,
      aggregatedMetrics,
      overallScore,
      analysisTime: Date.now() - startTime,
    };
  }
}

/**
 * Create an analyzer instance
 */
export function createAnalyzer(config: RuntimeConfig, callbacks?: AnalyzerCallbacks): Analyzer {
  return new Analyzer(config, callbacks);
}
