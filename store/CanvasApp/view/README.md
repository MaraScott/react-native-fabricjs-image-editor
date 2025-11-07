# Store Structure Documentation

## Overview

The Redux store is organized following a modular pattern where each tool has its own state management file. This makes the codebase more maintainable and scalable.

## Directory Structure

```
store/
└── CanvasApp/
    ├── index.tsx                 # Main store configuration
    ├── configuration.tsx         # App configuration state
    └── view/                     # View/Tool state management
        ├── index.ts              # Combined view reducer
        ├── types.ts              # TypeScript types for all tools
        ├── select.ts             # Select tool state & actions
        ├── pan.ts                # Pan tool state & actions
        ├── draw.ts               # Draw tool state & actions
        ├── rubber.ts             # Eraser tool state & actions
        └── crop.ts               # Crop tool state & actions
```

## Tool State Files

Each tool has its own file with:
- **State interface**: Defines the shape of the tool's state
- **Initial state**: Default values when the tool is inactive
- **Reducer**: Handles state updates for that tool
- **Actions**: Action creators for dispatching updates

### Example: Pan Tool (`pan.ts`)

```typescript
export interface PanToolState {
    active: boolean;
    offset: { x: number; y: number };
    isPanning: boolean;
    spacePressedMode: boolean;
}

export const panActions = {
    activate: () => ({ type: 'view/pan/activate' }),
    setOffset: (offset) => ({ type: 'view/pan/setOffset', payload: offset }),
    // ... more actions
};
```

## Usage Examples

### Dispatching Actions

```typescript
import { useDispatch } from 'react-redux';
import { viewActions } from '@store/CanvasApp/view';

function MyComponent() {
    const dispatch = useDispatch();
    
    // Switch to pan tool
    dispatch(viewActions.setActiveTool('pan'));
    
    // Update pan offset
    dispatch(viewActions.pan.setOffset({ x: 100, y: 50 }));
    
    // Start drawing
    dispatch(viewActions.draw.activate());
    dispatch(viewActions.draw.setBrushSize(10));
}
```

### Selecting State

```typescript
import { useSelector } from 'react-redux';
import type { RootState } from '@store/CanvasApp';

function MyComponent() {
    // Select active tool
    const activeTool = useSelector((state: RootState) => state.view.activeTool);
    
    // Select pan state
    const panState = useSelector((state: RootState) => state.view.pan);
    
    // Select specific values
    const brushSize = useSelector((state: RootState) => state.view.draw.brushSize);
    const isDrawing = useSelector((state: RootState) => state.view.draw.isDrawing);
}
```

## Available Tools

### 1. Select Tool (`select.ts`)
Manages element selection on the canvas.

**State:**
- `active`: Whether select mode is active
- `selectedIds`: Array of selected element IDs
- `selectionRect`: Selection rectangle bounds

**Actions:**
- `activate()`: Enable select tool
- `setSelectedIds(ids)`: Set selected elements
- `clearSelection()`: Clear all selections

### 2. Pan Tool (`pan.ts`)
Manages canvas panning/scrolling.

**State:**
- `active`: Whether pan mode is active
- `offset`: Current pan offset `{ x, y }`
- `isPanning`: Whether currently panning
- `spacePressedMode`: Temporary pan mode via spacebar

**Actions:**
- `activate()`: Enable pan tool
- `setOffset(offset)`: Set absolute pan position
- `updateOffset(delta)`: Update pan by delta
- `startPanning()`: Begin pan gesture

### 3. Draw Tool (`draw.ts`)
Manages freehand drawing on the canvas.

**State:**
- `active`: Whether draw mode is active
- `brushSize`: Brush size (1-100)
- `brushColor`: Brush color (hex)
- `brushOpacity`: Opacity (0-1)
- `isDrawing`: Whether currently drawing
- `currentPath`: SVG path data

**Actions:**
- `activate()`: Enable draw tool
- `setBrushSize(size)`: Set brush size
- `setBrushColor(color)`: Set brush color
- `startDrawing(pathId)`: Begin drawing stroke
- `finishDrawing()`: Complete drawing stroke

### 4. Rubber Tool (`rubber.ts`)
Manages eraser functionality.

**State:**
- `active`: Whether eraser mode is active
- `eraserSize`: Eraser size (1-200)
- `isErasing`: Whether currently erasing

**Actions:**
- `activate()`: Enable eraser tool
- `setEraserSize(size)`: Set eraser size
- `startErasing()`: Begin erasing

### 5. Crop Tool (`crop.ts`)
Manages image cropping.

**State:**
- `active`: Whether crop mode is active
- `targetElementId`: ID of element being cropped
- `cropArea`: Crop rectangle `{ x, y, width, height }`

**Actions:**
- `activate()`: Enable crop tool
- `setTargetElement(id)`: Set element to crop
- `setCropArea(area)`: Set crop bounds
- `applyCrop()`: Apply the crop
- `cancelCrop()`: Cancel cropping

## Tool Switching

When switching tools, the `setActiveTool` action automatically:
1. Deactivates all other tools
2. Activates the selected tool
3. Updates the `activeTool` property

```typescript
// This will deactivate select and activate pan
dispatch(viewActions.setActiveTool('pan'));
```

## Backward Compatibility

Legacy action types are still supported:
- `view/pan` → Switches to pan tool
- `view/select` → Switches to select tool
- `view/tool` → Marks a tool as ready

## Adding New Tools

To add a new tool:

1. **Create tool file** (`store/CanvasApp/view/newtool.ts`):
```typescript
export interface NewToolState {
    active: boolean;
    // ... tool-specific state
}

export const newToolReducer = createReducer(initialState, (builder) => {
    builder.addCase('view/newtool/action', (state, action) => {
        // Handle action
    });
});

export const newToolActions = {
    activate: () => ({ type: 'view/newtool/activate' }),
    // ... more actions
};
```

2. **Add to types** (`types.ts`):
```typescript
export type ToolName = 'select' | 'pan' | 'draw' | 'rubber' | 'crop' | 'newtool';

export interface ViewState {
    // ... existing tools
    newtool: NewToolState;
}
```

3. **Integrate in index** (`index.ts`):
```typescript
import { newToolReducer, newToolActions } from './newtool';

// Add to initialState
const initialState: ViewState = {
    // ...
    newtool: { active: false, /* ... */ },
};

// Add cases to viewReducer builder
builder.addCase('view/newtool/action', (state, action) => {
    newToolReducer(state.newtool, action);
});

// Add to viewActions export
export const viewActions = {
    // ...
    newtool: newToolActions,
};
```

## Benefits of This Structure

1. **Modularity**: Each tool is self-contained
2. **Type Safety**: Full TypeScript support
3. **Scalability**: Easy to add new tools
4. **Maintainability**: Clear separation of concerns
5. **Testability**: Each tool can be tested independently
6. **Code Organization**: Related code stays together

## Migration from Old Structure

The old `view.tsx` has been backed up as `view.tsx.backup`. The new structure maintains backward compatibility with existing code using legacy action types.
