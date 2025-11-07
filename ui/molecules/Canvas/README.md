# Canvas Module

A modular, maintainable implementation of a multi-layer canvas editor with selection, transformation, and layer management capabilities.

## 🎯 Overview

This module provides a complete canvas editing solution built with React, Konva, and TypeScript. It features:

- ✅ Multi-layer canvas with z-index management
- ✅ Visual selection and transformation tools
- ✅ Drag-and-drop layer reordering
- ✅ Pan and zoom capabilities
- ✅ Touch and mouse support
- ✅ Keyboard shortcuts
- ✅ Extensible architecture

## 📚 Documentation

### Getting Started
- **[Quick Reference](./QUICK_REFERENCE.md)** - Import cheatsheet and common patterns
- **[Structure](./STRUCTURE.md)** - Visual diagrams and dependency graphs

### Architecture
- **[Architecture Guide](./ARCHITECTURE.md)** - Technical deep-dive
- **[Refactorization Guide](./REFACTORIZATION.md)** - Migration and benefits
- **[Summary](./SUMMARY.md)** - Complete overview

## 🗂️ Directory Structure

```
Canvas/
├── SimpleCanvas.tsx           # Main component
├── hooks/                     # Custom hooks for logic
│   ├── useSelectionControls   # Selection management
│   ├── useLayerPanel          # Layer panel state
│   ├── useKeyboardControls    # Keyboard events
│   ├── useOverlayTransform    # Overlay transforms
│   ├── usePanControls         # Pan gestures
│   └── useZoomControls        # Zoom calculations
├── components/                # UI components
│   ├── LayerPanel             # Layer management UI
│   ├── SelectionTransformer   # Selection tools
│   └── OverlaySelection       # Overlay rendering
├── utils/                     # Utilities
│   ├── bounds                 # Bounds calculations
│   ├── calculations           # Math helpers
│   └── constants              # Configuration
└── types/                     # TypeScript definitions
```

## 🚀 Quick Start

```typescript
import { SimpleCanvas } from './ui/molecules/Canvas';
import type { LayerControlHandlers } from './ui/molecules/Canvas/types';

// Define your layer controls
const layerControls: LayerControlHandlers = {
  layers: [...],
  selectedLayerIds: [...],
  selectLayer: (id, options) => [...],
  addLayer: () => {},
  // ... other handlers
};

// Use the canvas
<SimpleCanvas
  width={1024}
  height={1024}
  backgroundColor="#ffffff"
  zoom={0}
  layerControls={layerControls}
  selectModeActive={true}
  panModeActive={false}
/>
```

## 🎨 Key Features

### Layer Management
- Add, remove, duplicate layers
- Drag-and-drop reordering
- Visibility toggling
- Selection and multi-selection
- Z-index control (move to top/bottom)

### Selection & Transformation
- Click to select layers
- Visual selection bounds
- Resize handles
- Rotation control
- Multi-layer transforms
- Out-of-viewport selection support

### Pan & Zoom
- Mouse wheel zoom
- Keyboard zoom (+/-, Ctrl+0)
- Click-and-drag pan
- Space bar temporary pan
- Touch pinch-to-zoom
- Three-finger touch pan

### Keyboard Shortcuts
- `+` / `=` - Zoom in
- `-` / `_` - Zoom out
- `Ctrl+0` - Reset zoom
- `Space` - Temporary pan mode
- `Escape` - Close layer panel

## 🔧 API Reference

### SimpleCanvas Props

```typescript
interface SimpleCanvasProps {
  width?: number;                      // Canvas width (default: 1024)
  height?: number;                     // Canvas height (default: 1024)
  backgroundColor?: string;            // Canvas background
  containerBackground?: string;        // Container background
  zoom?: number;                       // Zoom level (-100 to 200)
  children?: ReactNode;                // Custom content
  onStageReady?: (stage: Konva.Stage) => void;
  onZoomChange?: (zoom: number) => void;
  panModeActive?: boolean;             // Enable pan mode
  layerControls?: LayerControlHandlers; // Layer management
  layersRevision?: number;             // Force update trigger
  selectModeActive?: boolean;          // Enable selection mode
}
```

### LayerControlHandlers Interface

