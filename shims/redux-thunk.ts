/**
 * Redux Thunk shim - Minimal implementation without external dependencies
 * Provides thunk middleware for async Redux actions
 */

import type { Dispatch, AnyAction, Store } from './redux';

export interface ThunkAction<R, S, E, A extends AnyAction> {
  (dispatch: Dispatch<A>, getState: () => S, extraArgument: E): R;
}

/**
 * ThunkMiddleware interface - Auto-generated interface summary; customize as needed.
 */
/**
 * ThunkMiddleware interface - Generated documentation block.
 */
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
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  if (typeof action === 'function') {
    /**
     * action - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} dispatch - Parameter derived from the static analyzer.
     * @param {*} getState - Parameter derived from the static analyzer.
     * @param {*} undefined - Parameter derived from the static analyzer.
     *
     * @returns {dispatch, getState, undefined} Refer to the implementation for the precise returned value.
     */
    /**
     * action - Auto-generated documentation stub.
     *
     * @param {*} dispatch - Parameter forwarded to action.
     * @param {*} getState - Parameter forwarded to action.
     * @param {*} undefined - Parameter forwarded to action.
     *
     * @returns {dispatch, getState, undefined} Result produced by action.
     */
    return action(dispatch, getState, undefined);
  }

  /**
   * next - Auto-generated documentation stub.
   *
   * @returns {action} Result produced by next.
   */
  return next(action);
};

export default thunk;

/**
 * Create a thunk middleware with extra argument
 */
export function createThunkMiddleware<S = any, A extends AnyAction = AnyAction, E = undefined>(
  extraArgument?: E
): ThunkMiddleware<S, A, E> {
  /**
   * return - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} { dispatch - Parameter derived from the static analyzer.
   * @param {*} getState } - Parameter derived from the static analyzer.
   *
   * @returns {{ dispatch, getState }} Refer to the implementation for the precise returned value.
   */
  /**
   * return - Auto-generated documentation stub.
   *
   * @param {*} { dispatch - Parameter forwarded to return.
   * @param {*} getState } - Parameter forwarded to return.
   *
   * @returns {{ dispatch, getState }} Result produced by return.
   */
  return ({ dispatch, getState }) => (next) => (action) => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (typeof action === 'function') {
      /**
       * action - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} dispatch - Parameter derived from the static analyzer.
       * @param {*} getState - Parameter derived from the static analyzer.
       * @param {*} extraArgument - Parameter derived from the static analyzer.
       *
       * @returns {dispatch, getState, extraArgument} Refer to the implementation for the precise returned value.
       */
      /**
       * action - Auto-generated documentation stub.
       *
       * @param {*} dispatch - Parameter forwarded to action.
       * @param {*} getState - Parameter forwarded to action.
       * @param {*} extraArgument - Parameter forwarded to action.
       *
       * @returns {dispatch, getState, extraArgument} Result produced by action.
       */
      return action(dispatch, getState, extraArgument);
    }

    /**
     * next - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {action} Refer to the implementation for the precise returned value.
     */
    /**
     * next - Auto-generated documentation stub.
     *
     * @returns {action} Result produced by next.
     */
    return next(action);
  };
}

export const withExtraArgument = createThunkMiddleware;
