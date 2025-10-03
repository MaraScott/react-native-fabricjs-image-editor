# Konva Image Editor

A powerful, browser-based image editor built with React, Konva, and Tamagui. This editor provides a complete drawing and image manipulation experience with support for shapes, text, images, layers, and WordPress integration.

## Overview

This is a standalone React application that can be embedded in WordPress or used as a standalone tool. It uses Konva for canvas rendering, Tamagui for UI components, and implements a clean separation between business logic (hooks) and presentation (components).

## Key Features

- **Drawing Tools**: Shapes (rectangles, circles, ellipses, triangles), freehand drawing, lines, text, images
- **Layer System**: Organize elements across multiple layers with visibility and locking
- **Zoom & Pan**: Smooth zoom with inertia-based panning
- **Selection**: Single and multi-element selection with drag-to-select rectangle
- **Undo/Redo**: Full history management for all operations
- **WordPress Integration**: Direct media library access and image saving
- **Theme Support**: Kid-friendly and adult themes
- **Export**: Save designs as PNG or JSON

## Project Structure

```
src/
├── index.tsx                 # Application entry point
├── ui/                       # All React components
│   ├── atoms/               # Smallest reusable components
│   │   ├── icons/          # Icon components
│   │   └── konva/          # Konva node wrappers (shapes, text, image)
│   ├── molecules/          # Composite components
│   │   ├── controls/       # Zoom controls, draw settings
│   │   └── editor/         # Layer preview, color picker
│   ├── organisms/          # Complex feature components
│   │   ├── canvas/         # EditorCanvas (Konva Stage + Layer)
│   │   └── editor/         # Toolbars, panels, viewport
│   ├── templates/          # Page-level layouts
│   └── pages/              # Full application pages
│       └── editor/EditorApp.tsx  # Main editor orchestrator
├── hooks/                   # Business logic hooks
│   ├── editor/
│   │   ├── useZoomPan.ts   # Zoom and pan state management
│   │   ├── useSelection.ts # Element selection logic
│   │   └── useWordPressIntegration.ts  # WP API integration
│   ├── useHistory.ts       # Undo/redo functionality
│   └── useImage.ts         # Image loading utilities
├── types/                   # TypeScript type definitions
│   ├── editor.ts           # Core editor types (elements, layers, options)
│   └── konva.ts            # Konva type extensions
├── utils/                   # Utility functions
│   ├── editorElements.ts   # Element creation and manipulation
│   ├── design.ts           # Design serialization/deserialization
│   ├── theme.ts            # Theme management
│   └── ids.ts              # Unique ID generation
├── contexts/               # React contexts (if any)
├── assets/                 # Static assets
│   ├── css/               # Global styles
│   └── vendor/            # Vendor libraries (React, Konva)
├── shims/                  # Module shims for bundling
├── scripts/               # Build scripts
└── dist/                  # Build output

```

## Getting Started

### Prerequisites

- Node.js (for development)
- npm or yarn

### Installation

```bash
npm install
```

### Development

Watch mode for development:

```bash
npm run watch
```

This uses esbuild to compile TypeScript and bundle the application. The output is written to `dist/editor.bundle.js`.

### Production Build

```bash
npm run build
```

### Embedding in WordPress

The editor expects a global bootstrap configuration:

```html
<div id="image-editor-root"></div>
<script>
window.__EDITOR_BOOTSTRAP__ = {
  initialDesign: null,  // or JSON string / EditorDesign object
  options: {
    width: 1024,
    height: 1024,
    backgroundColor: '#ffffff',
    // ... other options
  },
  theme: 'kid'  // or 'adult'
};
</script>
<script src="dist/editor.bundle.js"></script>
```

## Architecture

The editor follows a strict separation of concerns:

1. **Hooks Layer** (`/hooks`): All business logic, state management, and side effects
2. **Presentation Layer** (`/ui`): Pure React components that receive props and callbacks
3. **Data Layer** (`/types`, `/utils`): Type definitions and pure utility functions

