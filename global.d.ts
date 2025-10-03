import type { EditorBootstrapConfig } from '@types/editor';

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    } | null;
    __EDITOR_BOOTSTRAP__?: EditorBootstrapConfig;
  }
}

export {};
