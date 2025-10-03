# Component Usage Examples

This document provides practical examples of how to use and extend the editor's components.

## Table of Contents

- [Core Hooks](#core-hooks)
- [Konva Nodes (Atoms)](#konva-nodes-atoms)
- [UI Components (Molecules & Organisms)](#ui-components-molecules--organisms)
- [Custom Components](#custom-components)
- [Common Scenarios](#common-scenarios)

## Core Hooks

### useHistory

Manages undo/redo functionality for elements and layers.

```typescript
import { useHistory } from '@hooks/useHistory';

function MyEditor() {
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [layers, setLayers] = useState<EditorLayer[]>([]);

  const history = useHistory({ elements, layers });

  const addElement = (element: EditorElement) => {
    setElements(prev => [...prev, element]);
    // Save state to history
    history.save();
  };

  const handleUndo = () => {
    const previous = history.undo();
    if (previous) {
      setElements(previous.elements);
      setLayers(previous.layers);
    }
  };

  const handleRedo = () => {
    const next = history.redo();
    if (next) {
      setElements(next.elements);
      setLayers(next.layers);
    }
  };

  return (
    <>
      <Button disabled={!history.canUndo} onClick={handleUndo}>Undo</Button>
      <Button disabled={!history.canRedo} onClick={handleRedo}>Redo</Button>
    </>
  );
}
```

**Key Methods**:
- `save()`: Save current state
- `undo()`: Go back one step
- `redo()`: Go forward one step
- `clear()`: Clear all history

**Properties**:
- `canUndo`: boolean
- `canRedo`: boolean

### useZoomPan

Manages zoom and pan state for the canvas.

```typescript
import { useZoomPan } from '@hooks/editor/useZoomPan';

function MyEditor() {
  const canvasRef = useRef<HTMLDivElement>(null);

  const zoomPan = useZoomPan({
    initialZoom: 1,
    maxZoom: 8,
    stageSize: { width: 1024, height: 1024 },
    canvasRef,
  });

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomPan.zoom * 1.2, zoomPan.zoomBounds.max);
    zoomPan.setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomPan.zoom / 1.2, zoomPan.zoomBounds.min);
    zoomPan.setZoom(newZoom);
  };

  const handleZoomToFit = () => {
    zoomPan.setZoom(zoomPan.fitScale);
    zoomPan.setStagePosition({ x: 0, y: 0 });
  };

  return (
    <div ref={canvasRef}>
      <Stage
        scale={{ x: zoomPan.zoom, y: zoomPan.zoom }}
        x={zoomPan.stagePosition.x}
        y={zoomPan.stagePosition.y}
      >
        {/* Canvas content */}
      </Stage>
    </div>
  );
}
```

**Key Properties**:
- `zoom`: Current zoom level
- `stagePosition`: Current pan position `{ x, y }`
- `fitScale`: Scale that fits canvas in viewport
- `zoomBounds`: `{ min, max }` zoom limits
- `workspaceSize`: Viewport dimensions
- `isPanMode`: Whether pan mode is active
- `isPanning`: Whether currently panning

**Key Methods**:
- `setZoom(zoom)`: Set zoom level
- `setStagePosition(position)`: Set pan position
- `setIsPanMode(mode)`: Enable/disable pan mode
- `startPanInertia(velocity)`: Start inertia-based pan
- `stopInertia()`: Stop inertia animation

### useSelection

Manages element selection state and rectangle selection.

```typescript
import { useSelection } from '@hooks/editor/useSelection';

function MyEditor() {
  const [elements, setElements] = useState<EditorElement[]>([]);

  const selection = useSelection({
    onSelectionChange: (ids) => {
      console.log('Selected:', ids);
    },
  });

  const handleElementClick = (id: string, modKey: boolean) => {
    if (modKey) {
      selection.selectElement(id, 'toggle');
    } else {
      selection.selectElement(id, 'single');
    }
  };

  const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    selection.startRectSelection(pos);
  };

  const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (selection.selectionOriginRef.current) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      selection.updateRectSelection(pos);
    }
  };

  const handleStageMouseUp = () => {
    if (selection.selectionOriginRef.current) {
      const selectedIds = selection.endRectSelection(elements);
      console.log('Rectangle selected:', selectedIds);
    }
  };

  return (
    <>
      <Stage
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
      >
        {/* Canvas content */}
      </Stage>

      {/* Selection rectangle overlay */}
      {selection.selectionRect && (
        <Rect
          x={selection.selectionRect.x}
          y={selection.selectionRect.y}
          width={selection.selectionRect.width}
          height={selection.selectionRect.height}
          stroke="blue"
          strokeWidth={1}
          dash={[5, 5]}
        />
      )}
    </>
  );
}
```

**Key Properties**:
- `selectedIds`: Array of selected element IDs
- `selectionRect`: Current selection rectangle or null

**Key Methods**:
- `selectElement(id, mode)`: Select element ('single', 'toggle', 'add')
- `selectMultiple(ids)`: Select multiple elements
- `clearSelection()`: Clear all selections
- `startRectSelection(origin)`: Start rectangle selection
- `updateRectSelection(current)`: Update rectangle during drag
- `endRectSelection(elements)`: Finish selection, returns selected IDs
- `cancelRectSelection()`: Cancel rectangle selection

### useWordPressIntegration

Handles WordPress media library integration and image uploads.

```typescript
import { useWordPressIntegration } from '@hooks/editor/useWordPressIntegration';

function MyEditor() {
  const wpIntegration = useWordPressIntegration({
    config: {
      restUrl: 'https://example.com/wp-json/',
      nonce: 'abc123',
      username: 'user',
    },
  });

  const handleUploadCanvas = async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], 'design.png', { type: 'image/png' });
      const result = await wpIntegration.uploadMedia(file, 'My Design');

      if (result.success && result.url) {
        console.log('Uploaded:', result.url);
      } else {
        console.error('Upload failed:', result.error);
      }
    });
  };

  const handleFetchMedia = async () => {
    const result = await wpIntegration.fetchUserMedia();
    if (result.success && result.items) {
      console.log('Media items:', result.items);
    }
  };

  return (
    <>
      <Button onClick={handleUploadCanvas}>Save to WordPress</Button>
      <Button onClick={handleFetchMedia}>Load Media</Button>
    </>
  );
}
```

**Key Methods**:
- `uploadMedia(file, title)`: Upload file to WordPress
- `fetchUserMedia()`: Fetch user's media library
- `updateConfig(config)`: Update WordPress configuration

**Key Properties**:
- `isConfigured`: Whether WP config is valid
- `isUploading`: Whether upload is in progress

## Konva Nodes (Atoms)

### RectNode

Renders a rectangle element.

```typescript
import { RectNode } from '@atoms/konva/nodes/RectNode';
import type { RectElement } from '@types/editor';

function MyCanvas() {
  const [rect, setRect] = useState<RectElement>({
    id: 'rect1',
    type: 'rect',
    name: 'Rectangle',
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    fill: '#3b82f6',
    stroke: '#1e40af',
    strokeWidth: 2,
    cornerRadius: 8,
    rotation: 0,
    opacity: 1,
    draggable: true,
    visible: true,
    locked: false,
  });

  const [selected, setSelected] = useState(false);

  const handleSelect = (id: string) => {
    setSelected(true);
  };

  const handleDragEnd = (id: string, position: Vector2d) => {
    setRect(prev => ({ ...prev, x: position.x, y: position.y }));
  };

  const handleTransform = (id: string, attrs: Partial<RectElement>) => {
    setRect(prev => ({ ...prev, ...attrs }));
  };

  return (
    <Stage width={800} height={600}>
      <Layer>
        <RectNode
          element={rect}
          selected={selected}
          onSelect={handleSelect}
          onDragEnd={handleDragEnd}
          onTransform={handleTransform}
        />
      </Layer>
    </Stage>
  );
}
```

### CircleNode

Renders a circle element.

```typescript
import { CircleNode } from '@atoms/konva/nodes/CircleNode';

const circle: CircleElement = {
  id: 'circle1',
  type: 'circle',
  name: 'Circle',
  x: 200,
  y: 200,
  radius: 50,
  fill: '#ef4444',
  stroke: '#991b1b',
  strokeWidth: 2,
  rotation: 0,
  opacity: 1,
  draggable: true,
  visible: true,
  locked: false,
};

<CircleNode
  element={circle}
  selected={false}
  onSelect={(id) => console.log('Selected:', id)}
  onDragEnd={(id, pos) => console.log('Dragged to:', pos)}
  onTransform={(id, attrs) => console.log('Transformed:', attrs)}
/>
```

### TextNode

Renders text element with editing capabilities.

```typescript
import { TextNode } from '@atoms/konva/nodes/TextNode';

const text: TextElement = {
  id: 'text1',
  type: 'text',
  name: 'Text',
  text: 'Hello World',
  x: 150,
  y: 150,
  fontSize: 32,
  fontFamily: 'Arial',
  fontStyle: 'normal',
  fontWeight: 'normal',
  fill: '#000000',
  width: 200,
  align: 'left',
  lineHeight: 1.2,
  letterSpacing: 0,
  stroke: '',
  strokeWidth: 0,
  backgroundColor: '',
  padding: 4,
  rotation: 0,
  opacity: 1,
  draggable: true,
  visible: true,
  locked: false,
};

<TextNode
  element={text}
  selected={true}
  editing={false}
  onSelect={(id) => {}}
  onDragEnd={(id, pos) => {}}
  onTransform={(id, attrs) => {}}
  onTextChange={(id, newText) => console.log('Text changed:', newText)}
  onEditStart={(id) => console.log('Edit started')}
  onEditEnd={(id) => console.log('Edit ended')}
/>
```

### ImageNode

Renders image element.

```typescript
import { ImageNode } from '@atoms/konva/nodes/ImageNode';
import { useImage } from '@hooks/useImage';

function MyImageNode({ src }: { src: string }) {
  const [image] = useImage(src);

  const imageElement: ImageElement = {
    id: 'img1',
    type: 'image',
    name: 'Image',
    src,
    x: 100,
    y: 100,
    width: 300,
    height: 200,
    cornerRadius: 0,
    keepRatio: true,
    rotation: 0,
    opacity: 1,
    draggable: true,
    visible: true,
    locked: false,
  };

  return (
    <ImageNode
      element={imageElement}
      image={image}
      selected={false}
      onSelect={(id) => {}}
      onDragEnd={(id, pos) => {}}
      onTransform={(id, attrs) => {}}
    />
  );
}
```

### LineNode and PencilNode

Render lines and freehand paths.

```typescript
import { LineNode } from '@atoms/konva/nodes/LineNode';
import { PencilNode } from '@atoms/konva/nodes/PencilNode';

// Line (straight or curved)
const line: LineElement = {
  id: 'line1',
  type: 'line',
  name: 'Line',
  points: [0, 0, 100, 100, 200, 50],
  stroke: '#000000',
  strokeWidth: 3,
  x: 50,
  y: 50,
  rotation: 0,
  opacity: 1,
  draggable: true,
  visible: true,
  locked: false,
};

// Pencil (freehand drawing)
const pencil: PencilElement = {
  id: 'pencil1',
  type: 'pencil',
  name: 'Pencil',
  points: [0, 0, 5, 10, 12, 15, 20, 18, ...],
  stroke: '#000000',
  strokeWidth: 2,
  lineCap: 'round',
  lineJoin: 'round',
  x: 0,
  y: 0,
  rotation: 0,
  opacity: 1,
  draggable: true,
  visible: true,
  locked: false,
};

<>
  <LineNode element={line} {...handlers} />
  <PencilNode element={pencil} {...handlers} />
</>
```

## UI Components (Molecules & Organisms)

### ZoomControls

Zoom control buttons.

```typescript
import { ZoomControls } from '@molecules/controls/ZoomControls';

function MyToolbar() {
  const [zoom, setZoom] = useState(1);
  const fitScale = 0.8;
  const minZoom = 0.1;
  const maxZoom = 8;

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, maxZoom));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, minZoom));
  const handleZoomToFit = () => setZoom(fitScale);
  const handleZoomToActual = () => setZoom(1);

  return (
    <ZoomControls
      zoom={zoom}
      minZoom={minZoom}
      maxZoom={maxZoom}
      fitScale={fitScale}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onZoomToFit={handleZoomToFit}
      onZoomToActual={handleZoomToActual}
    />
  );
}
```

### DrawSettings

Drawing tool settings (color, stroke width).

```typescript
import { DrawSettings } from '@molecules/controls/DrawSettings';

function MyToolbar() {
  const [color, setColor] = useState('#000000');
  const [width, setWidth] = useState(5);

  return (
    <DrawSettings
      color={color}
      strokeWidth={width}
      onColorChange={setColor}
      onStrokeWidthChange={setWidth}
    />
  );
}
```

### PrimaryToolbar

Main toolbar with tool selection.

```typescript
import { PrimaryToolbar } from '@organisms/editor/PrimaryToolbar';
import type { Tool } from '@organisms/editor/types';

function MyEditor() {
  const [tool, setTool] = useState<Tool>('select');

  return (
    <PrimaryToolbar
      tool={tool}
      onToolChange={setTool}
      onAddRect={() => console.log('Add rect')}
      onAddCircle={() => console.log('Add circle')}
      onAddText={() => console.log('Add text')}
      onAddImage={() => console.log('Add image')}
      onUndo={() => console.log('Undo')}
      onRedo={() => console.log('Redo')}
      canUndo={true}
      canRedo={false}
    />
  );
}
```

### LayersPanel

Layers management panel.

```typescript
import { LayersPanel } from '@organisms/editor/LayersPanel';

function MyEditor() {
  const [layers, setLayers] = useState<EditorLayer[]>([
    { id: 'layer1', name: 'Background', visible: true, locked: false },
    { id: 'layer2', name: 'Main', visible: true, locked: false },
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState('layer2');

  const handleAddLayer = () => {
    const newLayer = {
      id: `layer${layers.length + 1}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
    };
    setLayers(prev => [...prev, newLayer]);
  };

  const handleToggleVisibility = (id: string) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  const handleToggleLock = (id: string) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === id ? { ...layer, locked: !layer.locked } : layer
      )
    );
  };

  return (
    <LayersPanel
      layers={layers}
      selectedLayerId={selectedLayerId}
      onSelectLayer={setSelectedLayerId}
      onAddLayer={handleAddLayer}
      onDeleteLayer={(id) => setLayers(prev => prev.filter(l => l.id !== id))}
      onToggleVisibility={handleToggleVisibility}
      onToggleLock={handleToggleLock}
      onReorder={(fromIndex, toIndex) => {
        const newLayers = [...layers];
        const [removed] = newLayers.splice(fromIndex, 1);
        newLayers.splice(toIndex, 0, removed);
        setLayers(newLayers);
      }}
    />
  );
}
```

### EditorCanvas

Main Konva canvas component.

```typescript
import { EditorCanvas } from '@organisms/canvas/EditorCanvas';

