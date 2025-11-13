---
sidebar_position: 3
---

# Organisms API

Complex UI components composed of molecules and atoms

## Components

- [ZoomableCanvasContainer](#zoomablecanvascontainer)
- [CanvasContainer](#canvascontainer)

---

## ZoomableCanvasContainer

### Import

```tsx
import { ZoomableCanvasContainer } from '@Canvas/ZoomableCanvasContainer';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `width` | `number` | `1024` |  |  |
| `height` | `number` | `1024` |  |  |
| `backgroundColor` | `string` | `#ffffff` |  |  |
| `containerBackground` | `string` | `#cccccc` |  |  |
| `zoom` | `number` | - | ✓ |  |
| `onZoomChange` | `(zoom: number) => void` | - | ✓ |  |
| `minZoom` | `number` | `-100` |  |  |
| `maxZoom` | `number` | `-1 * minZoom` |  |  |
| `zoomStep` | `number` | `10` |  |  |
| `wheelZoomStep` | `number` | `5` |  |  |
| `onStageReady` | `(stage: Konva.Stage) => void` | - |  |  |
| `panModeActive` | `boolean` | `false` |  |  |

### Example

```tsx
<ZoomableCanvasContainer />
```

---

## CanvasContainer

CanvasContainer Organism - Main canvas component with full functionality
Manages canvas state, zoom, and high-level layer operations for the canvas

### Import

```tsx
import { CanvasContainer } from '@Canvas/CanvasContainer';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `width` | `number` | `1024` |  |  |
| `height` | `number` | `1024` |  |  |
| `backgroundColor` | `string` | `#ffffff` |  |  |
| `containerBackground` | `string` | `#cccccc` |  |  |
| `zoom` | `number` | `0` |  |  |
| `onStageReady` | `(stage: Konva.Stage) => void` | - |  |  |
| `onZoomChange` | `(zoom: number) => void` | - |  |  |
| `panModeActive` | `boolean` | `false` |  |  |
| `initialLayers` | `CanvasLayerDefinition[]` | - |  |  |
| `selectModeActive` | `boolean` | `false` |  |  |

### Example

```tsx
<CanvasContainer />
```

---
