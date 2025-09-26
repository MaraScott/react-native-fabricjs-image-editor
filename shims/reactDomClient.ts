const globalScope: any =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : typeof self !== 'undefined'
        ? self
        : {};

const reactDomGlobal = globalScope.ReactDOM;

if (!reactDomGlobal) {
  console.warn(
    '[fabric-editor] ReactDOM global not found. Ensure react-dom.production.min.js is loaded before the editor bundle.',
  );
}

const createRootImpl = reactDomGlobal?.createRoot;
const hydrateRootImpl = reactDomGlobal?.hydrateRoot;

if (typeof createRootImpl !== 'function') {
  console.warn(
    '[fabric-editor] ReactDOM.createRoot is not available. Verify that the React 18 UMD build is used.',
  );
}

export const createRoot = (...args: any[]) => {
  if (typeof createRootImpl !== 'function') {
    throw new Error('ReactDOM.createRoot is not available in this environment.');
  }
  return createRootImpl(...args);
};

export const hydrateRoot = (...args: any[]) => {
  if (typeof hydrateRootImpl !== 'function') {
    throw new Error('ReactDOM.hydrateRoot is not available in this environment.');
  }
  return hydrateRootImpl(...args);
};

export default {
  createRoot,
  hydrateRoot,
};