function MyEditor() {
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const stageRef = useRef<Konva.Stage>(null);

  return (
    <EditorCanvas
      stageRef={stageRef}
      elements={elements}
      selectedIds={selectedIds}
      width={1024}
      height={1024}
      backgroundColor="#ffffff"
      zoom={1}
      stagePosition={{ x: 0, y: 0 }}
      onElementSelect={(id) => setSelectedIds([id])}
      onElementDragEnd={(id, pos) => {
        setElements(prev =>
          prev.map(el => el.id === id ? { ...el, ...pos } : el)
        );
      }}
      onElementTransform={(id, attrs) => {
        setElements(prev =>
          prev.map(el => el.id === id ? { ...el, ...attrs } : el)
        );
      }}
      onStageMouseDown={(e) => console.log('Stage clicked')}
      onStageMouseMove={(e) => console.log('Mouse move')}
      onStageMouseUp={(e) => console.log('Mouse up')}
    />
  );
}
```

## Custom Components

### Creating a Custom Shape Node

```typescript
// ui/atoms/konva/nodes/CustomShapeNode.tsx
import { useRef } from 'react';
import { Shape } from 'react-konva';
import type { Vector2d } from '@types/konva';
import type { BaseElement } from '@types/editor';

interface CustomShapeElement extends BaseElement {
  type: 'custom';
  size: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

interface CustomShapeNodeProps {
  element: CustomShapeElement;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onDragEnd?: (id: string, position: Vector2d) => void;
}

export function CustomShapeNode({
  element,
  selected,
  onSelect,
  onDragEnd,
}: CustomShapeNodeProps) {
  const shapeRef = useRef(null);

  return (
    <Shape
      ref={shapeRef}
      id={element.id}
      x={element.x}
      y={element.y}
      sceneFunc={(context, shape) => {
        const size = element.size;
        // Draw custom shape
        context.beginPath();
        context.moveTo(0, -size);
        context.lineTo(size, size);
        context.lineTo(-size, size);
        context.closePath();
        context.fillStrokeShape(shape);
      }}
      fill={element.fill}
      stroke={element.stroke}
      strokeWidth={element.strokeWidth}
      draggable={element.draggable && !element.locked}
      visible={element.visible}
      opacity={element.opacity}
      onClick={() => onSelect?.(element.id)}
      onDragEnd={(e) => {
        const node = e.target;
        onDragEnd?.(element.id, { x: node.x(), y: node.y() });
      }}
    />
  );
}
```

### Creating a Custom Hook

```typescript
// hooks/useCustomFeature.ts
import { useCallback, useState } from 'react';

interface UseCustomFeatureOptions {
  initialValue?: string;
  onChange?: (value: string) => void;
}

export function useCustomFeature({
  initialValue = '',
  onChange,
}: UseCustomFeatureOptions = {}) {
  const [value, setValue] = useState(initialValue);
  const [isActive, setIsActive] = useState(false);

  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
    onChange?.(newValue);
  }, [onChange]);

  const toggle = useCallback(() => {
    setIsActive(prev => !prev);
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
    setIsActive(false);
  }, [initialValue]);

  return {
    value,
    isActive,
    updateValue,
    toggle,
    reset,
  };
}
```

## Common Scenarios

### Scenario 1: Adding a New Tool

```typescript
// 1. Define tool type
type Tool = 'select' | 'rect' | 'circle' | 'text' | 'mynewtool';

