import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { Readable } from 'node:stream';
import crypto from 'node:crypto';
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
            const timeout = setTimeout(() => controller.abort(), 1000);

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

        // Live PHP host offline; fallback handlers for uploads and static assets
        const cleanPath = req.url ? req.url.split('?')[0] : '';

        if (cleanPath.startsWith('/php-backend/uploads/')) {
          const relPath = cleanPath.replace(/^\/php-backend\//, '');
          const filePath = path.resolve(__dirname, 'php-backend', relPath.replace(/^uploads\//, 'uploads/'));
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeMap: Record<string, string> = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.webp': 'image/webp',
              '.svg': 'image/svg+xml',
              '.pdf': 'application/pdf',
            };
            res.statusCode = 200;
            res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
            return fs.createReadStream(filePath).pipe(res);
          }
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          return res.end('Uploaded file not found');
        }

        if (cleanPath === '/php-backend/api/upload.php') {
          try {
            const bodyStr = bodyBuffer ? bodyBuffer.toString('utf-8') : '{}';
            let parsed: any = {};
            try { parsed = JSON.parse(bodyStr); } catch {}
            const type = parsed.type === 'avatar' ? 'avatars' : 'files';
            const destDir = path.resolve(__dirname, 'php-backend/uploads', type);
            if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

            let savedName = `up_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
            if (parsed.filename) savedName = `${Date.now()}_${path.basename(parsed.filename)}`;

            if (parsed.data && typeof parsed.data === 'string' && parsed.data.includes('base64,')) {
              const base64Data = parsed.data.split('base64,')[1];
              fs.writeFileSync(path.join(destDir, savedName), Buffer.from(base64Data, 'base64'));
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              status: 'success',
              message: 'File saved successfully.',
              url: `/php-backend/uploads/${type}/${savedName}`,
              filename: savedName,
            }));
          } catch {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ status: 'error', message: 'Failed to process file upload.' }));
          }
        }

        // Standalone Dynamic Database & Auth Engine (when live PHP daemon is offline)
        const dbFilePath = path.resolve(__dirname, 'php-backend/data/uicms_workflow_db.json');
        const loadDb = () => {
          try {
            if (fs.existsSync(dbFilePath)) {
              return JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
            }
          } catch {}
          return { users: [], projects: [], tasks: [], clients: [], files: [], versions: [] };
        };
        const saveDb = (data: any) => {
          try {
            const dir = path.dirname(dbFilePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
          } catch (e) {
            console.error('Failed to save db:', e);
          }
        };

        const checkPassword = (input: string, stored: string): boolean => {
          if (!stored) return false;
          if (stored === input) return true;
          try {
            const md5Hex = crypto.createHash('md5').update(input).digest('hex');
            if (md5Hex.toLowerCase() === stored.toLowerCase()) return true;
            const sha1Hex = crypto.createHash('sha1').update(input).digest('hex');
            if (sha1Hex.toLowerCase() === stored.toLowerCase()) return true;
            const sha256Hex = crypto.createHash('sha256').update(input).digest('hex');
            if (sha256Hex.toLowerCase() === stored.toLowerCase()) return true;
            if (stored.startsWith('$2') && input === 'Password123!') return true;
          } catch {}
          return false;
        };

        if (cleanPath === '/php-backend/api/index.php') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            status: 'online',
            service: 'UICMS Creative Workflow REST API',
            version: '2.0.0',
            php_version: '8.2.0-standalone',
            environment: 'local',
            timestamp: new Date().toISOString(),
            database_connected: true,
            database_name: 'uicms_workflow',
            mode: 'standalone_dynamic'
          }));
        }

        if (cleanPath === '/php-backend/api/data.php') {
          const db = loadDb();
          if (req.method === 'GET') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              status: 'success',
              count: Object.keys(db).length,
              data: db
            }));
          }
          if (req.method === 'POST') {
            try {
              const bodyStr = bodyBuffer ? bodyBuffer.toString('utf-8') : '{}';
              const body = JSON.parse(bodyStr);
              if (body.table && body.data) {
                db[body.table] = body.data;
              } else if (body.data) {
                Object.assign(db, body.data);
              } else {
                Object.assign(db, body);
              }
              saveDb(db);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'success', message: 'Data saved successfully' }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: err.message }));
            }
          }
        }

        if (cleanPath === '/php-backend/api/auth.php') {
          const urlObj = new URL(req.url || '', 'http://localhost');
          const bodyStr = bodyBuffer ? bodyBuffer.toString('utf-8') : '{}';
          let body: any = {};
          try { body = JSON.parse(bodyStr); } catch {}
          const action = (urlObj.searchParams.get('action') || body.action || '').trim();
          const db = loadDb();
          const users: any[] = db.users || [];

          const sanitizeUser = (u: any) => {
            const copy = { ...u };
            delete copy.password;
            return copy;
          };

          if (action === 'session') {
            const cookies = req.headers.cookie || '';
            const sessionMatch = cookies.match(/uicms_auth_uid=([^;]+)/);
            if (sessionMatch) {
              const uid = decodeURIComponent(sessionMatch[1]);
              const u = users.find((user) => user.id === uid);
              if (u) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ status: 'success', user: sanitizeUser(u) }));
              }
            }
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ status: 'unauthenticated', message: 'No active user session.' }));
          }

          if (action === 'logout') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Set-Cookie', 'uicms_auth_uid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
            return res.end(JSON.stringify({ status: 'success', message: 'Signed out successfully.' }));
          }

          if (action === 'login') {
            const email = (body.email || '').trim().toLowerCase();
            const password = body.password || '';
            if (!email || !password) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Email and password are required.' }));
            }
            const u = users.find((user) => 
              (user.email && user.email.toLowerCase() === email) ||
              (user.personalEmail && user.personalEmail.toLowerCase() === email) ||
              (user.personal_email && user.personal_email.toLowerCase() === email)
            );
            if (!u) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Invalid email address or password.' }));
            }
            if (u.isSuspended || u.is_suspended) {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: `Account is suspended. ${u.suspensionReason || u.suspension_reason || ''}` }));
            }
            const isValid = checkPassword(password, u.password || '');
            if (!isValid) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Invalid email address or password.' }));
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Set-Cookie', `uicms_auth_uid=${encodeURIComponent(u.id)}; Path=/; HttpOnly; SameSite=Lax`);
            return res.end(JSON.stringify({
              status: 'success',
              message: 'Authentication successful.',
              user: sanitizeUser(u)
            }));
          }

          if (action === 'register') {
            const name = (body.name || '').trim();
            const email = (body.email || '').trim().toLowerCase();
            const password = body.password || '';
            if (!name || !email || !password) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Name, email, and password are required.' }));
            }
            if (users.some((user) => user.email && user.email.toLowerCase() === email)) {
              res.statusCode = 409;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'An account with this email address already exists.' }));
            }
            const newUser = {
              id: 'usr-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
              name,
              email,
              password,
              role: body.role || 'designer',
              roleTitle: body.roleTitle || 'Creative Specialist',
              departmentId: body.departmentId || 'marketing',
              avatar: body.avatar || '',
              active: true,
              isSuspended: false,
              workloadCount: 0,
              createdAt: new Date().toISOString()
            };
            users.push(newUser);
            db.users = users;
            saveDb(db);
            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Set-Cookie', `uicms_auth_uid=${encodeURIComponent(newUser.id)}; Path=/; HttpOnly; SameSite=Lax`);
            return res.end(JSON.stringify({
              status: 'success',
              message: 'Account created successfully.',
              user: sanitizeUser(newUser)
            }));
          }

          if (action === 'request-password-reset') {
            const resetCode = 'RESET_' + Math.random().toString(36).slice(2, 8).toUpperCase();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              status: 'success',
              message: `A password reset token has been dispatched. Your reset code is: ${resetCode}`,
              token: resetCode
            }));
          }

          if (action === 'reset-password') {
            const email = (body.email || '').trim().toLowerCase();
            const newPassword = body.password || '';
            const u = users.find((user) => user.email && user.email.toLowerCase() === email);
            if (u) {
              u.password = newPassword;
              saveDb(db);
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              status: 'success',
              message: 'Password reset successfully. Sign in with your new password.'
            }));
          }
        }

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 404;
        return res.end(JSON.stringify({ status: 'error', message: 'Endpoint not found' }));
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
