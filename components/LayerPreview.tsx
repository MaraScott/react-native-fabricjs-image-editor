import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Circle,
  Ellipse,
  Group,
  Image as KonvaImage,
  Layer as KonvaLayer,
  Line,
  Rect,
  RegularPolygon,
  Stage,
  Text as KonvaText,
} from 'react-konva';
import type { Group as GroupType } from 'konva/lib/Group';
import type { Stage as StageType } from 'konva/lib/Stage';
import type { EditorElement, ImageElement, PencilElement, PencilStroke } from '../types/editor';
import useImage from '../hooks/useImage';

interface LayerPreviewProps {
  elements: EditorElement[];
  width?: number;
  height?: number;
  hidden?: boolean;
  locked?: boolean;
}

interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

function PreviewImage({ element, onLoad }: { element: ImageElement; onLoad: () => void }) {
  const [image] = useImage(element.src, 'anonymous');
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (image && !notifiedRef.current) {
      notifiedRef.current = true;
      onLoad();
    }
  }, [image, onLoad]);
  if (!image) {
    return null;
  }
  return (
    <KonvaImage
      image={image}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      opacity={element.opacity}
      cornerRadius={element.cornerRadius}
      listening={false}
    />
  );
}

function PreviewShape({ element, onImageLoad }: { element: EditorElement; onImageLoad: () => void }) {
  const common = {
    opacity: element.opacity,
    rotation: element.rotation,
    listening: false,
  } as const;

  switch (element.type) {
    case 'rect':
      return (
        <Rect
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          cornerRadius={element.cornerRadius}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          {...common}
        />
      );
    case 'frame':
      return (
        <Rect
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          cornerRadius={element.cornerRadius}
          fill="transparent"
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          {...common}
        />
      );
    case 'circle':
      return <Circle x={element.x} y={element.y} radius={element.radius} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} {...common} />;
    case 'ellipse':
      return (
        <Ellipse
          x={element.x}
          y={element.y}
          radiusX={element.radiusX}
          radiusY={element.radiusY}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          {...common}
        />
      );
    case 'triangle':
      return (
        <RegularPolygon
          x={element.x + element.width / 2}
          y={element.y + element.height / 2}
          sides={3}
          radius={Math.max(element.width, element.height) / 2}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          {...common}
        />
      );
    case 'line':
      return (
        <Line
          x={element.x}
          y={element.y}
          points={element.points}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          dash={element.dash}
          tension={element.tension ?? 0}
          closed={Boolean(element.closed)}
          fill={element.fill}
          {...common}
        />
      );
    case 'path':
      return (
        <Line
          x={element.x}
          y={element.y}
          points={element.points}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          tension={element.tension}
          closed={element.closed}
          fill={element.fill}
          {...common}
        />
      );
    case 'pencil': {
      const pencil = element as PencilElement;
      const strokes = Array.isArray(pencil.strokes) && pencil.strokes.length > 0
        ? pencil.strokes
        : ([
            {
              points: pencil.points,
              stroke: pencil.stroke,
              strokeWidth: pencil.strokeWidth,
            },
          ] satisfies PencilStroke[]);
      return (
        <Group x={pencil.x} y={pencil.y} opacity={pencil.opacity} rotation={pencil.rotation} listening={false}>
          {strokes.map((stroke, index) => (
            <Line
              key={index}
              points={stroke.points}
              stroke={stroke.stroke}
              strokeWidth={stroke.strokeWidth}
              lineCap={pencil.lineCap}
              lineJoin={pencil.lineJoin}
              tension={0.4}
              listening={false}
            />
          ))}
        </Group>
      );
    }
    case 'text': {
      const fontParts: string[] = [];
      if (element.fontStyle === 'italic') {
        fontParts.push('italic');
      }
      if (element.fontWeight === 'bold') {
        fontParts.push('bold');
      }
      const fontStyleValue = fontParts.length > 0 ? fontParts.join(' ') : 'normal';

      return (
        <KonvaText
          x={element.x}
          y={element.y}
          text={element.text}
          fontSize={element.fontSize}
          fontFamily={element.fontFamily}
          fontStyle={fontStyleValue}
          width={element.width}
          align={element.align}
          lineHeight={element.lineHeight}
          letterSpacing={element.letterSpacing}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          padding={element.padding}
          listening={false}
          opacity={element.opacity}
        />
      );
    }
    case 'image':
      return <PreviewImage element={element} onLoad={onImageLoad} />;
    default:
      return null;
  }
}

