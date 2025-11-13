---
sidebar_position: 2
---

# Molecules API

Simple combinations of atoms that work together

## Components

- [SelectionBox](#selectionbox)
- [KonvaSelectionBox](#konvaselectionbox)
- [ZoomControl](#zoomcontrol)
- [SimpleCanvas](#simplecanvas)
- [OverlaySelection](#overlayselection)

---

## SelectionBox

SelectionBox Molecule - Renders a selection box with transform handles
Combines ResizeHandle and RotateHandle atoms into a complete selection UI

### Import

```tsx
import { SelectionBox } from '@Selection/SelectionBox';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `box` | `OverlayBox` | - | ✓ |  |
| `onPointerDown` | `(e: PointerEvent<HTMLDivElement>) => void` | - |  |  |
| `onPointerMove` | `(e: PointerEvent<HTMLDivElement>) => void` | - |  |  |
| `onPointerUp` | `(e: PointerEvent<HTMLDivElement>) => void` | - |  |  |
| `onResizePointerDown` | `(direction: string, e: PointerEvent<HTMLDivElement>) => void` | - |  |  |
| `onRotatePointerDown` | `(e: PointerEvent<HTMLDivElement>) => void` | - |  |  |

### Example

```tsx
<SelectionBox />
```

---

## KonvaSelectionBox

KonvaSelectionBox Molecule - Renders a selection box with transform handles in Konva
All handles are Konva shapes for proper event handling

### Import

```tsx
import { KonvaSelectionBox } from '@Selection/KonvaSelectionBox';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `box` | `KonvaOverlayBox` | - | ✓ |  |
| `onPointerDown` | `(e: KonvaEventObject<PointerEvent>) => void` | - |  |  |
| `onPointerMove` | `(e: KonvaEventObject<PointerEvent>) => void` | - |  |  |
| `onPointerUp` | `(e: KonvaEventObject<PointerEvent>) => void` | - |  |  |
| `onResizePointerDown` | `(direction: string, e: KonvaEventObject<PointerEvent>) => void` | - |  |  |
| `onRotatePointerDown` | `(e: KonvaEventObject<PointerEvent>) => void` | - |  |  |

### Example

```tsx
<KonvaSelectionBox />
```

---

## ZoomControl

ZoomControl Molecule - Provides zoom in/out/reset controls
Displays current zoom percentage and allows adjustment

### Import

```tsx
import { ZoomControl } from '@Controls/ZoomControl';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `zoom` | `number` | - | ✓ |  |
| `onZoomChange` | `(zoom: number) => void` | - | ✓ |  |
| `minZoom` | `number` | `-100` |  |  |
| `maxZoom` | `number` | `-1 * minZoom` |  |  |
| `step` | `number` | `10` |  |  |

### Example

```tsx
<ZoomControl />
```

---

## SimpleCanvas

SimpleCanvas Molecule - A ready-to-use canvas with stage and layer
Provides zoom functionality where:
- zoom = 0 (default): Stage fits to container
/**
/**
SimpleCanvas Molecule - A ready-to-use canvas with stage and layer
Provides zoom functionality where:
- zoom = 0 (default): Stage fits to container
- zoom greater than 0: Zoom in (percentage increase)
- zoom less than 0: Zoom out (percentage decrease)

### Import

```tsx
import { SimpleCanvas } from '@Canvas/SimpleCanvas';
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
| `layerControls` | `LayerControlHandlers` | - |  |  |
| `layersRevision` | `number` | `0` |  |  |
| `selectModeActive` | `boolean` | `false` |  |  |

### Example

```tsx
<SimpleCanvas />
```

---

## OverlaySelection

### Import

```tsx
import { OverlaySelection } from '@components/OverlaySelection';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `box` | `OverlayBox` | - | ✓ |  |
| `onPointerDown` | `(e: PointerEvent<HTMLDivElement>) => void` | - |  |  |
| `onPointerMove` | `(e: PointerEvent<HTMLDivElement>) => void` | - |  |  |
| `onPointerUp` | `(e: PointerEvent<HTMLDivElement>) => void` | - |  |  |
| `onResizePointerDown` | `(direction: string, e: PointerEvent<HTMLDivElement>) => void` | - |  |  |
| `onRotatePointerDown` | `(e: PointerEvent<HTMLDivElement>) => void` | - |  |  |

### Example

```tsx
<OverlaySelection />
```

---
