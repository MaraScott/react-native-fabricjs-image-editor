# Quick Reference Guide - Canvas Modules

## Import Cheatsheet

```typescript
// Import all hooks
import {
  useSelectionControls,
  useLayerPanel,
  useKeyboardControls,
  useOverlayTransform,
  usePanControls,
  useZoomControls,
} from './hooks';

// Import components
import {
  LayerPanel,
  SelectionTransformer,
  OverlaySelection,
} from './components';

// Import utilities
import {
  // Bounds utilities
  normaliseBounds,
  computeNodeBounds,
  areBoundsEqual,
  unifyBounds,
  
  // Calculations
  clampZoomValue,
  calculateScaleFromZoom,
  getTouchDistance,
  getTouchCenter,
  
  // Constants
  MIN_ZOOM,
  MAX_ZOOM,
  WHEEL_ZOOM_STEP,
} from './utils';

// Import types
import type {
  Bounds,
  LayerDescriptor,
  LayerControlHandlers,
  PanOffset,
  ScaleVector,
} from './types';
```

## Hook Usage Examples

### useSelectionControls

```typescript
const selectionControls = useSelectionControls({
  selectModeActive: true,
  layerControls: myLayerControls,
  stageRef,
  layerNodeRefs,
  layersRevision: 0,
  scale: 1.5,
});

// Access state
console.log(selectionControls.selectedLayerBounds);

// Call methods
selectionControls.refreshBoundsFromSelection();
selectionControls.clearSelection();
selectionControls.syncTransformerToSelection();
```

### useLayerPanel

```typescript
const layerPanel = useLayerPanel({
  layerControls: myLayerControls,
});

// Use in render
<LayerPanel
  {...layerPanel}
  selectedLayerIds={selectedIds}
  primaryLayerId={primaryId}
  handleCopyLayer={copyHandler}
  resolveDropPosition={dropPositionResolver}
  pendingSelectionRef={pendingRef}
/>
```

### useKeyboardControls

```typescript
const { spacePressed } = useKeyboardControls({
  applyZoomDelta: (delta) => setZoom(z => z + delta),
  updateZoom: (updater) => setZoom(updater),
});

// Use spacePressed for pan mode
const isPanMode = panModeActive || spacePressed;
```

### useOverlayTransform

```typescript
const overlayTransform = useOverlayTransform({
  overlaySelectionBox: computedBox,
  selectModeActive: true,
  layerControls: myLayerControls,
  layerNodeRefs,
  scale: 1.5,
  stageRef,
  captureSelectionTransformState: selectionControls.captureSelectionTransformState,
  updateBoundsFromLayerIds: selectionControls.updateBoundsFromLayerIds,
  scheduleBoundsRefresh: selectionControls.scheduleBoundsRefresh,
  isSelectionTransformingRef: selectionControls.isSelectionTransformingRef,
  selectionTransformStateRef: selectionControls.selectionTransformStateRef,
  selectionProxyRotationRef: selectionControls.selectionProxyRotationRef,
});

// Use handlers on overlay
<div
  onPointerDown={overlayTransform.handleOverlayPointerDown}
  onPointerMove={overlayTransform.handleOverlayPointerMove}
  onPointerUp={overlayTransform.handleOverlayPointerUp}
/>
```

### usePanControls

```typescript
const panControls = usePanControls({
  panModeActive: true,
  spacePressed: false,
  selectModeActive: false,
});

// Access state
console.log(panControls.panOffset);
console.log(panControls.isPointerPanning);

// Use handlers on container
<div
  onPointerDown={panControls.handlePointerDown}
  onPointerMove={panControls.handlePointerMove}
  onPointerUp={panControls.handlePointerUp}
/>
```

### useZoomControls

```typescript
const zoomControls = useZoomControls({
  width: 1024,
  height: 1024,
  initialZoom: 0,
  containerRef,
  onZoomChange: (zoom) => console.log('Zoom changed:', zoom),
});

// Access state
console.log(zoomControls.scale);
console.log(zoomControls.internalZoom);

// Call methods
zoomControls.applyZoomDelta(10); // Zoom in
zoomControls.updateZoom(prev => prev + 5);
```

## Component Usage Examples

### LayerPanel

```typescript
<LayerPanel
  layerControls={myLayerControls}
  layerPanelRef={panelRef}
  layerButtonRef={buttonRef}
  isLayerPanelOpen={isOpen}
  setIsLayerPanelOpen={setIsOpen}
  copyFeedback={feedback}
  draggingLayerId={draggingId}
  setDraggingLayerId={setDraggingId}
  dragOverLayer={dragOver}
  setDragOverLayer={setDragOver}
  selectedLayerIds={selectedIds}
  primaryLayerId={primaryId}
  handleCopyLayer={async (id) => {/* ... */}}
  resolveDropPosition={(e) => e.clientY < 50 ? 'above' : 'below'}
  pendingSelectionRef={pendingRef}
/>
```

### SelectionTransformer

```typescript
<Layer listening={Boolean(selectedLayerIds.length > 0)}>
  <SelectionTransformer
    selectModeActive={true}
    selectedLayerBounds={bounds}
    selectedLayerIds={['layer-1', 'layer-2']}
    selectionTransformerRef={transformerRef}
    selectionProxyRef={proxyRef}
    handleSelectionProxyDragStart={onDragStart}
    handleSelectionProxyDragMove={onDragMove}
    handleSelectionProxyDragEnd={onDragEnd}
    handleTransformerTransformStart={onTransformStart}
    handleTransformerTransform={onTransform}
    handleTransformerTransformEnd={onTransformEnd}
    scale={1.5}
  />
</Layer>
```

