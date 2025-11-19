import { useCallback, useMemo, type MutableRefObject } from 'react';
import type { DragEvent } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { ButtonLayer as Button } from '@atoms/Button/ButtonLayer';
import { useLayerStore } from '@store/Layer';
import { useSimpleCanvasStore } from '@store/SimpleCanvas';
import type { LayerControlHandlers } from '@molecules/Canvas/types/canvas.types';

interface LayerData {
    id: string;
    name: string;
    visible: boolean;
}

interface LayerProps {
    index: number;
    data: LayerData;
    pendingSelectionRef: MutableRefObject<string[] | null>;
}
const resolveDropPosition = (event: DragEvent<HTMLDivElement>): 'above' | 'below' => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - bounds.top;
    return offsetY < bounds.height / 2 ? 'above' : 'below';
};

const getHeaderButtonConfigs = ({
    layer,
    isSelected,
    pendingSelectionRef,
    layerControls,
}: {
    layer: LayerData;
    isSelected: boolean;
    pendingSelectionRef: MutableRefObject<string[] | null>;
    layerControls: LayerControlHandlers;
}) => [
    {
        key: `${layer.id}-visibility`,
        props: {
            action: 'visibility',
            className: `visibility ${layer.visible ? 'visible' : ''}`,
            title: layer.visible ? 'Hide layer' : 'Show layer',
            onClick: () => layerControls.toggleVisibility(layer.id),
        },
        content: layer.visible ? '👁' : '🙈',
    },
    {
        key: `${layer.id}-select`,
        props: {
            action: 'select',
            className: `select${isSelected ? ' selected' : ''}`,
            title: layer.visible ? 'Hide layer' : 'Show layer',
            onClick: () => {
                pendingSelectionRef.current = layerControls.selectLayer(layer.id, {
                    mode: 'replace',
                });
            },
            'aria-pressed': isSelected,
        },
        content: layer.name,
    },
];

const getActionButtonConfigs = ({
    layer,
    isTop,
    isBottom,
    handleCopyLayer,
    layerControls,
}: {
    layer: LayerData;
    isTop: boolean;
    isBottom: boolean;
    handleCopyLayer: (layerId: string) => void;
    layerControls: LayerControlHandlers;
}) => [
    {
        key: `${layer.id}-copy`,
        props: {
            action: 'copy',
            className: `visibility ${layer.visible ? 'visible' : ''}`,
            onClick: () => handleCopyLayer(layer.id),
        },
        content: '⧉',
    },
    {
        key: `layer-panel-layer-${layer.id}-duplicate-button`,
        props: {
            action: 'duplicate',
            className: 'duplicate',
            onClick: () => layerControls.duplicateLayer(layer.id),
            title: 'Duplicate layer',
            'aria-label': 'Duplicate layer',
        },
        content: '⧺',
    },
    {
        key: `layer-panel-layer-${layer.id}-move-up-button`,
        props: {
            action: 'move-up',
            className: 'move-up',
            onClick: () => layerControls.moveLayer(layer.id, 'up'),
            title: 'Move layer up',
            'aria-label': 'Move layer up',
            disabled: isTop,
        },
        content: '▲',
    },
    {
        key: `layer-panel-layer-${layer.id}-move-down-button`,
        props: {
            action: 'move-down',
            className: 'move-down',
            onClick: () => layerControls.moveLayer(layer.id, 'down'),
            title: 'Move layer down',
            'aria-label': 'Move layer down',
            disabled: isBottom,
        },
        content: '▼',
    },
    {
        key: `layer-panel-layer-${layer.id}-move-top-button`,
        props: {
            action: 'move-top',
            className: 'move-top',
            onClick: () => layerControls.moveLayer(layer.id, 'top'),
            title: 'Send layer to top',
            'aria-label': 'Send layer to top',
            disabled: isTop,
        },
        content: '⤒',
    },
    {
        key: `layer-panel-layer-${layer.id}-move-bottom-button`,
        props: {
            action: 'move-bottom',
            className: 'move-bottom',
            onClick: () => layerControls.moveLayer(layer.id, 'bottom'),
            title: 'Send layer to bottom',
            'aria-label': 'Send layer to bottom',
            disabled: isBottom,
        },
        content: '⤓',
    },
    {
        key: `layer-panel-layer-${layer.id}-remove-button`,
        props: {
            action: 'remove',
            className: 'remove',
            onClick: () => layerControls.removeLayer(layer.id),
            title: 'Remove layer',
            'aria-label': 'Remove layer',
            disabled: layerControls.layers.length <= 1,
        },
        content: '🗑',
    },
];

export const Layer = ({ 
    index,
    data: layer, 
    pendingSelectionRef,
}: LayerProps) => {

    const layerControls = useSimpleCanvasStore((state) => state.layerControls);
    if (!layerControls) {
        return null;
    }
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

    const handleDragStart = useCallback((event: KonvaEventObject<DragEvent>) => {
        event.stopPropagation();
        pendingSelectionRef.current = layerControls.selectLayer(layer.id, { mode: 'replace' });
        setDraggingLayerId(layer.id);
        setDragOverLayer(null);
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', layer.id);
        }
    }, [layerControls, layer.id, pendingSelectionRef, setDragOverLayer, setDraggingLayerId]);

    const handleDragEnd = useCallback((event: KonvaEventObject<DragEvent>) => {
        event.stopPropagation();
        setDraggingLayerId(null);
        setDragOverLayer(null);
        layerControls.ensureAllVisible();
    }, [layerControls, setDragOverLayer, setDraggingLayerId]);

    const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
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
    }, [draggingLayerId, layer.id, setDragOverLayer]);

    const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
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
    }, [draggingLayerId, layer.id, layerControls, setDragOverLayer, setDraggingLayerId]);

    const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
        event.stopPropagation();
        if (
            !event.currentTarget.contains(event.relatedTarget as Node | null)
        ) {
            setDragOverLayer((current) =>
                current?.id === layer.id ? null : current
            );
        }
    }, [layer.id, setDragOverLayer]);

    const headerButtons = getHeaderButtonConfigs({
        layer,
        isSelected,
        pendingSelectionRef,
        layerControls,
    });

    const actionButtons = getActionButtonConfigs({
        layer,
        isTop,
        isBottom,
        handleCopyLayer,
        layerControls,
    });

    return (
        <div
            className={layerItemClass({ isSelected, isDragging, isPrimary, dropPosition })}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
        >
            <div
                key={`layer-panel-layer-${layer.id}-header`}
                className="layer-header"
            >
                {headerButtons.map(({ key, props, content }) => (
                    <Button key={key} {...props}>
                        {content}
                    </Button>
                ))}
            </div>

            <div
                key={`layer-panel-layer-${layer.id}-actions`}
                className="actions"
            >
                {actionButtons.map(({ key, props, content }) => (
                    <Button key={key} {...props}>
                        {content}
                    </Button>
                ))}
            </div>
        </div>
    );
}