See [ARCHITECTURE.md](doc/ARCHITECTURE.md) for detailed architecture documentation.

## Key Concepts

### Elements

All drawable objects (shapes, text, images) are represented as `EditorElement` objects with a common base structure:

```typescript
interface BaseElement {
  id: string;
  type: EditorElementType;
  name: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  draggable: boolean;
  visible: boolean;
  locked: boolean;
  layerId?: string | null;
}
```

### Layers

Elements are organized into layers:

```typescript
interface EditorLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}
```

### Design Document

The entire editor state is serializable:

```typescript
interface EditorDocument {
  elements: EditorElement[];
  layers: EditorLayer[];
  metadata?: Record<string, unknown> | null;
}
```

### Zoom & Pan

Zoom is managed relative to a "fit scale" - the scale at which the canvas fits perfectly in the viewport:

- Zoom values < fit scale: Canvas is smaller than viewport
- Zoom values > fit scale: Canvas is larger than viewport
- Zoom is always clamped between `min` and `max` bounds

### Selection

Two selection modes:
- **Direct Selection**: Click on an element
- **Rectangle Selection**: Drag to create a selection rectangle

Selection supports modifier keys:
- Click: Single selection
- Ctrl/Cmd + Click: Toggle selection
- Shift + Click: Add to selection

## Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
@atoms/*      → ui/atoms/*
@molecules/*  → ui/molecules/*
@organisms/*  → ui/organisms/*
@templates/*  → ui/templates/*
@pages/*      → ui/pages/*
@hooks/*      → hooks/*
@contexts/*   → contexts/*
@utils/*      → utils/*
@types/*      → types/*
@editor       → . (root)
@assets       → assets/*
@expo         → ../../../../* (parent project)
@tinyartist/* → ../../../* (parent theme)
```

## Component Guidelines

### Atomic Design Pattern

Components are organized following atomic design principles:

- **Atoms**: Single-purpose, highly reusable (Button, Icon, Shape nodes)
- **Molecules**: Combinations of atoms (ColorPicker, ZoomControls)
- **Organisms**: Feature-complete sections (Toolbar, LayersPanel, Canvas)
- **Templates**: Page layouts
- **Pages**: Full applications (EditorApp)

### Hook-First Development

Business logic lives in hooks, not components:

```typescript
// ✅ Good: Logic in hook
function useMyFeature() {
  const [state, setState] = useState();
  const doSomething = useCallback(() => { ... }, []);
  return { state, doSomething };
}

// Component is just presentation
function MyComponent() {
  const { state, doSomething } = useMyFeature();
  return <Button onClick={doSomething}>{state}</Button>;
}

// ❌ Bad: Logic in component
function MyComponent() {
  const [state, setState] = useState();
  const doSomething = () => { ... };
  return <Button onClick={doSomething}>{state}</Button>;
}
```

## Testing the Editor

Open `index.html` in a browser to test the editor standalone. The HTML file includes all necessary vendor scripts and bootstrap configuration.

## WordPress Integration

The editor integrates with WordPress via REST API:

- **Media Upload**: POST to `/wp-json/wp/v2/media`
- **Media Fetch**: GET from `/wp-json/wp/v2/media`
- **Authentication**: Uses nonce-based authentication

See [useWordPressIntegration.ts](hooks/editor/useWordPressIntegration.ts) for implementation details.

## Further Documentation

- [ARCHITECTURE.md](doc/ARCHITECTURE.md) - Detailed architecture and design patterns
- [COMPONENT_USAGE.md](doc/COMPONENT_USAGE.md) - Component API and usage examples
- [QUICK_REFERENCE.md](doc/QUICK_REFERENCE.md) - Quick reference for common tasks

## Build System

The project uses esbuild for fast compilation:

- TypeScript compilation with custom loader
- CSS bundling
- External dependencies (React, ReactDOM, Konva are loaded via CDN)
- Source maps for debugging
- Watch mode for development

See [webpack.config.js](webpack.config.js) for webpack configuration (legacy, esbuild is preferred).

## License

See [LICENSE](LICENSE) file.
