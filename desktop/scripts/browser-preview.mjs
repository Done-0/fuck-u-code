/**
 * Dev-only Vite plugin: lets the renderer run in a plain browser by serving the
 * analyzer over a local endpoint. Enabled with FUC_BROWSER_PREVIEW=1; the
 * Electron app never uses it.
 */

async function readJson(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
}

export function browserPreview() {
  return {
    name: 'fuc-browser-preview',
    apply: 'serve',
    async configureServer(server) {
      if (process.env.FUC_BROWSER_PREVIEW !== '1') return;
      const service = await import('../electron/service.mjs');

      server.middlewares.use('/__fuc/analyze', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        try {
          const options = await readJson(req);
          const data = await service.runAnalysis(options, () => {});
          res.end(JSON.stringify({ ok: true, data }));
        } catch (error) {
          res.end(JSON.stringify({ ok: false, error: error.message }));
        }
      });
    },
  };
}
