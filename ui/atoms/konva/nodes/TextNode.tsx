import { useCallback, useRef } from 'react';
import { Text as TextShape, Transformer as TransformerShape } from 'react-konva';
import type { KonvaEventObject } from '@types/konva';
import type { TextElement } from '@types/editor';
import {
  TRANSFORMER_PROPS,
  shouldListen,
  useApplyZIndex,
  useAttachTransformer,
  clampBoundingBoxToStage,
  type BaseNodeProps,
} from '@atoms/konva/nodes/common';

export function TextNode({
  shape,
  isSelected,
  selectionEnabled,
  onSelect,
  onChange,
  dragBoundFunc,
  zIndex,
  stageSize,
}: BaseNodeProps<TextElement>) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useAttachTransformer(isSelected, selectionEnabled, shapeRef, transformerRef);
  useApplyZIndex(zIndex, shapeRef);

  const draggable = selectionEnabled && shape.draggable && !shape.locked;
  const boundBoxFunc = useCallback(
    (_oldBox: any, newBox: any) => clampBoundingBoxToStage(newBox, stageSize, 32, 16),
    [stageSize?.height, stageSize?.width],
  );

  return (
    <>
      <TextShape
        ref={shapeRef}
        x={shape.x}
        y={shape.y}
        text={shape.text}
        fontSize={shape.fontSize}
        fontFamily={shape.fontFamily}
        fill={shape.fill}
        width={shape.width}
        align={shape.align}
        opacity={shape.opacity}
        rotation={shape.rotation}
        visible={shape.visible}
        draggable={draggable}
        dragBoundFunc={dragBoundFunc}
        listening={shouldListen(draggable, shape.visible)}
        fontStyle={shape.fontStyle}
        fontVariant="normal"
        fontWeight={shape.fontWeight}
        lineHeight={shape.lineHeight}
        letterSpacing={shape.letterSpacing}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        fillAfterStrokeEnabled
        padding={shape.padding}
        background={shape.backgroundColor}
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
          node.scaleX(1);
          const width = Math.max(32, node.width() * scaleX);
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width,
          });
        }}
      />
      {isSelected && selectionEnabled && (
        <TransformerShape
          ref={transformerRef}
          {...TRANSFORMER_PROPS}
          boundBoxFunc={boundBoxFunc}
          enabledAnchors={['middle-left', 'middle-right']}
        />
      )}
    </>
  );
}
