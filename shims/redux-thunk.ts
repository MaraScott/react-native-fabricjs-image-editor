/**
 * Redux Thunk shim - Minimal implementation without external dependencies
 * Provides thunk middleware for async Redux actions
 */

import type { Dispatch, AnyAction, Store } from './redux';

export interface ThunkAction<R, S, E, A extends AnyAction> {
  (dispatch: Dispatch<A>, getState: () => S, extraArgument: E): R;
}

export interface ThunkMiddleware<S = any, A extends AnyAction = AnyAction, E = undefined> {
  (api: { dispatch: Dispatch<A>; getState: () => S }): (
    next: Dispatch<A>
  ) => (action: A | ThunkAction<any, S, E, A>) => any;
}

/**
 * Redux Thunk middleware
 * Allows action creators to return functions instead of actions
 * The returned function receives dispatch and getState as arguments
 */
const thunk: ThunkMiddleware = ({ dispatch, getState }) => (next) => (action) => {
  if (typeof action === 'function') {
    return action(dispatch, getState, undefined);
  }

  return next(action);
};

export default thunk;

/**
 * Create a thunk middleware with extra argument
 */
export function createThunkMiddleware<S = any, A extends AnyAction = AnyAction, E = undefined>(
  extraArgument?: E
): ThunkMiddleware<S, A, E> {
  return ({ dispatch, getState }) => (next) => (action) => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument);
    }

    return next(action);
  };
}

export const withExtraArgument = createThunkMiddleware;
