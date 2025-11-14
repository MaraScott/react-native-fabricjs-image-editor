import * as React from 'react';

/**
 * StartTransitionType Type
 * 
 * Type definition for StartTransitionType.
 */
type StartTransitionType = typeof React.startTransition extends undefined
  ? (callback: () => void) => void
  : NonNullable<typeof React.startTransition>;

const startTransition: StartTransitionType =
  typeof React.startTransition === 'function'
    /**
     * bind - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {React} Refer to the implementation for the precise returned value.
     */
    /**
     * bind - Auto-generated documentation stub.
     *
     * @returns {React} Result produced by bind.
     */
    ? React.startTransition.bind(React)
    : (callback: () => void) => {
        /**
 * UseInsertionEffectType Type
 * 
 * Type definition for UseInsertionEffectType.
 */
        callback();
      };

type UseInsertionEffectType = typeof React.useInsertionEffect extends undefined
  ? typeof React.useLayoutEffect
  : NonNullable<typeof React.useInsertionEffect>;

const useInsertionEffect: UseInsertionEffectType =
  typeof React.useInsertionEffect === 'function'
    /**
     * bind - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {React} Refer to the implementation for the precise returned value.
     */
    /**
     * bind - Auto-generated documentation stub.
     *
     * @returns {React} Result produced by bind.
     */
    ? React.useInsertionEffect.bind(React)
    /**
 * Thenable Type
 * 
 * Type definition for Thenable.
 */
    /**
 * isThenable
 * 
 * Function to is thenable.
 * 
 * @param {unknown} value - Parameter description
 * @returns {value is Thenable<T>} Return value description
 */
    : React.useLayoutEffect.bind(React);

type Thenable<T> = {
  then: (onFulfilled: (value: T) => void, onRejected?: (reason: unknown) => void) => unknown;
};

function isThenable<T>(value: unknown): value is Thenable<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    /**
     * typeof - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} value as { then? - Parameter derived from the static analyzer.
     *
     * @returns {value as { then?: unknown }} Refer to the implementation for the precise returned value.
     */
    /**
 * use Hook
 * 
 * Custom hook for .
 * 
 * @param {T | Thenable<T>} usable - Parameter description
 * @returns {T} Return value description
 */
    typeof (value as { then?: unknown }).then === 'function'
  );
}

function use<T>(usable: T | Thenable<T>): T {
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
 * UseSyncExternalStoreType Type
 * 
 * Type definition for UseSyncExternalStoreType.
 */
  if (isThenable<T>(usable)) {
    throw usable;
  }
  return usable as T;
}

