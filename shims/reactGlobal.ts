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
  console.warn('[fabric-editor] React global not found. Make sure react.production.min.js is loaded before the editor bundle.');
}

export type ReactNode = any;
export type PropsWithChildren<P = Record<string, unknown>> = P & { children?: ReactNode };
export type MutableRefObject<T> = { current: T };
export type RefObject<T> = MutableRefObject<T | null>;
export type Ref<T> = ((instance: T | null) => void) | MutableRefObject<T | null> | null;
export type Dispatch<A> = (value: A) => void;
export type SetStateAction<S> = S | ((prev: S) => S);
export type ChangeEvent<T = any> = { target: T; currentTarget: T };
export type CSSProperties = Record<string, string | number>;
export type ComponentType<P = {}> = (props: P) => ReactNode;
export type ForwardRefRenderFunction<T, P = {}> = (props: P, ref: Ref<T>) => ReactNode;
export type FC<P = {}> = ComponentType<PropsWithChildren<P>>;
export type MouseEvent<T = Element> = globalThis.MouseEvent & { currentTarget: T; target: T };

function bind<T extends Function>(method: T | undefined): T | undefined {
  if (!method || typeof method !== 'function') {
    return method;
  }
  return method.bind(reactGlobal) as T;
}

export const Children = reactGlobal?.Children;
export const Fragment = reactGlobal?.Fragment;
export const StrictMode = reactGlobal?.StrictMode;
export const Suspense = reactGlobal?.Suspense;
export const memo = reactGlobal?.memo?.bind(reactGlobal);
export const forwardRef = reactGlobal?.forwardRef?.bind(reactGlobal) as <T, P = {}>(
  render: ForwardRefRenderFunction<T, P>,
) => ComponentType<P & { ref?: Ref<T> }>;
export const createContext = reactGlobal?.createContext?.bind(reactGlobal);
export const createElement = bind(reactGlobal?.createElement) as (...args: any[]) => ReactNode;
export const cloneElement = bind(reactGlobal?.cloneElement) as (...args: any[]) => ReactNode;
export const createRef = bind(reactGlobal?.createRef) as <T>() => MutableRefObject<T | null>;
export const startTransition = bind(reactGlobal?.startTransition) as (callback: () => void) => void;

export const useState = bind(reactGlobal?.useState) as <S>(initialState: S | (() => S)) => [S, Dispatch<SetStateAction<S>>];
export const useReducer = bind(reactGlobal?.useReducer) as <S, A>(
  reducer: (state: S, action: A) => S,
  initialArg: S,
  init?: (arg: S) => S,
) => [S, Dispatch<A>];
export const useEffect = bind(reactGlobal?.useEffect) as (
  effect: () => void | (() => void),
  deps?: any[],
) => void;
export const useLayoutEffect = bind(reactGlobal?.useLayoutEffect) as (
  effect: () => void | (() => void),
  deps?: any[],
) => void;
export const useInsertionEffect = bind(reactGlobal?.useInsertionEffect) as (
  effect: () => void | (() => void),
  deps?: any[],
) => void;
export const useMemo = bind(reactGlobal?.useMemo) as <T>(factory: () => T, deps: any[]) => T;
export const useCallback = bind(reactGlobal?.useCallback) as <T extends (...args: any[]) => any>(callback: T, deps: any[]) => T;
export const useRef = bind(reactGlobal?.useRef) as <T>(initialValue: T) => MutableRefObject<T>;
export const useImperativeHandle = bind(reactGlobal?.useImperativeHandle) as <T>(
  ref: Ref<T>,
  create: () => T,
  deps?: any[],
) => void;
export const useContext = bind(reactGlobal?.useContext) as <T>(context: any) => T;
export const useDebugValue = bind(reactGlobal?.useDebugValue) as <T>(value: T, formatter?: (value: T) => unknown) => void;
export const useSyncExternalStore = bind(reactGlobal?.useSyncExternalStore) as <T>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T,
) => T;
export const useDeferredValue = bind(reactGlobal?.useDeferredValue) as <T>(value: T) => T;
export const useId = bind(reactGlobal?.useId) as () => string;
export const useTransition = bind(reactGlobal?.useTransition) as () => [boolean, (callback: () => void) => void];

const reactExports = {
  Children,
  Fragment,
  StrictMode,
  Suspense,
  memo,
  forwardRef,
  createContext,
  createElement,
  cloneElement,
  createRef,
  startTransition,
  useState,
  useReducer,
  useEffect,
  useLayoutEffect,
  useInsertionEffect,
  useMemo,
  useCallback,
  useRef,
  useImperativeHandle,
  useContext,
  useDebugValue,
  useSyncExternalStore,
  useDeferredValue,
  useId,
  useTransition,
};

export default reactGlobal ?? (reactExports as any);
