/**
 * JSON output formatter
 */

import type { ProjectAnalysisResult } from '../../metrics/types.js';

export class JsonOutput {
  render(result: ProjectAnalysisResult): string {
    return JSON.stringify(
      {
        projectPath: result.projectPath,
        overallScore: result.overallScore,
        summary: {
          totalFiles: result.totalFiles,
          analyzedFiles: result.analyzedFiles,
          skippedFiles: result.skippedFiles,
          analysisTime: result.analysisTime,
        },
        aggregatedMetrics: result.aggregatedMetrics.map((m) => ({
          name: m.name,
          category: m.category,
          average: m.average,
          min: m.min,
          max: m.max,
          median: m.median,
        })),
        files: result.fileResults.map((f) => ({
          path: f.filePath,
          score: f.score,
          metrics: f.metrics.map((m) => ({
            name: m.name,
            category: m.category,
            value: m.value,
            normalizedScore: m.normalizedScore,
            severity: m.severity,
            details: m.details,
          })),
          parseResult: {
            language: f.parseResult.language,
            totalLines: f.parseResult.totalLines,
            codeLines: f.parseResult.codeLines,
            commentLines: f.parseResult.commentLines,
            functionCount: f.parseResult.functions.length,
            classCount: f.parseResult.classes.length,
          },
        })),
      },
      null,
      2
    );
  }
}
