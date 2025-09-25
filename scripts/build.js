#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const projectRoot = process.cwd();
const entryFile = path.resolve(projectRoot, 'index.tsx');
const outDir = path.resolve(projectRoot, 'dist');
const outFile = path.join(outDir, 'editor.bundle.js');

if (!fs.existsSync(entryFile)) {
  console.error('Entry file index.tsx not found');
  process.exit(1);
}

const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
const mode = modeArg ? modeArg.split('=')[1] : 'production';
const isProd = mode !== 'development';

const define = {
  'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
  'process.env.TAMAGUI_TARGET': JSON.stringify('web'),
  'process.env.TAMAGUI_DISABLE_WARNINGS': JSON.stringify('1'),
  global: 'window',
};

const envBanner = `
  if (typeof globalThis.process === 'undefined') {
    globalThis.process = { env: {} };
  }
  globalThis.process.env = globalThis.process.env || {};
  globalThis.process.env.NODE_ENV = ${JSON.stringify(isProd ? 'production' : 'development')};
  globalThis.process.env.TAMAGUI_TARGET = 'web';
  globalThis.process.env.TAMAGUI_DISABLE_WARNINGS = '1';
  globalThis.process.browser = true;
`;

const aliasMap = {
  'react-native': 'react-native-web-lite',
  'react-konva': path.resolve(projectRoot, 'shims/reactKonva.tsx'),
  'react/jsx-runtime': path.resolve(projectRoot, 'shims/jsxRuntime.ts'),
  'its-fine': path.resolve(projectRoot, 'shims/itsFine.ts'),
  konva: path.resolve(projectRoot, 'shims/konvaGlobal.ts'),
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const aliasPlugin = {
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

const emptyModules = new Set(['fs', 'path', 'module', 'os', 'child_process']);

const emptyModulePlugin = {
  name: 'empty-module-plugin',
  setup(build) {
    const filter = new RegExp(`^(${Array.from(emptyModules).map(escapeRegExp).join('|')})$`);
    build.onResolve({ filter }, (args) => ({ path: args.path, namespace: 'empty-module' }));
    build.onLoad({ filter: /.*/, namespace: 'empty-module' }, () => ({ contents: 'export default {};', loader: 'js' }));
  },
};

async function buildBundle() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    outfile: outFile,
    format: 'iife',
    platform: 'browser',
    target: ['es2019'],
    sourcemap: !isProd,
    minify: isProd,
    define,
    tsconfig: path.resolve(projectRoot, 'tsconfig.json'),
    logLevel: 'info',
    plugins: [aliasPlugin, emptyModulePlugin],
    banner: {
      js: envBanner,
    },
    loader: {
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
    },
  });

  console.log(`Build completed. Wrote ${outFile}`);
}

buildBundle().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
