# Konva Image Editor

A modern image editor powered by [React Konva](https://konvajs.org/docs/react/index.html). The entire UI is written in TypeScript + JSX and can be embedded inside a React Native application through a `WebView`. The editor allows adding and editing rectangles, circles, text blocks and remote images with undo/redo history, exporting to PNG/JPEG/JSON and two–way messaging with native hosts.

![Editor preview](screenshots/editor.jpg)

## Highlights

- **Konva rendering** – Shapes are rendered with `react-konva`, providing fast Canvas operations and transformer handles.
- **TypeScript-first** – All editor modules are authored as `.tsx` files with strict typing.
- **React Native bridge** – The HTML bundle posts `ready`, `change`, `save` and `export` events to the host app and accepts imperative commands (`loadDesign`, `requestExport`, `undo`, `redo`, etc.).
- **Customisable canvas** – Change dimensions, background colour and grid visibility at runtime.
- **No Fabric.js** – The legacy Fabric implementation has been removed in favour of Konva + React.

## Development

```bash
npm install
npm run build
```

The build command produces `dist/editor.bundle.js`, which is loaded by `index.html`. During local development you can use `npm run watch` for incremental builds.

### Project structure

```
├── index.html              # Minimal host page for the editor
├── src/
│   ├── components/
│   │   ├── EditorApp.tsx   # Main application shell + toolbar/bridge
│   │   ├── KonvaNodes.tsx  # Rect/Circle/Text/Image renderers with transformers
│   │   └── PropertiesPanel.tsx
│   ├── hooks/useHistory.ts # Simple undo/redo state helper
│   ├── types/              # Editor model + React/konva shims
│   ├── utils/design.ts     # JSON serialisation helpers
│   └── index.tsx           # Entrypoint rendered by webpack
├── tsconfig.json
└── webpack.config.js
```

## Embedding in React Native

The bundle is designed to run inside a `react-native-webview`. Copy the `index.html`, `dist`, `src` build output and supporting assets (`fonts`, `vendor`) into your app and load the HTML file locally:

```tsx
import React, { useRef } from 'react';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

type EditorMessage =
  | { type: 'ready'; payload: { options: any } }
  | { type: 'change'; payload: { json: string } }
  | { type: 'save'; payload: { json: string } }
  | { type: 'export'; payload: { format: string; dataUrl?: string; json?: string } };

export default function Editor() {
  const webviewRef = useRef<WebView>(null);

  const handleMessage = (event: WebViewMessageEvent) => {
    const data = JSON.parse(event.nativeEvent.data) as EditorMessage;
    switch (data.type) {
      case 'ready':
        console.log('Editor ready', data.payload.options);
        break;
      case 'change':
        console.log('Design changed', data.payload.json);
        break;
      case 'save':
        console.log('Saved', data.payload.json);
        break;
      case 'export':
        console.log('Exported', data.payload.format);
        break;
      default:
        break;
    }
  };

  const postMessage = (message: unknown) => {
    webviewRef.current?.postMessage(JSON.stringify(message));
  };

  return (
    <WebView
      ref={webviewRef}
      originWhitelist={["*"]}
      source={require('./assets/editor/index.html')}
      onMessage={handleMessage}
      javaScriptEnabled
    />
  );
}
```

### Supported bridge messages

Messages sent **from** native to the editor:

| Type | Payload | Effect |
| ---- | ------- | ------ |
| `setDesign` / `loadDesign` | `{ json: string \| EditorDesign }` | Loads a serialized canvas state |
| `setOptions` | `{ options: Partial<EditorOptions> }` | Updates canvas dimensions, background, grid |
| `undo` / `redo` | – | History traversal |
| `clear` | – | Clears the canvas |
| `requestExport` | `{ format?: 'png' \| 'jpeg' \| 'json' }` | Triggers export callback |
| `requestJSON` | – | Emits latest JSON snapshot |

Messages emitted **to** native:

- `ready` – Editor boot completed (current options included).
- `change` – Debounced canvas changes with serialized JSON.
- `save` – Save button clicked.
- `export` – Export complete, includes format + payload.

## Licensing

Released under the MIT license. See [LICENSE](LICENSE) for details.
