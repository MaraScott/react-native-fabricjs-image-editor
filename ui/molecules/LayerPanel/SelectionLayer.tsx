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
  key?: string;
  /**
   * Whether selection mode is active
   */
  selectModeActive: boolean;
  /**
   * Scale factor (inverse of stage scale)
   */
  scaleX: number;
  /**
   * Scale factor (inverse of stage scale)
   */
  scaleY: number;
  /**
   * Stage viewport X offset for debug indicators
   */
  stageViewportOffsetX: number;
  /**
   * Stage viewport Y offset for debug indicators
   */
  stageViewportOffsetY: number;
  /**
   * Whether selection has valid bounds
   */
  hasSelection: boolean;
  /**
   * Whether user is interacting with selection
   */
  isInteracting: boolean;
  /**
   * Ref for selection proxy rectangle
   */
  selectionProxyRef: MutableRefObject<Konva.Rect | null>;
  /**
   * Ref for transformer
   */
  transformerRef: MutableRefObject<Konva.Transformer | null>;
  /**
   * Transformer anchor size
   */
  anchorSize: number;
  /**
   * Transformer anchor corner radius
   */
  anchorCornerRadius: number;
  /**
   * Transformer anchor stroke width
   */
  anchorStrokeWidth: number;
  /**
   * Transformer hit stroke width
   */
  hitStrokeWidth: number;
  /**
   * Border dash array
   */
  borderDash: number[];
  /**
   * Transformer padding
   */
  padding: number;
  /**
   * Selection proxy drag start handler
   */
  onProxyDragStart?: (event: KonvaEventObject<DragEvent>) => void;
  /**
   * Selection proxy drag move handler
   */
  onProxyDragMove?: (event: KonvaEventObject<DragEvent>) => void;
  /**
   * Selection proxy drag end handler
   */
  onProxyDragEnd?: (event: KonvaEventObject<DragEvent>) => void;
  /**
   * Transformer transform start handler
   */
  onTransformStart?: (event: KonvaEventObject<Event>) => void;
  /**
   * Transformer transform handler
   */
  onTransform?: (event: KonvaEventObject<Event>) => void;
  /**
   * Transformer transform end handler
   */
  onTransformEnd?: (event: KonvaEventObject<Event>) => void;
  /**
   * Live data for selected layers (x, y, rotation, scale, width, height)
   */
  // No longer needed: selectedLayerLiveData
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
  hasSelection,
  isInteracting,
  selectionProxyRef,
  transformerRef,
  anchorSize,
  anchorCornerRadius,
  anchorStrokeWidth,
  hitStrokeWidth,
  borderDash,
  padding,
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
      listening={true}
      scaleX={scaleX}
      scaleY={scaleY}
    >
      {/* Debug: Always visible indicator */}
      <Rect
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
      {selectionTransform ? (
        <Rect
          ref={selectionProxyRef}
          x={selectionTransform.x}
          y={selectionTransform.y}
          width={selectionTransform.width}
          height={selectionTransform.height}
          rotation={selectionTransform.rotation}
          scaleX={selectionTransform.scaleX}
          scaleY={selectionTransform.scaleY}
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
