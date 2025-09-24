import { useEffect, useMemo, useRef, type RefObject } from 'react';
import {
  Circle as CircleShape,
  Ellipse as EllipseShape,
  Image as ImageShape,
  Line as LineShape,
  Rect as RectShape,
  RegularPolygon as RegularPolygonShape,
  Text as TextShape,
  Transformer as TransformerShape,
} from 'react-konva';
import type { KonvaEventObject, Vector2d } from '../types/konva';
import useImage from '../hooks/useImage';
import type {
  CircleElement,
  EllipseElement,
  FrameElement,
  GuideElement,
  ImageElement,
  LineElement,
  PathElement,
  PencilElement,
  RectElement,
  TextElement,
  TriangleElement,
} from '../types/editor';

interface BaseNodeProps<T> {
  shape: T;
  isSelected: boolean;
  selectionEnabled: boolean;
  onSelect: () => void;
  onChange: (attributes: Partial<T>) => void;
  dragBoundFunc?: (position: Vector2d) => Vector2d;
}

const TRANSFORMER_PROPS = {
  anchorSize: 8,
  borderStroke: '#38bdf8',
  rotateAnchorOffset: 40,
};

function useAttachTransformer<T extends { getLayer?: () => { batchDraw: () => void } | null }>(
  isSelected: boolean,
  selectionEnabled: boolean,
  shapeRef: RefObject<T>,
  transformerRef: RefObject<any>,
) {
  useEffect(() => {
    if (!selectionEnabled) return;
    const transformer = transformerRef.current;
    const node = shapeRef.current;
    if (!isSelected || !transformer || !node) return;
    transformer.nodes([node]);
    transformer.getLayer()?.batchDraw();
  }, [isSelected, selectionEnabled, shapeRef, transformerRef]);
}

function shouldListen(draggable: boolean, visible: boolean): boolean {
  return visible || draggable;
}

export function RectNode({ shape, isSelected, selectionEnabled, onSelect, onChange, dragBoundFunc }: BaseNodeProps<RectElement>) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useAttachTransformer(isSelected, selectionEnabled, shapeRef, transformerRef);

  const draggable = selectionEnabled && shape.draggable && !shape.locked;

  return (
    <>
      <RectShape
        ref={shapeRef}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        cornerRadius={shape.cornerRadius}
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
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(8, node.width() * scaleX),
            height: Math.max(8, node.height() * scaleY),
          });
        }}
      />
      {isSelected && selectionEnabled && (
        <TransformerShape ref={transformerRef} {...TRANSFORMER_PROPS} />
      )}
    </>
  );
}

export function FrameNode({ shape, ...rest }: BaseNodeProps<FrameElement>) {
  return <RectNode shape={{ ...shape, fill: 'transparent' }} {...rest} />;
}

export function CircleNode({ shape, isSelected, selectionEnabled, onSelect, onChange, dragBoundFunc }: BaseNodeProps<CircleElement>) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useAttachTransformer(isSelected, selectionEnabled, shapeRef, transformerRef);

  const draggable = selectionEnabled && shape.draggable && !shape.locked;

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
        <TransformerShape ref={transformerRef} {...TRANSFORMER_PROPS} />
      )}
    </>
  );
}

export function EllipseNode({ shape, isSelected, selectionEnabled, onSelect, onChange, dragBoundFunc }: BaseNodeProps<EllipseElement>) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useAttachTransformer(isSelected, selectionEnabled, shapeRef, transformerRef);

  const draggable = selectionEnabled && shape.draggable && !shape.locked;

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
        <TransformerShape ref={transformerRef} {...TRANSFORMER_PROPS} />
      )}
    </>
  );
}

export function TriangleNode({ shape, isSelected, selectionEnabled, onSelect, onChange, dragBoundFunc }: BaseNodeProps<TriangleElement>) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useAttachTransformer(isSelected, selectionEnabled, shapeRef, transformerRef);

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

export function LineNode({ shape, isSelected, selectionEnabled, onSelect, onChange, dragBoundFunc }: BaseNodeProps<LineElement>) {
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
          const nextPoints = node.points().map((value, index) => (index % 2 === 0 ? value * scaleX : value * scaleY));
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

export function PathNode(props: BaseNodeProps<PathElement>) {
  return <LineNode {...props} />;
}

export function PencilNode({ shape, isSelected, selectionEnabled, onSelect, onChange }: BaseNodeProps<PencilElement>) {
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
        draggable={draggable}
        listening={shouldListen(draggable, shape.visible)}
        lineCap={shape.lineCap}
        lineJoin={shape.lineJoin}
        tension={0.4}
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
          const nextPoints = node.points().map((value, index) => (index % 2 === 0 ? value * scaleX : value * scaleY));
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

export function TextNode({ shape, isSelected, selectionEnabled, onSelect, onChange, dragBoundFunc }: BaseNodeProps<TextElement>) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useAttachTransformer(isSelected, selectionEnabled, shapeRef, transformerRef);

  const draggable = selectionEnabled && shape.draggable && !shape.locked;

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
        onClick={onSelect}
        onTap={onSelect}
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
        <TransformerShape ref={transformerRef} {...TRANSFORMER_PROPS} enabledAnchors={['middle-left', 'middle-right']} />
      )}
    </>
  );
}

export function ImageNode({ shape, isSelected, selectionEnabled, onSelect, onChange, dragBoundFunc }: BaseNodeProps<ImageElement>) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [image] = useImage(shape.src, 'anonymous');

  useAttachTransformer(isSelected, selectionEnabled, shapeRef, transformerRef);

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
