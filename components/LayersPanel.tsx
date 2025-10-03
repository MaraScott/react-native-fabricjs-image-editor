import { useMemo } from 'react';
import type { EditorElement, EditorLayer } from '@types/editor';
import LayerPreview from '@components/LayerPreview';

interface LayersPanelProps {
  layers: EditorLayer[];
  elements: EditorElement[];
  activeLayerId: string | null;
  selectedElementIds: string[];
  onSelectLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onRemoveLayer: (layerId: string) => void;
  onMoveLayer: (layerId: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onAddLayer: () => void;
}

export default function LayersPanel({
  layers,
  elements,
  activeLayerId,
  selectedElementIds,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onRemoveLayer,
  onMoveLayer,
  onAddLayer,
}: LayersPanelProps) {
  const selectedSet = useMemo(() => new Set(selectedElementIds), [selectedElementIds]);
  const elementsByLayer = useMemo(() => {
    const map = new Map<string, EditorElement[]>();
    elements.forEach((element) => {
      if (!element.layerId) return;
      const current = map.get(element.layerId) ?? [];
      current.push(element);
      map.set(element.layerId, current);
    });
    return map;
  }, [elements]);

  const orderedLayers = useMemo(() => [...layers].reverse(), [layers]);
  const canRemoveLayer = layers.length > 1;

  return (
    <div className="layers-panel">
      <button type="button" className="add-layer-button" onClick={onAddLayer} title="Add layer">
        <span aria-hidden="true">＋</span>
        <span>Add layer</span>
      </button>
      {layers.length === 0 ? (
        <p className="layers-empty">No layers yet.</p>
      ) : (
        <ul>
          {orderedLayers.map((layer) => {
            const layerElements = elementsByLayer.get(layer.id) ?? [];
            const containsSelection = layerElements.some((element) => selectedSet.has(element.id));
            const isActive = activeLayerId === layer.id;
            const rowClass = [
              'layer-row',
              isActive || containsSelection ? 'selected' : '',
              !layer.visible ? 'muted' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <li key={layer.id} className={rowClass}>
                <button
                  type="button"
                  className="layer-main"
                  onClick={() => onSelectLayer(layer.id)}
                  title={`Select ${layer.name}`}
                >
                  <LayerPreview elements={layerElements} hidden={!layer.visible} locked={layer.locked} />
                  <span className="layer-name">{layer.name}</span>
                </button>
                <div className="layer-actions">
                  <button
                    type="button"
                    onClick={() => onToggleVisibility(layer.id)}
                    title={layer.visible ? 'Hide layer' : 'Show layer'}
                  >
                    {layer.visible ? '👁' : '🚫'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleLock(layer.id)}
                    title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                  >
                    {layer.locked ? '🔒' : '🔓'}
                  </button>
                  <button type="button" onClick={() => onMoveLayer(layer.id, 'up')} title="Move up">
                    ↑
                  </button>
                  <button type="button" onClick={() => onMoveLayer(layer.id, 'down')} title="Move down">
                    ↓
                  </button>
                  <button type="button" onClick={() => onMoveLayer(layer.id, 'top')} title="Move to top">
                    ⤒
                  </button>
                  <button type="button" onClick={() => onMoveLayer(layer.id, 'bottom')} title="Move to bottom">
                    ⤓
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveLayer(layer.id)}
                    title="Delete layer"
                    disabled={!canRemoveLayer}
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
