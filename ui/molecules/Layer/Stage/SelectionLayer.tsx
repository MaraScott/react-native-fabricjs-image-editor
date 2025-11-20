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
import { useEffect } from 'react';
import { selectSelectionTransform } from '@store/CanvasApp/view/selectors';

/**
 * SelectionLayer component props
 */
export interface SelectionLayerProps {
  selectModeActive: boolean;
  scaleX: number;
  scaleY: number;
  stageViewportOffsetX: number;
  stageViewportOffsetY: number;
  borderDash: number[];
  padding: number;

  hasSelection: boolean;
  isInteracting: boolean;
  selectionProxyRef: MutableRefObject<Konva.Rect | null>;
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
  stageViewportOffsetX,
  stageViewportOffsetY,
  padding,
  borderDash,

  hasSelection,
  isInteracting,
  selectionProxyRef,
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
  // Only log when selectionTransform changes, not on every render
  useEffect(() => {
    if (isInteracting && selectionTransform) {
      // eslint-disable-next-line no-console
      console.log('SelectionLayer selectionTransform (dragging):', selectionTransform);
    } else if (!isInteracting && selectionTransform) {
      // eslint-disable-next-line no-console
      console.log('SelectionLayer selectionTransform (idle):', selectionTransform);
    }
  }, [selectionTransform, isInteracting]);

  if (!selectModeActive) {
    return null;
  }

  // Guard: Don't render selection proxy if selectionTransform is not defined
  return (
    <Layer 
        key="selection-layer"
      listening={true}
      scaleX={scaleX}
      scaleY={scaleY}
    >
      {/* Debug: Always visible indicator */}
      <Rect
        key="debug-lime-indicator"
        x={stageViewportOffsetX}
        y={stageViewportOffsetY}
        width={30}
        height={30}
        fill="lime"
        stroke="black"
        strokeWidth={2}
      />
      {/* Debug: Test red rectangle at same position as lime square */}
      <Rect
        x={stageViewportOffsetX + 50}
        y={stageViewportOffsetY + 10}
        width={100}
        height={100}
        fill="red"
        stroke="black"
        strokeWidth={2}
      />
      {/* Use Redux selectionTransform for the proxy */}
      {(selectionTransform || true) ? (
        <Rect
          key="selection-proxy"
          ref={selectionProxyRef}
          x={selectionTransform?.x || 0}
          y={selectionTransform?.y || 0}
          width={selectionTransform?.width || 20}
          height={selectionTransform?.height || 20}
        //   rotation={selectionTransform?.rotation || 0}
        //   scaleX={selectionTransform?.scaleX || 0}
        //   scaleY={selectionTransform?.scaleY || 0}
          opacity={1}
          fill="red"
          stroke="blue"
          strokeWidth={2}
          strokeEnabled={true}
          listening={hasSelection}
          draggable
          perfectDrawEnabled={false}
          onDragStart={onProxyDragStart}
          onDragMove={onProxyDragMove}
          onDragEnd={onProxyDragEnd}
        />
      ) : null}
      <Transformer
        key="selection-transformer"
        ref={transformerRef}
        rotateEnabled
        resizeEnabled
        visible={Boolean(
          (isInteracting || hasSelection) &&
          hasSelection && selectionTransform
        )}
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
