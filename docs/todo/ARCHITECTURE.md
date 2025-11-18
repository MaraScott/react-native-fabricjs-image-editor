# Store Architecture Diagram

## Before Refactoring
```
┌─────────────────────────────────────┐
│         CanvasApp Store             │
├─────────────────────────────────────┤
│                                     │
│  settings (configuration)           │
│  view (monolithic)                  │
│    ├── active: "select" | "pan"     │
│    └── ready: { ... }               │
│                                     │
└─────────────────────────────────────┘
```

## After Refactoring
```
┌───────────────────────────────────────────────────────────┐
│                    CanvasApp Store                        │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  settings (configuration)                                 │
│    ├── logo                                               │
│    ├── poster                                             │
│    └── translations                                       │
│                                                           │
│  view (modular)                                           │
│    ├── activeTool: ToolName                               │
│    ├── ready: ToolReadyState                              │
│    │                                                      │
│    ├── select/                                            │
│    │   ├── active                                         │
│    │   ├── selectedIds[]                                  │
│    │   └── selectionRect                                  │
│    │                                                      │
│    ├── pan/                                               │
│    │   ├── active                                         │
│    │   ├── offset { x, y }                                │
│    │   ├── isPanning                                      │
│    │   └── spacePressedMode                               │
│    │                                                      │
│    ├── draw/                                              │
│    │   ├── active                                         │
│    │   ├── brushSize                                      │
│    │   ├── brushColor                                     │
│    │   ├── brushOpacity                                   │
│    │   ├── isDrawing                                      │
│    │   └── currentPath                                    │
│    │                                                      │
│    ├── rubber/                                            │
│    │   ├── active                                         │
│    │   ├── eraserSize                                     │
│    │   └── isErasing                                      │
│    │                                                      │
│    └── crop/                                              │
│        ├── active                                         │
│        ├── targetElementId                                │
│        └── cropArea { x, y, width, height }               │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## File Organization

```
store/CanvasApp/
│
├── index.tsx                     → Main store configuration
│   └── exports: CanvasApp, RootState, AppDispatch
│
├── configuration.tsx             → App settings reducer
│   └── exports: configuration
│
└── view/                         → Tool state management
    │
    ├── index.ts                  → Combined view reducer
    │   ├── imports: all tool reducers
    │   ├── exports: view, viewActions, types
    │   └── handles: tool switching & delegation
    │
    ├── types.ts                  → TypeScript interfaces
    │   └── exports: all tool state interfaces
    │
    ├── select.ts                 → Select tool
    │   ├── exports: selectReducer, selectActions
    │   └── handles: element selection
    │
    ├── pan.ts                    → Pan tool
    │   ├── exports: panReducer, panActions
    │   └── handles: canvas panning
    │
    ├── draw.ts                   → Draw tool
    │   ├── exports: drawReducer, drawActions
    │   └── handles: freehand drawing
    │
    ├── rubber.ts                 → Eraser tool
    │   ├── exports: rubberReducer, rubberActions
    │   └── handles: erasing
    │
    ├── crop.ts                   → Crop tool
    │   ├── exports: cropReducer, cropActions
    │   └── handles: image cropping
    │
    ├── README.md                 → Full documentation
    ├── EXAMPLES.tsx              → Usage examples
    └── REFACTORING_SUMMARY.md   → This refactoring summary
```

## Action Flow

```
Component
   │
   │ dispatch(viewActions.setActiveTool('draw'))
   │
   ↓
Store Middleware (thunk)
   │
   ↓
