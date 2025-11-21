import { Group as KonvaGroup } from '@atoms/Canvas';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { ReactNode, DragEvent } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import type Konva from 'konva';
import { useSimpleCanvasStore } from '@store/SimpleCanvas';
import type { Bounds } from '@molecules/Canvas/types/canvas.types';
import { areBoundsEqual } from '@molecules/Canvas/utils/bounds';

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
    const onPointerDown = (event: KonvaEventObject<PointerEvent>) => {
        console.log('#### StageGroup onPointerDown layerId:', layerId);
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
                const pos = node.position();
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

        const currentPosition = event.target.position();
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
            node.position({
                x: original.x + deltaX,
                y: original.y + deltaY,
            });
        });

        updateBoundsFromLayerIds(activeSelection);
        event.target.getStage()?.batchDraw();
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
            const position = node.position();
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
        <KonvaGroup
            key={`${layersRevision}-${layerId}`}
            ref={handleLayerRef}
            id={id}
            visible={visible}
            x={x}
            y={y}
            rotation={rotation}
            scaleX={scaleX}
            scaleY={scaleY}
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
        </KonvaGroup>
    );
};
