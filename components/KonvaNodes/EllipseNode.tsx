import { useCallback, useRef } from 'react';
import { Ellipse as EllipseShape, Transformer as TransformerShape } from 'react-konva';
import type { KonvaEventObject } from '@types/konva';
import type { EllipseElement } from '@types/editor';
import {
  TRANSFORMER_PROPS,
  shouldListen,
  useApplyZIndex,
  useAttachTransformer,
  clampBoundingBoxToStage,
  type BaseNodeProps,
} from '@components/KonvaNodes/common';

export function EllipseNode({
  shape,
  isSelected,
  selectionEnabled,
  onSelect,
  onChange,
  dragBoundFunc,
  zIndex,
  stageSize,
}: BaseNodeProps<EllipseElement>) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useAttachTransformer(isSelected, selectionEnabled, shapeRef, transformerRef);
  useApplyZIndex(zIndex, shapeRef);

  const draggable = selectionEnabled && shape.draggable && !shape.locked;
  const boundBoxFunc = useCallback(
    (_oldBox: any, newBox: any) => clampBoundingBoxToStage(newBox, stageSize, 8, 8),
    [stageSize?.height, stageSize?.width],
  );

  return (
    <>
      <EllipseShape
        ref={shapeRef}
        x={shape.x}
        y={shape.y}
        radiusX={shape.radiusX}
        radiusY={shape.radiusY}
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        opacity={shape.opacity}
        rotation={shape.rotation}
        visible={shape.visible}
        draggable={draggable}
        dragBoundFunc={dragBoundFunc}
        listening={shouldListen(draggable, shape.visible)}
        onClick={(event: KonvaEventObject<MouseEvent>) => {
          onSelect(event);
          event.cancelBubble = true;
        }}
        onTap={(event: KonvaEventObject<TouchEvent>) => {
          onSelect(event);
          event.cancelBubble = true;
        }}
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
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            radiusX: Math.max(5, node.radiusX() * scaleX),
            radiusY: Math.max(5, node.radiusY() * scaleY),
          });
        }}
      />
      {isSelected && selectionEnabled && (
        <TransformerShape ref={transformerRef} {...TRANSFORMER_PROPS} boundBoxFunc={boundBoxFunc} />
      )}
    </>
  );
}
