import { useState, useRef } from 'react';
import { ButtonLayer as Button } from '@atoms/Button/ButtonLayer';
import { Layer } from '@molecules/LayerPanel/LayerPanelUI/Layer';
import { DragOverLayer } from '@molecules/LayerPanel/LayerPanelUI/Layer';
import type { LayerControlHandlers } from '@molecules/Canvas/types/canvas.types';

interface LayerPanelUIProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    layerControls: LayerControlHandlers;
}

export const LayerPanelUI = ({
    isOpen,
    onToggle,
    onClose,
    layerControls,
}: LayerPanelUIProps) => {

    const [dragOverLayer, setDragOverLayer] = useState<DragOverLayer | null>(null);
    const layerButtonRef = useRef<HTMLButtonElement | null>(null);
    const layerPanelRef = useRef<HTMLDivElement | null>(null);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
    const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);

    const bottomLayerId = layerControls.layers[layerControls.layers.length - 1]?.id ?? null;

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
                            layerControls.layers.map((layer, index) => (
                                <Layer
                                    key={layer.id} 
                                    index={index}
                                    data={layer} 
                                    layerControls={layerControls}
                                    pendingSelectionRef={null}
                                    setCopyFeedback={setCopyFeedback} 
                                    draggingLayerId={draggingLayerId} 
                                    setDraggingLayerId={setDraggingLayerId}
                                    dragOverLayer={dragOverLayer} 
                                    setDragOverLayer={setDragOverLayer}
                                />
                            ))
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
