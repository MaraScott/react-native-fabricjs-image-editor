/**
 * Atomic Design - Molecule: KonvaSelectionBox
 * Konva-based selection box with resize and rotate handles
 * Used inside the Stage instead of HTML overlay
 */

import React, { useRef, useEffect } from 'react';
import { Group, Rect, Circle, Line } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';

export type KonvaOverlayBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

export interface KonvaSelectionBoxProps {
  box: KonvaOverlayBox;
  onPointerDown?: (e: KonvaEventObject<PointerEvent>) => void;
  onPointerMove?: (e: KonvaEventObject<PointerEvent>) => void;
  onPointerUp?: (e: KonvaEventObject<PointerEvent>) => void;
  onResizePointerDown?: (direction: string, e: KonvaEventObject<PointerEvent>) => void;
  onRotatePointerDown?: (e: KonvaEventObject<PointerEvent>) => void;
}

/**
 * KonvaSelectionBox Molecule - Renders a selection box with transform handles in Konva
 * All handles are Konva shapes for proper event handling
 */
export const KonvaSelectionBox = ({
  box,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onResizePointerDown,
  onRotatePointerDown,
}: KonvaSelectionBoxProps): JSX.Element => {
  const { x, y, width, height, rotation = 0 } = box;

  const handleSize = 12;
  const rotateHandleDistance = 40;
  const groupRef = useRef<Konva.Group>(null);

  useEffect(() => {
    if (groupRef.current) {
      const group = groupRef.current;
      console.log('[DEBUG KonvaSelectionBox useEffect] Group mounted/updated');
      console.log('[DEBUG KonvaSelectionBox useEffect] Group position:', group.position());
      console.log('[DEBUG KonvaSelectionBox useEffect] Group size:', { width: group.width(), height: group.height() });
      console.log('[DEBUG KonvaSelectionBox useEffect] Group rotation:', group.rotation());
      console.log('[DEBUG KonvaSelectionBox useEffect] Group offset:', group.offset());
      console.log('[DEBUG KonvaSelectionBox useEffect] Group absoluteTransform:', group.getAbsoluteTransform().m);
      console.log('[DEBUG KonvaSelectionBox useEffect] Group visible:', group.visible());
      console.log('[DEBUG KonvaSelectionBox useEffect] Group opacity:', group.opacity());
      console.log('[DEBUG KonvaSelectionBox useEffect] Group listening:', group.listening());
      const stage = group.getStage();
      if (stage) {
        console.log('[DEBUG KonvaSelectionBox useEffect] Stage size:', { width: stage.width(), height: stage.height() });
      }
    }
  });

  console.log('[DEBUG KonvaSelectionBox] Rendering with props:', {
    x, y, width, height, rotation,
    handleSize, rotateHandleDistance
  });
  console.log('[DEBUG KonvaSelectionBox] Group props:', {
    x, y, width, height, rotation,
    offsetX: width / 2,
    offsetY: height / 2
  });

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      width={width}
      height={height}
      rotation={rotation}
      offsetX={width / 2}
      offsetY={height / 2}
    >
      {/* Selection border rectangle */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        stroke="#00f6ff"
        strokeWidth={2}
        dash={[10, 5]}
        listening={true}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />

      {/* Corner resize handles */}
      <Circle
        x={0}
        y={0}
        radius={handleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={2}
        draggable={false}
        onPointerDown={(e) => onResizePointerDown?.('nw', e)}
      />
      <Circle
        x={width}
        y={0}
        radius={handleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={2}
        draggable={false}
        onPointerDown={(e) => onResizePointerDown?.('ne', e)}
      />
      <Circle
        x={0}
        y={height}
        radius={handleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={2}
        draggable={false}
        onPointerDown={(e) => onResizePointerDown?.('sw', e)}
      />
      <Circle
        x={width}
        y={height}
        radius={handleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={2}
        draggable={false}
        onPointerDown={(e) => onResizePointerDown?.('se', e)}
      />

      {/* Edge resize handles */}
      <Circle
        x={width / 2}
        y={0}
        radius={handleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={2}
        draggable={false}
        onPointerDown={(e) => onResizePointerDown?.('n', e)}
      />
      <Circle
        x={width}
        y={height / 2}
        radius={handleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={2}
        draggable={false}
        onPointerDown={(e) => onResizePointerDown?.('e', e)}
      />
      <Circle
        x={width / 2}
        y={height}
        radius={handleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={2}
        draggable={false}
        onPointerDown={(e) => onResizePointerDown?.('s', e)}
      />
      <Circle
        x={0}
        y={height / 2}
        radius={handleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={2}
        draggable={false}
        onPointerDown={(e) => onResizePointerDown?.('w', e)}
      />

      {/* Rotate handle (line + circle above top center) */}
      <Line
        points={[width / 2, 0, width / 2, -rotateHandleDistance]}
        stroke="#00f6ff"
        strokeWidth={2}
        listening={false}
      />
      <Circle
        x={width / 2}
        y={-rotateHandleDistance}
        radius={handleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={2}
        draggable={false}
        onPointerDown={onRotatePointerDown}
      />
    </Group>
  );
};

KonvaSelectionBox.displayName = 'KonvaSelectionBox';

export default KonvaSelectionBox;
