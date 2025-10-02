declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    } | null;
    FilerobotImageEditor?: {
      default: typeof import('./components/FilerobotImageEditor').default;
      TABS: typeof import('./components/FilerobotImageEditor').TABS;
      TOOLS: typeof import('./components/FilerobotImageEditor').TOOLS;
    };
    __FILEROBOT_EDITOR_READY__?: boolean;
  }
}

export {};
