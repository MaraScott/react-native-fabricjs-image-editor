import { useMemo } from 'react';
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
    const selectedOpacity = useMemo(() => {
        if (!layerControls) return 1;
        if (selectedLayerIds.length === 0) return 1;
        const first = layerControls.layers.find((layer) => layer.id === selectedLayerIds[0]);
        return first?.opacity ?? 1;
    }, [layerControls, selectedLayerIds]);

    const handleLayerOpacity = (value: number) => {
        if (!layerControls) return;
        const clamped = Math.max(0, Math.min(1, value));
        selectedLayerIds.forEach((id) => {
            layerControls.updateLayerOpacity?.(id, clamped);
        });
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
                                value={selectedOpacity}
                                onChange={(event) => handleLayerOpacity(parseFloat(event.target.value))}
                            />
                            <div className="value">{Math.round((selectedOpacity ?? 1) * 100)}%</div>
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
                                    value={penSettings.size}
                                    onChange={(event) => penSettings.onSizeChange(parseInt(event.target.value, 10))}
                                />
                                <div className="value">{penSettings.size}px</div>
                            </div>
                            <div className="control-group">
                                <label htmlFor="pen-hardness">Hardness</label>
                                <input
                                    id="pen-hardness"
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={penSettings.hardness}
                                    onChange={(event) => penSettings.onHardnessChange(parseFloat(event.target.value))}
                                />
                                <div className="value">{Math.round(penSettings.hardness * 100)}%</div>
                            </div>
                            <div className="control-group">
                                <label htmlFor="pen-opacity">Opacity</label>
                                <input
                                    id="pen-opacity"
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={penSettings.opacity}
                                    onChange={(event) => penSettings.onOpacityChange(parseFloat(event.target.value))}
                                />
                                <div className="value">{Math.round(penSettings.opacity * 100)}%</div>
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
