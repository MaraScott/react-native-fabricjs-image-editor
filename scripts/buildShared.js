// @ts-nocheck
/**
 * require - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {'fs'} Refer to the implementation for the precise returned value.
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
 * cwd - Auto-generated summary; refine if additional context is needed.
 */
const projectRoot = process.cwd();
/**
 * resolve - Auto-generated summary; refine if additional context is needed.
 *
 * @param {*} projectRoot - Parameter derived from the static analyzer.
 * @param {*} 'index.tsx' - Parameter derived from the static analyzer.
 *
 * @returns {projectRoot, 'index.tsx'} Refer to the implementation for the precise returned value.
 */
/**
 * resolve - Auto-generated documentation stub.
 *
 * @param {*} projectRoot - Parameter forwarded to resolve.
 * @param {*} 'index.tsx' - Parameter forwarded to resolve.
 *
 * @returns {projectRoot, 'index.tsx'} Result produced by resolve.
 */
const entryFile = path.resolve(projectRoot, 'index.tsx');
/**
 * resolve - Auto-generated summary; refine if additional context is needed.
 *
 * @param {*} projectRoot - Parameter derived from the static analyzer.
 * @param {*} 'dist' - Parameter derived from the static analyzer.
 *
 * @returns {projectRoot, 'dist'} Refer to the implementation for the precise returned value.
 */
/**
 * resolve - Auto-generated documentation stub.
 *
 * @param {*} projectRoot - Parameter forwarded to resolve.
 * @param {*} 'dist' - Parameter forwarded to resolve.
 *
 * @returns {projectRoot, 'dist'} Result produced by resolve.
 */
const outDir = path.resolve(projectRoot, 'dist');
const bundleBaseName = 'editor.bundle';
/**
 * join - Auto-generated summary; refine if additional context is needed.
 *
 * @param {*} outDir - Parameter derived from the static analyzer.
 * @param {*} 'asset-manifest.json' - Parameter derived from the static analyzer.
 *
 * @returns {outDir, 'asset-manifest.json'} Refer to the implementation for the precise returned value.
 */
/**
 * join - Auto-generated documentation stub.
 *
 * @param {*} outDir - Parameter forwarded to join.
 * @param {*} 'asset-manifest.json' - Parameter forwarded to join.
 *
 * @returns {outDir, 'asset-manifest.json'} Result produced by join.
 */
const manifestFile = path.join(outDir, 'asset-manifest.json');
const fallbackJsFile = `${bundleBaseName}.js`;
const fallbackCssFile = `${bundleBaseName}.css`;
/**
 * resolve - Auto-generated summary; refine if additional context is needed.
 *
 * @param {*} projectRoot - Parameter derived from the static analyzer.
 * @param {*} 'index.template.html' - Parameter derived from the static analyzer.
 *
 * @returns {projectRoot, 'index.template.html'} Refer to the implementation for the precise returned value.
 */
/**
 * resolve - Auto-generated documentation stub.
 *
 * @param {*} projectRoot - Parameter forwarded to resolve.
 * @param {*} 'index.template.html' - Parameter forwarded to resolve.
 *
 * @returns {projectRoot, 'index.template.html'} Result produced by resolve.
 */
const indexTemplateFile = path.resolve(projectRoot, 'index.template.html');
/**
 * resolve - Auto-generated summary; refine if additional context is needed.
 *
 * @param {*} projectRoot - Parameter derived from the static analyzer.
 * @param {*} 'index.html' - Parameter derived from the static analyzer.
 *
 * @returns {projectRoot, 'index.html'} Refer to the implementation for the precise returned value.
 */
/**
 * resolve - Auto-generated documentation stub.
 *
 * @param {*} projectRoot - Parameter forwarded to resolve.
 * @param {*} 'index.html' - Parameter forwarded to resolve.
 *
 * @returns {projectRoot, 'index.html'} Result produced by resolve.
 */
const indexHtmlFile = path.resolve(projectRoot, 'index.html');

