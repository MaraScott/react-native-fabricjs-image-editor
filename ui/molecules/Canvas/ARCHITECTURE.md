# Canvas Architecture Overview

## Design Pattern: Atomic Design

This codebase follows **Atomic Design** principles for UI composition:

### Atoms (`ui/atoms/Canvas/`)
Basic building blocks - single-purpose, reusable components:
- **IconButton** - Generic button with icon/text, variants (primary/secondary/danger), sizes (small/medium/large)
- **FeedbackMessage** - Temporary notification with variants (success/error/info)
- **LayerToggleButton** - Specialized button to show/hide layer panel

### Molecules (`ui/molecules/Canvas/components/`)
Simple UI combinations of atoms:
- **LayerItem** - Single layer display (visibility button + name + action buttons)
- **LayerList** - Scrollable list of LayerItems with drag-drop reordering
- **SelectionTransformer** - Selection boundary with transform handles
- **OverlaySelection** - SVG overlay for selection visualization

### Organisms (`ui/molecules/Canvas/components/`)
Complex UI sections composed of molecules and atoms:
- **LayerPanel** - Complete layer management (toggle button + header + add button + feedback + layer list)

## Component Hierarchy

```
SimpleCanvas (Main Component)
├── Container Div
│   ├── LayerPanel Organism
│   │   ├── LayerToggleButton (Atom)
│   │   └── Panel Content
│   │       ├── Header with close button
│   │       ├── IconButton "Add Layer" (Atom)
│   │       ├── FeedbackMessage (Atom, conditional)
│   │       └── LayerList (Molecule)
│   │           └── LayerItem[] (Molecules)
│   │               ├── IconButton (visibility toggle)
│   │               ├── Name button
│   │               └── Action IconButtons (copy, duplicate, move, delete)
│   │
│   ├── Stage (Konva)
│   │   ├── Render Layers
│   │   │   └── Layer Components (from layerControls)
│   │   │       └── Custom content via render()
│   │   │
│   │   └── Selection Layer (conditional)
│   │       ├── SelectionTransformer Molecule
│   │       │   ├── Proxy Rect (invisible, draggable)
│   │       │   └── Transformer (handles, rotation)
│   │       └── Visual feedback
│   │
│   └── OverlaySelection Molecule (conditional)
│       └── HTML overlay for out-of-bounds selections
```

## Hook Dependencies

```
SimpleCanvas
├── useZoomControls
│   ├── Calculates scale from zoom
│   ├── Handles resize events
│   └── Returns: scale, applyZoomDelta, updateZoom
│
├── usePanControls
│   ├── Pointer pan (mouse/pen)
│   ├── Touch pan (1 or 3 fingers)
│   └── Returns: panOffset, handlers, state
│
├── useKeyboardControls
│   ├── Space bar for pan
│   ├── +/- for zoom
│   ├── Ctrl+0 for reset
│   └── Returns: spacePressed
│
├── useSelectionControls
│   ├── Bounds calculation
│   ├── Transform state management
│   ├── Transformer sync
│   └── Returns: bounds, refs, handlers
│
├── useLayerPanel
│   ├── Panel open/close state
│   ├── Drag-and-drop state
│   ├── Copy feedback
│   └── Returns: state, refs, handlers
│
└── useOverlayTransform
    ├── Overlay drag operations
    ├── Overlay rotation
    └── Returns: handlers, overlayBox
```

## Data Flow

```
User Interaction
    ↓
Event Handlers (from hooks)
    ↓
State Updates (via setState)
    ↓
Re-render with new state
    ↓
useEffect hooks trigger
    ↓
Side effects (bounds calculation, stage updates)
    ↓
LayerControls callbacks (persist changes)
```

## Key Patterns

### 1. **Separation of Concerns**
- **Hooks**: Business logic and state management
- **Components**: Presentation and UI structure
- **Utils**: Pure functions and calculations
- **Types**: Type definitions and interfaces

### 2. **Composition over Inheritance**
- Small, focused hooks combined in the main component
- Components accept props and delegate logic to hooks
- Utility functions are pure and composable

### 3. **Single Responsibility Principle**
- Each hook manages one aspect of functionality
- Each component renders one UI concern
- Each utility file contains related functions

### 4. **Dependency Injection**
- Hooks receive configuration via props
- Components receive handlers as props
- No hidden dependencies or global state

