const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const entryFile = path.resolve(projectRoot, 'index.tsx');
const outDir = path.resolve(projectRoot, 'dist');
const outFile = path.join(outDir, 'editor.bundle.js');

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

function createBuildOptions({ mode = 'production' } = {}) {
  const isProd = mode !== 'development';

  return {
    entryPoints: [entryFile],
    bundle: true,
    outfile: outFile,
    format: 'iife',
    platform: 'browser',
    target: ['es2019'],
    sourcemap: !isProd,
    minify: isProd,
    define: createDefine(isProd),
    tsconfig: path.resolve(projectRoot, 'tsconfig.json'),
    logLevel: 'info',
    plugins: [createAliasPlugin(), createEmptyModulePlugin()],
    banner: {
      js: createEnvBanner(isProd),
    },
    loader: loaders,
  };
}

module.exports = {
  projectRoot,
  entryFile,
  outDir,
  outFile,
  ensureEntryFile,
  ensureOutDir,
  createBuildOptions,
};
