/**
 * Atomic Design - Organism: SelectionLayer
 * 
 * Renders the selection and transform layer with Transformer and selection proxy
 */

import { Layer, Rect, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { MutableRefObject, DragEvent } from 'react';
import { useSelector } from 'react-redux';
import { selectSelectionTransform } from '@store/CanvasApp/view/selectors';
import { useSimpleCanvasStore } from '@store/SimpleCanvas';
import type { Bounds } from '@molecules/Canvas/types/canvas.types';

const EMPTY_SELECTED_IDS: string[] = [];

type SelectionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
};

/**
 * SelectionLayer component props
 */
export interface SelectionLayerProps {
  selectModeActive: boolean;
  borderDash: number[];
  padding: number;
  transformerRef: MutableRefObject<Konva.Transformer | null>;
  layerRef?: MutableRefObject<Konva.Layer | null>;
  anchorSize: number;
  anchorCornerRadius: number;
  anchorStrokeWidth: number;
  hitStrokeWidth: number;
  stageRef: MutableRefObject<Konva.Stage | null>;
  selectedLayerBounds: Bounds | null;
  captureSelectionTransformState: () => void;
  applySelectionTransformDelta: () => void;
  syncSelectedLayerNodeRefs: () => void;
  commitSelectedLayerNodeTransforms: () => void;
  scheduleBoundsRefresh: () => void;
  initializeSelectionTransform: (bounds: Bounds | null) => void;
  markSelectionTransforming: (flag: boolean) => void;
}

/**
 * SelectionLayer component
 * 
 * Renders the selection layer with transformer and proxy for multi-layer transforms
 * 
 * @param {SelectionLayerProps} props - Component props
 * @returns {JSX.Element | null} Layer element with selection tools or null if not active
 */
export const SelectionLayer = ({
  selectModeActive,
  padding,
  borderDash,
  transformerRef,
  anchorSize,
  anchorCornerRadius,
  anchorStrokeWidth,
  hitStrokeWidth,
  layerRef,
  stageRef,
  selectedLayerBounds,
  captureSelectionTransformState,
  applySelectionTransformDelta,
  syncSelectedLayerNodeRefs,
  commitSelectedLayerNodeTransforms,
  scheduleBoundsRefresh,
  initializeSelectionTransform,
  markSelectionTransforming,
}: SelectionLayerProps) => {
  // Read selectionTransform from Redux
  const selectionTransform = useSelector(selectSelectionTransform);
  const layerControls = useSimpleCanvasStore((state) => state.layerControls);
  const storeSelectedLayerIds = layerControls?.selectedLayerIds ?? EMPTY_SELECTED_IDS;
  const isTextOnlySelection = storeSelectedLayerIds.length > 0
    ? storeSelectedLayerIds.every((id) => {
        const layer = layerControls?.layers.find((l) => l.id === id);
        return Boolean(layer && (layer.texts?.length ?? 0) > 0);
      })
    : false;
  const shouldRenderSelection = storeSelectedLayerIds.length > 0 && Boolean(selectionTransform);
  const sharedSelectionRect: SelectionRect | null = selectionTransform ?? null;

  const handleProxyDragStart = (event: KonvaEventObject<DragEvent>) => {
    if (!selectModeActive) return;
    markSelectionTransforming(true);
    captureSelectionTransformState();
    const stage = stageRef.current;
    if (stage) {
      stage.container().style.cursor = 'grabbing';
    }
    initializeSelectionTransform(selectedLayerBounds);
  };

  const handleProxyDragMove = (event: KonvaEventObject<DragEvent>) => {
    if (!selectModeActive) return;
    applySelectionTransformDelta();
    scheduleBoundsRefresh();
  };

  const handleProxyDragEnd = (event: KonvaEventObject<DragEvent>) => {
    if (!selectModeActive) return;
    applySelectionTransformDelta();
    const stage = stageRef.current;
    if (stage) {
      stage.container().style.cursor = 'pointer';
    }
  };

  const handleTransformStart = (event: KonvaEventObject<Event>) => {
    markSelectionTransforming(true);
    captureSelectionTransformState();
    syncSelectedLayerNodeRefs();
  };

  const handleTransform = (event: KonvaEventObject<Event>) => {
    applySelectionTransformDelta();
    syncSelectedLayerNodeRefs();
    scheduleBoundsRefresh();
  };

  const handleTransformEnd = (event: KonvaEventObject<Event>) => {
    applySelectionTransformDelta();
    syncSelectedLayerNodeRefs();
    commitSelectedLayerNodeTransforms();
  };

  if (!selectModeActive) {
    return null;
  }

  // Guard: Don't render selection proxy if selectionTransform is not defined
  return (
    <Layer 
        key="selection-layer"
        listening={true}
        ref={layerRef}
    >
      {shouldRenderSelection && sharedSelectionRect !== null ? (
        <Rect
          key="selection-proxy"
          x={sharedSelectionRect.x ?? 0}
          y={sharedSelectionRect.y ?? 0}
          width={sharedSelectionRect.width ?? 20}
          height={sharedSelectionRect.height ?? 20}
          rotation={sharedSelectionRect.rotation ?? 0}
          scaleX={sharedSelectionRect.scaleX ?? 1}
          scaleY={sharedSelectionRect.scaleY ?? 1}
          opacity={1}
          fill="transparent"
          stroke="#00f6ff"
          strokeWidth={2}
          dash={[10, 10]}
          strokeEnabled={true}
          listening={true}
          draggable
          perfectDrawEnabled={false}
          onDragStart={handleProxyDragStart}
          onDragMove={handleProxyDragMove}
          onDragEnd={handleProxyDragEnd}
        />
      ) : null}
      <Transformer
        key="selection-transformer"
        ref={transformerRef}
        rotateEnabled
        resizeEnabled={!isTextOnlySelection}
        visible={Boolean(shouldRenderSelection && sharedSelectionRect)}
        anchorSize={anchorSize}
        anchorCornerRadius={anchorCornerRadius}
        anchorStroke="#00f6ff"
        anchorFill="#00f6ff"
        anchorStrokeWidth={anchorStrokeWidth}
        anchorHitStrokeWidth={hitStrokeWidth}
        borderStroke="#00f6ff"
        borderStrokeWidth={anchorStrokeWidth}
        borderDash={borderDash}
        padding={padding}
        // Default to keeping aspect ratio; hold Shift to temporarily unlock (Konva inverted behavior).
        keepRatio={true}
        shiftBehavior="inverted"
        ignoreStroke={false}
        // keep handles from scaling with stage zoom
        enabledAnchors={
          isTextOnlySelection
            ? []
            : [
                'top-left',
                'top-center',
                'top-right',
                'middle-left',
                'middle-right',
                'bottom-left',
                'bottom-center',
                'bottom-right',
              ]
        }
        onTransformStart={handleTransformStart}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
      />
    </Layer>
  );
};
