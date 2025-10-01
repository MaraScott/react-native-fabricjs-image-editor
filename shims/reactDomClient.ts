import type { ReactNode } from './reactGlobal';

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
  console.warn('[fabric-editor] ReactDOM global not found. Make sure react-dom.production.min.js is loaded before the editor bundle.');
}

export type Root = {
  render: (element: ReactNode) => void;
  unmount: () => void;
};

export function createRoot(container: Element | DocumentFragment): Root {
  if (!reactDomGlobal?.createRoot) {
    throw new Error('ReactDOM.createRoot is not available in the current environment.');
  }
  return reactDomGlobal.createRoot(container);
}

export function hydrateRoot(container: Element | DocumentFragment, element: ReactNode): Root {
  if (!reactDomGlobal?.hydrateRoot) {
    throw new Error('ReactDOM.hydrateRoot is not available in the current environment.');
  }
  return reactDomGlobal.hydrateRoot(container, element);
}

export default {
  createRoot,
  hydrateRoot,
};
