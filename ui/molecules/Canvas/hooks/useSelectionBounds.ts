import { useCallback, useMemo, MutableRefObject } from 'react';
import type Konva from 'konva';
import type { Bounds } from '../types/canvas.types';
import type { LayerControlHandlers } from '@molecules/Layer/Layer.types';
import { computeNodeBounds, areBoundsEqual } from '../utils';

const BOUNDS_RETRY_LIMIT = 4;

interface useSelectionBoundsParams {
    selectModeActive: boolean;
    layerControls: LayerControlHandlers | undefined | null;
    stageRef: MutableRefObject<Konva.Stage | null>;
    layerNodeRefs: MutableRefObject<Map<string, Konva.Node>>;
    pendingSelectionRef: MutableRefObject<string[] | null>;
    transformAnimationFrameRef: MutableRefObject<number | null>;
    setSelectedLayerBounds: (bounds: Bounds | null | ((prev: Bounds | null) => Bounds | null)) => void;
}

interface useSelectionBoundsReturn {
    updateBoundsFromLayerIds: (layerIds: string[] | null | undefined, attempt?: number) => void;
    refreshBoundsFromSelection: () => void;
    scheduleBoundsRefresh: () => void;
    getLayerRotation: (layerId: string | null | undefined) => number | null;
    resolveSelectionRotation: () => number;
}

/**
 * Custom hook for managing selection bounds calculations and updates.
 * Handles computing bounding boxes for selected layers, scheduling updates,
 * and resolving rotation values for single or multiple layer selections.
 */
export const useSelectionBounds = ({
    selectModeActive,
    layerControls,
    stageRef,
    layerNodeRefs,
    pendingSelectionRef,
    transformAnimationFrameRef,
    setSelectedLayerBounds,
}: useSelectionBoundsParams): useSelectionBoundsReturn => {
    const selectedLayerIds = layerControls?.selectedLayerIds ?? [];

    /**
     * Update the selection bounding box from a list of layer IDs.
     * Retries up to BOUNDS_RETRY_LIMIT times if nodes aren't ready yet.
     */
    const updateBoundsFromLayerIds = useCallback(
        (layerIds: string[] | null | undefined, attempt: number = 0) => {
            if (!selectModeActive) {
                setSelectedLayerBounds((previous) => (previous === null ? previous : null));
                return;
            }

            if (!layerIds || layerIds.length === 0) {
                setSelectedLayerBounds((previous) => (previous === null ? previous : null));
                return;
            }

            const stage = stageRef.current;
            const nodes = layerIds
                .map((layerId) => {
                    const cachedNode = layerNodeRefs.current.get(layerId);
                    return cachedNode ?? stage?.findOne(`#layer-${layerId}`) ?? null;
                })
                .filter((node): node is Konva.Node => Boolean(node));

            if (nodes.length !== layerIds.length) {
                if (attempt < BOUNDS_RETRY_LIMIT && typeof window !== 'undefined') {
                    window.requestAnimationFrame(() => updateBoundsFromLayerIds(layerIds, attempt + 1));
                }
                return;
            }

            const boundsList = nodes
                .map((node) => {
                    const bounds = computeNodeBounds(node);
                    return bounds;
                })
                .filter((bounds): bounds is Bounds => Boolean(bounds) && bounds.width > 0 && bounds.height > 0);

            if (boundsList.length === 0) {
                if (attempt < BOUNDS_RETRY_LIMIT && typeof window !== 'undefined') {
                    window.requestAnimationFrame(() => updateBoundsFromLayerIds(layerIds, attempt + 1));
                } else {
                    setSelectedLayerBounds((previous) => (previous === null ? previous : null));
                }
                return;
            }

            const unifiedBounds = boundsList.reduce<Bounds>((accumulator, bounds) => {
                const minX = Math.min(accumulator.x, bounds.x);
                const minY = Math.min(accumulator.y, bounds.y);
                const maxX = Math.max(accumulator.x + accumulator.width, bounds.x + bounds.width);
                const maxY = Math.max(accumulator.y + accumulator.height, bounds.y + bounds.height);

                return {
                    x: minX,
                    y: minY,
                    width: Math.max(0, maxX - minX),
                    height: Math.max(0, maxY - minY),
                };
            }, boundsList[0]);

            setSelectedLayerBounds((previousBounds) => {
                if (areBoundsEqual(previousBounds, unifiedBounds)) {
                    return previousBounds;
                }
                return unifiedBounds;
            });

            nodes[0]?.getStage()?.batchDraw();
        },
        [selectModeActive, stageRef, layerNodeRefs, setSelectedLayerBounds]
    );

    /**
     * Refresh bounds using current or pending selection.
     */

    // Memoize selectedLayerIds to avoid unnecessary re-creation and effect loops
    const stableSelectedLayerIds = useMemo(
        () => layerControls?.selectedLayerIds ?? [],
        [JSON.stringify(layerControls?.selectedLayerIds)]
    );

    const refreshBoundsFromSelection = useCallback(() => {
        const targetIds = pendingSelectionRef.current ?? stableSelectedLayerIds ?? null;
        updateBoundsFromLayerIds(targetIds);
    }, [stableSelectedLayerIds, pendingSelectionRef, updateBoundsFromLayerIds]);

    /**
     * Schedule a bounds refresh on the next animation frame.
     * Prevents multiple redundant updates in a single frame.
     */
    const scheduleBoundsRefresh = useCallback(() => {
        if (!selectModeActive) {
            return;
        }

        if (typeof window === 'undefined') {
            refreshBoundsFromSelection();
            return;
        }

        if (transformAnimationFrameRef.current !== null) {
            return;
        }

        transformAnimationFrameRef.current = window.requestAnimationFrame(() => {
            transformAnimationFrameRef.current = null;
            refreshBoundsFromSelection();
        });
    }, [refreshBoundsFromSelection, selectModeActive, transformAnimationFrameRef]);

    /**
     * Get the rotation value for a specific layer.
     * Tries node first, then falls back to layer descriptor.
     */
    const getLayerRotation = useCallback(
        (layerId: string | null | undefined): number | null => {
            if (!layerId) {
                return null;
            }

            const node = layerNodeRefs.current.get(layerId);
            if (node) {
                const nodeRotation = node.rotation();
                if (Number.isFinite(nodeRotation)) {
                    return nodeRotation;
                }
            }

            if (!layerControls) {
                return null;
            }

            const descriptor = layerControls.layers.find((layer) => layer.id === layerId);
            if (!descriptor) {
                return null;
            }

            const descriptorRotation = descriptor.rotation ?? 0;
            return Number.isFinite(descriptorRotation) ? descriptorRotation : 0;
        },
        [layerControls, layerNodeRefs]
    );

    /**
     * Resolve the rotation for the current selection.
     * For single selection: use that layer's rotation.
     * For multiple: prefer primary layer, fallback to first selected.
     */
    const resolveSelectionRotation = useCallback((): number => {
        if (!layerControls || selectedLayerIds.length === 0) {
            return 0;
        }

        if (selectedLayerIds.length === 1) {
            return getLayerRotation(selectedLayerIds[0]) ?? 0;
        }

        return (
            getLayerRotation(layerControls.primaryLayerId) ??
            getLayerRotation(selectedLayerIds[0]) ??
            0
        );
    }, [getLayerRotation, layerControls, selectedLayerIds]);

    return {
        updateBoundsFromLayerIds,
        refreshBoundsFromSelection,
        scheduleBoundsRefresh,
        getLayerRotation,
        resolveSelectionRotation,
    };
};
