import { useCallback, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Circle, Rect, Text as KonvaText, RegularPolygon, Transformer } from 'react-konva';
import type { KonvaEventObject } from '../types/konva';

// ===== TYPES =====

type Tool = 'select' | 'pencil' | 'eraser' | 'circle' | 'rect' | 'triangle' | 'star' | 'text';

interface DrawingLine {
    id: string;
    tool: string;
    points: number[];
    color: string;
    size: number;
    layerId: string;
}

interface Shape {
    id: string;
    type: 'circle' | 'rect' | 'triangle' | 'star';
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    color: string;
    rotation: number;
    layerId: string;
}

interface TextItem {
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    fontSize: number;
    rotation: number;
    layerId: string;
}

interface StickerItem {
    id: string;
    emoji: string;
    x: number;
    y: number;
    size: number;
    rotation: number;
    layerId: string;
}

interface LayerType {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
}

interface EditorAppProps {
    initialDesign?: any;
    initialOptions?: any;
    backgroundColor?: string;
}

// ===== CONSTANTS =====

const COLORS = [
    // Primary jewel tones
    { name: '💎 Emerald', value: '#50C878' },
    { name: '💎 Light Emerald', value: '#7FD99F' },
    { name: '💎 Dark Emerald', value: '#2E8B57' },
    { name: '💙 Sapphire', value: '#0F52BA' },
    { name: '💙 Light Sapphire', value: '#4682E1' },
    { name: '💙 Deep Sapphire', value: '#082567' },
    { name: '✨ Gold', value: '#FFD700' },
    { name: '✨ Light Gold', value: '#FFED4E' },
    { name: '✨ Rose Gold', value: '#E0BFB8' },
    { name: '🍷 Burgundy', value: '#800020' },
    { name: '🍷 Light Burgundy', value: '#A94064' },
    { name: '🍷 Wine', value: '#5C001A' },
    // Complementary colors for kids
    { name: '🌸 Pink', value: '#FFB6C1' },
    { name: '🟠 Orange', value: '#FFA500' },
    { name: '🟣 Purple', value: '#9370DB' },
    { name: '⚪ White', value: '#FFFFFF' },
    { name: '⚫ Black', value: '#2C3E50' },
    { name: '🤎 Brown', value: '#8B4513' },
];

const STICKERS = [
    '😀', '😃', '😄', '😁', '😊', '🥰', '😍', '🤩', '😎', '🤗',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '⭐', '🌟', '✨', '💫', '🌈', '🌸', '🌺', '🌻', '🌼', '🌷',
    '🎈', '🎉', '🎊', '🎁', '🎂', '🍰', '🍭', '🍬', '🍩', '🍪',
];

// ===== MAIN COMPONENT =====

