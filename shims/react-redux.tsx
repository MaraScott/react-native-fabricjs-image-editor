/**
 * React-Redux shim - Minimal implementation without external dependencies
 * Provides Provider, useSelector, useDispatch hooks
 */

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import type { Store, Dispatch, AnyAction } from './redux';

const ReactReduxContext = createContext<Store | null>(null);

export interface ProviderProps {
  store: Store;
  children: ReactNode;
}

/**
 * Provider component - Makes Redux store available to child components
 */
export function Provider({ store, children }: ProviderProps) {
  return <ReactReduxContext.Provider value={store}>{children}</ReactReduxContext.Provider>;
}

/**
 * Hook to access the Redux store
 */
export function useStore<S = any>(): Store<S> {
  const store = useContext(ReactReduxContext);
  if (!store) {
    throw new Error('useStore must be used within a Provider');
  }
  return store as Store<S>;
}

/**
 * Hook to access the dispatch function
 */
export function useDispatch<A extends AnyAction = AnyAction>(): Dispatch<A> {
  const store = useStore();
  return store.dispatch;
}

/**
 * Hook to select data from the Redux store
 */
export function useSelector<S = any, R = any>(
  selector: (state: S) => R,
  equalityFn?: (left: R, right: R) => boolean
): R {
  const store = useStore<S>();
  const [selectedState, setSelectedState] = useState<R>(() => selector(store.getState()));
  const selectorRef = useRef(selector);
  const equalityFnRef = useRef(equalityFn);

  // Update refs
  useEffect(() => {
    selectorRef.current = selector;
    equalityFnRef.current = equalityFn;
  });

  useEffect(() => {
    const checkForUpdates = () => {
      const newSelectedState = selectorRef.current(store.getState());
      const equalityCheck = equalityFnRef.current || defaultEqualityFn;

      if (!equalityCheck(selectedState, newSelectedState)) {
        setSelectedState(newSelectedState);
      }
    };

    // Initial check
    checkForUpdates();

    // Subscribe to store updates
    const unsubscribe = store.subscribe(checkForUpdates);

    return unsubscribe;
  }, [store, selectedState]);

  return selectedState;
}

/**
 * Default equality function (shallow equality)
 */
function defaultEqualityFn<T>(a: T, b: T): boolean {
  return a === b;
}

/**
 * Shallow equality function for objects
 */
export function shallowEqual<T>(objA: T, objB: T): boolean {
  if (objA === objB) {
    return true;
  }

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA) as (keyof T)[];
  const keysB = Object.keys(objB) as (keyof T)[];

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!Object.prototype.hasOwnProperty.call(objB, key) || objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
}