```typescript
interface LayerControlHandlers {
  layers: LayerDescriptor[];
  selectedLayerIds: string[];
  primaryLayerId: string | null;
  selectLayer: (id: string, options?: LayerSelectionOptions) => string[];
  clearSelection?: () => void;
  addLayer: () => void;
  removeLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  copyLayer: (layerId: string) => Promise<string | void> | string | void;
  moveLayer: (layerId: string, direction: LayerMoveDirection) => void;
  toggleVisibility: (layerId: string) => void;
  reorderLayer: (sourceId: string, targetId: string, position: 'above' | 'below') => void;
  ensureAllVisible: () => void;
  updateLayerPosition: (layerId: string, position: { x: number; y: number }) => void;
  updateLayerScale?: (layerId: string, scale: ScaleVector) => void;
  updateLayerRotation?: (layerId: string, rotation: number) => void;
  updateLayerTransform?: (layerId: string, transform: Transform) => void;
}
```

## 🏗️ Architecture Highlights

### Modular Design
- **Separation of Concerns**: Logic in hooks, presentation in components
- **Single Responsibility**: Each module has one job
- **Composition**: Combine small pieces into larger features

### Type Safety
- Comprehensive TypeScript interfaces
- Strict null checks
- Generic type utilities

### Performance
- Memoized calculations with `useMemo`
- Stable callbacks with `useCallback`
- Efficient Konva rendering with `batchDraw`
- Request animation frame throttling

## 📖 Usage Examples

### Basic Canvas

```typescript
<SimpleCanvas
  width={1024}
  height={768}
  backgroundColor="#f0f0f0"
  zoom={0}
/>
```

### With Layer Controls

```typescript
const [layers, setLayers] = useState<LayerDescriptor[]>([]);
const [selectedIds, setSelectedIds] = useState<string[]>([]);

const layerControls: LayerControlHandlers = {
  layers,
  selectedLayerIds: selectedIds,
  selectLayer: (id, options) => {
    setSelectedIds(options?.mode === 'replace' ? [id] : [...selectedIds, id]);
    return [id];
  },
  addLayer: () => {
    setLayers([...layers, createNewLayer()]);
  },
  // ... implement other handlers
};

<SimpleCanvas
  layerControls={layerControls}
  selectModeActive={true}
/>
```

### With Zoom Control

```typescript
const [zoom, setZoom] = useState(0);

<SimpleCanvas
  zoom={zoom}
  onZoomChange={setZoom}
/>

<button onClick={() => setZoom(z => Math.min(z + 10, 200))}>
  Zoom In
</button>
```

## 🧪 Testing

```bash
# Run unit tests
npm test Canvas

# Run specific test file
npm test useSelectionControls.test.ts

# Run with coverage
npm test -- --coverage
```

## 🔍 Debugging

Enable debug logging:

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  console.log('Selection bounds:', selectedLayerBounds);
  console.log('Zoom:', zoom);
  console.log('Scale:', scale);
}
```

## 🚧 Common Issues

### Transformer Not Showing
- Ensure `selectModeActive={true}`
- Check that `selectedLayerIds` is not empty
- Verify `layerControls` is properly connected

### Bounds Not Updating
- Call `refreshBoundsFromSelection()` manually
- Ensure `layersRevision` increments on layer changes
- Check that layer nodes are properly registered

### Performance Issues
- Reduce number of layers
- Implement virtual scrolling for layer panel
- Use `React.memo` for layer components
- Profile with React DevTools

## 📦 Dependencies

- `react` ^18.0.0
- `react-konva` ^18.0.0
- `konva` ^9.0.0
- TypeScript ^5.0.0

## 🤝 Contributing

1. Follow the modular architecture
2. Write tests for new features
3. Update documentation
4. Use TypeScript strictly
5. Follow naming conventions

## 📄 License

See project root for license information.

## 🔗 Related

- [Stage (Atom)](../../atoms/Canvas/Stage.tsx)
- [Layer (Atom)](../../atoms/Canvas/Layer.tsx)
- [Konva Documentation](https://konvajs.org/docs/)

---

**Version:** 2.0.0 (Refactored)  
**Last Updated:** 2025-01-07  
**Maintainer:** Development Team
