import { useState, useCallback, useEffect, useRef } from "react";
import type Konva from "konva";
import type { MutableRefObject } from "react";
import type { Bounds } from "../types/canvas.types";
import type { LayerElementTransform, LayerPaintShape, LayerStroke } from "@molecules/Layer/Layer.types";
import { drawActions } from "@store/CanvasApp/view/draw";
import { rubberActions } from "@store/CanvasApp/view/rubber";
import { floodFillLayer, createPaintStroke, getPaintShape, getTrimmedDataUrl } from "@molecules/Canvas/utils/floodFill";

type LayerControls = any; // keep loose; you can replace with your real type
type Dispatch = (action: any) => void;

export interface UseDrawingToolsOptions {
    layerControls: LayerControls | null;
    selectedLayerIds: string[];

    // tool states
    drawToolState: {
        active: boolean;
        brushSize: number;
        brushHardness?: number | null;
        brushColor: string;
        brushOpacity: number;
    };
    rubberToolState: {
        active: boolean;
        eraserSize: number;
    };
    paintToolState: {
        active: boolean;
        color?: string | null;
    };

    // coordinate helpers
    getRelativePointerPosition: () => { x: number; y: number } | null;
    resolveEffectiveLayerTransform: (layer: any) => {
        x: number;
        y: number;
        rotation?: number;
        scaleX?: number;
        scaleY?: number;
        boundsX: number;
        boundsY: number;
    };

    // stage / scene metrics
    stageWidth: number;
    stageHeight: number;
    stageViewportOffsetX: number;
    stageViewportOffsetY: number;

    // shared refs
    layerNodeRefs: MutableRefObject<Map<string, Konva.Node>>;

    // redux dispatch
    dispatch: Dispatch;
}

export function buildLayerTransformFromEffective(eff: {
    boundsX?: number;
    boundsY?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    x?: number;
    y?: number;
}): LayerElementTransform {
    return {
        position: {
            x: eff.boundsX ?? eff.x ?? 0,
            y: eff.boundsY ?? eff.y ?? 0,
        },
        rotation: eff.rotation ?? 0,
        scale: {
            x: eff.scaleX ?? 1,
            y: eff.scaleY ?? 1,
        },
    }
};

export interface UseDrawingToolsResult {
    pendingStroke: { layerId: string; stroke: LayerStroke } | null;
    handleStagePointerDown: (event: any) => void;
    handleStagePointerMove: (event: any) => void;
    handleStagePointerUp: (event: any) => void;
}

/**
 * Encapsulates drawing / erasing / paint-bucket tools:
 * - pointerDown: choose layer, paint vs draw vs erase, create stroke
 * - pointerMove: extend stroke path
 * - pointerUp: commit stroke & rasterize erased content
 * - warns if eraser is used on vector-only layers (needs rasterize)
 */
