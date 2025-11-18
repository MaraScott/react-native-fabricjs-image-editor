#!/usr/bin/env node

/**
 * require - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {'fs'} Refer to the implementation for the precise returned value.
 */
/**
 * require - Auto-generated documentation stub.
 *
 * @returns {'fs'} Result produced by require.
 */
const fs = require('fs');
/**
 * require - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {'path'} Refer to the implementation for the precise returned value.
 */
/**
 * require - Auto-generated documentation stub.
 *
 * @returns {'path'} Result produced by require.
 */
const path = require('path');
/**
 * require - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {'http'} Refer to the implementation for the precise returned value.
 */
/**
 * require - Auto-generated documentation stub.
 *
 * @returns {'http'} Result produced by require.
 */
const http = require('http');
/**
 * require - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {'url'} Refer to the implementation for the precise returned value.
 */
/**
 * require - Auto-generated documentation stub.
 *
 * @returns {'url'} Result produced by require.
 */
const { URL } = require('url');
/**
 * require - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {'esbuild'} Refer to the implementation for the precise returned value.
 */
/**
 * require - Auto-generated documentation stub.
 *
 * @returns {'esbuild'} Result produced by require.
 */
const esbuild = require('esbuild');
const {
  projectRoot,
  outDir,
  manifestFile,
  ensureEntryFile,
  ensureOutDir,
  updateIndexHtml,
  createBuildOptions,
  buildCss,
/**
 * require - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {'./buildShared'} Refer to the implementation for the precise returned value.
 */
/**
 * require - Auto-generated documentation stub.
 *
 * @returns {'./buildShared'} Result produced by require.
 */
} = require('./buildShared');

/**
 * find - Auto-generated summary; refine if additional context is needed.
 */
const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
/**
 * split - Auto-generated summary; refine if additional context is needed.
 */
/**
 * split - Auto-generated documentation stub.
 */
const mode = modeArg ? modeArg.split('=')[1] : 'development';

const LIVERELOAD_ENDPOINT = '/__livereload';

/**
 * createMimeType - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {filePath} Refer to the implementation for the precise returned value.
 */
/**
 * createMimeType - Auto-generated documentation stub.
 *
 * @returns {filePath} Result produced by createMimeType.
 */
