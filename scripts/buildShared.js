const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const entryFile = path.resolve(projectRoot, 'index.tsx');
const outDir = path.resolve(projectRoot, 'dist');
const bundleBaseName = 'editor.bundle';
const manifestFile = path.join(outDir, 'asset-manifest.json');
const fallbackJsFile = `${bundleBaseName}.js`;
const fallbackCssFile = `${bundleBaseName}.css`;

const aliasMap = {
  'react-native': 'react-native-web-lite',
  'react-konva': path.resolve(projectRoot, 'shims/reactKonva.tsx'),
  'react/jsx-runtime': path.resolve(projectRoot, 'shims/jsxRuntime.ts'),
  'its-fine': path.resolve(projectRoot, 'shims/itsFine.ts'),
  konva: path.resolve(projectRoot, 'shims/konvaGlobal.ts'),
};

const emptyModules = new Set(['fs', 'path', 'module', 'os', 'child_process']);

const loaders = {
  '.ts': 'ts',
  '.tsx': 'tsx',
  '.js': 'js',
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

function createAliasPlugin() {
  return {
    name: 'alias-plugin',
    setup(build) {
      for (const [from, to] of Object.entries(aliasMap)) {
        const filter = new RegExp(`^${escapeRegExp(from)}$`);
        build.onResolve({ filter }, (args) => {
          const resolved = require.resolve(to, { paths: [args.resolveDir || projectRoot, projectRoot] });
          return { path: resolved };
        });
      }
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
          if (outputMeta.entryPoint !== entryFile) {
            continue;
          }

          if (outputPath.endsWith('.js')) {
            jsFile = path.basename(outputPath);
          } else if (outputPath.endsWith('.css')) {
            cssFile = path.basename(outputPath);
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
  createBuildOptions,
};
