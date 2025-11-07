/* Minimal ambient declarations to allow local type-checking without external @types packages.
   These are intentionally permissive — they prevent the compiler from erroring while
   we run a local type-check/build in an environment without network installs.
*/

// Provide a very permissive JSX namespace so TSX/JSX elements type-check locally.
declare namespace JSX {
  // Allow any intrinsic element (div, span, button, etc.) with any props.
  interface IntrinsicElements {
    [elemName: string]: any;
  }

  // Basic element types
  interface Element {}
  interface ElementClass {
    props: any;
  }
  interface ElementAttributesProperty { props: any }
  interface ElementChildrenAttribute { children: any }
}

// Minimal module declaration for Konva to satisfy imports until proper types are added.
declare module 'konva' {
  const Konva: any;
  export default Konva;
  export const Node: any;
  export const Stage: any;
  export const Layer: any;
  export const Rect: any;
  export const Transformer: any;
  export const Image: any;
  export const Group: any;
  export const Circle: any;
  export const Line: any;
  export const Text: any;
}

// If a plain "konva" global wrapper is used via shim, export a permissive type
declare module 'konva/global' { const value: any; export default value; }

// Common internal paths used by some imports
declare module 'konva/lib/Layer' {
  export type Layer = any;
  export type LayerConfig = any;
  const _default: any;
  export default _default;
}

declare module 'konva/lib/Stage' {
  export type Stage = any;
  export type StageConfig = any;
  const _default: any;
  export default _default;
}

declare module 'konva/lib/Node' {
  export type KonvaEventObject<T = any> = any;
  export type Node = any;
  const _default: any;
  export default _default;
}

declare module 'konva/lib/Group' { const value: any; export = value; }
declare module 'konva/lib/Rect' { const value: any; export = value; }
declare module 'konva/lib/Image' { const value: any; export = value; }

// Provide permissive declarations for react/react-dom so TSX files and the automatic
// JSX runtime don't require network-installed @types packages in this environment.
declare module 'react' {
  // Keep only the minimal basic types here; detailed hooked signatures live in a
  // separate targeted shim file to avoid duplication and conflicts.
  export type ReactNode = any;
  export type CSSProperties = any;
  export type DragEvent<T = any> = any;
  export default any;
}

// Note: the project provides local shims for the JSX runtime and react-konva
// in `src/shims`. We avoid redeclaring `react/jsx-runtime` or `react-konva`
// here to prevent duplicate symbol errors. Keep `react` and `react-dom` loose
// and rely on the shims for runtime shapes.
declare module 'react-dom' { const value: any; export = value; }

// Wildcard internal konva lib module declaration to cover imports like
// 'konva/lib/Layer' without requiring network-installed types.
declare module 'konva/lib/*' { const value: any; export = value; }

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    } | null;
    __EDITOR_BOOTSTRAP__?: any;
  }
}

