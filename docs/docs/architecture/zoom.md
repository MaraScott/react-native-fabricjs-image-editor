# Zoom Functionality

The canvas supports flexible zoom functionality that automatically fits the stage to its container.

## 🎯 How Zoom Works

The zoom system uses a percentage-based approach where:

- **zoom = 0** (default): Stage fits perfectly to container with 10% padding
- **zoom > 0**: Zoom in (increase scale)
- **zoom < 0**: Zoom out (decrease scale)

### Zoom Formula

```typescript
fitScale = min(containerWidth / stageWidth, containerHeight / stageHeight) * 0.9
zoomFactor = 1 + (zoom / 100)
finalScale = fitScale * zoomFactor
```

### Examples

| Zoom Value | Description | Scale Multiplier |
|------------|-------------|------------------|
| -50 | 50% zoom out | 0.5x fit scale |
| -25 | 25% zoom out | 0.75x fit scale |
| 0 | Fit to container (default) | 1.0x fit scale |
| 25 | 25% zoom in | 1.25x fit scale |
| 50 | 50% zoom in | 1.5x fit scale |
| 100 | 100% zoom in (2x) | 2.0x fit scale |

## 🎨 Usage

### Basic Usage with CanvasApp

```tsx
import { CanvasApp } from '@pages/Canvas';

// Default: 1024x1024px canvas, zoom = 0 (fit to container)
<CanvasApp />

// Custom size, zoom in 50%
<CanvasApp width={2048} height={2048} zoom={50} />

// Zoom out 25%
<CanvasApp zoom={-25} />
```

### With CanvasContainer

```tsx
import { CanvasContainer } from '@organisms/Canvas';
import { Rect } from 'react-konva';

function MyCanvas() {
  return (
    <CanvasContainer
      width={1024}
      height={1024}
      zoom={0}
      containerBackground="#cccccc"
    >
      <Rect x={100} y={100} width={200} height={200} fill="blue" />
    </CanvasContainer>
  );
}
```

### With SimpleCanvas

```tsx
import { SimpleCanvas } from '@molecules/Canvas';
import { Circle } from 'react-konva';

function SimpleZoomExample() {
  const [zoom, setZoom] = useState(0);

  return (
    <div>
      <input
        type="range"
        min="-50"
        max="100"
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
      />
      <SimpleCanvas
        width={1024}
        height={1024}
        zoom={zoom}
      >
        <Circle x={512} y={512} radius={100} fill="red" />
      </SimpleCanvas>
    </div>
  );
}
```

## 📐 Default Sizes

### Canvas Size
- **Width**: 1024px
- **Height**: 1024px
- **Aspect ratio**: 1:1 (square)

### Container
- **Background**: #cccccc (light gray)
- **Overflow**: hidden
- **Flex layout**: Centered

### Stage
- **Background**: #ffffff (white)
- **Box shadow**: 0 2px 8px rgba(0,0,0,0.2)

## 🔧 Advanced Usage

### Dynamic Zoom Controls

```tsx
import { useState } from 'react';
import { CanvasContainer } from '@organisms/Canvas';

function ZoomableCanvas() {
  const [zoom, setZoom] = useState(0);

  const handleZoomIn = () => setZoom(z => z + 10);
  const handleZoomOut = () => setZoom(z => z - 10);
  const handleZoomReset = () => setZoom(0);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
        <button onClick={handleZoomOut}>-</button>
        <span style={{ margin: '0 1rem' }}>Zoom: {zoom}%</span>
        <button onClick={handleZoomIn}>+</button>
        <button onClick={handleZoomReset} style={{ marginLeft: '1rem' }}>Reset</button>
      </div>
      <div style={{ flex: 1 }}>
        <CanvasContainer zoom={zoom}>
          {/* Your shapes here */}
        </CanvasContainer>
      </div>
    </div>
  );
}
```

### Mouse Wheel Zoom

```tsx
import { useState, useRef, useEffect } from 'react';
import { CanvasContainer } from '@organisms/Canvas';

function MouseWheelZoom() {
  const [zoom, setZoom] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(z => {
          const delta = -e.deltaY / 10;
          return Math.max(-50, Math.min(200, z + delta));
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <CanvasContainer zoom={zoom}>
        {/* Your shapes here */}
      </CanvasContainer>
    </div>
  );
}
```

