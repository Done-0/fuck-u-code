/**
 * File system utilities
 */

import { readFile, stat, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

/**
 * Read file content as string
 */
export async function readFileContent(filePath: string): Promise<string> {
  return readFile(filePath, 'utf-8');
}

/**
 * Check if path is a directory
 */
export async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if path exists
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively get all files in a directory
 */
export async function getAllFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await getAllFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      files.push(relative(baseDir, fullPath));
    }
  }

  return files;
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  const stats = await stat(filePath);
  return stats.size;
}
