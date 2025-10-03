const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const entryFile = path.resolve(projectRoot, 'index.tsx');
const outDir = path.resolve(projectRoot, 'dist');
const bundleBaseName = 'editor.bundle';
const manifestFile = path.join(outDir, 'asset-manifest.json');
const fallbackJsFile = `${bundleBaseName}.js`;
const fallbackCssFile = `${bundleBaseName}.css`;
const indexTemplateFile = path.resolve(projectRoot, 'index.template.html');
const indexHtmlFile = path.resolve(projectRoot, 'index.html');

const aliasMap = {
  'react-native': 'react-native-web-lite',
  'react-konva': path.resolve(projectRoot, 'shims/reactKonva.tsx'),
  'react/jsx-runtime': path.resolve(projectRoot, 'shims/jsxRuntime.ts'),
  'its-fine': path.resolve(projectRoot, 'shims/itsFine.ts'),
  'konva': path.resolve(projectRoot, 'shims/konvaGlobal.ts'),
  '@atoms': path.resolve(projectRoot, 'ui/atoms'),
  '@molecules': path.resolve(projectRoot, 'ui/molecules'),
  '@organisms': path.resolve(projectRoot, 'ui/organisms'),
  '@templates': path.resolve(projectRoot, 'ui/templates'),
  '@pages': path.resolve(projectRoot, 'ui/pages'),
  '@hooks': path.resolve(projectRoot, 'hooks'),
  '@contexts': path.resolve(projectRoot, 'contexts'),
  '@utils': path.resolve(projectRoot, 'utils'),
  '@types': path.resolve(projectRoot, 'types'),
  '@expo': path.resolve(projectRoot, '..', '..', '..', '..'),
  '@tinyartist': path.resolve(projectRoot, '..', '..', '..'),
  '@editor': path.resolve(projectRoot, '.'),
  '@assets': path.resolve(projectRoot, 'assets'),
};

const emptyModules = new Set(['fs', 'path', 'module', 'os', 'child_process']);

const loaders = {
  '.ts': 'ts',
  '.tsx': 'tsx',
  '.js': 'jsx',
  '.jsx': 'jsx',
  '.css': 'css',
  '.ttf': 'file',
  '.woff': 'file',
  '.woff2': 'file',
  '.png': 'file',
  '.svg': 'file',
};

function ensureEntryFile() {
  if (!fs.existsSync(entryFile)) {
    throw new Error('Entry file index.tsx not found');
  }
}

function ensureOutDir() {
  fs.mkdirSync(outDir, { recursive: true });
}

function createDefine(isProd) {
  return {
    'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
    'process.env.TAMAGUI_TARGET': JSON.stringify('web'),
    'process.env.TAMAGUI_DISABLE_WARNINGS': JSON.stringify('1'),
    global: 'window',
  };
}

function createEnvBanner(isProd) {
  return `
  if (typeof globalThis.process === 'undefined') {
    globalThis.process = { env: {} };
  }
  globalThis.process.env = globalThis.process.env || {};
  globalThis.process.env.NODE_ENV = ${JSON.stringify(isProd ? 'production' : 'development')};
  globalThis.process.env.TAMAGUI_TARGET = 'web';
  globalThis.process.env.TAMAGUI_DISABLE_WARNINGS = '1';
  globalThis.process.browser = true;
`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const extensionPriority = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'];

function resolveWithExtensions(candidate) {
  if (fs.existsSync(candidate)) {
    const stat = fs.statSync(candidate);
    if (stat.isFile()) {
      return candidate;
    }
    if (stat.isDirectory()) {
      for (const ext of ['', ...extensionPriority]) {
        const indexFile = ext ? path.join(candidate, `index${ext}`) : path.join(candidate, 'index');
        if (fs.existsSync(indexFile)) {
          const indexStat = fs.statSync(indexFile);
          if (indexStat.isFile()) {
            return indexFile;
          }
        }
      }
      return candidate;
    }
  }

  for (const ext of extensionPriority) {
    const filePath = `${candidate}${ext}`;
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }
  }

  return null;
}

function createAliasPlugin() {
  const entries = Object.entries(aliasMap);
  return {
    name: 'alias-plugin',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        for (const [from, target] of entries) {
          if (args.path === from || args.path.startsWith(`${from}/`)) {
            const remainder = args.path === from ? '' : args.path.slice(from.length + 1);
            if (path.isAbsolute(target)) {
              const candidate = remainder ? path.join(target, remainder) : target;
              const resolvedPath = resolveWithExtensions(candidate);
              if (!resolvedPath) {
                throw new Error(`Unable to resolve alias ${args.path} -> ${candidate}`);
              }
              return { path: resolvedPath };
            }

            const candidate = remainder ? `${target}/${remainder}` : target;
            const resolved = require.resolve(candidate, {
              paths: [args.resolveDir || projectRoot, projectRoot],
            });
            return { path: resolved };
          }
        }
        return null;
      });
    },
  };
}

function createEmptyModulePlugin() {
  return {
    name: 'empty-module-plugin',
    setup(build) {
      const filter = new RegExp(`^(${Array.from(emptyModules).map(escapeRegExp).join('|')})$`);
      build.onResolve({ filter }, (args) => ({ path: args.path, namespace: 'empty-module' }));
      build.onLoad({ filter: /.*/, namespace: 'empty-module' }, () => ({ contents: 'export default {};', loader: 'js' }));
    },
  };
}

