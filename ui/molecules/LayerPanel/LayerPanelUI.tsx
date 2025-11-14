import { useState, useRef, useCallback, useMemo } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type {
  LayerControlHandlers,
  LayerSelectionOptions,
} from '@molecules/Canvas/types/canvas.types';

interface LayerPanelUIProps {
  layerControls: LayerControlHandlers;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  pendingSelectionRef: React.MutableRefObject<string[] | null>;
}

const smallActionButtonStyle: CSSProperties = {
  border: '1px solid #d0d0d0',
  background: '#ffffff',
  color: '#333333',
  borderRadius: '6px',
  padding: '0.25rem 0.5rem',
  fontSize: '0.75rem',
  cursor: 'pointer',
};

const getActionButtonStyle = (disabled?: boolean): CSSProperties => ({
  ...smallActionButtonStyle,
  opacity: disabled ? 0.4 : 1,
  cursor: disabled ? 'not-allowed' : 'pointer',
});

const resolveDropPosition = (event: DragEvent<HTMLDivElement>): 'above' | 'below' => {
  const bounds = event.currentTarget.getBoundingClientRect();
  const offsetY = event.clientY - bounds.top;
  return offsetY < bounds.height / 2 ? 'above' : 'below';
};

export const LayerPanelUI = ({
  layerControls,
  isOpen,
  onToggle,
  onClose,
  pendingSelectionRef,
}: LayerPanelUIProps) => {
  const layerButtonRef = useRef<HTMLButtonElement | null>(null);
  const layerPanelRef = useRef<HTMLDivElement | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [dragOverLayer, setDragOverLayer] = useState<{
    id: string;
    position: 'above' | 'below';
  } | null>(null);

  const selectedLayerSet = useMemo(
    () => new Set(layerControls.selectedLayerIds),
    [layerControls.selectedLayerIds]
  );
  
  const primaryLayerId = layerControls.primaryLayerId;
  const bottomLayerId = layerControls.layers[layerControls.layers.length - 1]?.id ?? null;

  const handleCopyLayer = useCallback(
    async (layerId: string) => {
      if (!layerControls.copyLayer) {
        return;
      }

      try {
        const result = await layerControls.copyLayer(layerId);
        if (typeof result === 'string' && result.trim().length > 0) {
          setCopyFeedback(result);
        } else {
          setCopyFeedback('Layer copied');
        }
      } catch (error) {
        console.warn('Unable to copy layer', error);
        setCopyFeedback('Unable to copy layer');
      }
    },
    [layerControls]
  );

  return (
    <>
      <button
        ref={layerButtonRef}
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Hide layer controls' : 'Show layer controls'}
        title={isOpen ? 'Hide layer controls' : 'Show layer controls'}
        onClick={onToggle}
        onPointerDown={(event) => event.stopPropagation()}
        style={{
          position: 'absolute',
          left: '16px',
          bottom: '16px',
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          border: '1px solid #d0d0d0',
          backgroundColor: isOpen ? '#333333' : '#ffffff',
          color: isOpen ? '#ffffff' : '#333333',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          cursor: 'pointer',
          zIndex: 12,
          transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
        }}
      >
        ☰
      </button>

      {isOpen && (
        <div
          ref={layerPanelRef}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onWheel={(event) => event.stopPropagation()}
          style={{
            position: 'absolute',
            left: '16px',
            bottom: '80px',
            width: '280px',
            maxHeight: '70%',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            backgroundColor: '#ffffff',
            border: '1px solid #d7d7d7',
            borderRadius: '12px',
            boxShadow: '0 16px 32px rgba(0,0,0,0.16)',
            padding: '1rem',
            zIndex: 12,
            overflow: 'hidden',
            touchAction: 'manipulation',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Layers</span>

            <button
              type="button"
              onClick={onClose}
              onPointerDown={(event) => event.stopPropagation()}
              aria-label="Close layer panel"
              title="Close layer panel"
              style={{
                border: 'none',
                background: 'transparent',
                padding: '0.25rem',
                cursor: 'pointer',
                fontSize: '1.1rem',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              layerControls.addLayer();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            style={{
              border: '1px solid #4a90e2',
              backgroundColor: '#4a90e2',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease, border-color 0.2s ease',
            }}
          >
            + Add Layer
          </button>

          {copyFeedback && (
            <div
              style={{
                fontSize: '0.75rem',
                color: '#2d7a2d',
                backgroundColor: '#ecf7ec',
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
              }}
            >
              {copyFeedback}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              overflowY: 'auto',
              paddingRight: '0.25rem',
            }}
          >
            {layerControls.layers.length === 0 ? (
              <div
                style={{
                  fontSize: '0.8125rem',
                  color: '#555555',
                  padding: '0.5rem 0.25rem',
                }}
              >
                No layers yet. Add one to get started.
              </div>
            ) : (
              layerControls.layers.map((layer, index) => {
                const isSelected = selectedLayerSet.has(layer.id);
                const isPrimary = primaryLayerId === layer.id;
                const isTop = index === 0;
                const isBottom = index === layerControls.layers.length - 1;
                const dropPosition =
                  dragOverLayer?.id === layer.id ? dragOverLayer.position : null;
                const isDragging = draggingLayerId === layer.id;
                const containerStyle: CSSProperties = {
                  border: `1px solid ${isSelected ? '#4a90e2' : '#e0e0e0'}`,
                  borderRadius: '8px',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  backgroundColor: isSelected ? '#f4f8ff' : '#ffffff',
                  opacity: isDragging ? 0.6 : 1,
                  position: 'relative',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  boxShadow: isPrimary ? '0 0 0 2px rgba(74,144,226,0.25)' : undefined,
                };

                if (dropPosition === 'above') {
                  containerStyle.boxShadow = '0 -4px 0 0 #4a90e2';
                } else if (dropPosition === 'below') {
                  containerStyle.boxShadow = '0 4px 0 0 #4a90e2';
                }

                return (
                  <div
                    key={layer.id}
                    style={containerStyle}
                    draggable
                    onDragStart={(event: KonvaEventObject<DragEvent>) => {
                      event.stopPropagation();
                      setDraggingLayerId(layer.id);
                      setDragOverLayer(null);
                      if (event.dataTransfer) {
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', layer.id);
                      }
                    }}
                    onDragEnd={(event: KonvaEventObject<DragEvent>) => {
                      event.stopPropagation();
                      setDraggingLayerId(null);
                      setDragOverLayer(null);
                      layerControls.ensureAllVisible();
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (!draggingLayerId || draggingLayerId === layer.id) {
                        return;
                      }
                      if (event.dataTransfer) {
                        event.dataTransfer.dropEffect = 'move';
                      }
                      const position = resolveDropPosition(event);
                      setDragOverLayer((current) => {
                        if (
                          current &&
                          current.id === layer.id &&
                          current.position === position
                        ) {
                          return current;
                        }
                        return { id: layer.id, position };
                      });
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      const sourceId =
                        draggingLayerId || event.dataTransfer?.getData('text/plain');
                      if (!sourceId || sourceId === layer.id) {
                        setDragOverLayer(null);
                        setDraggingLayerId(null);
                        return;
                      }
                      const position = resolveDropPosition(event);
                      layerControls.reorderLayer(sourceId, layer.id, position);
                      setDragOverLayer(null);
                      setDraggingLayerId(null);
                      layerControls.ensureAllVisible();
                    }}
                    onDragLeave={(event) => {
                      event.stopPropagation();
                      if (
                        !event.currentTarget.contains(event.relatedTarget as Node | null)
                      ) {
                        setDragOverLayer((current) =>
                          current?.id === layer.id ? null : current
                        );
                      }
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => layerControls.toggleVisibility(layer.id)}
                        title={layer.visible ? 'Hide layer' : 'Show layer'}
                        aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
                        style={{
                          border: '1px solid #d0d0d0',
                          backgroundColor: layer.visible ? '#ffffff' : '#f5f5f5',
                          color: '#333333',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        {layer.visible ? '👁' : '🙈'}
                      </button>

                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          pendingSelectionRef.current = layerControls.selectLayer(layer.id, {
                            mode: 'replace',
                          });
                        }}
                        style={{
                          flex: 1,
                          textAlign: 'left',
                          border: 'none',
                          background: 'transparent',
                          fontSize: '0.875rem',
                          fontWeight: isSelected ? 700 : 500,
                          color: '#333333',
                          cursor: 'pointer',
                        }}
                        aria-pressed={isSelected}
                      >
                        {layer.name}
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.35rem',
                      }}
                    >
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => handleCopyLayer(layer.id)}
                        title="Copy layer details"
                        aria-label="Copy layer details"
                        style={getActionButtonStyle()}
                      >
                        ⧉
                      </button>
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => layerControls.duplicateLayer(layer.id)}
                        title="Duplicate layer"
                        aria-label="Duplicate layer"
                        style={getActionButtonStyle()}
                      >
                        ⧺
                      </button>
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => layerControls.moveLayer(layer.id, 'up')}
                        title="Move layer up"
                        aria-label="Move layer up"
                        style={getActionButtonStyle(isTop)}
                        disabled={isTop}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => layerControls.moveLayer(layer.id, 'down')}
                        title="Move layer down"
                        aria-label="Move layer down"
                        style={getActionButtonStyle(isBottom)}
                        disabled={isBottom}
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => layerControls.moveLayer(layer.id, 'top')}
                        title="Send layer to top"
                        aria-label="Send layer to top"
                        style={getActionButtonStyle(isTop)}
                        disabled={isTop}
                      >
                        ⤒
                      </button>
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => layerControls.moveLayer(layer.id, 'bottom')}
                        title="Send layer to bottom"
                        aria-label="Send layer to bottom"
                        style={getActionButtonStyle(isBottom)}
                        disabled={isBottom}
                      >
                        ⤓
                      </button>
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => layerControls.removeLayer(layer.id)}
                        title="Remove layer"
                        aria-label="Remove layer"
                        style={{
                          ...getActionButtonStyle(layerControls.layers.length <= 1),
                          color: '#a11b1b',
                        }}
                        disabled={layerControls.layers.length <= 1}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            {layerControls.layers.length > 0 && (
              <div
                onDragOver={(event) => {
                  if (!draggingLayerId || !bottomLayerId) return;
                  event.preventDefault();
                  event.stopPropagation();
                  if (event.dataTransfer) {
                    event.dataTransfer.dropEffect = 'move';
                  }
                  setDragOverLayer({ id: bottomLayerId, position: 'below' });
                }}
                onDrop={(event) => {
                  if (!draggingLayerId || !bottomLayerId) return;
                  event.preventDefault();
                  event.stopPropagation();
                  if (draggingLayerId !== bottomLayerId) {
                    layerControls.reorderLayer(draggingLayerId, bottomLayerId, 'below');
                  }
                  setDragOverLayer(null);
                  setDraggingLayerId(null);
                  layerControls.ensureAllVisible();
                }}
                onDragLeave={(event) => {
                  if (
                    !event.currentTarget.contains(event.relatedTarget as Node | null)
                  ) {
                    setDragOverLayer((current) =>
                      current?.id === bottomLayerId ? null : current
                    );
                  }
                }}
                style={{
                  height: draggingLayerId ? '12px' : '0px',
                  backgroundColor:
                    dragOverLayer?.id === bottomLayerId &&
                    dragOverLayer?.position === 'below'
                      ? '#e3f0ff'
                      : 'transparent',
                  transition: 'height 0.15s ease',
                  pointerEvents: draggingLayerId ? 'auto' : 'none',
                }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};
