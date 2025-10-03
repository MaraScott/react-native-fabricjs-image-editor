import { useRef } from 'react';
import { Line as LineShape } from 'react-konva';
import type { KonvaEventObject, Vector2d } from '@types/konva';
import type { GuideElement } from '@types/editor';
import { useApplyZIndex, type BaseNodeProps } from '@atoms/konva/nodes/common';

export function GuideNode({
  shape,
  isSelected,
  selectionEnabled,
  onSelect,
  onChange,
  zIndex,
}: BaseNodeProps<GuideElement>) {
  const shapeRef = useRef<any>(null);
  const orientation = shape.orientation;
  const draggable = selectionEnabled && !shape.locked;

  const dragBound = (position: Vector2d) => {
    if (orientation === 'horizontal') {
      return { x: shape.x, y: position.y };
    }
    return { x: position.x, y: shape.y };
  };

  useApplyZIndex(zIndex, shapeRef);

  return (
    <LineShape
      ref={shapeRef}
      x={shape.x}
      y={shape.y}
      points={orientation === 'horizontal' ? [0, 0, shape.length, 0] : [0, 0, 0, shape.length]}
      stroke={shape.stroke}
      strokeWidth={shape.strokeWidth}
      dash={[8, 8]}
      opacity={shape.opacity}
      visible={shape.visible}
      listening={selectionEnabled}
      draggable={draggable}
      dragBoundFunc={dragBound}
      onClick={(event: KonvaEventObject<MouseEvent>) => {
        onSelect(event);
        event.cancelBubble = true;
      }}
      onTap={(event: KonvaEventObject<TouchEvent>) => {
        onSelect(event);
        event.cancelBubble = true;
      }}
      shadowColor={isSelected ? '#38bdf8' : undefined}
      shadowBlur={isSelected ? 6 : 0}
      onDragEnd={(event: KonvaEventObject<DragEvent>) => {
        if (orientation === 'horizontal') {
          onChange({ y: event.target.y() });
        } else {
          onChange({ x: event.target.x() });
        }
      }}
    />
  );
}