function createMimeType(filePath) {
  /**
   * extname - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {filePath} Refer to the implementation for the precise returned value.
   */
  /**
   * extname - Auto-generated documentation stub.
   *
   * @returns {filePath} Result produced by extname.
   */
  const ext = path.extname(filePath).toLowerCase();
  /**
   * switch - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {ext} Refer to the implementation for the precise returned value.
   */
  /**
   * switch - Auto-generated documentation stub.
   *
   * @returns {ext} Result produced by switch.
   */
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

/**
 * startDevServer - Auto-generated summary; refine if additional context is needed.
 */
/**
 * startDevServer - Auto-generated documentation stub.
 */
function startDevServer({ port = 3000 } = {}) {
  /**
   * Map - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * Map - Auto-generated documentation stub.
   */
  const clients = new Map();

  /**
   * createServer - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} (req - Parameter derived from the static analyzer.
   * @param {*} res - Parameter derived from the static analyzer.
   */
  /**
   * createServer - Auto-generated documentation stub.
   *
   * @param {*} (req - Parameter forwarded to createServer.
   * @param {*} res - Parameter forwarded to createServer.
   */
  const server = http.createServer((req, res) => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!req.url} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {!req.url} Result produced by if.
     */
    if (!req.url) {
      /**
       * writeHead - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {400} Refer to the implementation for the precise returned value.
       */
      /**
       * writeHead - Auto-generated documentation stub.
       *
       * @returns {400} Result produced by writeHead.
       */
      res.writeHead(400);
      /**
       * end - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {'Bad Request'} Refer to the implementation for the precise returned value.
       */
      /**
       * end - Auto-generated documentation stub.
       *
       * @returns {'Bad Request'} Result produced by end.
       */
      res.end('Bad Request');
      return;
    }

    /**
     * URL - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} req.url - Parameter derived from the static analyzer.
     * @param {*} `http - Parameter derived from the static analyzer.
     *
     * @returns {req.url, `http://${req.headers.host}`} Refer to the implementation for the precise returned value.
     */
    /**
     * URL - Auto-generated documentation stub.
     *
     * @param {*} req.url - Parameter forwarded to URL.
     * @param {*} `http - Parameter forwarded to URL.
     *
     * @returns {req.url, `http://${req.headers.host}`} Result produced by URL.
     */
    const url = new URL(req.url, `http://${req.headers.host}`);

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (url.pathname === LIVERELOAD_ENDPOINT) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      /**
       * write - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'retry - Parameter derived from the static analyzer.
       *
       * @returns {'retry: 1000\n\n'} Refer to the implementation for the precise returned value.
       */
      /**
       * write - Auto-generated documentation stub.
       *
       * @param {*} 'retry - Parameter forwarded to write.
       *
       * @returns {'retry: 1000\n\n'} Result produced by write.
       */
      res.write('retry: 1000\n\n');

      /**
       * setInterval - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * setInterval - Auto-generated documentation stub.
       */
      const heartbeat = setInterval(() => {
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {res.writableEnded} Refer to the implementation for the precise returned value.
         */
        if (res.writableEnded) {
          /**
           * clearInterval - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {heartbeat} Refer to the implementation for the precise returned value.
           */
          /**
           * clearInterval - Auto-generated documentation stub.
           *
           * @returns {heartbeat} Result produced by clearInterval.
           */
          clearInterval(heartbeat);
          /**
           * delete - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {res} Refer to the implementation for the precise returned value.
           */
          /**
           * delete - Auto-generated documentation stub.
           *
           * @returns {res} Result produced by delete.
           */
          clients.delete(res);
          return;
        }

        try {
          /**
           * write - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} 'event - Parameter derived from the static analyzer.
           *
           * @returns {'event: ping\n'} Refer to the implementation for the precise returned value.
           */
          /**
           * write - Auto-generated documentation stub.
           *
           * @param {*} 'event - Parameter forwarded to write.
           *
           * @returns {'event: ping\n'} Result produced by write.
           */
          res.write('event: ping\n');
          /**
           * write - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} `data - Parameter derived from the static analyzer.
           */
          /**
           * write - Auto-generated documentation stub.
           *
           * @param {*} `data - Parameter forwarded to write.
           */
          res.write(`data: ${Date.now()}\n\n`);
        /**
         * catch - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {error} Refer to the implementation for the precise returned value.
         */
        /**
         * catch - Auto-generated documentation stub.
         *
         * @returns {error} Result produced by catch.
         */
        } catch (error) {
          /**
           * clearInterval - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {heartbeat} Refer to the implementation for the precise returned value.
           */
          /**
           * clearInterval - Auto-generated documentation stub.
           *
           * @returns {heartbeat} Result produced by clearInterval.
           */
          clearInterval(heartbeat);
          /**
           * delete - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {res} Refer to the implementation for the precise returned value.
           */
          /**
           * delete - Auto-generated documentation stub.
           *
           * @returns {res} Result produced by delete.
           */
          clients.delete(res);
        }
      }, 15000);

      /**
       * set - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} res - Parameter derived from the static analyzer.
       * @param {*} heartbeat - Parameter derived from the static analyzer.
       *
       * @returns {res, heartbeat} Refer to the implementation for the precise returned value.
       */
      /**
       * set - Auto-generated documentation stub.
       *
       * @param {*} res - Parameter forwarded to set.
       * @param {*} heartbeat - Parameter forwarded to set.
       *
       * @returns {res, heartbeat} Result produced by set.
       */
      clients.set(res, heartbeat);

      /**
       * on - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'close' - Parameter derived from the static analyzer.
       * @param {*} ( - Parameter derived from the static analyzer.
       */
      /**
       * on - Auto-generated documentation stub.
       *
       * @param {*} 'close' - Parameter forwarded to on.
       * @param {*} ( - Parameter forwarded to on.
       */
      req.on('close', () => {
        /**
         * clearInterval - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {heartbeat} Refer to the implementation for the precise returned value.
         */
        /**
         * clearInterval - Auto-generated documentation stub.
         *
         * @returns {heartbeat} Result produced by clearInterval.
         */
        clearInterval(heartbeat);
        /**
         * delete - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {res} Refer to the implementation for the precise returned value.
         */
        /**
         * delete - Auto-generated documentation stub.
         *
         * @returns {res} Result produced by delete.
         */
        clients.delete(res);
      });
      return;
    }

    const requestPath = url.pathname === '/' ? '/index.html' : url.pathname;
    /**
     * resolve - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} projectRoot - Parameter derived from the static analyzer.
     * @param {*} `.${decodeURIComponent(requestPath - Parameter derived from the static analyzer.
     */
    /**
     * resolve - Auto-generated documentation stub.
     *
     * @param {*} projectRoot - Parameter forwarded to resolve.
     * @param {*} `.${decodeURIComponent(requestPath - Parameter forwarded to resolve.
     */
    const filePath = path.resolve(projectRoot, `.${decodeURIComponent(requestPath)}`);

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (!filePath.startsWith(projectRoot)) {
      /**
       * writeHead - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {403} Refer to the implementation for the precise returned value.
       */
      res.writeHead(403);
      /**
       * end - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {'Forbidden'} Refer to the implementation for the precise returned value.
       */
      /**
       * end - Auto-generated documentation stub.
       *
       * @returns {'Forbidden'} Result produced by end.
       */
      res.end('Forbidden');
      return;
    }

    /**
     * stat - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} filePath - Parameter derived from the static analyzer.
     * @param {*} (error - Parameter derived from the static analyzer.
     * @param {*} stats - Parameter derived from the static analyzer.
     */
    /**
     * stat - Auto-generated documentation stub.
     *
     * @param {*} filePath - Parameter forwarded to stat.
     * @param {*} (error - Parameter forwarded to stat.
     * @param {*} stats - Parameter forwarded to stat.
     */
    fs.stat(filePath, (error, stats) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (error || !stats.isFile()) {
        /**
         * writeHead - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {404} Refer to the implementation for the precise returned value.
         */
        /**
         * writeHead - Auto-generated documentation stub.
         *
         * @returns {404} Result produced by writeHead.
         */
        res.writeHead(404);
        /**
         * end - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {'Not Found'} Refer to the implementation for the precise returned value.
         */
        /**
         * end - Auto-generated documentation stub.
         *
         * @returns {'Not Found'} Result produced by end.
         */
        res.end('Not Found');
        return;
      }

      /**
       * writeHead - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 200 - Parameter derived from the static analyzer.
       * @param {*} { 'Content-Type' - Parameter derived from the static analyzer.
       */
      /**
       * writeHead - Auto-generated documentation stub.
       *
       * @param {*} 200 - Parameter forwarded to writeHead.
       * @param {*} { 'Content-Type' - Parameter forwarded to writeHead.
       */
      res.writeHead(200, { 'Content-Type': createMimeType(filePath) });
      /**
       * createReadStream - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {filePath} Refer to the implementation for the precise returned value.
       */
      /**
       * createReadStream - Auto-generated documentation stub.
       *
       * @returns {filePath} Result produced by createReadStream.
       */
      fs.createReadStream(filePath).pipe(res);
    });
  });

  server.broadcastReload = () => {
    /**
     * for - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} const [client - Parameter derived from the static analyzer.
     * @param {*} heartbeat] of clients.entries( - Parameter derived from the static analyzer.
     */
    /**
     * for - Auto-generated documentation stub.
     *
     * @param {*} const [client - Parameter forwarded to for.
     * @param {*} heartbeat] of clients.entries( - Parameter forwarded to for.
     */
    for (const [client, heartbeat] of clients.entries()) {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {client.writableEnded} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {client.writableEnded} Result produced by if.
       */
      if (client.writableEnded) {
        /**
         * clearInterval - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {heartbeat} Refer to the implementation for the precise returned value.
         */
        /**
         * clearInterval - Auto-generated documentation stub.
         *
         * @returns {heartbeat} Result produced by clearInterval.
         */
        clearInterval(heartbeat);
        /**
         * delete - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {client} Refer to the implementation for the precise returned value.
         */
        /**
         * delete - Auto-generated documentation stub.
         *
         * @returns {client} Result produced by delete.
         */
        clients.delete(client);
        continue;
      }

      try {
        /**
         * write - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} 'event - Parameter derived from the static analyzer.
         *
         * @returns {'event: reload\n'} Refer to the implementation for the precise returned value.
         */
        /**
         * write - Auto-generated documentation stub.
         *
         * @param {*} 'event - Parameter forwarded to write.
         *
         * @returns {'event: reload\n'} Result produced by write.
         */
        client.write('event: reload\n');
        /**
         * write - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} `data - Parameter derived from the static analyzer.
         */
        /**
         * write - Auto-generated documentation stub.
         *
         * @param {*} `data - Parameter forwarded to write.
         */
        client.write(`data: ${Date.now()}\n\n`);
      /**
       * catch - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {error} Refer to the implementation for the precise returned value.
       */
      /**
       * catch - Auto-generated documentation stub.
       *
       * @returns {error} Result produced by catch.
       */
      } catch (error) {
        /**
         * clearInterval - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {heartbeat} Refer to the implementation for the precise returned value.
         */
        /**
         * clearInterval - Auto-generated documentation stub.
         *
         * @returns {heartbeat} Result produced by clearInterval.
         */
        clearInterval(heartbeat);
        /**
         * delete - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {client} Refer to the implementation for the precise returned value.
         */
        /**
         * delete - Auto-generated documentation stub.
         *
         * @returns {client} Result produced by delete.
         */
        clients.delete(client);
      }
    }
  };

  /**
   * listen - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} port - Parameter derived from the static analyzer.
   * @param {*} ( - Parameter derived from the static analyzer.
   */
  /**
   * listen - Auto-generated documentation stub.
   *
   * @param {*} port - Parameter forwarded to listen.
   * @param {*} ( - Parameter forwarded to listen.
   */
  server.listen(port, () => {
    console.log(`
Dev server running at http://localhost:${port}
Open this URL in your browser to use the editor with live reload.
`);
  });

  server.shutdown = () => {
    /**
     * for - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} const [client - Parameter derived from the static analyzer.
     * @param {*} heartbeat] of clients.entries( - Parameter derived from the static analyzer.
     */
    /**
     * for - Auto-generated documentation stub.
     *
     * @param {*} const [client - Parameter forwarded to for.
     * @param {*} heartbeat] of clients.entries( - Parameter forwarded to for.
     */
    for (const [client, heartbeat] of clients.entries()) {
      /**
       * clearInterval - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {heartbeat} Refer to the implementation for the precise returned value.
       */
      /**
       * clearInterval - Auto-generated documentation stub.
       *
       * @returns {heartbeat} Result produced by clearInterval.
       */
      clearInterval(heartbeat);
      try {
        /**
         * end - Auto-generated summary; refine if additional context is needed.
         */
        client.end();
      /**
       * catch - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {error} Refer to the implementation for the precise returned value.
       */
      /**
       * catch - Auto-generated documentation stub.
       *
       * @returns {error} Result produced by catch.
       */
      } catch (error) {
        // Ignore errors when closing client connections.
      }
      /**
       * delete - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {client} Refer to the implementation for the precise returned value.
       */
      /**
       * delete - Auto-generated documentation stub.
       *
       * @returns {client} Result produced by delete.
       */
      clients.delete(client);
    }
    /**
     * close - Auto-generated summary; refine if additional context is needed.
     */
    server.close();
  };

  return server;
}

