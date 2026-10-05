import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    plugins: [
      react(),
      {
        name: 'webull-dev-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = new URL(req.url || '', 'http://localhost');
            if (url.pathname === '/api/webull/quote') {
              process.env.WEBULL_APP_KEY = env.WEBULL_APP_KEY || process.env.WEBULL_APP_KEY;
              process.env.WEBULL_APP_SECRET = env.WEBULL_APP_SECRET || process.env.WEBULL_APP_SECRET;
              process.env.WEBULL_API_HOST = env.WEBULL_API_HOST || process.env.WEBULL_API_HOST;
              process.env.WEBULL_ACCESS_TOKEN = env.WEBULL_ACCESS_TOKEN || process.env.WEBULL_ACCESS_TOKEN;

              (req as any).query = Object.fromEntries(url.searchParams);
              (res as any).status = (code: number) => {
                res.statusCode = code;
                return res;
              };
              (res as any).json = (data: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
                return res;
              };

              try {
                const { default: handler } = await import('./api/webull/quote');
                return await handler(req, res);
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: err.message }));
              }
            }

            if (url.pathname === '/api/webull/screener') {
              process.env.WEBULL_APP_KEY = env.WEBULL_APP_KEY || process.env.WEBULL_APP_KEY;
              process.env.WEBULL_APP_SECRET = env.WEBULL_APP_SECRET || process.env.WEBULL_APP_SECRET;
              process.env.WEBULL_API_HOST = env.WEBULL_API_HOST || process.env.WEBULL_API_HOST;
              process.env.WEBULL_ACCESS_TOKEN = env.WEBULL_ACCESS_TOKEN || process.env.WEBULL_ACCESS_TOKEN;

              (req as any).query = Object.fromEntries(url.searchParams);
              (res as any).status = (code: number) => {
                res.statusCode = code;
                return res;
              };
              (res as any).json = (data: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
                return res;
              };

              try {
                const { default: handler } = await import('./api/webull/screener');
                return await handler(req, res);
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: err.message }));
              }
            }

            if (url.pathname === '/api/webull/token') {
              process.env.WEBULL_APP_KEY = env.WEBULL_APP_KEY || process.env.WEBULL_APP_KEY;
              process.env.WEBULL_APP_SECRET = env.WEBULL_APP_SECRET || process.env.WEBULL_APP_SECRET;
              process.env.WEBULL_API_HOST = env.WEBULL_API_HOST || process.env.WEBULL_API_HOST;
              process.env.WEBULL_ACCESS_TOKEN = env.WEBULL_ACCESS_TOKEN || process.env.WEBULL_ACCESS_TOKEN;

              (req as any).query = Object.fromEntries(url.searchParams);
              (res as any).status = (code: number) => {
                res.statusCode = code;
                return res;
              };
              (res as any).json = (data: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
                return res;
              };

              try {
                const { default: handler } = await import('./api/webull/token');
                return await handler(req, res);
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: err.message }));
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  server: {
    port: 9999,
    open: false, // Prevents automatic browser launch during background scripts
    proxy: {
      '/api/stock-search': {
        target: 'https://query2.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stock-search/, '/v1/finance/search'),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://finance.yahoo.com'
        }
      },
      '/api/nasdaq-summary': {
        target: 'https://api.nasdaq.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nasdaq-summary/, '/api/quote'),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.nasdaq.com'
        }
      },
      '/api/nasdaq-company': {
        target: 'https://api.nasdaq.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nasdaq-company/, '/api/company'),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.nasdaq.com'
        }
      },
      '/api/translate': {
        target: 'https://translate.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/translate/, '/translate_a/single'),
      },
      '/api/nasdaq-analyst': {
        target: 'https://api.nasdaq.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nasdaq-analyst/, '/api/analyst'),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.nasdaq.com'
        }
      }
    }
  }
};
});

