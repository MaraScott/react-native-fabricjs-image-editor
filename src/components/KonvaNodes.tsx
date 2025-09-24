import { useEffect, useRef } from 'react';
import { Circle, Image as KonvaImage, Rect, Text, Transformer } from 'react-konva';
import { useImage } from 'use-image';
import type {
  CircleElement,
  ImageElement,
  RectElement,
  TextElement,
} from '../types/editor';

interface NodeProps<T> {
  shape: T;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attributes: Partial<T>) => void;
}

export function RectNode({ shape, isSelected, onSelect, onChange }: NodeProps<RectElement>) {
  const shapeRef = useRef<Rect>(null);
  const trRef = useRef<Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Rect
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
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(event) => {
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
      {isSelected && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          borderStroke="#38bdf8"
          rotateAnchorOffset={40}
        />
      )}
    </>
  );
}

export function CircleNode({ shape, isSelected, onSelect, onChange }: NodeProps<CircleElement>) {
  const shapeRef = useRef<Circle>(null);
  const trRef = useRef<Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Circle
        ref={shapeRef}
        x={shape.x}
        y={shape.y}
        radius={shape.radius}
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        opacity={shape.opacity}
        rotation={shape.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(event) => {
          onChange({ x: event.target.x(), y: event.target.y() });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          const nextRadius = Math.max(5, node.radius() * ((scaleX + scaleY) / 2));
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            radius: nextRadius,
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          borderStroke="#38bdf8"
          rotateAnchorOffset={40}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
        />
      )}
    </>
  );
}

export function TextNode({ shape, isSelected, onSelect, onChange }: NodeProps<TextElement>) {
  const shapeRef = useRef<Text>(null);
  const trRef = useRef<Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Text
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
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(event) => {
          onChange({ x: event.target.x(), y: event.target.y() });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          const scaleX = node.scaleX();
          node.scaleX(1);
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(32, node.width() * scaleX),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          borderStroke="#38bdf8"
          rotateAnchorOffset={40}
          enabledAnchors={['middle-left', 'middle-right']}
        />
      )}
    </>
  );
}

export function ImageNode({ shape, isSelected, onSelect, onChange }: NodeProps<ImageElement>) {
  const shapeRef = useRef<KonvaImage>(null);
  const trRef = useRef<Transformer>(null);
  const [image] = useImage(shape.src, 'Anonymous');

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image || undefined}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        opacity={shape.opacity}
        rotation={shape.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(event) => {
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
            width: Math.max(16, node.width() * scaleX),
            height: Math.max(16, node.height() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          borderStroke="#38bdf8"
          rotateAnchorOffset={40}
        />
      )}
    </>
  );
}
