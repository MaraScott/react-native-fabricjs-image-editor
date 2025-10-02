const globalObj = globalThis as typeof globalThis & {
  React?: typeof import('react');
};

if (!globalObj.React) {
  throw new Error('React global not found. Ensure vendor/react.production.min.js is loaded before the bundle.');
}

const React = globalObj.React as typeof import('react');

export default React;

export const {
  Children,
  Component,
  Fragment,
  Profiler,
  PureComponent,
  StrictMode,
  Suspense,
  cloneElement,
  createContext,
  createElement,
  createFactory,
  createRef,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  startTransition,
  unstable_act,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} = React;

export const version = React.version;
