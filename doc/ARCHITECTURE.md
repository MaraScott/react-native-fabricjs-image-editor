# Architecture Overview

This document explains the architecture, design patterns, and data flow of the Konva Image Editor.

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Component Hierarchy](#component-hierarchy)
- [Data Flow](#data-flow)
- [Separation of Concerns](#separation-of-concerns)
- [State Management](#state-management)
- [Rendering Pipeline](#rendering-pipeline)
- [Event System](#event-system)

## High-Level Architecture

The editor is built with three distinct layers:

```
┌──────────────────────────────────────────────────────────┐
│                        EditorApp                         │
│                    (Orchestrator)                        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                    HOOKS LAYER                     │  │
│  │              (Business Logic)                      │  │
│  │   • State management                               │  │
│  │   • Event handlers                                 │  │
│  │   • Side effects                                   │  │
│  │   • API integration                                │  │
│  └────────────────────────────────────────────────────┘  │
│                           ↓                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │               PRESENTATION LAYER                   │  │
│  │                                                    │  │
│  │  ┌────────────────────┐  ┌──────────────────────┐  │  │
│  │  │   TAMAGUI UI       │  │   KONVA CANVAS       │  │  │
│  │  │  (Pure Display)    │  │  (Pure Rendering)    │  │  │
│  │  │  • Toolbars        │  │  • Stage             │  │  │
│  │  │  • Panels          │  │  • Layers            │  │  │
│  │  │  • Controls        │  │  • Shapes/Text/Image │  │  │
│  │  └────────────────────┘  └──────────────────────┘  │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

1. **EditorApp (Orchestrator)**
   - Coordinates all hooks
   - Manages global state
   - Routes events between UI and business logic
   - Handles application lifecycle

2. **Hooks Layer (Business Logic)**
   - Contains all stateful logic
   - Implements features (zoom, selection, history)
   - Manages side effects (API calls, localStorage)
   - Provides stable callbacks to components

3. **Presentation Layer (UI)**
   - Renders based on props
   - Emits events through callbacks
   - No business logic or state management
   - Two sub-systems: Tamagui (controls) and Konva (canvas)

## Component Hierarchy

### Atomic Design Structure

```
Pages (Full Applications)
  └─ EditorApp
      │
      ├─ Templates (Page Layouts)
      │   └─ MediaPickerDialog
      │
      ├─ Organisms (Feature Sections)
      │   ├─ PrimaryToolbar
      │   ├─ LayersPanel
      │   ├─ EditorStageViewport
      │   ├─ ThemeSwitcher
      │   ├─ ExportActions
      │   ├─ HistoryActions
      │   └─ EditorCanvas (Konva)
      │       ├─ Stage
      │       └─ Layer
      │           └─ [Elements]
      │
      ├─ Molecules (Composite Components)
      │   ├─ ZoomControls
      │   ├─ DrawSettings
      │   └─ LayerPreview
      │
      └─ Atoms (Basic Building Blocks)
          ├─ Icons
          │   ├─ EnhancedIcons
          │   └─ MaterialCommunityIcons
          └─ Konva Nodes
              ├─ RectNode
              ├─ CircleNode
              ├─ EllipseNode
              ├─ TriangleNode
              ├─ LineNode
              ├─ PathNode
              ├─ PencilNode
              ├─ TextNode
              ├─ ImageNode
              ├─ GuideNode
              └─ FrameNode
```

### File Locations

```
ui/
├── atoms/
│   ├── icons/           # Icon components
│   └── konva/nodes/     # Konva shape wrappers
├── molecules/
│   ├── controls/        # Composite controls
│   └── editor/          # Editor-specific composites
├── organisms/
│   ├── canvas/          # EditorCanvas component
│   └── editor/          # Editor feature sections
├── templates/           # Page layouts
└── pages/
    └── editor/          # EditorApp
```

## Data Flow

### User Action → State Update → Re-render

```
┌──────────────┐
│    User      │
│   Action     │  (e.g., click to add rectangle)
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Component Event Handler             │
│  (onClick, onMouseDown, onDrag)      │
│  Button.onClick = {onAddRect}        │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Hook Action (from EditorApp)        │
│  const onAddRect = () => {           │
│    const rect = createRect(...);     │
│    setElements([...elements, rect]); │
│    saveHistory();                    │
│  }                                   │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  State Update                        │
│  useState/useCallback trigger        │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Component Re-render                 │
│  Components receive new props        │
│  Konva nodes update                  │
└──────────────────────────────────────┘
```

### Example: Adding a Rectangle

1. User clicks "Add Rectangle" button
2. `PrimaryToolbar` calls `onAddRect` callback (passed from EditorApp)
3. EditorApp's `onAddRect`:
   - Calls `createRect()` utility to create element
   - Updates `elements` state
   - Calls `history.save()` to record action
4. React re-renders with new elements
5. `EditorCanvas` receives updated elements prop
6. `RectNode` components render in Konva Layer

## Separation of Concerns

### HOOKS (Logic Layer)

**Location**: `hooks/`

**Responsibility**:
- Manage state
- Implement business logic
- Handle side effects
- Provide stable callbacks

**Characteristics**:
- Pure TypeScript/React hooks
- No JSX (except in special cases)
- Export functions and state
- Use `useCallback`, `useMemo` for stability

**Example** - `useSelection.ts`:

```typescript
export function useSelection({ onSelectionChange }: Options): Return {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);

  const selectElement = useCallback((id: string, mode = 'single') => {
    if (mode === 'single') {
      setSelectedIds([id]);
    } else if (mode === 'toggle') {
      setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
    onSelectionChange?.(selectedIds);
  }, [selectedIds, onSelectionChange]);

  return {
    selectedIds,
    selectionRect,
    selectElement,
    // ... more functions
  };
}
```

### CANVAS (Konva Rendering Layer)

**Location**: `ui/atoms/konva/nodes/`, `ui/organisms/canvas/`

**Responsibility**:
- Render shapes on canvas
- Handle Konva-specific events
- Transform data to visual representation

**Characteristics**:
- Use react-konva components
- Receive props, emit callbacks
- No business logic
- Map editor types to Konva types

**Example** - `RectNode.tsx`:

```typescript
interface RectNodeProps {
  element: RectElement;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onDragEnd?: (id: string, position: Vector2d) => void;
  onTransform?: (id: string, attrs: Partial<RectElement>) => void;
}

export function RectNode({
  element,
  selected,
  onSelect,
  onDragEnd,
  onTransform
}: RectNodeProps) {
  const shapeRef = useRef<Konva.Rect>(null);

  return (
    <>
      <Rect
        ref={shapeRef}
        id={element.id}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        fill={element.fill}
        stroke={element.stroke}
        strokeWidth={element.strokeWidth}
        cornerRadius={element.cornerRadius}
        rotation={element.rotation}
        opacity={element.opacity}
        draggable={element.draggable && !element.locked}
        visible={element.visible}
        onClick={() => onSelect?.(element.id)}
        onDragEnd={(e) => {
          const node = e.target;
          onDragEnd?.(element.id, { x: node.x(), y: node.y() });
        }}
      />
      {selected && (
        <Transformer
          ref={transformerRef}
          nodes={[shapeRef.current]}
          onTransformEnd={() => {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            node.scaleX(1);
            node.scaleY(1);

            onTransform?.(element.id, {
              x: node.x(),
              y: node.y(),
              width: Math.max(node.width() * scaleX, 5),
              height: Math.max(node.height() * scaleY, 5),
              rotation: node.rotation(),
            });
          }}
        />
      )}
    </>
  );
}
```

### UI (Tamagui Display Layer)

**Location**: `ui/molecules/`, `ui/organisms/editor/`

**Responsibility**:
- Render controls and panels
- Provide user interaction surfaces
- Display information

**Characteristics**:
- Use Tamagui components
- Receive state as props
- Emit events through callbacks
- No state management (except local UI state)

**Example** - `ZoomControls.tsx`:

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

export function ZoomControls({
  zoom,
  minZoom,
  maxZoom,
  fitScale,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onZoomToActual,
}: ZoomControlsProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <XStack gap="$2">
      <Button
        size="$2"
        disabled={zoom <= minZoom}
        onPress={onZoomOut}
      >
        -
      </Button>
      <Text>{zoomPercent}%</Text>
      <Button
        size="$2"
        disabled={zoom >= maxZoom}
        onPress={onZoomIn}
      >
        +
      </Button>
      <Button size="$2" onPress={onZoomToFit}>
        Fit
      </Button>
      <Button size="$2" onPress={onZoomToActual}>
        100%
      </Button>
    </XStack>
  );
}
```

## State Management

### Centralized State in EditorApp

All state lives in `EditorApp.tsx`:

```typescript
function EditorApp() {
  // Core document state
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [layers, setLayers] = useState<EditorLayer[]>([]);
  const [options, setOptions] = useState<EditorOptions>(DEFAULT_OPTIONS);

  // Feature hooks
  const history = useHistory({ elements, layers });
  const zoomPan = useZoomPan({
    initialZoom: options.zoom,
    maxZoom: MAX_ZOOM,
    stageSize: { width: options.width, height: options.height },
    canvasRef,
  });
  const selection = useSelection({
    onSelectionChange: (ids) => {
      // React to selection changes
    },
  });
  const wpIntegration = useWordPressIntegration({
    config: resolveInitialWpConfig(),
  });

  // Tool state
  const [tool, setTool] = useState<Tool>('select');
  const [drawSettings, setDrawSettings] = useState({ color: '#000', width: 5 });

  // Derived state
  const selectedElements = elements.filter(e =>
    selection.selectedIds.includes(e.id)
  );

  // Actions
  const onAddRect = useCallback(() => {
    const rect = createRect({
      x: options.width / 2,
      y: options.height / 2,
      width: 100,
      height: 100,
      fill: drawSettings.color,
    });
    setElements(prev => [...prev, rect]);
    history.save();
  }, [options, drawSettings, history]);

  // ... more actions

  return (
    <>
      <PrimaryToolbar
        tool={tool}
        onToolChange={setTool}
        onAddRect={onAddRect}
        // ... more callbacks
      />
      <EditorStageViewport
        elements={elements}
        layers={layers}
        selectedIds={selection.selectedIds}
        zoom={zoomPan.zoom}
        stagePosition={zoomPan.stagePosition}
        onElementSelect={selection.selectElement}
        onElementDragEnd={onElementDragEnd}
        // ... more props
      />
    </>
  );
}
```

### State Categories

1. **Document State**: `elements`, `layers`, `options`
2. **View State**: `zoom`, `stagePosition`, `tool`, `theme`
3. **UI State**: `selectedIds`, `selectionRect`, `isPanning`
4. **Transient State**: `drawingState`, `panState`, `inertiaHandle`

### History Management

The `useHistory` hook provides undo/redo:

```typescript
const history = useHistory({ elements, layers });

// Save current state to history
history.save();

// Undo/redo
history.undo(); // Returns previous { elements, layers }
history.redo(); // Returns next { elements, layers }

// State
history.canUndo; // boolean
history.canRedo; // boolean
```

## Rendering Pipeline

### React → Konva Rendering

```
EditorApp State
      ↓
EditorCanvas Props
      ↓
Konva Stage
      ↓
Konva Layer
      ↓
[Element Nodes]
      ↓
Canvas API
```

### Optimization Strategies

1. **Memoization**: Use `React.memo()` for expensive components
2. **Stable Callbacks**: Use `useCallback()` to prevent re-renders
3. **Refs for Transient State**: Use `useRef()` for values that don't trigger renders
4. **Layer Separation**: Keep UI layer separate from canvas layer
5. **Selective Rendering**: Only re-render changed elements

### Example: Optimized Node Rendering

```typescript
export const RectNode = React.memo(function RectNode(props: RectNodeProps) {
  const { element, selected, onSelect, onDragEnd, onTransform } = props;

  // Stable callbacks
  const handleClick = useCallback(() => {
    onSelect?.(element.id);
  }, [element.id, onSelect]);

  const handleDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onDragEnd?.(element.id, { x: node.x(), y: node.y() });
  }, [element.id, onDragEnd]);

  return (
    <Rect
      {...element}
      onClick={handleClick}
      onDragEnd={handleDragEnd}
    />
  );
}, (prev, next) => {
  // Custom comparison: only re-render if these props change
  return (
    prev.element === next.element &&
    prev.selected === next.selected
  );
});
```

## Event System

### Event Flow

```
User Interaction (mouse/touch)
         ↓
Konva Event (onMouseDown, onDragEnd, etc.)
         ↓
Node Component Handler (onClick, onDragEnd)
         ↓
EditorApp Callback (onElementSelect, onElementDragEnd)
         ↓
State Update (setElements, setSelectedIds)
         ↓
Re-render
```

### Event Categories

1. **Selection Events**: `onClick`, `onTap`
2. **Transform Events**: `onDragEnd`, `onTransformEnd`
3. **Drawing Events**: `onMouseDown`, `onMouseMove`, `onMouseUp`
4. **Pan/Zoom Events**: `onWheel`, `onMouseDown` (on stage)
5. **Keyboard Events**: `onKeyDown`, `onKeyUp`

### Example: Multi-Tool Event Handling

```typescript
function EditorApp() {
  const [tool, setTool] = useState<Tool>('select');

  const onStageMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    // Different behavior based on active tool
    if (tool === 'select') {
      handleSelectionStart(e);
    } else if (tool === 'rect') {
      handleRectDrawStart(e);
    } else if (tool === 'pencil') {
      handlePencilDrawStart(e);
    } else if (tool === 'pan') {
      handlePanStart(e);
    }
  }, [tool]);

  const handleSelectionStart = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage().getPointerPosition();
    selection.startRectSelection(pos);
  }, [selection]);

  // ... more handlers
}
```

### Keyboard Shortcuts

Handled in EditorApp with `useEffect`:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      onDeleteSelected();
    } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      if (e.shiftKey) {
        history.redo();
      } else {
        history.undo();
      }
    } else if (e.key === ' ') {
      zoomPan.setIsPanMode(true);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === ' ') {
      zoomPan.setIsPanMode(false);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}, [onDeleteSelected, history, zoomPan]);
```

## Design Patterns

### 1. Hook-First Architecture

All features are implemented as hooks first, then consumed by components.

### 2. Unidirectional Data Flow

Data flows down (props), events flow up (callbacks).

### 3. Composition Over Inheritance

Components are composed from smaller components, not inherited.

### 4. Dependency Injection

Components receive all dependencies through props (no global state access).

### 5. Separation of Concerns

Logic (hooks) is separate from presentation (components).

### 6. Single Responsibility

Each component/hook has one clear purpose.

## Common Patterns

### Adding a New Shape Type

1. Define type in `types/editor.ts`:
```typescript
export interface StarElement extends FillableElement {
  type: 'star';
  numPoints: number;
  innerRadius: number;
  outerRadius: number;
}
```

2. Create node in `ui/atoms/konva/nodes/StarNode.tsx`:
```typescript
export function StarNode({ element, selected, onSelect, onDragEnd, onTransform }: Props) {
  return <Star {...element} onClick={() => onSelect(element.id)} />;
}
```

3. Add factory in `utils/editorElements.ts`:
```typescript
export function createStar(overrides: Partial<StarElement> = {}): StarElement {
  return {
    ...createBaseElement('star'),
    numPoints: 5,
    innerRadius: 20,
    outerRadius: 40,
    fill: '#ffcc00',
    stroke: '#000000',
    strokeWidth: 2,
    ...overrides,
  };
}
```

4. Add to EditorCanvas render:
```typescript
{element.type === 'star' && (
  <StarNode
    element={element as StarElement}
    selected={selectedIds.includes(element.id)}
    onSelect={onElementSelect}
    onDragEnd={onElementDragEnd}
    onTransform={onElementTransform}
  />
)}
```

5. Add toolbar button:
```typescript
<Button onPress={onAddStar}>
  <Star /> Add Star
</Button>
```

6. Add action in EditorApp:
```typescript
const onAddStar = useCallback(() => {
  const star = createStar({
    x: options.width / 2,
    y: options.height / 2,
  });
  setElements(prev => [...prev, star]);
  history.save();
}, [options, history]);
```

This architecture ensures maintainability, testability, and scalability of the editor.