### Keyboard Zoom

```tsx
import { useState, useEffect } from 'react';
import { CanvasContainer } from '@organisms/Canvas';

function KeyboardZoom() {
  const [zoom, setZoom] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          setZoom(z => Math.min(200, z + 10));
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          setZoom(z => Math.max(-50, z - 10));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <CanvasContainer zoom={zoom}>
      {/* Your shapes here */}
    </CanvasContainer>
  );
}
```

## 📊 Responsive Behavior

The canvas automatically adjusts when:

1. **Window resizes** - Recalculates fit-to-container scale
2. **Container size changes** - Updates based on new dimensions
3. **Zoom changes** - Applies new zoom factor immediately

### Example: Responsive Canvas

```tsx
<div style={{ width: '80vw', height: '80vh' }}>
  <CanvasContainer zoom={0}>
    {/* Canvas will automatically fit to 80% of viewport */}
  </CanvasContainer>
</div>
```

## 🎛️ Props Reference

### SimpleCanvas Props

```typescript
interface SimpleCanvasProps {
  width?: number;              // Stage width (default: 1024)
  height?: number;             // Stage height (default: 1024)
  backgroundColor?: string;    // Stage background (default: '#ffffff')
  containerBackground?: string; // Container background (default: '#cccccc')
  zoom?: number;               // Zoom percentage (default: 0)
  children?: React.ReactNode;  // Konva elements to render
  onStageReady?: (stage: Konva.Stage) => void; // Called when stage mounts
}
```

### CanvasContainer Props

```typescript
interface CanvasContainerProps {
  width?: number;              // Stage width (default: 1024)
  height?: number;             // Stage height (default: 1024)
  backgroundColor?: string;    // Stage background (default: '#ffffff')
  containerBackground?: string; // Container background (default: '#cccccc')
  zoom?: number;               // Zoom percentage (default: 0)
  children?: React.ReactNode;  // Konva elements to render
  onStageReady?: (stage: Konva.Stage) => void; // Called when stage mounts
}
```

### CanvasApp Props

```typescript
interface CanvasAppProps {
  width?: number;              // Stage width (default: 1024)
  height?: number;             // Stage height (default: 1024)
  backgroundColor?: string;    // Stage background (default: '#ffffff')
  containerBackground?: string; // Container background (default: '#cccccc')
  zoom?: number;               // Zoom percentage (default: 0)
}
```

## 🚀 Performance Tips

### Optimize for Different Zoom Levels

```tsx
function OptimizedCanvas() {
  const [zoom, setZoom] = useState(0);

  // Simplify rendering when zoomed out
  const detailLevel = zoom < -25 ? 'low' : zoom > 50 ? 'high' : 'medium';

  return (
    <CanvasContainer zoom={zoom}>
      {detailLevel === 'high' && (
        // Render high-detail elements only when zoomed in
        <ComplexShape />
      )}
      {/* Always render basic elements */}
      <BasicShape />
    </CanvasContainer>
  );
}
```

### Limit Zoom Range

```tsx
const MIN_ZOOM = -100;  // Maximum zoom out
const MAX_ZOOM = -1 * MIN_ZOOM;  // Maximum zoom in

function BoundedZoom() {
  const [zoom, setZoom] = useState(0);

  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom)));
  };

  return (
    <CanvasContainer zoom={zoom}>
      {/* Your shapes */}
    </CanvasContainer>
  );
}
```

## 📝 Notes

- Zoom is applied as a CSS transform on the stage wrapper
- The actual Konva stage dimensions remain constant (width x height)
- Coordinates in your shapes remain in the original coordinate system
- Example: A rect at `x={512} y={512}` is always at the center of a 1024x1024 canvas, regardless of zoom

## 🎓 Next Steps

Now that you understand zoom, you can:

1. **Add zoom controls** - Create UI for zoom in/out/reset
2. **Implement pan** - Allow dragging the canvas when zoomed in
3. **Zoom to cursor** - Zoom towards mouse position
4. **Minimap** - Show overview of full canvas when zoomed
5. **Zoom presets** - Quick zoom levels (25%, 50%, 100%, 200%)

Happy zooming! 🔍