// 2. Add tool button to toolbar
<Button
  active={tool === 'mynewtool'}
  onPress={() => setTool('mynewtool')}
>
  My Tool
</Button>

// 3. Handle tool events in EditorApp
const onStageMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
  if (tool === 'mynewtool') {
    handleMyNewToolStart(e);
  }
  // ... other tools
}, [tool]);

const handleMyNewToolStart = useCallback((e: KonvaEventObject<MouseEvent>) => {
  const stage = e.target.getStage();
  const pos = stage.getPointerPosition();
  // Implement tool logic
  console.log('My new tool started at:', pos);
}, []);
```

### Scenario 2: Batch Element Operations

```typescript
// Select multiple elements
const selectAll = () => {
  const allIds = elements.map(e => e.id);
  selection.selectMultiple(allIds);
};

// Delete multiple elements
const deleteSelected = () => {
  setElements(prev =>
    prev.filter(e => !selection.selectedIds.includes(e.id))
  );
  selection.clearSelection();
  history.save();
};

// Group transformation
const scaleSelected = (factor: number) => {
  setElements(prev =>
    prev.map(e => {
      if (selection.selectedIds.includes(e.id)) {
        return {
          ...e,
          width: e.width * factor,
          height: e.height * factor,
        };
      }
      return e;
    })
  );
  history.save();
};
```

### Scenario 3: Export Canvas

```typescript
const exportToPNG = async () => {
  const stage = stageRef.current;
  if (!stage) return;

  // Get data URL
  const dataURL = stage.toDataURL({ pixelRatio: 2 });

  // Download
  const link = document.createElement('a');
  link.download = 'design.png';
  link.href = dataURL;
  link.click();
};

