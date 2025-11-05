// Targeted local shims to satisfy TypeScript in an offline environment.

// Konva namespace types (minimal)
declare namespace Konva {
  interface Node {
    destroy(): void;
    getLayer?: () => any;
    getClientRect?: (opts?: any) => any;
    getStage?: () => any;
    setAttr?: (...args: any[]) => any;
    off?: (...args: any[]) => any;
    on?: (...args: any[]) => any;
  }
  type Stage = any;
  type Layer = any;
  type Transformer = any;
  type Rect = any;
  type Transform = any;
  type Image = any;
  type Group = any;
  type Circle = any;
  type Line = any;
  type Text = any;
  interface Container {
    add(node: any): void;
  }
  interface Collection<T = any> {
    toArray(): T[];
  }
}

declare module 'konva' {
  const Konva: typeof Konva;
  export default Konva;
}

declare module 'konva/lib/*' { const value: any; export = value; }

// React named exports and generic hook signatures (targeted)
declare module 'react' {
  // Basic types
  export type ReactNode = any;
  export type CSSProperties = any;
  export type ComponentType<P = any> = any;
  export type Context<T = any> = any;

  // Hooks and helpers with simple generic signatures
  export function useState<S>(initialState?: S | (() => S)): [S, (s: S | ((prev: S) => S)) => void];
  export function useRef<T = any>(initial?: T | null): { current: T | null };
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useLayoutEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useCallback<T extends (...args: any[]) => any>(cb: T, deps?: any[]): T;
  export function useMemo<T>(cb: () => T, deps?: any[]): T;
  export function createContext<T>(defaultValue: T): any;
  export function forwardRef<T, P = any>(render: any): any;
  export function useImperativeHandle(ref: any, init: any, deps?: any[]): void;
  export function useReducer<R extends (...args: any[]) => any, I = any>(reducer: R, initial: I): any;
  export function useContext<T>(context: any): T;
  export function useSyncExternalStore<T>(subscribe: (cb: () => void) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T): T;
  export function useInsertionEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function startTransition(cb: () => void): void;
  export function useDeferredValue<T>(value: T): T;
  export function useId(): string;
  export function useTransition(): readonly [boolean, (cb: () => void) => void];

  export function createElement(...args: any[]): any;

  // allow named imports used across code
  export const useState: typeof useState;
  export const useRef: typeof useRef;
  export const useEffect: typeof useEffect;
  export const useLayoutEffect: typeof useLayoutEffect;
  export const useCallback: typeof useCallback;
  export const useMemo: typeof useMemo;
  export const createContext: typeof createContext;
  export const forwardRef: typeof forwardRef;
  export const useImperativeHandle: typeof useImperativeHandle;
  export const useReducer: typeof useReducer;
  export const useSyncExternalStore: typeof useSyncExternalStore;
  export const useInsertionEffect: typeof useInsertionEffect;
  export const startTransition: typeof startTransition;
  export const useDeferredValue: typeof useDeferredValue;
  export const useId: typeof useId;
  export const useTransition: typeof useTransition;
  export function useDebugValue(value: any): void;
  export const useDebugValue: typeof useDebugValue;
  export const StrictMode: any;
  export type MutableRefObject<T = any> = { current: T | null };
  export type PropsWithChildren<P = any> = P & { children?: any };

  const _default: any;
  export default _default;
}