type UseSyncExternalStoreType = typeof React.useSyncExternalStore extends undefined
  ? <T>(
      subscribe: (onStoreChange: () => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ) => T
  : NonNullable<typeof React.useSyncExternalStore>;

const useSyncExternalStoreImpl: UseSyncExternalStoreType =
  typeof React.useSyncExternalStore === 'function'
    /**
     * bind - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {React} Refer to the implementation for the precise returned value.
     */
    /**
     * bind - Auto-generated documentation stub.
     *
     * @returns {React} Result produced by bind.
     */
    ? React.useSyncExternalStore.bind(React)
    : function fallbackUseSyncExternalStore<T>(
        subscribe: (onStoreChange: () => void) => () => void,
        getSnapshot: () => T,
        getServerSnapshot?: () => T,
      ): T {
        /**
         * useRef - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {getSnapshot} Refer to the implementation for the precise returned value.
         */
        /**
         * useRef - Auto-generated documentation stub.
         *
         * @returns {getSnapshot} Result produced by useRef.
         */
        const getSnapshotRef = React.useRef(getSnapshot);
        getSnapshotRef.current = getSnapshot;

        const [state, setState] = React.useState<T>(() => {
          /**
           * if - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {getServerSnapshot} Refer to the implementation for the precise returned value.
           */
          /**
           * if - Auto-generated documentation stub.
           *
           * @returns {getServerSnapshot} Result produced by if.
           */
          if (getServerSnapshot) {
            /**
             * getServerSnapshot - Auto-generated summary; refine if additional context is needed.
             */
            /**
             * getServerSnapshot - Auto-generated documentation stub.
             */
            return getServerSnapshot();
          }
          /**
           * getSnapshot - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * getSnapshot - Auto-generated documentation stub.
           */
          return getSnapshot();
        });

        /**
         * useEffect - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * useEffect - Auto-generated documentation stub.
         */
        React.useEffect(() => {
          /**
           * subscribe - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * subscribe - Auto-generated documentation stub.
           */
          return subscribe(() => {
            /**
             * setState - Auto-generated summary; refine if additional context is needed.
             */
            /**
 * UseDeferredValueType Type
 * 
 * Type definition for UseDeferredValueType.
 */
            setState(getSnapshotRef.current());
          });
        }, [subscribe]);

        return state;
      };

type UseDeferredValueType = typeof React.useDeferredValue extends undefined
  ? <T>(value: T) => T
  : NonNullable<typeof React.useDeferredValue>;

const useDeferredValueImpl: UseDeferredValueType =
  typeof React.useDeferredValue === 'function'
    /**
     * bind - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {React} Refer to the implementation for the precise returned value.
     */
    /**
 * UseIdType Type
 * 
 * Type definition for UseIdType.
 */
    ? React.useDeferredValue.bind(React)
    : ((value) => value);

type UseIdType = typeof React.useId extends undefined ? () => string : NonNullable<typeof React.useId>;

const useIdImpl: UseIdType =
  typeof React.useId === 'function'
    /**
     * bind - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {React} Refer to the implementation for the precise returned value.
     */
    /**
     * bind - Auto-generated documentation stub.
     *
     * @returns {React} Result produced by bind.
     */
    ? React.useId.bind(React)
    /**
     * random - Auto-generated summary; refine if additional context is needed.
     */
    /**
 * UseTransitionType Type
 * 
 * Type definition for UseTransitionType.
 */
    : () => `its-fine-${Math.random().toString(36).slice(2)}`;

type UseTransitionType = typeof React.useTransition extends undefined
  ? () => readonly [false, (callback: () => void) => void]
  : NonNullable<typeof React.useTransition>;

const useTransitionImpl: UseTransitionType =
  typeof React.useTransition === 'function'
    /**
     * bind - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {React} Refer to the implementation for the precise returned value.
     */
    /**
     * bind - Auto-generated documentation stub.
     *
     * @returns {React} Result produced by bind.
     */
    ? React.useTransition.bind(React)
    : (() => {
        /**
         * start - Auto-generated summary; refine if additional context is needed.
         */
        const start = (callback: () => void) => {
          /**
 * ContextBridgeComponent Type
 * 
 * Type definition for ContextBridgeComponent.
 */
          /**
 * useContextBridgeImpl Hook
 * 
 * Custom hook for context bridge impl.
 * 
 * @param {Array<React.Context<unknown>>} contexts - Parameter description
 * @returns {ContextBridgeComponent} Return value description
 */
          callback();
        };
        return [false, start] as const;
      });

type ContextBridgeComponent = React.ComponentType<{ children?: React.ReactNode }>;

const FiberContext = React.createContext<unknown>(null);

/**
 * useContextBridgeImpl - Auto-generated summary; refine if additional context is needed.
 *
 * @param {*} ...contexts - Parameter derived from the static analyzer.
 *
 * @returns {ContextBridgeComponent} Refer to the implementation for the precise returned value.
 */
/**
 * useContextBridgeImpl - Auto-generated documentation stub.
 *
 * @param {*} ...contexts - Parameter forwarded to useContextBridgeImpl.
 *
 * @returns {ContextBridgeComponent} Result produced by useContextBridgeImpl.
 */
function useContextBridgeImpl(...contexts: Array<React.Context<unknown>>): ContextBridgeComponent {
  /**
   * map - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * map - Auto-generated documentation stub.
   */
  const values = contexts.map((context) => React.useContext(context));
  /**
   * useRef - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {values} Refer to the implementation for the precise returned value.
   */
  /**
   * useRef - Auto-generated documentation stub.
   *
   * @returns {values} Result produced by useRef.
   */
  const valuesRef = React.useRef(values);
  valuesRef.current = values;

  /**
   * useRef - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {contexts} Refer to the implementation for the precise returned value.
   */
  /**
   * useRef - Auto-generated documentation stub.
   *
   * @returns {contexts} Result produced by useRef.
   */
  const contextsRef = React.useRef(contexts);
  contextsRef.current = contexts;

  return React.useCallback(
    /**
     * ContextBridge - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} { children } - Parameter derived from the static analyzer.
     *
     * @returns {{ children }: { children?: React.ReactNode }} Refer to the implementation for the precise returned value.
     */
    /**
     * ContextBridge - Auto-generated documentation stub.
     *
     * @param {*} { children } - Parameter forwarded to ContextBridge.
     *
     * @returns {{ children }: { children?: React.ReactNode }} Result produced by ContextBridge.
     */
    function ContextBridge({ children }: { children?: React.ReactNode }) {
      return contextsRef.current.reduceRight<React.ReactNode>(
        (acc, Context, index) =>
          /**
           * createElement - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} Context.Provider - Parameter derived from the static analyzer.
           * @param {*} { value - Parameter derived from the static analyzer.
           * @param {*} acc - Parameter derived from the static analyzer.
           *
           * @returns {Context.Provider, { value: valuesRef.current[index] }, acc} Refer to the implementation for the precise returned value.
           */
          /**
           * createElement - Auto-generated documentation stub.
           *
           * @param {*} Context.Provider - Parameter forwarded to createElement.
           * @param {*} { value - Parameter forwarded to createElement.
           * @param {*} acc - Parameter forwarded to createElement.
           *
           * @returns {Context.Provider, { value: valuesRef.current[index] }, acc} Result produced by createElement.
           */
          React.createElement(Context.Provider, { value: valuesRef.current[index] }, acc),
        children ?? null,
      );
    },
    [],
  );
}

/**
 * FiberProvider
 * 
 * Function to fiber provider.
 */
export const FiberProvider = FiberContext.Provider;

export { startTransition, useInsertionEffect, use, useSyncExternalStoreImpl as useSyncExternalStore };
export { useDeferredValueImpl as useDeferredValue, useIdImpl as useId, useTransitionImpl as useTransition };
/**
 * bind - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {React} Refer to the implementation for the precise returned value.
 */
/**
 * useLayoutEffect Hook
 * 
 * Custom hook for layout effect.
 */
export const useEffect = React./**
 * useEffect Hook
 * 
 * Custom hook for effect.
 */
useEffect.bind(React);
/**
 * bind - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {React} Refer to the implementation for the precise returned value.
 */
/**
 * useRef Hook
 * 
 * Custom hook for ref.
 */
export const useLayoutEffect = React.useLayoutEffect.bind(React);
/**
 * bind - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {React} Refer to the implementation for the precise returned value.
 */
/**
 * useMemo Hook
 * 
 * Custom hook for memo.
 */
export const useRef = React.useRef.bind(React);
/**
 * bind - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {React} Refer to the implementation for the precise returned value.
 */
/**
 * useCallback Hook
 * 
 * Custom hook for callback.
 */
export const useMemo = React.useMemo.bind(React);
/**
 * bind - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {React} Refer to the implementation for the precise returned value.
 */
/**
 * useState Hook
 * 
 * Custom hook for state.
 */
export const useCallback = React.useCallback.bind(React);
/**
 * bind - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {React} Refer to the implementation for the precise returned value.
 */
/**
 * useReducer Hook
 * 
 * Custom hook for reducer.
 */
export const useState = React.useState.bind(React);
/**
 * bind - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {React} Refer to the implementation for the precise returned value.
 */
/**
 * useImperativeHandle Hook
 * 
 * Custom hook for imperative handle.
 */
export const useReducer = React.useReducer.bind(React);
/**
 * bind - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {React} Refer to the implementation for the precise returned value.
 */
/**
 * useContext Hook
 * 
 * Custom hook for context.
 */
export const useImperativeHandle = React.useImperativeHandle.bind(React);
/**
 * bind - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {React} Refer to the implementation for the precise returned value.
 */
/**
 * useDebugValue Hook
 * 
 * Custom hook for debug value.
 */
export const useContext = React.useContext.bind(React);
/**
 * bind - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {React} Refer to the implementation for the precise returned value.
 */
/**
 * useContextBridge Hook
 * 
 * Custom hook for context bridge.
 */
export const useDebugValue = React.useDebugValue.bind(React);
export const useContextBridge = useContextBridgeImpl;

export default {
  startTransition,
  useInsertionEffect,
  use,
  useSyncExternalStore: useSyncExternalStoreImpl,
  useDeferredValue: useDeferredValueImpl,
  useId: useIdImpl,
  useTransition: useTransitionImpl,
  /**
   * bind - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {React} Refer to the implementation for the precise returned value.
   */
  /**
   * bind - Auto-generated documentation stub.
   *
   * @returns {React} Result produced by bind.
   */
  useEffect: React.useEffect.bind(React),
  /**
   * bind - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {React} Refer to the implementation for the precise returned value.
   */
  /**
   * bind - Auto-generated documentation stub.
   *
   * @returns {React} Result produced by bind.
   */
  useLayoutEffect: React.useLayoutEffect.bind(React),
  /**
   * bind - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {React} Refer to the implementation for the precise returned value.
   */
  /**
   * bind - Auto-generated documentation stub.
   *
   * @returns {React} Result produced by bind.
   */
  useRef: React.useRef.bind(React),
  /**
   * bind - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {React} Refer to the implementation for the precise returned value.
   */
  /**
   * bind - Auto-generated documentation stub.
   *
   * @returns {React} Result produced by bind.
   */
  useMemo: React.useMemo.bind(React),
  /**
   * bind - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {React} Refer to the implementation for the precise returned value.
   */
  /**
   * bind - Auto-generated documentation stub.
   *
   * @returns {React} Result produced by bind.
   */
  useCallback: React.useCallback.bind(React),
  /**
   * bind - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {React} Refer to the implementation for the precise returned value.
   */
  /**
   * bind - Auto-generated documentation stub.
   *
   * @returns {React} Result produced by bind.
   */
  useState: React.useState.bind(React),
  /**
   * bind - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {React} Refer to the implementation for the precise returned value.
   */
  /**
   * bind - Auto-generated documentation stub.
   *
   * @returns {React} Result produced by bind.
   */
  useReducer: React.useReducer.bind(React),
  /**
   * bind - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {React} Refer to the implementation for the precise returned value.
   */
  /**
   * bind - Auto-generated documentation stub.
   *
   * @returns {React} Result produced by bind.
   */
  useImperativeHandle: React.useImperativeHandle.bind(React),
  /**
   * bind - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {React} Refer to the implementation for the precise returned value.
   */
  /**
   * bind - Auto-generated documentation stub.
   *
   * @returns {React} Result produced by bind.
   */
  useContext: React.useContext.bind(React),
  /**
   * bind - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {React} Refer to the implementation for the precise returned value.
   */
  /**
   * bind - Auto-generated documentation stub.
   *
   * @returns {React} Result produced by bind.
   */
  useDebugValue: React.useDebugValue.bind(React),
  FiberProvider,
  useContextBridge: useContextBridgeImpl,
};
