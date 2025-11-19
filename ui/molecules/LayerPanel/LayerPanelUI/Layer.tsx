import { useCallback, useMemo, type MutableRefObject } from 'react';
import type { DragEvent } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { LayerControlHandlers } from '@molecules/Canvas/types/canvas.types';
import { ButtonLayer as Button } from '@atoms/Button/ButtonLayer';
import { useLayerStore } from '@store/Layer';

interface LayerData {
    id: string;
    name: string;
    visible: boolean;
}

interface LayerProps {
    index: number;
    data: LayerData;
    layerControls: LayerControlHandlers;
    pendingSelectionRef: MutableRefObject<string[] | null>;
}
const resolveDropPosition = (event: DragEvent<HTMLDivElement>): 'above' | 'below' => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - bounds.top;
    return offsetY < bounds.height / 2 ? 'above' : 'below';
};

export const Layer = ({ 
    index,
    data: layer, 
    layerControls,
    pendingSelectionRef,
}: LayerProps) => {

    const dragOverLayer = useLayerStore((state) => state.dragOverLayer);
    const setDragOverLayer = useLayerStore((state) => state.setDragOverLayer);
    const draggingLayerId = useLayerStore((state) => state.draggingLayerId);
    const setDraggingLayerId = useLayerStore((state) => state.setDraggingLayerId);
    const setCopyFeedback = useLayerStore((state) => state.setCopyFeedback);

    const primaryLayerId = layerControls.primaryLayerId;

    const isPrimary = primaryLayerId === layer.id;
    const isTop = index === 0;
    const isBottom = index === layerControls.layers.length - 1;

    const selectedLayerSet = useMemo(
        () => new Set(layerControls.selectedLayerIds),
        [layerControls.selectedLayerIds]
    );

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
        [layerControls, setCopyFeedback]
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

    const isSelected = selectedLayerSet.has(layer.id);
    const dropPosition =
        dragOverLayer?.id === layer.id ? dragOverLayer.position : null;
    const isDragging = draggingLayerId === layer.id;

    return (
        <div
            className={layerItemClass({ isSelected, isDragging, isPrimary, dropPosition })}
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
                    action="copy"
                    id={layer.id}
                    className={`visibility ${layer.visible ? 'visible' : ''}`}
                    onClick={() => handleCopyLayer(layer.id)}
                >
                    ⧉
                </Button>

                <Button
                    key={`layer-panel-layer-${layer.id}-duplicate-button`}
                    action="duplicate"
                    className="duplicate"
                    onClick={() => layerControls.duplicateLayer(layer.id)}
                    title="Duplicate layer"
                    aria-label="Duplicate layer"
                >
                    ⧺
                </Button>
                <Button
                    key={`layer-panel-layer-${layer.id}-move-up-button`}
                    action="move-up"
                    className="move-up"
                    onClick={() => layerControls.moveLayer(layer.id, 'up')}
                    title="Move layer up"
                    aria-label="Move layer up"
                    disabled={isTop}
                >
                    ▲
                </Button>
                <Button
                    key={`layer-panel-layer-${layer.id}-move-down-button`}
                    action="move-down"
                    className="move-down"
                    onClick={() => layerControls.moveLayer(layer.id, 'down')}
                    title="Move layer down"
                    aria-label="Move layer down"
                    disabled={isBottom}
                >
                    ▼
                </Button>
                <Button
                    key={`layer-panel-layer-${layer.id}-move-top-button`}
                    action="move-top"
                    className="move-top"
                    onClick={() => layerControls.moveLayer(layer.id, 'top')}
                    title="Send layer to top"
                    aria-label="Send layer to top"
                    disabled={isTop}
                >
                    ⤒
                </Button>
                <Button
                    key={`layer-panel-layer-${layer.id}-move-bottom-button`}
                    action="move-bottom"
                    className="move-bottom"
                    onClick={() => layerControls.moveLayer(layer.id, 'bottom')}
                    title="Send layer to bottom"
                    aria-label="Send layer to bottom"
                    disabled={isBottom}
                >
                    ⤓
                </Button>
                <Button
                    key={`layer-panel-layer-${layer.id}-remove-button`}
                    action="remove"
                    className="remove"
                    onClick={() => layerControls.removeLayer(layer.id)}
                    title="Remove layer"
                    aria-label="Remove layer"
                    disabled={layerControls.layers.length <= 1}
                >
                    🗑
                </Button>
            </div>
        </div>
    );
}
