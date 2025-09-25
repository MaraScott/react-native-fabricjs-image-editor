import { useRef } from 'react';
import { Line as LineShape, Transformer as TransformerShape } from 'react-konva';
import type { KonvaEventObject } from '../../types/konva';
import type { LineElement } from '../../types/editor';
import {
  TRANSFORMER_PROPS,
  shouldListen,
  useAttachTransformer,
  type BaseNodeProps,
} from './common';

export function LineNode({
  shape,
  isSelected,
  selectionEnabled,
  onSelect,
  onChange,
  dragBoundFunc,
}: BaseNodeProps<LineElement>) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useAttachTransformer(isSelected, selectionEnabled, shapeRef, transformerRef);

  const draggable = selectionEnabled && shape.draggable && !shape.locked;

  return (
    <>
      <LineShape
        ref={shapeRef}
        x={shape.x}
        y={shape.y}
        points={shape.points}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        opacity={shape.opacity}
        rotation={shape.rotation}
        visible={shape.visible}
        dash={shape.dash}
        draggable={draggable}
        dragBoundFunc={dragBoundFunc}
        listening={shouldListen(draggable, shape.visible)}
        lineCap="round"
        lineJoin="round"
        tension={shape.tension ?? 0}
        closed={shape.closed}
        fill={shape.fill}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(event: KonvaEventObject<DragEvent>) => {
          onChange({ x: event.target.x(), y: event.target.y() });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          const nextPoints = node
            .points()
            .map((value, index) => (index % 2 === 0 ? value * scaleX : value * scaleY));
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            points: nextPoints,
          });
        }}
      />
      {isSelected && selectionEnabled && (
        <TransformerShape ref={transformerRef} {...TRANSFORMER_PROPS} />
      )}
    </>
  );
}
