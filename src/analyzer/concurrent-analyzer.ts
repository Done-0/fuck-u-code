/**
 * Concurrent file analyzer
 */

import pLimit from 'p-limit';
import { readFileContent, getFileSize } from '../utils/fs.js';
import { createParser } from '../parser/index.js';
import { createMetrics } from '../metrics/index.js';
import { calculateScore } from '../scoring/index.js';
import { t } from '../i18n/index.js';
import { logger } from '../utils/logger.js';
import type { DiscoveredFile } from './file-discovery.js';
import type { FileAnalysisResult } from '../metrics/types.js';
import type { RuntimeConfig } from '../config/schema.js';
import type { ParseResult, Parser } from '../parser/types.js';

const MAX_FILE_SIZE_KB = 500;

/**
 * Analyze files concurrently with configurable parallelism
 */
export async function analyzeFilesConcurrently(
  files: DiscoveredFile[],
  config: RuntimeConfig,
  onProgress?: (current: number, total: number) => void
): Promise<FileAnalysisResult[]> {
  const concurrency = config.concurrency || 2;
  const limit = pLimit(concurrency);

  let completed = 0;
  const total = files.length;

  const tasks = files.map((file) =>
    limit(async (): Promise<FileAnalysisResult | null> => {
      try {
        const result = await analyzeFile(file, config);
        completed++;
        onProgress?.(completed, total);
        return result;
      } catch (error) {
        logger.warn(t('warn_analyze_failed', { file: file.relativePath, error: String(error) }));
        if (config.verbose && error instanceof Error) {
          console.error(error.stack);
        }
        completed++;
        onProgress?.(completed, total);
        return null;
      }
    })
  );

  const results = await Promise.all(tasks);
  return results.filter((r): r is FileAnalysisResult => r !== null);
}

/**
 * Analyze a single file
 */
async function analyzeFile(
  file: DiscoveredFile,
  config: RuntimeConfig
): Promise<FileAnalysisResult | null> {
  // Check file size
  const fileSize = await getFileSize(file.absolutePath);
  const fileSizeKB = Math.round(fileSize / 1024);

  if (fileSizeKB > MAX_FILE_SIZE_KB) {
    logger.warn(t('warn_file_too_large', { size: fileSizeKB, file: file.relativePath }));
    return null;
  }

  const content = await readFileContent(file.absolutePath);

  const parser: Parser = await createParser(file.language);
  let parseResult: ParseResult;

  try {
    parseResult = await parser.parse(file.absolutePath, content);
  } catch (error) {
    // If tree-sitter parsing fails, try with regex parser as fallback
    logger.warn(
      `Tree-sitter parsing failed for ${file.relativePath}, falling back to regex parser: ${error instanceof Error ? error.message : String(error)}`
    );
    const { RegexParser } = await import('../parser/regex-parser.js');
    const fallbackParser = new RegexParser(file.language);
    parseResult = fallbackParser.parse(file.absolutePath, content);
  }

  // Add content to parse result for metrics that need it
  parseResult.content = content;

  // Create language-specific metrics
  const metrics = createMetrics(config, parseResult.language);

  // Calculate metrics
  const metricResults = metrics.map((metric) => metric.calculate(parseResult));

  // Calculate overall score
  const score = calculateScore(metricResults, config);

  return {
    filePath: file.relativePath,
    parseResult,
    metrics: metricResults,
    score,
  };
}
