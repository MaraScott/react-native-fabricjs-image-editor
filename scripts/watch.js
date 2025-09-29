#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const { URL } = require('url');
const esbuild = require('esbuild');
const {
  projectRoot,
  outDir,
  manifestFile,
  ensureEntryFile,
  ensureOutDir,
  updateIndexHtml,
  createBuildOptions,
} = require('./buildShared');

const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
const mode = modeArg ? modeArg.split('=')[1] : 'development';

const LIVERELOAD_ENDPOINT = '/__livereload';

function createMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    case '.ttf':
      return 'font/ttf';
    default:
      return 'application/octet-stream';
  }
}

function startDevServer({ port = 3000 } = {}) {
  const clients = new Set();

  const server = http.createServer((req, res) => {
    if (!req.url) {
      res.writeHead(400);
      res.end('Bad Request');
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === LIVERELOAD_ENDPOINT) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write('\n');
      clients.add(res);
      req.on('close', () => {
        clients.delete(res);
      });
      return;
    }

    const requestPath = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = path.resolve(projectRoot, `.${decodeURIComponent(requestPath)}`);

    if (!filePath.startsWith(projectRoot)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (error, stats) => {
      if (error || !stats.isFile()) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      res.writeHead(200, { 'Content-Type': createMimeType(filePath) });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  server.broadcastReload = () => {
    for (const client of clients) {
      client.write('event: reload\n');
      client.write(`data: ${Date.now()}\n\n`);
    }
  };

  server.listen(port, () => {
    console.log(`
Dev server running at http://localhost:${port}
Open this URL in your browser to use the editor with live reload.
`);
  });

  server.shutdown = () => {
    for (const client of clients) {
      try {
        client.end();
      } catch (error) {
        // Ignore errors when closing client connections.
      }
    }
    server.close();
  };

  return server;
}

async function startWatch() {
  ensureEntryFile();
  fs.rmSync(outDir, { recursive: true, force: true });
  ensureOutDir();

  const server = startDevServer();

  const options = createBuildOptions({ mode });
  let isInitialBuild = true;

  options.plugins = [
    ...options.plugins,
    {
      name: 'watch-index-html-plugin',
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length > 0) {
            const message = isInitialBuild
              ? 'Initial build failed. Fix the errors above to start watching.'
              : 'Rebuild failed. Fix the errors above to continue watching.';
            console.error(message);
            return;
          }

          try {
            const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
            updateIndexHtml(manifest, { injectLiveReload: true });
            const outputs = [manifest.js, manifest.css].filter(Boolean).join(', ');
            if (isInitialBuild) {
              console.log(`Watching for changes... Latest assets: ${outputs}`);
            } else {
              console.log(`Rebuilt assets: ${outputs}`);
              server.broadcastReload();
            }
          } catch (readError) {
            updateIndexHtml(null, { injectLiveReload: true });
            const message = isInitialBuild
              ? 'Build completed, but the asset manifest could not be read. Watching for changes with fallback assets.'
              : 'Rebuild completed, but the asset manifest could not be read.';
            console.error(message, readError);
            if (!isInitialBuild) {
              server.broadcastReload();
            }
          } finally {
            isInitialBuild = false;
          }
        });
      },
    },
  ];

  const ctx = await esbuild.context(options);
  await ctx.watch();

  const stop = async () => {
    await ctx.dispose();
    server.shutdown();
    console.log('Stopped watcher and development server.');
    process.exit(0);
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

startWatch().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
