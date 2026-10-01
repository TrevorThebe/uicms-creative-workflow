import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function phpBackendPlugin(): Plugin {
  const dbFilePath = path.resolve(__dirname, '.database_snapshot.json');

  return {
    name: 'php-backend-mock-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/php-backend')) {
          return next();
        }

        // Try proxying to live PHP server if available (e.g. Apache/XAMPP/WAMP on port 80 or 8088 or process.env.PHP_API_TARGET)
        const targetHosts = [
          process.env.PHP_API_TARGET,
          'http://127.0.0.1:80',
          'http://localhost:80',
          'http://127.0.0.1:8088',
          'http://localhost:8088',
          'http://127.0.0.1:8080',
          'http://localhost:8080',
        ].filter(Boolean) as string[];

        // Filter out self-referencing dev server port 3000 to prevent infinite loops
        const validHosts = targetHosts.filter((h) => !h.includes(':3000'));

        let bodyBuffer: Buffer | null = null;
        if (req.method === 'POST' || req.method === 'PUT') {
          bodyBuffer = await new Promise((resolve) => {
            const chunks: any[] = [];
            req.on('data', (c) => chunks.push(c));
            req.on('end', () => resolve(Buffer.concat(chunks)));
          });
        }

        for (const host of validHosts) {
          try {
            const fullUrl = new URL(req.url, host).toString();
            const headers: Record<string, string> = {
              Accept: 'application/json',
            };
            if (req.headers['content-type']) {
              headers['content-type'] = req.headers['content-type'] as string;
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 1000);

            const phpResp = await fetch(fullUrl, {
              method: req.method,
              headers,
              body: bodyBuffer ? new Uint8Array(bodyBuffer) : undefined,
              signal: controller.signal,
            });

            clearTimeout(timeout);

            if (phpResp.ok) {
              const contentType = phpResp.headers.get('content-type') || 'application/json';
              const text = await phpResp.text();
              res.statusCode = phpResp.status;
              res.setHeader('Content-Type', contentType);
              res.end(text);
              return;
            }
          } catch {
            // Target host offline, try next candidate host
          }
        }

        // Fallback to local snapshot if no external local PHP backend server responded
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        if (req.method === 'GET') {
          try {
            if (fs.existsSync(dbFilePath)) {
              const fileContent = fs.readFileSync(dbFilePath, 'utf-8');
              const json = JSON.parse(fileContent);
              res.statusCode = 200;
              return res.end(JSON.stringify({ status: 'success', data: json }));
            }
          } catch (e) {
            console.error('Error reading snapshot:', e);
          }
          res.statusCode = 200;
          return res.end(JSON.stringify({ status: 'success', data: null }));
        }

        if (req.method === 'POST') {
          try {
            const bodyStr = bodyBuffer ? bodyBuffer.toString('utf-8') : '{}';
            const parsed = JSON.parse(bodyStr || '{}');
            const dataToSave = parsed.data || parsed;
            fs.writeFileSync(dbFilePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
            res.statusCode = 200;
            return res.end(JSON.stringify({ status: 'success', message: 'Database state persisted successfully' }));
          } catch (err: any) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ status: 'error', message: err.message || 'Invalid JSON' }));
          }
        }

        res.statusCode = 405;
        return res.end(JSON.stringify({ status: 'error', message: 'Method not allowed' }));
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [phpBackendPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/php-backend': {
          target: process.env.PHP_API_TARGET || 'http://127.0.0.1:80',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (_err, _req, res) => {
              if (res && 'writeHead' in res && !res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'offline', message: 'PHP backend service unavailable' }));
              }
            });
          },
        },
      },
    },
  };
});
