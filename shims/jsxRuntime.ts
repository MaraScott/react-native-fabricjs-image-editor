import React from 'react';

/**
 * Props Type
 * 
 * Type definition for Props.
 */
type Props = Record<string, unknown> & { children?: any };

/**
 * Key Type
 * 
 * Type definition for Key.
 */
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
/**
 * createElement
 * 
 * Function to create element.
 * 
 * @param {any} type - Parameter description
 * @param {Props | null} props - Parameter description
 * @param {Key} key - Parameter description
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
 * jsx
 * 
 * Function to jsx.
 */
  return React.createElement(type, finalProps);
}

export const jsx = createElement;
export const jsxs = createElement;
export const Fragment = React.Fragment;