export function useDrawingTools(options: UseDrawingToolsOptions): UseDrawingToolsResult {
    const {
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
    } = options;

    const [pendingStroke, setPendingStroke] = useState<{
        layerId: string;
        stroke: LayerStroke;
    } | null>(null);

    const rasterizeAlertShownRef = useRef(false);

    const isDrawToolActive = !!drawToolState.active;
    const isRubberToolActive = !!rubberToolState.active;
    const isPaintToolActive = !!paintToolState.active;

    const getHoveredLayerId = useCallback(
        (event: any): string | null => {
            const stage: Konva.Stage | null | undefined =
                event?.target?.getStage?.() ?? null;
            if (!stage) {
                return null;
            }
            const pointer = stage.getPointerPosition();
            if (!pointer) {
                return null;
            }

            let node: Konva.Node | null =
                stage.getIntersection(pointer) ?? null;
            while (node && node !== stage) {
                const nodeId = node.id();
                if (typeof nodeId === "string" && nodeId.startsWith("layer-")) {
                    return nodeId.replace("layer-", "");
                }
                node = node.getParent();
            }

            return null;
        },
        []
    );

    // Warn when eraser is selected but selected layers contain vector content
    useEffect(() => {
        if (!isRubberToolActive || !layerControls) {
            rasterizeAlertShownRef.current = false;
            return;
        }

        const needsRasterize = selectedLayerIds.some((id) => {
            const layer = layerControls.layers.find((l) => l.id === id);
            return layer?.needsRasterization ?? true;
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

    const handleStagePointerDown = useCallback(
        (event: any) => {
            if (!layerControls) return;

            if (event?.evt?.preventDefault) {
                event.evt.preventDefault();
            }

            const point = getRelativePointerPosition();
            if (!point) return;

            // Choose target layer: hovered if possible, otherwise first selected or topmost
            const hoveredLayerId = getHoveredLayerId(event);
            const fallbackLayerId =
                selectedLayerIds[0] ??
                layerControls.layers[layerControls.layers.length - 1]?.id ??
                null;
            const targetLayerId = hoveredLayerId ?? fallbackLayerId;

            if (!targetLayerId) return;

            // If nothing selected yet, select target
            if (selectedLayerIds.length === 0) {
                layerControls.selectLayer(targetLayerId, { mode: "replace" });
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

            // Paint bucket tool
            if (isPaintToolActive) {
                if (!insideStage) return;

                const paintLayer = layerControls.layers.find(
                    (l) => l.id === targetLayerId
                );
                const fillColor = paintToolState.color ?? "#ffffff";

                // If the layer has strokes, do bounded flood fill; otherwise fill whole layer
                if (paintLayer && (paintLayer.strokes?.length ?? 0) > 0) {
                    floodFillLayer(
                        targetLayerId,
                        paintLayer,
                        layerControls,
                        fillColor,
                        resolveEffectiveLayerTransform,
                        stageWidth,
                        stageHeight,
                        stageX,
                        stageY
                    );
                } else if (paintLayer) {
                    if (typeof document === "undefined") {
                        return;
                    }

                    const fillCanvas = document.createElement("canvas");
                    fillCanvas.width = Math.max(1, stageWidth);
                    fillCanvas.height = Math.max(1, stageHeight);
                    const fillCtx = fillCanvas.getContext("2d");
                    if (!fillCtx) return;
                    fillCtx.fillStyle = fillColor;
                    fillCtx.fillRect(
                        0,
                        0,
                        fillCanvas.width,
                        fillCanvas.height
                    );

                    const paintEff = resolveEffectiveLayerTransform(paintLayer);
                    const paintLayerTransform = buildLayerTransformFromEffective(paintEff);
                    console.log('useDrawingTools');
                    const { trimmedDataUrl, imageX, imageY, imageWidth, imageHeight } = getTrimmedDataUrl(fillCanvas, stageWidth, stageHeight);
                    const paintShape = getPaintShape(fillCanvas, trimmedDataUrl, {x: imageX, y: imageY}, fillColor, paintLayer, paintLayerTransform);

                    const paintStroke = createPaintStroke(
                        fillColor,
                        paintShape
                    );

                    const nextStrokes = [...(paintLayer.strokes ?? []), paintStroke];
                    layerControls.updateLayerStrokes?.(paintLayer.id, nextStrokes);
                }

                return;
            }

            // If no drawing-related tool is active, do nothing
            if (!isDrawToolActive && !isRubberToolActive) return;
            if (isDrawToolActive && !insideStage) return;

            // Compute local coordinates (layer space) with bounds / scale / rotation
            const eff = resolveEffectiveLayerTransform(layer);
            const sizeScale =
                (Math.abs(eff.scaleX ?? 1) + Math.abs(eff.scaleY ?? 1)) / 2 || 1;
            const layerTransform = buildLayerTransformFromEffective(eff);

            let localX = stageX - (eff.boundsX ?? 0);
            let localY = stageY - (eff.boundsY ?? 0);
            localX /= eff.scaleX || 1;
            localY /= eff.scaleY || 1;

            if ((eff.rotation ?? 0) !== 0) {
                const rotationRad = (eff.rotation ?? 0) * (Math.PI / 180);
                const cos = Math.cos(-rotationRad);
                const sin = Math.sin(-rotationRad);
                const x0 = localX;
                const y0 = localY;
                localX = x0 * cos - y0 * sin;
                localY = x0 * sin + y0 * cos;
            }

            // Eraser
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
                    layerTransform,
                };
                setPendingStroke({ layerId: targetLayerId, stroke });
                dispatch(rubberActions.startErasing());
                return;
            }

            // Draw
            if (isDrawToolActive) {
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
                    layerTransform,
                };

                setPendingStroke({ layerId: targetLayerId, stroke });
                dispatch(drawActions.startDrawing(strokeId));
            }
        },
        [
            dispatch,
            layerControls,
            selectedLayerIds,
            drawToolState.brushColor,
            drawToolState.brushHardness,
            drawToolState.brushOpacity,
            drawToolState.brushSize,
            rubberToolState.eraserSize,
            stageWidth,
            stageHeight,
            isDrawToolActive,
            isRubberToolActive,
            isPaintToolActive,
            paintToolState.color,
            getRelativePointerPosition,
            resolveEffectiveLayerTransform,
        ]
    );

    const handleStagePointerMove = useCallback(
        (event: any) => {
            if (!pendingStroke || !layerControls) return;
            if (!isDrawToolActive && !isRubberToolActive) return;

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
            pendingStroke,
            layerControls,
            isDrawToolActive,
            isRubberToolActive,
            getRelativePointerPosition,
            resolveEffectiveLayerTransform,
        ]
    );

    const handleStagePointerUp = useCallback(
        (event: any) => {
            if (!layerControls) return;
            if (!pendingStroke) return;
            if (!isDrawToolActive && !isRubberToolActive) return;

            if (event?.evt?.preventDefault) {
                event.evt.preventDefault();
            }

            const finalizedStroke = pendingStroke;

            // Commit stroke to layer
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

            setPendingStroke(null);

            if (isDrawToolActive) {
                dispatch(drawActions.finishDrawing());
            }

            if (isRubberToolActive) {
                dispatch(rubberActions.stopErasing());

                // After erasing, bake result into bitmap
                if (
                    finalizedStroke &&
                    layerControls.rasterizeLayer &&
                    typeof window !== "undefined"
                ) {
                    const targetLayerId = finalizedStroke.layerId;
                    const targetLayer = layerControls.layers.find((l) => l.id === targetLayerId);
                    if (!(targetLayer?.needsRasterization ?? true)) {
                        return;
                    }

                    window.requestAnimationFrame(() => {
                        window.requestAnimationFrame(() => {
                            const node = layerNodeRefs.current.get(
                                targetLayerId
                            );
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
                                    ].every((v) => Number.isFinite(v));
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
            pendingStroke,
            layerControls,
            isDrawToolActive,
            isRubberToolActive,
            layerNodeRefs,
            stageViewportOffsetX,
            stageViewportOffsetY,
        ]
    );

    return {
        pendingStroke,
        handleStagePointerDown,
        handleStagePointerMove,
        handleStagePointerUp,
    };
}
