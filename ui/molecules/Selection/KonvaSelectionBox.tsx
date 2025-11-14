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
  stageScale?: number; // Stage's current scale for inverse scaling
  children?: React.ReactNode; // Element content to include in the Group
  onPointerDown?: (e: KonvaEventObject<PointerEvent>) => void;
  onPointerMove?: (e: KonvaEventObject<PointerEvent>) => void;
  onPointerUp?: (e: KonvaEventObject<PointerEvent>) => void;
  onResizePointerDown?: (direction: string, e: KonvaEventObject<PointerEvent>) => void;
  onRotatePointerDown?: (e: KonvaEventObject<PointerEvent>) => void;
}

/**
 * KonvaSelectionBox Molecule - Renders a unified Group containing:
 * 1. Selection UI (border, handles)
 * 2. Element content (passed as children)
 * All transformations apply to the Group, affecting both UI and content together
 */
export const KonvaSelectionBox = (props: KonvaSelectionBoxProps): JSX.Element => {
  
  const {
    box,
    stageScale = 1,
    children,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onResizePointerDown,
    onRotatePointerDown,
  } = props;
  
  const { x, y, width, height, rotation = 0 } = box;

  const handleSize = 16;
  const rotateHandleDistance = 50;
  const groupRef = useRef<Konva.Group>(null);
  
  
  // Apply inverse scale to compensate for Stage scale
  // This keeps the selection box UI at 1:1 screen scale
  const inverseScale = 1 / stageScale;
  

  useEffect(() => {
    if (groupRef.current) {
      const group = groupRef.current;
      const stage = group.getStage();
      if (stage) {
      }
    }
  });
  
  // Position the Group at center (like the Transformer proxy) with offset
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Scale UI elements (handles, stroke) by inverse scale to maintain screen size
  const uiStrokeWidth = 6 * inverseScale;
  const uiHandleSize = handleSize * inverseScale;
  const uiRotateDistance = rotateHandleDistance * inverseScale;

  return (
    <Group
      ref={groupRef}
      x={centerX}
      y={centerY}
      offsetX={width / 2}
      offsetY={height / 2}
      width={width}
      height={height}
      rotation={rotation}
    >
      {/* Selection border rectangle - positioned relative to center due to Group offset */}
      <Rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        fill="rgba(255, 0, 0, 0.8)"
        stroke="#ff0000"
        strokeWidth={uiStrokeWidth}
        dash={[10 * inverseScale, 5 * inverseScale]}
        listening={true}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        shadowColor="rgba(0, 0, 0, 0.5)"
        shadowBlur={10 * inverseScale}
        shadowOffsetX={0}
        shadowOffsetY={0}
      />

      {/* Corner resize handles - positioned relative to center */}
      <Circle
        x={-width / 2}
        y={-height / 2}
        radius={uiHandleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={3 * inverseScale}
        draggable={false}
        listening={true}
        onPointerDown={(e) => onResizePointerDown?.('nw', e)}
      />
      <Circle
        x={width / 2}
        y={-height / 2}
        radius={uiHandleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={3 * inverseScale}
        draggable={false}
        listening={true}
        onPointerDown={(e) => onResizePointerDown?.('ne', e)}
      />
      <Circle
        x={-width / 2}
        y={height / 2}
        radius={uiHandleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={3 * inverseScale}
        draggable={false}
        listening={true}
        onPointerDown={(e) => onResizePointerDown?.('sw', e)}
      />
      <Circle
        x={width / 2}
        y={height / 2}
        radius={uiHandleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={3 * inverseScale}
        draggable={false}
        listening={true}
        onPointerDown={(e) => onResizePointerDown?.('se', e)}
      />

      {/* Edge resize handles */}
      <Circle
        x={0}
        y={-height / 2}
        radius={uiHandleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={3 * inverseScale}
        draggable={false}
        listening={true}
        onPointerDown={(e) => onResizePointerDown?.('n', e)}
      />
      <Circle
        x={width / 2}
        y={0}
        radius={uiHandleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={3 * inverseScale}
        draggable={false}
        listening={true}
        onPointerDown={(e) => onResizePointerDown?.('e', e)}
      />
      <Circle
        x={0}
        y={height / 2}
        radius={uiHandleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={3 * inverseScale}
        draggable={false}
        listening={true}
        onPointerDown={(e) => onResizePointerDown?.('s', e)}
      />
      <Circle
        x={-width / 2}
        y={0}
        radius={uiHandleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={3 * inverseScale}
        draggable={false}
        listening={true}
        onPointerDown={(e) => onResizePointerDown?.('w', e)}
      />

      {/* Rotate handle (line + circle above top center) */}
      <Line
        points={[0, -height / 2, 0, -height / 2 - uiRotateDistance]}
        stroke="#00f6ff"
        strokeWidth={3 * inverseScale}
        listening={false}
      />
      <Circle
        x={0}
        y={-height / 2 - uiRotateDistance}
        radius={uiHandleSize / 2}
        fill="#00f6ff"
        stroke="#ffffff"
        strokeWidth={3 * inverseScale}
        draggable={false}
        listening={true}
        onPointerDown={onRotatePointerDown}
      />

      {/* Element content - rendered inside the Group */}
      {children && (
        <Group x={0} y={0}>
          {children}
        </Group>
      )}
    </Group>
  );
};

KonvaSelectionBox.displayName = 'KonvaSelectionBox';

export default KonvaSelectionBox;
