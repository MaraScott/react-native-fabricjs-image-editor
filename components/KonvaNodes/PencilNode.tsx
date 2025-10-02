import { useCallback, useRef } from 'react';
import { Line as LineShape, Transformer as TransformerShape } from 'react-konva';
import type { KonvaEventObject } from '../../types/konva';
import type { PencilElement } from '../../types/editor';
import {
  TRANSFORMER_PROPS,
  shouldListen,
  useApplyZIndex,
  useAttachTransformer,
  clampBoundingBoxToStage,
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
  stageSize,
}: BaseNodeProps<PencilElement>) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useAttachTransformer(isSelected, selectionEnabled, shapeRef, transformerRef);
  useApplyZIndex(zIndex, shapeRef);

  const draggable = selectionEnabled && shape.draggable && !shape.locked;
  const boundBoxFunc = useCallback(
    (_oldBox: any, newBox: any) => clampBoundingBoxToStage(newBox, stageSize, 1, 1),
    [stageSize?.height, stageSize?.width],
  );

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
        draggable={draggable}
        dragBoundFunc={dragBoundFunc}
        listening={shouldListen(draggable, shape.visible)}
        lineCap={shape.lineCap}
        lineJoin={shape.lineJoin}
        tension={0.4}
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
        <TransformerShape ref={transformerRef} {...TRANSFORMER_PROPS} boundBoxFunc={boundBoxFunc} />
      )}
    </>
  );
}
