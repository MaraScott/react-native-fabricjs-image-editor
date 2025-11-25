import { useRef, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { WHEEL_ZOOM_STEP, KEYBOARD_ZOOM_STEP, PINCH_ZOOM_SENSITIVITY, TOUCH_DELTA_THRESHOLD, useUpdateZoom, useApplyZoomDelta } from './hooks/zoomUtils';
import { useResize } from './hooks/useResize';
import { useRotation } from './hooks/useRotation';
import { useSelector, useDispatch } from 'react-redux';
import { selectActions } from '@store/CanvasApp/view/select';
import { selectSelectionTransform } from '@store/CanvasApp/view/selectors';
import { Stage } from '@atoms/Canvas';
import { SelectionLayer, StageGroup, LayerPanelUI, BackgroundLayer } from '@molecules/Layer';
import { useSimpleCanvasStore } from '@store/SimpleCanvas';
import { useSelectionBounds } from './hooks/useSelectionBounds';
import { Layer as KonvaLayer } from '@atoms/Canvas';

import type { RootState } from '@store/CanvasApp';
import type { PointerPanState, TouchPanState, SelectionDragState, SelectionNodeSnapshot, SelectionTransformSnapshot, Bounds } from './types/canvas.types';
import type { PanOffset, LayerStroke, LayerTextItem } from '@molecules/Layer/Layer.types';

import { Rect, Group, Line, Text as KonvaText } from "react-konva";
import { drawActions } from '@store/CanvasApp/view/draw';
import { rubberActions } from '@store/CanvasApp/view/rubber';
import { textActions } from '@store/CanvasApp/view/text';
import { SettingsPanelUI } from '@molecules/Settings/SettingsPanelUI';
import type { Layer as KonvaLayerType } from 'konva/lib/Layer';

export interface SimpleCanvasProps {
    stageWidth?: number;
    stageHeight?: number;
    backgroundColor?: string;
    containerBackground?: string;
    zoom?: number;
    fitRequest?: number;
    children?: ReactNode;
    onStageReady?: (stage: Konva.Stage) => void;
    onZoomChange?: (zoom: number) => void;
    panModeActive?: boolean;
    layersRevision?: number;
    selectModeActive?: boolean;
}

export const SimpleCanvas = ({
    stageWidth = 1024,
    stageHeight = 1024,
    backgroundColor = '#cccccc33',
    containerBackground = '#cccccc',
    zoom = 0,
    fitRequest = 0,
    children,
    onStageReady,
    onZoomChange,
    panModeActive = false,
    layersRevision = 0,
    selectModeActive = false,
}: SimpleCanvasProps) => {
    type Stroke = {
        id: string;
        points: number[];
        color: string;
        size: number;
        hardness: number;
        opacity: number;
    };

    const { layerControls, renderableLayers } = useSimpleCanvasStore((state) => state);
    const dispatch = useDispatch();
    const isSelectToolActive = useSelector((state: RootState) => state.view.select.active);
    const drawToolState = useSelector((state: RootState) => state.view.draw);
    const rubberToolState = useSelector((state: RootState) => state.view.rubber);
    const textToolState = useSelector((state: RootState) => state.view.text);
    const paintToolState = useSelector((state: RootState) => state.view.paint);
    const isDrawToolActive = drawToolState.active;
    const isRubberToolActive = rubberToolState.active;
    const isTextToolActive = textToolState.active;
    const isPaintToolActive = paintToolState.active;
    // Read selectionTransform from Redux
    const reduxSelectionTransform = useSelector(selectSelectionTransform);
    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastTouchDistance = useRef(0);
    const pointerPanState = useRef<PointerPanState | null>(null);
    const touchPanState = useRef<TouchPanState | null>(null);
    const selectionDragStateRef = useRef<SelectionDragState | null>(null);
    const onRefChange = ({ node, layer }) => {
        if (node) {
            layerNodeRefs.current.set(layer.id, node);
        } else {
            layerNodeRefs.current.delete(layer.id);
        }
        syncTransformerToSelection();
    }
    const pendingSelectionRef = useRef<string[] | null>(null);
    const interactionLayerRef = useRef<Konva.Layer | null>(null);
    const selectionTransformerRef = useRef<Konva.Transformer | null>(null);
    const selectionLayerRef = useRef<KonvaLayerType | null>(null);
    const selectionTransformStateRef = useRef<SelectionTransformSnapshot | null>(null);
    const transformAnimationFrameRef = useRef<number | null>(null);
    const isSelectionTransformingRef = useRef(false);
    const [internalZoom, setInternalZoom] = useState<number>(zoom);
    const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 });
    const backgroundLayerRef = useRef<KonvaLayerType | null>(null);
    // Use useResize hook for containerDimensions and scale (keep single containerRef)
    const { dimensions: containerDimensions, scale, setDimensions: setContainerDimensions, setScale } = useResize(containerRef, stageWidth, stageHeight, internalZoom);
    const panOffsetRef = useRef(panOffset);
    const [spacePressed, setSpacePressed] = useState(false);
    const [isPointerPanning, setIsPointerPanning] = useState(false);
    const [isTouchPanning, setIsTouchPanning] = useState(false);
    const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
    const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
    const [layerRefreshKey, setLayerRefreshKey] = useState(0);
    const [eraserSize, setEraserSize] = useState(rubberToolState.eraserSize);
    const [selectedLayerBounds, setSelectedLayerBounds] = useState<Bounds | null>(null);
    const [overlaySelectionBox, setOverlaySelectionBox] = useState<
        | { x: number; y: number; width: number; height: number; rotation?: number }
        | null
    >(null);

    // Map of selected layer IDs to their Konva nodes
    const selectedLayerNodeRefs = useRef<Map<string, Konva.Node>>(new Map());
    const [pendingStroke, setPendingStroke] = useState<{ layerId: string; stroke: LayerStroke } | null>(null);
    type TextEditState = {
        layerId: string;
        textId: string;
        value: string;
        left: number;
        top: number;
        fontSize: number;
        fontFamily: string;
        fontStyle?: 'normal' | 'italic';
        fontWeight?: string;
        color?: string;
    };
    const [activeTextEdit, setActiveTextEdit] = useState<TextEditState | null>(null);
    useEffect(() => {
        setEraserSize(rubberToolState.eraserSize);
    }, [rubberToolState.eraserSize]);

    // Open settings panel by default for kid theme; watch for theme class changes.
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const layout = document.querySelector('.canvas-layout');
        const updateFromTheme = () => {
            if (layout?.classList.contains('kid')) {
                setIsSettingsPanelOpen(true);
            }
        };
        updateFromTheme();
        if (!layout) return;
        const observer = new MutationObserver(updateFromTheme);
        observer.observe(layout, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const layersToRender = useMemo(() => {
        if (!layerControls) return [];

        const source =
            renderableLayers.length === layerControls.layers.length
                ? renderableLayers
                : layerControls.layers;

        // always return a fresh array to reflect changed order
        return [...source];
    }, [layerControls?.layers, renderableLayers]);
    const layerOrderSignature = useMemo(
        () => layersToRender.map((layer) => layer.id).join('|'),
        [layersToRender]
    );

    const penSettings = useMemo(() => ({
        size: drawToolState.brushSize,
        hardness: drawToolState.brushHardness ?? 1,
        color: drawToolState.brushColor,
        opacity: drawToolState.brushOpacity,
        onSizeChange: (size: number) => dispatch(drawActions.setBrushSize(size)),
        onHardnessChange: (value: number) => dispatch(drawActions.setBrushHardness(value)),
        onColorChange: (color: string) => dispatch(drawActions.setBrushColor(color)),
        onOpacityChange: (opacity: number) => dispatch(drawActions.setBrushOpacity(opacity)),
    }), [dispatch, drawToolState.brushColor, drawToolState.brushHardness, drawToolState.brushOpacity, drawToolState.brushSize]);

    // Keep Konva node order in sync when moveLayer fires.
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const applyOrder = (orderedIds: string[]) => {
            setLayerRefreshKey((previous) => previous + 1);
            interactionLayerRef.current?.batchDraw?.();
        };

        const handleRefresh = (event: Event) => {
            const detail = (event as CustomEvent<{ layerIds?: string[] }>).detail;
            const orderedIds = detail?.layerIds ?? layersToRender.map((layer) => layer.id);
            applyOrder(orderedIds);
        };

        // Initial sync for current render order
        applyOrder(layersToRender.map((layer) => layer.id));

        window.addEventListener('layer-move-refresh', handleRefresh as EventListener);
        return () => {
            window.removeEventListener('layer-move-refresh', handleRefresh as EventListener);
        };
    }, [layerOrderSignature, layersToRender]);

    const selectedLayerIds = layerControls?.selectedLayerIds ?? [];
    const stableSelectedLayerIds = useMemo(
        () => selectedLayerIds,
        [JSON.stringify(selectedLayerIds)]
    );
    const selectedLayerSet = useMemo(() => new Set(selectedLayerIds), [selectedLayerIds]);
    const selectedTextLayer = useMemo(() => {
        if (!layerControls) return null;
        for (const id of selectedLayerIds) {
            const layer = layerControls.layers.find((l) => l.id === id);
            if (layer && (layer.texts?.length ?? 0) > 0) {
                return layer;
            }
        }
        return null;
    }, [layerControls, selectedLayerIds]);
    const selectedTextItem = useMemo(() => selectedTextLayer?.texts?.[0] ?? null, [selectedTextLayer]);
    const showSettingsPanel = true;

    const applyTextStyleToSelection = useCallback((updates: Partial<LayerTextItem>) => {
        if (!selectedTextLayer || !selectedTextItem || !layerControls?.updateLayerTexts) return;
        const nextTexts = (selectedTextLayer.texts ?? []).map((text) =>
            text.id === selectedTextItem.id ? { ...text, ...updates } : text
        );
        layerControls.updateLayerTexts(selectedTextLayer.id, nextTexts);
    }, [layerControls, selectedTextItem, selectedTextLayer]);

    const textSettings = useMemo(() => {
        const source = selectedTextItem ?? textToolState;
        const fontSize = selectedTextItem?.fontSize ?? textToolState.fontSize;
        const color = selectedTextItem ? (selectedTextItem.fill ?? textToolState.color) : textToolState.color;
        const fontFamily = selectedTextItem?.fontFamily ?? textToolState.fontFamily;
        const fontStyle = selectedTextItem?.fontStyle ?? textToolState.fontStyle;
        const fontWeight = selectedTextItem?.fontWeight ?? textToolState.fontWeight;
        return {
            text: source.text,
            fontSize,
            color,
            fontFamily,
            fontStyle,
            fontWeight,
            onTextChange: (value: string) => {
                dispatch(textActions.setText(value));
                applyTextStyleToSelection({ text: value });
            },
            onFontSizeChange: (value: number) => {
                dispatch(textActions.setFontSize(value));
                applyTextStyleToSelection({ fontSize: value });
            },
            onColorChange: (value: string) => {
                dispatch(textActions.setColor(value));
                applyTextStyleToSelection({ fill: value });
            },
            onFontFamilyChange: (value: string) => {
                dispatch(textActions.setFontFamily(value));
                applyTextStyleToSelection({ fontFamily: value });
            },
            onFontStyleChange: (value: 'normal' | 'italic') => {
                dispatch(textActions.setFontStyle(value));
                applyTextStyleToSelection({ fontStyle: value });
            },
            onFontWeightChange: (value: string) => {
                dispatch(textActions.setFontWeight(value));
                applyTextStyleToSelection({ fontWeight: value });
            },
        };
    }, [applyTextStyleToSelection, dispatch, selectedTextItem, textToolState]);
    useEffect(() => {
        if (!layerControls || selectedLayerIds.length > 0) return;
        if (layerControls.layers.length > 0) {
            const topLayer = layerControls.layers[layerControls.layers.length - 1];
            layerControls.selectLayer(topLayer.id, { mode: 'replace' });
        }
    }, [layerControls, selectedLayerIds]);

    // Viewport offsets and transformer scale helpers
    const renderWidth = Math.max(1, stageWidth * scale);
    const renderHeight = Math.max(1, stageHeight * scale);
    const safeScale = Math.max(scale, 0.0001);
    const stageViewportOffsetX = ((containerDimensions.width - renderWidth) / 2 + panOffset.x) / Math.max(safeScale, 0.000001);
    const stageViewportOffsetY = ((containerDimensions.height - renderHeight) / 2 + panOffset.y) / Math.max(safeScale, 0.000001);
    // Keep selection handles a constant screen size (do not scale with zoom)
    const outlineDash: [number, number] = [8, 4];
    const transformerAnchorSize = 8;
    const transformerAnchorStrokeWidth = 1;
    const transformerAnchorCornerRadius = 2;
    const transformerPadding = 0;
    const transformerHitStrokeWidth = 12;
    // Keep pan offset ref in sync for event handlers that read it
    useEffect(() => {
        panOffsetRef.current = panOffset;
    }, [panOffset]);

    // Utility: Sync selectedLayerNodeRefs from layerNodeRefs and selectedLayerIds
    const syncSelectedLayerNodeRefs = useCallback(() => {
        selectedLayerNodeRefs.current.clear();
        selectedLayerIds.forEach((id) => {
            const node = layerNodeRefs.current.get(id);
            if (node) {
                selectedLayerNodeRefs.current.set(id, node);
            }
        });
    }, [selectedLayerIds]);

    const layerNodeRefs = useRef<Map<string, Konva.Node>>(new Map());
    // Handle rasterize requests (convert layer group into bitmap image)
    useEffect(() => {
        const handleRasterizeRequest = (event: Event) => {
            const detail = (event as CustomEvent<{ layerId: string }>).detail;
            const layerId = detail?.layerId;
            if (!layerId || !layerControls?.rasterizeLayer) return;
            const layerDescriptor = layerControls.layers.find((layer) => layer.id === layerId);
            const node = layerNodeRefs.current.get(layerId);
            if (!node) return;
            try {
                let bounds: Bounds | null = layerDescriptor?.bounds ?? null;
                if (!bounds) {
                    const stage = node.getStage();
                    if (stage) {
                        const rect = node.getClientRect({
                            skipTransform: false,
                            relativeTo: stage,
                        });
                        const finite = [rect.x, rect.y, rect.width, rect.height].every((value) => Number.isFinite(value));
                        if (finite) {
                            bounds = {
                                x: rect.x - stageViewportOffsetX,
                                y: rect.y - stageViewportOffsetY,
                                width: rect.width,
                                height: rect.height,
                            };
                        }
                    }
                }

                const dataUrl = node.toDataURL({
                    mimeType: 'image/png',
                    quality: 1,
                    pixelRatio: 1,
                    backgroundColor: 'rgba(0,0,0,0)',
                });
                layerControls.rasterizeLayer(layerId, dataUrl, { bounds });
            } catch (error) {
                console.warn('Unable to rasterize layer', error);
            }
        };
        window.addEventListener('rasterize-layer-request', handleRasterizeRequest as EventListener);
        return () => {
            window.removeEventListener('rasterize-layer-request', handleRasterizeRequest as EventListener);
        };
    }, [layerControls]);

    // Use selection bounds hook (must be before using resolveSelectionRotation)
    const {
        updateBoundsFromLayerIds: _updateBoundsFromLayerIds,
        refreshBoundsFromSelection: _refreshBoundsFromSelection,
        scheduleBoundsRefresh,
        resolveSelectionRotation,
    } = useSelectionBounds({
        selectModeActive,
        layerControls,
        stageRef,
        layerNodeRefs,
        pendingSelectionRef,
        transformAnimationFrameRef,
        setSelectedLayerBounds,
    });

    // Rotation logic is now handled by useRotation (must be after resolveSelectionRotation)
    const { selectionProxyRotationRef, getRotationDeg, getRotationRad } = useRotation(resolveSelectionRotation);

    // Wrap bounds functions with debug logging
    // Assume updateBoundsFromLayerIds takes a single argument (array of ids)
    const updateBoundsFromLayerIds = (ids: string[]) => {
        return _updateBoundsFromLayerIds(ids);
    };
    // Assume refreshBoundsFromSelection takes no arguments
    const refreshBoundsFromSelection = () => {
        return _refreshBoundsFromSelection();
    };


    // --- Unified selection transform state for Layer and SelectionLayer ---
    // Use Redux selectionTransform as the single source of truth
    const selectionTransform = reduxSelectionTransform;

    // Ensure selectionTransform is initialized when selection changes
    useEffect(() => {
        if (selectedLayerIds.length > 0 && !reduxSelectionTransform) {
            // Compute bounding box from selectedLayerBounds if available
            if (selectedLayerBounds) {
                const { x, y, width, height } = selectedLayerBounds;
                // Default rotation and scale
                const rotation = 0;
                const scaleX = 1;
                const scaleY = 1;
                dispatch(selectActions.setSelectionTransform({ x, y, width, height, rotation, scaleX, scaleY }));
            }
        }
        // If selection is cleared, also clear selectionTransform
        if (selectedLayerIds.length === 0 && reduxSelectionTransform) {
            dispatch(selectActions.setSelectionTransform(null));
        }
    }, [selectedLayerIds, selectedLayerBounds, reduxSelectionTransform, dispatch]);

    // Recenter-on-fit token from parent (Fit button)
    useEffect(() => {
        setPanOffset({ x: 0, y: 0 });
        panOffsetRef.current = { x: 0, y: 0 };
    }, [fitRequest]);

    const captureSelectionTransformState = useCallback(() => {
        const nodeSnapshots = selectedLayerIds
            .map((layerId) => {
                const node = layerNodeRefs.current.get(layerId);
                const layer = layerControls?.layers.find((l) => l.id === layerId);
                if (!node || !layer) {
                    return null;
                }
                return {
                    id: layerId,
                    node,
                    initialScaleX: node.scaleX() || 1,
                    initialScaleY: node.scaleY() || 1,
                    texts: layer.texts ? layer.texts.map((t) => ({ ...t })) : [],
                };
            })
            .filter((snapshot): snapshot is SelectionNodeSnapshot & { initialScaleX: number; initialScaleY: number; texts: LayerTextItem[] } => Boolean(snapshot));

        if (nodeSnapshots.length === 0) {
            selectionTransformStateRef.current = null;
            return;
        }

        selectionTransformStateRef.current = {
            nodes: nodeSnapshots,
        } as any;
    }, [layerControls?.layers, selectedLayerIds]);

    const applySelectionTransformDelta = useCallback(() => {
        const snapshot = selectionTransformStateRef.current as {
            nodes?: Array<{
                id: string;
                node: Konva.Node;
                initialScaleX: number;
                initialScaleY: number;
                texts: LayerTextItem[];
            }>;
        } | null;
        if (!snapshot?.nodes || !layerControls) {
            return;
        }

        let lastFontSize: number | null = null;

        snapshot.nodes.forEach((snap) => {
            const currentScaleX = snap.node.scaleX() || 1;
            const currentScaleY = snap.node.scaleY() || 1;
            const relScaleX = currentScaleX / (snap.initialScaleX || 1);
            const relScaleY = currentScaleY / (snap.initialScaleY || 1);
            const avgScale = (Math.abs(relScaleX) + Math.abs(relScaleY)) / 2 || 1;

            if (snap.texts.length > 0) {
                const nextTexts = snap.texts.map((text) => ({
                    ...text,
                    x: text.x ?? 0,
                    y: text.y ?? 0,
                    fontSize: (text.fontSize ?? 32) * avgScale,
                }));
                layerControls.updateLayerTexts?.(snap.id, nextTexts);
                lastFontSize = nextTexts[0]?.fontSize ?? lastFontSize;

                // Reset scale so subsequent deltas are relative to the updated size.
                snap.node.scale({ x: 1, y: 1 });
                snap.initialScaleX = 1;
                snap.initialScaleY = 1;
                snap.texts = nextTexts;
            }
        });

        if (lastFontSize !== null) {
            dispatch(textActions.setFontSize(lastFontSize));
            // Force settings panel to reflect the live font size change.
            setIsSettingsPanelOpen((prev) => prev);
        }
    }, [dispatch, layerControls]);



    // Warn when eraser is selected but layer must be rasterized first
    const rasterizeAlertShownRef = useRef(false);
    useEffect(() => {
        if (!isRubberToolActive || !layerControls) {
            rasterizeAlertShownRef.current = false;
            return;
        }
        const needsRasterize = selectedLayerIds.some((id) => {
            const layer = layerControls.layers.find((l) => l.id === id);
            if (!layer) return false;
            const hasVectorContent = (layer.texts?.length ?? 0) > 0 || typeof layer.render === 'function';
            return hasVectorContent;
        });
        if (needsRasterize && !rasterizeAlertShownRef.current) {
            rasterizeAlertShownRef.current = true;
            try {
                window.alert('You need to rasterize before erasing.');
            } catch {
                // ignore
            }
        }
    }, [isRubberToolActive, layerControls, selectedLayerIds]);

    // Unified effect for selection bounds refresh
    useEffect(() => {
        if (!selectModeActive) {
            setSelectedLayerBounds(null);
            return;
        }
        // Always refresh on these triggers
        refreshBoundsFromSelection();
    }, [selectModeActive, layersRevision, scale, JSON.stringify(selectedLayerIds)]);

    // Unified effect: handle stage ready, scale, and zoom sync
    useEffect(() => {
        if (stageRef.current) {
            if (onStageReady) onStageReady(stageRef.current);
            stageRef.current.scale({ x: scale, y: scale });
        }
        setInternalZoom(zoom);
    }, [onStageReady, scale, zoom]);

    // Zoom useCallback hooks
    const updateZoom = useUpdateZoom(onZoomChange, setInternalZoom);
    const applyZoomDelta = useApplyZoomDelta(updateZoom);

    const getRelativePointerPosition = useCallback(() => {
        const stage = stageRef.current;
        if (!stage) return null;
        const pos = stage.getPointerPosition();
        if (!pos) return null;
        return {
            x: pos.x / safeScale - stageViewportOffsetX,
            y: pos.y / safeScale - stageViewportOffsetY,
        };
    }, [safeScale, stageViewportOffsetX, stageViewportOffsetY]);

    const markSelectionTransforming = useCallback((flag: boolean) => {
        isSelectionTransformingRef.current = flag;
    }, []);

    const getTextItem = useCallback((layerId: string, textId: string) => {
        const layer = layerControls?.layers.find((l) => l.id === layerId);
        const textItem = layer?.texts?.find((t) => t.id === textId);
        return { layer, textItem };
    }, [layerControls?.layers]);

    const updateTextValue = useCallback((layerId: string, textId: string, value: string) => {
        if (!layerControls?.updateLayerTexts) return;
        const { layer } = getTextItem(layerId, textId);
        if (!layer) return;
        const nextTexts = (layer.texts ?? []).map((text) => text.id === textId ? { ...text, text: value } : text);
        layerControls.updateLayerTexts(layerId, nextTexts);
    }, [getTextItem, layerControls]);

    const removeTextItem = useCallback((layerId: string, textId: string) => {
        if (!layerControls?.updateLayerTexts) return;
        const { layer } = getTextItem(layerId, textId);
        if (!layer) return;
        const nextTexts = (layer.texts ?? []).filter((text) => text.id !== textId);
        layerControls.updateLayerTexts(layerId, nextTexts);
    }, [getTextItem, layerControls]);

    const finishTextEdit = useCallback(() => {
        if (!activeTextEdit) return;
        const trimmed = (activeTextEdit.value ?? '').trim();
        if (!trimmed) {
            removeTextItem(activeTextEdit.layerId, activeTextEdit.textId);
        } else {
            updateTextValue(activeTextEdit.layerId, activeTextEdit.textId, trimmed);
        }
        setActiveTextEdit(null);
    }, [activeTextEdit, getTextItem, removeTextItem, updateTextValue]);

    // Utility: Commit selected layer node values back to app state (e.g., after transform)
    const commitSelectedLayerNodeTransforms = useCallback(() => {
        if (activeTextEdit) {
            finishTextEdit();
            return;
        }
        if (!layerControls) return;
        selectedLayerNodeRefs.current.forEach((node, id) => {
            if (!node) return;
            const pos = node.position();
            const rot = node.rotation();
            let scaleX = node.scaleX();
            let scaleY = node.scaleY();
            // Nodes are positioned with viewport offsets applied; store back in layer space.
            let adjustedX = pos.x - stageViewportOffsetX;
            let adjustedY = pos.y - stageViewportOffsetY;

            const layerData = layerControls.layers.find((l) => l.id === id);
            const texts = layerData?.texts ?? [];
            const scaleChanged = Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001;
            if (texts.length > 0 && scaleChanged) {
                // When finishing transform, the live update already set font sizes; just normalize scale/position if scaling occurred.
                scaleX = 1;
                scaleY = 1;
                const layerPosX = layerData?.position?.x ?? 0;
                const layerPosY = layerData?.position?.y ?? 0;
                node.position({
                    x: layerPosX + stageViewportOffsetX,
                    y: layerPosY + stageViewportOffsetY,
                });
                node.scale({ x: 1, y: 1 });
                adjustedX = layerPosX;
                adjustedY = layerPosY;
            }

            if (typeof layerControls.updateLayerTransform === 'function') {
                layerControls.updateLayerTransform(id, {
                    position: { x: adjustedX, y: adjustedY },
                    rotation: rot,
                    scale: { x: scaleX, y: scaleY },
                });
            } else {
                if (typeof layerControls.updateLayerPosition === 'function') {
                    layerControls.updateLayerPosition(id, { x: adjustedX, y: adjustedY });
                }
                if (typeof layerControls.updateLayerRotation === 'function') {
                    layerControls.updateLayerRotation(id, rot);
                }
                if (typeof layerControls.updateLayerScale === 'function') {
                    layerControls.updateLayerScale(id, { x: scaleX, y: scaleY });
                }
            }
        });
    }, [activeTextEdit, finishTextEdit, layerControls, stageViewportOffsetX, stageViewportOffsetY]);

    const startTextEdit = useCallback((layerId: string, textId: string) => {
        const { textItem, layer } = getTextItem(layerId, textId);
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!textItem || !layer || !containerRect) return;

        const layerBaseX = (layer.bounds?.x ?? layer.position?.x ?? 0);
        const layerBaseY = (layer.bounds?.y ?? layer.position?.y ?? 0);
        const left = (stageViewportOffsetX + layerBaseX + (textItem.x ?? 0)) * safeScale;
        const top = (stageViewportOffsetY + layerBaseY + (textItem.y ?? 0)) * safeScale;

        setActiveTextEdit({
            layerId,
            textId,
            value: textItem.text ?? '',
            left,
            top,
            fontSize: textItem.fontSize ?? 32,
            fontFamily: textItem.fontFamily ?? 'Arial, sans-serif',
            fontStyle: textItem.fontStyle ?? 'normal',
            fontWeight: textItem.fontWeight ?? 'normal',
            color: textItem.fill ?? '#000000',
        });

        // Focus the canvas container so key events can be captured for escape handling.
        const container = stageRef.current?.container();
        if (container && typeof container.focus === 'function') {
            if (!container.getAttribute('tabindex')) {
                container.setAttribute('tabindex', '0');
            }
            container.focus();
        }
    }, [getTextItem, safeScale, stageViewportOffsetX, stageViewportOffsetY]);

    const initializeSelectionTransform = useCallback((bounds: Bounds | null) => {
        if (!bounds) return;
        const { x, y, width, height } = bounds;
        const rotation = 0;
        const scaleX = 1;
        const scaleY = 1;
        dispatch(selectActions.setSelectionTransform({ x, y, width, height, rotation, scaleX, scaleY }));
    }, [dispatch]);

    // Mouse wheel zoom
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (event: WheelEvent) => {
            const target = event.target as HTMLElement | null;
            if (target && (target.closest('.layer-panel-ui') || target.closest('.settings-panel-ui'))) {
                // Let the layer panel handle its own scrolling
                return;
            }

            event.preventDefault();

            if (event.deltaY === 0) return;

            const direction = -Math.sign(event.deltaY);
            applyZoomDelta(direction * WHEEL_ZOOM_STEP);
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [applyZoomDelta]);

    // Keyboard zoom controls and pan activation via space bar
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target) {
                const tagName = target.tagName;
                if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable) {
                    return;
                }
            }

            if (event.code === 'Space') {
                if (!event.repeat) {
                    setSpacePressed(true);
                }
                event.preventDefault();
                return;
            }

            if (event.key === '+' || event.key === '=') {
                event.preventDefault();
                applyZoomDelta(KEYBOARD_ZOOM_STEP);
            } else if (event.key === '-' || event.key === '_') {
                event.preventDefault();
                applyZoomDelta(-KEYBOARD_ZOOM_STEP);
            } else if (event.key === '0' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                updateZoom(() => 0);
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.code === 'Space') {
                setSpacePressed(false);
            }
        };

        const handleWindowBlur = () => {
            setSpacePressed(false);
            pointerPanState.current = null;
            setIsPointerPanning(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [applyZoomDelta, updateZoom]);

    const clearSelection = useCallback(() => {
        if (layerControls && typeof layerControls.clearSelection === 'function') {
            layerControls.clearSelection();
        } else {
            pendingSelectionRef.current = null;
            setSelectedLayerBounds(null);
        }
    }, [layerControls]);

    // Deselect when clicking anywhere outside the canvas container
    useEffect(() => {
        if (!selectModeActive || !layerControls) return;
        if (typeof document === 'undefined') return;

        const handleDocumentPointerDown = (ev: PointerEvent) => {
            const targetElement = ev.target instanceof HTMLElement ? ev.target : null;
            if (containerRef.current && targetElement && containerRef.current.contains(targetElement)) {
                // Click was inside the canvas container - ignore (stage handler handles background clicks)
                return;
            }

            // Ignore clicks on sidebars/toolbars so selection survives tool toggles
            if (targetElement?.closest('.sidebar')) {
                return;
            }

            clearSelection();
        };

        document.addEventListener('pointerdown', handleDocumentPointerDown);
        return () => document.removeEventListener('pointerdown', handleDocumentPointerDown);
    }, [selectModeActive, layerControls, clearSelection]);

    const finishPointerPan = useCallback((event?: React.PointerEvent<HTMLDivElement>) => {
        if (!pointerPanState.current) {
            return;
        }

        const { pointerId } = pointerPanState.current;

        if (event) {
            try {
                if (event.currentTarget.hasPointerCapture(pointerId)) {
                    event.currentTarget.releasePointerCapture(pointerId);
                }
            } catch {
                // Ignore pointer capture release issues
            }
        }

        pointerPanState.current = null;
        setIsPointerPanning(false);
    }, []);

    const handleStagePointerDown = useCallback((event: any) => {
        if (!layerControls) return;
        if (event?.evt?.preventDefault) {
            event.evt.preventDefault();
        }
        const point = getRelativePointerPosition();
        if (!point) return;

        // If we're editing an existing text, finish editing and don't create a new one on background click.
        if (isTextToolActive && activeTextEdit) {
            finishTextEdit();
            return;
        }

        const targetLayerId = selectedLayerIds[0] ?? (layerControls.layers[layerControls.layers.length - 1]?.id ?? null);
        if (!targetLayerId) return;
        if (selectedLayerIds.length === 0) {
            layerControls.selectLayer(targetLayerId, { mode: 'replace' });
        }
        const layer = layerControls.layers.find((l) => l.id === targetLayerId);
        if (!layer) return;

        const stageX = point.x;
        const stageY = point.y;
        const insideStage =
            stageX >= 0 &&
            stageY >= 0 &&
            stageX <= stageWidth &&
            stageY <= stageHeight;

        if (isPaintToolActive) {
            if (!insideStage) return;
            const bounds = {
                x: 0,
                y: 0,
                width: stageWidth,
                height: stageHeight,
            };
            layerControls.updateLayerRender?.(
                layer.id,
                () => (
                    <Rect
                        x={0}
                        y={0}
                        width={bounds?.width ?? stageWidth}
                        height={bounds?.height ?? stageHeight}
                        fill={paintToolState.color ?? '#ffffff'}
                        listening
                    />
                ),
                {
                    position: { x: bounds.x, y: bounds.y },
                    bounds,
                    strokes: [],
                    texts: [],
                    imageSrc: undefined,
                    rotation: 0,
                    scale: { x: 1, y: 1 },
                }
            );
            return;
        }

        if (isTextToolActive) {
            if (activeTextEdit) {
                finishTextEdit();
            }

            const targetTextId = event?.target?.attrs?.textItemId as string | undefined;
            if (targetTextId) {
                const textLayer = layerControls.layers.find((l) => (l.texts ?? []).some((t) => t.id === targetTextId));
                const textItem = textLayer?.texts?.find((t) => t.id === targetTextId);
                if (textLayer && textItem) {
                    layerControls.selectLayer(textLayer.id, { mode: 'replace' });
                    startTextEdit(textLayer.id, textItem.id);
                    return;
                }
            }

            const result = layerControls.addTextLayer?.({
                text: textToolState.text ?? 'Text',
                fontSize: textToolState.fontSize ?? 32,
                fill: textToolState.color ?? '#000000',
                fontFamily: textToolState.fontFamily ?? 'Arial, sans-serif',
                fontStyle: textToolState.fontStyle ?? 'normal',
                fontWeight: textToolState.fontWeight ?? 'normal',
                x: stageX,
                y: stageY,
            });
            if (result) {
                layerControls.selectLayer(result.layerId, { mode: 'replace' });
                startTextEdit(result.layerId, result.textId);
            }
            return;
        }

        const scaleX = layer.scale?.x ?? 1;
        const scaleY = layer.scale?.y ?? 1;
        const sizeScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2 || 1;
        const localX = (stageX - (layer.position?.x ?? 0)) / (scaleX || 1);
        const localY = (stageY - (layer.position?.y ?? 0)) / (scaleY || 1);

        if (!isDrawToolActive && !isRubberToolActive && !isPaintToolActive) return;
        if ((isDrawToolActive || isPaintToolActive) && !insideStage) return;

        if (isRubberToolActive) {
            const strokeId = `erase-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            const stroke: LayerStroke = {
                id: strokeId,
                points: [localX, localY],
                color: '#000000',
                size: rubberToolState.eraserSize / sizeScale,
                hardness: 1,
                opacity: 1,
                mode: 'erase',
            };
            setPendingStroke({ layerId: targetLayerId, stroke });
            dispatch(rubberActions.startErasing());
            return;
        }

        const strokeId = `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const hardness = drawToolState.brushHardness ?? 1;
        const stroke: LayerStroke = {
            id: strokeId,
            points: [localX, localY],
            color: drawToolState.brushColor,
            size: drawToolState.brushSize / sizeScale,
            hardness,
            opacity: drawToolState.brushOpacity,
            mode: 'draw',
        };
        setPendingStroke({ layerId: targetLayerId, stroke });
        dispatch(drawActions.startDrawing(strokeId));
    }, [
        activeTextEdit,
        dispatch,
        drawToolState.brushColor,
        drawToolState.brushHardness,
        drawToolState.brushOpacity,
        drawToolState.brushSize,
        finishTextEdit,
        getRelativePointerPosition,
        isDrawToolActive,
        isRubberToolActive,
        isTextToolActive,
        isPaintToolActive,
        paintToolState.color,
        layerControls,
        rubberToolState.eraserSize,
        selectedLayerIds,
        startTextEdit,
        textToolState.color,
        textToolState.fontFamily,
        textToolState.fontSize,
        textToolState.fontStyle,
        textToolState.fontWeight,
        stageHeight,
        stageWidth,
    ]);

    const handleStagePointerMove = useCallback((event: any) => {
        if ((!isDrawToolActive && !isRubberToolActive) || !pendingStroke || !layerControls) return;
        if (event?.evt?.preventDefault) {
            event.evt.preventDefault();
        }
        const point = getRelativePointerPosition();
        if (!point) return;
        const layer = layerControls.layers.find((l) => l.id === pendingStroke.layerId);
        if (!layer) return;
        const scaleX = layer.scale?.x ?? 1;
        const scaleY = layer.scale?.y ?? 1;
        const localX = (point.x - (layer.position?.x ?? 0)) / (scaleX || 1);
        const localY = (point.y - (layer.position?.y ?? 0)) / (scaleY || 1);
        setPendingStroke((prev) =>
            prev && prev.layerId === layer.id
                ? {
                    layerId: prev.layerId,
                    stroke: { ...prev.stroke, points: [...prev.stroke.points, localX, localY] },
                }
                : prev
        );
        if (isDrawToolActive) {
            dispatch(drawActions.updatePath(pendingStroke.stroke.id));
        }
    }, [dispatch, getRelativePointerPosition, isDrawToolActive, isRubberToolActive, layerControls, pendingStroke]);

    const handleStagePointerUp = useCallback((event: any) => {
        if ((!isDrawToolActive && !isRubberToolActive) || !layerControls) return;
        if (event?.evt?.preventDefault) {
            event.evt.preventDefault();
        }

        const finalizedStroke = pendingStroke;
        if (pendingStroke) {
            const layer = layerControls.layers.find((l) => l.id === pendingStroke.layerId);
            if (layer) {
                const existing = layer.strokes ?? [];
                layerControls.updateLayerStrokes?.(layer.id, [...existing, pendingStroke.stroke]);
            }
        }
        setPendingStroke(null);

        if (isDrawToolActive) {
            dispatch(drawActions.finishDrawing());
        }

        if (isRubberToolActive) {
            dispatch(rubberActions.stopErasing());

            // Bake the erased content into the layer bitmap after the stroke is applied.
            if (finalizedStroke && layerControls.rasterizeLayer && typeof window !== 'undefined') {
                const targetLayerId = finalizedStroke.layerId;
                // Wait an extra frame to ensure the stroke has been committed to the Konva scene graph.
                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => {
                        const node = layerNodeRefs.current.get(targetLayerId);
                        if (!node) return;
                        try {
                            // Force a draw so the latest erase stroke is present before capture.
                            node.getLayer()?.batchDraw();

                            let bounds: Bounds | null = null;
                            const stage = node.getStage();
                            if (stage) {
                                const rect = node.getClientRect({
                                    skipTransform: false,
                                    relativeTo: stage,
                                });
                                const finite = [rect.x, rect.y, rect.width, rect.height].every((value) => Number.isFinite(value));
                                if (finite) {
                                    bounds = {
                                        x: rect.x - stageViewportOffsetX,
                                        y: rect.y - stageViewportOffsetY,
                                        width: rect.width,
                                        height: rect.height,
                                    };
                                }
                            }

                            const dataUrl = node.toDataURL({
                                mimeType: 'image/png',
                                quality: 1,
                                pixelRatio: 1,
                                backgroundColor: 'rgba(0,0,0,0)',
                            });
                            layerControls.rasterizeLayer(targetLayerId, dataUrl, { bounds });
                        } catch (error) {
                            console.warn('Unable to rasterize after erasing', error);
                        }
                    });
                });
            }
        }
    }, [dispatch, isDrawToolActive, isRubberToolActive, layerControls, pendingStroke, stageViewportOffsetX, stageViewportOffsetY]);

    const handleSavePNG = useCallback((fileName?: string) => {
        const stage = stageRef.current;
        if (!stage) return;
        const backgroundLayer = backgroundLayerRef.current;
        const selectionLayer = selectionLayerRef.current;
        const previousBackgroundVisibility = backgroundLayer ? backgroundLayer.visible() : undefined;
        const previousSelectionVisibility = selectionLayer ? selectionLayer.visible() : undefined;
        const previousScale = { x: stage.scaleX(), y: stage.scaleY() };
        const previousPos = stage.position();
        try {
            // Hide the mimic/background so only the stage content is exported.
            if (backgroundLayer) {
                backgroundLayer.visible(false);
                backgroundLayer.getLayer()?.batchDraw();
            }
            if (selectionLayer) {
                selectionLayer.visible(false);
                selectionLayer.getLayer()?.batchDraw();
            }

            // Capture at the logical stage size (independent of zoom/pan).
            stage.scale({ x: 1, y: 1 });
            stage.position({ x: -stageViewportOffsetX, y: -stageViewportOffsetY });
            stage.batchDraw();

            const dataUrl = stage.toDataURL({
                x: 0,
                y: 0,
                width: stageWidth,
                height: stageHeight,
                pixelRatio: 1,
                mimeType: 'image/png',
                quality: 1,
                backgroundColor: 'rgba(0,0,0,0)',
            });
            const anchor = document.createElement('a');
            anchor.href = dataUrl;
            anchor.download = fileName ?? 'canvas-stage.png';
            anchor.click();
        } catch (error) {
            console.warn('Unable to save PNG', error);
        } finally {
            // Restore transforms/visibilities.
            stage.scale(previousScale);
            stage.position(previousPos);
            stage.batchDraw();
            if (backgroundLayer && previousBackgroundVisibility !== undefined) {
                backgroundLayer.visible(previousBackgroundVisibility);
                backgroundLayer.getLayer()?.batchDraw();
            }
            if (selectionLayer && previousSelectionVisibility !== undefined) {
                selectionLayer.visible(previousSelectionVisibility);
                selectionLayer.getLayer()?.batchDraw();
            }
        }
    }, [stageViewportOffsetX, stageViewportOffsetY, stageWidth, stageHeight]);

    useEffect(() => {
        const handler = (event: Event) => {
            const detail = (event as CustomEvent<{ fileName?: string }>).detail;
            handleSavePNG(detail?.fileName);
        };
        window.addEventListener('export-stage-png', handler as EventListener);
        return () => window.removeEventListener('export-stage-png', handler as EventListener);
    }, [handleSavePNG]);

    const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
            return;
        }

        if (event.button !== 0) {
            return;
        }

        if (selectModeActive) {
            return;
        }

        if (!(panModeActive || spacePressed)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        pointerPanState.current = {
            pointerId: event.pointerId,
            start: { x: event.clientX, y: event.clientY },
            origin: { ...panOffsetRef.current },
        };
        setIsPointerPanning(true);

        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
            // Ignore pointer capture issues, panning will still work without it
        }
    }, [panModeActive, spacePressed]);

    const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const state = pointerPanState.current;
        if (!state || event.pointerId !== state.pointerId) {
            return;
        }

        event.preventDefault();

        const deltaX = event.clientX - state.start.x;
        const deltaY = event.clientY - state.start.y;

        setPanOffset({
            x: state.origin.x + deltaX,
            y: state.origin.y + deltaY,
        });
    }, []);

    const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const state = pointerPanState.current;
        if (!state || event.pointerId !== state.pointerId) {
            return;
        }

        event.preventDefault();
        finishPointerPan(event);
    }, [finishPointerPan]);

    const handlePointerCancel = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const state = pointerPanState.current;
        if (!state || event.pointerId !== state.pointerId) {
            return;
        }

        finishPointerPan(event);
    }, [finishPointerPan]);

    const handlePointerLeave = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const state = pointerPanState.current;
        if (!state || event.pointerId !== state.pointerId) {
            return;
        }

        finishPointerPan(event);
    }, [finishPointerPan]);

    // Touch pinch zoom and three-finger pan
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const getTouchDistance = (touches: TouchList) => {
            if (touches.length < 2) return 0;

            const touchOne = touches[0];
            const touchTwo = touches[1];

            const dx = touchTwo.clientX - touchOne.clientX;
            const dy = touchTwo.clientY - touchOne.clientY;

            return Math.sqrt(dx * dx + dy * dy);
        };

        const getTouchCenter = (touches: TouchList) => {
            let sumX = 0;
            let sumY = 0;
            const count = touches.length;

            for (let index = 0; index < count; index += 1) {
                const touch = touches[index];
                sumX += touch.clientX;
                sumY += touch.clientY;
            }

            return {
                x: sumX / count,
                y: sumY / count,
            };
        };

        const clearTouchPan = () => {
            if (touchPanState.current) {
                touchPanState.current = null;
                setIsTouchPanning(false);
            }
        };

        const handleTouchStart = (event: TouchEvent) => {
            const touches = event.touches;

            if (panModeActive && touches.length === 1) {
                event.preventDefault();
                touchPanState.current = {
                    center: getTouchCenter(touches),
                    origin: { ...panOffsetRef.current },
                    touchCount: 1,
                };
                setIsTouchPanning(true);
                lastTouchDistance.current = 0;
                return;
            }

            if (touches.length === 3) {
                event.preventDefault();
                touchPanState.current = {
                    center: getTouchCenter(touches),
                    origin: { ...panOffsetRef.current },
                    touchCount: 3,
                };
                setIsTouchPanning(true);
                lastTouchDistance.current = 0;
            } else if (touches.length === 2) {
                event.preventDefault();
                clearTouchPan();
                lastTouchDistance.current = getTouchDistance(touches);
            }
        };

        const handleTouchMove = (event: TouchEvent) => {
            const touches = event.touches;
            const panState = touchPanState.current;

            if (panState && panState.touchCount === 1) {
                if (!panModeActive) {
                    clearTouchPan();
                    return;
                }

                if (touches.length === 1) {
                    event.preventDefault();
                    const center = getTouchCenter(touches);

                    setPanOffset({
                        x: panState.origin.x + (center.x - panState.center.x),
                        y: panState.origin.y + (center.y - panState.center.y),
                    });
                    return;
                }
            }

            if (panState && panState.touchCount === 3 && touches.length === 3) {
                event.preventDefault();
                const center = getTouchCenter(touches);

                setPanOffset({
                    x: panState.origin.x + (center.x - panState.center.x),
                    y: panState.origin.y + (center.y - panState.center.y),
                });
                return;
            }

            if (touches.length === 2) {
                event.preventDefault();

                const currentDistance = getTouchDistance(touches);
                const previousDistance = lastTouchDistance.current;

                if (previousDistance > 0) {
                    const scaleFactor = currentDistance / previousDistance;
                    const deltaZoom = (scaleFactor - 1) * PINCH_ZOOM_SENSITIVITY;

                    applyZoomDelta(deltaZoom, TOUCH_DELTA_THRESHOLD);
                }

                lastTouchDistance.current = currentDistance;
            }
        };

        const handleTouchEnd = (event: TouchEvent) => {
            if (touchPanState.current) {
                const activeCount = touchPanState.current.touchCount;

                if ((activeCount === 3 && event.touches.length < 3) || (activeCount === 1 && event.touches.length === 0)) {
                    clearTouchPan();
                }
            }

            if (event.touches.length < 2) {
                lastTouchDistance.current = 0;
            }

            if (panModeActive && event.touches.length === 1 && (!touchPanState.current || touchPanState.current.touchCount !== 1)) {
                touchPanState.current = {
                    center: getTouchCenter(event.touches),
                    origin: { ...panOffsetRef.current },
                    touchCount: 1,
                };
                setIsTouchPanning(true);
                lastTouchDistance.current = 0;
            }
        };

        const handleTouchCancel = () => {
            clearTouchPan();
            lastTouchDistance.current = 0;
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);
        container.addEventListener('touchcancel', handleTouchCancel);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('touchcancel', handleTouchCancel);
        };
    }, [applyZoomDelta, panModeActive]);

    const sharedSelectionRect = selectionTransform ?? null;

    const baseCursor = (isPointerPanning || isTouchPanning)
        ? 'grabbing'
        : (isPaintToolActive || isDrawToolActive || isRubberToolActive)
            ? 'crosshair'
            : (isTextToolActive ? 'text' : (panModeActive || spacePressed ? 'grab' : 'default'));

    useEffect(() => {
        if (!stageRef.current) {
            return;
        }

        stageRef.current.container().style.cursor = baseCursor;
    }, [baseCursor, selectModeActive]);

    // Handle escape to finish inline text editing
    useEffect(() => {
        if (!activeTextEdit) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                finishTextEdit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeTextEdit, finishTextEdit]);

    // Compute an HTML overlay selection box (screen-space) so the selection
    // bounding box can be visible even when portions are outside the Konva stage.
    useEffect(() => {
        if (!selectedLayerBounds) {
            setOverlaySelectionBox(null);
            return;
        }

        // Use selectedLayerBounds directly - same coordinates as Transformer
        // KonvaSelectionBox will use x,y as top-left corner (not center)
        const rotationDeg = resolveSelectionRotation();

        const newBox = {
            x: selectedLayerBounds.x,
            y: selectedLayerBounds.y,
            width: selectedLayerBounds.width,
            height: selectedLayerBounds.height,
            rotation: rotationDeg
        };
        setOverlaySelectionBox(newBox);
    }, [selectedLayerBounds, resolveSelectionRotation]);

    const syncTransformerToSelection = useCallback(() => {
        const transformer = selectionTransformerRef.current;

        if (!transformer) {
            return;
        }

        // Allow transformer to be visible during interaction even without valid bounds yet
        if (!selectModeActive || (!selectedLayerBounds)) {
            transformer.nodes([]);
            transformer.visible(false);
            return;
        }

        const nodes = selectedLayerIds
            .map((id) => layerNodeRefs.current.get(id))
            .filter((node): node is Konva.Node => Boolean(node));

        if (nodes.length === 0) {
            transformer.nodes([]);
            transformer.visible(false);
            return;
        }

        transformer.nodes(nodes);
        transformer.rotation(resolveSelectionRotation());
        transformer.centeredScaling(false);
        transformer.visible(true);
        transformer.forceUpdate();
    }, [selectModeActive, selectedLayerBounds, selectedLayerIds, overlaySelectionBox, resolveSelectionRotation, layerNodeRefs]);

    // Unified effect: sync transformer to selection and handle rotation
    useEffect(() => {
        syncTransformerToSelection();
        if (!selectModeActive || isSelectionTransformingRef.current) return;
        const nextRotation = resolveSelectionRotation();
        const normalizedRotation = Number.isFinite(nextRotation) ? nextRotation : 0;
        if (selectionProxyRotationRef.current !== normalizedRotation) {
            selectionProxyRotationRef.current = normalizedRotation;
            syncTransformerToSelection();
        }
    }, [layersRevision, syncTransformerToSelection, resolveSelectionRotation, selectModeActive]);

    // Unified effect: handle pending selection and reset transform state
    useEffect(() => {
        if (pendingSelectionRef.current) {
            const pending = pendingSelectionRef.current;
            if (pending.length === selectedLayerIds.length) {
                const matches = pending.every((id, index) => id === selectedLayerIds[index]);
                if (matches) {
                    pendingSelectionRef.current = null;
                }
            }
        }
        selectionTransformStateRef.current = null;
    }, [selectedLayerIds]);

    useEffect(() => {
        if (!showSettingsPanel && isSettingsPanelOpen) {
            setIsSettingsPanelOpen(false);
        }
    }, [isSettingsPanelOpen, showSettingsPanel]);

    // Attach Konva stage listeners for background clicks (use Konva events to satisfy typings)
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage || !selectModeActive) return;

        const handler = (event: any) => {
            if (event.target === event.target.getStage()) {
                clearSelection();
            }
        };

        stage.on('mousedown', handler);
        stage.on('touchstart', handler);

        return () => {
            stage.off('mousedown', handler);
            stage.off('touchstart', handler);
        };
    }, [selectModeActive, clearSelection]);
    const GroupAny = StageGroup as any;

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={handlePointerLeave}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: containerBackground,
                overflow: 'hidden',
                touchAction: 'none',
                position: 'relative',
                cursor: isPaintToolActive ? 'crosshair' : undefined,
            }}
        >
            <Stage
                ref={stageRef}
                width={containerDimensions.width}
                height={containerDimensions.height}
                onMouseDown={handleStagePointerDown}
                onTouchStart={handleStagePointerDown}
                onMouseMove={handleStagePointerMove}
                onTouchMove={handleStagePointerMove}
                onMouseUp={handleStagePointerUp}
                onTouchEnd={handleStagePointerUp}
                onMouseLeave={handleStagePointerUp}
                onTouchCancel={handleStagePointerUp}
                style={{
                    cursor: baseCursor,
                }}
            >

                <KonvaLayer key={`interaction-layer`}>
                    <Group key={`interaction-layer-group-${layersRevision}`}>
                        {layerControls && layersToRender.length > 0 ? (
                            layersToRender.map((layer, index) => {
                                const layerIsSelected = selectedLayerSet.has(layer.id);
                                const layerBounds = layer.bounds ?? null;
                                const computedX = stageViewportOffsetX + (layerBounds ? layerBounds.x : layer.position.x);
                                const computedY = stageViewportOffsetY + (layerBounds ? layerBounds.y : layer.position.y);
                                const selectionOverride = (layerIsSelected && isSelectionTransformingRef.current && sharedSelectionRect)
                                    ? sharedSelectionRect
                                    : null;
                                const combinedStrokes: LayerStroke[] = [
                                    ...(layer.strokes ?? []),
                                    ...(pendingStroke && pendingStroke.layerId === layer.id ? [pendingStroke.stroke] : []),
                                ];
                                const textItems = layer.texts ?? [];
                                return (
                                    <GroupAny
                                        key={`${layersRevision}-${layer.id}`}
                                        layersRevision={layersRevision}
                                        index={index}
                                        id={`layer-${layer.id}`}
                                        layerId={layer.id}
                                        visible={layer.visible}
                                        x={selectionOverride ? selectionOverride.x : computedX}
                                        y={selectionOverride ? selectionOverride.y : computedY}
                                        rotation={selectionOverride ? selectionOverride.rotation : (layer.rotation ?? 0)}
                                        scaleX={selectionOverride ? selectionOverride.scaleX : (layer.scale?.x ?? 1)}
                                        scaleY={selectionOverride ? selectionOverride.scaleY : (layer.scale?.y ?? 1)}
                                        opacity={layer.opacity ?? 1}
                                        draggable={Boolean(selectModeActive)}
                                        selectModeActive={selectModeActive}
                                        stageViewportOffsetX={stageViewportOffsetX}
                                        stageViewportOffsetY={stageViewportOffsetY}
                                        baseCursor={baseCursor}
                                        layerNodeRefs={layerNodeRefs}
                                        pendingSelectionRef={pendingSelectionRef}
                                        selectionDragStateRef={selectionDragStateRef}
                                        onRefChange={(node) => onRefChange({ node, layer })}
                                        updateBoundsFromLayerIds={updateBoundsFromLayerIds}
                                        syncTransformerToSelection={syncTransformerToSelection}
                                    >
                                        {layer.render()}
                                        {textItems.map((textItem) => (
                                            <KonvaText
                                                key={textItem.id}
                                                textItemId={textItem.id}
                                                textLayerId={layer.id}
                                                x={textItem.x}
                                                y={textItem.y}
                                                text={textItem.text}
                                                fontSize={textItem.fontSize}
                                                fontFamily={textItem.fontFamily}
                                                fontStyle={textItem.fontStyle}
                                                fontWeight={textItem.fontWeight}
                                                fill={textItem.fill ?? '#000000'}
                                                listening={true}
                                                onDoubleClick={(ev) => {
                                                    ev.cancelBubble = true;
                                                    startTextEdit(layer.id, textItem.id);
                                                }}
                                                onTap={(ev) => {
                                                    if (isTextToolActive) {
                                                        ev.cancelBubble = true;
                                                        startTextEdit(layer.id, textItem.id);
                                                    }
                                                }}
                                                onMouseDown={(ev) => {
                                                    if (isTextToolActive) {
                                                        ev.cancelBubble = true;
                                                        startTextEdit(layer.id, textItem.id);
                                                    }
                                                }}
                                            />
                                        ))}
                                        {combinedStrokes.map((stroke) => (
                                            <Line
                                                key={stroke.id}
                                                points={stroke.points}
                                                stroke={stroke.color}
                                                strokeWidth={stroke.size}
                                                lineCap="round"
                                                lineJoin="round"
                                                opacity={stroke.opacity}
                                                tension={0}
                                                shadowBlur={(1 - stroke.hardness) * stroke.size * 1.5}
                                                shadowColor={stroke.color}
                                                globalCompositeOperation={stroke.mode === 'erase' ? 'destination-out' : 'source-over'}
                                                listening={true}
                                            />
                                        ))}
                                    </GroupAny>
                                );
                            }
                            )
                        ) : (
                            <GroupAny key="empty-layer">
                                {children}
                            </GroupAny>
                        )}
                    </Group>
                </KonvaLayer>

                <BackgroundLayer
                    key="background-layer"
                    containerWidth={containerDimensions.width / safeScale}
                    containerHeight={containerDimensions.height / safeScale}
                    containerBackground={containerBackground}
                    stageWidth={stageWidth}
                    stageHeight={stageHeight}
                    stageViewportOffsetX={stageViewportOffsetX}
                    stageViewportOffsetY={stageViewportOffsetY}
                    layerRef={backgroundLayerRef}
                />
                {layerControls && layersToRender.length > 0 ? (
                    <SelectionLayer
                        key="selection-layer"
                        selectModeActive={selectModeActive}
                        padding={transformerPadding}
                        borderDash={outlineDash}
                        layerRef={selectionLayerRef}
                        transformerRef={selectionTransformerRef}
                        anchorSize={transformerAnchorSize}
                        anchorCornerRadius={transformerAnchorCornerRadius}
                        anchorStrokeWidth={transformerAnchorStrokeWidth}
                        hitStrokeWidth={transformerHitStrokeWidth}
                        stageRef={stageRef}
                        selectedLayerBounds={selectedLayerBounds}
                        captureSelectionTransformState={captureSelectionTransformState}
                        applySelectionTransformDelta={applySelectionTransformDelta}
                        syncSelectedLayerNodeRefs={syncSelectedLayerNodeRefs}
                        commitSelectedLayerNodeTransforms={commitSelectedLayerNodeTransforms}
                        scheduleBoundsRefresh={scheduleBoundsRefresh}
                        initializeSelectionTransform={initializeSelectionTransform}
                        markSelectionTransforming={markSelectionTransforming}
                    />
                ) : null}

            </Stage>
            {layerControls && !panModeActive && (
                <LayerPanelUI 
                    key="layer-panel"
                    isOpen={isLayerPanelOpen}
                    onToggle={() => setIsLayerPanelOpen((previous) => !previous)}
                    onClose={() => setIsLayerPanelOpen(false)}
                    pendingSelectionRef={pendingSelectionRef}
                />
            )}

            {layerControls && !panModeActive && (
                <SettingsPanelUI
                    key="setting-panel"
                    isOpen={isSettingsPanelOpen}
                    onToggle={() => setIsSettingsPanelOpen((prev) => !prev)}
                    onClose={() => setIsSettingsPanelOpen(false)}
                    layerControls={layerControls}
                    selectedLayerIds={selectedLayerIds}
                    penSettings={penSettings}
                    eraserSize={eraserSize}
                    onEraserSizeChange={(value) => {
                        setEraserSize(value);
                        dispatch(rubberActions.setEraserSize(value));
                    }}
                    isTextToolActive={isTextToolActive}
                    textSettings={textSettings}
                    isTextLayerSelected={Boolean(selectedTextItem)}
                    isRubberToolActive={isRubberToolActive}
                />
            )}

            {activeTextEdit ? (
                <div
                    style={{
                        position: 'absolute',
                        left: activeTextEdit.left,
                        top: activeTextEdit.top,
                        minWidth: '220px',
                        padding: '4px',
                        background: 'rgba(255,255,255,0.95)',
                        border: '1px solid #0088ff',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                        zIndex: 20,
                    }}
                >
                    <textarea
                        key={`text-edit-${activeTextEdit.textId}`}
                        value={activeTextEdit.value}
                        autoFocus
                        onChange={(event) => {
                            const next = event.target.value;
                            setActiveTextEdit((prev) => prev ? { ...prev, value: next } : prev);
                            updateTextValue(activeTextEdit.layerId, activeTextEdit.textId, next);
                        }}
                        onBlur={finishTextEdit}
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                                event.preventDefault();
                                finishTextEdit();
                            }
                        }}
                        style={{
                            width: '100%',
                            minWidth: '220px',
                            minHeight: '44px',
                            padding: '6px 8px',
                            border: '1px solid #0088ff',
                            borderRadius: '2px',
                            background: 'transparent',
                            color: activeTextEdit.color ?? '#000000',
                            fontSize: '14px',
                            fontFamily: 'Arial, sans-serif',
                            fontStyle: 'normal',
                            fontWeight: 'normal',
                            lineHeight: '1.3',
                            outline: 'none',
                            resize: 'none',
                            whiteSpace: 'pre-wrap',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>
            ) : null}
        </div>
    );
};