const aliasMap = {
  'react-native': 'react-native-web-lite',
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'shims/reactKonva.tsx' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'shims/reactKonva.tsx'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'shims/reactKonva.tsx' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'shims/reactKonva.tsx'} Result produced by resolve.
   */
  'react-konva': path.resolve(projectRoot, 'shims/reactKonva.tsx'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'shims/jsxRuntime.ts' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'shims/jsxRuntime.ts'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'shims/jsxRuntime.ts' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'shims/jsxRuntime.ts'} Result produced by resolve.
   */
  'react/jsx-runtime': path.resolve(projectRoot, 'shims/jsxRuntime.ts'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'shims/itsFine.ts' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'shims/itsFine.ts'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'shims/itsFine.ts' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'shims/itsFine.ts'} Result produced by resolve.
   */
  'its-fine': path.resolve(projectRoot, 'shims/itsFine.ts'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'shims/konvaGlobal.ts' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'shims/konvaGlobal.ts'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'shims/konvaGlobal.ts' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'shims/konvaGlobal.ts'} Result produced by resolve.
   */
  'konva': path.resolve(projectRoot, 'shims/konvaGlobal.ts'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'shims/redux.ts' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'shims/redux.ts'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'shims/redux.ts' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'shims/redux.ts'} Result produced by resolve.
   */
  'redux': path.resolve(projectRoot, 'shims/redux.ts'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'shims/react-redux.tsx' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'shims/react-redux.tsx'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'shims/react-redux.tsx' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'shims/react-redux.tsx'} Result produced by resolve.
   */
  'react-redux': path.resolve(projectRoot, 'shims/react-redux.tsx'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'shims/redux-thunk.ts' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'shims/redux-thunk.ts'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'shims/redux-thunk.ts' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'shims/redux-thunk.ts'} Result produced by resolve.
   */
  'redux-thunk': path.resolve(projectRoot, 'shims/redux-thunk.ts'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'shims/reduxjs/toolkit.ts' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'shims/reduxjs/toolkit.ts'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'shims/reduxjs/toolkit.ts' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'shims/reduxjs/toolkit.ts'} Result produced by resolve.
   */
  '@reduxjs/toolkit': path.resolve(projectRoot, 'shims/reduxjs/toolkit.ts'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'store' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'store'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'store' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'store'} Result produced by resolve.
   */
  '@store': path.resolve(projectRoot, 'store'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'ui/atoms' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'ui/atoms'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'ui/atoms' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'ui/atoms'} Result produced by resolve.
   */
  '@atoms': path.resolve(projectRoot, 'ui/atoms'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'ui/molecules' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'ui/molecules'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'ui/molecules' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'ui/molecules'} Result produced by resolve.
   */
  '@molecules': path.resolve(projectRoot, 'ui/molecules'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'ui/organisms' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'ui/organisms'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'ui/organisms' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'ui/organisms'} Result produced by resolve.
   */
  '@organisms': path.resolve(projectRoot, 'ui/organisms'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'ui/templates' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'ui/templates'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'ui/templates' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'ui/templates'} Result produced by resolve.
   */
  '@templates': path.resolve(projectRoot, 'ui/templates'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'ui/pages' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'ui/pages'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'ui/pages' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'ui/pages'} Result produced by resolve.
   */
  '@pages': path.resolve(projectRoot, 'ui/pages'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'hooks' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'hooks'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'hooks' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'hooks'} Result produced by resolve.
   */
  '@hooks': path.resolve(projectRoot, 'hooks'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'contexts' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'contexts'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'contexts' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'contexts'} Result produced by resolve.
   */
  '@contexts': path.resolve(projectRoot, 'contexts'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'utils' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'utils'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'utils' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'utils'} Result produced by resolve.
   */
  '@utils': path.resolve(projectRoot, 'utils'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'types' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'types'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'types' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'types'} Result produced by resolve.
   */
  '@types': path.resolve(projectRoot, 'types'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} '..' - Parameter derived from the static analyzer.
   * @param {*} '..' - Parameter derived from the static analyzer.
   * @param {*} '..' - Parameter derived from the static analyzer.
   * @param {*} '..' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, '..', '..', '..', '..'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} '..' - Parameter forwarded to resolve.
   * @param {*} '..' - Parameter forwarded to resolve.
   * @param {*} '..' - Parameter forwarded to resolve.
   * @param {*} '..' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, '..', '..', '..', '..'} Result produced by resolve.
   */
  '@expo': path.resolve(projectRoot, '..', '..', '..', '..'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} '..' - Parameter derived from the static analyzer.
   * @param {*} '..' - Parameter derived from the static analyzer.
   * @param {*} '..' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, '..', '..', '..'} Refer to the implementation for the precise returned value.
   */
  '@tinyartist': path.resolve(projectRoot, '..', '..', '..'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} '.' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, '.'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} '.' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, '.'} Result produced by resolve.
   */
  '@editor': path.resolve(projectRoot, '.'),
  /**
   * resolve - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} projectRoot - Parameter derived from the static analyzer.
   * @param {*} 'assets' - Parameter derived from the static analyzer.
   *
   * @returns {projectRoot, 'assets'} Refer to the implementation for the precise returned value.
   */
  /**
   * resolve - Auto-generated documentation stub.
   *
   * @param {*} projectRoot - Parameter forwarded to resolve.
   * @param {*} 'assets' - Parameter forwarded to resolve.
   *
   * @returns {projectRoot, 'assets'} Result produced by resolve.
   */
  '@assets': path.resolve(projectRoot, 'assets'),
};

/**
 * Set - Auto-generated summary; refine if additional context is needed.
 *
 * @param {*} ['fs' - Parameter derived from the static analyzer.
 * @param {*} 'path' - Parameter derived from the static analyzer.
 * @param {*} 'module' - Parameter derived from the static analyzer.
 * @param {*} 'os' - Parameter derived from the static analyzer.
 * @param {*} 'child_process'] - Parameter derived from the static analyzer.
 *
 * @returns {['fs', 'path', 'module', 'os', 'child_process']} Refer to the implementation for the precise returned value.
 */
/**
 * Set - Auto-generated documentation stub.
 *
 * @param {*} ['fs' - Parameter forwarded to Set.
 * @param {*} 'path' - Parameter forwarded to Set.
 * @param {*} 'module' - Parameter forwarded to Set.
 * @param {*} 'os' - Parameter forwarded to Set.
 * @param {*} 'child_process'] - Parameter forwarded to Set.
 *
 * @returns {['fs', 'path', 'module', 'os', 'child_process']} Result produced by Set.
 */
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

/**
 * ensureEntryFile - Auto-generated summary; refine if additional context is needed.
 */
/**
 * ensureEntryFile - Auto-generated documentation stub.
 */
function ensureEntryFile() {
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (!fs.existsSync(entryFile)) {
    /**
     * Error - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {'Entry file index.tsx not found'} Refer to the implementation for the precise returned value.
     */
    /**
     * Error - Auto-generated documentation stub.
     *
     * @returns {'Entry file index.tsx not found'} Result produced by Error.
     */
    throw new Error('Entry file index.tsx not found');
  }
}

/**
 * ensureOutDir - Auto-generated summary; refine if additional context is needed.
 */
/**
 * ensureOutDir - Auto-generated documentation stub.
 */
function ensureOutDir() {
  /**
   * mkdirSync - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} outDir - Parameter derived from the static analyzer.
   * @param {*} { recursive - Parameter derived from the static analyzer.
   *
   * @returns {outDir, { recursive: true }} Refer to the implementation for the precise returned value.
   */
  /**
   * mkdirSync - Auto-generated documentation stub.
   *
   * @param {*} outDir - Parameter forwarded to mkdirSync.
   * @param {*} { recursive - Parameter forwarded to mkdirSync.
   *
   * @returns {outDir, { recursive: true }} Result produced by mkdirSync.
   */
  fs.mkdirSync(outDir, { recursive: true });
}

/**
 * createDefine - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {isProd} Refer to the implementation for the precise returned value.
 */
/**
 * createDefine - Auto-generated documentation stub.
 *
 * @returns {isProd} Result produced by createDefine.
 */
