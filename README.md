# Fabric.JS Image Editor
This image editor allows users to draw default shapes, pen-drawing, line, curve + straight path, text, png/jpg/svg images on browser.

[Demo!](https://fabricjs-image-editor-origin.vercel.app)

![Positioning Example](screenshots/editor.jpg)

## Dependency
  * jQuery v3.5.1
  * jQuery spectrum-colorpicker2
  * Fabric.js v5.3.1
  * IconScout Unicons v4.0.8

## Initialize
```javascript
  // define toolbar buttons to show
  // if this value is undefined or its length is 0, default toolbar buttons will be shown
  const buttons = [
    'select',
    'shapes',
    // 'draw',
    // 'line',
    // 'path',
    // 'textbox',
    // 'upload',
    // 'background',
    'undo',
    'redo',
    'save',
    'download',
    'clear',
    'images'
    'fullscreen',
    'templates',
    'animation',
    'frames',
    'rect',
    'ellipse',
    'triangle'
  ];

  // define custom shapes
  // if this value is undefined or its length is 0, default shapes will be used
  const shapes = [
    `<svg viewBox="-10 -10 180 180" fill="none" stroke="none" stroke-linecap="square" stroke-miterlimit="10"><path stroke="#000000" stroke-width="8" stroke-linecap="butt" d="m0 0l25.742783 0l0 0l38.614174 0l90.09974 0l0 52.74803l0 0l0 22.6063l0 15.070862l-90.09974 0l-61.5304 52.813744l22.916225 -52.813744l-25.742783 0l0 -15.070862l0 -22.6063l0 0z" fill-rule="evenodd"></path></svg>`,
    `<svg viewBox="-10 -10 180 180" fill="none" stroke="none" stroke-linecap="square" stroke-miterlimit="10"><path stroke="#000000" stroke-width="8" stroke-linejoin="round" stroke-linecap="butt" d="m1.0425826 140.35696l25.78009 -49.87359l0 0c-30.142242 -17.309525 -35.62507 -47.05113 -12.666686 -68.71045c22.958385 -21.65932 66.84442 -28.147947 101.387596 -14.990329c34.543175 13.1576185 48.438576 41.655407 32.10183 65.83693c-16.336761 24.181526 -57.559166 36.132935 -95.233955 27.61071z" fill-rule="evenodd"></path></svg>`,
    `<svg viewBox="0 -5 100 100" x="0px" y="0px"><path fill="none" stroke="#000" stroke-width="8" d="M55.2785222,56.3408313 C51.3476874,61.3645942 45.2375557,64.5921788 38.3756345,64.5921788 C31.4568191,64.5921788 25.3023114,61.3108505 21.3754218,56.215501 C10.6371566,55.0276798 2.28426396,45.8997866 2.28426396,34.8156425 C2.28426396,27.0769445 6.35589452,20.2918241 12.4682429,16.4967409 C14.7287467,7.0339786 23.2203008,0 33.3502538,0 C38.667844,0 43.5339584,1.93827732 47.284264,5.14868458 C51.0345695,1.93827732 55.9006839,0 61.2182741,0 C73.0769771,0 82.6903553,9.6396345 82.6903553,21.5307263 C82.6903553,22.0787821 82.6699341,22.6220553 82.629813,23.1598225 C87.1459866,27.1069477 90,32.9175923 90,39.396648 C90,51.2877398 80.3866218,60.9273743 68.5279188,60.9273743 C63.5283115,60.9273743 58.9277995,59.2139774 55.2785222,56.3408313 L55.2785222,56.3408313 Z M4.79695431,82 C7.44623903,82 9.59390863,80.6668591 9.59390863,79.0223464 C9.59390863,77.3778337 7.44623903,76.0446927 4.79695431,76.0446927 C2.1476696,76.0446927 0,77.3778337 0,79.0223464 C0,80.6668591 2.1476696,82 4.79695431,82 Z M13.7055838,71.9217877 C18.4995275,71.9217877 22.3857868,69.4606044 22.3857868,66.424581 C22.3857868,63.3885576 18.4995275,60.9273743 13.7055838,60.9273743 C8.91163999,60.9273743 5.02538071,63.3885576 5.02538071,66.424581 C5.02538071,69.4606044 8.91163999,71.9217877 13.7055838,71.9217877 Z"></path></svg>`
  ];

  const images = [
    `screenshots/astronaut.png`,
  ];

  const templates = [];

  // define custom fonts
  const fonts = [
    {
      name: 'WorkSans',
      path: 'fonts/WorkSans/WorkSans-Regular.ttf',
      style: 'normal',
      weight: 'normal'
    }
  ];

  const options = {
    buttons: buttons,
    shapes: shapes,
    images: images,    
    dimensions: {
      width: 1360,
      height: 768
    },
    templates: templates,
    canvasSizeBlock: true,
    fonts: fonts,
    layers: true,
    fixedCanvas: true // By default, the canvas is dynamic
  };  

  var imgEditor = new ImageEditor('#image-editor-container', options);
```

## Save/Load Editor status

```javascript
  let status = imgEditor.getCanvasJSON();
  imgEditor.setCanvasStatus(status);
```

## Rulers and Guides

This functionality allows adding rulers and guidelines to assist in object alignment, similar to the "Show ruler and guides (Shift+R)" function from Canva.com.

### How to use:

1. **Enable/Disable Rulers**: 
   - Click the ruler button in the toolbar
   - Or use the keyboard shortcut `Shift+R`

2. **Create Guides**:
   - Click and drag from the horizontal ruler to create a horizontal guide
   - Click and drag from the vertical ruler to create a vertical guide

3. **Move Guides**:
   - Select a guide and drag it to reposition
   - Horizontal guides can only be moved vertically
   - Vertical guides can only be moved horizontally

4. **Delete Guides**:
   - Double-click on a guide to remove it

The rulers show measurements in pixels and automatically adjust to the canvas zoom.

To enable this functionality, include 'ruler' in the toolbar buttons list:

```javascript
const buttons = [
  'select',
  'shapes',
  'draw',
  'ruler',  // Add this line to include the ruler button
  'undo',
  'redo',
  // ... other buttons
];
```

## Features

### 🎨 EyeDropper

The eyedropper functionality allows selecting colors from anywhere on the screen to use in editor elements. This feature utilizes the native browser `EyeDropper` API.

#### Compatibility:

- ✅ Chrome 95+
- ✅ Edge 95+
- ❌ Firefox (not yet supported)
- ❌ Safari (not yet supported)

**Note**: On unsupported browsers, the eyedropper button will not be displayed and an informative message will appear.

---------------------------------------------------------------------------------------------------

# Expo / React Native integration guide

This directory shows how to package the Fabric.js image editor inside an Expo
application by treating the browser editor as a local WebView bundle. The
`Editor` component in `components/editor/Editor.tsx` is a drop-in React
Native wrapper that talks to the editor running inside `assets/editor/index.html`.

## Project structure

```
tinyartist-editor/
├── assets/
│   └── fabric-editor/
│       └── src/
│           ├── bootstrap.js          # Bootstraps the editor + RN bridge
│           ├── index.html            # Host page loaded by the WebView
│           ├── dist/                 # Prebuilt editor bundle (copied from repo root)
│           ├── fonts/                # Font assets referenced by the editor
│           ├── lib/                  # Editor styles and templates
│           └── vendor/               # Third-party helpers used by the editor UI
└── components/
    └── web/
        └── Editor.tsx     # React Native wrapper component
```

Copy this folder into your Expo project (for example under `./examples/editor`)
and keep the internal layout intact so relative paths inside `index.html` keep
working.

## Installation steps

1. **Install the WebView dependency**

   ```bash
   expo install react-native-webview
   ```

2. **Copy the editor assets**

   - Copy `examples/expo/assets/editor` into your Expo project's `assets`
     folder (e.g. `your-app/assets/editor`).
   - The folder already contains the `dist`, `lib`, `fonts`, and `vendor`
     directories required by the editor.
   - `index.html` still references a few CDN scripts (`jQuery`, `fabric.js`,
     `spectrum-colorpicker`, and `lodash`). For offline usage, download those
     files and place them inside `assets/editor/vendor`, then update the
     `<script>` tags in `index.html` to point to the local copies.

3. **Allow Metro to bundle HTML/font assets**

   Ensure your `metro.config.js` includes HTML and font extensions so Expo ships
   the assets with your bundle:

   ```js
   const { getDefaultConfig } = require('expo/metro-config');
   const config = getDefaultConfig(__dirname);

   config.resolver.assetExts.push('html');
   config.resolver.assetExts.push('ttf');

   module.exports = config;
   ```

4. **Reference the component**

   Copy `examples/expo/src/Editor.tsx` into your project (for
   example under `src/components`). Import it and render it anywhere inside your
   React Native tree:

   ```tsx
   import React, { useRef } from 'react';
   import Editor, {
     EditorHandle,
     FabricExportFormat
   } from '@components/native/Editor';

   export default function EditorScreen() {
     const editorRef = useRef<EditorHandle>(null);

     return (
       <Editor
         ref={editorRef}
         initialDesign={null}
         onReady={() => console.log('Editor ready')}
         onChange={({ json }) => console.log('Canvas changed', json)}
         onSave={({ json }) => console.log('Saved state', json)}
         onExport={(payload) => console.log('Exported', payload.format)}
         onError={(error) => console.warn('Editor error', error)}
       />
     );
   }
   ```

## Component API

`<Editor />` renders a `react-native-webview` that loads
`assets/editor/index.html`. Props map directly to the editor configuration
options from `script.js`:

| Prop | Description |
| ---- | ----------- |
| `initialDesign` | Fabric.js JSON (string or object) applied on load. |
| `toolbarButtons`, `shapes`, `images`, `templates`, `fonts` | Same arrays used in `script.js`; when these props change the WebView reconfigures itself without losing the canvas contents. |
| `dimensions`, `canvasSizeBlock`, `fixedCanvas`, `layers` | Mirror the options passed to `new ImageEditor(...)`. |
| `onReady` | Called when the WebView reports that the editor finished booting. The current options are passed to the callback. |
| `onChange` | Fired after debounced canvas mutations (`object:added`, `undo`, etc.). Receives `{ json }`. |
| `onSave` | Fired when the user hits the **Save** toolbar button. |
| `onExport` | Fired for downloads or programmatic export requests. Payload contains `{ format, dataUrl? , json? , svg? }`. |
| `onLog` | Optional hook for verbose logging coming from the WebView bridge. |
| `onError` | Receives errors surfaced in the HTML bridge (invalid JSON, initialization problems, etc.). |
| `webViewProps` | Forwarded to `react-native-webview` (with `source`, `onMessage`, and `injectedJavaScriptBeforeContentLoaded` reserved for the wrapper). |

### Imperative helpers

The forwarded ref implements the following helpers:

- `requestCanvasJSON()` – asks the WebView to send the latest Fabric.js JSON via
  the `onChange` callback.
- `requestExport(format?: FabricExportFormat)` – requests a specific export. The
  reply arrives through `onExport`.
- `focusTool(toolId: string)` – programmatically open a toolbar button by ID
  (`'draw'`, `'textbox'`, etc.).
- `reload()` – reload the underlying WebView.
- `postMessage(message)` – send a raw message to the WebView bridge if you need
  custom behaviour.

### Messages flowing out of the WebView

The bridge defined in `assets/editor/bootstrap.js` posts the following message
payloads back to React Native:

- `ready` – editor finished initializing.
- `change` – canvas mutated; includes `json` with `metadata` and
  `excludeFromExport` preserved.
- `save` – save button triggered.
- `export` – export event fired (includes the format and serialized output).
- `log` – verbose bridge logging.
- `error` – structured error information when something goes wrong inside the
  WebView.

Because the HTML bundle wraps `saveToBrowser`, `downloadImage`, `downloadSVG`,
`downloadJSON`, and the Fabric canvas mutation events, you receive consistent
callbacks in React Native even if the user exports directly from the toolbar.

## Offline bundling checklist

To ship the editor completely offline you must ensure the following files are
packaged in your Expo bundle:

- `assets/editor/index.html`
- `assets/editor/bootstrap.js`
- `assets/editor/dist/fabricjs-image-editor-origin.js`
- `assets/editor/lib/**`
- `assets/editor/fonts/**`
- `assets/editor/vendor/**`
- Local copies of:
  - `jquery-3.5.1.min.js`
  - `fabric.min.js` (5.3.1)
  - `spectrum.min.css` + `spectrum.min.js`
  - `lodash.min.js`

Update the `<link>`/`<script>` tags in `index.html` to point to the local
versions once you add them. Expo's asset pipeline will fingerprint and ship
those files alongside the app binary.

## Development tips

- The WebView bridge stores the last Fabric JSON snapshot. When you change
  toolbar props at runtime the wrapper reconfigures the editor but restores the
  current canvas so the user doesn't lose work.
- Use `editorRef.current?.requestExport('png')` to trigger a download workflow
  from native UI elements (e.g., a share sheet button).
- For debugging, pass `onLog={(message, payload) => console.log(message, payload)}`
  to surface internal bridge messages.

