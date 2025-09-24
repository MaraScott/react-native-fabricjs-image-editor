const { execSync } = require('child_process');

let ts;
try {
  // Attempt to resolve TypeScript from local node_modules
  ts = require('typescript');
} catch (error) {
  try {
    const globalRoot = execSync('npm root -g').toString().trim();
    const resolved = require.resolve('typescript', { paths: [globalRoot] });
    ts = require(resolved);
  } catch (globalError) {
    throw error;
  }
}

module.exports = function simpleTsLoader(source) {
  this.cacheable && this.cacheable();

  const compilerOptions = {
    module: ts.ModuleKind.NodeNext,
    target: ts.ScriptTarget.ES2018,
    jsx: ts.JsxEmit.ReactJSX,
    sourceMap: true,
    importHelpers: false,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    resolveJsonModule: true,
    skipLibCheck: true,
  };

  const result = ts.transpileModule(source, {
    compilerOptions,
    fileName: this.resourcePath,
    reportDiagnostics: true,
  });

  if (result.diagnostics && result.diagnostics.length > 0) {
    const formatted = ts.formatDiagnosticsWithColorAndContext(result.diagnostics, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => '\n',
    });
    this.emitError(new Error(formatted));
  }

  this.callback(null, result.outputText, result.sourceMapText);
};
