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

export default reactDomGlobal;

export const {
  createPortal,
  findDOMNode,
  flushSync,
  hydrate,
  render,
  unstable_batchedUpdates,
  unstable_renderSubtreeIntoContainer,
  version,
} = reactDomGlobal ?? ({} as any);
