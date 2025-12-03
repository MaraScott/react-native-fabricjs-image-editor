import { Group as KonvaGroup } from '@atoms/Canvas';
import { Image as KonvaImage } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { ReactNode, DragEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@store/CanvasApp';
import { Group } from 'react-konva';
import type Konva from 'konva';
import { useSimpleCanvasStore } from '@store/SimpleCanvas';
import type { Bounds } from '@molecules/Canvas/types/canvas.types';
import { areBoundsEqual } from '@molecules/Canvas/utils/bounds';
import type { LayerDescriptor, LayerPaintShape } from '../Layer.types';

interface StageGroupProps {
    layersRevision: number;
    index?: number;
    id: string;
    layerId: string;
    visible: boolean;
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    opacity?: number;
    draggable: boolean;
    selectModeActive: boolean;
    stageViewportOffsetX: number;
    stageViewportOffsetY: number;
    baseCursor: string;
    children: ReactNode;
    // Refs and state setters
    layerNodeRefs: React.RefObject<Map<string, Konva.Node>>;
    pendingSelectionRef: React.RefObject<string[] | null>;
    selectionDragStateRef: React.RefObject<any>;

    // Callbacks
    onRefChange: (node: Konva.Node | null) => void;
    updateBoundsFromLayerIds: (ids: string[]) => void;
    syncTransformerToSelection: () => void;
}

const PaintShapeNode = ({ shape }: { shape: LayerPaintShape }) => {
    const image = useMemo(() => {
        if (typeof window === 'undefined') {
            return null;
        }
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = shape.imageSrc;
        return img;
    }, [shape.imageSrc]);

    if (!image) {
        return null;
    }

    return (
        <KonvaImage
            key={shape.id}
            image={image}
            x={shape.bounds.x}
            y={shape.bounds.y}
            width={shape.bounds.width}
            height={shape.bounds.height}
            opacity={shape.opacity ?? 1}
            listening={false}
        />
    );
};

const collectPaintShapes = (layer?: LayerDescriptor): LayerPaintShape[] =>
    (layer?.strokes ?? [])
        .map((stroke) => stroke.paintShape)
        .filter((shape): shape is LayerPaintShape => Boolean(shape));

export const StageGroup = ({
    layersRevision,
    index,
    id,
    layerId,
    visible,
    x,
    y,
    rotation,
    scaleX,
    scaleY,
    opacity,
    draggable,
    selectModeActive,
    stageViewportOffsetX,
    stageViewportOffsetY,
    baseCursor,
    children,
    layerNodeRefs,
        pendingSelectionRef,
        selectionDragStateRef,
        onRefChange,
        updateBoundsFromLayerIds,
        syncTransformerToSelection,
}: StageGroupProps) => {
    const layerControls = useSimpleCanvasStore((state) => state.layerControls);
    // Tool activity flags — prevent group from intercepting pointer events when a tool is active
    const isDrawToolActive = useSelector((state: RootState) => state.view.draw.active);
    const isRubberToolActive = useSelector((state: RootState) => state.view.rubber.active);
    const isPaintToolActive = useSelector((state: RootState) => state.view.paint.active);
    const isTextToolActive = useSelector((state: RootState) => state.view.text.active);
    const layerRef = useRef<Konva.Node | null>(null);
    const lastRecordedBoundsRef = useRef<Bounds | null>(null);

    const measureAndStoreBounds = useCallback((node: Konva.Node | null) => {
        if (!layerControls?.updateLayerBounds) {
            return;
        }

        if (!node) {
            lastRecordedBoundsRef.current = null;
            layerControls.updateLayerBounds(layerId, null);
            return;
        }

        const stage = node.getStage();
        if (!stage) {
            return;
        }

        const rect = node.getClientRect({
            skipTransform: false,
            relativeTo: stage,
        });

        if (!rect) {
            return;
        }

        const finiteValues = [rect.x, rect.y, rect.width, rect.height].every((value) => Number.isFinite(value));
        if (!finiteValues) {
            return;
        }

        const normalizedBounds: Bounds = {
            x: rect.x - stageViewportOffsetX,
            y: rect.y - stageViewportOffsetY,
            width: rect.width,
            height: rect.height,
        };

        if (areBoundsEqual(lastRecordedBoundsRef.current, normalizedBounds)) {
            return;
        }

        lastRecordedBoundsRef.current = normalizedBounds;
        layerControls.updateLayerBounds(layerId, normalizedBounds);
    }, [layerControls, layerId, stageViewportOffsetX, stageViewportOffsetY]);

    const handleLayerRef = useCallback((node: Konva.Node | null) => {
        layerRef.current = node;
        measureAndStoreBounds(node);
        onRefChange(node);
    }, [measureAndStoreBounds, onRefChange]);

    useEffect(() => {
        measureAndStoreBounds(layerRef.current);
    }, [measureAndStoreBounds, layersRevision, visible, x, y, rotation, scaleX, scaleY]);

    if (!layerControls) {
        return null;
    }
    const layer = layerControls.layers.find((l) => l.id === layerId);
    const layerPaintShapes = collectPaintShapes(layer);
    const onPointerDown = (event: KonvaEventObject<PointerEvent>) => {
        // If a drawing/erasing/painting/text tool is active, do not intercept pointerdown
        // on the group so the stage-level handlers can receive the event and perform
        // drawing/erasing. This prevents the group from being dragged/moved while using tools.
        if (isDrawToolActive || isRubberToolActive || isPaintToolActive || isTextToolActive) {
            return;
        }

        if (!selectModeActive || !layerControls) {
            return;
        }

        // Perform synchronous per-pixel hit test where possible. Avoid async image loads here
        // because Konva pointer handlers expect synchronous execution — async handlers
        // can break downstream pointermove/pointerup events used by pen/eraser/rotation.
        try {
            const stage = event.target.getStage();
            if (!stage) throw new Error('no-stage');
            const pointer = stage.getPointerPosition();
            if (!pointer) throw new Error('no-pointer');

            let localX = pointer.x - x;
            let localY = pointer.y - y;

            // Apply inverse scale
            const invScaleX = scaleX === 0 ? 1 : 1 / scaleX;
            const invScaleY = scaleY === 0 ? 1 : 1 / scaleY;
            localX *= invScaleX;
            localY *= invScaleY;

            // Apply inverse rotation
            if (rotation && rotation % 360 !== 0) {
                const rotationRad = (rotation * Math.PI) / 180;
                const cos = Math.cos(-rotationRad);
                const sin = Math.sin(-rotationRad);
                const x0 = localX;
                const y0 = localY;
                localX = x0 * cos - y0 * sin;
                localY = x0 * sin + y0 * cos;
            }

            const paintHit = layerPaintShapes.some((shape) => {
                return (
                    localX >= shape.bounds.x &&
                    localX <= shape.bounds.x + shape.bounds.width &&
                    localY >= shape.bounds.y &&
                    localY <= shape.bounds.y + shape.bounds.height
                );
            });

            if (layer && paintHit) {
                // select
            } else {
                // Rasterize strokes only (synchronous, based on stroke points available in memory)
                const w = Math.max(1, Math.round(layer?.bounds?.width ?? 1));
                const h = Math.max(1, Math.round(layer?.bounds?.height ?? 1));
                const tmpCanvas = document.createElement('canvas');
                tmpCanvas.width = w;
                tmpCanvas.height = h;
                const tmpCtx = tmpCanvas.getContext('2d');
                if (tmpCtx) {
                    tmpCtx.clearRect(0, 0, w, h);
                    const strokes = (layer?.strokes ?? []) as any[];
                    for (const s of strokes) {
                        if (!s || !s.points || s.points.length < 2) continue;
                        tmpCtx.save();
                        tmpCtx.globalCompositeOperation = s.mode === 'erase' ? 'destination-out' : 'source-over';
                        tmpCtx.lineCap = 'round';
                        tmpCtx.lineJoin = 'round';
                        tmpCtx.strokeStyle = 'rgba(0,0,0,1)';
                        tmpCtx.lineWidth = Math.max(1, s.size || 1);
                        tmpCtx.beginPath();
                        const pts = s.points;
                        tmpCtx.moveTo(pts[0] ?? 0, pts[1] ?? 0);
                        for (let i = 2; i < pts.length; i += 2) {
                            tmpCtx.lineTo(pts[i], pts[i + 1]);
                        }
                        tmpCtx.stroke();
                        tmpCtx.restore();
                    }

                    const sampleX = Math.floor(localX - (layer?.bounds?.x ?? 0));
                    const sampleY = Math.floor(localY - (layer?.bounds?.y ?? 0));
                    let hit = false;
                    if (sampleX >= 0 && sampleY >= 0 && sampleX < tmpCanvas.width && sampleY < tmpCanvas.height) {
                        try {
                            const data = tmpCtx.getImageData(sampleX, sampleY, 1, 1).data;
                            hit = (data[3] ?? 0) > 0;
                        } catch {
                            // getImageData can fail if canvas is tainted; fall back to selecting
                            hit = true;
                        }
                    }

                    if (!hit) {
                        // Clicked transparent pixel -> do not select
                        event.cancelBubble = true;
                        return;
                    }
                }
            }
        } catch (e) {
            // On error, fall back to select - keep behavior permissive to avoid breaking UX
        }

        pendingSelectionRef.current = layerControls.selectLayer(layerId, { mode: 'replace' });
        updateBoundsFromLayerIds(pendingSelectionRef.current);

        const stage = event.target.getStage();
        if (stage) {
            stage.container().style.cursor = 'pointer';
        }

        event.cancelBubble = true;
    };

    const handleDragStart = useCallback((event: KonvaEventObject<DragEvent>) => {
        if (!selectModeActive || !layerControls) return;

        event.cancelBubble = true;

        let activeSelection = pendingSelectionRef.current ?? layerControls.selectedLayerIds;

        if (!activeSelection.includes(layerId)) {
            pendingSelectionRef.current = layerControls.selectLayer(layerId, { mode: 'replace' });
            activeSelection = pendingSelectionRef.current ?? [layerId];
        }

        const initialPositions = new Map<string, { x: number; y: number }>();
        activeSelection.forEach((id) => {
            const node = id === layerId ? event.target : layerNodeRefs.current.get(id);
            if (node) {
                const pos = (node as any).position();
                initialPositions.set(id, { x: pos.x, y: pos.y });
            }
        });

        selectionDragStateRef.current = {
            anchorLayerId: layerId,
            initialPositions,
        };

        updateBoundsFromLayerIds(activeSelection);

        const stage = event.target.getStage();
        if (stage) {
            stage.container().style.cursor = 'grabbing';
        }
    }, [layerControls, layerId, layerNodeRefs, pendingSelectionRef, selectModeActive, selectionDragStateRef, updateBoundsFromLayerIds]);

    const handleDragMove = useCallback((event: KonvaEventObject<DragEvent>) => {
        if (!selectModeActive || !layerControls) return;

        const dragState = selectionDragStateRef.current;
        const activeSelection = pendingSelectionRef.current ?? layerControls.selectedLayerIds;

        if (!dragState || activeSelection.length === 0) {
            updateBoundsFromLayerIds(activeSelection);
            return;
        }

        const anchorInitial = dragState.initialPositions.get(layerId);
        if (!anchorInitial) {
            return;
        }

    const currentPosition = (event.target as any).position();
        const deltaX = currentPosition.x - anchorInitial.x;
        const deltaY = currentPosition.y - anchorInitial.y;

        activeSelection.forEach((id) => {
            if (id === layerId) {
                return;
            }
            const original = dragState.initialPositions.get(id);
            const node = layerNodeRefs.current.get(id);
            if (!original || !node) {
                return;
            }
            (node as any).position({
                x: original.x + deltaX,
                y: original.y + deltaY,
            });
        });

        updateBoundsFromLayerIds(activeSelection);
    }, [layerControls, layerId, layerNodeRefs, pendingSelectionRef, selectModeActive, selectionDragStateRef, updateBoundsFromLayerIds]);

    const handleDragEnd = useCallback((event: KonvaEventObject<DragEvent>) => {
        if (!selectModeActive || !layerControls) return;

        const dragState = selectionDragStateRef.current;
        selectionDragStateRef.current = null;

        const activeSelection = (pendingSelectionRef.current ?? layerControls.selectedLayerIds).slice();
        pendingSelectionRef.current = null;

        const idsToUpdate = dragState?.initialPositions ? activeSelection : [layerId];

        idsToUpdate.forEach((id: string) => {
            const node = id === layerId ? event.target : layerNodeRefs.current.get(id);
            if (!node) {
                return;
            }
            const position = (node as any).position();
            layerControls.updateLayerPosition(id, {
                x: position.x - stageViewportOffsetX,
                y: position.y - stageViewportOffsetY,
            });
        });

        measureAndStoreBounds(layerRef.current);
        updateBoundsFromLayerIds(layerControls.selectedLayerIds);

        const stage = event.target.getStage();
        if (stage) {
            stage.container().style.cursor = baseCursor;
        }
    }, [layerControls, layerId, layerNodeRefs, measureAndStoreBounds, pendingSelectionRef, selectModeActive, selectionDragStateRef, stageViewportOffsetX, stageViewportOffsetY]);
    return (
        <Group
            key={`${layersRevision}-${layerId}`}
            ref={handleLayerRef}
            id={id}
            visible={visible}
            x={x}
            y={y}
            rotation={rotation}
            scaleX={scaleX}
            scaleY={scaleY}
            opacity={opacity ?? 1}
            draggable={draggable}
            //   onClick={(event: KonvaEventObject<MouseEvent>) => {
            //     if (!selectModeActive || !layerControls) {
            //       return;
            //     }

            //     event.cancelBubble = true;
            //     pendingSelectionRef.current = layerControls.selectLayer(layerId, { mode: 'replace' });
            //   }}
            //   onTap={(event: KonvaEventObject<TouchEvent>) => {
            //     if (!selectModeActive || !layerControls) {
            //       return;
            //     }

            //     event.cancelBubble = true;
            //     pendingSelectionRef.current = layerControls.selectLayer(layerId, { mode: 'replace' });
            //   }}
            onMouseDown={onPointerDown}
            onTouchStart={onPointerDown}
            //   onPointerEnter={(event: KonvaEventObject<PointerEvent>) => {
            //     const stage = event.target.getStage();
            //     if (!stage) return;
            //     stage.container().style.cursor = selectModeActive ? 'pointer' : baseCursor;
            //   }}
            //   onPointerLeave={(event: KonvaEventObject<PointerEvent>) => {
            //     const stage = event.target.getStage();
            //     if (!stage) return;
            //     stage.container().style.cursor = baseCursor;
            //   }}
            //   onPointerUp={(event: KonvaEventObject<PointerEvent>) => {
            //     if (!selectModeActive || !layerControls) {
            //       return;
            //     }

            //     updateBoundsFromLayerIds(pendingSelectionRef.current ?? layerControls.selectedLayerIds);

            //     const stage = event.target.getStage();
            //     if (stage) {
            //       stage.container().style.cursor = 'pointer';
            //     }
            //   }}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
        >
            {children}
            {layerPaintShapes.map((shape) => (
                <PaintShapeNode key={shape.id} shape={shape} />
            ))}
        </Group>
    );
};
