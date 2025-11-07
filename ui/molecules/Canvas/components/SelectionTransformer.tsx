/**
 * SelectionTransformer Component
 * Manages the Konva Transformer and proxy Rect for layer selection
 */

import { Rect, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { Bounds } from '../types/canvas.types';

interface SelectionTransformerProps {
  selectModeActive: boolean;
  selectedLayerBounds: Bounds | null;
  selectedLayerIds: string[];
  selectionTransformerRef: React.RefObject<Konva.Transformer>;
  selectionProxyRef: React.RefObject<Konva.Rect>;
  handleSelectionProxyDragStart: () => void;
  handleSelectionProxyDragMove: () => void;
  handleSelectionProxyDragEnd: () => void;
  handleTransformerTransformStart: () => void;
  handleTransformerTransform: () => void;
  handleTransformerTransformEnd: () => void;
  scale: number;
}

export const SelectionTransformer = ({
  selectModeActive,
  selectedLayerBounds,
  selectedLayerIds,
  selectionTransformerRef,
  selectionProxyRef,
  handleSelectionProxyDragStart,
  handleSelectionProxyDragMove,
  handleSelectionProxyDragEnd,
  handleTransformerTransformStart,
  handleTransformerTransform,
  handleTransformerTransformEnd,
  scale,
}: SelectionTransformerProps) => {
  if (!selectModeActive) {
    return null;
  }

  const safeScale = Math.max(scale, 0.0001);
  const outlineDash: [number, number] = [8 / safeScale, 4 / safeScale];
  const transformerAnchorSize = Math.max(8 / safeScale, 6);
  const transformerAnchorStrokeWidth = Math.max(1 / safeScale, 0.75);
  const transformerAnchorCornerRadius = Math.max(2 / safeScale, 1);
  const transformerPadding = 0;
  const transformerHitStrokeWidth = Math.max(12 / safeScale, 6);

  return (
    <>
      <Rect
        ref={selectionProxyRef}
        x={0}
        y={0}
        width={0}
        height={0}
        opacity={0.001}
        fill="#ffffff"
        strokeEnabled={false}
        listening={Boolean(selectedLayerBounds && selectedLayerIds.length > 0)}
        draggable
        perfectDrawEnabled={false}
        onDragStart={handleSelectionProxyDragStart}
        onDragMove={handleSelectionProxyDragMove}
        onDragEnd={handleSelectionProxyDragEnd}
      />
      <Transformer
        ref={selectionTransformerRef}
        rotateEnabled
        resizeEnabled
        visible={Boolean(selectedLayerBounds && selectedLayerIds.length > 0)}
        anchorSize={transformerAnchorSize}
        anchorCornerRadius={transformerAnchorCornerRadius}
        anchorStroke="#00f6ff"
        anchorFill="#00f6ff"
        anchorStrokeWidth={transformerAnchorStrokeWidth}
        anchorHitStrokeWidth={transformerHitStrokeWidth}
        borderStroke="#00f6ff"
        borderStrokeWidth={transformerAnchorStrokeWidth}
        borderDash={outlineDash}
        padding={transformerPadding}
        ignoreStroke={false}
        onTransformStart={handleTransformerTransformStart}
        onTransform={handleTransformerTransform}
        onTransformEnd={handleTransformerTransformEnd}
      />
    </>
  );
};
