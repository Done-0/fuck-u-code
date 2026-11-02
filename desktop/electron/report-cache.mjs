/**
 * On-disk cache of the last analysis and AI review per project, so reopening
 * a recent project is instant. Only projects in the recent list keep files.
 */

import { app } from 'electron';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function cacheDir() {
  return join(app.getPath('userData'), 'reports');
}

function projectHash(projectPath) {
  return createHash('sha256').update(projectPath).digest('hex').slice(0, 32);
}

function cacheFile(projectPath) {
  return join(cacheDir(), `${projectHash(projectPath)}.json`);
}

function reviewsFile(projectPath) {
  return join(cacheDir(), `${projectHash(projectPath)}.reviews.json`);
}

export async function saveReport(snapshot) {
  await mkdir(cacheDir(), { recursive: true });
  await writeFile(cacheFile(snapshot.projectPath), JSON.stringify(snapshot), 'utf8');
}

/**
 * Returns null when the project has no cache. Reports from an older analyzer
 * version are still returned: showing the last result beats re-analyzing
 * behind the user's back, and Re-analyze refreshes it.
 */
export async function loadReport(projectPath) {
  let text;
  try {
    text = await readFile(cacheFile(projectPath), 'utf8');
  } catch {
    return null;
  }
  const snapshot = JSON.parse(text);
  return snapshot.projectPath === projectPath && snapshot.result ? snapshot : null;
}

export async function deleteReport(projectPath) {
  await rm(cacheFile(projectPath), { force: true });
  await rm(reviewsFile(projectPath), { force: true });
}

/** The finished AI review entries of a project; an empty list removes the file. */
export async function saveReviews(projectPath, items) {
  if (items.length === 0) {
    await rm(reviewsFile(projectPath), { force: true });
    return;
  }
  await mkdir(cacheDir(), { recursive: true });
  await writeFile(reviewsFile(projectPath), JSON.stringify(items), 'utf8');
}

export async function loadReviews(projectPath) {
  try {
    return JSON.parse(await readFile(reviewsFile(projectPath), 'utf8'));
  } catch {
    return [];
  }
}

/** Remove cache files for projects that fell off the recent list. */
export async function pruneReports(keepPaths) {
  const keep = new Set(keepPaths.map(projectHash));
  const names = await readdir(cacheDir()).catch(() => []);
  await Promise.all(
    names
      .filter((name) => name.endsWith('.json') && !keep.has(name.split('.')[0]))
      .map((name) => rm(join(cacheDir(), name), { force: true }))
  );
}
