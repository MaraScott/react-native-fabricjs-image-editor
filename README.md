# Filerobot Image Editor

A modern web-based image editor inspired by the [Filerobot Image Editor](https://github.com/scaleflex/filerobot-image-editor)
project. The editor is written in TypeScript + React and ships as a self-contained HTML bundle that can be embedded inside a
React Native WebView or any web application.

The UI mirrors the original Filerobot experience with cropping, rotation, flip tools, colour adjustments and rich text overlays.
Images can be loaded from local files or remote URLs and exported directly as PNG data URLs.

![Filerobot editor preview](screenshots/editor.jpg)

## Highlights

- **React powered interface** – The editor is authored in React with functional components and hooks, providing a familiar
  developer experience.
- **Feature-rich toolkit** – Crop with aspect ratios, rotate and flip, tweak brightness/contrast/saturation and overlay
  multiple text layers with colour and typography controls.
- **In-browser rendering** – All transformations are rendered via the Canvas API, ensuring consistent output quality when
  exporting images.
- **Plug-and-play embedding** – The generated `index.html` works inside a WebView. It posts a ready flag and exposes the
  editor globals under `window.FilerobotImageEditor` for consumers that expect the official API shape.
- **Theme aware** – Toggle between dark and light themes to match your host application.

## Getting started

```bash
npm install
npm run build
```

The build step emits hashed assets in `dist/` and updates `index.html` to reference the latest bundle. During development you
can run `npm run watch` (see `scripts/watch.js`) for incremental builds with live reload.

Open `index.html` in a browser to interact with the editor. Upload an image or pick one of the bundled Unsplash presets, edit
it and click **Save** to preview the exported PNG along with the design metadata.

## Embedding inside React Native

The editor is designed to live inside a `react-native-webview`. Copy the generated `index.html`, the `dist` directory and the
`vendor` folder into your React Native project and load the HTML from the WebView:

```tsx
import React, { useRef } from 'react';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

type EditorMessage =
  | { type: 'ready' }
  | { type: 'save'; payload: { dataUrl: string; designState: unknown } };

export default function ImageEditor() {
  const webviewRef = useRef<WebView>(null);

  const handleMessage = (event: WebViewMessageEvent) => {
    const message = JSON.parse(event.nativeEvent.data) as EditorMessage;
    switch (message.type) {
      case 'ready':
        console.log('Editor ready');
        break;
      case 'save':
        console.log('Saved image', message.payload);
        break;
      default:
        break;
    }
  };

  return (
    <WebView
      ref={webviewRef}
      originWhitelist={["*"]}
      source={require('./assets/filerobot/index.html')}
      onMessage={handleMessage}
      javaScriptEnabled
    />
  );
}
```

The editor attaches itself to `window.FilerobotImageEditor` so hosts using the public API of the original project can hook into
it if required.

## Saving and export payload

When the **Save** button is pressed the editor collects the current canvas state and produces a PNG data URL. The save payload
contains the encoded image and the transformation metadata (rotation, flip, adjustments, crop rectangle and text overlays).
You can inspect this payload in the demo UI under "Save preview".

## Folder structure

```
├── index.html             # Generated host page (updated by build scripts)
├── components/
│   ├── FilerobotEditorApp.tsx    # Demo shell + file picker
│   └── FilerobotImageEditor.tsx  # Core editor component
├── styles.css             # Global UI styles
├── scripts/               # Build & watch scripts wrapping esbuild
└── vendor/                # React runtime UMD bundles consumed by index.html
```

## License

Released under the MIT license. See [LICENSE](LICENSE) for details.
