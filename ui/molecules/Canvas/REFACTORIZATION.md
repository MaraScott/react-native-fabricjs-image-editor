# SimpleCanvas Component Refactorization

## Overview
The SimpleCanvas component has been refactored to follow a more modular architecture, similar to React best practices and atomic design principles. This refactorization breaks down a large monolithic component (~2245 lines) into smaller, focused, reusable modules.

## New Structure

### 📁 Directory Organization
```
Canvas/
├── components/              # UI Components
│   ├── index.ts
│   ├── LayerPanel.tsx      # Layer management UI
│   ├── SelectionTransformer.tsx  # Konva transformer wrapper
│   └── OverlaySelection.tsx      # External selection overlay
├── hooks/                   # Custom hooks for logic
│   ├── index.ts
│   ├── useSelectionControls.ts   # Selection state management
│   ├── useLayerPanel.ts          # Layer panel state
│   ├── useKeyboardControls.ts    # Keyboard event handling
│   ├── useOverlayTransform.ts    # Overlay drag/rotate logic
│   ├── usePanControls.ts         # Pan gesture handling
│   └── useZoomControls.ts        # Zoom calculations
├── utils/                   # Utility functions
│   ├── index.ts
│   ├── bounds.ts           # Bounds calculations
│   ├── calculations.ts     # Mathematical helpers
│   └── constants.ts        # Configuration constants
├── types/                   # TypeScript definitions
│   ├── index.ts
│   └── canvas.types.ts
├── index.ts
└── SimpleCanvas.tsx        # Main component (refactored)
```

## Created Modules

### 1. Custom Hooks

#### `useSelectionControls`
**Purpose:** Manages all selection-related logic including bounds calculation, transformer state, and transform operations.

**Responsibilities:**
- Track selected layer bounds
- Manage transformer and proxy references
- Handle transform start/move/end events
- Calculate and apply transform deltas
- Sync transformer with selection state

**Key Features:**
- Automatic bounds recalculation on layer changes
- Transform state capture and replay
- Rotation persistence across selections
- Retry logic for node discovery

#### `useLayerPanel`
**Purpose:** Manages layer panel UI state and interactions.

**Responsibilities:**
- Panel open/closed state
- Copy feedback notifications
- Drag-and-drop state tracking
- Outside click detection
- Keyboard shortcuts (Escape to close)

#### `useKeyboardControls`
**Purpose:** Handles keyboard events for canvas interactions.

**Responsibilities:**
- Space bar pan activation
- Zoom in/out (+/- keys)
- Reset zoom (Ctrl/Cmd + 0)
- Prevent events in input fields

#### `useOverlayTransform`
**Purpose:** Manages transformation of selections that extend beyond the canvas viewport.

**Responsibilities:**
- Overlay drag operations
- Overlay rotation operations
- Coordinate conversion (screen to stage space)
- Position persistence

#### `usePanControls` (already existed)
**Purpose:** Handles pan gestures via pointer and touch events.

#### `useZoomControls` (already existed)
**Purpose:** Manages zoom calculations and scale updates.

### 2. Components

#### `LayerPanel`
**Purpose:** Complete layer management UI with drag-and-drop reordering.

**Features:**
- Layer list with visibility toggles
- Selection indicators
- Drag-and-drop reordering with visual feedback
- Layer actions (copy, duplicate, move, remove)
- Copy feedback notifications
- Primary layer indicators

**Props:** Accepts all necessary state and handlers from hooks

#### `SelectionTransformer`
**Purpose:** Wraps Konva Transformer and proxy Rect for selection manipulation.

**Features:**
- Scale-aware transformer sizing
- Custom anchor styling
- Transform event handling
- Visibility management

### 3. Utilities

#### `bounds.ts`
- `isFiniteNumber`: Validates numeric values
- `normaliseBounds`: Sanitizes bounds objects
- `computeNodeBounds`: Calculates node bounds in stage space
- `areBoundsEqual`: Compares bounds for equality
- `unifyBounds`: Merges multiple bounds into one

