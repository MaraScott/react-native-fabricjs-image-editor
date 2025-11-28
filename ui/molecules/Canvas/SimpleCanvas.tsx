import {
    useRef,
    useEffect,
    useState,
    useCallback,
    useMemo,
    type ReactNode,
} from "react";
import { useRotation } from "./hooks/useRotation";
import { useSelector, useDispatch } from "react-redux";
import { selectActions } from "@store/CanvasApp/view/select";
import { selectSelectionTransform } from "@store/CanvasApp/view/selectors";
import { Stage } from "@atoms/Canvas";
import {
    SelectionLayer,
    StageGroup,
    LayerPanelUI,
    BackgroundLayer,
} from "@molecules/Layer";
import { useSimpleCanvasStore } from "@store/SimpleCanvas";
import { useSelectionBounds } from "./hooks/useSelectionBounds";
import { Layer as KonvaLayer } from "@atoms/Canvas";
import Konva from "konva";

import type { RootState } from "@store/CanvasApp";
import type {
    PointerPanState,
    TouchPanState,
    SelectionDragState,
    SelectionNodeSnapshot,
    SelectionTransformSnapshot,
    Bounds,
} from "./types/canvas.types";
import type {
    PanOffset,
    LayerStroke,
    LayerTextItem,
} from "@molecules/Layer/Layer.types";

