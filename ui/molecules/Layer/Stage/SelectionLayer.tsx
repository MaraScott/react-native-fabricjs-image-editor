/**
 * Atomic Design - Organism: SelectionLayer
 * 
 * Renders the selection and transform layer with Transformer and selection proxy
 */

import { Layer, Rect, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { MutableRefObject } from 'react';
import { useSelector } from 'react-redux';
import { selectSelectionTransform } from '@store/CanvasApp/view/selectors';
import { useSimpleCanvasStore } from '@store/SimpleCanvas';

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
  scaleX: number;
  scaleY: number;
  selectionRect: SelectionRect | null;
  borderDash: number[];
  padding: number;
  transformerRef: MutableRefObject<Konva.Transformer | null>;
  anchorSize: number;
  anchorCornerRadius: number;
  anchorStrokeWidth: number;
  hitStrokeWidth: number;
  onProxyDragStart?: (event: KonvaEventObject<DragEvent>) => void;
  onProxyDragMove?: (event: KonvaEventObject<DragEvent>) => void;
  onProxyDragEnd?: (event: KonvaEventObject<DragEvent>) => void;
  onTransformStart?: (event: KonvaEventObject<Event>) => void;
  onTransform?: (event: KonvaEventObject<Event>) => void;
  onTransformEnd?: (event: KonvaEventObject<Event>) => void;
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
  scaleX,
  scaleY,
  selectionRect,
  padding,
  borderDash,
  transformerRef,
  anchorSize,
  anchorCornerRadius,
  anchorStrokeWidth,
  hitStrokeWidth,
  onProxyDragStart,
  onProxyDragMove,
  onProxyDragEnd,
  onTransformStart,
  onTransform,
  onTransformEnd,
}: SelectionLayerProps) => {
  // Read selectionTransform from Redux
  const selectionTransform = useSelector(selectSelectionTransform);
  const layerControls = useSimpleCanvasStore((state) => state.layerControls);
  const storeSelectedLayerIds = layerControls?.selectedLayerIds ?? EMPTY_SELECTED_IDS;
  const shouldRenderSelection = storeSelectedLayerIds.length > 0;
  const sharedSelectionRect: SelectionRect | null = selectionRect ?? (selectionTransform ?? null);
  console.log('SelectionLayer render', { selectModeActive, selectionRect, shouldRenderSelection, sharedSelectionRect, render: (shouldRenderSelection && sharedSelectionRect !== null) });

  if (!selectModeActive) {
    return null;
  }

  // Guard: Don't render selection proxy if selectionTransform is not defined
  return (
    <Layer 
        key="selection-layer"
        listening={true}
        // scaleX={scaleX}
        // scaleY={scaleY}
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
          stroke="blue"
          strokeWidth={2}
          strokeEnabled={true}
          listening={false}
          draggable
          perfectDrawEnabled={false}
        //   onDragStart={onProxyDragStart}
        //   onDragMove={onProxyDragMove}
        //   onDragEnd={onProxyDragEnd}
        />
      ) : null}
      <Transformer
        key="selection-transformer"
        ref={transformerRef}
        rotateEnabled
        resizeEnabled
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
        ignoreStroke={false}
        onTransformStart={onTransformStart}
        onTransform={onTransform}
        onTransformEnd={onTransformEnd}
      />
    </Layer>
  );
};
