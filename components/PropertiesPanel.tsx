import { useMemo } from 'react';
import type { ChangeEvent } from 'react';
import type {
  EditorElement,
  GuideElement,
  ImageElement,
  LineElement,
  PathElement,
  PencilElement,
  RectElement,
  TextElement,
  TriangleElement,
} from '../types/editor';

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
        <label className="full-width">
          Name
          <input
            type="text"
            value={element.name}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ name: event.target.value })}
          />
        </label>
        <label>
          Visible
          <input
            type="checkbox"
            checked={element.visible}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ visible: event.target.checked })}
          />
        </label>
        <label>
          Locked
          <input
            type="checkbox"
            checked={element.locked}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ locked: event.target.checked })}
          />
        </label>
        <label>
          X
          <input
            type="number"
            value={Math.round(element.x)}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange({ x: toNumber(event.target.value, element.x) })
            }
          />
        </label>
        <label>
          Y
          <input
            type="number"
            value={Math.round(element.y)}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange({ y: toNumber(event.target.value, element.y) })
            }
          />
        </label>
        <label>
          Rotation
          <input
            type="number"
            value={Math.round(element.rotation)}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange({ rotation: toNumber(event.target.value, element.rotation) })
            }
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
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange({ opacity: toOpacity(event.target.value, element.opacity) })
            }
          />
        </label>
      </>
    ),
    [element, onChange],
  );

  const specificFields = useMemo(() => {
    switch (element.type) {
      case 'rect':
      case 'frame': {
        const rect = element as RectElement;
        return (
          <>
            <label>
              Width
              <input
                type="number"
                min={8}
                value={Math.round(rect.width)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ width: Math.max(8, toNumber(event.target.value, rect.width)) })
                }
              />
            </label>
            <label>
              Height
              <input
                type="number"
                min={8}
                value={Math.round(rect.height)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ height: Math.max(8, toNumber(event.target.value, rect.height)) })
                }
              />
            </label>
            <label>
              Corner radius
              <input
                type="number"
                min={0}
                value={Number(rect.cornerRadius.toFixed(1))}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ cornerRadius: Math.max(0, toNumber(event.target.value, rect.cornerRadius)) })
                }
              />
            </label>
            <label>
              Fill
              <input
                type="color"
                value={rect.fill}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ fill: event.target.value })}
                disabled={element.type === 'frame'}
              />
            </label>
            <label>
              Stroke
              <input
                type="color"
                value={rect.stroke}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ stroke: event.target.value })}
              />
            </label>
            <label>
              Stroke width
              <input
                type="number"
                min={0}
                value={Number(rect.strokeWidth.toFixed(1))}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ strokeWidth: Math.max(0, toNumber(event.target.value, rect.strokeWidth)) })
                }
              />
            </label>
          </>
        );
      }
      case 'circle':
        return (
          <>
            <label>
              Radius
              <input
                type="number"
                min={5}
                value={Math.round(element.radius)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ radius: Math.max(5, toNumber(event.target.value, element.radius)) })
                }
              />
            </label>
            <label>
              Fill
              <input
                type="color"
                value={element.fill}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ fill: event.target.value })}
              />
            </label>
            <label>
              Stroke
              <input
                type="color"
                value={element.stroke}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ stroke: event.target.value })}
              />
            </label>
            <label>
              Stroke width
              <input
                type="number"
                min={0}
                value={Number(element.strokeWidth.toFixed(1))}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ strokeWidth: Math.max(0, toNumber(event.target.value, element.strokeWidth)) })
                }
              />
            </label>
          </>
        );
      case 'ellipse':
        return (
          <>
            <label>
              Radius X
              <input
                type="number"
                min={5}
                value={Math.round(element.radiusX)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ radiusX: Math.max(5, toNumber(event.target.value, element.radiusX)) })
                }
              />
            </label>
            <label>
              Radius Y
              <input
                type="number"
                min={5}
                value={Math.round(element.radiusY)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ radiusY: Math.max(5, toNumber(event.target.value, element.radiusY)) })
                }
              />
            </label>
            <label>
              Fill
              <input
                type="color"
                value={element.fill}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ fill: event.target.value })}
              />
            </label>
            <label>
              Stroke
              <input
                type="color"
                value={element.stroke}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ stroke: event.target.value })}
              />
            </label>
            <label>
              Stroke width
              <input
                type="number"
                min={0}
                value={Number(element.strokeWidth.toFixed(1))}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ strokeWidth: Math.max(0, toNumber(event.target.value, element.strokeWidth)) })
                }
              />
            </label>
          </>
        );
      case 'triangle': {
        const triangle = element as TriangleElement;
        return (
          <>
            <label>
              Width
              <input
                type="number"
                min={8}
                value={Math.round(triangle.width)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ width: Math.max(8, toNumber(event.target.value, triangle.width)) })
                }
              />
            </label>
            <label>
              Height
              <input
                type="number"
                min={8}
                value={Math.round(triangle.height)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ height: Math.max(8, toNumber(event.target.value, triangle.height)) })
                }
              />
            </label>
            <label>
              Fill
              <input
                type="color"
                value={triangle.fill}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ fill: event.target.value })}
              />
            </label>
            <label>
              Stroke
              <input
                type="color"
                value={triangle.stroke}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ stroke: event.target.value })}
              />
            </label>
            <label>
              Stroke width
              <input
                type="number"
                min={0}
                value={Number(triangle.strokeWidth.toFixed(1))}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ strokeWidth: Math.max(0, toNumber(event.target.value, triangle.strokeWidth)) })
                }
              />
            </label>
          </>
        );
      }
      case 'line':
      case 'path':
      case 'pencil': {
        const line = element as LineElement | PathElement | PencilElement;
        return (
          <>
            <label className="full-width">
              Stroke
              <input
                type="color"
                value={line.stroke}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ stroke: event.target.value })}
              />
            </label>
            <label>
              Stroke width
              <input
                type="number"
                min={1}
                value={Number(line.strokeWidth.toFixed(1))}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ strokeWidth: Math.max(1, toNumber(event.target.value, line.strokeWidth)) })
                }
              />
            </label>
            {line.type !== 'pencil' && (
              <label>
                Dashed pattern (comma separated)
                <input
                  type="text"
                  value={Array.isArray(line.dash) ? line.dash.join(', ') : ''}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const dash = event.target.value
                      .split(',')
                      .map((item) => Number(item.trim()))
                      .filter((value) => Number.isFinite(value) && value >= 0);
                    onChange({ dash: dash.length ? dash : undefined });
                  }}
                />
              </label>
            )}
            {'closed' in line && (
              <label>
                Closed path
                <input
                  type="checkbox"
                  checked={Boolean(line.closed)}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ closed: event.target.checked })}
                />
              </label>
            )}
          </>
        );
      }
      case 'text': {
        const text = element as TextElement;
        return (
          <>
            <label className="full-width">
              Content
              <textarea
                value={text.text}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange({ text: event.target.value })}
              />
            </label>
            <label>
              Width
              <input
                type="number"
                min={32}
                value={Math.round(text.width)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ width: Math.max(32, toNumber(event.target.value, text.width)) })
                }
              />
            </label>
            <label>
              Font size
              <input
                type="number"
                min={8}
                value={Math.round(text.fontSize)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ fontSize: Math.max(8, toNumber(event.target.value, text.fontSize)) })
                }
              />
            </label>
            <label>
              Font family
              <input
                type="text"
                value={text.fontFamily}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ fontFamily: event.target.value })}
              />
            </label>
            <label>
              Font style
              <select
                value={`${text.fontWeight}-${text.fontStyle}`}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                  const [weight, style] = event.target.value.split('-');
                  onChange({ fontWeight: weight as TextElement['fontWeight'], fontStyle: style as TextElement['fontStyle'] });
                }}
              >
                <option value="normal-normal">Normal</option>
                <option value="bold-normal">Bold</option>
                <option value="normal-italic">Italic</option>
                <option value="bold-italic">Bold italic</option>
              </select>
            </label>
            <label>
              Align
              <select
                value={text.align}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  onChange({ align: event.target.value as TextElement['align'] })
                }
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
            <label>
              Line height
              <input
                type="number"
                step={0.05}
                min={0.2}
                value={Number(text.lineHeight.toFixed(2))}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ lineHeight: Math.max(0.2, toNumber(event.target.value, text.lineHeight)) })
                }
              />
            </label>
            <label>
              Letter spacing
              <input
                type="number"
                step={0.5}
                value={Number(text.letterSpacing.toFixed(1))}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ letterSpacing: toNumber(event.target.value, text.letterSpacing) })
                }
              />
            </label>
            <label>
              Fill
              <input
                type="color"
                value={text.fill}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ fill: event.target.value })}
              />
            </label>
            <label>
              Stroke
              <input
                type="color"
                value={text.stroke}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ stroke: event.target.value })}
              />
            </label>
            <label>
              Stroke width
              <input
                type="number"
                min={0}
                value={Number(text.strokeWidth.toFixed(1))}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ strokeWidth: Math.max(0, toNumber(event.target.value, text.strokeWidth)) })
                }
              />
            </label>
            <label>
              Background
              <input
                type="color"
                value={text.backgroundColor}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ backgroundColor: event.target.value })}
              />
            </label>
            <label>
              Padding
              <input
                type="number"
                min={0}
                value={Math.round(text.padding)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ padding: Math.max(0, toNumber(event.target.value, text.padding)) })
                }
              />
            </label>
          </>
        );
      }
      case 'image': {
        const image = element as ImageElement;
        return (
          <>
            <label>
              Width
              <input
                type="number"
                min={16}
                value={Math.round(image.width)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ width: Math.max(16, toNumber(event.target.value, image.width)) })
                }
              />
            </label>
            <label>
              Height
              <input
                type="number"
                min={16}
                value={Math.round(image.height)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ height: Math.max(16, toNumber(event.target.value, image.height)) })
                }
                disabled={image.keepRatio}
              />
            </label>
            <label className="full-width">
              Source URL
              <input
                type="text"
                value={image.src}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ src: event.target.value })}
              />
            </label>
            <label>
              Corner radius
              <input
                type="number"
                min={0}
                value={Number(image.cornerRadius.toFixed(1))}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ cornerRadius: Math.max(0, toNumber(event.target.value, image.cornerRadius)) })
                }
              />
            </label>
            <label>
              Preserve ratio
              <input
                type="checkbox"
                checked={image.keepRatio}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ keepRatio: event.target.checked })}
              />
            </label>
          </>
        );
      }
      case 'guide': {
        const guide = element as GuideElement;
        return (
          <>
            <label>
              Orientation
              <select
                value={guide.orientation}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  onChange({ orientation: event.target.value as GuideElement['orientation'] })
                }
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </label>
            <label>
              Position
              <input
                type="number"
                value={guide.orientation === 'horizontal' ? Math.round(guide.y) : Math.round(guide.x)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange(
                    guide.orientation === 'horizontal'
                      ? { y: toNumber(event.target.value, guide.y) }
                      : { x: toNumber(event.target.value, guide.x) },
                  )
                }
              />
            </label>
            <label>
              Length
              <input
                type="number"
                min={0}
                value={Math.round(guide.length)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ length: Math.max(0, toNumber(event.target.value, guide.length)) })
                }
              />
            </label>
            <label>
              Colour
              <input
                type="color"
                value={guide.stroke}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ stroke: event.target.value })}
              />
            </label>
          </>
        );
      }
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
