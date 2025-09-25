import { Line as LineShape } from 'react-konva';
import type { KonvaEventObject, Vector2d } from '../../types/konva';
import type { GuideElement } from '../../types/editor';
import type { BaseNodeProps } from './common';

export function GuideNode({ shape, isSelected, selectionEnabled, onSelect, onChange }: BaseNodeProps<GuideElement>) {
  const orientation = shape.orientation;
  const draggable = selectionEnabled && !shape.locked;

  const dragBound = (position: Vector2d) => {
    if (orientation === 'horizontal') {
      return { x: shape.x, y: position.y };
    }
    return { x: position.x, y: shape.y };
  };

  return (
    <LineShape
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
      onClick={onSelect}
      onTap={onSelect}
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
