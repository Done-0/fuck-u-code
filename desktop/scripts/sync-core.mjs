/**
 * Compile the analyzer in the parent package and copy its output into ./core,
 * where the Electron main process imports it from.
 *
 * Keeping a copy inside the desktop package means bare imports and the
 * tree-sitter wasm lookup (core/parser/../../node_modules) both resolve
 * against desktop/node_modules, in development and in the packaged app alike.
 */

import { cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const desktopDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = resolve(desktopDir, '..');
const distDir = join(rootDir, 'dist');
const coreDir = join(desktopDir, 'core');

// Rebuild when the parent package has its toolchain installed; otherwise fall
// back to whatever dist/ already holds.
if (existsSync(join(rootDir, 'node_modules', 'typescript'))) {
  console.log('[sync-core] building analyzer...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
}

if (!existsSync(join(distDir, 'analyzer', 'index.js'))) {
  console.error(
    '[sync-core] ../dist is missing. Run `npm install && npm run build` in the repo root first.'
  );
  process.exit(1);
}

await rm(coreDir, { recursive: true, force: true });
await cp(distDir, coreDir, {
  recursive: true,
  dereference: true,
  filter: (src) => !src.endsWith('.map') && !src.endsWith('.d.ts'),
});

console.log('[sync-core] analyzer copied to desktop/core');
