/**
 * Shared statistics aggregation utilities for output renderers.
 * Extracted to avoid duplication across console/markdown/html outputs.
 */

import type { ProjectAnalysisResult } from '../../metrics/types.js';

/** Aggregated project-level statistics */
export interface ProjectStats {
  totalCodeLines: number;
  totalCommentLines: number;
  totalLines: number;
  commentRatio: string;
  avgFileSize: number;
  largestFile: string;
  largestFileLines: number;
  languageCounts: [lang: string, count: number][];
}

/** Function entry collected across all files, sorted by complexity */
export interface RankedFunction {
  name: string;
  filePath: string;
  complexity: number;
  nestingDepth: number;
  lineCount: number;
}

/**
 * Aggregate project-level statistics from file results.
 * Used by verbose mode in console, markdown, and HTML outputs.
 */
export function aggregateProjectStats(result: ProjectAnalysisResult): ProjectStats {
  let totalCodeLines = 0;
  let totalCommentLines = 0;
  let totalLines = 0;
  let largestFile = '';
  let largestFileLines = 0;
  const langMap: Record<string, number> = {};

  for (const file of result.fileResults) {
    const pr = file.parseResult;
    totalCodeLines += pr.codeLines;
    totalCommentLines += pr.commentLines;
    totalLines += pr.totalLines;

    if (pr.totalLines > largestFileLines) {
      largestFileLines = pr.totalLines;
      largestFile = file.filePath;
    }

    const lang = pr.language as string;
    if (lang && lang !== 'unknown') {
      langMap[lang] = (langMap[lang] || 0) + 1;
    }
  }

  const commentRatio =
    totalCodeLines > 0 ? ((totalCommentLines / totalCodeLines) * 100).toFixed(1) : '0.0';
  const avgFileSize =
    result.fileResults.length > 0 ? Math.round(totalLines / result.fileResults.length) : 0;

  return {
    totalCodeLines,
    totalCommentLines,
    totalLines,
    commentRatio,
    avgFileSize,
    largestFile,
    largestFileLines,
    languageCounts: Object.entries(langMap).sort((a, b) => b[1] - a[1]),
  };
}

/**
 * Collect all functions across files, sorted by complexity descending.
 * Returns the top N entries (default 10).
 */
export function collectWorstFunctions(result: ProjectAnalysisResult, limit = 10): RankedFunction[] {
  const all: RankedFunction[] = [];

  for (const file of result.fileResults) {
    for (const fn of file.parseResult.functions) {
      all.push({
        name: fn.name,
        filePath: file.filePath,
        complexity: fn.complexity,
        nestingDepth: fn.nestingDepth,
        lineCount: fn.lineCount,
      });
    }
  }

  all.sort((a, b) => b.complexity - a.complexity);
  return all.slice(0, limit);
}
