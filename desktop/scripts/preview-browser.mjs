/**
 * Run the renderer in a plain browser with real analysis behind it (dev only).
 * Open http://127.0.0.1:5175/?project=<absolute path> and click "Choose folder".
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.FUC_BROWSER_PREVIEW = '1';
const { createServer } = await import('vite');

const desktopDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const server = await createServer({
  configFile: resolve(desktopDir, 'vite.config.mjs'),
  server: { port: 5175 },
});
await server.listen();
server.printUrls();