### OverlaySelection

```typescript
{overlayBox && (
  <OverlaySelection
    box={overlayBox}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    onResizePointerDown={(dir, e) => console.log('Resize', dir)}
    onRotatePointerDown={handleRotateStart}
  />
)}
```

## Utility Function Examples

### Bounds Utilities

```typescript
// Validate bounds
const bounds = normaliseBounds({ x: 10, y: 20, width: 100, height: 50 });

// Compute node bounds
const nodeBounds = computeNodeBounds(konvaNode);

// Compare bounds
if (areBoundsEqual(bounds1, bounds2)) {
  console.log('Bounds are the same');
}

// Unify multiple bounds
const unified = unifyBounds([bounds1, bounds2, bounds3]);
```

### Calculation Utilities

```typescript
// Clamp zoom
const zoom = clampZoomValue(150, MIN_ZOOM, MAX_ZOOM);

// Calculate scale
const scale = calculateScaleFromZoom(
  zoom,
  containerWidth,
  containerHeight,
  canvasWidth,
  canvasHeight
);

// Touch gestures
const distance = getTouchDistance(event.touches);
const center = getTouchCenter(event.touches);
```

## Common Patterns

### Full Canvas Setup

```typescript
function MyCanvas() {
  // Refs
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layerNodeRefs = useRef<Map<string, Konva.Layer>>(new Map());

  // Zoom
  const zoom = useZoomControls({
    width: 1024,
    height: 1024,
    initialZoom: 0,
    containerRef,
  });

  // Pan
  const pan = usePanControls({
    panModeActive: true,
    spacePressed: keyboard.spacePressed,
  });

  // Keyboard
  const keyboard = useKeyboardControls({
    applyZoomDelta: zoom.applyZoomDelta,
    updateZoom: zoom.updateZoom,
  });

  // Selection
  const selection = useSelectionControls({
    selectModeActive: true,
    layerControls: myLayerControls,
    stageRef,
    layerNodeRefs,
    scale: zoom.scale,
  });

  // Layer panel
  const layerPanel = useLayerPanel({
    layerControls: myLayerControls,
  });

  return (
    <div ref={containerRef}>
      <LayerPanel
        {...layerPanel}
        selectedLayerIds={selection.selectedLayerIds}
        // ... other props
      />
      <Stage ref={stageRef}>
        {/* layers */}
        <Layer>
          <SelectionTransformer
            {...selection}
            scale={zoom.scale}
          />
        </Layer>
      </Stage>
    </div>
  );
}
```

### Handling Selection Changes

```typescript
// In a useEffect
useEffect(() => {
  if (newSelectionIds.length > 0) {
    selection.updateBoundsFromLayerIds(newSelectionIds);
    selection.syncTransformerToSelection();
  }
}, [newSelectionIds]);
```

### Handling Transform Operations

```typescript
// Start transform
const onTransformStart = () => {
  selection.captureSelectionTransformState();
  setIsTransforming(true);
};

// During transform
const onTransform = () => {
  selection.applySelectionTransformDelta();
  selection.scheduleBoundsRefresh();
};

// End transform
const onTransformEnd = () => {
  selection.finalizeSelectionTransformWithRotation();
  setIsTransforming(false);
};
```

## Troubleshooting

### Bounds not updating
```typescript
// Force refresh
selection.refreshBoundsFromSelection();

// Or schedule async refresh
selection.scheduleBoundsRefresh();
```

### Transformer not syncing
```typescript
// Manually sync
selection.syncTransformerToSelection();

// Ensure bounds are valid
if (selection.selectedLayerBounds) {
  selection.syncTransformerToSelection();
}
```

### Layer panel not closing
```typescript
// Check refs are properly connected
<button ref={layerPanel.layerButtonRef} />
<div ref={layerPanel.layerPanelRef} />

// Manually close
layerPanel.setIsLayerPanelOpen(false);
```

## Performance Tips

1. **Minimize re-renders**: Use `useCallback` and `useMemo` appropriately
2. **Batch updates**: Use `scheduleBoundsRefresh` instead of immediate updates
3. **Limit stage redraws**: Call `batchDraw()` instead of `draw()`
4. **Optimize bounds calculation**: Cache results when possible
5. **Virtual scrolling**: Implement for large layer lists

## Best Practices

1. **Always provide refs**: Most hooks require refs to function correctly
2. **Handle cleanup**: Hooks handle cleanup, but ensure proper unmounting
3. **Type safety**: Use TypeScript interfaces for all props
4. **Error boundaries**: Wrap canvas in error boundary for robustness
5. **Testing**: Test hooks independently before integrating

## Common Gotchas

1. **Stale closures**: Use refs for values accessed in callbacks
2. **Async state updates**: React state updates are async, plan accordingly
3. **Touch events**: Remember to call `preventDefault()` on touch events
4. **Scale calculations**: Always check for division by zero
5. **Konva lifecycle**: Ensure nodes exist before accessing properties

---

For detailed documentation, see:
- `ARCHITECTURE.md` - Technical architecture
- `REFACTORIZATION.md` - Migration guide
- `SUMMARY.md` - Complete overview
