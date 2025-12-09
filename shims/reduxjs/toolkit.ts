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

/**
 * CaseReducer interface - Auto-generated interface summary; customize as needed.
 */
/**
 * CaseReducer interface - Generated documentation block.
 */
/**
 * CaseReducer Interface
 * 
 * Type definition for CaseReducer.
 */
/**
 * CaseReducer Interface
 * 
 * Type definition for CaseReducer.
 */
export interface CaseReducer<S = any, A extends Action = AnyAction> {
  (state: S, action: A): S | void;
}

/**
 * CaseReducers interface - Auto-generated interface summary; customize as needed.
 */
export interface CaseReducers<S, AS extends { [key: string]: any } = any> {
  [key: string]: CaseReducer<S, any>;
}

/**
 * SliceCaseReducers interface - Auto-generated interface summary; customize as needed.
 */
export interface SliceCaseReducers<State> {
  [K: string]: CaseReducer<State, PayloadAction<any>>;
}

/**
 * ActionCreator interface - Auto-generated interface summary; customize as needed.
 */
export interface ActionCreator<P = void, T extends string = string> {
  (payload: P): PayloadAction<P, T>;
  type: T;
}

/**
 * Slice interface - Auto-generated interface summary; customize as needed.
 */
/**
 * Slice interface - Generated documentation block.
 */
export interface Slice<
  State = any,
  CaseReducers extends SliceCaseReducers<State> = SliceCaseReducers<State>,
  Name extends string = string
> {
  name: Name;
  reducer: Reducer<State>;
  actions: {
    [K in keyof CaseReducers]: ActionCreator<
      /**
       * extends - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} state - Parameter derived from the static analyzer.
       * @param {*} action - Parameter derived from the static analyzer.
       *
       * @returns {state: any, action: infer A} Refer to the implementation for the precise returned value.
       */
      /**
       * extends - Auto-generated documentation stub.
       *
       * @param {*} state - Parameter forwarded to extends.
       * @param {*} action - Parameter forwarded to extends.
       *
       * @returns {state: any, action: infer A} Result produced by extends.
       */
      CaseReducers[K] extends (state: any, action: infer A) => any
        ? A extends PayloadAction<infer P>
          ? P
          : void
        : void,
      `${Name}/${K & string}`
    >;
  };
  caseReducers: CaseReducers;
  /**
   * getInitialState - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {State;} Refer to the implementation for the precise returned value.
   */
  /**
 * CreateSliceOptions Interface
 * 
 * Type definition for CreateSliceOptions.
 */
  getInitialState(): State;
}

/**
 * CreateSliceOptions interface - Auto-generated interface summary; customize as needed.
 */
