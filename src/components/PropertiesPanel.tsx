import { useMemo } from 'react';
import type { EditorElement } from '../types/editor';

interface PropertiesPanelProps {
  element: EditorElement;
  onChange: (attributes: Partial<EditorElement>) => void;
  onRemove: () => void;
}

function toNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOpacity(value: string, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0, parsed));
}

export default function PropertiesPanel({ element, onChange, onRemove }: PropertiesPanelProps) {
  const baseFields = useMemo(
    () => (
      <>
        <label>
          X
          <input
            type="number"
            value={Math.round(element.x)}
            onChange={(event) => onChange({ x: toNumber(event.target.value, element.x) })}
          />
        </label>
        <label>
          Y
          <input
            type="number"
            value={Math.round(element.y)}
            onChange={(event) => onChange({ y: toNumber(event.target.value, element.y) })}
          />
        </label>
        <label>
          Rotation
          <input
            type="number"
            value={Math.round(element.rotation)}
            onChange={(event) => onChange({ rotation: toNumber(event.target.value, element.rotation) })}
          />
        </label>
        <label>
          Opacity
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={Number(element.opacity.toFixed(2))}
            onChange={(event) => onChange({ opacity: toOpacity(event.target.value, element.opacity) })}
          />
        </label>
      </>
    ),
    [element, onChange],
  );

  const specificFields = useMemo(() => {
    switch (element.type) {
      case 'rect':
        return (
          <>
            <label>
              Width
              <input
                type="number"
                min={8}
                value={Math.round(element.width)}
                onChange={(event) => onChange({ width: Math.max(8, toNumber(event.target.value, element.width)) })}
              />
            </label>
            <label>
              Height
              <input
                type="number"
                min={8}
                value={Math.round(element.height)}
                onChange={(event) => onChange({ height: Math.max(8, toNumber(event.target.value, element.height)) })}
              />
            </label>
            <label>
              Fill
              <input type="color" value={element.fill} onChange={(event) => onChange({ fill: event.target.value })} />
            </label>
            <label>
              Stroke
              <input type="color" value={element.stroke} onChange={(event) => onChange({ stroke: event.target.value })} />
            </label>
            <label>
              Stroke width
              <input
                type="number"
                min={0}
                value={Number(element.strokeWidth.toFixed(1))}
                onChange={(event) => onChange({ strokeWidth: Math.max(0, toNumber(event.target.value, element.strokeWidth)) })}
              />
            </label>
            <label>
              Corner radius
              <input
                type="number"
                min={0}
                value={Math.round(element.cornerRadius)}
                onChange={(event) => onChange({ cornerRadius: Math.max(0, toNumber(event.target.value, element.cornerRadius)) })}
              />
            </label>
          </>
        );
      case 'circle':
        return (
          <>
            <label>
              Radius
              <input
                type="number"
                min={5}
                value={Math.round(element.radius)}
                onChange={(event) => onChange({ radius: Math.max(5, toNumber(event.target.value, element.radius)) })}
              />
            </label>
            <label>
              Fill
              <input type="color" value={element.fill} onChange={(event) => onChange({ fill: event.target.value })} />
            </label>
            <label>
              Stroke
              <input type="color" value={element.stroke} onChange={(event) => onChange({ stroke: event.target.value })} />
            </label>
            <label>
              Stroke width
              <input
                type="number"
                min={0}
                value={Number(element.strokeWidth.toFixed(1))}
                onChange={(event) => onChange({ strokeWidth: Math.max(0, toNumber(event.target.value, element.strokeWidth)) })}
              />
            </label>
          </>
        );
      case 'text':
        return (
          <>
            <label className="full-width">
              Content
              <textarea
                value={element.text}
                onChange={(event) => onChange({ text: event.target.value })}
              />
            </label>
            <label>
              Width
              <input
                type="number"
                min={32}
                value={Math.round(element.width)}
                onChange={(event) => onChange({ width: Math.max(32, toNumber(event.target.value, element.width)) })}
              />
            </label>
            <label>
              Font size
              <input
                type="number"
                min={8}
                value={Math.round(element.fontSize)}
                onChange={(event) => onChange({ fontSize: Math.max(8, toNumber(event.target.value, element.fontSize)) })}
              />
            </label>
            <label>
              Font family
              <input
                type="text"
                value={element.fontFamily}
                onChange={(event) => onChange({ fontFamily: event.target.value })}
              />
            </label>
            <label>
              Align
              <select value={element.align} onChange={(event) => onChange({ align: event.target.value as any })}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
            <label>
              Fill
              <input type="color" value={element.fill} onChange={(event) => onChange({ fill: event.target.value })} />
            </label>
          </>
        );
      case 'image':
        return (
          <>
            <label className="full-width">
              Source URL
              <input
                type="text"
                value={element.src}
                onChange={(event) => onChange({ src: event.target.value })}
              />
            </label>
            <label>
              Width
              <input
                type="number"
                min={16}
                value={Math.round(element.width)}
                onChange={(event) => onChange({ width: Math.max(16, toNumber(event.target.value, element.width)) })}
              />
            </label>
            <label>
              Height
              <input
                type="number"
                min={16}
                value={Math.round(element.height)}
                onChange={(event) => onChange({ height: Math.max(16, toNumber(event.target.value, element.height)) })}
              />
            </label>
          </>
        );
      default:
        return null;
    }
  }, [element, onChange]);

  return (
    <div>
      <div className="properties-grid">
        {baseFields}
        {specificFields}
      </div>
      <div className="export-panel">
        <button type="button" onClick={onRemove}>
          Remove element
        </button>
      </div>
    </div>
  );
}
