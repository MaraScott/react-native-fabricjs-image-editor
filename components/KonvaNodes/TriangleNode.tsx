import { useMemo, useRef } from 'react';
import { RegularPolygon as RegularPolygonShape, Transformer as TransformerShape } from 'react-konva';
import type { KonvaEventObject } from '../../types/konva';
import type { TriangleElement } from '../../types/editor';
import {
  TRANSFORMER_PROPS,
  shouldListen,
  useApplyZIndex,
  useAttachTransformer,
  useRasterization,
  type BaseNodeProps,
} from './common';

export function TriangleNode({
  shape,
  isSelected,
  selectionEnabled,
  onSelect,
  onChange,
  dragBoundFunc,
  zIndex,
  rasterize,
}: BaseNodeProps<TriangleElement>) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useAttachTransformer(isSelected, selectionEnabled, shapeRef, transformerRef);
  useApplyZIndex(zIndex, shapeRef);
  useRasterization(rasterize, shapeRef, [shape]);

  const draggable = selectionEnabled && shape.draggable && !shape.locked;
  const radius = useMemo(() => Math.max(shape.width, shape.height) / 2, [shape.width, shape.height]);

  return (
    <>
      <RegularPolygonShape
        ref={shapeRef}
        x={shape.x + shape.width / 2}
        y={shape.y + shape.height / 2}
        sides={3}
        radius={radius}
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        opacity={shape.opacity}
        rotation={shape.rotation}
        visible={shape.visible}
        draggable={draggable}
        dragBoundFunc={dragBoundFunc}
        listening={shouldListen(draggable, shape.visible)}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(event: KonvaEventObject<DragEvent>) => {
          onChange({ x: event.target.x() - shape.width / 2, y: event.target.y() - shape.height / 2 });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          const width = Math.max(8, shape.width * scaleX);
          const height = Math.max(8, shape.height * scaleY);
          onChange({
            x: node.x() - width / 2,
            y: node.y() - height / 2,
            rotation: node.rotation(),
            width,
            height,
          });
        }}
      />
      {isSelected && selectionEnabled && (
        <TransformerShape ref={transformerRef} {...TRANSFORMER_PROPS} />
      )}
    </>
  );
}