export default function EditorApp({ initialOptions }: EditorAppProps) {
    // Canvas settings
    const [canvasWidth, setCanvasWidth] = useState(initialOptions?.width || 1024);
    const [canvasHeight, setCanvasHeight] = useState(initialOptions?.height || 1024);
    const [canvasColor, setCanvasColor] = useState(initialOptions?.backgroundColor || '#FFFFFF');
    const [showCanvasSettings, setShowCanvasSettings] = useState(false);

    // Workspace container ref for calculating initial position
    const workspaceRef = useRef<HTMLDivElement>(null);

    // Zoom and pan
    const [scale, setScale] = useState(1);
    const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [spacePressed, setSpacePressed] = useState(false);

    // Tools and drawing
    const [tool, setTool] = useState<Tool>('pencil');
    const [color, setColor] = useState('#2C3E50');
    const [brushSize, setBrushSize] = useState(10);
    const [isDrawing, setIsDrawing] = useState(false);

    // Layers
    const [layers, setLayers] = useState<LayerType[]>([
        { id: 'layer-1', name: 'Layer 1', visible: true, locked: false }
    ]);
    const [selectedLayerId, setSelectedLayerId] = useState('layer-1');

    // Elements
    const [lines, setLines] = useState<DrawingLine[]>([]);
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [texts, setTexts] = useState<TextItem[]>([]);
    const [stickers, setStickers] = useState<StickerItem[]>([]);

    // Selection
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [toolSettingsOpen, setToolSettingsOpen] = useState(true);

    // History
    const [history, setHistory] = useState<any[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    // Refs
    const stageRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);
    const isDrawingRef = useRef(false);
    const spaceKeyRef = useRef(false);
    const lastCenterRef = useRef<any>(null);
    const lastDistRef = useRef<number>(0);

    // Update transformer when selection changes
    useEffect(() => {
        if (transformerRef.current && selectedId) {
            const stage = stageRef.current;
            if (stage) {
                const selectedNode = stage.findOne(`#${selectedId}`);
                if (selectedNode) {
                    transformerRef.current.nodes([selectedNode]);
                    transformerRef.current.getLayer()?.batchDraw();
                }
            }
        } else if (transformerRef.current) {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [selectedId]);

    // Center canvas in workspace on initial load
    useEffect(() => {
        if (workspaceRef.current) {
            const workspace = workspaceRef.current;
            const workspaceWidth = workspace.clientWidth;
            const workspaceHeight = workspace.clientHeight;

            // Calculate scale to fit canvas entirely in workspace (with padding)
            const padding = 100; // 50px padding on each side
            const scaleX = (workspaceWidth - padding) / canvasWidth;
            const scaleY = (workspaceHeight - padding) / canvasHeight;
            const fitScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%

            // Calculate center position
            const x = (workspaceWidth - canvasWidth * fitScale) / 2;
            const y = (workspaceHeight - canvasHeight * fitScale) / 2;

            setScale(fitScale);
            setStagePosition({ x, y });
        }
    }, [canvasWidth, canvasHeight]);

    // Keyboard event handlers for spacebar panning
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !spaceKeyRef.current) {
                e.preventDefault();
                spaceKeyRef.current = true;
                setSpacePressed(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                spaceKeyRef.current = false;
                setSpacePressed(false);
                setIsPanning(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Save to history
    const saveToHistory = () => {
        const state = {
            lines: [...lines],
            shapes: [...shapes],
            texts: [...texts],
            stickers: [...stickers],
            layers: [...layers],
        };
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(state);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    // Undo/Redo
    const handleUndo = () => {
        if (historyStep > 0) {
            const prevState = history[historyStep - 1];
            setLines(prevState.lines);
            setShapes(prevState.shapes);
            setTexts(prevState.texts);
            setStickers(prevState.stickers);
            setLayers(prevState.layers);
            setHistoryStep(historyStep - 1);
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            const nextState = history[historyStep + 1];
            setLines(nextState.lines);
            setShapes(nextState.shapes);
            setTexts(nextState.texts);
            setStickers(nextState.stickers);
            setLayers(nextState.layers);
            setHistoryStep(historyStep + 1);
        }
    };

    // Clear canvas
    const handleClear = () => {
        if (window.confirm('Clear everything? This cannot be undone!')) {
            setLines([]);
            setShapes([]);
            setTexts([]);
            setStickers([]);
            setSelectedId(null);
            saveToHistory();
        }
    };

    // Download
    const handleDownload = () => {
        if (stageRef.current) {
            const transformer = transformerRef.current;
            if (transformer) {
                transformer.nodes([]);
            }

            const uri = stageRef.current.toDataURL({
                pixelRatio: 2,
            });

            const link = document.createElement('a');
            link.download = `my-drawing-${Date.now()}.png`;
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Zoom controls
    const handleZoomIn = () => setScale(Math.min(scale * 1.2, 5));
    const handleZoomOut = () => setScale(Math.max(scale / 1.2, 0.1));
    const handleZoomReset = () => setScale(1);

    // Canvas settings
    const applyCanvasSize = (width: number, height: number) => {
        setCanvasWidth(width);
        setCanvasHeight(height);
        setShowCanvasSettings(false);

        // Recenter canvas after resize
        if (workspaceRef.current) {
            const workspace = workspaceRef.current;
            const workspaceWidth = workspace.clientWidth;
            const workspaceHeight = workspace.clientHeight;

            const padding = 100;
            const scaleX = (workspaceWidth - padding) / width;
            const scaleY = (workspaceHeight - padding) / height;
            const fitScale = Math.min(scaleX, scaleY, 1);

            const x = (workspaceWidth - width * fitScale) / 2;
            const y = (workspaceHeight - height * fitScale) / 2;

            setScale(fitScale);
            setStagePosition({ x, y });
        }
    };

    // Mouse/touch handlers with panning support
    const handleMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const clickedOnEmpty = e.target === stage;

        // Handle panning mode (spacebar on web, two fingers on mobile)
        const isTouchEvent = 'touches' in e.evt;
        const touchCount = isTouchEvent ? (e.evt as TouchEvent).touches.length : 0;

        if (spaceKeyRef.current || touchCount === 2) {
            setIsPanning(true);
            const pos = stage.getPointerPosition();
            if (pos) {
                setPanStart({ x: pos.x - stagePosition.x, y: pos.y - stagePosition.y });
            }

            // Two-finger pinch/pan for mobile
            if (touchCount === 2) {
                const touch1 = (e.evt as TouchEvent).touches[0];
                const touch2 = (e.evt as TouchEvent).touches[1];
                const dist = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                lastDistRef.current = dist;
                lastCenterRef.current = {
                    x: (touch1.clientX + touch2.clientX) / 2,
                    y: (touch1.clientY + touch2.clientY) / 2,
                };
            }
            return;
        }

        // Handle selection mode
        if (tool === 'select') {
            if (clickedOnEmpty) {
                setSelectedId(null);
                return;
            }
            const id = e.target.id();
            if (id) {
                setSelectedId(id);
            }
            return;
        }

        // Handle drawing modes
        const pos = stage.getPointerPosition();
        if (!pos) return;

        isDrawingRef.current = true;
        setIsDrawing(true);
        setSelectedId(null);

        if (tool === 'pencil' || tool === 'eraser') {
            const newLine: DrawingLine = {
                id: `line-${Date.now()}`,
                tool: tool,
                points: [pos.x, pos.y],
                color: tool === 'eraser' ? canvasColor : color,
                size: tool === 'eraser' ? brushSize * 3 : brushSize,
                layerId: selectedLayerId,
            };
            setLines((prevLines) => [...prevLines, newLine]);
        } else if (tool === 'circle') {
            const newShape: Shape = {
                id: `circle-${Date.now()}`,
                type: 'circle',
                x: pos.x,
                y: pos.y,
                radius: brushSize * 3,
                color: color,
                rotation: 0,
                layerId: selectedLayerId,
            };
            setShapes((prevShapes) => [...prevShapes, newShape]);
            setIsDrawing(false);
            isDrawingRef.current = false;
            setTimeout(saveToHistory, 0);
        } else if (tool === 'rect') {
            const newShape: Shape = {
                id: `rect-${Date.now()}`,
                type: 'rect',
                x: pos.x,
                y: pos.y,
                width: brushSize * 6,
                height: brushSize * 4,
                color: color,
                rotation: 0,
                layerId: selectedLayerId,
            };
            setShapes((prevShapes) => [...prevShapes, newShape]);
            setIsDrawing(false);
            isDrawingRef.current = false;
            setTimeout(saveToHistory, 0);
        } else if (tool === 'triangle') {
            const newShape: Shape = {
                id: `triangle-${Date.now()}`,
                type: 'triangle',
                x: pos.x,
                y: pos.y,
                radius: brushSize * 3,
                color: color,
                rotation: 0,
                layerId: selectedLayerId,
            };
            setShapes((prevShapes) => [...prevShapes, newShape]);
            setIsDrawing(false);
            isDrawingRef.current = false;
            setTimeout(saveToHistory, 0);
        } else if (tool === 'star') {
            const newShape: Shape = {
                id: `star-${Date.now()}`,
                type: 'star',
                x: pos.x,
                y: pos.y,
                radius: brushSize * 3,
                color: color,
                rotation: 0,
                layerId: selectedLayerId,
            };
            setShapes((prevShapes) => [...prevShapes, newShape]);
            setIsDrawing(false);
            isDrawingRef.current = false;
            setTimeout(saveToHistory, 0);
        } else if (tool === 'text') {
            const text = window.prompt('What do you want to write?', 'Hello!');
            if (text) {
                const newText: TextItem = {
                    id: `text-${Date.now()}`,
                    text: text,
                    x: pos.x,
                    y: pos.y,
                    color: color,
                    fontSize: brushSize * 3,
                    rotation: 0,
                    layerId: selectedLayerId,
                };
                setTexts((prevTexts) => [...prevTexts, newText]);
                setTimeout(saveToHistory, 0);
            }
            setIsDrawing(false);
            isDrawingRef.current = false;
        }
    };

    const handleMouseMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;

        // Handle panning
        if (isPanning) {
            const pos = stage.getPointerPosition();
            if (!pos) return;

            // Check for two-finger pinch/zoom on mobile
            const isTouchEvent = 'touches' in e.evt;
            const touchCount = isTouchEvent ? (e.evt as TouchEvent).touches.length : 0;

            if (touchCount === 2) {
                const touch1 = (e.evt as TouchEvent).touches[0];
                const touch2 = (e.evt as TouchEvent).touches[1];
                const dist = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );

                if (lastDistRef.current > 0) {
                    const scaleBy = dist / lastDistRef.current;
                    const newScale = Math.max(0.1, Math.min(5, scale * scaleBy));
                    setScale(newScale);
                }
                lastDistRef.current = dist;

                const center = {
                    x: (touch1.clientX + touch2.clientX) / 2,
                    y: (touch1.clientY + touch2.clientY) / 2,
                };
                if (lastCenterRef.current) {
                    const dx = center.x - lastCenterRef.current.x;
                    const dy = center.y - lastCenterRef.current.y;
                    setStagePosition({
                        x: stagePosition.x + dx,
                        y: stagePosition.y + dy,
                    });
                }
                lastCenterRef.current = center;
            } else {
                // Single-point panning (spacebar + mouse)
                setStagePosition({
                    x: pos.x - panStart.x,
                    y: pos.y - panStart.y,
                });
            }
            return;
        }

        // Handle drawing
        if (!isDrawingRef.current) return;
        if (tool !== 'pencil' && tool !== 'eraser') return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        setLines((prevLines) => {
            const lastLine = prevLines[prevLines.length - 1];
            if (!lastLine) return prevLines;

            const updatedLine = {
                ...lastLine,
                points: [...lastLine.points, pos.x, pos.y],
            };

            return [...prevLines.slice(0, -1), updatedLine];
        });
    };

    const handleMouseUp = () => {
        if (isDrawingRef.current && (tool === 'pencil' || tool === 'eraser')) {
            setTimeout(saveToHistory, 0);
        }
        setIsDrawing(false);
        isDrawingRef.current = false;
        setIsPanning(false);
        lastDistRef.current = 0;
        lastCenterRef.current = null;
    };

    // Add sticker
    const handleAddSticker = (emoji: string) => {
        const newSticker: StickerItem = {
            id: `sticker-${Date.now()}`,
            emoji: emoji,
            x: canvasWidth / 2,
            y: canvasHeight / 2,
            size: brushSize * 5,
            rotation: 0,
            layerId: selectedLayerId,
        };
        setStickers([...stickers, newSticker]);
        setTimeout(saveToHistory, 0);
    };

    // Layer management
    const addLayer = () => {
        const newLayer: LayerType = {
            id: `layer-${Date.now()}`,
            name: `Layer ${layers.length + 1}`,
            visible: true,
            locked: false,
        };
        setLayers([...layers, newLayer]);
        setSelectedLayerId(newLayer.id);
    };

    const deleteLayer = (layerId: string) => {
        if (layers.length === 1) {
            alert('Cannot delete the last layer!');
            return;
        }
        setLayers(layers.filter(l => l.id !== layerId));
        setLines(lines.filter(l => l.layerId !== layerId));
        setShapes(shapes.filter(s => s.layerId !== layerId));
        setTexts(texts.filter(t => t.layerId !== layerId));
        setStickers(stickers.filter(s => s.layerId !== layerId));
        if (selectedLayerId === layerId) {
            setSelectedLayerId(layers[0].id);
        }
    };

    const toggleLayerVisibility = (layerId: string) => {
        setLayers(layers.map(l =>
            l.id === layerId ? { ...l, visible: !l.visible } : l
        ));
    };

    const toggleLayerLock = (layerId: string) => {
        setLayers(layers.map(l =>
            l.id === layerId ? { ...l, locked: !l.locked } : l
        ));
    };

    // Select entire layer (all elements in the layer)
    const selectLayer = (layerId: string) => {
        setSelectedLayerId(layerId);
        setTool('select');

        // Get all element IDs in this layer
        const layerElements = [
            ...shapes.filter(s => s.layerId === layerId).map(s => s.id),
            ...texts.filter(t => t.layerId === layerId).map(t => t.id),
            ...stickers.filter(s => s.layerId === layerId).map(s => s.id),
        ];

        // Select all elements in the layer for group transform
        if (layerElements.length > 0 && transformerRef.current && stageRef.current) {
            const nodes = layerElements.map(id => stageRef.current.findOne(`#${id}`)).filter(Boolean);
            transformerRef.current.nodes(nodes);
            transformerRef.current.getLayer()?.batchDraw();
        }
    };

    // Delete selected element
    const deleteSelected = () => {
        if (selectedId) {
            setLines(lines.filter(l => l.id !== selectedId));
            setShapes(shapes.filter(s => s.id !== selectedId));
            setTexts(texts.filter(t => t.id !== selectedId));
            setStickers(stickers.filter(s => s.id !== selectedId));
            setSelectedId(null);
            setTimeout(saveToHistory, 0);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedId && e.target === document.body) {
                    e.preventDefault();
                    deleteSelected();
                }
            }
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    handleUndo();
                } else if (e.key === 'y') {
                    e.preventDefault();
                    handleRedo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, historyStep, history]);

    // Get visible elements
    const getVisibleElements = () => {
        const visibleLayerIds = layers.filter(l => l.visible).map(l => l.id);
        return {
            lines: lines.filter(l => visibleLayerIds.includes(l.layerId)),
            shapes: shapes.filter(s => visibleLayerIds.includes(s.layerId)),
            texts: texts.filter(t => visibleLayerIds.includes(t.layerId)),
            stickers: stickers.filter(s => visibleLayerIds.includes(s.layerId)),
        };
    };

    const visibleElements = getVisibleElements();

    return (
        <div className="editor-shell">
            {/* Header */}
            <div className="editor-header">
                <h1>🎨 My Art Studio</h1>
                <div className="toolbar-group">
                    <button onClick={handleUndo} disabled={historyStep <= 0} title="Undo (Ctrl+Z)">
                        ↶ Undo
                    </button>
                    <button onClick={handleRedo} disabled={historyStep >= history.length - 1} title="Redo (Ctrl+Y)">
                        ↷ Redo
                    </button>
                    <button onClick={handleClear} title="Clear All" style={{ background: 'var(--danger-color)' }}>
                        🗑️ Clear
                    </button>
                    <button onClick={handleDownload} title="Save Drawing" style={{ background: 'var(--success-color)' }}>
                        💾 Save
                    </button>
                </div>
                <div className="toolbar-group">
                    <button onClick={() => setShowCanvasSettings(!showCanvasSettings)} title="Canvas Settings">
                        📐 Canvas
                    </button>
                    <button onClick={handleZoomOut} title="Zoom Out">🔍−</button>
                    <span style={{ padding: '0 8px', fontWeight: 'bold', color: '#FFFFFF' }}>{Math.round(scale * 100)}%</span>
                    <button onClick={handleZoomIn} title="Zoom In">🔍+</button>
                    <button onClick={handleZoomReset} title="Reset Zoom">⊡</button>
                </div>
            </div>

            {/* Canvas Settings Modal */}
            {showCanvasSettings && (
                <div className="modal-overlay" onClick={() => setShowCanvasSettings(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>📐 Canvas Settings</h2>
                        <div className="canvas-settings-form">
                            <div className="form-group">
                                <label>Width (px):</label>
                                <input
                                    type="number"
                                    value={canvasWidth}
                                    onChange={(e) => setCanvasWidth(Number(e.target.value))}
                                    min="256"
                                    max="4096"
                                />
                            </div>
                            <div className="form-group">
                                <label>Height (px):</label>
                                <input
                                    type="number"
                                    value={canvasHeight}
                                    onChange={(e) => setCanvasHeight(Number(e.target.value))}
                                    min="256"
                                    max="4096"
                                />
                            </div>
                            <div className="form-group">
                                <label>Quick Presets:</label>
                                <div className="preset-buttons">
                                    <button onClick={() => applyCanvasSize(1024, 1024)}>Square (1024×1024)</button>
                                    <button onClick={() => applyCanvasSize(1920, 1080)}>Landscape (1920×1080)</button>
                                    <button onClick={() => applyCanvasSize(1080, 1920)}>Portrait (1080×1920)</button>
                                    <button onClick={() => applyCanvasSize(512, 512)}>Small (512×512)</button>
                                </div>
                            </div>
                            <div className="form-actions">
                                <button onClick={() => applyCanvasSize(canvasWidth, canvasHeight)} style={{ background: 'var(--success-color)' }}>
                                    ✓ Apply
                                </button>
                                <button onClick={() => setShowCanvasSettings(false)} style={{ background: 'var(--danger-color)' }}>
                                    ✕ Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="editor-shell-layout">
                <div className="editor-layout">
                    {/* Left Navbar */}
                    <div className="editor-navbar">
                        <button className={tool === 'select' ? 'active' : ''} onClick={() => setTool('select')} title="Select">
                            🖱️
                        </button>
                        <button className={tool === 'pencil' ? 'active' : ''} onClick={() => setTool('pencil')} title="Pencil">
                            ✏️
                        </button>
                        <button className={tool === 'eraser' ? 'active' : ''} onClick={() => setTool('eraser')} title="Eraser">
                            🧹
                        </button>
                        <button className={tool === 'circle' ? 'active' : ''} onClick={() => setTool('circle')} title="Circle">
                            ⭕
                        </button>
                        <button className={tool === 'rect' ? 'active' : ''} onClick={() => setTool('rect')} title="Rectangle">
                            ⬜
                        </button>
                        <button className={tool === 'triangle' ? 'active' : ''} onClick={() => setTool('triangle')} title="Triangle">
                            🔺
                        </button>
                        <button className={tool === 'star' ? 'active' : ''} onClick={() => setTool('star')} title="Star">
                            ⭐
                        </button>
                        <button className={tool === 'text' ? 'active' : ''} onClick={() => setTool('text')} title="Text">
                            📝
                        </button>
                    </div>

                    {/* Tool Settings Sidebar */}
                    {toolSettingsOpen && (
                        <div className="tool-settings-sidebar">
                            <div className="tool-settings-header">
                                <h3>Tool Settings</h3>
                                <button onClick={() => setToolSettingsOpen(false)}>✕</button>
                            </div>

                            {/* Colors */}
                            <div className="settings-section">
                                <h4>Colors</h4>
                                <div className="color-picker-grid">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c.value}
                                            className={`color-swatch ${color === c.value ? 'active' : ''}`}
                                            style={{ backgroundColor: c.value }}
                                            onClick={() => setColor(c.value)}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Brush Size */}
                            <div className="settings-section">
                                <h4>Size: {brushSize}px</h4>
                                <input
                                    type="range"
                                    min="2"
                                    max="50"
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(Number(e.target.value))}
                                    className="brush-slider"
                                />
                                <div className="brush-preview">
                                    <div style={{
                                        width: brushSize,
                                        height: brushSize,
                                        borderRadius: '50%',
                                        backgroundColor: tool === 'eraser' ? '#CCCCCC' : color,
                                        margin: '0 auto',
                                        border: '2px solid #999',
                                    }} />
                                </div>
                            </div>

                            {/* Stickers */}
                            <div className="settings-section">
                                <h4>Stickers</h4>
                                <div className="stickers-grid">
                                    {STICKERS.map((emoji, index) => (
                                        <button
                                            key={index}
                                            className="sticker-button"
                                            onClick={() => handleAddSticker(emoji)}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Canvas Background */}
                            <div className="settings-section">
                                <h4>Canvas Color</h4>
                                <input
                                    type="color"
                                    value={canvasColor}
                                    onChange={(e) => setCanvasColor(e.target.value)}
                                    style={{ width: '100%', height: '40px' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Toggle button when closed */}
                    {!toolSettingsOpen && (
                        <button className="tool-settings-toggle" onClick={() => setToolSettingsOpen(true)}>
                            ▶
                        </button>
                    )}

                    {/* Canvas Workspace */}
                    <div className="editor-canvas-workspace" ref={workspaceRef}>
                        <div className="stage-wrapper" style={{
                            cursor: spacePressed || isPanning ? (isPanning ? 'grabbing' : 'grab') :
                                   tool === 'pencil' ? 'crosshair' :
                                   tool === 'eraser' ? 'crosshair' :
                                   tool === 'select' ? 'default' :
                                   tool === 'text' ? 'text' :
                                   'crosshair'
                        }}>
                            <Stage
                                ref={stageRef}
                                width={canvasWidth}
                                height={canvasHeight}
                                scaleX={scale}
                                scaleY={scale}
                                x={stagePosition.x}
                                y={stagePosition.y}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onTouchStart={handleMouseDown}
                                onTouchMove={handleMouseMove}
                                onTouchEnd={handleMouseUp}
                                style={{ background: canvasColor }}
                            >
                                <Layer>
                                    {/* Lines */}
                                    {visibleElements.lines.map((line) => (
                                        <Line
                                            key={line.id}
                                            id={line.id}
                                            points={line.points}
                                            stroke={line.color}
                                            strokeWidth={line.size}
                                            tension={0.5}
                                            lineCap="round"
                                            lineJoin="round"
                                            globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                                        />
                                    ))}

                                    {/* Shapes */}
                                    {visibleElements.shapes.map((shape) => {
                                        if (shape.type === 'circle') {
                                            return (
                                                <Circle
                                                    key={shape.id}
                                                    id={shape.id}
                                                    x={shape.x}
                                                    y={shape.y}
                                                    radius={shape.radius || 50}
                                                    fill={shape.color}
                                                    rotation={shape.rotation}
                                                    draggable={tool === 'select'}
                                                    onClick={() => tool === 'select' && setSelectedId(shape.id)}
                                                />
                                            );
                                        } else if (shape.type === 'rect') {
                                            return (
                                                <Rect
                                                    key={shape.id}
                                                    id={shape.id}
                                                    x={shape.x}
                                                    y={shape.y}
                                                    width={shape.width || 100}
                                                    height={shape.height || 80}
                                                    fill={shape.color}
                                                    rotation={shape.rotation}
                                                    offsetX={(shape.width || 100) / 2}
                                                    offsetY={(shape.height || 80) / 2}
                                                    draggable={tool === 'select'}
                                                    onClick={() => tool === 'select' && setSelectedId(shape.id)}
                                                />
                                            );
                                        } else if (shape.type === 'triangle') {
                                            return (
                                                <RegularPolygon
                                                    key={shape.id}
                                                    id={shape.id}
                                                    x={shape.x}
                                                    y={shape.y}
                                                    sides={3}
                                                    radius={shape.radius || 50}
                                                    fill={shape.color}
                                                    rotation={shape.rotation}
                                                    draggable={tool === 'select'}
                                                    onClick={() => tool === 'select' && setSelectedId(shape.id)}
                                                />
                                            );
                                        } else if (shape.type === 'star') {
                                            return (
                                                <RegularPolygon
                                                    key={shape.id}
                                                    id={shape.id}
                                                    x={shape.x}
                                                    y={shape.y}
                                                    sides={5}
                                                    radius={shape.radius || 50}
                                                    fill={shape.color}
                                                    rotation={shape.rotation}
                                                    draggable={tool === 'select'}
                                                    onClick={() => tool === 'select' && setSelectedId(shape.id)}
                                                />
                                            );
                                        }
                                        return null;
                                    })}

                                    {/* Texts */}
                                    {visibleElements.texts.map((textItem) => (
                                        <KonvaText
                                            key={textItem.id}
                                            id={textItem.id}
                                            x={textItem.x}
                                            y={textItem.y}
                                            text={textItem.text}
                                            fontSize={textItem.fontSize}
                                            fontFamily="Comic Sans MS, cursive"
                                            fill={textItem.color}
                                            rotation={textItem.rotation}
                                            draggable={tool === 'select'}
                                            onClick={() => tool === 'select' && setSelectedId(textItem.id)}
                                        />
                                    ))}

                                    {/* Stickers */}
                                    {visibleElements.stickers.map((sticker) => (
                                        <KonvaText
                                            key={sticker.id}
                                            id={sticker.id}
                                            x={sticker.x}
                                            y={sticker.y}
                                            text={sticker.emoji}
                                            fontSize={sticker.size}
                                            rotation={sticker.rotation}
                                            draggable={tool === 'select'}
                                            onClick={() => tool === 'select' && setSelectedId(sticker.id)}
                                        />
                                    ))}

                                    {/* Transformer for selection */}
                                    <Transformer
                                        ref={transformerRef}
                                        boundBoxFunc={(oldBox, newBox) => {
                                            if (newBox.width < 5 || newBox.height < 5) {
                                                return oldBox;
                                            }
                                            return newBox;
                                        }}
                                    />
                                </Layer>
                            </Stage>
                        </div>
                    </div>

                    {/* Right Sidebar - Layers */}
                    <div className="editor-sidebar">
                        <h2>📚 Layers</h2>
                        <button onClick={addLayer} className="add-layer-button">
                            ➕ Add Layer
                        </button>

                        <div className="layers-panel">
                            <ul>
                                {layers.map((layer) => (
                                    <li key={layer.id} className={`layer-row ${selectedLayerId === layer.id ? 'selected' : ''} ${!layer.visible ? 'muted' : ''}`}>
                                        <button
                                            className="layer-main"
                                            onClick={() => selectLayer(layer.id)}
                                            title="Click to select all elements in this layer"
                                        >
                                            <span>{layer.name}</span>
                                        </button>
                                        <div className="layer-actions">
                                            <button
                                                onClick={() => toggleLayerVisibility(layer.id)}
                                                title={layer.visible ? 'Hide' : 'Show'}
                                            >
                                                {layer.visible ? '👁️' : '🚫'}
                                            </button>
                                            <button
                                                onClick={() => toggleLayerLock(layer.id)}
                                                title={layer.locked ? 'Unlock' : 'Lock'}
                                            >
                                                {layer.locked ? '🔒' : '🔓'}
                                            </button>
                                            <button
                                                onClick={() => deleteLayer(layer.id)}
                                                disabled={layers.length === 1}
                                                title="Delete Layer"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {selectedId && (
                            <div className="selection-info">
                                <h3>Selected Element</h3>
                                <button onClick={deleteSelected} style={{ background: 'var(--danger-color)', width: '100%' }}>
                                    🗑️ Delete Selected
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
