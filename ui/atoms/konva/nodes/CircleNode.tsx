import { useCallback, useRef } from 'react';
import { Circle as CircleShape, Transformer as TransformerShape } from 'react-konva';
import type { KonvaEventObject } from '@types/konva';
import type { CircleElement } from '@types/editor';
import {
  TRANSFORMER_PROPS,
  shouldListen,
  useApplyZIndex,
  useAttachTransformer,
  clampBoundingBoxToStage,
  type BaseNodeProps,
} from '@atoms/konva/nodes/common';

export function CircleNode({
  shape,
  isSelected,
  selectionEnabled,
  onSelect,
  onChange,
  dragBoundFunc,
  zIndex,
  stageSize,
}: BaseNodeProps<CircleElement>) {
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
      <CircleShape
        ref={shapeRef}
        x={shape.x}
        y={shape.y}
        radius={shape.radius}
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
          const radius = Math.max(5, node.radius() * ((scaleX + scaleY) / 2));
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            radius,
          });
        }}
      />
      {isSelected && selectionEnabled && (
        <TransformerShape ref={transformerRef} {...TRANSFORMER_PROPS} boundBoxFunc={boundBoxFunc} />
      )}
    </>
  );
}