function createDefine(isProd) {
  return {
    /**
     * stringify - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} isProd ? 'production' - Parameter derived from the static analyzer.
     *
     * @returns {isProd ? 'production' : 'development'} Refer to the implementation for the precise returned value.
     */
    /**
     * stringify - Auto-generated documentation stub.
     *
     * @param {*} isProd ? 'production' - Parameter forwarded to stringify.
     *
     * @returns {isProd ? 'production' : 'development'} Result produced by stringify.
     */
    'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
    /**
     * stringify - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {'web'} Refer to the implementation for the precise returned value.
     */
    /**
     * stringify - Auto-generated documentation stub.
     *
     * @returns {'web'} Result produced by stringify.
     */
    'process.env.TAMAGUI_TARGET': JSON.stringify('web'),
    /**
     * stringify - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {'1'} Refer to the implementation for the precise returned value.
     */
    /**
     * stringify - Auto-generated documentation stub.
     *
     * @returns {'1'} Result produced by stringify.
     */
    'process.env.TAMAGUI_DISABLE_WARNINGS': JSON.stringify('1'),
    global: 'window',
  };
}

/**
 * createEnvBanner - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {isProd} Refer to the implementation for the precise returned value.
 */
/**
 * createEnvBanner - Auto-generated documentation stub.
 *
 * @returns {isProd} Result produced by createEnvBanner.
 */
function createEnvBanner(isProd) {
  return `
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  if (typeof globalThis.process === 'undefined') {
    globalThis.process = { env: {} };
  }
  globalThis.process.env = globalThis.process.env || {};
  /**
   * stringify - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} isProd ? 'production' - Parameter derived from the static analyzer.
   *
   * @returns {isProd ? 'production' : 'development'} Refer to the implementation for the precise returned value.
   */
  /**
   * stringify - Auto-generated documentation stub.
   *
   * @param {*} isProd ? 'production' - Parameter forwarded to stringify.
   *
   * @returns {isProd ? 'production' : 'development'} Result produced by stringify.
   */
  globalThis.process.env.NODE_ENV = ${JSON.stringify(isProd ? 'production' : 'development')};
  globalThis.process.env.TAMAGUI_TARGET = 'web';
  globalThis.process.env.TAMAGUI_DISABLE_WARNINGS = '1';
  globalThis.process.browser = true;
`;
}

/**
 * escapeRegExp - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {value} Refer to the implementation for the precise returned value.
 */
/**
 * escapeRegExp - Auto-generated documentation stub.
 *
 * @returns {value} Result produced by escapeRegExp.
 */
function escapeRegExp(value) {
  /**
   * replace - Auto-generated summary; refine if additional context is needed.
   */
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const extensionPriority = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'];

/**
 * resolveWithExtensions - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {candidate} Refer to the implementation for the precise returned value.
 */
/**
 * resolveWithExtensions - Auto-generated documentation stub.
 *
 * @returns {candidate} Result produced by resolveWithExtensions.
 */
function resolveWithExtensions(candidate) {
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  if (fs.existsSync(candidate)) {
    /**
     * statSync - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {candidate} Refer to the implementation for the precise returned value.
     */
    /**
     * statSync - Auto-generated documentation stub.
     *
     * @returns {candidate} Result produced by statSync.
     */
    const stat = fs.statSync(candidate);
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (stat.isFile()) {
      return candidate;
    }
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (stat.isDirectory()) {
      /**
       * for - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} const ext of ['' - Parameter derived from the static analyzer.
       * @param {*} ...extensionPriority] - Parameter derived from the static analyzer.
       *
       * @returns {const ext of ['', ...extensionPriority]} Refer to the implementation for the precise returned value.
       */
      /**
       * for - Auto-generated documentation stub.
       *
       * @param {*} const ext of ['' - Parameter forwarded to for.
       * @param {*} ...extensionPriority] - Parameter forwarded to for.
       *
       * @returns {const ext of ['', ...extensionPriority]} Result produced by for.
       */
      for (const ext of ['', ...extensionPriority]) {
        /**
         * join - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} candidate - Parameter derived from the static analyzer.
         * @param {*} `index${ext}` - Parameter derived from the static analyzer.
         */
        /**
         * join - Auto-generated documentation stub.
         *
         * @param {*} candidate - Parameter forwarded to join.
         * @param {*} `index${ext}` - Parameter forwarded to join.
         */
        const indexFile = ext ? path.join(candidate, `index${ext}`) : path.join(candidate, 'index');
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        if (fs.existsSync(indexFile)) {
          /**
           * statSync - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {indexFile} Refer to the implementation for the precise returned value.
           */
          /**
           * statSync - Auto-generated documentation stub.
           *
           * @returns {indexFile} Result produced by statSync.
           */
          const indexStat = fs.statSync(indexFile);
          /**
           * if - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * if - Auto-generated documentation stub.
           */
          if (indexStat.isFile()) {
            return indexFile;
          }
        }
      }
      return candidate;
    }
  }

  /**
   * for - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {const ext of extensionPriority} Refer to the implementation for the precise returned value.
   */
  /**
   * for - Auto-generated documentation stub.
   *
   * @returns {const ext of extensionPriority} Result produced by for.
   */
  for (const ext of extensionPriority) {
    const filePath = `${candidate}${ext}`;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }
  }

  return null;
}

/**
 * createAliasPlugin - Auto-generated summary; refine if additional context is needed.
 */
/**
 * createAliasPlugin - Auto-generated documentation stub.
 */
