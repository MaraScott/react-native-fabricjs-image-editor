import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { ButtonLayer as Button } from '@atoms/Button/ButtonLayer';
import { PanelLayer as Layer } from '@molecules/Layer/Panel/PanelLayer';
import { useLayerStore } from '@store/Layer';
import { useSimpleCanvasStore } from '@store/SimpleCanvas';
import type { Language } from '@i18n';
import { translate } from '@i18n';

interface LayerPanelUIProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    pendingSelectionRef: MutableRefObject<string[] | null>;
    language?: Language;
}

export const LayerPanelUI = ({
    isOpen,
    onToggle,
    onClose,
    pendingSelectionRef,
    language = 'en',
}: LayerPanelUIProps) => {

    const layerControls = useSimpleCanvasStore((state) => state.layerControls);
    const dragOverLayer = useLayerStore((state) => state.dragOverLayer);
    const setDragOverLayer = useLayerStore((state) => state.setDragOverLayer);
    const draggingLayerId = useLayerStore((state) => state.draggingLayerId);
    const setDraggingLayerId = useLayerStore((state) => state.setDraggingLayerId);
    const copyFeedback = useLayerStore((state) => state.copyFeedback);
    const resetDragState = useLayerStore((state) => state.resetDragState);

    const layerButtonRef = useRef<HTMLButtonElement | null>(null);
    const layerPanelRef = useRef<HTMLDivElement | null>(null);
    const [theme, setTheme] = useState<'kid' | 'adult'>('kid');
    const toggleIconSrc = '/wp-content/plugins/marascott-genai/src_expo/tinyartist-editor/assets/fabric-editor/src/assets/public/img/tinyartist-icon-layer.png';

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const layout = document.querySelector('.canvas-layout');
        if (layout?.classList.contains('adult')) {
            setTheme('adult');
        } else {
            setTheme('kid');
        }
    }, []);

    useEffect(() => {
        if (!isOpen) {
            resetDragState();
        }

        return () => {
            resetDragState();
        };
    }, [isOpen, resetDragState]);

    if (!layerControls) {
        return null;
    }

    const t = (key: string) => translate(language, key);

    // Layers array is ordered bottom -> top, so the bottom-most layer is index 0.
    const bottomLayerId = layerControls.layers[0]?.id ?? null;

    return (
        <div className="layer-panel-ui">
            <button
                key="layer-panel-toggle-button"
                className={isOpen ? 'open' : ''}
                ref={layerButtonRef}
                type="button"
                aria-expanded={isOpen}
                aria-label={isOpen ? t('hideLayerControls') : t('showLayerControls')}
                title={isOpen ? t('hideLayerControls') : t('showLayerControls')}
                onClick={onToggle}
                onPointerDown={(event) => event.stopPropagation()}
            >
                <img src={toggleIconSrc} alt="" aria-hidden="true" />
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
                        <span key="layer-panel-header-title" className="title">{t('layersTitle')}</span>

                        <Button action="close" onClick={onClose}>×</Button>
                    </div>

                    <Button action="add-layer" onClick={() => { layerControls.addLayer(); }}>{t('addLayer')}</Button>

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
                                {t('noLayers')}
                            </div>
                        ) : (
                            [...layerControls.layers].reverse().map((layer, index) => {
                                const layerKey = layer.id ?? `layer-${index}`;
                                return (
                                    <Layer
                                        key={`${layerKey}-${index}`}
                                        index={index}
                                        data={layer as any}
                                        pendingSelectionRef={pendingSelectionRef}
                                    />
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
