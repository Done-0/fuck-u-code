import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { browserPreview } from './scripts/browser-preview.mjs';

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
].join('; ');

// Only the production page gets a CSP: the dev server relies on an inline
// React Refresh preamble that a strict script-src would block.
const injectCsp = {
  name: 'inject-csp',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
      injectTo: 'head-prepend',
    },
  ],
};

export default defineConfig({
  // Scripts may start Vite from another directory.
  root: dirname(fileURLToPath(import.meta.url)),
  plugins: [react(), injectCsp, browserPreview()],
  // Relative asset URLs so the built page loads over file:// in Electron.
  base: './',
  build: {
    outDir: 'out/renderer',
    // Loaded from disk by Electron, so one larger bundle is fine.
    chunkSizeWarningLimit: 2000,
    emptyOutDir: true,
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    // The renderer reads the analyzer's locale files from ../src/i18n.
    fs: { allow: ['..'] },
  },
});
