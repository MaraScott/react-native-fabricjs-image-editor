/**
 * Redux Toolkit shim - Minimal implementation without external dependencies
 * Provides configureStore, createSlice, and other RTK utilities
 */

import {
  createStore,
  combineReducers,
  applyMiddleware,
  compose,
  type Action,
  type AnyAction,
  type Reducer,
  type Store,
  type PreloadedState,
  type Dispatch,
} from '../redux';

export type PayloadAction<P = void, T extends string = string, M = never, E = never> = {
  payload: P;
  type: T;
} & ([M] extends [never]
  ? {}
  : {
      meta: M;
    }) &
  ([E] extends [never]
    ? {}
    : {
        error: E;
      });

export interface CaseReducer<S = any, A extends Action = AnyAction> {
  (state: S, action: A): S | void;
}

export interface CaseReducers<S, AS extends { [key: string]: any } = any> {
  [key: string]: CaseReducer<S, any>;
}

export interface SliceCaseReducers<State> {
  [K: string]: CaseReducer<State, PayloadAction<any>>;
}

export interface ActionCreator<P = void, T extends string = string> {
  (payload: P): PayloadAction<P, T>;
  type: T;
}

export interface Slice<
  State = any,
  CaseReducers extends SliceCaseReducers<State> = SliceCaseReducers<State>,
  Name extends string = string
> {
  name: Name;
  reducer: Reducer<State>;
  actions: {
    [K in keyof CaseReducers]: ActionCreator<
      CaseReducers[K] extends (state: any, action: infer A) => any
        ? A extends PayloadAction<infer P>
          ? P
          : void
        : void,
      `${Name}/${K & string}`
    >;
  };
  caseReducers: CaseReducers;
  getInitialState(): State;
}

export interface CreateSliceOptions<
  State = any,
  CR extends SliceCaseReducers<State> = SliceCaseReducers<State>,
  Name extends string = string
> {
  name: Name;
  initialState: State | (() => State);
  reducers: CR;
}

/**
 * Create a slice of the Redux state with auto-generated action creators
 */
export function createSlice<
  State,
  CaseReducers extends SliceCaseReducers<State>,
  Name extends string = string
>(
  options: CreateSliceOptions<State, CaseReducers, Name>
): Slice<State, CaseReducers, Name> {
  const { name, initialState: initialStateArg, reducers } = options;

  const initialState =
    typeof initialStateArg === 'function'
      ? (initialStateArg as () => State)()
      : initialStateArg;

  const actionCreators: any = {};
  const caseReducerMap: { [type: string]: CaseReducer<State, any> } = {};

  // Generate action creators and map action types to reducers
  Object.keys(reducers).forEach((reducerName) => {
    const type = `${name}/${reducerName}`;
    const caseReducer = reducers[reducerName];

    // Action creator
    actionCreators[reducerName] = (payload?: any) => ({
      type,
      payload,
    });
    actionCreators[reducerName].type = type;

    caseReducerMap[type] = caseReducer;
  });

  // Create the slice reducer
  const reducer: Reducer<State> = (state = initialState, action: any): State => {
    const caseReducer = caseReducerMap[action.type];
    if (caseReducer) {
      // Support Immer-style draft mutations by checking if reducer returns undefined
      const result = caseReducer(state, action);
      return (result !== undefined ? result : state) as State;
    }
    return state;
  };

  return {
    name,
    reducer,
    actions: actionCreators,
    caseReducers: reducers,
    getInitialState: () => initialState,
  };
}

export interface ConfigureStoreOptions<S = any, A extends Action = AnyAction> {
  reducer: Reducer<S, A> | { [K in keyof S]: Reducer<S[K], A> };
  middleware?: any[];
  devTools?: boolean;
  preloadedState?: PreloadedState<S>;
  enhancers?: any[];
}

/**
 * Configure a Redux store with good defaults
 */
export function configureStore<S = any, A extends Action = AnyAction>(
  options: ConfigureStoreOptions<S, A>
): Store<S, A> {
  const {
    reducer,
    middleware = [],
    devTools = true,
    preloadedState,
    enhancers = [],
  } = options;

  let rootReducer: Reducer<S, A>;

  if (typeof reducer === 'function') {
    rootReducer = reducer;
  } else {
    rootReducer = combineReducers(reducer as any) as Reducer<S, A>;
  }

  // Create store enhancer
  const middlewareEnhancer = middleware.length > 0 ? applyMiddleware(...middleware) : undefined;

  const composedEnhancers: any[] = [];

  if (middlewareEnhancer) {
    composedEnhancers.push(middlewareEnhancer);
  }

  composedEnhancers.push(...enhancers);

  // Add Redux DevTools support if available
  const composeEnhancers =
    devTools && typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      ? (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      : compose;

  const composedEnhancer = composedEnhancers.length > 0
    ? composeEnhancers(...composedEnhancers)
    : undefined;

  return createStore(rootReducer, preloadedState, composedEnhancer);
}

/**
 * Create an action creator
 */
export function createAction<P = void, T extends string = string>(
  type: T
): ActionCreator<P, T> {
  const actionCreator = ((payload: P) => ({
    type,
    payload,
  })) as ActionCreator<P, T>;

  actionCreator.type = type;

  return actionCreator;
}

/**
 * Simple thunk middleware for async actions
 */
export const thunkMiddleware =
  ({ dispatch, getState }: { dispatch: Dispatch; getState: () => any }) =>
  (next: Dispatch) =>
  (action: any) => {
    if (typeof action === 'function') {
      return action(dispatch, getState);
    }

    return next(action);
  };

export type { Action, AnyAction, Reducer, Store, Dispatch } from '../redux';
export { combineReducers, createStore } from '../redux';
