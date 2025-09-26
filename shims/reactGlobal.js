const globalScope = typeof globalThis !== 'undefined'
  ? globalThis
  : typeof window !== 'undefined'
  ? window
  : {};

const reactGlobal = globalScope.React;

if (!reactGlobal) {
  throw new Error(
    '[fabric-editor] React global not found. Make sure react.production.min.js loads before the editor bundle.'
  );
}

module.exports = reactGlobal;
module.exports.default = reactGlobal;
