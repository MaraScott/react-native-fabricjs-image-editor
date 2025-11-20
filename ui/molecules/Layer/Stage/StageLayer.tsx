import { Layer as KonvaLayer } from '@atoms/Canvas';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { ReactNode } from 'react';
import type { DragEvent } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import type Konva from 'konva';
import { useSimpleCanvasStore } from '@store/SimpleCanvas';
import type { Bounds } from '@molecules/Canvas/types/canvas.types';
import { areBoundsEqual } from '@molecules/Canvas/utils/bounds';

interface StageLayerProps {
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
    draggable: boolean;
    selectModeActive: boolean;
    stageViewportOffsetX: number;
    stageViewportOffsetY: number;
    baseCursor: string;
    children: ReactNode;

    // Refs and state setters
    layerNodeRefs: React.RefObject<Map<string, Konva.Layer>>;
    pendingSelectionRef: React.RefObject<string[] | null>;
    selectionDragStateRef: React.RefObject<any>;

    // Callbacks
    onRefChange: (node: Konva.Layer | null) => void;
    updateBoundsFromLayerIds: (ids: string[]) => void;
    syncTransformerToSelection: () => void;
}

export const StageLayer = ({
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
}: StageLayerProps) => {
    const layerControls = useSimpleCanvasStore((state) => state.layerControls);
    const layerRef = useRef<Konva.Layer | null>(null);
    const lastRecordedBoundsRef = useRef<Bounds | null>(null);

    const measureAndStoreBounds = useCallback((node: Konva.Layer | null) => {
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

    const handleLayerRef = useCallback((node: Konva.Layer | null) => {
        layerRef.current = node;
        measureAndStoreBounds(node);
        onRefChange(node);
    }, [measureAndStoreBounds, onRefChange]);

    useEffect(() => {
        measureAndStoreBounds(layerRef.current);
    }, [measureAndStoreBounds, layersRevision, visible, x, y, scaleX, scaleY]);

    if (!layerControls) {
        return null;
    }
    const onPointerDown = (event: KonvaEventObject<PointerEvent>) => {
        console.log('#### StageLayer onPointerDown layerId:', layerId);
        if (!selectModeActive || !layerControls) {
            return;
        }

        pendingSelectionRef.current = layerControls.selectLayer(layerId, { mode: 'replace' });
        updateBoundsFromLayerIds(pendingSelectionRef.current);

        const stage = event.target.getStage();
        if (stage) {
            stage.container().style.cursor = 'pointer';
        }

        event.cancelBubble = true;
    }
    return (
        <KonvaLayer
            key={`${layersRevision}-${layerId}`}
            ref={handleLayerRef}
            visible={visible}
            x={x}
            y={y}
            //   rotation={rotation}
            //   scaleX={scaleX}
            //   scaleY={scaleY}
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
            //   onDragStart={(event: KonvaEventObject<DragEvent>) => {
            //     if (!selectModeActive || !layerControls) return;

            //     event.cancelBubble = true;

            //     const activeSelection = pendingSelectionRef.current ?? layerControls.selectedLayerIds;
            //     const selection = activeSelection.includes(layerId) ? activeSelection : [layerId];

            //     const initialPositions = new Map<string, { x: number; y: number }>();
            //     selection.forEach((id: string) => {
            //       const descriptor = layerControls.layers.find((entry: any) => entry.id === id);
            //       if (descriptor) {
            //         initialPositions.set(id, { ...descriptor.position });
            //       }
            //     });

            //     if (!initialPositions.has(layerId)) {
            //       const layerDescriptor = layerControls.layers.find((entry: any) => entry.id === layerId);
            //       if (layerDescriptor) {
            //         initialPositions.set(layerId, { ...layerDescriptor.position });
            //       }
            //     }

            //     selectionDragStateRef.current = {
            //       anchorLayerId: layerId,
            //       initialPositions,
            //     };

            //     updateBoundsFromLayerIds(selection);

            //     const stage = event.target.getStage();
            //     if (stage) {
            //       stage.container().style.cursor = 'grabbing';
            //     }
            //   }}
            //   onDragMove={(event: KonvaEventObject<DragEvent>) => {
            //     if (!selectModeActive || !layerControls) return;

            //     const dragState = selectionDragStateRef.current;
            //     const activeSelection = pendingSelectionRef.current ?? layerControls.selectedLayerIds;

            //     if (!dragState) {
            //       updateBoundsFromLayerIds(activeSelection);
            //       event.target.getStage()?.batchDraw();
            //       return;
            //     }

            //     const anchorInitial = dragState.initialPositions.get(layerId);
            //     if (!anchorInitial) {
            //       return;
            //     }

            //     const currentPosition = event.target.position();
            //     const deltaX = currentPosition.x - anchorInitial.x;
            //     const deltaY = currentPosition.y - anchorInitial.y;

            //     activeSelection.forEach((id: string) => {
            //       if (id === layerId) {
            //         return;
            //       }
            //       const original = dragState.initialPositions.get(id);
            //       const node = layerNodeRefs.current.get(id);
            //       if (!original || !node) {
            //         return;
            //       }
            //       node.position({
            //         x: original.x + deltaX,
            //         y: original.y + deltaY,
            //       });
            //     });

            //     updateBoundsFromLayerIds(activeSelection);
            //     event.target.getStage()?.batchDraw();
            //   }}
            onDragEnd={(event: KonvaEventObject<DragEvent>) => {
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
                    const position = node.position();
                    layerControls.updateLayerPosition(id, {
                        x: position.x - stageViewportOffsetX,
                        y: position.y - stageViewportOffsetY,
                    });
                });

                measureAndStoreBounds(layerRef.current);

                // layerControls.ensureAllVisible();
                // updateBoundsFromLayerIds(layerControls.selectedLayerIds);

                // const stage = event.target.getStage();
                // if (stage) {
                //   stage.container().style.cursor = 'pointer';
                // }
                // event.target.getStage()?.batchDraw();
            }}
        >
            {children}
        </KonvaLayer>
    );
};