const exportToJSON = () => {
  const design: EditorDesign = {
    elements,
    layers,
    options,
  };

  const json = JSON.stringify(design, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.download = 'design.json';
  link.href = url;
  link.click();

  URL.revokeObjectURL(url);
};
```

### Scenario 4: Loading Design

```typescript
const loadDesignFromJSON = (jsonString: string) => {
  try {
    const design = JSON.parse(jsonString) as EditorDesign;

    setElements(design.elements || []);
    setLayers(design.layers || []);
    if (design.options) {
      setOptions(prev => ({ ...prev, ...design.options }));
    }

    history.clear();
    selection.clearSelection();
  } catch (error) {
    console.error('Failed to load design:', error);
  }
};
```

### Scenario 5: Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Prevent default for editor shortcuts
    const isEditorShortcut =
      (e.ctrlKey || e.metaKey) &&
      ['z', 'c', 'v', 'a', 'd'].includes(e.key.toLowerCase());

    if (isEditorShortcut) {
      e.preventDefault();
    }

    // Ctrl/Cmd + Z: Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      handleUndo();
    }

    // Ctrl/Cmd + Shift + Z: Redo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      handleRedo();
    }

    // Ctrl/Cmd + A: Select all
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      selectAll();
    }

    // Delete/Backspace: Delete selected
    if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteSelected();
    }

    // Ctrl/Cmd + D: Duplicate
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      duplicateSelected();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [/* dependencies */]);
```

This document provides comprehensive examples of component usage throughout the editor. Refer to the actual component source files for complete API details.
