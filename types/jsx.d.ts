declare namespace JSX {
  interface IntrinsicElements {
    [element: string]: any;
  }

  interface IntrinsicAttributes {
    key?: string | number | null;
  }
}
