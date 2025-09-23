# Fabric.js React Image Editor

This repository contains a Fabric.js powered canvas editor rendered with a lightweight React runtime. The browser build ships with an `index.html` entry point, and the same UI can be embedded inside a React Native application through a `WebView` wrapper that exchanges state over `postMessage`.

![Editor UI](screenshots/editor.jpg)

## Getting started (web)

1. (Optional) Install dependencies if you plan to modify the tooling:
   ```bash
   npm install
   ```
2. Generate the browser bundle (combines `vendor/fabric.min.js`, the React-lite runtime, and the editor source into a single file):
   ```bash
   npm run build
   ```
3. Open `index.html` in a modern browser. The page loads `dist/react-app.bundle.js`, which contains Fabric.js, the runtime, and all React components.

The `npm run build` step produces `dist/react-app.bundle.js`. Running `npm run build:native` additionally emits `dist/editor-inline.html`, a fully inline document that is also re-exported as `react-native/editorHtml.js` for the WebView wrapper.

## Feature parity with the original library build

The React rewrite covers every tool shipped in the legacy `lib/` implementation:

- **Canvas tooling:** selection, free drawing, text editing, geometric shapes, image uploads, animation toggles, fullscreen, zoom, rulers, and snapping guides.
- **Layout helpers:** frames, templates (save/rename/delete/apply), layer manager (reorder, lock, hide), and copy/paste/duplicate operations.
- **State management:** undo/redo history, autosave to localStorage, JSON import/export, PNG export, and React Native bridge events for selection, history, and document changes.
- **Feedback utilities:** keyboard shortcuts, confirmation/notification toasts, toolbar readouts, and persisted settings.

Everything formerly coordinated by the vendor scripts (`context-menu`, `undo-redo-stack`, etc.) now lives in `lib/react-app.js`, ensuring the React UI exposes the same feature surface as the original Fabric.js editor.

## React Native integration

The `react-native/FabricImageEditor.js` component wraps the editor in a [`react-native-webview`](https://github.com/react-native-webview/react-native-webview) instance and exposes an imperative API for undo/redo, exports, and runtime configuration. The component loads the auto-generated `react-native/editorHtml.js` file that embeds the web editor as an inline HTML string.

Install the WebView dependency inside your React Native project:

```bash
npm install react-native-webview
# or
yarn add react-native-webview
```

Copy the `react-native/` folder into your project (or import it directly if you consume this repository as a package). A minimal usage example looks like this:

```tsx
import React, { useRef } from 'react';
import FabricImageEditor from './react-native/FabricImageEditor';

export default function EditorScreen() {
  const editorRef = useRef(null);

  const handleReady = () => {
    // Load a previously saved document after the editor signals readiness
    const savedDesign = loadDesignFromStorage();
    if (savedDesign) {
      editorRef.current?.load(savedDesign);
    }
  };

  const handleExport = (result) => {
    if (result?.format === 'png' && result?.dataUrl) {
      uploadPreview(result.dataUrl);
    }
    if (result?.format === 'json' && result?.data) {
      persistDesign(result.data);
    }
  };

  return (
    <FabricImageEditor
      ref={editorRef}
      style={{ flex: 1 }}
      onReady={handleReady}
      onExport={handleExport}
      onChange={(json) => cacheDraft(json)}
      onHistoryChange={({ undo, redo }) => updateUndoRedoUi(undo, redo)}
    />
  );
}
```

### Imperative methods

Calling `useRef` on the component exposes:

- `undo()` / `redo()`
- `clear()`
- `load(json: string)` – hydrate the canvas from a JSON snapshot
- `export(format: 'png' | 'json')`
- `exportPNG()` / `exportJSON()` convenience helpers
- `setDimensions({ width, height })`
- `setBackgroundColor(color: string)`
- `insertImage(src: string)` – load an image from a URL or base64 string

### Event callbacks

The following callbacks keep the native UI synchronized with the editor state:

- `onReady(payload)` – fired after Fabric.js initialises; payload contains `{ dimensions, backgroundColor, history, selection }`
- `onChange(json)` – canvas JSON updated (already stringified)
- `onHistoryChange({ undo, redo })`
- `onSelectionChange(selection)` – includes fill, stroke, font and geometry fields
- `onDimensionsChange({ width, height })`
- `onBackgroundChange({ color })`
- `onExport(result)` – triggered when the web editor emits an export; PNG exports include a `dataUrl`, JSON exports include a `data` string
- `onDownloadRequest({ filename, type, content })` – emitted when the in-browser download helpers are invoked inside the WebView (e.g. “Save JSON”)

Any additional props passed to `FabricImageEditor` are forwarded to the underlying `WebView` instance, letting you control caching, origin policies, or injected JavaScript.

## Regenerating the embedded HTML

Whenever you edit `lib/react-app.js`, `lib/react-lite.js`, `lib/react-app.css`, or `vendor/fabric.min.js`, run the build script to refresh the bundle and inline assets:

```bash
npm run build:native
```

This command updates:

- `dist/react-app.bundle.js` – concatenated Fabric.js + runtime + React UI for the browser entry point
- `dist/editor-inline.html` – the self-contained HTML document
- `react-native/editorHtml.js` – the inline string consumed by the React Native wrapper

## Repository structure

- `index.html` – browser entry point that references `dist/react-app.bundle.js`
- `dist/` – build artifacts (`react-app.bundle.js`, `editor-inline.html`, legacy webpack output)
- `lib/` – Fabric.js helpers, runtime, styles, and React components
- `react-native/` – WebView wrapper and generated HTML payload
- `scripts/` – build utilities, including the inline HTML generator
- `vendor/` – Fabric.js distribution used by both builds

## License

Distributed under the MIT License. See `LICENSE` for details.
