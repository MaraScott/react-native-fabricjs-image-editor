import { useRef } from 'react';
import { Group as GroupShape, Line as LineShape, Transformer as TransformerShape } from 'react-konva';
import type { KonvaEventObject } from '../../types/konva';
import type { PencilElement, PencilStroke } from '../../types/editor';
import {
  TRANSFORMER_PROPS,
  shouldListen,
  useApplyZIndex,
  useAttachTransformer,
  type BaseNodeProps,
} from './common';

function getStrokeList(shape: PencilElement): PencilStroke[] {
  if (Array.isArray(shape.strokes) && shape.strokes.length > 0) {
    return shape.strokes.map((stroke) => ({
      points: Array.isArray(stroke.points) ? [...stroke.points] : [...shape.points],
      stroke: stroke.stroke ?? shape.stroke,
      strokeWidth:
        typeof stroke.strokeWidth === 'number' && Number.isFinite(stroke.strokeWidth)
          ? stroke.strokeWidth
          : shape.strokeWidth,
    }));
  }
  return [
    {
      points: [...shape.points],
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
    },
  ];
}

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
  const strokes = getStrokeList(shape);

  return (
    <>
      <GroupShape
        ref={shapeRef}
        x={shape.x}
        y={shape.y}
        opacity={shape.opacity}
        rotation={shape.rotation}
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
          const nextStrokes = getStrokeList(shape).map((stroke) => ({
            ...stroke,
            points: stroke.points.map((value, index) =>
              index % 2 === 0 ? value * scaleX : value * scaleY,
            ),
          }));
          const lastStroke = nextStrokes[nextStrokes.length - 1] ?? null;
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            strokes: nextStrokes,
            points: lastStroke ? lastStroke.points : shape.points,
            stroke: lastStroke ? lastStroke.stroke : shape.stroke,
            strokeWidth: lastStroke ? lastStroke.strokeWidth : shape.strokeWidth,
          });
        }}
      >
        {strokes.map((stroke, index) => (
          <LineShape
            key={index}
            points={stroke.points}
            stroke={stroke.stroke}
            strokeWidth={stroke.strokeWidth}
            lineCap={shape.lineCap}
            lineJoin={shape.lineJoin}
            tension={0.4}
            listening={false}
          />
        ))}
      </GroupShape>
      {isSelected && selectionEnabled && (
        <TransformerShape ref={transformerRef} {...TRANSFORMER_PROPS} />
      )}
    </>
  );
}