/**
 * CreateSliceOptions interface - Generated documentation block.
 */
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
      /**
       * as - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * as - Auto-generated documentation stub.
       */
      ? (initialStateArg as () => State)()
      : initialStateArg;

  const actionCreators: any = {};
  const caseReducerMap: { [type: string]: CaseReducer<State, any> } = {};

  // Generate action creators and map action types to reducers
  /**
   * keys - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {reducers} Refer to the implementation for the precise returned value.
   */
  /**
   * keys - Auto-generated documentation stub.
   *
   * @returns {reducers} Result produced by keys.
   */
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
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {caseReducer} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {caseReducer} Result produced by if.
     */
    if (caseReducer) {
      // Support Immer-style draft mutations by checking if reducer returns undefined
      /**
       * caseReducer - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} state - Parameter derived from the static analyzer.
       * @param {*} action - Parameter derived from the static analyzer.
       *
       * @returns {state, action} Refer to the implementation for the precise returned value.
       */
      /**
       * caseReducer - Auto-generated documentation stub.
       *
       * @param {*} state - Parameter forwarded to caseReducer.
       * @param {*} action - Parameter forwarded to caseReducer.
       *
       * @returns {state, action} Result produced by caseReducer.
       */
      const result = caseReducer(state, action);
      /**
       * return - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} result !== undefined ? result - Parameter derived from the static analyzer.
       */
      /**
 * ConfigureStoreOptions Interface
 * 
 * Type definition for ConfigureStoreOptions.
 */
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

/**
 * ConfigureStoreOptions interface - Auto-generated interface summary; customize as needed.
 */
/**
 * ConfigureStoreOptions interface - Generated documentation block.
 */
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

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (typeof reducer === 'function') {
    rootReducer = reducer;
  } else {
    /**
     * combineReducers - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {reducer as any} Refer to the implementation for the precise returned value.
     */
    /**
     * combineReducers - Auto-generated documentation stub.
     *
     * @returns {reducer as any} Result produced by combineReducers.
     */
    rootReducer = combineReducers(reducer as any) as Reducer<S, A>;
  }

  // Create store enhancer
  /**
   * applyMiddleware - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {undefined;} Refer to the implementation for the precise returned value.
   */
  /**
   * applyMiddleware - Auto-generated documentation stub.
   *
   * @returns {undefined;} Result produced by applyMiddleware.
   */
  const middlewareEnhancer = middleware.length > 0 ? applyMiddleware(...middleware) : undefined;

  const composedEnhancers: any[] = [];

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {middlewareEnhancer} Refer to the implementation for the precise returned value.
   */
  /**
   * if - Auto-generated documentation stub.
   *
   * @returns {middlewareEnhancer} Result produced by if.
   */
  if (middlewareEnhancer) {
    /**
     * push - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {middlewareEnhancer} Refer to the implementation for the precise returned value.
     */
    /**
     * push - Auto-generated documentation stub.
     *
     * @returns {middlewareEnhancer} Result produced by push.
     */
    composedEnhancers.push(middlewareEnhancer);
  }

  /**
   * push - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {...enhancers} Refer to the implementation for the precise returned value.
   */
  /**
   * push - Auto-generated documentation stub.
   *
   * @returns {...enhancers} Result produced by push.
   */
  composedEnhancers.push(...enhancers);

  // Add Redux DevTools support if available
  const composeEnhancers =
    devTools && typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      ? (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      : compose;

  const composedEnhancer = composedEnhancers.length > 0
    /**
     * composeEnhancers - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {...composedEnhancers} Refer to the implementation for the precise returned value.
     */
    /**
     * composeEnhancers - Auto-generated documentation stub.
     *
     * @returns {...composedEnhancers} Result produced by composeEnhancers.
     */
    ? composeEnhancers(...composedEnhancers)
    : undefined;

  /**
   * createStore - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} rootReducer - Parameter derived from the static analyzer.
   * @param {*} preloadedState - Parameter derived from the static analyzer.
   * @param {*} composedEnhancer - Parameter derived from the static analyzer.
   *
   * @returns {rootReducer, preloadedState, composedEnhancer} Refer to the implementation for the precise returned value.
   */
  return createStore(rootReducer, preloadedState, composedEnhancer);
}

/**
 * Create an action creator
 */
/**
 * createAction
 * 
 * Function to create action.
 * 
 * @param {T} type - Parameter description
 * @returns {ActionCreator<P, T>} Return value description
 */
/**
 * createAction
 * 
 * Function to create action.
 * 
 * @param {T} type - Parameter description
 * @returns {ActionCreator<P, T>} Return value description
 */
export function createAction<P = void, T extends string = string>(
  type: T
): ActionCreator<P, T> {
  /**
 * thunkMiddleware Component
 * 
 * Renders the thunkMiddleware component.
 */
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
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    if (typeof action === 'function') {
      /**
       * action - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} dispatch - Parameter derived from the static analyzer.
       * @param {*} getState - Parameter derived from the static analyzer.
       *
       * @returns {dispatch, getState} Refer to the implementation for the precise returned value.
       */
      /**
       * action - Auto-generated documentation stub.
       *
       * @param {*} dispatch - Parameter forwarded to action.
       * @param {*} getState - Parameter forwarded to action.
       *
       * @returns {dispatch, getState} Result produced by action.
       */
      return action(dispatch, getState);
    }

    /**
     * next - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {action} Refer to the implementation for the precise returned value.
     */
    /**
 * ActionReducerMapBuilder Interface
 * 
 * Type definition for ActionReducerMapBuilder.
 */
    return next(action);
  };

/**
 * Builder for createReducer
 */
/**
 * ActionReducerMapBuilder interface - Auto-generated interface summary; customize as needed.
 */
/**
 * ActionReducerMapBuilder interface - Generated documentation block.
 */
export interface ActionReducerMapBuilder<State> {
  addCase<ActionCreatorType extends { type: string }>(
    actionCreator: ActionCreatorType | string,
    reducer: CaseReducer<State, any>
  ): ActionReducerMapBuilder<State>;
}

/**
 * Create a reducer with a builder callback
 */
export function createReducer<S>(
  initialState: S,
  builderCallback: (builder: ActionReducerMapBuilder<S>) => void
): Reducer<S> {
  const actionsMap: { [type: string]: CaseReducer<S, any> } = {};

  const builder: ActionReducerMapBuilder<S> = {
    addCase(actionCreatorOrType: any, reducer: CaseReducer<S, any>) {
      const type = typeof actionCreatorOrType === 'string' 
        ? actionCreatorOrType 
        : actionCreatorOrType.type;
      actionsMap[type] = reducer;
      return builder;
    },
  };

  /**
   * builderCallback - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {builder} Refer to the implementation for the precise returned value.
   */
  /**
   * builderCallback - Auto-generated documentation stub.
   *
   * @returns {builder} Result produced by builderCallback.
   */
  builderCallback(builder);

  /**
   * return - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} state = initialState - Parameter derived from the static analyzer.
   * @param {*} action - Parameter derived from the static analyzer.
   */
  /**
   * return - Auto-generated documentation stub.
   *
   * @param {*} state = initialState - Parameter forwarded to return.
   * @param {*} action - Parameter forwarded to return.
   */
  return (state = initialState, action: any): S => {
    const caseReducer = actionsMap[action.type];
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {caseReducer} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {caseReducer} Result produced by if.
     */
    if (caseReducer) {
      // Support Immer-style draft mutations
      /**
       * caseReducer - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} state - Parameter derived from the static analyzer.
       * @param {*} action - Parameter derived from the static analyzer.
       *
       * @returns {state, action} Refer to the implementation for the precise returned value.
       */
      /**
       * caseReducer - Auto-generated documentation stub.
       *
       * @param {*} state - Parameter forwarded to caseReducer.
       * @param {*} action - Parameter forwarded to caseReducer.
       *
       * @returns {state, action} Result produced by caseReducer.
       */
      const result = caseReducer(state, action);
      /**
       * return - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} result !== undefined ? result - Parameter derived from the static analyzer.
       */
      /**
       * return - Auto-generated documentation stub.
       *
       * @param {*} result !== undefined ? result - Parameter forwarded to return.
       */
      return (result !== undefined ? result : state) as S;
    }
    return state;
  };
}

export type { Action, AnyAction, Reducer, Store, Dispatch } from '../redux';
export { combineReducers, createStore } from '../redux';
