import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { Readable } from 'node:stream';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function phpBackendPlugin(): Plugin {
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
            if (req.headers.cookie) headers.cookie = req.headers.cookie;
            if (req.headers.origin) headers.origin = req.headers.origin;

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);

            const phpResp = await fetch(fullUrl, {
              method: req.method,
              headers,
              body: bodyBuffer ? new Uint8Array(bodyBuffer) : undefined,
              signal: controller.signal,
            });

            clearTimeout(timeout);

            if (phpResp.status) {
              const contentType = phpResp.headers.get('content-type') || 'application/json';
              res.statusCode = phpResp.status;
              res.setHeader('Content-Type', contentType);
              const contentLength = phpResp.headers.get('content-length');
              if (contentLength) res.setHeader('Content-Length', contentLength);
              const setCookie = phpResp.headers.get('set-cookie');
              if (setCookie) res.setHeader('Set-Cookie', setCookie);
              if (phpResp.body) {
                Readable.fromWeb(phpResp.body as any).pipe(res);
              } else {
                res.end();
              }
              return;
            }
          } catch {
            // Target host offline, try next candidate host
          }
        }

        if (req.url?.startsWith('/php-backend/uploads/')) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          return res.end('Uploaded file not found');
        }

        if (req.url?.startsWith('/php-backend/api/upload.php')) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          return res.end(JSON.stringify({ status: 'error', message: 'PHP upload backend unavailable' }));
        }

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 503;
        return res.end(JSON.stringify({ status: 'offline', message: 'PHP database backend unavailable' }));
      });
    },
    closeBundle() {
      const distDirectory = path.resolve(__dirname, 'dist');
      for (const fileName of ['database_seed.sql', 'clean_database.sql']) {
        fs.rmSync(path.join(distDirectory, fileName), { force: true });
      }
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