import { Rect, Group, Line, Text as KonvaText } from "react-konva";
import { drawActions } from "@store/CanvasApp/view/draw";
import { rubberActions } from "@store/CanvasApp/view/rubber";
import { textActions } from "@store/CanvasApp/view/text";
import { SettingsPanelUI } from "@molecules/Settings/SettingsPanelUI";
import type { Layer as KonvaLayerType } from "konva/lib/Layer";
import { floodFillLayer } from "@molecules/Canvas/utils/floodFill";
import { useCanvasViewport } from "./hooks/useCanvasViewport";

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
    backgroundColor = "#cccccc33",
    containerBackground = "#cccccc",
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

    const { layerControls, renderableLayers } = useSimpleCanvasStore(
        (state) => state
    );
    const dispatch = useDispatch();
    const isSelectToolActive = useSelector(
        (state: RootState) => state.view.select.active
    );
    const drawToolState = useSelector((state: RootState) => state.view.draw);
    const rubberToolState = useSelector(
        (state: RootState) => state.view.rubber
    );
    const textToolState = useSelector((state: RootState) => state.view.text);
    const paintToolState = useSelector((state: RootState) => state.view.paint);
    const isDrawToolActive = drawToolState.active;
    const isRubberToolActive = rubberToolState.active;
    const isTextToolActive = textToolState.active;
    const isPaintToolActive = paintToolState.active;

    // Read selectionTransform from Redux
    const reduxSelectionTransform = useSelector(selectSelectionTransform);

    // --- Viewport & input handling (extracted hook) ---
    const {
        stageRef,
        containerRef,
        containerDimensions,
        scale: safeScale,
        panOffset,
        setPanOffset,
        stageViewportOffsetX,
        stageViewportOffsetY,
        isPointerPanning,
        isTouchPanning,
        spacePressed,
        getRelativePointerPosition,
    } = useCanvasViewport({
        stageWidth,
        stageHeight,
        initialZoom: zoom,
        onZoomChange,
        panModeActive,
    });

    const lastTouchDistance = useRef(0); // kept only if needed elsewhere (not used now)
    const pointerPanState = useRef<PointerPanState | null>(null); // no longer used directly
    const touchPanState = useRef<TouchPanState | null>(null); // no longer used directly

    const selectionDragStateRef = useRef<SelectionDragState | null>(null);

    const layerNodeRefs = useRef<Map<string, Konva.Node>>(new Map());
    const onRefChange = ({ node, layer }) => {
        if (node) {
            layerNodeRefs.current.set(layer.id, node);
        } else {
            layerNodeRefs.current.delete(layer.id);
        }
        syncTransformerToSelection();
    };

    const pendingSelectionRef = useRef<string[] | null>(null);
    const interactionLayerRef = useRef<Konva.Layer | null>(null);
    const selectionTransformerRef = useRef<Konva.Transformer | null>(null);
    const selectionLayerRef = useRef<KonvaLayerType | null>(null);
    const selectionTransformStateRef =
        useRef<SelectionTransformSnapshot | null>(null);
    const transformAnimationFrameRef = useRef<number | null>(null);
    const isSelectionTransformingRef = useRef(false);

    const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
    const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
    const [layerRefreshKey, setLayerRefreshKey] = useState(0);
    const [eraserSize, setEraserSize] = useState(rubberToolState.eraserSize);
    const [selectedLayerBounds, setSelectedLayerBounds] =
        useState<Bounds | null>(null);
    const [overlaySelectionBox, setOverlaySelectionBox] = useState<
        | {
              x: number;
              y: number;
              width: number;
              height: number;
              rotation?: number;
          }
        | null
    >(null);

    // Map of selected layer IDs to their Konva nodes
    const selectedLayerNodeRefs = useRef<Map<string, Konva.Node>>(new Map());
    const [pendingStroke, setPendingStroke] = useState<{
        layerId: string;
        stroke: LayerStroke;
    } | null>(null);

    type TextEditState = {
        layerId: string;
        textId: string;
        value: string;
        left: number;
        top: number;
        fontSize: number;
        fontFamily: string;
        fontStyle?: "normal" | "italic";
        fontWeight?: string;
        color?: string;
    };

    const [activeTextEdit, setActiveTextEdit] =
        useState<TextEditState | null>(null);

    const backgroundLayerRef = useRef<KonvaLayerType | null>(null);

    useEffect(() => {
        setEraserSize(rubberToolState.eraserSize);
    }, [rubberToolState.eraserSize]);

    // Open settings panel by default for kid theme; watch for theme class changes.
    useEffect(() => {
        if (typeof document === "undefined") return;
        const layout = document.querySelector(".canvas-layout");
        const updateFromTheme = () => {
            if (layout?.classList.contains("kid")) {
                setIsSettingsPanelOpen(true);
            }
        };
        updateFromTheme();
        if (!layout) return;
        const observer = new MutationObserver(updateFromTheme);
        observer.observe(layout, { attributes: true, attributeFilter: ["class"] });
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
        () => layersToRender.map((layer) => layer.id).join("|"),
        [layersToRender]
    );

    const penSettings = useMemo(
        () => ({
            size: drawToolState.brushSize,
            hardness: drawToolState.brushHardness ?? 1,
            color: drawToolState.brushColor,
            opacity: drawToolState.brushOpacity,
            onSizeChange: (size: number) =>
                dispatch(drawActions.setBrushSize(size)),
            onHardnessChange: (value: number) =>
                dispatch(drawActions.setBrushHardness(value)),
            onColorChange: (color: string) =>
                dispatch(drawActions.setBrushColor(color)),
            onOpacityChange: (opacity: number) =>
                dispatch(drawActions.setBrushOpacity(opacity)),
        }),
        [
            dispatch,
            drawToolState.brushColor,
            drawToolState.brushHardness,
            drawToolState.brushOpacity,
            drawToolState.brushSize,
        ]
    );

    // Keep Konva node order in sync when moveLayer fires.
    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const applyOrder = (orderedIds: string[]) => {
            setLayerRefreshKey((previous) => previous + 1);
            interactionLayerRef.current?.batchDraw?.();
        };

        const handleRefresh = (event: Event) => {
            const detail = (event as CustomEvent<{ layerIds?: string[] }>).detail;
            const orderedIds =
                detail?.layerIds ?? layersToRender.map((layer) => layer.id);
            applyOrder(orderedIds);
        };

        // Initial sync for current render order
        applyOrder(layersToRender.map((layer) => layer.id));

        window.addEventListener(
            "layer-move-refresh",
            handleRefresh as EventListener
        );
        return () => {
            window.removeEventListener(
                "layer-move-refresh",
                handleRefresh as EventListener
            );
        };
    }, [layerOrderSignature, layersToRender]);

    const selectedLayerIds = layerControls?.selectedLayerIds ?? [];
    const stableSelectedLayerIds = useMemo(
        () => selectedLayerIds,
        [JSON.stringify(selectedLayerIds)]
    );
    const selectedLayerSet = useMemo(
        () => new Set(selectedLayerIds),
        [selectedLayerIds]
    );

    // Helper: resolve effective transform for a layer when mapping pointer->layer-local coords.
    const sharedSelectionRect = reduxSelectionTransform ?? null;

    const resolveEffectiveLayerTransform = (layer: any) => {
        const isSelected = selectedLayerSet.has(layer.id);
        if (isSelected && isSelectionTransformingRef.current && sharedSelectionRect) {
            return {
                x: sharedSelectionRect.x ?? 0,
                y: sharedSelectionRect.y ?? 0,
                rotation: sharedSelectionRect.rotation ?? 0,
                scaleX: sharedSelectionRect.scaleX ?? 1,
                scaleY: sharedSelectionRect.scaleY ?? 1,
                boundsX: sharedSelectionRect.x ?? 0,
                boundsY: sharedSelectionRect.y ?? 0,
            };
        }

        return {
            x: layer.bounds ? layer.bounds.x : layer.position?.x ?? 0,
            y: layer.bounds ? layer.bounds.y : layer.position?.y ?? 0,
            rotation: layer.rotation ?? 0,
            scaleX: layer.scale?.x ?? 1,
            scaleY: layer.scale?.y ?? 1,
            boundsX: layer.bounds ? layer.bounds.x : layer.position?.x ?? 0,
            boundsY: layer.bounds ? layer.bounds.y : layer.position?.y ?? 0,
        };
    };

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

    const selectedTextItem = useMemo(
        () => selectedTextLayer?.texts?.[0] ?? null,
        [selectedTextLayer]
    );

    const showSettingsPanel = true;

    const applyTextStyleToSelection = useCallback(
        (updates: Partial<LayerTextItem>) => {
            if (
                !selectedTextLayer ||
                !selectedTextItem ||
                !layerControls?.updateLayerTexts
            )
                return;
            const nextTexts = (selectedTextLayer.texts ?? []).map((text) =>
                text.id === selectedTextItem.id ? { ...text, ...updates } : text
            );
            layerControls.updateLayerTexts(selectedTextLayer.id, nextTexts);
        },
        [layerControls, selectedTextItem, selectedTextLayer]
    );

    const textSettings = useMemo(() => {
        const source = selectedTextItem ?? textToolState;
        const fontSize = selectedTextItem?.fontSize ?? textToolState.fontSize;
        const color = selectedTextItem
            ? selectedTextItem.fill ?? textToolState.color
            : textToolState.color;
        const fontFamily =
            selectedTextItem?.fontFamily ?? textToolState.fontFamily;
        const fontStyle = selectedTextItem?.fontStyle ?? textToolState.fontStyle;
        const fontWeight =
            selectedTextItem?.fontWeight ?? textToolState.fontWeight;

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
            onFontStyleChange: (value: "normal" | "italic") => {
                dispatch(textActions.setFontStyle(value));
                applyTextStyleToSelection({ fontStyle: value });
            },
            onFontWeightChange: (value: string) => {
                dispatch(textActions.setFontWeight(value));
                applyTextStyleToSelection({ fontWeight: value });
            },
        };
    }, [
        applyTextStyleToSelection,
        dispatch,
        selectedTextItem,
        textToolState,
    ]);

    // Auto-select top layer by default
    useEffect(() => {
        if (!layerControls || selectedLayerIds.length > 0) return;
        if (layerControls.layers.length > 0) {
            const topLayer =
                layerControls.layers[layerControls.layers.length - 1];
            layerControls.selectLayer(topLayer.id, { mode: "replace" });
        }
    }, [layerControls, selectedLayerIds]);

    // Keep selection handles a constant screen size
    const outlineDash: [number, number] = [8, 4];
    const transformerAnchorSize = 8;
    const transformerAnchorStrokeWidth = 1;
    const transformerAnchorCornerRadius = 2;
    const transformerPadding = 0;
    const transformerHitStrokeWidth = 12;

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

    // Handle rasterize requests (convert layer group into bitmap image)
    useEffect(() => {
        const handleRasterizeRequest = (event: Event) => {
            const detail = (event as CustomEvent<{ layerId: string }>).detail;
            const layerId = detail?.layerId;
            if (!layerId || !layerControls?.rasterizeLayer) return;
            const layerDescriptor = layerControls.layers.find(
                (layer) => layer.id === layerId
            );
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
                        const finite = [
                            rect.x,
                            rect.y,
                            rect.width,
                            rect.height,
                        ].every((value) => Number.isFinite(value));
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

                const dataUrl = (node as any).toDataURL({
                    mimeType: "image/png",
                    quality: 1,
                    pixelRatio: 1,
                    backgroundColor: "rgba(0,0,0,0)",
                });
                layerControls.rasterizeLayer(layerId, dataUrl, { bounds });
            } catch (error) {
                console.warn("Unable to rasterize layer", error);
            }
        };
        window.addEventListener(
            "rasterize-layer-request",
            handleRasterizeRequest as EventListener
        );
        return () => {
            window.removeEventListener(
                "rasterize-layer-request",
                handleRasterizeRequest as EventListener
            );
        };
    }, [layerControls, stageViewportOffsetX, stageViewportOffsetY]);

    // Use selection bounds hook
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

    // Rotation logic is handled by useRotation
    const { selectionProxyRotationRef } = useRotation(
        resolveSelectionRotation
    );

    const updateBoundsFromLayerIds = (ids: string[]) => {
        return _updateBoundsFromLayerIds(ids);
    };
    const refreshBoundsFromSelection = () => {
        return _refreshBoundsFromSelection();
    };

    // --- Unified selection transform state for Layer and SelectionLayer ---
    const selectionTransform = reduxSelectionTransform;

    // Ensure selectionTransform is initialized when selection changes
    useEffect(() => {
        if (selectedLayerIds.length > 0 && !reduxSelectionTransform) {
            if (selectedLayerBounds) {
                const { x, y, width, height } = selectedLayerBounds;
                const rotation = 0;
                const scaleX = 1;
                const scaleY = 1;
                dispatch(
                    selectActions.setSelectionTransform({
                        x,
                        y,
                        width,
                        height,
                        rotation,
                        scaleX,
                        scaleY,
                    })
                );
            }
        }
        if (selectedLayerIds.length === 0 && reduxSelectionTransform) {
            dispatch(selectActions.setSelectionTransform(null));
        }
    }, [
        selectedLayerIds,
        selectedLayerBounds,
        reduxSelectionTransform,
        dispatch,
    ]);

    // Recenter pan on fitRequest
    useEffect(() => {
        setPanOffset({ x: 0, y: 0 });
    }, [fitRequest, setPanOffset]);

    const captureSelectionTransformState = useCallback(() => {
        const nodeSnapshots = selectedLayerIds
            .map((layerId) => {
                const node = layerNodeRefs.current.get(layerId);
                const layer = layerControls?.layers.find(
                    (l) => l.id === layerId
                );
                if (!node || !layer) {
                    return null;
                }
                return {
                    id: layerId,
                    node,
                    initialScaleX: node.scaleX() || 1,
                    initialScaleY: node.scaleY() || 1,
                    texts: layer.texts
                        ? layer.texts.map((t) => ({ ...t }))
                        : [],
                };
            })
            .filter(
                (
                    snapshot
                ): snapshot is SelectionNodeSnapshot & {
                    initialScaleX: number;
                    initialScaleY: number;
                    texts: LayerTextItem[];
                } => Boolean(snapshot)
            );

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
            const avgScale =
                (Math.abs(relScaleX) + Math.abs(relScaleY)) / 2 || 1;

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
            const hasVectorContent =
                (layer.texts?.length ?? 0) > 0 ||
                typeof layer.render === "function";
            return hasVectorContent;
        });
        if (needsRasterize && !rasterizeAlertShownRef.current) {
            rasterizeAlertShownRef.current = true;
            try {
                window.alert("You need to rasterize before erasing.");
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
        refreshBoundsFromSelection();
    }, [
        selectModeActive,
        layersRevision,
        safeScale,
        JSON.stringify(selectedLayerIds),
    ]);

    // Unified effect: handle stage ready, scale, and zoom sync
    useEffect(() => {
        if (stageRef.current) {
            if (onStageReady) onStageReady(stageRef.current);
            stageRef.current.scale({ x: safeScale, y: safeScale });
        }
    }, [onStageReady, safeScale, stageRef]);

    const markSelectionTransforming = useCallback((flag: boolean) => {
        isSelectionTransformingRef.current = flag;
    }, []);

    const getTextItem = useCallback(
        (layerId: string, textId: string) => {
            const layer = layerControls?.layers.find(
                (l) => l.id === layerId
            );
            const textItem = layer?.texts?.find((t) => t.id === textId);
            return { layer, textItem };
        },
        [layerControls?.layers]
    );

    const updateTextValue = useCallback(
        (layerId: string, textId: string, value: string) => {
            if (!layerControls?.updateLayerTexts) return;
            const { layer } = getTextItem(layerId, textId);
            if (!layer) return;
            const nextTexts = (layer.texts ?? []).map((text) =>
                text.id === textId ? { ...text, text: value } : text
            );
            layerControls.updateLayerTexts(layerId, nextTexts);
        },
        [getTextItem, layerControls]
    );

    const removeTextItem = useCallback(
        (layerId: string, textId: string) => {
            if (!layerControls?.updateLayerTexts) return;
            const { layer } = getTextItem(layerId, textId);
            if (!layer) return;
            const nextTexts = (layer.texts ?? []).filter(
                (text) => text.id !== textId
            );
            layerControls.updateLayerTexts(layerId, nextTexts);
        },
        [getTextItem, layerControls]
    );

    const finishTextEdit = useCallback(() => {
        if (!activeTextEdit) return;
        const trimmed = (activeTextEdit.value ?? "").trim();
        if (!trimmed) {
            removeTextItem(activeTextEdit.layerId, activeTextEdit.textId);
        } else {
            updateTextValue(
                activeTextEdit.layerId,
                activeTextEdit.textId,
                trimmed
            );
        }
        setActiveTextEdit(null);
    }, [activeTextEdit, removeTextItem, updateTextValue]);

    // Commit selected layer node values back to app state (e.g., after transform)
    const commitSelectedLayerNodeTransforms = useCallback(() => {
        if (activeTextEdit) {
            finishTextEdit();
            return;
        }
        if (!layerControls) return;
        selectedLayerNodeRefs.current.forEach((node, id) => {
            if (!node) return;
            const pos = (node as any).position();
            const rot = (node as any).rotation();
            let scaleX = (node as any).scaleX();
            let scaleY = (node as any).scaleY();

            let adjustedX = pos.x - stageViewportOffsetX;
            let adjustedY = pos.y - stageViewportOffsetY;

            const layerData = layerControls.layers.find((l) => l.id === id);
            const texts = layerData?.texts ?? [];
            const scaleChanged =
                Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001;
            if (texts.length > 0 && scaleChanged) {
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

            if (typeof layerControls.updateLayerTransform === "function") {
                layerControls.updateLayerTransform(id, {
                    position: { x: adjustedX, y: adjustedY },
                    rotation: rot,
                    scale: { x: scaleX, y: scaleY },
                });
            } else {
                if (typeof layerControls.updateLayerPosition === "function") {
                    layerControls.updateLayerPosition(id, {
                        x: adjustedX,
                        y: adjustedY,
                    });
                }
                if (typeof layerControls.updateLayerRotation === "function") {
                    layerControls.updateLayerRotation(id, rot);
                }
                if (typeof layerControls.updateLayerScale === "function") {
                    layerControls.updateLayerScale(id, {
                        x: scaleX,
                        y: scaleY,
                    });
                }
            }
        });
    }, [
        activeTextEdit,
        finishTextEdit,
        layerControls,
        stageViewportOffsetX,
        stageViewportOffsetY,
    ]);

    const startTextEdit = useCallback(
        (layerId: string, textId: string) => {
            const { textItem, layer } = getTextItem(layerId, textId);
            const containerRect =
                containerRef.current?.getBoundingClientRect();
            if (!textItem || !layer || !containerRect) return;

            const layerBaseX =
                layer.bounds?.x ?? layer.position?.x ?? 0;
            const layerBaseY =
                layer.bounds?.y ?? layer.position?.y ?? 0;
            const left =
                (stageViewportOffsetX +
                    layerBaseX +
                    (textItem.x ?? 0)) *
                safeScale;
            const top =
                (stageViewportOffsetY +
                    layerBaseY +
                    (textItem.y ?? 0)) *
                safeScale;

            setActiveTextEdit({
                layerId,
                textId,
                value: textItem.text ?? "",
                left,
                top,
                fontSize: textItem.fontSize ?? 32,
                fontFamily: textItem.fontFamily ?? "Arial, sans-serif",
                fontStyle: textItem.fontStyle ?? "normal",
                fontWeight: textItem.fontWeight ?? "normal",
                color: textItem.fill ?? "#000000",
            });

            const container = stageRef.current?.container();
            if (container && typeof container.focus === "function") {
                if (!container.getAttribute("tabindex")) {
                    container.setAttribute("tabindex", "0");
                }
                container.focus();
            }
        },
        [getTextItem, safeScale, stageViewportOffsetX, stageViewportOffsetY]
    );

    const initializeSelectionTransform = useCallback(
        (bounds: Bounds | null) => {
            if (!bounds) return;
            const { x, y, width, height } = bounds;
            const rotation = 0;
            const scaleX = 1;
            const scaleY = 1;
            dispatch(
                selectActions.setSelectionTransform({
                    x,
                    y,
                    width,
                    height,
                    rotation,
                    scaleX,
                    scaleY,
                })
            );
        },
        [dispatch]
    );

    const clearSelection = useCallback(() => {
        if (layerControls && typeof layerControls.clearSelection === "function") {
            layerControls.clearSelection();
        } else {
            pendingSelectionRef.current = null;
            setSelectedLayerBounds(null);
        }
    }, [layerControls]);

    // Deselect when clicking anywhere outside the canvas container
    useEffect(() => {
        if (!selectModeActive || !layerControls) return;
        if (typeof document === "undefined") return;

        const handleDocumentPointerDown = (ev: PointerEvent) => {
            const targetElement =
                ev.target instanceof HTMLElement ? ev.target : null;
            if (
                containerRef.current &&
                targetElement &&
                containerRef.current.contains(targetElement)
            ) {
                return;
            }

            if (targetElement?.closest(".sidebar")) {
                return;
            }

            clearSelection();
        };

        document.addEventListener(
            "pointerdown",
            handleDocumentPointerDown
        );
        return () =>
            document.removeEventListener(
                "pointerdown",
                handleDocumentPointerDown
            );
    }, [selectModeActive, layerControls, clearSelection]);

    // Stage pointer handlers (drawing / text / paint)
    const handleStagePointerDown = useCallback(
        (event: any) => {
            if (!layerControls) return;
            if (event?.evt?.preventDefault) {
                event.evt.preventDefault();
            }
            const point = getRelativePointerPosition();
            if (!point) return;

            if (isTextToolActive && activeTextEdit) {
                finishTextEdit();
                return;
            }

            const targetLayerId =
                selectedLayerIds[0] ??
                layerControls.layers[layerControls.layers.length - 1]?.id ??
                null;
            if (!targetLayerId) return;

            if (selectedLayerIds.length === 0) {
                layerControls.selectLayer(targetLayerId, {
                    mode: "replace",
                });
            }
            const layer = layerControls.layers.find(
                (l) => l.id === targetLayerId
            );
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

                const paintLayerId =
                    selectedLayerIds[0] ??
                    layerControls.layers[
                        layerControls.layers.length - 1
                    ]?.id ??
                    null;
                if (!paintLayerId) return;

                const paintLayer = layerControls.layers.find(
                    (l) => l.id === paintLayerId
                );

                if (paintLayer && (paintLayer.strokes?.length ?? 0) > 0) {
                    floodFillLayer(
                        paintLayerId,
                        paintLayer,
                        layerControls,
                        paintToolState.color ?? "#ffffff",
                        resolveEffectiveLayerTransform,
                        stageWidth,
                        stageHeight,
                        stageX,
                        stageY
                    );
                } else if (paintLayer) {
                    const bounds = {
                        x: 0,
                        y: 0,
                        width: stageWidth,
                        height: stageHeight,
                    };
                    layerControls.updateLayerRender?.(
                        paintLayer.id,
                        () => (
                            <Rect
                                key={`paint-fill-${paintLayer.id}`}
                                x={0}
                                y={0}
                                width={bounds?.width ?? stageWidth}
                                height={bounds?.height ?? stageHeight}
                                fill={paintToolState.color ?? "#ffffff"}
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
                            shapes: [
                                {
                                    id: `paint-rect-${paintLayer.id}`,
                                    type: "rect",
                                    x: 0,
                                    y: 0,
                                    width: bounds.width,
                                    height: bounds.height,
                                    fill:
                                        paintToolState.color ??
                                        "#ffffff",
                                },
                            ],
                        }
                    );
                }
                return;
            }

            if (isTextToolActive) {
                if (activeTextEdit) {
                    finishTextEdit();
                }

                const targetTextId =
                    event?.target?.attrs?.textItemId as
                        | string
                        | undefined;
                if (targetTextId) {
                    const textLayer = layerControls.layers.find((l) =>
                        (l.texts ?? []).some(
                            (t) => t.id === targetTextId
                        )
                    );
                    const textItem = textLayer?.texts?.find(
                        (t) => t.id === targetTextId
                    );
                    if (textLayer && textItem) {
                        layerControls.selectLayer(textLayer.id, {
                            mode: "replace",
                        });
                        startTextEdit(textLayer.id, textItem.id);
                        return;
                    }
                }

                const result = layerControls.addTextLayer?.({
                    text: textToolState.text ?? "Text",
                    fontSize: textToolState.fontSize ?? 32,
                    fill: textToolState.color ?? "#000000",
                    fontFamily:
                        textToolState.fontFamily ??
                        "Arial, sans-serif",
                    fontStyle:
                        textToolState.fontStyle ?? "normal",
                    fontWeight:
                        textToolState.fontWeight ?? "normal",
                    x: stageX,
                    y: stageY,
                });
                if (result) {
                    layerControls.selectLayer(result.layerId, {
                        mode: "replace",
                    });
                    startTextEdit(result.layerId, result.textId);
                }
                return;
            }

            const eff = resolveEffectiveLayerTransform(layer);
            const sizeScale =
                (Math.abs(eff.scaleX ?? 1) + Math.abs(eff.scaleY ?? 1)) /
                    2 || 1;

            let localX = stageX - (eff.boundsX ?? 0);
            let localY = stageY - (eff.boundsY ?? 0);

            localX /= eff.scaleX || 1;
            localY /= eff.scaleY || 1;

            if ((eff.rotation ?? 0) !== 0) {
                const rotationRad =
                    (eff.rotation ?? 0) * (Math.PI / 180);
                const cos = Math.cos(-rotationRad);
                const sin = Math.sin(-rotationRad);
                const x0 = localX;
                const y0 = localY;
                localX = x0 * cos - y0 * sin;
                localY = x0 * sin + y0 * cos;
            }

            if (!isDrawToolActive && !isRubberToolActive) return;
            if (isDrawToolActive && !insideStage) return;

            if (isRubberToolActive) {
                const strokeId = `erase-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 6)}`;
                const stroke: LayerStroke = {
                    id: strokeId,
                    points: [localX, localY],
                    color: "#000000",
                    size: rubberToolState.eraserSize / sizeScale,
                    hardness: 1,
                    opacity: 1,
                    mode: "erase",
                };
                setPendingStroke({ layerId: targetLayerId, stroke });
                dispatch(rubberActions.startErasing());
                return;
            }

            const strokeId = `stroke-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 6)}`;
            const hardness = drawToolState.brushHardness ?? 1;
            const stroke: LayerStroke = {
                id: strokeId,
                points: [localX, localY],
                color: drawToolState.brushColor,
                size: drawToolState.brushSize / sizeScale,
                hardness,
                opacity: drawToolState.brushOpacity,
                mode: "draw",
            };
            setPendingStroke({ layerId: targetLayerId, stroke });
            dispatch(drawActions.startDrawing(strokeId));
        },
        [
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
            resolveEffectiveLayerTransform,
        ]
    );

    const handleStagePointerMove = useCallback(
        (event: any) => {
            if (
                (!isDrawToolActive && !isRubberToolActive) ||
                !pendingStroke ||
                !layerControls
            )
                return;
            if (event?.evt?.preventDefault) {
                event.evt.preventDefault();
            }
            const point = getRelativePointerPosition();
            if (!point) return;

            const layer = layerControls.layers.find(
                (l) => l.id === pendingStroke.layerId
            );
            if (!layer) return;

            const eff2 = resolveEffectiveLayerTransform(layer);
            let localX = point.x - (eff2.boundsX ?? 0);
            let localY = point.y - (eff2.boundsY ?? 0);
            localX /= eff2.scaleX || 1;
            localY /= eff2.scaleY || 1;

            if ((eff2.rotation ?? 0) !== 0) {
                const r2 = (eff2.rotation ?? 0) * (Math.PI / 180);
                const cos2 = Math.cos(-r2);
                const sin2 = Math.sin(-r2);
                const x0 = localX;
                const y0 = localY;
                localX = x0 * cos2 - y0 * sin2;
                localY = x0 * sin2 + y0 * cos2;
            }

            setPendingStroke((prev) =>
                prev && prev.layerId === layer.id
                    ? {
                          layerId: prev.layerId,
                          stroke: {
                              ...prev.stroke,
                              points: [
                                  ...prev.stroke.points,
                                  localX,
                                  localY,
                              ],
                          },
                      }
                    : prev
            );
            if (isDrawToolActive) {
                dispatch(drawActions.updatePath(pendingStroke.stroke.id));
            }
        },
        [
            dispatch,
            getRelativePointerPosition,
            isDrawToolActive,
            isRubberToolActive,
            layerControls,
            pendingStroke,
            resolveEffectiveLayerTransform,
        ]
    );

    const handleStagePointerUp = useCallback(
        (event: any) => {
            if ((!isDrawToolActive && !isRubberToolActive) || !layerControls)
                return;
            if (event?.evt?.preventDefault) {
                event.evt.preventDefault();
            }

            const finalizedStroke = pendingStroke;
            if (pendingStroke) {
                const layer = layerControls.layers.find(
                    (l) => l.id === pendingStroke.layerId
                );
                if (layer) {
                    const existing = layer.strokes ?? [];
                    layerControls.updateLayerStrokes?.(layer.id, [
                        ...existing,
                        pendingStroke.stroke,
                    ]);
                }
            }
            setPendingStroke(null);

            if (isDrawToolActive) {
                dispatch(drawActions.finishDrawing());
            }

            if (isRubberToolActive) {
                dispatch(rubberActions.stopErasing());

                if (
                    finalizedStroke &&
                    layerControls.rasterizeLayer &&
                    typeof window !== "undefined"
                ) {
                    const targetLayerId = finalizedStroke.layerId;
                    window.requestAnimationFrame(() => {
                        window.requestAnimationFrame(() => {
                            const node =
                                layerNodeRefs.current.get(targetLayerId);
                            if (!node) return;
                            try {
                                node.getLayer()?.batchDraw();

                                let bounds: Bounds | null = null;
                                const stage = node.getStage();
                                if (stage) {
                                    const rect = node.getClientRect({
                                        skipTransform: false,
                                        relativeTo: stage,
                                    });
                                    const finite = [
                                        rect.x,
                                        rect.y,
                                        rect.width,
                                        rect.height,
                                    ].every((value) =>
                                        Number.isFinite(value)
                                    );
                                    if (finite) {
                                        bounds = {
                                            x:
                                                rect.x -
                                                stageViewportOffsetX,
                                            y:
                                                rect.y -
                                                stageViewportOffsetY,
                                            width: rect.width,
                                            height: rect.height,
                                        };
                                    }
                                }

                                const dataUrl = (node as any).toDataURL({
                                    mimeType: "image/png",
                                    quality: 1,
                                    pixelRatio: 1,
                                    backgroundColor: "rgba(0,0,0,0)",
                                });
                                layerControls.rasterizeLayer(
                                    targetLayerId,
                                    dataUrl,
                                    { bounds }
                                );
                            } catch (error) {
                                console.warn(
                                    "Unable to rasterize after erasing",
                                    error
                                );
                            }
                        });
                    });
                }
            }
        },
        [
            dispatch,
            isDrawToolActive,
            isRubberToolActive,
            layerControls,
            pendingStroke,
            stageViewportOffsetX,
            stageViewportOffsetY,
        ]
    );

    const handleSavePNG = useCallback(
        (fileName?: string) => {
            const stage = stageRef.current;
            if (!stage) return;
            const backgroundLayer = backgroundLayerRef.current;
            const selectionLayer = selectionLayerRef.current;
            const previousBackgroundVisibility = backgroundLayer
                ? backgroundLayer.visible()
                : undefined;
            const previousSelectionVisibility = selectionLayer
                ? selectionLayer.visible()
                : undefined;
            const previousScale = {
                x: stage.scaleX(),
                y: stage.scaleY(),
            };
            const previousPos = stage.position();
            try {
                if (backgroundLayer) {
                    backgroundLayer.visible(false);
                    backgroundLayer.getLayer()?.batchDraw();
                }
                if (selectionLayer) {
                    selectionLayer.visible(false);
                    selectionLayer.getLayer()?.batchDraw();
                }

                stage.scale({ x: 1, y: 1 });
                stage.position({
                    x: -stageViewportOffsetX,
                    y: -stageViewportOffsetY,
                });
                stage.batchDraw();

                const dataUrl = stage.toDataURL({
                    x: 0,
                    y: 0,
                    width: stageWidth,
                    height: stageHeight,
                    pixelRatio: 1,
                    mimeType: "image/png",
                    quality: 1,
                    backgroundColor: "rgba(0,0,0,0)",
                });
                const anchor = document.createElement("a");
                anchor.href = dataUrl;
                anchor.download = fileName ?? "canvas-stage.png";
                anchor.click();
            } catch (error) {
                console.warn("Unable to save PNG", error);
            } finally {
                stage.scale(previousScale);
                stage.position(previousPos);
                stage.batchDraw();
                if (
                    backgroundLayer &&
                    previousBackgroundVisibility !== undefined
                ) {
                    backgroundLayer.visible(previousBackgroundVisibility);
                    backgroundLayer.getLayer()?.batchDraw();
                }
                if (
                    selectionLayer &&
                    previousSelectionVisibility !== undefined
                ) {
                    selectionLayer.visible(previousSelectionVisibility);
                    selectionLayer.getLayer()?.batchDraw();
                }
            }
        },
        [
            stageRef,
            stageViewportOffsetX,
            stageViewportOffsetY,
            stageWidth,
            stageHeight,
        ]
    );

    useEffect(() => {
        const handler = (event: Event) => {
            const detail = (event as CustomEvent<{ fileName?: string }>).detail;
            handleSavePNG(detail?.fileName);
        };
        window.addEventListener("export-stage-png", handler as EventListener);
        return () =>
            window.removeEventListener(
                "export-stage-png",
                handler as EventListener
            );
    }, [handleSavePNG]);

    // Cursor logic (now uses pan state from hook)
    const baseCursor =
        isPointerPanning || isTouchPanning
            ? "grabbing"
            : isPaintToolActive ||
              isDrawToolActive ||
              isRubberToolActive
            ? "crosshair"
            : isTextToolActive
            ? "text"
            : panModeActive || spacePressed
            ? "grab"
            : "default";

    useEffect(() => {
        if (!stageRef.current) {
            return;
        }

        stageRef.current.container().style.cursor = baseCursor;
    }, [baseCursor, selectModeActive, stageRef]);

    // Handle escape to finish inline text editing
    useEffect(() => {
        if (!activeTextEdit) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                finishTextEdit();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [activeTextEdit, finishTextEdit]);

    // Compute HTML overlay selection box
    useEffect(() => {
        if (!selectedLayerBounds) {
            setOverlaySelectionBox(null);
            return;
        }

        const rotationDeg = resolveSelectionRotation();
        const newBox = {
            x: selectedLayerBounds.x,
            y: selectedLayerBounds.y,
            width: selectedLayerBounds.width,
            height: selectedLayerBounds.height,
            rotation: rotationDeg,
        };
        setOverlaySelectionBox(newBox);
    }, [selectedLayerBounds, resolveSelectionRotation]);

    const syncTransformerToSelection = useCallback(() => {
        const transformer = selectionTransformerRef.current;

        if (!transformer) {
            return;
        }

        if (!selectModeActive || !selectedLayerBounds) {
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
    }, [
        selectModeActive,
        selectedLayerBounds,
        selectedLayerIds,
        resolveSelectionRotation,
    ]);

    // Sync transformer & rotation
    useEffect(() => {
        syncTransformerToSelection();
        if (!selectModeActive || isSelectionTransformingRef.current) return;
        const nextRotation = resolveSelectionRotation();
        const normalizedRotation = Number.isFinite(nextRotation)
            ? nextRotation
            : 0;
        if (selectionProxyRotationRef.current !== normalizedRotation) {
            selectionProxyRotationRef.current = normalizedRotation;
            syncTransformerToSelection();
        }
    }, [
        layersRevision,
        syncTransformerToSelection,
        resolveSelectionRotation,
        selectModeActive,
        selectionProxyRotationRef,
    ]);

    // Handle pending selection and reset transform state
    useEffect(() => {
        if (pendingSelectionRef.current) {
            const pending = pendingSelectionRef.current;
            if (pending.length === selectedLayerIds.length) {
                const matches = pending.every(
                    (id, index) => id === selectedLayerIds[index]
                );
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

    // Attach Konva stage listeners for background clicks
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage || !selectModeActive) return;

        const handler = (event: any) => {
            if (event.target === event.target.getStage()) {
                clearSelection();
            }
        };

        stage.on("mousedown", handler);
        stage.on("touchstart", handler);

        return () => {
            stage.off("mousedown", handler);
            stage.off("touchstart", handler);
        };
    }, [selectModeActive, clearSelection, stageRef]);

    const GroupAny = StageGroup as any;

    return (
        <div
            ref={containerRef}
            // Pan/zoom pointer handlers provided by useCanvasViewport
            onPointerDown={undefined /* handled inside hook via capture on container */}
            onPointerMove={undefined}
            onPointerUp={undefined}
            onPointerCancel={undefined}
            onPointerLeave={undefined}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: containerBackground,
                overflow: "hidden",
                touchAction: "none",
                position: "relative",
                cursor: isPaintToolActive ? "crosshair" : undefined,
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
                                const layerIsSelected =
                                    selectedLayerSet.has(layer.id);
                                const layerBounds = layer.bounds ?? null;
                                const computedX =
                                    stageViewportOffsetX +
                                    (layerBounds
                                        ? layerBounds.x
                                        : layer.position.x);
                                const computedY =
                                    stageViewportOffsetY +
                                    (layerBounds
                                        ? layerBounds.y
                                        : layer.position.y);
                                const selectionOverride =
                                    layerIsSelected &&
                                    isSelectionTransformingRef.current &&
                                    sharedSelectionRect
                                        ? sharedSelectionRect
                                        : null;
                                const combinedStrokes: LayerStroke[] = [
                                    ...(layer.strokes ?? []),
                                    ...(pendingStroke &&
                                    pendingStroke.layerId === layer.id
                                        ? [pendingStroke.stroke]
                                        : []),
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
                                        x={
                                            selectionOverride
                                                ? selectionOverride.x
                                                : computedX
                                        }
                                        y={
                                            selectionOverride
                                                ? selectionOverride.y
                                                : computedY
                                        }
                                        rotation={
                                            selectionOverride
                                                ? selectionOverride.rotation
                                                : layer.rotation ?? 0
                                        }
                                        scaleX={
                                            selectionOverride
                                                ? selectionOverride.scaleX
                                                : layer.scale?.x ?? 1
                                        }
                                        scaleY={
                                            selectionOverride
                                                ? selectionOverride.scaleY
                                                : layer.scale?.y ?? 1
                                        }
                                        opacity={layer.opacity ?? 1}
                                        draggable={Boolean(selectModeActive)}
                                        selectModeActive={selectModeActive}
                                        stageViewportOffsetX={
                                            stageViewportOffsetX
                                        }
                                        stageViewportOffsetY={
                                            stageViewportOffsetY
                                        }
                                        baseCursor={baseCursor}
                                        layerNodeRefs={layerNodeRefs}
                                        pendingSelectionRef={
                                            pendingSelectionRef
                                        }
                                        selectionDragStateRef={
                                            selectionDragStateRef
                                        }
                                        onRefChange={(node) =>
                                            onRefChange({ node, layer })
                                        }
                                        updateBoundsFromLayerIds={
                                            updateBoundsFromLayerIds
                                        }
                                        syncTransformerToSelection={
                                            syncTransformerToSelection
                                        }
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
                                                fontFamily={
                                                    textItem.fontFamily
                                                }
                                                fontStyle={
                                                    textItem.fontStyle
                                                }
                                                fontWeight={
                                                    textItem.fontWeight
                                                }
                                                fill={
                                                    textItem.fill ??
                                                    "#000000"
                                                }
                                                listening={true}
                                                onDoubleClick={(ev) => {
                                                    ev.cancelBubble = true;
                                                    startTextEdit(
                                                        layer.id,
                                                        textItem.id
                                                    );
                                                }}
                                                onTap={(ev) => {
                                                    if (isTextToolActive) {
                                                        ev.cancelBubble =
                                                            true;
                                                        startTextEdit(
                                                            layer.id,
                                                            textItem.id
                                                        );
                                                    }
                                                }}
                                                onMouseDown={(ev) => {
                                                    if (isTextToolActive) {
                                                        ev.cancelBubble =
                                                            true;
                                                        startTextEdit(
                                                            layer.id,
                                                            textItem.id
                                                        );
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
                                                shadowBlur={
                                                    (1 - stroke.hardness) *
                                                    stroke.size *
                                                    1.5
                                                }
                                                shadowColor={stroke.color}
                                                globalCompositeOperation={
                                                    stroke.mode ===
                                                    "erase"
                                                        ? "destination-out"
                                                        : "source-over"
                                                }
                                                listening={true}
                                            />
                                        ))}
                                    </GroupAny>
                                );
                            })
                        ) : (
                            <GroupAny key="empty-layer">
                                {children}
                            </GroupAny>
                        )}
                    </Group>
                </KonvaLayer>

                <BackgroundLayer
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
                        captureSelectionTransformState={
                            captureSelectionTransformState
                        }
                        applySelectionTransformDelta={
                            applySelectionTransformDelta
                        }
                        syncSelectedLayerNodeRefs={
                            syncSelectedLayerNodeRefs
                        }
                        commitSelectedLayerNodeTransforms={
                            commitSelectedLayerNodeTransforms
                        }
                        scheduleBoundsRefresh={scheduleBoundsRefresh}
                        initializeSelectionTransform={
                            initializeSelectionTransform
                        }
                        markSelectionTransforming={markSelectionTransforming}
                    />
                ) : null}
            </Stage>

            {layerControls && !panModeActive && (
                <LayerPanelUI
                    isOpen={isLayerPanelOpen}
                    onToggle={() =>
                        setIsLayerPanelOpen((previous) => !previous)
                    }
                    onClose={() => setIsLayerPanelOpen(false)}
                    pendingSelectionRef={pendingSelectionRef}
                />
            )}

            {layerControls && !panModeActive && (
                <SettingsPanelUI
                    isOpen={isSettingsPanelOpen}
                    onToggle={() =>
                        setIsSettingsPanelOpen((prev) => !prev)
                    }
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
                        position: "absolute",
                        left: activeTextEdit.left,
                        top: activeTextEdit.top,
                        minWidth: "220px",
                        padding: "4px",
                        background: "rgba(255,255,255,0.95)",
                        border: "1px solid #0088ff",
                        borderRadius: "4px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                        zIndex: 20,
                    }}
                >
                    <textarea
                        key={`text-edit-${activeTextEdit.textId}`}
                        value={activeTextEdit.value}
                        autoFocus
                        onChange={(event) => {
                            const next = event.target.value;
                            setActiveTextEdit((prev) =>
                                prev ? { ...prev, value: next } : prev
                            );
                            updateTextValue(
                                activeTextEdit.layerId,
                                activeTextEdit.textId,
                                next
                            );
                        }}
                        onBlur={finishTextEdit}
                        onKeyDown={(event) => {
                            if (event.key === "Escape") {
                                event.preventDefault();
                                finishTextEdit();
                            }
                        }}
                        style={{
                            width: "100%",
                            minWidth: "220px",
                            minHeight: "44px",
                            padding: "6px 8px",
                            border: "1px solid #0088ff",
                            borderRadius: "2px",
                            background: "transparent",
                            color:
                                activeTextEdit.color ?? "#000000",
                            fontSize: "14px",
                            fontFamily: "Arial, sans-serif",
                            fontStyle: "normal",
                            fontWeight: "normal",
                            lineHeight: "1.3",
                            outline: "none",
                            resize: "none",
                            whiteSpace: "pre-wrap",
                            boxSizing: "border-box",
                        }}
                    />
                </div>
            ) : null}
        </div>
    );
};
