import * as React from 'react';

type StartTransitionType = typeof React.startTransition extends undefined
  ? (callback: () => void) => void
  : NonNullable<typeof React.startTransition>;

const startTransition: StartTransitionType =
  typeof React.startTransition === 'function'
    ? React.startTransition.bind(React)
    : (callback: () => void) => {
        callback();
      };

type UseInsertionEffectType = typeof React.useInsertionEffect extends undefined
  ? typeof React.useLayoutEffect
  : NonNullable<typeof React.useInsertionEffect>;

const useInsertionEffect: UseInsertionEffectType =
  typeof React.useInsertionEffect === 'function'
    ? React.useInsertionEffect.bind(React)
    : React.useLayoutEffect.bind(React);

type Thenable<T> = {
  then: (onFulfilled: (value: T) => void, onRejected?: (reason: unknown) => void) => unknown;
};

function isThenable<T>(value: unknown): value is Thenable<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

function use<T>(usable: T | Thenable<T>): T {
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
    ? React.useSyncExternalStore.bind(React)
    : function fallbackUseSyncExternalStore<T>(
        subscribe: (onStoreChange: () => void) => () => void,
        getSnapshot: () => T,
        getServerSnapshot?: () => T,
      ): T {
        const getSnapshotRef = React.useRef(getSnapshot);
        getSnapshotRef.current = getSnapshot;

        const [state, setState] = React.useState<T>(() => {
          if (getServerSnapshot) {
            return getServerSnapshot();
          }
          return getSnapshot();
        });

        React.useEffect(() => {
          return subscribe(() => {
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
    ? React.useDeferredValue.bind(React)
    : ((value) => value);

type UseIdType = typeof React.useId extends undefined ? () => string : NonNullable<typeof React.useId>;

const useIdImpl: UseIdType =
  typeof React.useId === 'function'
    ? React.useId.bind(React)
    : () => `its-fine-${Math.random().toString(36).slice(2)}`;

type UseTransitionType = typeof React.useTransition extends undefined
  ? () => readonly [false, (callback: () => void) => void]
  : NonNullable<typeof React.useTransition>;

const useTransitionImpl: UseTransitionType =
  typeof React.useTransition === 'function'
    ? React.useTransition.bind(React)
    : (() => {
        const start = (callback: () => void) => {
          callback();
        };
        return [false, start] as const;
      });

export { startTransition, useInsertionEffect, use, useSyncExternalStoreImpl as useSyncExternalStore };
export { useDeferredValueImpl as useDeferredValue, useIdImpl as useId, useTransitionImpl as useTransition };
export const useEffect = React.useEffect.bind(React);
export const useLayoutEffect = React.useLayoutEffect.bind(React);
export const useRef = React.useRef.bind(React);
export const useMemo = React.useMemo.bind(React);
export const useCallback = React.useCallback.bind(React);
export const useState = React.useState.bind(React);
export const useReducer = React.useReducer.bind(React);
export const useImperativeHandle = React.useImperativeHandle.bind(React);
export const useContext = React.useContext.bind(React);
export const useDebugValue = React.useDebugValue.bind(React);

export default {
  startTransition,
  useInsertionEffect,
  use,
  useSyncExternalStore: useSyncExternalStoreImpl,
  useDeferredValue: useDeferredValueImpl,
  useId: useIdImpl,
  useTransition: useTransitionImpl,
  useEffect: React.useEffect.bind(React),
  useLayoutEffect: React.useLayoutEffect.bind(React),
  useRef: React.useRef.bind(React),
  useMemo: React.useMemo.bind(React),
  useCallback: React.useCallback.bind(React),
  useState: React.useState.bind(React),
  useReducer: React.useReducer.bind(React),
  useImperativeHandle: React.useImperativeHandle.bind(React),
  useContext: React.useContext.bind(React),
  useDebugValue: React.useDebugValue.bind(React),
};
