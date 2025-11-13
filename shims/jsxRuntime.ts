import React from 'react';

type Props = Record<string, unknown> & { children?: any };

type Key = string | number | null;

/**
 * createElement - Auto-generated summary; refine if additional context is needed.
 *
 * @param {*} type - Parameter derived from the static analyzer.
 * @param {*} props - Parameter derived from the static analyzer.
 * @param {*} key - Parameter derived from the static analyzer.
 *
 * @returns {type: any, props: Props | null, key: Key} Refer to the implementation for the precise returned value.
 */
function createElement(type: any, props: Props | null, key: Key) {
  const finalProps = props ? { ...props } : {};
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (key != null) {
    finalProps.key = key;
  }
  /**
   * createElement - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} type - Parameter derived from the static analyzer.
   * @param {*} finalProps - Parameter derived from the static analyzer.
   *
   * @returns {type, finalProps} Refer to the implementation for the precise returned value.
   */
  /**
   * createElement - Auto-generated documentation stub.
   *
   * @param {*} type - Parameter forwarded to createElement.
   * @param {*} finalProps - Parameter forwarded to createElement.
   *
   * @returns {type, finalProps} Result produced by createElement.
   */
  return React.createElement(type, finalProps);
}

export const jsx = createElement;
export const jsxs = createElement;
export const Fragment = React.Fragment;