/**
 * async  - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {startWatch} Refer to the implementation for the precise returned value.
 *
 * @async
 */
/**
 * async  - Auto-generated documentation stub.
 *
 * @returns {startWatch} Result produced by async .
 *
 * @async
 */
async function startWatch() {
  /**
   * ensureEntryFile - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * ensureEntryFile - Auto-generated documentation stub.
   */
  ensureEntryFile();
  /**
   * rmSync - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} outDir - Parameter derived from the static analyzer.
   * @param {*} { recursive - Parameter derived from the static analyzer.
   * @param {*} force - Parameter derived from the static analyzer.
   *
   * @returns {outDir, { recursive: true, force: true }} Refer to the implementation for the precise returned value.
   */
  /**
   * rmSync - Auto-generated documentation stub.
   *
   * @param {*} outDir - Parameter forwarded to rmSync.
   * @param {*} { recursive - Parameter forwarded to rmSync.
   * @param {*} force - Parameter forwarded to rmSync.
   *
   * @returns {outDir, { recursive: true, force: true }} Result produced by rmSync.
   */
  fs.rmSync(outDir, { recursive: true, force: true });
  /**
   * ensureOutDir - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * ensureOutDir - Auto-generated documentation stub.
   */
  ensureOutDir();

  // 🔹 Initial CSS build
  try {
    buildCss();
    console.log('Initial CSS build completed.');
  } catch (error) {
    console.error('Initial CSS build failed:', error);
  }

  /**
   * startDevServer - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * startDevServer - Auto-generated documentation stub.
   */
  const server = startDevServer();

  /**
   * createBuildOptions - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {{ mode }} Refer to the implementation for the precise returned value.
   */
  const options = createBuildOptions({ mode });
  let isInitialBuild = true;

  // 🔹 Watch SCSS files and rebuild CSS on change
  let scssWatcher;
  try {
    const scssDir = path.resolve(__dirname, '..', 'assets', 'scss');

    scssWatcher = fs.watch(
      scssDir,
      { recursive: true },
      (eventType, filename) => {
        if (!filename || !filename.endsWith('.scss')) return;

        try {
          buildCss();
          console.log(`Rebuilt CSS due to change in ${filename}`);
          if (!isInitialBuild) {
            server.broadcastReload();
          }
        } catch (error) {
          console.error('CSS rebuild failed:', error);
        }
      }
    );
  } catch (error) {
    console.warn('SCSS watcher could not be started:', error);
  }

  options.plugins = [
    ...options.plugins,
    {
      name: 'watch-index-html-plugin',
      /**
       * setup - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {build} Refer to the implementation for the precise returned value.
       */
      /**
       * setup - Auto-generated documentation stub.
       *
       * @returns {build} Result produced by setup.
       */
      setup(build) {
        /**
         * onEnd - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * onEnd - Auto-generated documentation stub.
         */
        build.onEnd((result) => {
          /**
           * if - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {result.errors.length > 0} Refer to the implementation for the precise returned value.
           */
          /**
           * if - Auto-generated documentation stub.
           *
           * @returns {result.errors.length > 0} Result produced by if.
           */
          if (result.errors.length > 0) {
            const message = isInitialBuild
              ? 'Initial build failed. Fix the errors above to start watching.'
              : 'Rebuild failed. Fix the errors above to continue watching.';
            /**
             * error - Auto-generated summary; refine if additional context is needed.
             *
             * @returns {message} Refer to the implementation for the precise returned value.
             */
            /**
             * error - Auto-generated documentation stub.
             *
             * @returns {message} Result produced by error.
             */
            console.error(message);
            return;
          }

          try {
            /**
             * parse - Auto-generated summary; refine if additional context is needed.
             *
             * @param {*} fs.readFileSync(manifestFile - Parameter derived from the static analyzer.
             * @param {*} 'utf8' - Parameter derived from the static analyzer.
             */
            /**
             * parse - Auto-generated documentation stub.
             *
             * @param {*} fs.readFileSync(manifestFile - Parameter forwarded to parse.
             * @param {*} 'utf8' - Parameter forwarded to parse.
             */
            const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
            /**
             * updateIndexHtml - Auto-generated summary; refine if additional context is needed.
             *
             * @param {*} manifest - Parameter derived from the static analyzer.
             * @param {*} { injectLiveReload - Parameter derived from the static analyzer.
             *
             * @returns {manifest, { injectLiveReload: true }} Refer to the implementation for the precise returned value.
             */
            /**
             * updateIndexHtml - Auto-generated documentation stub.
             *
             * @param {*} manifest - Parameter forwarded to updateIndexHtml.
             * @param {*} { injectLiveReload - Parameter forwarded to updateIndexHtml.
             *
             * @returns {manifest, { injectLiveReload: true }} Result produced by updateIndexHtml.
             */
            updateIndexHtml(manifest, { injectLiveReload: true });
            /**
             * filter - Auto-generated summary; refine if additional context is needed.
             *
             * @returns {Boolean} Refer to the implementation for the precise returned value.
             */
            /**
             * filter - Auto-generated documentation stub.
             *
             * @returns {Boolean} Result produced by filter.
             */
            const outputs = [manifest.js, manifest.css].filter(Boolean).join(', ');
            /**
             * if - Auto-generated summary; refine if additional context is needed.
             *
             * @returns {isInitialBuild} Refer to the implementation for the precise returned value.
             */
            /**
             * if - Auto-generated documentation stub.
             *
             * @returns {isInitialBuild} Result produced by if.
             */
            if (isInitialBuild) {
              /**
               * log - Auto-generated summary; refine if additional context is needed.
               *
               * @param {*} `Watching for changes... Latest assets - Parameter derived from the static analyzer.
               *
               * @returns {`Watching for changes... Latest assets: ${outputs}`} Refer to the implementation for the precise returned value.
               */
              /**
               * log - Auto-generated documentation stub.
               *
               * @param {*} `Watching for changes... Latest assets - Parameter forwarded to log.
               *
               * @returns {`Watching for changes... Latest assets: ${outputs}`} Result produced by log.
               */
              console.log(`Watching for changes... Latest assets: ${outputs}`);
            } else {
              /**
               * log - Auto-generated summary; refine if additional context is needed.
               *
               * @param {*} `Rebuilt assets - Parameter derived from the static analyzer.
               *
               * @returns {`Rebuilt assets: ${outputs}`} Refer to the implementation for the precise returned value.
               */
              /**
               * log - Auto-generated documentation stub.
               *
               * @param {*} `Rebuilt assets - Parameter forwarded to log.
               *
               * @returns {`Rebuilt assets: ${outputs}`} Result produced by log.
               */
              console.log(`Rebuilt assets: ${outputs}`);
              /**
               * broadcastReload - Auto-generated summary; refine if additional context is needed.
               */
              /**
               * broadcastReload - Auto-generated documentation stub.
               */
              server.broadcastReload();
            }
          /**
           * catch - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {readError} Refer to the implementation for the precise returned value.
           */
          } catch (readError) {
            /**
             * updateIndexHtml - Auto-generated summary; refine if additional context is needed.
             *
             * @param {*} null - Parameter derived from the static analyzer.
             * @param {*} { injectLiveReload - Parameter derived from the static analyzer.
             *
             * @returns {null, { injectLiveReload: true }} Refer to the implementation for the precise returned value.
             */
            /**
             * updateIndexHtml - Auto-generated documentation stub.
             *
             * @param {*} null - Parameter forwarded to updateIndexHtml.
             * @param {*} { injectLiveReload - Parameter forwarded to updateIndexHtml.
             *
             * @returns {null, { injectLiveReload: true }} Result produced by updateIndexHtml.
             */
            updateIndexHtml(null, { injectLiveReload: true });
            const message = isInitialBuild
              ? 'Build completed, but the asset manifest could not be read. Watching for changes with fallback assets.'
              : 'Rebuild completed, but the asset manifest could not be read.';
            /**
             * error - Auto-generated summary; refine if additional context is needed.
             *
             * @param {*} message - Parameter derived from the static analyzer.
             * @param {*} readError - Parameter derived from the static analyzer.
             *
             * @returns {message, readError} Refer to the implementation for the precise returned value.
             */
            /**
             * error - Auto-generated documentation stub.
             *
             * @param {*} message - Parameter forwarded to error.
             * @param {*} readError - Parameter forwarded to error.
             *
             * @returns {message, readError} Result produced by error.
             */
            console.error(message, readError);
            /**
             * if - Auto-generated summary; refine if additional context is needed.
             *
             * @returns {!isInitialBuild} Refer to the implementation for the precise returned value.
             */
            /**
             * if - Auto-generated documentation stub.
             *
             * @returns {!isInitialBuild} Result produced by if.
             */
            if (!isInitialBuild) {
              /**
               * broadcastReload - Auto-generated summary; refine if additional context is needed.
               */
              /**
               * broadcastReload - Auto-generated documentation stub.
               */
              server.broadcastReload();
            }
          } finally {
            isInitialBuild = false;
          }
        });
      },
    },
  ];

  /**
   * context - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {options} Refer to the implementation for the precise returned value.
   */
  /**
   * context - Auto-generated documentation stub.
   *
   * @returns {options} Result produced by context.
   */
  const ctx = await esbuild.context(options);
  /**
   * watch - Auto-generated summary; refine if additional context is needed.
   */
  await ctx.watch();

  /**
   * stop - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {async} Refer to the implementation for the precise returned value.
   *
   * @async
   */
  /**
   * stop - Auto-generated documentation stub.
   *
   * @returns {async} Result produced by stop.
   *
   * @async
   */
  const stop = async () => {
    /**
     * dispose - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * dispose - Auto-generated documentation stub.
     */
    await ctx.dispose();
    /**
     * shutdown - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * shutdown - Auto-generated documentation stub.
     */
    server.shutdown();
    /**
     * log - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {'Stopped watcher and development server.'} Refer to the implementation for the precise returned value.
     */
    /**
     * log - Auto-generated documentation stub.
     *
     * @returns {'Stopped watcher and development server.'} Result produced by log.
     */
    console.log('Stopped watcher and development server.');
    /**
     * exit - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {0} Refer to the implementation for the precise returned value.
     */
    /**
     * exit - Auto-generated documentation stub.
     *
     * @returns {0} Result produced by exit.
     */
    process.exit(0);
  };

  /**
   * on - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} 'SIGINT' - Parameter derived from the static analyzer.
   * @param {*} stop - Parameter derived from the static analyzer.
   *
   * @returns {'SIGINT', stop} Refer to the implementation for the precise returned value.
   */
  /**
   * on - Auto-generated documentation stub.
   *
   * @param {*} 'SIGINT' - Parameter forwarded to on.
   * @param {*} stop - Parameter forwarded to on.
   *
   * @returns {'SIGINT', stop} Result produced by on.
   */
  process.on('SIGINT', stop);
  /**
   * on - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} 'SIGTERM' - Parameter derived from the static analyzer.
   * @param {*} stop - Parameter derived from the static analyzer.
   *
   * @returns {'SIGTERM', stop} Refer to the implementation for the precise returned value.
   */
  /**
   * on - Auto-generated documentation stub.
   *
   * @param {*} 'SIGTERM' - Parameter forwarded to on.
   * @param {*} stop - Parameter forwarded to on.
   *
   * @returns {'SIGTERM', stop} Result produced by on.
   */
  process.on('SIGTERM', stop);
}

/**
 * startWatch - Auto-generated summary; refine if additional context is needed.
 */
/**
 * startWatch - Auto-generated documentation stub.
 */
startWatch().catch((error) => {
  /**
   * error - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} error instanceof Error ? error.message - Parameter derived from the static analyzer.
   *
   * @returns {error instanceof Error ? error.message : error} Refer to the implementation for the precise returned value.
   */
  /**
   * error - Auto-generated documentation stub.
   *
   * @param {*} error instanceof Error ? error.message - Parameter forwarded to error.
   *
   * @returns {error instanceof Error ? error.message : error} Result produced by error.
   */
  console.error(error instanceof Error ? error.message : error);
  /**
   * exit - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {1} Refer to the implementation for the precise returned value.
   */
  /**
   * exit - Auto-generated documentation stub.
   *
   * @returns {1} Result produced by exit.
   */
  process.exit(1);
});