function createAliasPlugin() {
  /**
   * entries - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {aliasMap} Refer to the implementation for the precise returned value.
   */
  const entries = Object.entries(aliasMap);
  return {
    name: 'alias-plugin',
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
       * onResolve - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} { filter - Parameter derived from the static analyzer.
       * @param {*} (args - Parameter derived from the static analyzer.
       */
      /**
       * onResolve - Auto-generated documentation stub.
       *
       * @param {*} { filter - Parameter forwarded to onResolve.
       * @param {*} (args - Parameter forwarded to onResolve.
       */
      build.onResolve({ filter: /.*/ }, (args) => {
        /**
         * for - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} const [from - Parameter derived from the static analyzer.
         * @param {*} target] of entries - Parameter derived from the static analyzer.
         *
         * @returns {const [from, target] of entries} Refer to the implementation for the precise returned value.
         */
        /**
         * for - Auto-generated documentation stub.
         *
         * @param {*} const [from - Parameter forwarded to for.
         * @param {*} target] of entries - Parameter forwarded to for.
         *
         * @returns {const [from, target] of entries} Result produced by for.
         */
        for (const [from, target] of entries) {
          /**
           * if - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * if - Auto-generated documentation stub.
           */
          if (args.path === from || args.path.startsWith(`${from}/`)) {
            /**
             * slice - Auto-generated summary; refine if additional context is needed.
             *
             * @returns {from.length + 1} Refer to the implementation for the precise returned value.
             */
            /**
             * slice - Auto-generated documentation stub.
             *
             * @returns {from.length + 1} Result produced by slice.
             */
            const remainder = args.path === from ? '' : args.path.slice(from.length + 1);
            /**
             * if - Auto-generated summary; refine if additional context is needed.
             */
            /**
             * if - Auto-generated documentation stub.
             */
            if (path.isAbsolute(target)) {
              /**
               * join - Auto-generated summary; refine if additional context is needed.
               *
               * @param {*} target - Parameter derived from the static analyzer.
               * @param {*} remainder - Parameter derived from the static analyzer.
               *
               * @returns {target;} Refer to the implementation for the precise returned value.
               */
              /**
               * join - Auto-generated documentation stub.
               *
               * @param {*} target - Parameter forwarded to join.
               * @param {*} remainder - Parameter forwarded to join.
               *
               * @returns {target;} Result produced by join.
               */
              const candidate = remainder ? path.join(target, remainder) : target;
              /**
               * resolveWithExtensions - Auto-generated summary; refine if additional context is needed.
               *
               * @returns {candidate} Refer to the implementation for the precise returned value.
               */
              /**
               * resolveWithExtensions - Auto-generated documentation stub.
               *
               * @returns {candidate} Result produced by resolveWithExtensions.
               */
              const resolvedPath = resolveWithExtensions(candidate);
              /**
               * if - Auto-generated summary; refine if additional context is needed.
               *
               * @returns {!resolvedPath} Refer to the implementation for the precise returned value.
               */
              /**
               * if - Auto-generated documentation stub.
               *
               * @returns {!resolvedPath} Result produced by if.
               */
              if (!resolvedPath) {
                /**
                 * Error - Auto-generated summary; refine if additional context is needed.
                 *
                 * @returns {`Unable to resolve alias ${args.path} -> ${candidate}`} Refer to the implementation for the precise returned value.
                 */
                /**
                 * Error - Auto-generated documentation stub.
                 *
                 * @returns {`Unable to resolve alias ${args.path} -> ${candidate}`} Result produced by Error.
                 */
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

/**
 * createEmptyModulePlugin - Auto-generated summary; refine if additional context is needed.
 */
/**
 * createEmptyModulePlugin - Auto-generated documentation stub.
 */
function createEmptyModulePlugin() {
  return {
    name: 'empty-module-plugin',
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
       * RegExp - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * RegExp - Auto-generated documentation stub.
       */
      const filter = new RegExp(`^(${Array.from(emptyModules).map(escapeRegExp).join('|')})$`);
      /**
       * onResolve - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} { filter } - Parameter derived from the static analyzer.
       * @param {*} (args - Parameter derived from the static analyzer.
       */
      build.onResolve({ filter }, (args) => ({ path: args.path, namespace: 'empty-module' }));
      /**
       * onLoad - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} { filter - Parameter derived from the static analyzer.
       * @param {*} namespace - Parameter derived from the static analyzer.
       * @param {*} ( - Parameter derived from the static analyzer.
       */
      /**
       * onLoad - Auto-generated documentation stub.
       *
       * @param {*} { filter - Parameter forwarded to onLoad.
       * @param {*} namespace - Parameter forwarded to onLoad.
       * @param {*} ( - Parameter forwarded to onLoad.
       */
      build.onLoad({ filter: /.*/, namespace: 'empty-module' }, () => ({ contents: 'export default {};', loader: 'js' }));
    },
  };
}

/**
 * deriveBuildId - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {jsFileName} Refer to the implementation for the precise returned value.
 */
/**
 * deriveBuildId - Auto-generated documentation stub.
 *
 * @returns {jsFileName} Result produced by deriveBuildId.
 */
function deriveBuildId(jsFileName) {
  /**
   * match - Auto-generated summary; refine if additional context is needed.
   */
  const match = jsFileName.match(/editor\.bundle\.(.+)\.js$/);
  return match ? match[1] : jsFileName;
}

/**
 * createAssetManifestPlugin - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {{ mode }} Refer to the implementation for the precise returned value.
 */
/**
 * createAssetManifestPlugin - Auto-generated documentation stub.
 *
 * @returns {{ mode }} Result produced by createAssetManifestPlugin.
 */
function createAssetManifestPlugin({ mode }) {
  return {
    name: 'asset-manifest-plugin',
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
         * @returns {result.errors.length > 0 || !result.metafile} Refer to the implementation for the precise returned value.
         */
        /**
         * if - Auto-generated documentation stub.
         *
         * @returns {result.errors.length > 0 || !result.metafile} Result produced by if.
         */
        if (result.errors.length > 0 || !result.metafile) {
          return;
        }

        let jsFile = null;
        let cssFile = null;

        /**
         * for - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} const [outputPath - Parameter derived from the static analyzer.
         * @param {*} outputMeta] of Object.entries(result.metafile.outputs - Parameter derived from the static analyzer.
         */
        /**
         * for - Auto-generated documentation stub.
         *
         * @param {*} const [outputPath - Parameter forwarded to for.
         * @param {*} outputMeta] of Object.entries(result.metafile.outputs - Parameter forwarded to for.
         */
        for (const [outputPath, outputMeta] of Object.entries(result.metafile.outputs)) {
          /**
           * basename - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {outputPath} Refer to the implementation for the precise returned value.
           */
          /**
           * basename - Auto-generated documentation stub.
           *
           * @returns {outputPath} Result produced by basename.
           */
          const fileName = path.basename(outputPath);

          if (
            outputMeta.entryPoint &&
            /**
             * resolve - Auto-generated summary; refine if additional context is needed.
             *
             * @param {*} projectRoot - Parameter derived from the static analyzer.
             * @param {*} outputMeta.entryPoint - Parameter derived from the static analyzer.
             *
             * @returns {projectRoot, outputMeta.entryPoint} Refer to the implementation for the precise returned value.
             */
            /**
             * resolve - Auto-generated documentation stub.
             *
             * @param {*} projectRoot - Parameter forwarded to resolve.
             * @param {*} outputMeta.entryPoint - Parameter forwarded to resolve.
             *
             * @returns {projectRoot, outputMeta.entryPoint} Result produced by resolve.
             */
            path.resolve(projectRoot, outputMeta.entryPoint) !== entryFile
          ) {
            continue;
          }

          /**
           * if - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * if - Auto-generated documentation stub.
           */
          if (!outputMeta.entryPoint && !fileName.startsWith(`${bundleBaseName}.`)) {
            continue;
          }

          /**
           * if - Auto-generated summary; refine if additional context is needed.
           */
          if (outputPath.endsWith('.js') && fileName.startsWith(`${bundleBaseName}.`)) {
            jsFile = fileName;
          /**
           * if - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * if - Auto-generated documentation stub.
           */
          } else if (outputPath.endsWith('.css') && fileName.startsWith(`${bundleBaseName}.`)) {
            cssFile = fileName;
          }
        }

        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {!jsFile} Refer to the implementation for the precise returned value.
         */
        /**
         * if - Auto-generated documentation stub.
         *
         * @returns {!jsFile} Result produced by if.
         */
        if (!jsFile) {
          /**
           * warn - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} 'asset-manifest-plugin - Parameter derived from the static analyzer.
           *
           * @returns {'asset-manifest-plugin: Unable to locate primary JS bundle.'} Refer to the implementation for the precise returned value.
           */
          /**
           * warn - Auto-generated documentation stub.
           *
           * @param {*} 'asset-manifest-plugin - Parameter forwarded to warn.
           *
           * @returns {'asset-manifest-plugin: Unable to locate primary JS bundle.'} Result produced by warn.
           */
          console.warn('asset-manifest-plugin: Unable to locate primary JS bundle.');
          return;
        }

        const manifest = {
          /**
           * deriveBuildId - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {jsFile} Refer to the implementation for the precise returned value.
           */
          /**
           * deriveBuildId - Auto-generated documentation stub.
           *
           * @returns {jsFile} Result produced by deriveBuildId.
           */
          buildId: deriveBuildId(jsFile),
          js: jsFile,
          css: cssFile ?? null,
          mode,
          /**
           * Date - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * Date - Auto-generated documentation stub.
           */
          createdAt: new Date().toISOString(),
        };

        /**
         * writeFileSync - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} manifestFile - Parameter derived from the static analyzer.
         * @param {*} `${JSON.stringify(manifest - Parameter derived from the static analyzer.
         * @param {*} null - Parameter derived from the static analyzer.
         * @param {*} 2 - Parameter derived from the static analyzer.
         */
        /**
         * writeFileSync - Auto-generated documentation stub.
         *
         * @param {*} manifestFile - Parameter forwarded to writeFileSync.
         * @param {*} `${JSON.stringify(manifest - Parameter forwarded to writeFileSync.
         * @param {*} null - Parameter forwarded to writeFileSync.
         * @param {*} 2 - Parameter forwarded to writeFileSync.
         */
        fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
        /**
         * log - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {`Generated asset manifest for ${jsFile}`} Refer to the implementation for the precise returned value.
         */
        /**
         * log - Auto-generated documentation stub.
         *
         * @returns {`Generated asset manifest for ${jsFile}`} Result produced by log.
         */
        console.log(`Generated asset manifest for ${jsFile}`);

        /**
         * persistFallbackAsset - Auto-generated summary; refine if additional context is needed.
         */
        const persistFallbackAsset = (assetFile, fallbackFileName) => {
          /**
           * if - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {!assetFile} Refer to the implementation for the precise returned value.
           */
          if (!assetFile) {
            return;
          }

          /**
           * join - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} outDir - Parameter derived from the static analyzer.
           * @param {*} assetFile - Parameter derived from the static analyzer.
           *
           * @returns {outDir, assetFile} Refer to the implementation for the precise returned value.
           */
          /**
           * join - Auto-generated documentation stub.
           *
           * @param {*} outDir - Parameter forwarded to join.
           * @param {*} assetFile - Parameter forwarded to join.
           *
           * @returns {outDir, assetFile} Result produced by join.
           */
          const assetPath = path.join(outDir, assetFile);
          /**
           * join - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} outDir - Parameter derived from the static analyzer.
           * @param {*} fallbackFileName - Parameter derived from the static analyzer.
           *
           * @returns {outDir, fallbackFileName} Refer to the implementation for the precise returned value.
           */
          /**
           * join - Auto-generated documentation stub.
           *
           * @param {*} outDir - Parameter forwarded to join.
           * @param {*} fallbackFileName - Parameter forwarded to join.
           *
           * @returns {outDir, fallbackFileName} Result produced by join.
           */
          const fallbackPath = path.join(outDir, fallbackFileName);

          /**
           * if - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * if - Auto-generated documentation stub.
           */
          if (assetPath === fallbackPath) {
            return;
          }

          try {
            /**
             * copyFileSync - Auto-generated summary; refine if additional context is needed.
             *
             * @param {*} assetPath - Parameter derived from the static analyzer.
             * @param {*} fallbackPath - Parameter derived from the static analyzer.
             *
             * @returns {assetPath, fallbackPath} Refer to the implementation for the precise returned value.
             */
            /**
             * copyFileSync - Auto-generated documentation stub.
             *
             * @param {*} assetPath - Parameter forwarded to copyFileSync.
             * @param {*} fallbackPath - Parameter forwarded to copyFileSync.
             *
             * @returns {assetPath, fallbackPath} Result produced by copyFileSync.
             */
            fs.copyFileSync(assetPath, fallbackPath);
            /**
             * log - Auto-generated summary; refine if additional context is needed.
             *
             * @returns {`Updated fallback asset ${fallbackFileName}`} Refer to the implementation for the precise returned value.
             */
            /**
             * log - Auto-generated documentation stub.
             *
             * @returns {`Updated fallback asset ${fallbackFileName}`} Result produced by log.
             */
            console.log(`Updated fallback asset ${fallbackFileName}`);
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
             * warn - Auto-generated summary; refine if additional context is needed.
             *
             * @param {*} `Failed to update fallback asset ${fallbackFileName} - Parameter derived from the static analyzer.
             * @param {*} error - Parameter derived from the static analyzer.
             *
             * @returns {`Failed to update fallback asset ${fallbackFileName}:`, error} Refer to the implementation for the precise returned value.
             */
            /**
             * warn - Auto-generated documentation stub.
             *
             * @param {*} `Failed to update fallback asset ${fallbackFileName} - Parameter forwarded to warn.
             * @param {*} error - Parameter forwarded to warn.
             *
             * @returns {`Failed to update fallback asset ${fallbackFileName}:`, error} Result produced by warn.
             */
            console.warn(`Failed to update fallback asset ${fallbackFileName}:`, error);
          }
        };

        /**
         * persistFallbackAsset - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} jsFile - Parameter derived from the static analyzer.
         * @param {*} fallbackJsFile - Parameter derived from the static analyzer.
         *
         * @returns {jsFile, fallbackJsFile} Refer to the implementation for the precise returned value.
         */
        /**
         * persistFallbackAsset - Auto-generated documentation stub.
         *
         * @param {*} jsFile - Parameter forwarded to persistFallbackAsset.
         * @param {*} fallbackJsFile - Parameter forwarded to persistFallbackAsset.
         *
         * @returns {jsFile, fallbackJsFile} Result produced by persistFallbackAsset.
         */
        persistFallbackAsset(jsFile, fallbackJsFile);
        /**
         * persistFallbackAsset - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} cssFile - Parameter derived from the static analyzer.
         * @param {*} fallbackCssFile - Parameter derived from the static analyzer.
         *
         * @returns {cssFile, fallbackCssFile} Refer to the implementation for the precise returned value.
         */
        /**
         * persistFallbackAsset - Auto-generated documentation stub.
         *
         * @param {*} cssFile - Parameter forwarded to persistFallbackAsset.
         * @param {*} fallbackCssFile - Parameter forwarded to persistFallbackAsset.
         *
         * @returns {cssFile, fallbackCssFile} Result produced by persistFallbackAsset.
         */
        persistFallbackAsset(cssFile, fallbackCssFile);
      });
    },
  };
}

/**
 * resolveAssetHref - Auto-generated summary; refine if additional context is needed.
 *
 * @param {*} assetFile - Parameter derived from the static analyzer.
 * @param {*} fallbackFileName - Parameter derived from the static analyzer.
 *
 * @returns {assetFile, fallbackFileName} Refer to the implementation for the precise returned value.
 */
/**
 * resolveAssetHref - Auto-generated documentation stub.
 *
 * @param {*} assetFile - Parameter forwarded to resolveAssetHref.
 * @param {*} fallbackFileName - Parameter forwarded to resolveAssetHref.
 *
 * @returns {assetFile, fallbackFileName} Result produced by resolveAssetHref.
 */
function resolveAssetHref(assetFile, fallbackFileName) {
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {assetFile} Refer to the implementation for the precise returned value.
   */
  /**
   * if - Auto-generated documentation stub.
   *
   * @returns {assetFile} Result produced by if.
   */
  if (assetFile) {
    return `./dist/${assetFile}`;
  }

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {!fallbackFileName} Refer to the implementation for the precise returned value.
   */
  /**
   * if - Auto-generated documentation stub.
   *
   * @returns {!fallbackFileName} Result produced by if.
   */
  if (!fallbackFileName) {
    return null;
  }

  return `./dist/${fallbackFileName}`;
}

/**
 * createLiveReloadSnippet - Auto-generated summary; refine if additional context is needed.
 */
/**
 * createLiveReloadSnippet - Auto-generated documentation stub.
 */
function createLiveReloadSnippet() {
  return `
    <script>
      /**
       * function - Auto-generated summary; refine if additional context is needed.
       */
      (function () {
        var source;
        /**
         * connect - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * connect - Auto-generated documentation stub.
         */
        function connect() {
          /**
           * EventSource - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {'/__livereload'} Refer to the implementation for the precise returned value.
           */
          /**
           * EventSource - Auto-generated documentation stub.
           *
           * @returns {'/__livereload'} Result produced by EventSource.
           */
          source = new EventSource('/__livereload');
          /**
           * addEventListener - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} 'reload' - Parameter derived from the static analyzer.
           * @param {*} function ( - Parameter derived from the static analyzer.
           */
          /**
           * addEventListener - Auto-generated documentation stub.
           *
           * @param {*} 'reload' - Parameter forwarded to addEventListener.
           * @param {*} function ( - Parameter forwarded to addEventListener.
           */
          source.addEventListener('reload', function () {
            /**
             * reload - Auto-generated summary; refine if additional context is needed.
             */
            window.location.reload();
          });
          /**
           * addEventListener - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} 'open' - Parameter derived from the static analyzer.
           * @param {*} function ( - Parameter derived from the static analyzer.
           */
          /**
           * addEventListener - Auto-generated documentation stub.
           *
           * @param {*} 'open' - Parameter forwarded to addEventListener.
           * @param {*} function ( - Parameter forwarded to addEventListener.
           */
          source.addEventListener('open', function () {
            /**
             * log - Auto-generated summary; refine if additional context is needed.
             *
             * @returns {'[watch] Connected to live reload server.'} Refer to the implementation for the precise returned value.
             */
            /**
             * log - Auto-generated documentation stub.
             *
             * @returns {'[watch] Connected to live reload server.'} Result produced by log.
             */
            console.log('[watch] Connected to live reload server.');
          });
          /**
           * addEventListener - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} 'error' - Parameter derived from the static analyzer.
           * @param {*} function ( - Parameter derived from the static analyzer.
           */
          /**
           * addEventListener - Auto-generated documentation stub.
           *
           * @param {*} 'error' - Parameter forwarded to addEventListener.
           * @param {*} function ( - Parameter forwarded to addEventListener.
           */
          source.addEventListener('error', function () {
            /**
             * if - Auto-generated summary; refine if additional context is needed.
             *
             * @returns {source} Refer to the implementation for the precise returned value.
             */
            /**
             * if - Auto-generated documentation stub.
             *
             * @returns {source} Result produced by if.
             */
            if (source) {
              /**
               * close - Auto-generated summary; refine if additional context is needed.
               */
              /**
               * close - Auto-generated documentation stub.
               */
              source.close();
            }
            /**
             * setTimeout - Auto-generated summary; refine if additional context is needed.
             *
             * @param {*} connect - Parameter derived from the static analyzer.
             * @param {*} 1000 - Parameter derived from the static analyzer.
             *
             * @returns {connect, 1000} Refer to the implementation for the precise returned value.
             */
            /**
             * setTimeout - Auto-generated documentation stub.
             *
             * @param {*} connect - Parameter forwarded to setTimeout.
             * @param {*} 1000 - Parameter forwarded to setTimeout.
             *
             * @returns {connect, 1000} Result produced by setTimeout.
             */
            setTimeout(connect, 1000);
          });
        }

        /**
         * connect - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * connect - Auto-generated documentation stub.
         */
        connect();
      })();
    </script>
  `;
}

/**
 * renderIndexHtml - Auto-generated summary; refine if additional context is needed.
 *
 * @param {*} { jsFile - Parameter derived from the static analyzer.
 * @param {*} cssFile } = {} - Parameter derived from the static analyzer.
 * @param {*} { injectLiveReload = false } = {} - Parameter derived from the static analyzer.
 */
/**
 * renderIndexHtml - Auto-generated documentation stub.
 *
 * @param {*} { jsFile - Parameter forwarded to renderIndexHtml.
 * @param {*} cssFile } = {} - Parameter forwarded to renderIndexHtml.
 * @param {*} { injectLiveReload = false } = {} - Parameter forwarded to renderIndexHtml.
 */
function renderIndexHtml({ jsFile, cssFile } = {}, { injectLiveReload = false } = {}) {
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (!fs.existsSync(indexTemplateFile)) {
    /**
     * warn - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {'index.template.html not found. Skipping index.html generation.'} Refer to the implementation for the precise returned value.
     */
    /**
     * warn - Auto-generated documentation stub.
     *
     * @returns {'index.template.html not found. Skipping index.html generation.'} Result produced by warn.
     */
    console.warn('index.template.html not found. Skipping index.html generation.');
    return null;
  }

  /**
   * readFileSync - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} indexTemplateFile - Parameter derived from the static analyzer.
   * @param {*} 'utf8' - Parameter derived from the static analyzer.
   *
   * @returns {indexTemplateFile, 'utf8'} Refer to the implementation for the precise returned value.
   */
  /**
   * readFileSync - Auto-generated documentation stub.
   *
   * @param {*} indexTemplateFile - Parameter forwarded to readFileSync.
   * @param {*} 'utf8' - Parameter forwarded to readFileSync.
   *
   * @returns {indexTemplateFile, 'utf8'} Result produced by readFileSync.
   */
  const template = fs.readFileSync(indexTemplateFile, 'utf8');
  /**
   * resolveAssetHref - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} jsFile - Parameter derived from the static analyzer.
   * @param {*} fallbackJsFile - Parameter derived from the static analyzer.
   *
   * @returns {jsFile, fallbackJsFile} Refer to the implementation for the precise returned value.
   */
  /**
   * resolveAssetHref - Auto-generated documentation stub.
   *
   * @param {*} jsFile - Parameter forwarded to resolveAssetHref.
   * @param {*} fallbackJsFile - Parameter forwarded to resolveAssetHref.
   *
   * @returns {jsFile, fallbackJsFile} Result produced by resolveAssetHref.
   */
  const jsHref = resolveAssetHref(jsFile, fallbackJsFile);
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {!jsHref} Refer to the implementation for the precise returned value.
   */
  /**
   * if - Auto-generated documentation stub.
   *
   * @returns {!jsHref} Result produced by if.
   */
  if (!jsHref) {
    /**
     * warn - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {'Unable to determine editor bundle script.'} Refer to the implementation for the precise returned value.
     */
    /**
     * warn - Auto-generated documentation stub.
     *
     * @returns {'Unable to determine editor bundle script.'} Result produced by warn.
     */
    console.warn('Unable to determine editor bundle script.');
    return null;
  }

  /**
   * resolveAssetHref - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} cssFile - Parameter derived from the static analyzer.
   * @param {*} fallbackCssFile - Parameter derived from the static analyzer.
   *
   * @returns {cssFile, fallbackCssFile} Refer to the implementation for the precise returned value.
   */
  /**
   * resolveAssetHref - Auto-generated documentation stub.
   *
   * @param {*} cssFile - Parameter forwarded to resolveAssetHref.
   * @param {*} fallbackCssFile - Parameter forwarded to resolveAssetHref.
   *
   * @returns {cssFile, fallbackCssFile} Result produced by resolveAssetHref.
   */
  const cssHref = resolveAssetHref(cssFile, fallbackCssFile);
  const cssTag = cssHref ? `<link rel="stylesheet" href="${cssHref}" />` : '';

  /**
   * replace - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} /{{CSS_LINK}}/g - Parameter derived from the static analyzer.
   * @param {*} cssTag - Parameter derived from the static analyzer.
   *
   * @returns {/{{CSS_LINK}}/g, cssTag} Refer to the implementation for the precise returned value.
   */
  /**
   * replace - Auto-generated documentation stub.
   *
   * @param {*} /{{CSS_LINK}}/g - Parameter forwarded to replace.
   * @param {*} cssTag - Parameter forwarded to replace.
   *
   * @returns {/{{CSS_LINK}}/g, cssTag} Result produced by replace.
   */
  let html = template.replace(/{{CSS_LINK}}/g, cssTag).replace(/{{JS_SRC}}/g, jsHref);

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {injectLiveReload} Refer to the implementation for the precise returned value.
   */
  /**
   * if - Auto-generated documentation stub.
   *
   * @returns {injectLiveReload} Result produced by if.
   */
  if (injectLiveReload) {
    /**
     * replace - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} '</body>' - Parameter derived from the static analyzer.
     * @param {*} `${createLiveReloadSnippet( - Parameter derived from the static analyzer.
     */
    /**
     * replace - Auto-generated documentation stub.
     *
     * @param {*} '</body>' - Parameter forwarded to replace.
     * @param {*} `${createLiveReloadSnippet( - Parameter forwarded to replace.
     */
    html = html.replace('</body>', `${createLiveReloadSnippet()}\n  </body>`);
  }

  return html;
}

/**
 * updateIndexHtml - Auto-generated summary; refine if additional context is needed.
 *
 * @param {*} manifest = null - Parameter derived from the static analyzer.
 * @param {*} options = {} - Parameter derived from the static analyzer.
 */
/**
 * updateIndexHtml - Auto-generated documentation stub.
 *
 * @param {*} manifest = null - Parameter forwarded to updateIndexHtml.
 * @param {*} options = {} - Parameter forwarded to updateIndexHtml.
 */
function updateIndexHtml(manifest = null, options = {}) {
  /**
   * renderIndexHtml - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} { jsFile - Parameter derived from the static analyzer.
   * @param {*} cssFile - Parameter derived from the static analyzer.
   * @param {*} options - Parameter derived from the static analyzer.
   *
   * @returns {{ jsFile: manifest?.js, cssFile: manifest?.css }, options} Refer to the implementation for the precise returned value.
   */
  /**
   * renderIndexHtml - Auto-generated documentation stub.
   *
   * @param {*} { jsFile - Parameter forwarded to renderIndexHtml.
   * @param {*} cssFile - Parameter forwarded to renderIndexHtml.
   * @param {*} options - Parameter forwarded to renderIndexHtml.
   *
   * @returns {{ jsFile: manifest?.js, cssFile: manifest?.css }, options} Result produced by renderIndexHtml.
   */
  const html = renderIndexHtml({ jsFile: manifest?.js, cssFile: manifest?.css }, options);
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {!html} Refer to the implementation for the precise returned value.
   */
  /**
   * if - Auto-generated documentation stub.
   *
   * @returns {!html} Result produced by if.
   */
  if (!html) {
    return;
  }

  /**
   * writeFileSync - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} indexHtmlFile - Parameter derived from the static analyzer.
   * @param {*} html - Parameter derived from the static analyzer.
   *
   * @returns {indexHtmlFile, html} Refer to the implementation for the precise returned value.
   */
  /**
   * writeFileSync - Auto-generated documentation stub.
   *
   * @param {*} indexHtmlFile - Parameter forwarded to writeFileSync.
   * @param {*} html - Parameter forwarded to writeFileSync.
   *
   * @returns {indexHtmlFile, html} Result produced by writeFileSync.
   */
  fs.writeFileSync(indexHtmlFile, html);

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {manifest?.js} Refer to the implementation for the precise returned value.
   */
  /**
   * if - Auto-generated documentation stub.
   *
   * @returns {manifest?.js} Result produced by if.
   */
  if (manifest?.js) {
    /**
     * log - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {`Updated index.html for ${manifest.js}`} Refer to the implementation for the precise returned value.
     */
    /**
     * log - Auto-generated documentation stub.
     *
     * @returns {`Updated index.html for ${manifest.js}`} Result produced by log.
     */
    console.log(`Updated index.html for ${manifest.js}`);
  } else {
    /**
     * log - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {'Updated index.html with fallback assets.'} Refer to the implementation for the precise returned value.
     */
    /**
     * log - Auto-generated documentation stub.
     *
     * @returns {'Updated index.html with fallback assets.'} Result produced by log.
     */
    console.log('Updated index.html with fallback assets.');
  }
}

/**
 * createBuildOptions - Auto-generated summary; refine if additional context is needed.
 */
/**
 * createBuildOptions - Auto-generated documentation stub.
 */
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
    /**
     * createDefine - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {isProd} Refer to the implementation for the precise returned value.
     */
    /**
     * createDefine - Auto-generated documentation stub.
     *
     * @returns {isProd} Result produced by createDefine.
     */
    define: createDefine(isProd),
    /**
     * resolve - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} projectRoot - Parameter derived from the static analyzer.
     * @param {*} 'tsconfig.json' - Parameter derived from the static analyzer.
     *
     * @returns {projectRoot, 'tsconfig.json'} Refer to the implementation for the precise returned value.
     */
    /**
     * resolve - Auto-generated documentation stub.
     *
     * @param {*} projectRoot - Parameter forwarded to resolve.
     * @param {*} 'tsconfig.json' - Parameter forwarded to resolve.
     *
     * @returns {projectRoot, 'tsconfig.json'} Result produced by resolve.
     */
    tsconfig: path.resolve(projectRoot, 'tsconfig.json'),
    logLevel: 'info',
    /**
     * createAliasPlugin - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * createAliasPlugin - Auto-generated documentation stub.
     */
    plugins: [createAliasPlugin(), createEmptyModulePlugin(), createAssetManifestPlugin({ mode })],
    banner: {
      /**
       * createEnvBanner - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {isProd} Refer to the implementation for the precise returned value.
       */
      js: createEnvBanner(isProd),
    },
    loader: loaders,
    metafile: true,
  };
}

// Build SCSS bundle
function buildCss () {
  const sass = require('sass');
  const scssEntry = path.resolve(__dirname, '..', 'assets', 'scss', 'tinyartist-editor.scss');
  const cssOut = path.resolve(__dirname, '..', 'assets', 'public', 'css', 'tinyartist-editor.css');
  const sassResult = sass.compile(scssEntry, { style: 'expanded' });
  fs.mkdirSync(path.dirname(cssOut), { recursive: true });
  fs.writeFileSync(cssOut, sassResult.css, 'utf8');
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
  buildCss,
};
