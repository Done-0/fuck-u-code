/**
 * File discovery module
 * Uses only .gitignore for file exclusion
 */

import { glob } from 'glob';
import { join } from 'node:path';
import { loadGitignore, loadNestedGitignores, createMatcher } from '../gitignore/index.js';
import { detectLanguage, type Language } from '../parser/types.js';
import type { RuntimeConfig } from '../config/schema.js';

/** Discovered file information */
export interface DiscoveredFile {
  absolutePath: string;
  relativePath: string;
  language: Language;
}

/** File discovery result */
export interface FileDiscoveryResult {
  files: DiscoveredFile[];
  skippedCount: number;
  totalScanned: number;
}

/**
 * Discover all analyzable files in the project
 */
export async function discoverFiles(config: RuntimeConfig): Promise<FileDiscoveryResult> {
  const { projectPath, include, exclude } = config;

  const rootIgnore = await loadGitignore(projectPath);

  // Add user-defined exclude patterns BEFORE creating matcher
  for (const pattern of exclude) {
    rootIgnore.add(pattern);
  }

  const nestedIgnores = await loadNestedGitignores(projectPath);
  const matcher = createMatcher(rootIgnore, nestedIgnores);

  // Common non-code directories to skip at glob level for performance
  const globIgnore = [
    '.git/**',
    'node_modules/**',
    'vendor/**',
    'dist/**',
    'build/**',
    '.next/**',
    '__pycache__/**',
    'target/**',
    '.venv/**',
    'venv/**',
  ];

  const allFiles: string[] = [];
  for (const pattern of include) {
    const matches = await glob(pattern, {
      cwd: projectPath,
      nodir: true,
      dot: true,
      ignore: globIgnore,
    });
    allFiles.push(...matches);
  }

  const uniqueFiles = [...new Set(allFiles)];
  const totalScanned = uniqueFiles.length;

  const filteredFiles = matcher.filter(uniqueFiles);

  const supportedFiles: DiscoveredFile[] = [];
  for (const relativePath of filteredFiles) {
    const language = detectLanguage(relativePath);
    if (language !== 'unknown') {
      supportedFiles.push({
        absolutePath: join(projectPath, relativePath),
        relativePath,
        language,
      });
    }
  }

  return {
    files: supportedFiles,
    skippedCount: totalScanned - supportedFiles.length,
    totalScanned,
  };
}
