const globalScope: any =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : typeof self !== 'undefined'
        ? self
        : {};

const reactGlobal = globalScope.React;

if (!reactGlobal) {
  console.warn(
    '[fabric-editor] React global not found. Ensure react.production.min.js is loaded before the editor bundle.',
  );
}

export default reactGlobal;

export const {
  Children,
  Component,
  Fragment,
  Profiler,
  PureComponent,
  StrictMode,
  Suspense,
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
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
  unstable_batchedUpdates,
  unstable_renderSubtreeIntoContainer,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  useId,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  version,
} = reactGlobal ?? ({} as any);

export type ReactNode = any;
export type PropsWithChildren<P = Record<string, unknown>> = P & { children?: ReactNode };
export type ComponentPropsWithoutRef<T> = Record<string, unknown> & { ref?: never };
export type RefObject<T> = { current: T | null };
export type ChangeEvent<T = Element> = {
  target: T;
  currentTarget: T;
  preventDefault: () => void;
  stopPropagation: () => void;
};
export type MouseEvent<T = Element> = ChangeEvent<T> & { nativeEvent?: Event };
export type SVGAttributes<T> = Record<string, unknown>;
