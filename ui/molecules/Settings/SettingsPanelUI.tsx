import { useEffect, useMemo, useRef, useState } from 'react';
import type { LayerControlHandlers } from '@molecules/Layer/Layer.types';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@store/CanvasApp';
import { viewActions } from '@store/CanvasApp/view';

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

type TextSettings = {
    text: string;
    fontSize: number;
    color: string;
    fontFamily: string;
    fontStyle: 'normal' | 'italic';
    fontWeight: string;
    onTextChange: (value: string) => void;
    onFontSizeChange: (value: number) => void;
    onColorChange: (value: string) => void;
    onFontFamilyChange: (value: string) => void;
    onFontStyleChange: (value: 'normal' | 'italic') => void;
    onFontWeightChange: (value: string) => void;
};

interface SettingsPanelUIProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    layerControls: LayerControlHandlers | null;
    selectedLayerIds: string[];
    penSettings: PenSettings | null;
    eraserSize?: number;
    onEraserSizeChange?: (value: number) => void;
    isTextToolActive?: boolean;
    textSettings?: TextSettings | null;
    isTextLayerSelected?: boolean;
    isRubberToolActive?: boolean;
}

export const SettingsPanelUI = ({
    isOpen,
    onToggle,
    onClose,
    layerControls,
    selectedLayerIds,
    penSettings,
    eraserSize = 20,
    onEraserSizeChange,
    isTextToolActive = false,
    textSettings,
    isTextLayerSelected = false,
    isRubberToolActive = false,
}: SettingsPanelUIProps) => {

    const dispatch = useDispatch();
    const drawToolState = useSelector((state: RootState) => state.view.draw);
    const paintToolState = useSelector((state: RootState) => state.view.paint);

    const [penSize, setPenSize] = useState<number>(penSettings?.size ?? 1);
    const [penHardness, setPenHardness] = useState<number>(penSettings?.hardness ?? 1);
    const [penOpacity, setPenOpacity] = useState<number>(penSettings?.opacity ?? 1);
    const [layerOpacity, setLayerOpacity] = useState<number>(1);
    const [localEraserSize, setLocalEraserSize] = useState<number>(eraserSize);
    const [textSize, setTextSize] = useState<number>(textSettings?.fontSize ?? 32);
    const [textColor, setTextColor] = useState<string>(textSettings?.color ?? '#000000');
    const [textFontFamily, setTextFontFamily] = useState<string>(textSettings?.fontFamily ?? 'Arial, sans-serif');
    const [textFontStyle, setTextFontStyle] = useState<'normal' | 'italic'>(textSettings?.fontStyle ?? 'normal');
    const [textFontWeight, setTextFontWeight] = useState<string>(textSettings?.fontWeight ?? 'normal');
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
        setLocalEraserSize(eraserSize);
    }, [eraserSize]);

    useEffect(() => {
        if (!textSettings) return;
        setTextSize(textSettings.fontSize);
        setTextColor(textSettings.color);
        setTextFontFamily(textSettings.fontFamily);
        setTextFontStyle(textSettings.fontStyle);
        setTextFontWeight(textSettings.fontWeight);
    }, [
        textSettings?.fontSize,
        textSettings?.color,
        textSettings?.fontFamily,
        textSettings?.fontStyle,
        textSettings?.fontWeight,
    ]);

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

    const fontFamilies = [
        'Arial, sans-serif',
        'Helvetica, sans-serif',
        '"Segoe UI", sans-serif',
        '"Trebuchet MS", sans-serif',
        'Verdana, sans-serif',
        '"Times New Roman", serif',
        'Georgia, serif',
        '"Courier New", monospace',
    ];

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


                    {penSettings && drawToolState.active && (
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
                    )}

                    {paintToolState.active && (
                        <div className="section">
                            <div className="section-title">Paint</div>
                            <div className="control-group">
                                <label htmlFor="paint-color">Fill color</label>
                                <input
                                    id="paint-color"
                                    type="color"
                                    value={paintToolState.color}
                                    onChange={(event) => dispatch(viewActions.paint.setColor(event.target.value))}
                                    onPointerDown={(event) => event.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}

                    {isRubberToolActive && onEraserSizeChange && (
                        <div className="section">
                            <div className="section-title">Eraser</div>
                            <div className="control-group">
                                <label htmlFor="eraser-size">Size</label>
                                <input
                                    id="eraser-size"
                                    type="range"
                                    min={1}
                                    max={200}
                                    step={1}
                                    value={localEraserSize}
                                    onChange={(event) => {
                                        const next = parseInt(event.target.value, 10) || 1;
                                        setLocalEraserSize(next);
                                        onEraserSizeChange(next);
                                    }}
                                />
                                <div className="value">{localEraserSize}px</div>
                            </div>
                        </div>
                    )}

                    {textSettings && (isTextToolActive || isTextLayerSelected) && (
                        <div className="section">
                            <div className="section-title">Text</div>
                            <div className="control-group">
                                <label htmlFor="text-size">Font size</label>
                                <input
                                    id="text-size"
                                    type="range"
                                    min={8}
                                    max={300}
                                    step={0.5}
                                    value={textSize}
                                    onChange={(event) => {
                                        const next = parseFloat(event.target.value) || 0;
                                        setTextSize(next);
                                        textSettings.onFontSizeChange(next);
                                    }}
                                />
                                <div className="value">{textSize}px</div>
                            </div>
                            <div className="control-group">
                                <label htmlFor="text-color">Font color</label>
                                <input
                                    id="text-color"
                                    type="color"
                                    value={textColor}
                                    onChange={(event) => {
                                        const next = event.target.value;
                                        setTextColor(next);
                                        textSettings.onColorChange(next);
                                    }}
                                />
                            </div>
                            <div className="control-group">
                                <label htmlFor="text-font-family">Font family</label>
                                <select
                                    id="text-font-family"
                                    value={textFontFamily}
                                    onChange={(event) => {
                                        const next = event.target.value;
                                        setTextFontFamily(next);
                                        textSettings.onFontFamilyChange(next);
                                    }}
                                >
                                    {fontFamilies.map((family) => (
                                        <option key={family} value={family}>
                                            {family}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="control-group">
                                <label htmlFor="text-font-style">Font style</label>
                                <select
                                    id="text-font-style"
                                    value={textFontStyle}
                                    onChange={(event) => {
                                        const next = event.target.value === 'italic' ? 'italic' : 'normal';
                                        setTextFontStyle(next);
                                        textSettings.onFontStyleChange(next);
                                    }}
                                >
                                    <option value="normal">Normal</option>
                                    <option value="italic">Italic</option>
                                </select>
                            </div>
                            <div className="control-group">
                                <label htmlFor="text-font-weight">Font weight</label>
                                <select
                                    id="text-font-weight"
                                    value={textFontWeight}
                                    onChange={(event) => {
                                        const next = event.target.value;
                                        setTextFontWeight(next);
                                        textSettings.onFontWeightChange(next);
                                    }}
                                >
                                    <option value="normal">Normal</option>
                                    <option value="500">Medium</option>
                                    <option value="600">Semi-bold</option>
                                    <option value="bold">Bold</option>
                                    <option value="900">Black</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
