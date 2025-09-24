declare module 'react' {
  export type ReactNode = any;
  export type ReactElement = any;
  export interface MutableRefObject<T> {
    current: T;
  }
  export function useState<S>(initial: S | (() => S)): [S, (value: S | ((prev: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly any[]): T;
  export function useCallback<T extends (...args: any[]) => any>(fn: T, deps: readonly any[]): T;
  export function useRef<T>(initial: T | null): MutableRefObject<T | null>;
  export const Fragment: any;
}

declare module 'react-dom/client' {
  import type { ReactNode } from 'react';
  interface Root {
    render(children: ReactNode): void;
  }
  export function createRoot(container: Element | DocumentFragment): Root;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}

declare module 'react-konva' {
  export const Stage: any;
  export const Layer: any;
  export const Rect: any;
  export const Circle: any;
  export const Text: any;
  export const Image: any;
  export const Transformer: any;
}

declare module 'konva' {
  export interface Stage {
    toDataURL(config?: any): string;
  }
  const Konva: { Stage: Stage };
  export default Konva;
}

declare module 'konva/lib/Node' {
  export type KonvaEventObject<T = any> = {
    target: any;
  } & T;
}

declare module 'use-image' {
  export function useImage(src: string, crossOrigin?: string): [HTMLImageElement | null, string | null];
}
