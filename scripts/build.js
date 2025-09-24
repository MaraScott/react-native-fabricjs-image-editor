#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let ts;
try {
  ts = require('typescript');
} catch (error) {
  try {
    const globalRoot = execSync('npm root -g').toString().trim();
    const resolved = require.resolve('typescript', { paths: [globalRoot] });
    ts = require(resolved);
  } catch (globalError) {
    console.error('Unable to locate TypeScript.');
    process.exit(1);
  }
}

const projectRoot = process.cwd();
const entryFile = path.resolve(projectRoot, 'index.tsx');
const outputDir = path.resolve(projectRoot, 'dist');
const outputFile = path.join(outputDir, 'editor.bundle.js');

const externals = {
  react: 'window.React',
  'react-dom': 'window.ReactDOM',
  'react-dom/client': 'window.ReactDOM',
  konva: 'window.Konva',
};

const alias = {
  'react-konva': path.resolve(projectRoot, 'shims/reactKonva.tsx'),
  'react/jsx-runtime': path.resolve(projectRoot, 'shims/jsxRuntime.ts'),
  'its-fine': path.resolve(projectRoot, 'shims/itsFine.ts'),
};

const moduleCache = new Map();
const moduleOrder = [];
const usedExternals = new Set();

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getModuleId(filePath) {
  return './' + path.relative(projectRoot, filePath).replace(/\\/g, '/');
}

function getScriptKind(filePath) {
  if (filePath.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (filePath.endsWith('.ts')) return ts.ScriptKind.TS;
  if (filePath.endsWith('.jsx')) return ts.ScriptKind.JSX;
  return ts.ScriptKind.TS;
}

function indent(code, spaces = 4) {
  const padding = ' '.repeat(spaces);
  return code
    .split(/\r?\n/)
    .map((line) => padding + line)
    .join('\n');
}

function readFileSyncSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read file: ${filePath}`);
  }
}

function ensureFile(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`Module not found: ${filePath}`);
  }
}

function resolveImport(importerPath, specifier) {
  if (alias[specifier]) {
    return { type: 'module', path: alias[specifier] };
  }

  if (externals[specifier]) {
    usedExternals.add(specifier);
    return { type: 'external', id: specifier };
  }

  if (!specifier.startsWith('.')) {
    throw new Error(`Unsupported external module: ${specifier} (imported from ${importerPath})`);
  }

  const importerDir = path.dirname(importerPath);
  const resolvedBase = path.resolve(importerDir, specifier);

  if (specifier.endsWith('.css')) {
    ensureFile(resolvedBase);
    return { type: 'css', path: resolvedBase };
  }

  const candidates = [
    resolvedBase,
    resolvedBase + '.ts',
    resolvedBase + '.tsx',
    resolvedBase + '.js',
    resolvedBase + '.jsx',
    path.join(resolvedBase, 'index.ts'),
    path.join(resolvedBase, 'index.tsx'),
    path.join(resolvedBase, 'index.js'),
    path.join(resolvedBase, 'index.jsx'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return { type: 'module', path: candidate };
    }
  }

  throw new Error(`Cannot resolve module '${specifier}' from ${importerPath}`);
}

function collectDependencies(sourceFile) {
  const specifiers = new Set();
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.add(node.moduleSpecifier.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return Array.from(specifiers);
}

function processCssModule(filePath) {
  const absolutePath = path.resolve(filePath);
  if (moduleCache.has(absolutePath)) {
    return moduleCache.get(absolutePath).id;
  }
  const cssContent = readFileSyncSafe(absolutePath);
  const moduleId = getModuleId(absolutePath);
  const code = `const css = ${JSON.stringify(cssContent)};\nif (typeof document !== 'undefined') {\n  let style = document.querySelector('style[data-module="${moduleId}"]');\n  if (!style) {\n    style = document.createElement('style');\n    style.setAttribute('data-module', '${moduleId}');\n    style.textContent = css;\n    document.head.appendChild(style);\n  }\n}\nmodule.exports = css;`;
  const record = { id: moduleId, code };
  moduleCache.set(absolutePath, record);
  moduleOrder.push(record);
  return moduleId;
}

function processModule(filePath) {
  const absolutePath = path.resolve(filePath);
  if (moduleCache.has(absolutePath)) {
    return moduleCache.get(absolutePath).id;
  }

  const sourceText = readFileSyncSafe(absolutePath);
  const sourceFile = ts.createSourceFile(
    absolutePath,
    sourceText,
    ts.ScriptTarget.ESNext,
    true,
    getScriptKind(absolutePath),
  );

  const dependencies = collectDependencies(sourceFile);
  const replacements = {};

  for (const specifier of dependencies) {
    const resolved = resolveImport(absolutePath, specifier);
    if (resolved.type === 'css') {
      const depId = processCssModule(resolved.path);
      replacements[specifier] = depId;
    } else if (resolved.type === 'module') {
      const depId = processModule(resolved.path);
      replacements[specifier] = depId;
    }
  }

  const transpiled = ts.transpileModule(sourceText, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      resolveJsonModule: true,
      skipLibCheck: true,
    },
    fileName: absolutePath,
    reportDiagnostics: false,
  });

  let code = transpiled.outputText.replace(/\n?\/# sourceMappingURL=.*$/gm, '');

  if (code.includes('react/jsx-runtime')) {
    const runtimePath = alias['react/jsx-runtime'];
    const runtimeId = processModule(runtimePath);
    replacements['react/jsx-runtime'] = runtimeId;
  }

  for (const [specifier, replacement] of Object.entries(replacements)) {
    const pattern = new RegExp(`require\\(\\s*['"]${escapeRegExp(specifier)}['"]\\s*\\)`, 'g');
    code = code.replace(pattern, `require(${JSON.stringify(replacement)})`);
  }

  const moduleId = getModuleId(absolutePath);
  const record = { id: moduleId, code };
  moduleCache.set(absolutePath, record);
  moduleOrder.push(record);
  return moduleId;
}

function build() {
  if (!fs.existsSync(entryFile)) {
    throw new Error('Entry file index.tsx not found');
  }

  moduleCache.clear();
  moduleOrder.length = 0;
  usedExternals.clear();

  const entryId = processModule(entryFile);

  fs.mkdirSync(outputDir, { recursive: true });

  const moduleEntries = moduleOrder
    .map(({ id, code }) => `${JSON.stringify(id)}: function(module, exports, require) {\n${indent(code)}\n  }`)
    .concat(
      Object.entries(externals)
        .filter(([name]) => usedExternals.has(name))
        .map(
          ([name, globalRef]) =>
            `${JSON.stringify(name)}: function(module) {\n    module.exports = ${globalRef};\n  }`,
        ),
    )
    .join(',\n');

  const bundle = `(function(modules) {\n  var cache = {};\n  function require(id) {\n    if (!modules[id]) {\n      throw new Error('Module ' + id + ' not found');\n    }\n    if (cache[id]) {\n      return cache[id].exports;\n    }\n    var module = { exports: {} };\n    cache[id] = module;\n    modules[id](module, module.exports, require);\n    return module.exports;\n  }\n  require(${JSON.stringify(entryId)});\n})({\n${moduleEntries}\n});\n`;

  fs.writeFileSync(outputFile, bundle, 'utf8');
  console.log(`Build completed. Wrote ${outputFile}`);
}

try {
  build();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
