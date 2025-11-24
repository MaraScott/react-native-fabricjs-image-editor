import { useEffect, useMemo, useRef, useState } from 'react';
import type { LayerControlHandlers } from '@molecules/Layer/Layer.types';

type PenSettings = {
    size: number;
    hardness: number;
    color: string;
    opacity: number;
    onSizeChange: (size: number) => void;
    onHardnessChange: (value: number) => void;
    onColorChange: (color: string) => void;
    onOpacityChange: (opacity: number) => void;
};

interface SettingsPanelUIProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    layerControls: LayerControlHandlers | null;
    selectedLayerIds: string[];
    penSettings: PenSettings | null;
}

export const SettingsPanelUI = ({
    isOpen,
    onToggle,
    onClose,
    layerControls,
    selectedLayerIds,
    penSettings,
}: SettingsPanelUIProps) => {
    const [penSize, setPenSize] = useState<number>(penSettings?.size ?? 1);
    const [penHardness, setPenHardness] = useState<number>(penSettings?.hardness ?? 1);
    const [penOpacity, setPenOpacity] = useState<number>(penSettings?.opacity ?? 1);
    const [layerOpacity, setLayerOpacity] = useState<number>(1);
    const [, setLastOpacityCommit] = useState<{ value: number; layerIds: string[] } | null>(null);
    const opacityTargetsRef = useRef<string[]>([]);
    const layerOpacityRef = useRef<number>(1);
    const isOpacityDraggingRef = useRef(false);
    const opacityCommitTimeoutRef = useRef<number | null>(null);

    const selectedOpacity = useMemo(() => {
        if (!layerControls) return 1;
        if (selectedLayerIds.length === 0) return 1;
        const first = layerControls.layers.find((layer) => layer.id === selectedLayerIds[0]);
        return first?.opacity ?? 1;
    }, [layerControls?.layers, selectedLayerIds]);

    useEffect(() => {
        if (!penSettings) return;
        setPenSize(penSettings.size);
        setPenHardness(penSettings.hardness);
        setPenOpacity(penSettings.opacity);
    }, [penSettings?.size, penSettings?.hardness, penSettings?.opacity]);

    useEffect(() => {
        // Reset slider to the newly selected layer's opacity without dragging over.
        setLayerOpacity(selectedOpacity);
        layerOpacityRef.current = selectedOpacity;
        opacityTargetsRef.current = [];
        if (opacityCommitTimeoutRef.current) {
            clearTimeout(opacityCommitTimeoutRef.current);
            opacityCommitTimeoutRef.current = null;
        }
    }, [selectedOpacity, selectedLayerIds.join('|')]);

    // useEffect(() => {
    //     const handleGlobalPointerUp = () => {
    //         if (!isOpacityDraggingRef.current) return;
    //         isOpacityDraggingRef.current = false;
    //         if (opacityCommitTimeoutRef.current) {
    //             clearTimeout(opacityCommitTimeoutRef.current);
    //             opacityCommitTimeoutRef.current = null;
    //         }
    //         commitLayerOpacity(layerOpacityRef.current);
    //     };
    //     window.addEventListener('pointerup', handleGlobalPointerUp);
    //     window.addEventListener('mouseup', handleGlobalPointerUp);
    //     window.addEventListener('touchend', handleGlobalPointerUp);
    //     return () => {
    //         window.removeEventListener('pointerup', handleGlobalPointerUp);
    //         window.removeEventListener('mouseup', handleGlobalPointerUp);
    //         window.removeEventListener('touchend', handleGlobalPointerUp);
    //     };
    // }, []);

    const previewLayerOpacity = (value: number) => {
        if (!layerControls) return;
        const targets = opacityTargetsRef.current.length ? opacityTargetsRef.current : selectedLayerIds;
        if (targets.length === 0) return;
        const clamped = Math.max(0, Math.min(1, value));
            layerOpacityRef.current = clamped;
        targets.forEach((id) => {
            layerControls.updateLayerOpacityLive?.(id, clamped);
        });
    };

    const commitLayerOpacity = (value: number) => {
        if (!layerControls) return;
        const targets = opacityTargetsRef.current.length ? opacityTargetsRef.current : selectedLayerIds;
        if (targets.length === 0) return;
        const clamped = Math.max(0, Math.min(1, value));
        layerOpacityRef.current = clamped;
        targets.forEach((id) => {
            layerControls.updateLayerOpacityCommit?.(id, clamped);
        });
        if (!isOpacityDraggingRef.current) {
            setLastOpacityCommit({ value: clamped, layerIds: [...targets] });
        }
        opacityTargetsRef.current = [];
        if (opacityCommitTimeoutRef.current) {
            clearTimeout(opacityCommitTimeoutRef.current);
            opacityCommitTimeoutRef.current = null;
        }
    };

    if (!layerControls && !penSettings) {
        return null;
    }

    return (
        <div className="settings-panel-ui">
            <button
                key="settings-panel-toggle"
                className={isOpen ? 'open' : ''}
                type="button"
                aria-expanded={isOpen}
                aria-label={isOpen ? 'Hide settings' : 'Show settings'}
                title={isOpen ? 'Hide settings' : 'Show settings'}
                onClick={onToggle}
                onPointerDown={(event) => event.stopPropagation()}
            >
                ⚙️
            </button>

            {isOpen && (
                <div
                    key="settings-panel"
                    className="panel"
                    onPointerDown={(event) => event.stopPropagation()}
                    onPointerUp={(event) => event.stopPropagation()}
                    onWheel={(event) => event.stopPropagation()}
                >
                    <div className="header">
                        <span className="title">Settings</span>
                        <button type="button" className="close" onClick={onClose} aria-label="Close settings">
                            ×
                        </button>
                    </div>

                    {selectedLayerIds.length > 0 ? (
                        <div className="control-group">
                            <label htmlFor="layer-opacity">Layer opacity</label>
                            <input
                                id="layer-opacity"
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={layerOpacity}
                                onPointerDown={() => {
                                    opacityTargetsRef.current = [...selectedLayerIds];
                                    isOpacityDraggingRef.current = true;
                                }}
                                onChange={(event) => {
                                    const next = parseFloat(event.target.value);
                                    setLayerOpacity(next);
                                    layerOpacityRef.current = next;
                                    previewLayerOpacity(next);
                                    if (opacityCommitTimeoutRef.current) {
                                        clearTimeout(opacityCommitTimeoutRef.current);
                                    }
                                }}
                                onPointerUp={() => commitLayerOpacity(layerOpacityRef.current)}
                            />
                            <div className="value">{Math.round((layerOpacity ?? 1) * 100)}%</div>
                        </div>
                    ) : (
                        <div className="empty">Select a layer to adjust opacity.</div>
                    )}

                    {penSettings ? (
                        <div className="section">
                            <div className="section-title">Pen</div>
                            <div className="control-group">
                                <label htmlFor="pen-size">Size</label>
                                <input
                                    id="pen-size"
                                    type="range"
                                    min={1}
                                    max={120}
                                    step={1}
                                    value={penSize}
                                    onChange={(event) => {
                                        const next = parseInt(event.target.value, 10);
                                        setPenSize(next);
                                        penSettings.onSizeChange(next);
                                    }}
                                />
                                <div className="value">{penSize}px</div>
                            </div>
                            <div className="control-group">
                                <label htmlFor="pen-hardness">Hardness</label>
                                <input
                                    id="pen-hardness"
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={penHardness}
                                    onChange={(event) => {
                                        const next = parseFloat(event.target.value);
                                        setPenHardness(next);
                                        penSettings.onHardnessChange(next);
                                    }}
                                />
                                <div className="value">{Math.round(penHardness * 100)}%</div>
                            </div>
                            <div className="control-group">
                                <label htmlFor="pen-opacity">Opacity</label>
                                <input
                                    id="pen-opacity"
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={penOpacity}
                                    onChange={(event) => {
                                        const next = parseFloat(event.target.value);
                                        setPenOpacity(next);
                                        penSettings.onOpacityChange(next);
                                    }}
                                />
                                <div className="value">{Math.round(penOpacity * 100)}%</div>
                            </div>
                            <div className="control-group">
                                <label htmlFor="pen-color">Color</label>
                                <input
                                    id="pen-color"
                                    type="color"
                                    value={penSettings.color}
                                    onChange={(event) => penSettings.onColorChange(event.target.value)}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};
