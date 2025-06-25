/**
 * Gitignore parser
 * Uses the ignore library to parse .gitignore files
 */

import ignore, { type Ignore } from 'ignore';
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname, sep } from 'node:path';
import { exists } from '../utils/fs.js';

/**
 * Load and parse .gitignore file from project root
 */
export async function loadGitignore(projectPath: string): Promise<Ignore> {
  const ig = ignore();
  ig.add('.git');

  const rootGitignore = join(projectPath, '.gitignore');
  if (await exists(rootGitignore)) {
    const content = await readFile(rootGitignore, 'utf-8');
    ig.add(content);
  }

  return ig;
}

/**
 * Recursively load all .gitignore files
 * Supports nested .gitignore files
 */
export async function loadNestedGitignores(
  projectPath: string,
  relativePath = '',
  rootIgnore?: Ignore
): Promise<Map<string, Ignore>> {
  const gitignores = new Map<string, Ignore>();

  const currentPath = join(projectPath, relativePath);
  const gitignorePath = join(currentPath, '.gitignore');

  if (await exists(gitignorePath)) {
    const content = await readFile(gitignorePath, 'utf-8');
    const ig = ignore().add(content);
    gitignores.set(relativePath || '.', ig);
  }

  try {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === '.git') continue;

      if (entry.isDirectory()) {
        const subPath = relativePath ? join(relativePath, entry.name) : entry.name;

        if (rootIgnore?.ignores(subPath)) {
          continue;
        }

        const subGitignores = await loadNestedGitignores(projectPath, subPath, rootIgnore);

        for (const [path, ig] of subGitignores) {
          gitignores.set(path, ig);
        }
      }
    }
  } catch {
    // Skip directories with permission errors or other access issues
  }

  return gitignores;
}

/**
 * Create a combined gitignore matcher
 */
export function createMatcher(
  rootIgnore: Ignore,
  nestedIgnores: Map<string, Ignore>
): GitignoreMatcher {
  return new GitignoreMatcher(rootIgnore, nestedIgnores);
}

/**
 * Gitignore matcher that handles both root and nested .gitignore files
 */
export class GitignoreMatcher {
  private rootIgnore: Ignore;
  private nestedIgnores: Map<string, Ignore>;

  constructor(rootIgnore: Ignore, nestedIgnores: Map<string, Ignore>) {
    this.rootIgnore = rootIgnore;
    this.nestedIgnores = nestedIgnores;
  }

  ignores(relativePath: string): boolean {
    if (!relativePath || relativePath === '.' || relativePath === '..') {
      return false;
    }

    const normalizedPath = relativePath.split(sep).join('/');

    if (this.rootIgnore.ignores(normalizedPath)) {
      return true;
    }

    const dir = dirname(normalizedPath);
    if (dir === '.') return false;

    const parts = dir.split('/');

    for (let i = 0; i <= parts.length; i++) {
      const checkPath = parts.slice(0, i).join('/') || '.';
      const nestedIgnore = this.nestedIgnores.get(checkPath);

      if (nestedIgnore) {
        let relativeToNested: string;
        if (checkPath === '.') {
          relativeToNested = normalizedPath;
        } else {
          relativeToNested = normalizedPath.substring(checkPath.length + 1);
        }

        if (nestedIgnore.ignores(relativeToNested)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Filter a list of file paths
   */
  filter(paths: string[]): string[] {
    return paths.filter((p) => !this.ignores(p));
  }
}