### 5. **Controlled Components**
- State managed in parent (SimpleCanvas)
- Child components are presentational
- Callbacks flow down, state flows up

## State Management

### Local State (useState)
- `isLayerPanelOpen`: UI visibility
- `copyFeedback`: Notification message
- `draggingLayerId`: Drag operation tracking
- `selectedLayerBounds`: Computed selection area
- `overlaySelectionBox`: Out-of-bounds selection

### Ref State (useRef)
- `stageRef`: Konva stage instance
- `containerRef`: Container DOM element
- `layerNodeRefs`: Map of layer ID to Konva.Layer
- `selectionTransformerRef`: Transformer instance
- `selectionProxyRef`: Proxy rect instance
- Various operation state refs (drag, pan, etc.)

### Derived State (useMemo)
- `selectedLayerSet`: Set for O(1) lookup
- `renderableLayers`: Reversed layer order
- Transform calculations (scale, positions)

### Parent-Controlled State
- `zoom`: Zoom level (can be controlled externally)
- `layerControls`: Layer management interface
- `selectModeActive`: Selection mode toggle

## Event Flow Examples

### Selection Flow
```
1. User clicks layer in panel
    ↓
2. LayerPanel onClick handler
    ↓
3. layerControls.selectLayer(id)
    ↓
4. pendingSelectionRef updated
    ↓
5. Parent state updated (via layerControls)
    ↓
6. Component re-renders with new selectedLayerIds
    ↓
7. useSelectionControls detects change
    ↓
8. updateBoundsFromLayerIds called
    ↓
9. selectedLayerBounds updated
    ↓
10. syncTransformerToSelection called
    ↓
11. Transformer updated to match bounds
```

### Transform Flow
```
1. User drags transformer handle
    ↓
2. handleTransformerTransformStart
    ↓
3. captureSelectionTransformState
    - Saves initial transform of all selected layers
    ↓
4. handleTransformerTransform (during drag)
    ↓
5. applySelectionTransformDelta
    - Calculates delta from initial state
    - Applies to all selected layers
    ↓
6. scheduleBoundsRefresh
    - Updates visual bounds
    ↓
7. handleTransformerTransformEnd
    ↓
8. finalizeSelectionTransform
    - Persists transforms via layerControls
    - Clears transform state
```

### Zoom Flow
```
1. User scrolls wheel
    ↓
2. handleWheel (in SimpleCanvas)
    ↓
3. applyZoomDelta (from useZoomControls)
    ↓
4. updateZoom with delta
    ↓
5. setInternalZoom (state update)
    ↓
6. useLayoutEffect in useZoomControls
    ↓
7. Calculate new scale from zoom
    ↓
8. setScale (state update)
    ↓
9. useEffect in SimpleCanvas
    ↓
10. stage.scale() updated
    ↓
11. stage.batchDraw()
```

## Performance Considerations

### Optimization Techniques Used
1. **useCallback** - Memoize event handlers
2. **useMemo** - Memoize expensive calculations
3. **useRef** - Avoid re-renders for operation state
4. **batchDraw** - Minimize Konva redraws
5. **requestAnimationFrame** - Throttle bounds updates
6. **Early returns** - Skip unnecessary work

### Potential Bottlenecks
1. Bounds calculation for many layers
2. Transform delta application (N layers × M transforms)
3. Stage redraws on every interaction
4. Layer panel re-renders with many items

### Future Optimizations
1. Virtual scrolling for layer panel
2. Web Workers for heavy calculations
3. Canvas layer caching
4. Throttled/debounced updates
5. Intersection observer for visibility

## Testing Strategy

### Unit Tests
- **Hooks**: Test state transitions and calculations
- **Utils**: Test pure functions with various inputs
- **Components**: Test rendering and prop handling

### Integration Tests
- Test hook combinations
- Test component interactions
- Test event flows

### E2E Tests
- Test complete user workflows
- Test cross-browser compatibility
- Test touch/mouse interactions

## Documentation Standards

Each module should include:
1. **Purpose statement** - What does it do?
2. **Responsibilities** - What is it responsible for?
3. **Dependencies** - What does it depend on?
4. **API documentation** - Props, return values, types
5. **Usage examples** - How to use it
6. **Edge cases** - Known limitations

## Conclusion

This architecture provides a solid foundation for a complex canvas editor while maintaining clarity, testability, and extensibility. The modular design allows each piece to evolve independently while maintaining clear contracts between modules.
