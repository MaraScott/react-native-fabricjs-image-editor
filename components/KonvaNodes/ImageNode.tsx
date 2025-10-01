import { useRef } from 'react';
import { Image as ImageShape, Transformer as TransformerShape } from 'react-konva';
import type { KonvaEventObject } from '../../types/konva';
import type { ImageElement } from '../../types/editor';
import useImage from '../../hooks/useImage';
import {
  TRANSFORMER_PROPS,
  shouldListen,
  useApplyZIndex,
  useAttachTransformer,
  useRasterization,
  type BaseNodeProps,
} from './common';

export function ImageNode({
  shape,
  isSelected,
  selectionEnabled,
  onSelect,
  onChange,
  dragBoundFunc,
  zIndex,
  rasterize,
}: BaseNodeProps<ImageElement>) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [image] = useImage(shape.src, 'anonymous');

  useAttachTransformer(isSelected, selectionEnabled, shapeRef, transformerRef);
  useApplyZIndex(zIndex, shapeRef);
  useRasterization(rasterize && Boolean(image), shapeRef, [shape, image]);

  const draggable = selectionEnabled && shape.draggable && !shape.locked;

  return (
    <>
      <ImageShape
        ref={shapeRef}
        image={image || undefined}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        opacity={shape.opacity}
        rotation={shape.rotation}
        visible={shape.visible}
        cornerRadius={shape.cornerRadius}
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
          const nextWidth = Math.max(16, node.width() * scaleX);
          const nextHeight = Math.max(16, node.height() * (shape.keepRatio ? scaleX : scaleY));
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: nextWidth,
            height: shape.keepRatio ? nextWidth * (shape.height / Math.max(shape.width, 1)) : nextHeight,
          });
        }}
      />
      {isSelected && selectionEnabled && (
        <TransformerShape ref={transformerRef} {...TRANSFORMER_PROPS} />
      )}
    </>
  );
}
