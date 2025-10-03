# Quick Reference Guide

A cheat sheet for common development tasks in the Konva Image Editor.

## Table of Contents

- [Project Commands](#project-commands)
- [File Structure](#file-structure)
- [Import Aliases](#import-aliases)
- [Common Types](#common-types)
- [Utility Functions](#utility-functions)
- [Hook APIs](#hook-apis)
- [Component Props](#component-props)
- [Common Patterns](#common-patterns)
- [Debugging](#debugging)

## Project Commands

```bash
# Install dependencies
npm install

# Development (watch mode)
npm run watch

# Production build
npm run build

# Build outputs to:
dist/editor.bundle.js
```

## File Structure

```
src/
├── index.tsx              # Entry point
├── types/                 # TypeScript types
│   ├── editor.ts         # Element, Layer, Options types
│   └── konva.ts          # Konva type extensions
├── hooks/                 # Business logic hooks
│   ├── useHistory.ts     # Undo/redo
│   ├── useImage.ts       # Image loading
│   └── editor/
│       ├── useZoomPan.ts
│       ├── useSelection.ts
│       └── useWordPressIntegration.ts
├── utils/                 # Pure utility functions
│   ├── editorElements.ts # Element factories
│   ├── design.ts         # Serialization
│   ├── theme.ts          # Theme management
│   └── ids.ts            # ID generation
├── ui/                    # React components
│   ├── atoms/            # Smallest components
│   ├── molecules/        # Composite components
│   ├── organisms/        # Feature sections
│   ├── templates/        # Page layouts
│   └── pages/            # Full apps
├── contexts/             # React contexts
├── assets/               # Static assets
└── shims/                # Module shims
```

## Import Aliases

```typescript
import { X } from '@atoms/*';        // ui/atoms/*
import { X } from '@molecules/*';    // ui/molecules/*
import { X } from '@organisms/*';    // ui/organisms/*
import { X } from '@templates/*';    // ui/templates/*
import { X } from '@pages/*';        // ui/pages/*
import { X } from '@hooks/*';        // hooks/*
import { X } from '@contexts/*';     // contexts/*
import { X } from '@utils/*';        // utils/*
import { X } from '@types/*';        // types/*
import { X } from '@assets';         // assets/*
import { X } from '@editor';         // . (root)
import { X } from '@expo';           // ../../../../*
import { X } from '@tinyartist/*';   // ../../../*
```

## Common Types

### Element Types

```typescript
// Base element (all elements extend this)
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

// Specific element types
type EditorElementType =
  | 'rect' | 'circle' | 'ellipse' | 'triangle'
  | 'line' | 'path' | 'pencil'
  | 'text' | 'image'
  | 'guide' | 'frame';

// Union of all element types
type EditorElement =
  | RectElement
  | CircleElement
  | TextElement
  | ImageElement
  | ... ;
```

### Layer Type

```typescript
interface EditorLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}
```

### Document Type

```typescript
interface EditorDocument {
  elements: EditorElement[];
  layers: EditorLayer[];
  metadata?: Record<string, unknown> | null;
}

interface EditorDesign extends EditorDocument {
  options?: Partial<EditorOptions> | null;
}
```

### Options Type

```typescript
interface EditorOptions {
  width: number;
  height: number;
  backgroundColor: string;
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  snapToGuides: boolean;
  showGuides: boolean;
  showRulers: boolean;
  zoom: number;
  fixedCanvas: boolean;
  canvasSizeLocked: boolean;
}
```

## Utility Functions

### Element Creation

```typescript
import { createRect, createCircle, createText, createImage } from '@utils/editorElements';

// Create rectangle
const rect = createRect({
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  fill: '#3b82f6',
});

// Create circle
const circle = createCircle({
  x: 200,
  y: 200,
  radius: 50,
  fill: '#ef4444',
});

// Create text
const text = createText({
  x: 150,
  y: 150,
  text: 'Hello',
  fontSize: 32,
});

// Create image
const image = createImage({
  x: 100,
  y: 100,
  src: 'https://...',
  width: 300,
  height: 200,
});
```

### Element Manipulation

```typescript
import { cloneElement, assignElementsToLayer } from '@utils/editorElements';

// Clone element
const cloned = cloneElement(original);

// Assign to layer
const updated = assignElementsToLayer(elements, layerId, elementIds);

// Order by layer
const ordered = orderElementsByLayer(elements, layers);
```

### Design Serialization

```typescript
import { stringifyDesign, parseDesign, createEmptyDesign } from '@utils/design';

// Serialize to JSON
const json = stringifyDesign({ elements, layers, options });

// Parse from JSON
const design = parseDesign(jsonString);

// Create empty design
const empty = createEmptyDesign();
```

### Layer Management

```typescript
import { createLayerDefinition, getNextLayerName } from '@utils/editorElements';

// Create layer
const layer = createLayerDefinition('My Layer');

// Get next layer name
const name = getNextLayerName(existingLayers); // "Layer 2", "Layer 3", etc.
```

### ID Generation

```typescript
import { generateId } from '@utils/ids';

const id = generateId(); // "abc123xyz..."
```

## Hook APIs

### useHistory

```typescript
const history = useHistory({ elements, layers });

history.save();           // Save current state
history.undo();           // Returns previous state or null
history.redo();           // Returns next state or null
history.clear();          // Clear all history
history.canUndo;          // boolean
history.canRedo;          // boolean
```

### useZoomPan

```typescript
const zoomPan = useZoomPan({
  initialZoom: 1,
  maxZoom: 8,
  stageSize: { width: 1024, height: 1024 },
  canvasRef,
});

zoomPan.zoom;                      // Current zoom
zoomPan.stagePosition;             // { x, y }
zoomPan.fitScale;                  // Scale to fit
zoomPan.zoomBounds;                // { min, max }
zoomPan.workspaceSize;             // { width, height }
zoomPan.isPanMode;                 // boolean
zoomPan.isPanning;                 // boolean

zoomPan.setZoom(1.5);              // Set zoom
zoomPan.setStagePosition({ x: 0, y: 0 }); // Set position
zoomPan.setIsPanMode(true);        // Enable pan mode
zoomPan.startPanInertia({ vx, vy }); // Start inertia
zoomPan.stopInertia();             // Stop inertia
```

### useSelection

```typescript
const selection = useSelection({
  onSelectionChange: (ids) => { /* ... */ },
});

selection.selectedIds;             // string[]
selection.selectionRect;           // SelectionRect | null

selection.selectElement(id, 'single');     // Select one
selection.selectElement(id, 'toggle');     // Toggle selection
selection.selectElement(id, 'add');        // Add to selection
selection.selectMultiple(ids);             // Select multiple
selection.clearSelection();                // Clear all

selection.startRectSelection(origin);      // Start drag
selection.updateRectSelection(current);    // Update drag
selection.endRectSelection(elements);      // Finish, returns IDs
selection.cancelRectSelection();           // Cancel drag
```

### useWordPressIntegration

```typescript
const wp = useWordPressIntegration({
  config: { restUrl, nonce, username },
});

wp.isConfigured;                  // boolean
wp.isUploading;                   // boolean

// Upload media
const result = await wp.uploadMedia(file, 'Title');
// Returns: { success: boolean, url?: string, error?: string }

// Fetch user media
const result = await wp.fetchUserMedia();
// Returns: { success: boolean, items?: NormalizedMediaItem[], error?: string }

// Update config
wp.updateConfig({ restUrl, nonce });
```

### useImage

```typescript
import { useImage } from '@hooks/useImage';

const [image, status] = useImage(src);
// image: HTMLImageElement | undefined
// status: 'loading' | 'loaded' | 'failed'
```

## Component Props

### Node Components (Atoms)

All node components share these common props:

```typescript
interface NodeProps {
  element: ElementType;          // Element data
  selected?: boolean;            // Is selected
  onSelect?: (id: string) => void;
  onDragEnd?: (id: string, pos: Vector2d) => void;
  onTransform?: (id: string, attrs: Partial<ElementType>) => void;
}

// Text-specific
interface TextNodeProps extends NodeProps {
  editing?: boolean;
  onTextChange?: (id: string, text: string) => void;
  onEditStart?: (id: string) => void;
  onEditEnd?: (id: string) => void;
}

// Image-specific
interface ImageNodeProps extends NodeProps {
  image?: HTMLImageElement;
}
```

### ZoomControls

```typescript
interface ZoomControlsProps {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  fitScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
  onZoomToActual: () => void;
}
```

### PrimaryToolbar

```typescript
interface PrimaryToolbarProps {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  onAddRect: () => void;
  onAddCircle: () => void;
  onAddText: () => void;
  onAddImage: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  // ... more props
}
```

### EditorCanvas

```typescript
interface EditorCanvasProps {
  stageRef: RefObject<Konva.Stage>;
  elements: EditorElement[];
  selectedIds: string[];
  width: number;
  height: number;
  backgroundColor: string;
  zoom: number;
  stagePosition: Vector2d;
  onElementSelect: (id: string) => void;
  onElementDragEnd: (id: string, pos: Vector2d) => void;
  onElementTransform: (id: string, attrs: any) => void;
  onStageMouseDown: (e: KonvaEventObject<MouseEvent>) => void;
  onStageMouseMove: (e: KonvaEventObject<MouseEvent>) => void;
  onStageMouseUp: (e: KonvaEventObject<MouseEvent>) => void;
  // ... more props
}
```

## Common Patterns

### Add Element

```typescript
const addElement = useCallback((element: EditorElement) => {
  setElements(prev => [...prev, element]);
  history.save();
}, [history]);

// Usage
const handleAddRect = () => {
  const rect = createRect({ x: 100, y: 100, width: 200, height: 150 });
  addElement(rect);
};
```

### Update Element

```typescript
const updateElement = useCallback((id: string, changes: Partial<EditorElement>) => {
  setElements(prev =>
    prev.map(el => el.id === id ? { ...el, ...changes } : el)
  );
  history.save();
}, [history]);

// Usage
updateElement('rect1', { x: 200, y: 200 });
```

### Delete Element

```typescript
const deleteElement = useCallback((id: string) => {
  setElements(prev => prev.filter(el => el.id !== id));
  selection.clearSelection();
  history.save();
}, [selection, history]);
```

### Clone Element

```typescript
const cloneSelected = useCallback(() => {
  const toClone = elements.filter(e =>
    selection.selectedIds.includes(e.id)
  );

  const clones = toClone.map(e => cloneElement(e, { x: e.x + 10, y: e.y + 10 }));

  setElements(prev => [...prev, ...clones]);
  selection.selectMultiple(clones.map(c => c.id));
  history.save();
}, [elements, selection, history]);
```

### Export to PNG

```typescript
const exportPNG = useCallback(() => {
  const stage = stageRef.current;
  if (!stage) return;

  const dataURL = stage.toDataURL({
    pixelRatio: 2,
    mimeType: 'image/png',
  });

  const link = document.createElement('a');
  link.download = 'design.png';
  link.href = dataURL;
  link.click();
}, []);
```

### Export to JSON

```typescript
const exportJSON = useCallback(() => {
  const design: EditorDesign = { elements, layers, options };
  const json = stringifyDesign(design);

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.download = 'design.json';
  link.href = url;
  link.click();

  URL.revokeObjectURL(url);
}, [elements, layers, options]);
```

### Load from JSON

```typescript
const loadJSON = useCallback((file: File) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    const json = e.target?.result as string;
    const design = parseDesign(json);

    if (design) {
      setElements(design.elements);
      setLayers(design.layers);
      if (design.options) {
        setOptions(prev => ({ ...prev, ...design.options }));
      }

      history.clear();
      selection.clearSelection();
    }
  };

  reader.readAsText(file);
}, [history, selection]);
```

### Handle Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMod = e.ctrlKey || e.metaKey;

    // Undo: Ctrl/Cmd + Z
    if (isMod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      const prev = history.undo();
      if (prev) {
        setElements(prev.elements);
        setLayers(prev.layers);
      }
    }

    // Redo: Ctrl/Cmd + Shift + Z
    if (isMod && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      const next = history.redo();
      if (next) {
        setElements(next.elements);
        setLayers(next.layers);
      }
    }

    // Delete: Delete or Backspace
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      deleteSelected();
    }

    // Select All: Ctrl/Cmd + A
    if (isMod && e.key === 'a') {
      e.preventDefault();
      selection.selectMultiple(elements.map(e => e.id));
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [elements, history, selection]);
```

### Handle Mouse Events

```typescript
const onStageMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
  const clickedOnEmpty = e.target === e.target.getStage();

  if (clickedOnEmpty) {
    if (tool === 'select') {
      // Start rectangle selection
      const pos = e.target.getStage()?.getPointerPosition();
      if (pos) {
        selection.startRectSelection(pos);
      }
    } else if (tool === 'rect') {
      // Start drawing rectangle
      handleRectDrawStart(e);
    } else if (tool === 'pencil') {
      // Start drawing path
      handlePencilDrawStart(e);
    }
  }
}, [tool, selection]);
```

## Debugging

### Console Logging

```typescript
// Log element state
console.log('Elements:', elements);

// Log selection
console.log('Selected:', selection.selectedIds);

// Log history state
console.log('Can undo:', history.canUndo, 'Can redo:', history.canRedo);

// Log zoom/pan
console.log('Zoom:', zoomPan.zoom, 'Position:', zoomPan.stagePosition);
```

### React DevTools

- Install React DevTools browser extension
- Inspect component hierarchy
- View props and state
- Track re-renders

### Konva DevTools

```typescript
// Get stage reference
const stage = stageRef.current;

// Inspect stage
console.log('Stage:', stage);
console.log('Children:', stage?.children);

// Get layer
const layer = stage?.children[0];
console.log('Layer:', layer);
console.log('Layer children:', layer?.children);

// Find node by ID
const node = stage?.findOne(`#${elementId}`);
console.log('Node:', node);

// Get pointer position
const pos = stage?.getPointerPosition();
console.log('Pointer:', pos);
```

### Performance Profiling

```typescript
// Time an operation
console.time('Operation');
// ... do something
console.timeEnd('Operation');

// Measure render count
const renderCount = useRef(0);
useEffect(() => {
  renderCount.current++;
  console.log('Render count:', renderCount.current);
});
```

### Common Issues

**Issue: Component not re-rendering**
- Check if state is actually changing (use React DevTools)
- Ensure callbacks are stable (wrapped in useCallback)
- Verify dependencies in useEffect/useMemo

**Issue: Elements not dragging**
- Check `draggable` prop is true
- Check `locked` is false
- Check event handlers are attached

**Issue: Selection not working**
- Verify `onSelect` callback is passed
- Check if event propagation is stopped elsewhere
- Ensure element IDs are unique

**Issue: History not working**
- Make sure `history.save()` is called after changes
- Check if elements/layers are actually changing
- Verify history is not being cleared unintentionally

## Environment Variables

```typescript
// Bootstrap configuration (set by WordPress)
window.__EDITOR_BOOTSTRAP__ = {
  initialDesign: string | EditorDesign | null,
  options: Partial<EditorOptions>,
  theme: 'kid' | 'adult',
};
```

## Build Output

```
dist/
├── editor.bundle.js          # Main bundle
└── editor.bundle.js.map      # Source map
```

External dependencies (loaded via CDN):
- React
- ReactDOM
- Konva

## Quick Tips

1. **Always use path aliases** - Import with `@hooks/*`, not `../../hooks/*`
2. **Wrap callbacks in useCallback** - Prevents unnecessary re-renders
3. **Save history after changes** - Call `history.save()` after modifying elements
4. **Use refs for transient state** - Don't use state for values that don't trigger renders
5. **Type everything** - TypeScript will catch bugs early
6. **Follow atomic design** - Keep components small and focused
7. **Hooks for logic, components for UI** - Keep them separate
8. **Test in both themes** - Kid and adult themes may render differently

---

For more details, see:
- [README.md](../README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture details
- [COMPONENT_USAGE.md](COMPONENT_USAGE.md) - Component examples
