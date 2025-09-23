import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import editorHtml from './editorHtml';

function stringifyMessage(type, payload) {
  return JSON.stringify({ type, payload });
}

const FabricImageEditor = forwardRef(function FabricImageEditor(
  {
    style,
    initialDocument = null,
    onReady,
    onChange,
    onHistoryChange,
    onSelectionChange,
    onDimensionsChange,
    onBackgroundChange,
    onExport,
    onDownloadRequest,
    originWhitelist = ['*'],
    javaScriptEnabled = true,
    domStorageEnabled = true,
    ...webViewProps
  },
  ref
) {
  const webViewRef = useRef(null);
  const readyRef = useRef(false);
  const pendingMessagesRef = useRef([]);
  const initialDocumentRef = useRef(initialDocument);

  useEffect(() => {
    initialDocumentRef.current = initialDocument;
  }, [initialDocument]);

  const flushPendingMessages = useCallback(() => {
    if (!webViewRef.current || !pendingMessagesRef.current.length) {
      return;
    }
    pendingMessagesRef.current.forEach((message) => {
      webViewRef.current.postMessage(message);
    });
    pendingMessagesRef.current = [];
  }, []);

  const dispatchMessages = useCallback((commands) => {
    const list = Array.isArray(commands) ? commands : [commands];
    list.forEach((command) => {
      if (!command || typeof command.type !== 'string') {
        return;
      }
      const message = stringifyMessage(command.type, command.payload);
      if (readyRef.current && webViewRef.current) {
        webViewRef.current.postMessage(message);
      } else {
        pendingMessagesRef.current.push(message);
      }
    });
  }, []);

  useImperativeHandle(ref, () => ({
    undo() {
      dispatchMessages({ type: 'undo' });
    },
    redo() {
      dispatchMessages({ type: 'redo' });
    },
    clear() {
      dispatchMessages([
        { type: 'clear' },
        { type: 'focus-tool', payload: { tool: 'clear' } }
      ]);
    },
    load(json) {
      if (typeof json === 'string' && json.trim()) {
        dispatchMessages([
          { type: 'load', payload: { json } },
          { type: 'set-design', payload: { json } }
        ]);
      }
    },
    export(format = 'png') {
      const normalized = format === 'json' ? 'json' : format;
      if (normalized === 'json') {
        dispatchMessages([
          { type: 'export', payload: { format: 'json' } },
          { type: 'request-json' }
        ]);
      } else {
        dispatchMessages([
          { type: 'export', payload: { format: normalized } },
          { type: 'request-export', payload: { format: normalized } }
        ]);
      }
    },
    exportPNG() {
      dispatchMessages([
        { type: 'export', payload: { format: 'png' } },
        { type: 'request-export', payload: { format: 'png' } }
      ]);
    },
    exportJSON() {
      dispatchMessages([
        { type: 'export', payload: { format: 'json' } },
        { type: 'request-json' }
      ]);
    },
    setDimensions(nextDimensions) {
      if (nextDimensions && (nextDimensions.width || nextDimensions.height)) {
        const dims = {
          ...(nextDimensions.width != null ? { width: nextDimensions.width } : {}),
          ...(nextDimensions.height != null ? { height: nextDimensions.height } : {})
        };
        dispatchMessages([
          { type: 'setDimensions', payload: dims },
          { type: 'configure', payload: { options: { dimensions: dims } } }
        ]);
      }
    },
    setBackgroundColor(color) {
      if (typeof color === 'string') {
        dispatchMessages([
          { type: 'setBackgroundColor', payload: { color } },
          { type: 'focus-tool', payload: { tool: 'background' } }
        ]);
      }
    },
    insertImage(src) {
      if (typeof src === 'string' && src.trim()) {
        dispatchMessages([
          { type: 'insertImage', payload: { src } },
          { type: 'focus-tool', payload: { tool: 'images' } }
        ]);
      }
    }
  }), [dispatchMessages]);

  const handleMessage = useCallback(
    (event) => {
      const data = event?.nativeEvent?.data;
      if (!data) return;

      let message;
      try {
        message = JSON.parse(data);
      } catch (error) {
        console.warn('Failed to parse message from editor', error);
        return;
      }

      if (!message || typeof message !== 'object') return;

      const { type, payload } = message;

      switch (type) {
        case 'ready': {
          readyRef.current = true;
          flushPendingMessages();
          if (initialDocumentRef.current) {
            dispatchMessages([
              { type: 'load', payload: { json: initialDocumentRef.current } },
              { type: 'set-design', payload: { json: initialDocumentRef.current } }
            ]);
            initialDocumentRef.current = null;
          }
          if (onReady) {
            onReady(payload || {});
          }
          break;
        }
        case 'change':
          if (onChange) {
            onChange(payload ? payload.json || null : null);
          }
          break;
        case 'document':
          if (onChange) {
            onChange(payload ? payload.json || null : null);
          }
          break;
        case 'history':
          if (onHistoryChange) {
            onHistoryChange(payload || { undo: 0, redo: 0 });
          }
          break;
        case 'selection':
          if (onSelectionChange) {
            onSelectionChange(payload || null);
          }
          break;
        case 'dimensions':
          if (onDimensionsChange) {
            onDimensionsChange(payload || null);
          }
          break;
        case 'background':
          if (onBackgroundChange) {
            onBackgroundChange(payload || null);
          }
          break;
        case 'export':
          if (onExport) {
            onExport(payload || null);
          }
          break;
        case 'save':
          if (onExport) {
            onExport({ ...(payload || {}), format: 'json' });
          }
          break;
        case 'download':
          if (onDownloadRequest) {
            onDownloadRequest(payload || null);
          }
          break;
        case 'log':
          if (payload && payload.message) {
            console.log('[FabricImageEditor]', payload.message);
          }
          break;
        case 'error':
          if (payload && payload.message) {
            console.warn('[FabricImageEditor]', payload.message);
          }
          break;
        default:
          break;
      }
    },
    [dispatchMessages, flushPendingMessages, onBackgroundChange, onChange, onDimensionsChange, onDownloadRequest, onExport, onHistoryChange, onReady, onSelectionChange]
  );

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={originWhitelist}
        javaScriptEnabled={javaScriptEnabled}
        domStorageEnabled={domStorageEnabled}
        source={{ html: editorHtml, baseUrl: '' }}
        onMessage={handleMessage}
        {...webViewProps}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});

export default FabricImageEditor;
