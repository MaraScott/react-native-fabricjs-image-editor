import { useRef } from 'react';
import { Group, Line as LineShape, Transformer as TransformerShape } from 'react-konva';
import type { KonvaEventObject } from '../../types/konva';
import type { PencilElement } from '../../types/editor';
import { getPencilStrokes } from '../../utils/editorElements';
import {
  TRANSFORMER_PROPS,
  shouldListen,
  useApplyZIndex,
  useAttachTransformer,
  type BaseNodeProps,
} from './common';

export function PencilNode({
  shape,
  isSelected,
  selectionEnabled,
  onSelect,
  onChange,
  dragBoundFunc,
  zIndex,
}: BaseNodeProps<PencilElement>) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useAttachTransformer(isSelected, selectionEnabled, shapeRef, transformerRef);
  useApplyZIndex(zIndex, shapeRef);

  const draggable = selectionEnabled && shape.draggable && !shape.locked;
  const strokes = getPencilStrokes(shape);

  return (
    <>
      <Group
        ref={shapeRef}
        x={shape.x}
        y={shape.y}
        rotation={shape.rotation}
        opacity={shape.opacity}
        visible={shape.visible}
        draggable={draggable}
        dragBoundFunc={dragBoundFunc}
        listening={shouldListen(draggable, shape.visible)}
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
          const nextStrokes = strokes.map((stroke) => ({
            ...stroke,
            points: stroke.points.map((value, index) => (index % 2 === 0 ? value * scaleX : value * scaleY)),
          }));
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            strokes: nextStrokes,
            points: nextStrokes[nextStrokes.length - 1]?.points ?? shape.points,
          });
        }}
      >
        {strokes.map((stroke) => (
          <LineShape
            key={stroke.id}
            points={stroke.points}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            lineCap={shape.lineCap}
            lineJoin={shape.lineJoin}
            tension={0.4}
            listening={shouldListen(draggable, shape.visible)}
          />
        ))}
      </Group>
      {isSelected && selectionEnabled && (
        <TransformerShape ref={transformerRef} {...TRANSFORMER_PROPS} />
      )}
    </>
  );
}
