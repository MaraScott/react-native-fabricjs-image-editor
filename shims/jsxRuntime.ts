import React from 'react';

type Props = Record<string, unknown> & { children?: any };

type Key = string | number | null;

function createElement(type: any, props: Props | null, key: Key) {
  const finalProps = props ? { ...props } : {};
  if (key != null) {
    finalProps.key = key;
  }
  return React.createElement(type, finalProps);
}

export const jsx = createElement;
export const jsxs = createElement;
export const Fragment = React.Fragment;