function deriveBuildId(jsFileName) {
  const match = jsFileName.match(/editor\.bundle\.(.+)\.js$/);
  return match ? match[1] : jsFileName;
}

function createAssetManifestPlugin({ mode }) {
  return {
    name: 'asset-manifest-plugin',
    setup(build) {
      build.onEnd((result) => {
        if (result.errors.length > 0 || !result.metafile) {
          return;
        }

        let jsFile = null;
        let cssFile = null;

        for (const [outputPath, outputMeta] of Object.entries(result.metafile.outputs)) {
          const fileName = path.basename(outputPath);

          if (
            outputMeta.entryPoint &&
            path.resolve(projectRoot, outputMeta.entryPoint) !== entryFile
          ) {
            continue;
          }

          if (!outputMeta.entryPoint && !fileName.startsWith(`${bundleBaseName}.`)) {
            continue;
          }

          if (outputPath.endsWith('.js') && fileName.startsWith(`${bundleBaseName}.`)) {
            jsFile = fileName;
          } else if (outputPath.endsWith('.css') && fileName.startsWith(`${bundleBaseName}.`)) {
            cssFile = fileName;
          }
        }

        if (!jsFile) {
          console.warn('asset-manifest-plugin: Unable to locate primary JS bundle.');
          return;
        }

        const manifest = {
          buildId: deriveBuildId(jsFile),
          js: jsFile,
          css: cssFile ?? null,
          mode,
          createdAt: new Date().toISOString(),
        };

        fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
        console.log(`Generated asset manifest for ${jsFile}`);

        const persistFallbackAsset = (assetFile, fallbackFileName) => {
          if (!assetFile) {
            return;
          }

          const assetPath = path.join(outDir, assetFile);
          const fallbackPath = path.join(outDir, fallbackFileName);

          if (assetPath === fallbackPath) {
            return;
          }

          try {
            fs.copyFileSync(assetPath, fallbackPath);
            console.log(`Updated fallback asset ${fallbackFileName}`);
          } catch (error) {
            console.warn(`Failed to update fallback asset ${fallbackFileName}:`, error);
          }
        };

        persistFallbackAsset(jsFile, fallbackJsFile);
        persistFallbackAsset(cssFile, fallbackCssFile);
      });
    },
  };
}

function resolveAssetHref(assetFile, fallbackFileName) {
  if (assetFile) {
    return `./dist/${assetFile}`;
  }

  if (!fallbackFileName) {
    return null;
  }

  return `./dist/${fallbackFileName}`;
}

function createLiveReloadSnippet() {
  return `
    <script>
      (function () {
        var source;
        function connect() {
          source = new EventSource('/__livereload');
          source.addEventListener('reload', function () {
            window.location.reload();
          });
          source.addEventListener('open', function () {
            console.log('[watch] Connected to live reload server.');
          });
          source.addEventListener('error', function () {
            if (source) {
              source.close();
            }
            setTimeout(connect, 1000);
          });
        }

        connect();
      })();
    </script>
  `;
}

function renderIndexHtml({ jsFile, cssFile } = {}, { injectLiveReload = false } = {}) {
  if (!fs.existsSync(indexTemplateFile)) {
    console.warn('index.template.html not found. Skipping index.html generation.');
    return null;
  }

  const template = fs.readFileSync(indexTemplateFile, 'utf8');
  const jsHref = resolveAssetHref(jsFile, fallbackJsFile);
  if (!jsHref) {
    console.warn('Unable to determine editor bundle script.');
    return null;
  }

  const cssHref = resolveAssetHref(cssFile, fallbackCssFile);
  const cssTag = cssHref ? `<link rel="stylesheet" href="${cssHref}" />` : '';

  let html = template.replace(/{{CSS_LINK}}/g, cssTag).replace(/{{JS_SRC}}/g, jsHref);

  if (injectLiveReload) {
    html = html.replace('</body>', `${createLiveReloadSnippet()}\n  </body>`);
  }

  return html;
}

function updateIndexHtml(manifest = null, options = {}) {
  const html = renderIndexHtml({ jsFile: manifest?.js, cssFile: manifest?.css }, options);
  if (!html) {
    return;
  }

  fs.writeFileSync(indexHtmlFile, html);

  if (manifest?.js) {
    console.log(`Updated index.html for ${manifest.js}`);
  } else {
    console.log('Updated index.html with fallback assets.');
  }
}

function createBuildOptions({ mode = 'production' } = {}) {
  const isProd = mode !== 'development';

  return {
    entryPoints: [entryFile],
    bundle: true,
    outdir: outDir,
    entryNames: `${bundleBaseName}.[hash]`,
    chunkNames: 'chunks/[name]-[hash]',
    assetNames: 'assets/[name]-[hash]',
    format: 'iife',
    platform: 'browser',
    target: ['es2019'],
    sourcemap: !isProd,
    minify: isProd,
    define: createDefine(isProd),
    tsconfig: path.resolve(projectRoot, 'tsconfig.json'),
    logLevel: 'info',
    plugins: [createAliasPlugin(), createEmptyModulePlugin(), createAssetManifestPlugin({ mode })],
    banner: {
      js: createEnvBanner(isProd),
    },
    loader: loaders,
    metafile: true,
  };
}

module.exports = {
  projectRoot,
  entryFile,
  outDir,
  ensureEntryFile,
  ensureOutDir,
  manifestFile,
  updateIndexHtml,
  createBuildOptions,
};
