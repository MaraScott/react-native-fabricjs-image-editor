const globalScope = typeof globalThis !== 'undefined'
  ? globalThis
  : typeof window !== 'undefined'
  ? window
  : {};

const reactDomGlobal = globalScope.ReactDOM;

if (!reactDomGlobal) {
  throw new Error(
    '[fabric-editor] ReactDOM global not found. Make sure react-dom.production.min.js loads before the editor bundle.'
  );
}

module.exports = reactDomGlobal;
module.exports.default = reactDomGlobal;
