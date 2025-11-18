import { useState, useRef, useCallback, useMemo } from 'react';
import type { DragEvent } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type {
    LayerControlHandlers,
    LayerSelectionOptions,
} from '@molecules/Canvas/types/canvas.types';
import { ButtonLayer as Button } from '@atoms/Button/ButtonLayer';

interface LayerPanelUIProps {
    layerControls: LayerControlHandlers;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    pendingSelectionRef: React.MutableRefObject<string[] | null>;
}

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

    const layerItemClass = ({
        isSelected,
        isDragging,
        isPrimary,
        dropPosition,
    }: {
        isSelected: boolean;
        isDragging: boolean;
        isPrimary: boolean;
        dropPosition: 'above' | 'below' | null;
    }) => {
        return `layer-item${isSelected ? ' selected' : ''}${isDragging ? ' dragging' : ''}${isPrimary ? ' primary' : ''}${dropPosition ? ` ${dropPosition}` : ''}`;
    }

    return (
        <div className="layer-panel-ui">
            <button
                key="layer-panel-toggle-button"
                className={isOpen ? 'open' : ''}
                ref={layerButtonRef}
                type="button"
                aria-expanded={isOpen}
                aria-label={isOpen ? 'Hide layer controls' : 'Show layer controls'}
                title={isOpen ? 'Hide layer controls' : 'Show layer controls'}
                onClick={onToggle}
                onPointerDown={(event) => event.stopPropagation()}
            >
                ☰
            </button>

            {isOpen && (
                <div
                    key="layer-panel"
                    className="panel"
                    ref={layerPanelRef}
                    onPointerDown={(event) => event.stopPropagation()}
                    onPointerUp={(event) => event.stopPropagation()}
                    onWheel={(event) => event.stopPropagation()}
                >
                    <div
                        key="layer-panel-header"
                        className="header"
                    >
                        <span key="layer-panel-header-title" className="title">Layers</span>

                        <Button action="close" onClick={onClose}>×</Button>
                    </div>

                    <Button action="add-layer" onClick={() => { layerControls.addLayer(); }}>+ Add Layer</Button>

                    {copyFeedback && (
                        <div
                            key="layer-panel-copy-feedback"
                            className="copy-feedback"
                        >
                            {copyFeedback}
                        </div>
                    )}

                    <div
                        key="layer-panel-layers-container"
                        className="layers-container"
                    >
                        {layerControls.layers.length === 0 ? (
                            <div
                                key="layer-panel-no-layers"
                                className="no-layers"
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

                                return (
                                    <div
                                        key={layer.id}
                                        className={layerItemClass({isSelected, isDragging, isPrimary, dropPosition})}
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
                                            key={`layer-panel-layer-${layer.id}-header`}
                                            className="layer-header"
                                        >
                                            <Button 
                                                key={`${layer.id}-visibility`}
                                                action={`visibility`} 
                                                id={layer.id}
                                                className={`visibility ${layer.visible ? 'visible' : ''}`}
                                                title={layer.visible ? 'Hide layer' : 'Show layer'}
                                                onClick={() => layerControls.toggleVisibility(layer.id)}
                                            >
                                                {layer.visible ? '👁' : '🙈'}
                                            </Button>

                                            <Button 
                                                key={`${layer.id}-select`}
                                                action={`select`}
                                                id={layer.id} 
                                                className={`select${isSelected ? ' selected' : ''}`}
                                                title={layer.visible ? 'Hide layer' : 'Show layer'}
                                                onClick={(event) => {
                                                    pendingSelectionRef.current = layerControls.selectLayer(layer.id, {
                                                        mode: 'replace',
                                                    });
                                                }}
                                                aria-pressed={isSelected}
                                            >
                                                {layer.name}
                                            </Button>

                                        </div>

                                        <div
                                            key={`layer-panel-layer-${layer.id}-actions`}
                                            className="actions"
                                        >
                                            <Button 
                                                key={`${layer.id}-copy`}
                                                action={`copy`} 
                                                id={layer.id}
                                                className={`visibility ${layer.visible ? 'visible' : ''}`}
                                                onClick={() => handleCopyLayer(layer.id)}
                                            >
                                                ⧉
                                            </Button>

                                            <button
                                                key={`layer-panel-layer-${layer.id}-duplicate-button`}
                                                className="duplicate"
                                                type="button"
                                                onPointerDown={(event) => event.stopPropagation()}
                                                onClick={() => layerControls.duplicateLayer(layer.id)}
                                                title="Duplicate layer"
                                                aria-label="Duplicate layer"
                                            >
                                                ⧺
                                            </button>
                                            <button
                                                key={`layer-panel-layer-${layer.id}-move-up-button`}
                                                className={`move-up`}
                                                type="button"
                                                onPointerDown={(event) => event.stopPropagation()}
                                                onClick={() => layerControls.moveLayer(layer.id, 'up')}
                                                title="Move layer up"
                                                aria-label="Move layer up"
                                                disabled={isTop}
                                            >
                                                ▲
                                            </button>
                                            <button
                                                key={`layer-panel-layer-${layer.id}-move-down-button`}
                                                className={`move-down`}
                                                type="button"
                                                onPointerDown={(event) => event.stopPropagation()}
                                                onClick={() => layerControls.moveLayer(layer.id, 'down')}
                                                title="Move layer down"
                                                aria-label="Move layer down"
                                                disabled={isBottom}
                                            >
                                                ▼
                                            </button>
                                            <button
                                                key={`layer-panel-layer-${layer.id}-move-top-button`}
                                                className={`move-top`}
                                                type="button"
                                                onPointerDown={(event) => event.stopPropagation()}
                                                onClick={() => layerControls.moveLayer(layer.id, 'top')}
                                                title="Send layer to top"
                                                aria-label="Send layer to top"
                                                disabled={isTop}
                                            >
                                                ⤒
                                            </button>
                                            <button
                                                key={`layer-panel-layer-${layer.id}-move-bottom-button`}
                                                className={`move-bottom`}
                                                type="button"
                                                onPointerDown={(event) => event.stopPropagation()}
                                                onClick={() => layerControls.moveLayer(layer.id, 'bottom')}
                                                title="Send layer to bottom"
                                                aria-label="Send layer to bottom"
                                                disabled={isBottom}
                                            >
                                                ⤓
                                            </button>
                                            <button
                                                key={`layer-panel-layer-${layer.id}-remove-button`}
                                                className="remove"
                                                type="button"
                                                onPointerDown={(event) => event.stopPropagation()}
                                                onClick={() => layerControls.removeLayer(layer.id)}
                                                title="Remove layer"
                                                aria-label="Remove layer"
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
                                key="layer-panel-bottom-drop-zone"
                                className={`bottom-drop-zone${draggingLayerId ? ' active' : ''
                                    }${dragOverLayer?.id === bottomLayerId && dragOverLayer?.position === 'below' ? ' below' : ''
                                    }`}
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
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
