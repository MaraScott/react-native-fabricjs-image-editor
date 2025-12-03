import {
    useRef,
    useEffect,
    useState,
    useCallback,
    useMemo,
    type ReactNode,
} from "react";
import Konva from "konva";
import {
    WHEEL_ZOOM_STEP,
    KEYBOARD_ZOOM_STEP,
    PINCH_ZOOM_SENSITIVITY,
    TOUCH_DELTA_THRESHOLD,
    useUpdateZoom,
    useApplyZoomDelta,
} from "@molecules/Canvas/hooks/zoomUtils";
import { useResize } from "@molecules/Canvas/hooks/useResize";
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
import { Layer as KonvaLayer } from "@atoms/Canvas";
import type { RootState } from "@store/CanvasApp";
import type {
    PointerPanState,
    TouchPanState,
    SelectionDragState,
    Bounds,
} from "@molecules/Canvas/types/canvas.types";
import type {
    PanOffset,
    LayerStroke,
    LayerTextItem,
} from "@molecules/Layer/Layer.types";
import { Group, Line, Text as KonvaText } from "react-konva";
import { rubberActions } from "@store/CanvasApp/view/rubber";
import { textActions } from "@store/CanvasApp/view/text";
import { SettingsPanelUI } from "@molecules/Settings/SettingsPanelUI";
import type { Layer as KonvaLayerType } from "konva/lib/Layer";
import { useTextEditing } from "@molecules/Canvas/hooks/useTextEditing";
import { useSelectionTransform } from "@molecules/Canvas/hooks/useSelectionTransform";
import { useDrawingTools } from "@molecules/Canvas/hooks/useDrawingTools";

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
    const { layerControls, renderableLayers } = useSimpleCanvasStore(
        (state) => state
    );
    const dispatch = useDispatch();

    const isSelectToolActive = useSelector(
        (state: RootState) => state.view.select.active
    );
    const drawToolState = useSelector(
        (state: RootState) => state.view.draw
    );
    const rubberToolState = useSelector(
        (state: RootState) => state.view.rubber
    );
    const textToolState = useSelector(
        (state: RootState) => state.view.text
    );
    const paintToolState = useSelector(
        (state: RootState) => state.view.paint
    );

    const isDrawToolActive = drawToolState.active;
    const isRubberToolActive = rubberToolState.active;
    const isTextToolActive = textToolState.active;
    const isPaintToolActive = paintToolState.active;

    // Redux selection transform
    const reduxSelectionTransform = useSelector(selectSelectionTransform);

    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastTouchDistance = useRef(0);
    const pointerPanState = useRef<PointerPanState | null>(null);
    const touchPanState = useRef<TouchPanState | null>(null);
    const selectionDragStateRef = useRef<SelectionDragState | null>(null);
    const interactionLayerRef = useRef<KonvaLayerType | null>(null);
    const backgroundLayerRef = useRef<KonvaLayerType | null>(null);

    const pendingSelectionRef = useRef<string[] | null>(null);
    const transformAnimationFrameRef = useRef<number | null>(null);
    const layerNodeRefs = useRef<Map<string, Konva.Node>>(new Map());

    const [internalZoom, setInternalZoom] = useState<number>(zoom);
    const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 });
    const panOffsetRef = useRef(panOffset);
    const [spacePressed, setSpacePressed] = useState(false);
    const [isPointerPanning, setIsPointerPanning] = useState(false);
    const [isTouchPanning, setIsTouchPanning] = useState(false);
    const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
    const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
    const [layerRefreshKey, setLayerRefreshKey] = useState(0);
    const [eraserSize, setEraserSize] = useState(
        rubberToolState.eraserSize
    );
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

    // Resize hook
    const {
        dimensions: containerDimensions,
        scale,
        setDimensions: setContainerDimensions,
        setScale,
    } = useResize(containerRef, stageWidth, stageHeight, internalZoom);

    useEffect(() => {
        panOffsetRef.current = panOffset;
    }, [panOffset]);

    useEffect(() => {
        setEraserSize(rubberToolState.eraserSize);
    }, [rubberToolState.eraserSize]);

    // Open settings panel by default for kid theme
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
        observer.observe(layout, {
            attributes: true,
            attributeFilter: ["class"],
        });
        return () => observer.disconnect();
    }, []);

    const layersToRender = useMemo(() => {
        if (!layerControls) return [];
        const source =
            renderableLayers.length === layerControls.layers.length
                ? renderableLayers
                : layerControls.layers;
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

    // Keep node order in sync when moveLayer fires.
    useEffect(() => {
        if (typeof window === "undefined") return;

        const applyOrder = (orderedIds: string[]) => {
            setLayerRefreshKey((previous) => previous + 1);
            interactionLayerRef.current?.batchDraw?.();
        };

        const handleRefresh = (event: Event) => {
            const detail = (event as CustomEvent<{ layerIds?: string[] }>)
                .detail;
            const orderedIds =
                detail?.layerIds ?? layersToRender.map((layer) => layer.id);
            applyOrder(orderedIds);
        };

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
    const selectedLayerSet = useMemo(
        () => new Set(selectedLayerIds),
        [selectedLayerIds]
    );

    // Derived text selection
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

    // Viewport metrics
    const renderWidth = Math.max(1, stageWidth * scale);
    const renderHeight = Math.max(1, stageHeight * scale);
    const safeScale = Math.max(scale, 0.0001);
    const denom = Math.max(safeScale, 0.000001);
    const stageViewportOffsetX =
        (containerDimensions.width - renderWidth) / 2 / denom +
        panOffset.x / denom;
    const stageViewportOffsetY =
        (containerDimensions.height - renderHeight) / 2 / denom +
        panOffset.y / denom;

    // --- Text editing hook ---
    const {
        activeTextEdit,
        setActiveTextEdit,
        startTextEdit,
        finishTextEdit,
        updateTextValue,
    } = useTextEditing({
        layerControls,
        containerRef,
        stageRef,
        stageViewportOffsetX,
        stageViewportOffsetY,
        safeScale,
    });

    // --- Selection transform hook ---
    const {
        selectedLayerBounds,
        setSelectedLayerBounds,
        selectionLayerRef,
        selectionTransformerRef,
        selectionTransform,
        sharedSelectionRect,
        isSelectionTransformingRef,
        captureSelectionTransformState,
        applySelectionTransformDelta,
        commitSelectedLayerNodeTransforms,
        scheduleBoundsRefresh,
        initializeSelectionTransform,
        markSelectionTransforming,
        updateBoundsFromLayerIds,
        refreshBoundsFromSelection,
        resolveEffectiveLayerTransform,
    } = useSelectionTransform({
        selectModeActive,
        layerControls,
        stageRef,
        layerNodeRefs,
        pendingSelectionRef,
        transformAnimationFrameRef,
        stageViewportOffsetX,
        stageViewportOffsetY,
        safeScale,
        selectedLayerIds,
        layersRevision,
        activeTextEdit,
        finishTextEdit,
    });

    // --- Drawing tools hook (draw / erase / paint) ---
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

    const {
        pendingStroke,
        handleStagePointerDown,
        handleStagePointerMove,
        handleStagePointerUp,
    } = useDrawingTools({
        layerControls,
        selectedLayerIds,
        drawToolState,
        rubberToolState,
        paintToolState,
        getRelativePointerPosition,
        resolveEffectiveLayerTransform,
        stageWidth,
        stageHeight,
        stageViewportOffsetX,
        stageViewportOffsetY,
        layerNodeRefs,
        dispatch,
    });

    // Text settings adapter
    const applyTextStyleToSelection = useCallback(
        (updates: Partial<LayerTextItem>) => {
            if (!selectedTextLayer || !selectedTextItem || !layerControls?.updateLayerTexts)
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
        const fontStyle =
            selectedTextItem?.fontStyle ?? textToolState.fontStyle;
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
    }, [applyTextStyleToSelection, dispatch, selectedTextItem, textToolState]);

    // Ensure at least one layer is selected
    useEffect(() => {
        if (!layerControls || selectedLayerIds.length > 0) return;
        if (layerControls.layers.length > 0) {
            const topLayer =
                layerControls.layers[layerControls.layers.length - 1];
            layerControls.selectLayer(topLayer.id, { mode: "replace" });
        }
    }, [layerControls, selectedLayerIds]);

    // Sync selection bounds to overlay box (screen-space)
    useEffect(() => {
        if (!selectedLayerBounds) {
            setOverlaySelectionBox(null);
            return;
        }

        const rotationDeg = selectionTransform?.rotation ?? 0;
        const newBox = {
            x: selectedLayerBounds.x,
            y: selectedLayerBounds.y,
            width: selectedLayerBounds.width,
            height: selectedLayerBounds.height,
            rotation: rotationDeg,
        };
        setOverlaySelectionBox(newBox);
    }, [selectedLayerBounds, selectionTransform]);

    // Recenter on fitRequest
    useEffect(() => {
        setPanOffset({ x: 0, y: 0 });
        panOffsetRef.current = { x: 0, y: 0 };
    }, [fitRequest]);

    // Zoom hooks
    const updateZoom = useUpdateZoom(onZoomChange, setInternalZoom);
    const applyZoomDelta = useApplyZoomDelta(updateZoom);

    // Sync selectedLayerNodeRefs from layerNodeRefs and selectedLayerIds
    const selectedLayerNodeRefs = useRef<Map<string, Konva.Node>>(
        new Map()
    );

    const syncSelectedLayerNodeRefs = useCallback(() => {
        selectedLayerNodeRefs.current.clear();
        selectedLayerIds.forEach((id) => {
            const node = layerNodeRefs.current.get(id);
            if (node) {
                selectedLayerNodeRefs.current.set(id, node);
            }
        });
    }, [selectedLayerIds]);

    const onRefChange = ({ node, layer }) => {
        if (node) {
            layerNodeRefs.current.set(layer.id, node);
        } else {
            layerNodeRefs.current.delete(layer.id);
        }
    };

    // Handle rasterize requests
    useEffect(() => {
        const handleRasterizeRequest = (event: Event) => {
            const detail = (event as CustomEvent<{ layerId: string }>)
                .detail;
            const layerId = detail?.layerId;
            if (!layerId || !layerControls?.rasterizeLayer) return;
            const layerDescriptor = layerControls.layers.find(
                (layer) => layer.id === layerId
            );
            const node = layerNodeRefs.current.get(layerId);
            if (!node) return;
            try {
                let bounds: Bounds | null =
                    layerDescriptor?.bounds ?? null;
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

    // Initialize/clear selectionTransform in Redux when selection changes
    useEffect(() => {
        if (selectedLayerIds.length > 0 && !reduxSelectionTransform) {
            if (selectedLayerBounds) {
                const { x, y, width, height } = selectedLayerBounds;
                dispatch(
                    selectActions.setSelectionTransform({
                        x,
                        y,
                        width,
                        height,
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
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

    // Stage ready & scale
    useEffect(() => {
        if (stageRef.current) {
            if (onStageReady) onStageReady(stageRef.current);
            stageRef.current.scale({ x: scale, y: scale });
        }
        setInternalZoom(zoom);
    }, [onStageReady, scale, zoom]);

    // Wheel zoom
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (event: WheelEvent) => {
            const target = event.target as HTMLElement | null;
            if (
                target &&
                (target.closest(".layer-panel-ui") ||
                    target.closest(".settings-panel-ui"))
            ) {
                return;
            }
            event.preventDefault();
            if (event.deltaY === 0) return;
            const direction = -Math.sign(event.deltaY);
            applyZoomDelta(direction * WHEEL_ZOOM_STEP);
        };

        container.addEventListener("wheel", handleWheel, {
            passive: false,
        });
        return () =>
            container.removeEventListener("wheel", handleWheel);
    }, [applyZoomDelta]);

    // Keyboard zoom & space-panning
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target) {
                const tagName = target.tagName;
                if (
                    tagName === "INPUT" ||
                    tagName === "TEXTAREA" ||
                    target.isContentEditable
                ) {
                    return;
                }
            }

            if (event.code === "Space") {
                if (!event.repeat) {
                    setSpacePressed(true);
                }
                event.preventDefault();
                return;
            }

            if (event.key === "+" || event.key === "=") {
                event.preventDefault();
                applyZoomDelta(KEYBOARD_ZOOM_STEP);
            } else if (event.key === "-" || event.key === "_") {
                event.preventDefault();
                applyZoomDelta(-KEYBOARD_ZOOM_STEP);
            } else if (
                event.key === "0" &&
                (event.ctrlKey || event.metaKey)
            ) {
                event.preventDefault();
                updateZoom(() => 0);
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.code === "Space") {
                setSpacePressed(false);
            }
        };

        const handleWindowBlur = () => {
            setSpacePressed(false);
            pointerPanState.current = null;
            setIsPointerPanning(false);
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", handleWindowBlur);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("blur", handleWindowBlur);
        };
    }, [applyZoomDelta, updateZoom]);

    const clearSelection = useCallback(() => {
        if (layerControls && typeof layerControls.clearSelection === "function") {
            layerControls.clearSelection();
        } else {
            pendingSelectionRef.current = null;
            setSelectedLayerBounds(null);
        }
    }, [layerControls, setSelectedLayerBounds]);

    // Deselect when clicking outside the canvas container (but not sidebars)
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

    const finishPointerPan = useCallback(
        (event?: React.PointerEvent<HTMLDivElement>) => {
            if (!pointerPanState.current) return;
            const { pointerId } = pointerPanState.current;
            if (event) {
                try {
                    if (
                        event.currentTarget.hasPointerCapture(pointerId)
                    ) {
                        event.currentTarget.releasePointerCapture(
                            pointerId
                        );
                    }
                } catch {
                    // ignore
                }
            }
            pointerPanState.current = null;
            setIsPointerPanning(false);
        },
        []
    );

    // Container pointer panning (mouse/pen)
    const handlePointerDown = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (
                event.pointerType !== "mouse" &&
                event.pointerType !== "pen"
            ) {
                return;
            }
            if (event.button !== 0) return;
            if (selectModeActive) return;
            if (!(panModeActive || spacePressed)) return;

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
                // ignore
            }
        },
        [panModeActive, spacePressed, selectModeActive]
    );

    const handlePointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
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
        },
        []
    );

    const handlePointerUp = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const state = pointerPanState.current;
            if (!state || event.pointerId !== state.pointerId) {
                return;
            }
            event.preventDefault();
            finishPointerPan(event);
        },
        [finishPointerPan]
    );

    const handlePointerCancel = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const state = pointerPanState.current;
            if (!state || event.pointerId !== state.pointerId) {
                return;
            }
            finishPointerPan(event);
        },
        [finishPointerPan]
    );

    const handlePointerLeave = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const state = pointerPanState.current;
            if (!state || event.pointerId !== state.pointerId) {
                return;
            }
            finishPointerPan(event);
        },
        [finishPointerPan]
    );

    // Touch pinch zoom and one-/three-finger pan
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
                        x:
                            panState.origin.x +
                            (center.x - panState.center.x),
                        y:
                            panState.origin.y +
                            (center.y - panState.center.y),
                    });
                    return;
                }
            }

            if (
                panState &&
                panState.touchCount === 3 &&
                touches.length === 3
            ) {
                event.preventDefault();
                const center = getTouchCenter(touches);
                setPanOffset({
                    x:
                        panState.origin.x +
                        (center.x - panState.center.x),
                    y:
                        panState.origin.y +
                        (center.y - panState.center.y),
                });
                return;
            }

            if (touches.length === 2) {
                event.preventDefault();
                const currentDistance = getTouchDistance(touches);
                const previousDistance = lastTouchDistance.current;
                if (previousDistance > 0) {
                    const scaleFactor =
                        currentDistance / previousDistance;
                    const deltaZoom =
                        (scaleFactor - 1) * PINCH_ZOOM_SENSITIVITY;
                    applyZoomDelta(deltaZoom, TOUCH_DELTA_THRESHOLD);
                }
                lastTouchDistance.current = currentDistance;
            }
        };

        const handleTouchEnd = (event: TouchEvent) => {
            if (touchPanState.current) {
                const activeCount = touchPanState.current.touchCount;
                if (
                    (activeCount === 3 &&
                        event.touches.length < 3) ||
                    (activeCount === 1 && event.touches.length === 0)
                ) {
                    clearTouchPan();
                }
            }

            if (event.touches.length < 2) {
                lastTouchDistance.current = 0;
            }

            if (
                panModeActive &&
                event.touches.length === 1 &&
                (!touchPanState.current ||
                    touchPanState.current.touchCount !== 1)
            ) {
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

        container.addEventListener("touchstart", handleTouchStart, {
            passive: false,
        });
        container.addEventListener("touchmove", handleTouchMove, {
            passive: false,
        });
        container.addEventListener("touchend", handleTouchEnd);
        container.addEventListener("touchcancel", handleTouchCancel);

        return () => {
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
            container.removeEventListener("touchend", handleTouchEnd);
            container.removeEventListener(
                "touchcancel",
                handleTouchCancel
            );
        };
    }, [applyZoomDelta, panModeActive]);

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
        if (!stageRef.current) return;
        stageRef.current.container().style.cursor = baseCursor;
    }, [baseCursor, selectModeActive]);

    // Attach Konva stage listeners for background clicks to clear selection (in select mode)
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
    }, [selectModeActive, clearSelection]);

    // Export PNG
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
            stageViewportOffsetX,
            stageViewportOffsetY,
            stageWidth,
            stageHeight,
        ]
    );

    useEffect(() => {
        const handler = (event: Event) => {
            const detail = (event as CustomEvent<{ fileName?: string }>)
                .detail;
            handleSavePNG(detail?.fileName);
        };
        window.addEventListener(
            "export-stage-png",
            handler as EventListener
        );
        return () =>
            window.removeEventListener(
                "export-stage-png",
                handler as EventListener
            );
    }, [handleSavePNG]);

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
                style={{ cursor: baseCursor }}
            >
                <KonvaLayer key={`interaction-layer`}>
                    <Group key={`interaction-layer-group-${layersRevision}`}>
                        {layerControls && layersToRender.length > 0 ? (
                            layersToRender.map((layer, index) => {
                                const layerIsSelected =
                                    selectedLayerSet.has(layer.id);
                                const layerBounds =
                                    layer.bounds ?? null;
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
                                        draggable={Boolean(
                                            selectModeActive
                                        )}
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
                                            syncSelectedLayerNodeRefs
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
                                                fontSize={
                                                    textItem.fontSize
                                                }
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
                                                    if (
                                                        isTextToolActive
                                                    ) {
                                                        ev.cancelBubble = true;
                                                        startTextEdit(
                                                            layer.id,
                                                            textItem.id
                                                        );
                                                    }
                                                }}
                                                onMouseDown={(ev) => {
                                                    if (
                                                        isTextToolActive
                                                    ) {
                                                        ev.cancelBubble = true;
                                                        startTextEdit(
                                                            layer.id,
                                                            textItem.id
                                                        );
                                                    }
                                                }}
                                            />
                                        ))}
                                        {combinedStrokes.map((stroke) => {
                                            if (stroke.mode === "paint") {
                                                return null;
                                            }
                                            return (
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
                                            );
                                        })}
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
                    containerWidth={
                        containerDimensions.width / safeScale
                    }
                    containerHeight={
                        containerDimensions.height / safeScale
                    }
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
                        padding={8}
                        borderDash={[8, 4]}
                        layerRef={selectionLayerRef}
                        transformerRef={selectionTransformerRef}
                        anchorSize={8}
                        anchorCornerRadius={2}
                        anchorStrokeWidth={1}
                        hitStrokeWidth={12}
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
                        markSelectionTransforming={
                            markSelectionTransforming
                        }
                    />
                ) : null}
            </Stage>

            {layerControls && !panModeActive && (
                <LayerPanelUI
                    isOpen={isLayerPanelOpen}
                    onToggle={() =>
                        setIsLayerPanelOpen(
                            (previous) => !previous
                        )
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
                        boxShadow:
                            "0 2px 8px rgba(0,0,0,0.25)",
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
                                prev
                                    ? { ...prev, value: next }
                                    : prev
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
                                activeTextEdit.color ??
                                "#000000",
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
