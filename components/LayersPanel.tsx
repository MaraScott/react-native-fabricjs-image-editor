import type { EditorElement } from '../types/editor';

interface LayersPanelProps {
  elements: EditorElement[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
}

function getIconForElement(element: EditorElement): string {
  switch (element.type) {
    case 'rect':
      return '▭';
    case 'frame':
      return '⬚';
    case 'circle':
      return '◯';
    case 'ellipse':
      return '⬭';
    case 'triangle':
      return '△';
    case 'line':
      return '/';
    case 'path':
      return '〰';
    case 'pencil':
      return '✏️';
    case 'text':
      return 'T';
    case 'image':
      return '🖼';
    case 'guide':
      return element.orientation === 'horizontal' ? '▬' : '▮';
    default:
      return '⬤';
  }
}

export default function LayersPanel({
  elements,
  selectedIds,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onRemove,
  onMove,
}: LayersPanelProps) {
  if (elements.length === 0) {
    return <p className="layers-empty">No layers yet.</p>;
  }

  const ordered = [...elements].reverse();

  return (
    <div className="layers-panel">
      <ul>
        {ordered.map((element) => {
          const isSelected = selectedIds.includes(element.id);
          const visible = element.visible !== false;
          const locked = Boolean(element.locked);

          return (
            <li
              key={element.id}
              className={['layer-row', isSelected ? 'selected' : '', !visible ? 'muted' : ''].filter(Boolean).join(' ')}
            >
              <button type="button" className="layer-main" onClick={() => onSelect(element.id)}>
                <span className="layer-icon" aria-hidden="true">
                  {getIconForElement(element)}
                </span>
                <span className="layer-name">{element.name || element.type}</span>
              </button>
              <div className="layer-actions">
                <button type="button" onClick={() => onToggleVisibility(element.id)} title="Toggle visibility">
                  {visible ? '👁' : '🚫'}
                </button>
                <button type="button" onClick={() => onToggleLock(element.id)} title="Toggle lock">
                  {locked ? '🔒' : '🔓'}
                </button>
                <button type="button" onClick={() => onMove(element.id, 'up')} title="Move forward">
                  ↑
                </button>
                <button type="button" onClick={() => onMove(element.id, 'down')} title="Move backward">
                  ↓
                </button>
                <button type="button" onClick={() => onMove(element.id, 'top')} title="Move to front">
                  ⤒
                </button>
                <button type="button" onClick={() => onMove(element.id, 'bottom')} title="Move to back">
                  ⤓
                </button>
                <button type="button" onClick={() => onRemove(element.id)} title="Delete layer">
                  ✕
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
