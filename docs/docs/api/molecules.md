---
sidebar_position: 2
---

# Molecules API

Simple combinations of atoms that work together

## Components

- [SettingsPanelUI](#settingspanelui)
- [SelectionBox](#selectionbox)
- [KonvaSelectionBox](#konvaselectionbox)
- [PaintShapeNode](#paintshapenode)
- [collectPaintShapes](#collectpaintshapes)
- [StageGroup](#stagegroup)
- [SelectionLayer](#selectionlayer)
- [ImageLayerNode](#imagelayernode)
- [BackgroundLayer](#backgroundlayer)
- [StageMimic](#stagemimic)
- [FullContainerBackground](#fullcontainerbackground)
- [PanelLayer](#panellayer)
- [LayerPanelUI](#layerpanelui)
- [ZoomControl](#zoomcontrol)
- [SimpleCanvas](#simplecanvas)
- [floodFillLayer](#floodfilllayer)
- [buildLayerTransformFromEffective](#buildlayertransformfromeffective)
- [useDrawingTools](#usedrawingtools)
- [OverlaySelection](#overlayselection)

---

## SettingsPanelUI

### Import

```tsx
import { SettingsPanelUI } from '@Settings/SettingsPanelUI';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `isOpen` | `boolean` | - | ✓ |  |
| `onToggle` | `() => void` | - | ✓ |  |
| `onClose` | `() => void` | - | ✓ |  |
| `layerControls` | `any` | - | ✓ |  |
| `selectedLayerIds` | `string[]` | - | ✓ |  |
| `penSettings` | `PenSettings` | - | ✓ |  |
| `eraserSize` | `number` | `20` |  |  |
| `onEraserSizeChange` | `(value: number) => void` | - |  |  |
| `isTextToolActive` | `boolean` | `false` |  |  |
| `textSettings` | `TextSettings` | - |  |  |
| `isTextLayerSelected` | `boolean` | `false` |  |  |
| `isRubberToolActive` | `boolean` | `false` |  |  |
| `language` | `Language` | `en` |  |  |

### Example

```tsx
<SettingsPanelUI />
```

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

KonvaSelectionBox Molecule - Renders a unified Group containing:
1. Selection UI (border, handles)
2. Element content (passed as children)
All transformations apply to the Group, affecting both UI and content together

### Import

```tsx
import { KonvaSelectionBox } from '@Selection/KonvaSelectionBox';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `box` | `KonvaOverlayBox` | - | ✓ |  |
| `stageScale` | `number` | - |  |  |
| `onPointerDown` | `(e: KonvaEventObject<PointerEvent, Node<NodeConfig>>) => void` | - |  |  |
| `onPointerMove` | `(e: KonvaEventObject<PointerEvent, Node<NodeConfig>>) => void` | - |  |  |
| `onPointerUp` | `(e: KonvaEventObject<PointerEvent, Node<NodeConfig>>) => void` | - |  |  |
| `onResizePointerDown` | `(direction: string, e: KonvaEventObject<PointerEvent, Node<NodeConfig>>) => void` | - |  |  |
| `onRotatePointerDown` | `(e: KonvaEventObject<PointerEvent, Node<NodeConfig>>) => void` | - |  |  |

### Example

```tsx
<KonvaSelectionBox />
```

---

## PaintShapeNode

### Import

```tsx
import { PaintShapeNode } from '@Stage/PaintShapeNode';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `shape` | `LayerPaintShape` | - | ✓ |  |

### Example

```tsx
<PaintShapeNode />
```

---

## collectPaintShapes

### Import

```tsx
import { collectPaintShapes } from '@Stage/collectPaintShapes';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `id` | `string` | - | ✓ |  |
| `visible` | `boolean` | - | ✓ |  |
| `position` | `{ x: number; y: number; }` | - | ✓ |  |
| `rotation` | `number` | - |  |  |
| `scale` | `ScaleVector` | - |  |  |
| `opacity` | `number` | - |  |  |
| `strokes` | `LayerStroke[]` | - |  |  |
| `texts` | `LayerTextItem[]` | - |  |  |
| `bounds` | `any` | - |  |  |
| `needsRasterization` | `boolean` | - | ✓ |  |
| `name` | `string` | - | ✓ |  |
| `render` | `() => ReactNode` | - | ✓ |  |
| `imageSrc` | `string` | - |  |  |
| `shapes` | `LayerShape[]` | - |  |  |

### Example

```tsx
<collectPaintShapes />
```

---

## StageGroup

### Import

```tsx
import { StageGroup } from '@Stage/StageGroup';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `layersRevision` | `number` | - | ✓ |  |
| `index` | `number` | - |  |  |
| `id` | `string` | - | ✓ |  |
| `layerId` | `string` | - | ✓ |  |
| `visible` | `boolean` | - | ✓ |  |
| `x` | `number` | - | ✓ |  |
| `y` | `number` | - | ✓ |  |
| `rotation` | `number` | - | ✓ |  |
| `scaleX` | `number` | - | ✓ |  |
| `scaleY` | `number` | - | ✓ |  |
| `opacity` | `number` | - |  |  |
| `draggable` | `boolean` | - | ✓ |  |
| `selectModeActive` | `boolean` | - | ✓ |  |
| `stageViewportOffsetX` | `number` | - | ✓ |  |
| `stageViewportOffsetY` | `number` | - | ✓ |  |
| `baseCursor` | `string` | - | ✓ |  |
| `layerNodeRefs` | `RefObject<Map<string, Node<NodeConfig>>>` | - | ✓ |  |
| `pendingSelectionRef` | `RefObject<string[]>` | - | ✓ |  |
| `selectionDragStateRef` | `RefObject<any>` | - | ✓ |  |
| `onRefChange` | `(node: Node<NodeConfig>) => void` | - | ✓ |  |
| `updateBoundsFromLayerIds` | `(ids: string[]) => void` | - | ✓ |  |
| `syncTransformerToSelection` | `() => void` | - | ✓ |  |

### Example

```tsx
<StageGroup />
```

---

## SelectionLayer

SelectionLayer component

Renders the selection layer with transformer and proxy for multi-layer transforms

### Import

```tsx
import { SelectionLayer } from '@Stage/SelectionLayer';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `selectModeActive` | `boolean` | - | ✓ |  |
| `borderDash` | `number[]` | - | ✓ |  |
| `padding` | `number` | - | ✓ |  |
| `transformerRef` | `MutableRefObject<Transformer>` | - | ✓ |  |
| `layerRef` | `MutableRefObject<Layer>` | - |  |  |
| `anchorSize` | `number` | - | ✓ |  |
| `anchorCornerRadius` | `number` | - | ✓ |  |
| `anchorStrokeWidth` | `number` | - | ✓ |  |
| `hitStrokeWidth` | `number` | - | ✓ |  |
| `stageRef` | `MutableRefObject<Stage>` | - | ✓ |  |
| `selectedLayerBounds` | `any` | - | ✓ |  |
| `captureSelectionTransformState` | `() => void` | - | ✓ |  |
| `applySelectionTransformDelta` | `() => void` | - | ✓ |  |
| `syncSelectedLayerNodeRefs` | `() => void` | - | ✓ |  |
| `commitSelectedLayerNodeTransforms` | `() => void` | - | ✓ |  |
| `scheduleBoundsRefresh` | `() => void` | - | ✓ |  |
| `initializeSelectionTransform` | `(bounds: any) => void` | - | ✓ |  |
| `markSelectionTransforming` | `(flag: boolean) => void` | - | ✓ |  |
| `onTransformEnd` | `() => void` | - |  |  |

### Example

```tsx
<SelectionLayer />
```

---

## ImageLayerNode

### Import

```tsx
import { ImageLayerNode } from '@Stage/ImageLayerNode';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `src` | `string` | - | ✓ |  |

### Example

```tsx
<ImageLayerNode />
```

---

## BackgroundLayer

BackgroundLayer component

Renders the background layer containing the full container background
and stage mimic. Combined for performance optimization.

### Import

```tsx
import { BackgroundLayer } from '@Stage/BackgroundLayer';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `containerWidth` | `number` | - | ✓ |  |
| `containerHeight` | `number` | - | ✓ |  |
| `containerBackground` | `string` | - | ✓ |  |
| `stageViewportOffsetX` | `number` | - | ✓ |  |
| `stageViewportOffsetY` | `number` | - | ✓ |  |
| `stageWidth` | `number` | - | ✓ |  |
| `stageHeight` | `number` | - | ✓ |  |
| `layerRef` | `RefObject<any>` | - |  |  |

### Example

```tsx
<BackgroundLayer />
```

---

## StageMimic

StageMimic component

Renders the visible canvas area rectangle with shadow styling

### Import

```tsx
import { StageMimic } from '@_BackgroundLayer/StageMimic';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `key` | `string` | - |  |  |
| `x` | `number` | - | ✓ |  |
| `y` | `number` | - | ✓ |  |
| `width` | `number` | - | ✓ |  |
| `height` | `number` | - | ✓ |  |
| `fill` | `string` | `hsla(0, 0%, 0%, 1.00)` |  |  |

### Example

```tsx
<StageMimic />
```

---

## FullContainerBackground

FullContainerBackground component

Renders a full-size background rectangle for the canvas container

### Import

```tsx
import { FullContainerBackground } from '@_BackgroundLayer/FullContainerBackground';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `key` | `string` | - |  |  |
| `width` | `number` | - | ✓ | Container width divided by scale |
| `height` | `number` | - | ✓ | Container height divided by scale |
| `fill` | `string` | - | ✓ | Background fill color |

### Example

```tsx
<FullContainerBackground />
```

---

## PanelLayer

### Import

```tsx
import { PanelLayer } from '@Panel/PanelLayer';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `index` | `number` | - | ✓ |  |
| `data` | `PanelLayerData` | - | ✓ |  |
| `pendingSelectionRef` | `MutableRefObject<string[]>` | - | ✓ |  |

### Example

```tsx
<PanelLayer />
```

---

## LayerPanelUI

### Import

```tsx
import { LayerPanelUI } from '@Panel/LayerPanelUI';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `isOpen` | `boolean` | - | ✓ |  |
| `onToggle` | `() => void` | - | ✓ |  |
| `onClose` | `() => void` | - | ✓ |  |
| `pendingSelectionRef` | `MutableRefObject<string[]>` | - | ✓ |  |

### Example

```tsx
<LayerPanelUI />
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
| `key` | `string` | - |  |  |
| `zoom` | `number` | - | ✓ |  |
| `onZoomChange` | `(zoom: number) => void` | - | ✓ |  |
| `onFit` | `() => void` | - |  |  |
| `minZoom` | `number` | `-100` |  |  |
| `maxZoom` | `number` | `200` |  |  |
| `step` | `number` | `10` |  |  |

### Example

```tsx
<ZoomControl />
```

---

## SimpleCanvas

### Import

```tsx
import { SimpleCanvas } from '@Canvas/SimpleCanvas';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `stageWidth` | `number` | `1024` |  |  |
| `stageHeight` | `number` | `1024` |  |  |
| `backgroundColor` | `string` | `#cccccc33` |  |  |
| `containerBackground` | `string` | `#cccccc` |  |  |
| `zoom` | `number` | `0` |  |  |
| `fitRequest` | `number` | `0` |  |  |
| `onStageReady` | `(stage: Stage) => void` | - |  |  |
| `onZoomChange` | `(zoom: number) => void` | - |  |  |
| `panModeActive` | `boolean` | `false` |  |  |
| `layersRevision` | `number` | `0` |  |  |
| `selectModeActive` | `boolean` | `false` |  |  |

### Example

```tsx
<SimpleCanvas />
```

---

## floodFillLayer

Perform flood-fill on a layer using its strokes and existing image as boundaries.
This mutates layer state via layerControls.updateLayerRender or layerControls.rasterizeLayer.

### Import

```tsx
import { floodFillLayer } from '@utils/floodFillLayer';
```

### Example

```tsx
<floodFillLayer />
```

---

## buildLayerTransformFromEffective

### Import

```tsx
import { buildLayerTransformFromEffective } from '@hooks/buildLayerTransformFromEffective';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `boundsX` | `number` | - |  |  |
| `boundsY` | `number` | - |  |  |
| `rotation` | `number` | - |  |  |
| `scaleX` | `number` | - |  |  |
| `scaleY` | `number` | - |  |  |
| `x` | `number` | - |  |  |
| `y` | `number` | - |  |  |

### Example

```tsx
<buildLayerTransformFromEffective />
```

---

## useDrawingTools

Encapsulates drawing / erasing / paint-bucket tools:
- pointerDown: choose layer, paint vs draw vs erase, create stroke
- pointerMove: extend stroke path
- pointerUp: commit stroke & rasterize erased content
- warns if eraser is used on vector-only layers (needs rasterize)

### Import

```tsx
import { useDrawingTools } from '@hooks/useDrawingTools';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `layerControls` | `any` | - | ✓ |  |
| `selectedLayerIds` | `string[]` | - | ✓ |  |
| `drawToolState` | `{ active: boolean; brushSize: number; brushHardness?: number; brushColor: string; brushOpacity: number; }` | - | ✓ |  |
| `rubberToolState` | `{ active: boolean; eraserSize: number; }` | - | ✓ |  |
| `paintToolState` | `{ active: boolean; color?: string; }` | - | ✓ |  |
| `getRelativePointerPosition` | `() => { x: number; y: number; }` | - | ✓ |  |
| `resolveEffectiveLayerTransform` | `(layer: any) => { x: number; y: number; rotation?: number; scaleX?: number; scaleY?: number; boundsX: number; boundsY: number; }` | - | ✓ |  |
| `stageWidth` | `number` | - | ✓ |  |
| `stageHeight` | `number` | - | ✓ |  |
| `stageViewportOffsetX` | `number` | - | ✓ |  |
| `stageViewportOffsetY` | `number` | - | ✓ |  |
| `layerNodeRefs` | `MutableRefObject<Map<string, Node<NodeConfig>>>` | - | ✓ |  |
| `dispatch` | `Dispatch` | - | ✓ |  |

### Example

```tsx
<useDrawingTools />
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