export default function LayerPreview({ elements, width = 64, height = 48, hidden = false, locked = false }: LayerPreviewProps) {
  const groupRef = useRef<GroupType>(null);
  const stageRef = useRef<StageType>(null);
  const [view, setView] = useState<ViewState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [version, setVersion] = useState(0);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const className = useMemo(() => {
    return [
      'layer-preview',
      hidden ? 'layer-preview-hidden' : '',
      locked ? 'layer-preview-locked' : '',
      elements.length === 0 ? 'layer-preview-empty' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }, [elements.length, hidden, locked]);

  useEffect(() => {
    if (elements.length === 0) {
      setView({ scale: 1, offsetX: 0, offsetY: 0 });
      setDataUrl(null);
      return;
    }
    const group = groupRef.current;
    if (!group) {
      return;
    }
    const rect = group.getClientRect({ skipTransform: false });
    const padding = 6;
    const safeWidth = Math.max(rect.width, 1);
    const safeHeight = Math.max(rect.height, 1);
    const scale = Math.min((width - padding) / safeWidth, (height - padding) / safeHeight);
    const stageWidth = width / scale;
    const stageHeight = height / scale;
    const offsetX = rect.x - Math.max(0, (stageWidth - safeWidth) / 2);
    const offsetY = rect.y - Math.max(0, (stageHeight - safeHeight) / 2);
    setView((current) => {
      if (
        Math.abs(current.scale - scale) < 0.01 &&
        Math.abs(current.offsetX - offsetX) < 0.5 &&
        Math.abs(current.offsetY - offsetY) < 0.5
      ) {
        return current;
      }
      return { scale, offsetX, offsetY };
    });
  }, [elements, height, width, version]);

  useEffect(() => {
    if (elements.length === 0) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      try {
        stage.batchDraw();
        const ratio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
        const url = stage.toDataURL({ pixelRatio: ratio });
        setDataUrl(url);
      } catch (error) {
        console.warn('[LayerPreview] Unable to render thumbnail', error);
        setDataUrl(null);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [elements, view, width, height, version]);

  if (elements.length === 0) {
    return (
      <div className={className}>
        <div className="layer-preview-placeholder" />
        {hidden ? (
          <span className="layer-preview-indicator layer-preview-indicator-hidden" aria-label="Layer hidden">
            🚫
          </span>
        ) : null}
        {locked ? (
          <span className="layer-preview-indicator layer-preview-indicator-locked" aria-label="Layer locked">
            🔒
          </span>
        ) : null}
      </div>
    );
  }

  const showImage = Boolean(dataUrl);

  return (
    <div className={className}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={view.scale}
        scaleY={view.scale}
        listening={false}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <KonvaLayer>
          <Group ref={groupRef} x={-view.offsetX} y={-view.offsetY}>
            {elements.map((element) => (
              <PreviewShape key={element.id} element={element} onImageLoad={() => setVersion((current) => current + 1)} />
            ))}
          </Group>
        </KonvaLayer>
      </Stage>
      {showImage ? (
        <img
          className="layer-preview-image"
          src={dataUrl ?? undefined}
          alt="Layer preview"
          width={width}
          height={height}
          draggable={false}
        />
      ) : null}
      {hidden ? (
        <span className="layer-preview-indicator layer-preview-indicator-hidden" aria-label="Layer hidden">
          🚫
        </span>
      ) : null}
      {locked ? (
        <span className="layer-preview-indicator layer-preview-indicator-locked" aria-label="Layer locked">
          🔒
        </span>
      ) : null}
    </div>
  );
}
