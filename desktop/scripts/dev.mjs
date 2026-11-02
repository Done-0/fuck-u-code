/**
 * Development runner: start the Vite dev server, then launch Electron pointed at it.
 * The renderer hot-reloads through Vite; changes under electron/ restart Electron,
 * so the main process and preload never lag behind the UI.
 */

import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import electronPath from 'electron';

// Long enough for sync-core to finish copying before Electron reloads core/.
const RESTART_DELAY_MS = 800;
const desktopDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const server = await createServer({ configFile: resolve(desktopDir, 'vite.config.mjs') });
await server.listen();
server.printUrls();

const url = server.resolvedUrls?.local[0];
let electron = null;
let restarting = false;

function launch() {
  electron = spawn(electronPath, ['.'], {
    cwd: desktopDir,
    stdio: 'inherit',
    env: { ...process.env, VITE_DEV_SERVER_URL: url },
  });
  electron.on('close', async (code) => {
    if (restarting) {
      restarting = false;
      launch();
      return;
    }
    await server.close();
    process.exit(code ?? 0);
  });
}

launch();

// The main process runs electron/ and the analyzer copy in core/ (refreshed by sync-core).
const MAIN_PROCESS_CODE = /^(electron|core)[\\/]/;

let timer = null;
watch(desktopDir, { recursive: true }, (_event, filename) => {
  if (!filename || !MAIN_PROCESS_CODE.test(filename)) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log('[dev] main process code changed, restarting Electron');
    restarting = true;
    electron.kill();
  }, RESTART_DELAY_MS);
});
