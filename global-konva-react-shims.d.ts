// Targeted local shims to satisfy TypeScript in an offline environment.

/**
 * types - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {minimal} Refer to the implementation for the precise returned value.
 */
// Konva namespace types (minimal)
declare namespace Konva {
  interface Node {
    /**
     * destroy - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {void;} Refer to the implementation for the precise returned value.
     */
    /**
     * destroy - Auto-generated documentation stub.
     *
     * @returns {void;} Result produced by destroy.
     */
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
    /**
     * add - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} node - Parameter derived from the static analyzer.
     *
     * @returns {void;} Refer to the implementation for the precise returned value.
     */
    /**
     * add - Auto-generated documentation stub.
     *
     * @param {*} node - Parameter forwarded to add.
     *
     * @returns {void;} Result produced by add.
     */
    add(node: any): void;
  }
  interface Collection<T = any> {
    /**
     * toArray - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {T[];} Refer to the implementation for the precise returned value.
     */
    /**
     * toArray - Auto-generated documentation stub.
     *
     * @returns {T[];} Result produced by toArray.
     */
    toArray(): T[];
  }
}

declare module 'konva' {
  const Konva: typeof Konva;
  export default Konva;
}

declare module 'konva/lib/*' { const value: any; export = value; }

/**
 * signatures - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {targeted} Refer to the implementation for the precise returned value.
 */
/**
 * signatures - Auto-generated documentation stub.
 *
 * @returns {targeted} Result produced by signatures.
 */
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
  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} effect - Parameter derived from the static analyzer.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   *
   * @param {*} effect - Parameter forwarded to useEffect.
   */
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  /**
   * useLayoutEffect - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} effect - Parameter derived from the static analyzer.
   */
  /**
   * useLayoutEffect - Auto-generated documentation stub.
   *
   * @param {*} effect - Parameter forwarded to useLayoutEffect.
   */
  export function useLayoutEffect(effect: () => void | (() => void), deps?: any[]): void;
  /**
   * extends - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} ...args - Parameter derived from the static analyzer.
   *
   * @returns {...args: any[]} Refer to the implementation for the precise returned value.
   */
  /**
   * extends - Auto-generated documentation stub.
   *
   * @param {*} ...args - Parameter forwarded to extends.
   *
   * @returns {...args: any[]} Result produced by extends.
   */
  export function useCallback<T extends (...args: any[]) => any>(cb: T, deps?: any[]): T;
  export function useMemo<T>(cb: () => T, deps?: any[]): T;
  export function createContext<T>(defaultValue: T): any;
  export function forwardRef<T, P = any>(render: any): any;
  /**
   * useImperativeHandle - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} ref - Parameter derived from the static analyzer.
   * @param {*} init - Parameter derived from the static analyzer.
   * @param {*} deps? - Parameter derived from the static analyzer.
   *
   * @returns {void;} Refer to the implementation for the precise returned value.
   */
  /**
   * useImperativeHandle - Auto-generated documentation stub.
   *
   * @param {*} ref - Parameter forwarded to useImperativeHandle.
   * @param {*} init - Parameter forwarded to useImperativeHandle.
   * @param {*} deps? - Parameter forwarded to useImperativeHandle.
   *
   * @returns {void;} Result produced by useImperativeHandle.
   */
  export function useImperativeHandle(ref: any, init: any, deps?: any[]): void;
  /**
   * extends - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} ...args - Parameter derived from the static analyzer.
   *
   * @returns {...args: any[]} Refer to the implementation for the precise returned value.
   */
  /**
   * extends - Auto-generated documentation stub.
   *
   * @param {*} ...args - Parameter forwarded to extends.
   *
   * @returns {...args: any[]} Result produced by extends.
   */
  export function useReducer<R extends (...args: any[]) => any, I = any>(reducer: R, initial: I): any;
  export function useContext<T>(context: any): T;
  export function useSyncExternalStore<T>(subscribe: (cb: () => void) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T): T;
  /**
   * useInsertionEffect - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} effect - Parameter derived from the static analyzer.
   */
  /**
   * useInsertionEffect - Auto-generated documentation stub.
   *
   * @param {*} effect - Parameter forwarded to useInsertionEffect.
   */
  export function useInsertionEffect(effect: () => void | (() => void), deps?: any[]): void;
  /**
   * startTransition - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} cb - Parameter derived from the static analyzer.
   */
  /**
   * startTransition - Auto-generated documentation stub.
   *
   * @param {*} cb - Parameter forwarded to startTransition.
   */
  export function startTransition(cb: () => void): void;
  export function useDeferredValue<T>(value: T): T;
  /**
   * useId - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {string;} Refer to the implementation for the precise returned value.
   */
  /**
   * useId - Auto-generated documentation stub.
   *
   * @returns {string;} Result produced by useId.
   */
  export function useId(): string;
  /**
   * useTransition - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} readonly [boolean - Parameter derived from the static analyzer.
   * @param {*} (cb - Parameter derived from the static analyzer.
   */
  /**
   * useTransition - Auto-generated documentation stub.
   *
   * @param {*} readonly [boolean - Parameter forwarded to useTransition.
   * @param {*} (cb - Parameter forwarded to useTransition.
   */
  export function useTransition(): readonly [boolean, (cb: () => void) => void];

  /**
   * createElement - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} ...args - Parameter derived from the static analyzer.
   *
   * @returns {any;} Refer to the implementation for the precise returned value.
   */
  /**
   * createElement - Auto-generated documentation stub.
   *
   * @param {*} ...args - Parameter forwarded to createElement.
   *
   * @returns {any;} Result produced by createElement.
   */
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
  /**
   * useDebugValue - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} value - Parameter derived from the static analyzer.
   *
   * @returns {void;} Refer to the implementation for the precise returned value.
   */
  /**
   * useDebugValue - Auto-generated documentation stub.
   *
   * @param {*} value - Parameter forwarded to useDebugValue.
   *
   * @returns {void;} Result produced by useDebugValue.
   */
  export function useDebugValue(value: any): void;
  export const useDebugValue: typeof useDebugValue;
  export const StrictMode: any;
  export type MutableRefObject<T = any> = { current: T | null };
  export type PropsWithChildren<P = any> = P & { children?: any };

  const _default: any;
  export default _default;
}

