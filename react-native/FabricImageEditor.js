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

  const sendCommand = useCallback((type, payload) => {
    const message = stringifyMessage(type, payload);
    if (readyRef.current && webViewRef.current) {
      webViewRef.current.postMessage(message);
    } else {
      pendingMessagesRef.current.push(message);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    undo() {
      sendCommand('undo');
    },
    redo() {
      sendCommand('redo');
    },
    clear() {
      sendCommand('clear');
    },
    load(json) {
      if (typeof json === 'string' && json.trim()) {
        sendCommand('load', { json });
      }
    },
    export(format = 'png') {
      sendCommand('export', { format });
    },
    exportPNG() {
      sendCommand('export', { format: 'png' });
    },
    exportJSON() {
      sendCommand('export', { format: 'json' });
    },
    setDimensions(nextDimensions) {
      if (nextDimensions && (nextDimensions.width || nextDimensions.height)) {
        sendCommand('setDimensions', nextDimensions);
      }
    },
    setBackgroundColor(color) {
      if (typeof color === 'string') {
        sendCommand('setBackgroundColor', { color });
      }
    },
    insertImage(src) {
      if (typeof src === 'string' && src.trim()) {
        sendCommand('insertImage', { src });
      }
    }
  }), [sendCommand]);

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
            sendCommand('load', { json: initialDocumentRef.current });
            initialDocumentRef.current = null;
          }
          if (onReady) {
            onReady(payload || {});
          }
          break;
        }
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
        case 'download':
          if (onDownloadRequest) {
            onDownloadRequest(payload || null);
          }
          break;
        default:
          break;
      }
    },
    [flushPendingMessages, onBackgroundChange, onChange, onDimensionsChange, onDownloadRequest, onExport, onHistoryChange, onReady, onSelectionChange, sendCommand]
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
