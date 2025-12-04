import { useCallback, useMemo, useState, useEffect, useRef, type MutableRefObject } from 'react';
import type { DragEvent, MouseEvent, ChangeEvent, KeyboardEvent } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { ButtonLayer as Button } from '@atoms/Button/ButtonLayer';
import { useLayerStore } from '@store/Layer';
import { useSimpleCanvasStore } from '@store/SimpleCanvas';
import type { LayerControlHandlers } from '@molecules/Layer/Layer.types';

interface PanelLayerData {
    id: string;
    name: string;
    visible: boolean;
    render?: () => React.ReactNode;
    strokes?: unknown[];
    texts?: unknown[];
    type?: string;
    imageSrc?: string;
    needsRasterization?: boolean;
}

interface PanelLayerProps {
    index: number;
    data: PanelLayerData;
    pendingSelectionRef: MutableRefObject<string[] | null>;
}
const resolveDropPosition = (event: DragEvent<HTMLDivElement>): 'above' | 'below' => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - bounds.top;
    return offsetY < bounds.height / 2 ? 'above' : 'below';
};

const getActionButtonConfigs = ({
    layer,
    isTop,
    isBottom,
    handleCopyLayer,
    layerControls,
}: {
    layer: PanelLayerData;
    isTop: boolean;
    isBottom: boolean;
    handleCopyLayer: (layerId: string) => void;
    layerControls: LayerControlHandlers;
}) => {
    const canRasterize = layer.needsRasterization ?? true;
    const requestRasterize = () => {
        if (!canRasterize) {
            return;
        }
        if (!layerControls.rasterizeLayer || typeof window === 'undefined') {
            return;
        }

        const rasterizeEvent = new CustomEvent('rasterize-layer-request', {
            detail: { layerId: layer.id },
        });
        window.dispatchEvent(rasterizeEvent);
    };

    return [
        {
            key: `${layer.id}-copy`,
            props: {
                action: 'copy',
                className: `visibility ${layer.visible ? 'visible' : ''}`,
                onClick: () => handleCopyLayer(layer.id),
            },
            content: '⧉',
        }, {
            key: `layer-panel-layer-${layer.id}-duplicate-button`,
            props: {
                action: 'duplicate',
                className: 'duplicate',
                onClick: () => layerControls.duplicateLayer(layer.id),
                title: 'Duplicate layer',
                'aria-label': 'Duplicate layer',
            },
            content: '⧺',
        }, {
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
        }, {
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
        }, {
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
        }, {
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
                key: `layer-panel-layer-${layer.id}-rasterize-button`,
                props: {
                    action: 'rasterize',
                    className: 'rasterize',
                    onClick: requestRasterize,
                    title: 'Rasterize layer',
                    'aria-label': 'Rasterize layer',
                    disabled: !layerControls.rasterizeLayer || !canRasterize,
                },
                content: 'Rasterize',
            }, {
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
    ]
};

export const PanelLayer = ({
    index,
    data: layer,
    pendingSelectionRef,
}: PanelLayerProps) => {

    const layerControls = useSimpleCanvasStore((state) => state.layerControls);
    if (!layerControls) {
        return null;
    }
    const [theme, setTheme] = useState<'kid' | 'adult'>('kid');
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const layout = document.querySelector('.canvas-layout');
        if (layout?.classList.contains('adult')) {
            setTheme('adult');
        } else {
            setTheme('kid');
        }
    }, []);
    const [displayName, setDisplayName] = useState(layer.name);
    const [editingName, setEditingName] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const isEditing = editingName !== null;
    const startEdit = useCallback(() => setEditingName(layer.name), [layer.name]);
    const cancelEdit = useCallback(() => setEditingName(null), []);
    const commitEdit = useCallback(() => {
        if (!layerControls.updateLayerName || editingName === null) {
            cancelEdit();
            return;
        }
        const next = editingName.trim();
        if (next.length > 0 && next !== layer.name) {
            setDisplayName(next);
            layerControls.updateLayerName(layer.id, next);
        }
        cancelEdit();
    }, [cancelEdit, editingName, layerControls, layer.id, layer.name]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // useEffect(() => {
    //     if (!isEditing && layer.name !== displayName) {
    //         setDisplayName(layer.name);
    //     }
    // }, [displayName, isEditing, layer.name, editingName]);
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
        isVisible,
    }: {
        isSelected: boolean;
        isDragging: boolean;
        isPrimary: boolean;
        dropPosition: 'above' | 'below' | null;
        isVisible: boolean;
    }) => {
        return `layer-item${isSelected ? ' selected' : ''}${isDragging ? ' dragging' : ''}${isPrimary ? ' primary' : ''}${dropPosition ? ` ${dropPosition}` : ''}${isVisible ? '' : ' hidden'}`;
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

    const headerButtons = [
        {
            key: `${layer.id}-visibility`,
            props: {
                action: 'visibility',
                className: `visibility ${layer.visible ? 'visible' : ''}`,
                title: layer.visible ? 'Hide layer' : 'Show layer',
                onClick: () => layerControls.toggleVisibility(layer.id),
            },
            content: layer.visible ? (theme === 'kid' ? '👀' : '👁') : '🙈',
        },
        {
            key: `${layer.id}-select`,
            props: {
                action: 'select',
                className: `select${isSelected ? ' selected' : ''}`,
                title: 'Select layer (double-click to rename)',
                onClick: () => {
                    pendingSelectionRef.current = layerControls.selectLayer(layer.id, {
                        mode: 'replace',
                    });
                },
                onDoubleClick: (event: MouseEvent) => {
                    event.stopPropagation();
                    startEdit();
                },
                'aria-pressed': isSelected,
            },
            content: displayName,
        },
    ];

    const actionButtons = getActionButtonConfigs({
        layer,
        isTop,
        isBottom,
        handleCopyLayer,
        layerControls,
    }).map((btn) => {
        // Swap icons based on theme
        if (theme === 'kid') {
            switch (btn.props.action) {
                case 'copy':
                    return { ...btn, content: '📄' };
                case 'duplicate':
                    return { ...btn, content: '➕' };
                case 'move-up':
                    return { ...btn, content: '⬆️' };
                case 'move-down':
                    return { ...btn, content: '⬇️' };
                case 'move-top':
                    return { ...btn, content: '⏫' };
                case 'move-bottom':
                    return { ...btn, content: '⏬' };
                case 'rasterize':
                    return { ...btn, content: '🎞️' };
                case 'remove':
                    return { ...btn, content: '🧹' };
                default:
                    return btn;
            }
        } else {
            switch (btn.props.action) {
                case 'copy':
                    return { ...btn, content: '⧉' };
                case 'duplicate':
                    return { ...btn, content: '⧺' };
                case 'move-up':
                    return { ...btn, content: '▲' };
                case 'move-down':
                    return { ...btn, content: '▼' };
                case 'move-top':
                    return { ...btn, content: '⤒' };
                case 'move-bottom':
                    return { ...btn, content: '⤓' };
                case 'rasterize':
                    return { ...btn, content: '🖼️' };
                case 'remove':
                    return { ...btn, content: '🗑' };
                default:
                    return btn;
            }
        }
        return btn;
    });

    return (
        <div
            className={layerItemClass({ isSelected, isDragging, isPrimary, dropPosition, isVisible: layer.visible })}
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
                {headerButtons.map(({ key, props, content }) => {
                    if (props.action === 'select' && isEditing) {
                        return (
                            <div key={key} className="layer-name-edit" onClick={(e) => e.stopPropagation()}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={editingName ?? ''}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingName(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onDoubleClick={(e) => e.stopPropagation()}
                                    // onBlur={cancelEdit}
                                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            commitEdit();
                                        } else if (e.key === 'Escape') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            cancelEdit();
                                        }
                                    }}
                                    className="layer-name-input"
                                />
                                <button
                                    type="button"
                                    className="layer-name-commit"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        commitEdit();
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    title="Save layer name"
                                    aria-label="Save layer name"
                                >
                                    ✓
                                </button>
                                <button
                                    type="button"
                                    className="layer-name-cancel"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        cancelEdit();
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    title="Cancel layer name"
                                    aria-label="Cancel layer name"
                                >
                                    X
                                </button>
                            </div>
                        );
                    }
                    return (
                        <Button key={key} {...props}>
                            {content}
                        </Button>
                    );
                })}
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