#### `calculations.ts`
- `clampZoomValue`: Restricts zoom to valid range
- `calculateScaleFromZoom`: Converts zoom to scale factor
- `getTouchDistance`: Calculates pinch gesture distance
- `getTouchCenter`: Finds center point of touch

#### `constants.ts`
- Centralized configuration values
- Zoom limits and steps
- Touch sensitivity
- Retry limits

## Benefits of This Refactorization

### 1. **Improved Maintainability**
- Each module has a single, well-defined responsibility
- Easier to locate and fix bugs
- Changes are isolated to specific modules

### 2. **Enhanced Testability**
- Hooks can be tested independently
- Components can be tested in isolation
- Utility functions are pure and easily testable

### 3. **Better Reusability**
- Hooks can be reused in other canvas components
- Utility functions are general-purpose
- Components follow composition patterns

### 4. **Clearer Code Organization**
- Logic is separated from presentation
- Related functionality is grouped together
- Consistent file naming and structure

### 5. **Easier Onboarding**
- New developers can understand one module at a time
- Clear separation of concerns
- Self-documenting structure

### 6. **Type Safety**
- Centralized type definitions
- Proper interface boundaries
- Better IDE support

## Usage Example

The refactored SimpleCanvas component now uses the extracted hooks and components:

```tsx
export const SimpleCanvas = (props: SimpleCanvasProps) => {
  // Core refs
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layerNodeRefs = useRef<Map<string, Konva.Layer>>(new Map());

  // Zoom controls
  const { scale, internalZoom, updateZoom, applyZoomDelta } = useZoomControls({
    width: props.width,
    height: props.height,
    initialZoom: props.zoom,
    containerRef,
    onZoomChange: props.onZoomChange,
  });

  // Pan controls
  const panControls = usePanControls({
    panModeActive: props.panModeActive,
    spacePressed,
    selectModeActive: props.selectModeActive,
  });

  // Selection controls
  const selectionControls = useSelectionControls({
    selectModeActive: props.selectModeActive,
    layerControls: props.layerControls,
    stageRef,
    layerNodeRefs,
    layersRevision: props.layersRevision,
    scale,
  });

  // Layer panel
  const layerPanel = useLayerPanel({
    layerControls: props.layerControls,
  });

  // Keyboard controls
  const { spacePressed } = useKeyboardControls({
    applyZoomDelta,
    updateZoom,
  });

  // Overlay transform
  const overlayTransform = useOverlayTransform({
    overlaySelectionBox: computedOverlayBox,
    selectModeActive: props.selectModeActive,
    layerControls: props.layerControls,
    layerNodeRefs,
    scale,
    stageRef,
    ...selectionControls,
  });

  // Render...
};
```

## Migration Guide

To use the refactored components:

1. **Import from hooks:**
   ```tsx
   import {
     useSelectionControls,
     useLayerPanel,
     useKeyboardControls,
     // etc.
   } from './hooks';
   ```

2. **Import components:**
   ```tsx
   import { LayerPanel, SelectionTransformer } from './components';
   ```

3. **Import utilities:**
   ```tsx
   import { clampZoomValue, unifyBounds } from './utils';
   ```

4. **Use in your component:**
   ```tsx
   const MyCanvas = () => {
     const selectionControls = useSelectionControls({ /* props */ });
     // Use selectionControls methods and state
   };
   ```

## Next Steps

### Potential Future Improvements
1. **Extract wheel/touch event handlers** into dedicated hooks
2. **Create useStageEvents hook** for stage interaction handling
3. **Split LayerPanel** into smaller sub-components (LayerItem, LayerActions)
4. **Add unit tests** for hooks and utilities
5. **Create Storybook stories** for components
6. **Add performance monitoring** for bounds calculations
7. **Implement virtual scrolling** for layer panel with many layers

## Conclusion

This refactorization follows React and Atomic Design best practices, making the codebase more maintainable, testable, and scalable. Each module has a clear responsibility and can be developed, tested, and debugged independently.