Combined Reducer
   │
   ├→ configuration reducer (unchanged)
   │
   └→ view reducer
       │
       ├→ setActiveTool action
       │   ├→ deactivate all tools
       │   ├→ set activeTool
       │   └→ activate selected tool
       │
       └→ Tool-specific actions
           │
           ├→ view/select/* → selectReducer
           ├→ view/pan/*    → panReducer
           ├→ view/draw/*   → drawReducer
           ├→ view/rubber/* → rubberReducer
           └→ view/crop/*   → cropReducer
```

## State Access Pattern

```
Component
   │
   │ useSelector((state: RootState) => state.view.draw.brushSize)
   │
   ↓
Redux Store
   │
   └→ state
       └→ view
           └→ draw
               └→ brushSize: 15
```

## Tool Lifecycle

```
Inactive → Activate → Active → Use Features → Deactivate → Inactive
   ↓          ↓          ↓           ↓              ↓          ↓
active:    active:    active:     state          active:   active:
false      true       true        changes        false     false
```

## Adding a New Tool (Example: Zoom)

1. **Create `zoom.ts`**
```typescript
export interface ZoomToolState {
    active: boolean;
    level: number;
    min: number;
    max: number;
}

export const zoomReducer = createReducer(initialState, ...);
export const zoomActions = { ... };
```

2. **Update `types.ts`**
```typescript
export type ToolName = 'select' | 'pan' | 'draw' | 'rubber' | 'crop' | 'zoom';

export interface ViewState {
    // ... existing tools
    zoom: ZoomToolState;
}
```

3. **Integrate in `index.ts`**
```typescript
import { zoomReducer, zoomActions } from './zoom';

const initialState: ViewState = {
    // ...
    zoom: { active: false, level: 1, min: 0.1, max: 10 },
};

// Add to viewReducer builder
builder.addCase('view/zoom/setLevel', (state, action) => {
    zoomReducer(state.zoom, action);
});

// Add to viewActions
export const viewActions = {
    // ...
    zoom: zoomActions,
};
```

## Key Benefits Visualized

```
┌──────────────────┐
│   Modularity     │  Each tool is self-contained
├──────────────────┤
│  select.ts       │  ✓ State
│  pan.ts          │  ✓ Reducer
│  draw.ts         │  ✓ Actions
│  rubber.ts       │  ✓ Types
│  crop.ts         │
└──────────────────┘

┌──────────────────┐
│   Type Safety    │  Full TypeScript support
├──────────────────┤
│  RootState       │  ✓ Autocomplete
│  ViewState       │  ✓ Type checking
│  ToolName        │  ✓ IntelliSense
│  *ToolState      │  ✓ Compile errors
└──────────────────┘

┌──────────────────┐
│   Scalability    │  Easy to extend
├──────────────────┤
│  + New Tool      │  1. Create file
│                  │  2. Add types
│                  │  3. Integrate
│                  │  4. Done!
└──────────────────┘

┌──────────────────┐
│  Maintainability │  Clear organization
├──────────────────┤
│  Change tool     │  → Edit one file
│  Add feature     │  → Update tool file
│  Debug issue     │  → Check tool reducer
│  Test tool       │  → Test in isolation
└──────────────────┘
```

## Migration Path

```
Old Code                          New Code
────────────────────────────────────────────────────────
dispatch({ type: 'view/pan' })    → dispatch(viewActions.setActiveTool('pan'))
dispatch({ type: 'view/select' }) → dispatch(viewActions.setActiveTool('select'))
                                    
                                    dispatch(viewActions.pan.setOffset({ x: 0, y: 0 }))
                                    dispatch(viewActions.draw.setBrushSize(10))
                                    dispatch(viewActions.select.clearSelection())
```

## State Structure Comparison

**Old (Flat):**
```javascript
{
  view: {
    active: "select",
    ready: { player: false, videos: false, ... }
  }
}
```

**New (Nested & Organized):**
```javascript
{
  view: {
    activeTool: "select",
    ready: { player: false, videos: false, ... },
    select: { active: true, selectedIds: [], selectionRect: null },
    pan: { active: false, offset: { x: 0, y: 0 }, ... },
    draw: { active: false, brushSize: 5, brushColor: "#000", ... },
    rubber: { active: false, eraserSize: 20, ... },
    crop: { active: false, targetElementId: null, ... }
  }
}
```

---

**Result:** A well-organized, type-safe, scalable store architecture! 🎉
