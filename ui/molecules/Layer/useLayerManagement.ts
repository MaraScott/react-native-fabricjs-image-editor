/**
 * Layer Panel Hook - useLayerManagement
 *
 * Centralized layer state with history backed by LayersHistory store.
 */

import React, { useMemo, useCallback, useEffect } from 'react';
import { Image as KonvaImage } from 'react-konva';
import type { LayerDescriptor, LayerControlHandlers, LayerMoveDirection, ScaleVector, PanOffset, InitialLayerDefinition, LayerTextInput, LayerTextItem } from '@molecules/Layer/Layer.types';
import type { Bounds } from '@molecules/Canvas/types/canvas.types';
import { areBoundsEqual } from '@molecules/Canvas/utils/bounds';
import { generateLayerId, normaliseLayerDefinitions, areSelectionsEqual } from './utils';
import {
    initLayersHistory,
    applyLayersSnapshot,
    previewLayersSnapshot,
    commitPreviewLayersSnapshot,
    undoLayers,
    redoLayers,
    useLayersHistory,
} from '@store/LayersHistory';

export interface UseLayerManagementParams {
    initialLayers?: InitialLayerDefinition[];
    stageWidth?: number;
    stageHeight?: number;
}

export interface UseLayerManagementReturn {
    layers: LayerDescriptor[];
    selectedLayerIds: string[];
    primaryLayerId: string | null;
    layersRevision: number;
    addImageLayer?: (src: string) => void;
    addTextLayer?: (text: LayerTextInput) => { layerId: string; textId: string } | void;
    layerIndexMap: Map<string, number>;
    selectLayer: LayerControlHandlers['selectLayer'];
    clearSelection: () => void;
    addLayer: () => void;
    removeLayer: (layerId: string) => void;
    duplicateLayer: (layerId: string) => void;
    copyLayer: (layerId: string) => Promise<string | void> | string | void;
    moveLayer: (layerId: string, direction: LayerMoveDirection) => void;
    toggleVisibility: (layerId: string) => void;
    reorderLayer: (sourceId: string, targetId: string, position: 'above' | 'below') => void;
    updateLayerPosition: (layerId: string, position: { x: number; y: number }) => void;
    updateLayerRotation: (layerId: string, rotation: number) => void;
    updateLayerScale: (layerId: string, scale: ScaleVector) => void;
    updateLayerTransform: (
        layerId: string,
        transform: {
            position: PanOffset;
            scale: ScaleVector;
            rotation: number;
        }
    ) => void;
    updateLayerBounds: (layerId: string, bounds: Bounds | null) => void;
    updateLayerOpacityLive?: (layerId: string, opacity: number) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export const useLayerManagement = (params: UseLayerManagementParams = {}): UseLayerManagementReturn => {
    const { initialLayers, stageWidth = 1024, stageHeight = 1024 } = params;

    const initialLayerState = useMemo(() => normaliseLayerDefinitions(initialLayers ?? []), [initialLayers]);

    const initialSnapshot = useMemo(() => {
        const seedLayers: LayerDescriptor[] =
            initialLayerState.length > 0
                ? initialLayerState
                : [
                    {
                        id: generateLayerId(),
                        name: 'Layer 1',
                        visible: true,
                        position: { x: 0, y: 0 },
                        rotation: 0,
                        scale: { x: 1, y: 1 },
                        opacity: 1,
                        strokes: [],
                        texts: [],
                        render: () => null,
                    },
                ];
        const first = seedLayers[0];
        return {
            layers: seedLayers,
            selectedLayerIds: first ? [first.id] : [],
            primaryLayerId: first ? first.id : null,
            revision: 0,
        };
    }, [initialLayerState]);

    const historyState = useLayersHistory((state) => state);
    const present = historyState?.present ?? initialSnapshot;

    // Ensure history is initialized once
    useEffect(() => {
        if (!historyState) {
            initLayersHistory(initialSnapshot);
        }
    }, [historyState, initialSnapshot]);

    const apply = useCallback(
        (snapshot: typeof present) => {
            applyLayersSnapshot(snapshot);
        },
        [],
    );

    const applyLayers = useCallback(
        (nextLayers: LayerDescriptor[], nextSelected: string[] = present.selectedLayerIds, nextPrimary: string | null = nextSelected[0] ?? null) => {
            apply({
                layers: nextLayers,
                selectedLayerIds: nextSelected,
                primaryLayerId: nextPrimary,
                revision: present.revision + 1,
            });
        },
        [apply, present.revision, present.selectedLayerIds],
    );

    const previewLayers = useCallback(
        (nextLayers: LayerDescriptor[], nextSelected: string[] = present.selectedLayerIds, nextPrimary: string | null = nextSelected[0] ?? null) => {
            previewLayersSnapshot({
                layers: nextLayers,
                selectedLayerIds: nextSelected,
                primaryLayerId: nextPrimary,
                revision: present.revision,
            });
        },
        [present.revision, present.selectedLayerIds]
    );

    const commitPreviewLayers = useCallback(
        (nextLayers: LayerDescriptor[], nextSelected: string[] = present.selectedLayerIds, nextPrimary: string | null = nextSelected[0] ?? null) => {
            commitPreviewLayersSnapshot({
                layers: nextLayers,
                selectedLayerIds: nextSelected,
                primaryLayerId: nextPrimary,
                revision: present.revision,
            });
        },
        [present.revision, present.selectedLayerIds]
    );

    const layerIndexMap = useMemo(() => {
        const map = new Map<string, number>();
        present.layers.forEach((layer, index) => map.set(layer.id, index));
        return map;
    }, [present.layers]);

    const selectLayer: LayerControlHandlers['selectLayer'] = useCallback(
        (layerId, options) => {
            const mode = options?.mode ?? 'replace';
            if (!layerIndexMap.has(layerId)) {
                return present.selectedLayerIds;
            }
            const uniqueAndSorted = (ids: string[]) => {
                const seen = new Set<string>();
                const filtered: string[] = [];
                ids.forEach((id) => {
                    if (layerIndexMap.has(id) && !seen.has(id)) {
                        seen.add(id);
                        filtered.push(id);
                    }
                });
                filtered.sort((a, b) => (layerIndexMap.get(a) ?? 0) - (layerIndexMap.get(b) ?? 0));
                return filtered;
            };

            const currentSelection = present.selectedLayerIds.filter((id) => layerIndexMap.has(id));
            const isSelected = currentSelection.includes(layerId);
            let nextSelection: string[] = [];

            switch (mode) {
                case 'append': {
                    nextSelection = isSelected ? currentSelection : uniqueAndSorted([...currentSelection, layerId]);
                    break;
                }
                case 'toggle': {
                    nextSelection = isSelected
                        ? currentSelection.filter((id) => id !== layerId)
                        : uniqueAndSorted([...currentSelection, layerId]);
                    break;
                }
                case 'exclusive': {
                    nextSelection = isSelected ? [] : [layerId];
                    break;
                }
                case 'replace':
                default: {
                    nextSelection = [layerId];
                    break;
                }
            }

            if (!areSelectionsEqual(currentSelection, nextSelection)) {
                applyLayers(present.layers, nextSelection, nextSelection[0] ?? null);
            }

            return nextSelection;
        },
        [applyLayers, layerIndexMap, present.layers, present.selectedLayerIds],
    );

    const clearSelection = useCallback(() => {
        applyLayers(present.layers, [], null);
    }, [applyLayers, present.layers]);

    const getInsertIndexAboveSelection = useCallback(() => {
        if (present.selectedLayerIds.length === 0) {
            return present.layers.length;
        }
        const selectedIndexes = present.selectedLayerIds
            .map((id) => layerIndexMap.get(id))
            .filter((index): index is number => typeof index === 'number');
        if (selectedIndexes.length === 0) {
            return present.layers.length;
        }
        return Math.min(present.layers.length, Math.max(...selectedIndexes) + 1);
    }, [layerIndexMap, present.layers, present.selectedLayerIds]);

    const addLayer = useCallback(() => {
        const newLayer: LayerDescriptor = {
            id: generateLayerId(),
            name: `Layer ${present.layers.length + 1}`,
            visible: true,
            position: { x: 0, y: 0 },
            rotation: 0,
            scale: { x: 1, y: 1 },
            opacity: 1,
            strokes: [],
            texts: [],
            render: () => null,
        };
        const insertIndex = getInsertIndexAboveSelection();
        const nextLayers = [...present.layers];
        nextLayers.splice(insertIndex, 0, newLayer);
        applyLayers(nextLayers, [newLayer.id], newLayer.id);
    }, [applyLayers, getInsertIndexAboveSelection, present.layers]);

    const removeLayer = useCallback<LayerControlHandlers['removeLayer']>((layerId) => {
        if (present.layers.length <= 1) {
            return;
        }
        const nextLayers = present.layers.filter((layer) => layer.id !== layerId);
        if (nextLayers.length === present.layers.length) {
            return;
        }
        const nextSelection = present.selectedLayerIds.filter((id) => id !== layerId);
        const nextPrimary = nextSelection[0] ?? (nextLayers[0]?.id ?? null);
        applyLayers(nextLayers, nextSelection, nextPrimary);
    }, [applyLayers, present.layers, present.selectedLayerIds]);

    const duplicateLayer = useCallback<LayerControlHandlers['duplicateLayer']>((layerId) => {
        const layer = present.layers.find((l) => l.id === layerId);
        if (!layer) return;
        const newLayer: LayerDescriptor = {
            ...layer,
            id: generateLayerId(),
            name: `${layer.name} Copy`,
            position: { ...layer.position },
            rotation: layer.rotation,
            scale: layer.scale ? { ...layer.scale } : { x: 1, y: 1 },
            opacity: layer.opacity ?? 1,
            strokes: layer.strokes ? layer.strokes.map((stroke) => ({ ...stroke, points: [...stroke.points] })) : [],
            texts: layer.texts ? layer.texts.map((text) => ({ ...text })) : [],
        };
        const layerIndex = present.layers.findIndex((l) => l.id === layerId);
        const nextLayers = [...present.layers];
        nextLayers.splice(layerIndex + 1, 0, newLayer);
        applyLayers(nextLayers, [newLayer.id], newLayer.id);
    }, [applyLayers, present.layers]);

    const copyLayer = useCallback<LayerControlHandlers['copyLayer']>(async (layerId) => layerId, []);

    const moveLayer = useCallback<LayerControlHandlers['moveLayer']>((layerId, direction) => {
        const index = present.layers.findIndex((layer) => layer.id === layerId);
        if (index === -1) return;

        let targetIndex = index;
        switch (direction) {
            case 'up': // move visually up/front: higher index
                targetIndex = Math.min(present.layers.length - 1, index + 1);
                break;
            case 'down': // move visually down/back: lower index
                targetIndex = Math.max(0, index - 1);
                break;
            case 'top':
                targetIndex = present.layers.length - 1;
                break;
            case 'bottom':
                targetIndex = 0;
                break;
            default:
                return;
        }

        if (targetIndex === index) return;

        const nextLayers = [...present.layers];
        const [moved] = nextLayers.splice(index, 1);
        nextLayers.splice(targetIndex, 0, moved);
        applyLayers(nextLayers, present.selectedLayerIds, present.primaryLayerId);

        if (typeof window !== 'undefined') {
            const orderedIds = nextLayers.map((layer) => layer.id);
            try {
                window.dispatchEvent(
                    new CustomEvent('layer-move-refresh', { detail: { layerIds: orderedIds } })
                );
            } catch {
                window.dispatchEvent(new Event('layer-move-refresh'));
            }
        }
    }, [applyLayers, present.layers, present.primaryLayerId, present.selectedLayerIds]);

    const toggleVisibility = useCallback<LayerControlHandlers['toggleVisibility']>((layerId) => {
        applyLayers(
            present.layers.map((layer) => (layer.id === layerId ? { ...layer, visible: !layer.visible } : layer)),
            present.selectedLayerIds,
            present.primaryLayerId,
        );
    }, [applyLayers, present.layers, present.primaryLayerId, present.selectedLayerIds]);

    const reorderLayer = useCallback<LayerControlHandlers['reorderLayer']>((sourceId, targetId, position) => {
        if (sourceId === targetId) return;
        const sourceIndex = present.layers.findIndex((layer) => layer.id === sourceId);
        const targetIndex = present.layers.findIndex((layer) => layer.id === targetId);
        if (sourceIndex === -1 || targetIndex === -1) return;

        const nextLayers = [...present.layers];
        const [movedLayer] = nextLayers.splice(sourceIndex, 1);

        const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
        const insertIndex = position === 'above' ? adjustedTargetIndex + 1 : adjustedTargetIndex;

        nextLayers.splice(insertIndex, 0, movedLayer);
        applyLayers(nextLayers, present.selectedLayerIds, present.primaryLayerId);
    }, [applyLayers, present.layers, present.primaryLayerId, present.selectedLayerIds]);

    const updateLayerPosition = useCallback<LayerControlHandlers['updateLayerPosition']>((layerId, position) => {
        applyLayers(
            present.layers.map((layer) => (layer.id === layerId ? { ...layer, position } : layer)),
            present.selectedLayerIds,
            present.primaryLayerId,
        );
    }, [applyLayers, present.layers, present.primaryLayerId, present.selectedLayerIds]);

    const updateLayerRotation = useCallback<NonNullable<LayerControlHandlers['updateLayerRotation']>>((layerId, rotation) => {
        applyLayers(
            present.layers.map((layer) => (layer.id === layerId ? { ...layer, rotation } : layer)),
            present.selectedLayerIds,
            present.primaryLayerId,
        );
    }, [applyLayers, present.layers, present.primaryLayerId, present.selectedLayerIds]);

    const updateLayerScale = useCallback<NonNullable<LayerControlHandlers['updateLayerScale']>>((layerId, scale) => {
        applyLayers(
            present.layers.map((layer) => (layer.id === layerId ? { ...layer, scale } : layer)),
            present.selectedLayerIds,
            present.primaryLayerId,
        );
    }, [applyLayers, present.layers, present.primaryLayerId, present.selectedLayerIds]);

    const updateLayerTransform = useCallback<NonNullable<LayerControlHandlers['updateLayerTransform']>>((layerId, transform) => {
        applyLayers(
            present.layers.map((layer) =>
                layer.id === layerId
                    ? {
                        ...layer,
                        position: transform.position,
                        rotation: transform.rotation,
                        scale: transform.scale,
                        opacity: layer.opacity ?? 1,
                    }
                    : layer
            ),
            present.selectedLayerIds,
            present.primaryLayerId,
        );
    }, [applyLayers, present.layers, present.primaryLayerId, present.selectedLayerIds]);

    const updateLayerBounds = useCallback<NonNullable<LayerControlHandlers['updateLayerBounds']>>((layerId, bounds) => {
        applyLayers(
            present.layers.map((layer) => {
                if (layer.id !== layerId) return layer;
                const currentBounds = layer.bounds ?? null;
                if (areBoundsEqual(currentBounds, bounds)) {
                    return layer;
                }
                return {
                    ...layer,
                    bounds: bounds ? { ...bounds } : null,
                };
            }),
            present.selectedLayerIds,
            present.primaryLayerId,
        );
    }, [applyLayers, present.layers, present.primaryLayerId, present.selectedLayerIds]);

    const updateLayerOpacity = useCallback<NonNullable<LayerControlHandlers['updateLayerOpacity']>>((layerId, opacity) => {
        const clamped = Math.max(0, Math.min(1, opacity));
        applyLayers(
            present.layers.map((layer) =>
                layer.id === layerId ? { ...layer, opacity: clamped } : layer
            ),
            present.selectedLayerIds,
            present.primaryLayerId,
        );
    }, [applyLayers, present.layers, present.primaryLayerId, present.selectedLayerIds]);

    const updateLayerOpacityLive = useCallback<NonNullable<LayerControlHandlers['updateLayerOpacityLive']>>((layerId, opacity) => {
        const clamped = Math.max(0, Math.min(1, opacity));
        previewLayers(
            present.layers.map((layer) =>
                layer.id === layerId ? { ...layer, opacity: clamped } : layer
            ),
            present.selectedLayerIds,
            present.primaryLayerId,
        );
    }, [previewLayers, present.layers, present.primaryLayerId, present.selectedLayerIds]);

    const updateLayerOpacityCommit = useCallback<NonNullable<LayerControlHandlers['updateLayerOpacityCommit']>>((layerId, opacity) => {
        const clamped = Math.max(0, Math.min(1, opacity));
        commitPreviewLayers(
            present.layers.map((layer) =>
                layer.id === layerId ? { ...layer, opacity: clamped } : layer
            ),
            present.selectedLayerIds,
            present.primaryLayerId,
        );
    }, [commitPreviewLayers, present.layers, present.primaryLayerId, present.selectedLayerIds]);

    const updateLayerStrokes = useCallback<NonNullable<LayerControlHandlers['updateLayerStrokes']>>((layerId, strokes) => {
        applyLayers(
            present.layers.map((layer) =>
                layer.id === layerId ? { ...layer, strokes: strokes.map((stroke) => ({ ...stroke, points: [...stroke.points] })) } : layer
            ),
            present.selectedLayerIds,
            present.primaryLayerId,
        );
    }, [applyLayers, present.layers, present.primaryLayerId, present.selectedLayerIds]);

    const addTextLayer = useCallback<NonNullable<LayerControlHandlers['addTextLayer']>>((textInput) => {
        const textId = textInput.id ?? generateLayerId();
        const newLayerId = generateLayerId();
        const textItem: LayerTextItem = {
            id: textId,
            text: textInput.text ?? '',
            x: textInput.x ?? 0,
            y: textInput.y ?? 0,
            fontSize: textInput.fontSize ?? 32,
            fontFamily: textInput.fontFamily ?? 'Arial, sans-serif',
            fontStyle: textInput.fontStyle ?? 'normal',
            fontWeight: textInput.fontWeight ?? 'normal',
            fill: textInput.fill ?? '#000000',
        };
        const newLayer: LayerDescriptor = {
            id: newLayerId,
            name: `Text ${present.layers.length + 1}`,
            visible: true,
            position: { x: 0, y: 0 },
            rotation: 0,
            scale: { x: 1, y: 1 },
            opacity: 1,
            strokes: [],
            texts: [textItem],
            render: () => null,
        };
        const insertIndex = getInsertIndexAboveSelection();
        const nextLayers = [...present.layers];
        nextLayers.splice(insertIndex, 0, newLayer);
        applyLayers(nextLayers, [newLayerId], newLayerId);
        return { layerId: newLayerId, textId };
    }, [applyLayers, getInsertIndexAboveSelection, present.layers]);

    const updateLayerTexts = useCallback<NonNullable<LayerControlHandlers['updateLayerTexts']>>((layerId, texts) => {
        applyLayers(
            present.layers.map((layer) =>
                layer.id === layerId ? { ...layer, texts: texts.map((text) => ({ ...text })) } : layer
            ),
            present.selectedLayerIds,
            present.primaryLayerId,
        );
    }, [applyLayers, present.layers, present.primaryLayerId, present.selectedLayerIds]);

    const addTextToLayer = useCallback<NonNullable<LayerControlHandlers['addTextToLayer']>>((layerId, textInput) => {
        const targetIndex = present.layers.findIndex((layer) => layer.id === layerId);
        if (targetIndex === -1) return;

        const layer = present.layers[targetIndex];
        const textId = textInput.id ?? generateLayerId();
        const nextText: LayerTextItem = {
            id: textId,
            text: textInput.text ?? 'New text',
            x: textInput.x ?? 0,
            y: textInput.y ?? 0,
            fontSize: textInput.fontSize ?? 32,
            fontFamily: textInput.fontFamily ?? 'Arial, sans-serif',
            fontStyle: textInput.fontStyle ?? 'normal',
            fontWeight: textInput.fontWeight ?? 'normal',
            fill: textInput.fill ?? '#000000',
        };

        const nextTexts = [...(layer.texts ?? []), nextText];
        const nextLayers = [...present.layers];
        nextLayers[targetIndex] = {
            ...layer,
            texts: nextTexts,
        };

        applyLayers(nextLayers, present.selectedLayerIds, present.primaryLayerId);
    }, [applyLayers, present.layers, present.primaryLayerId, present.selectedLayerIds]);

    const rasterizeLayer = useCallback((layerId: string, dataUrl?: string) => {
        if (!dataUrl) return;
        const target = present.layers.find((layer) => layer.id === layerId);
        if (!target) return;
        if (typeof window === 'undefined') return;

        const img = new window.Image();
        img.onload = () => {
            const imageNode = React.createElement(KonvaImage, {
                image: img,
                listening: true,
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height,
                x: 0,
                y: 0,
            });

            const nextLayers = present.layers.map((layer) =>
                layer.id === layerId
                    ? {
                        ...layer,
                        render: () => imageNode,
                        strokes: [],
                        texts: [],
                    }
                    : layer
            );

            applyLayers(nextLayers, present.selectedLayerIds, present.primaryLayerId);
        };
        img.src = dataUrl;
    }, [applyLayers, present.layers, present.primaryLayerId, present.selectedLayerIds]);

    const addImageLayer = useCallback<NonNullable<LayerControlHandlers['addImageLayer']>>((src) => {
        if (typeof window === 'undefined') {
            return;
        }

        const img = new window.Image();
        img.onload = () => {
            const naturalWidth = img.naturalWidth || img.width || 1;
            const naturalHeight = img.naturalHeight || img.height || 1;

            const fitScale = Math.min(1, Math.min(stageWidth / naturalWidth, stageHeight / naturalHeight));
            const fitWidth = naturalWidth * fitScale;
            const fitHeight = naturalHeight * fitScale;

            const offsetX = (stageWidth - fitWidth) / 2;
            const offsetY = (stageHeight - fitHeight) / 2;

            const newLayerId = generateLayerId();
            const imageNode = React.createElement(KonvaImage, {
                image: img,
                listening: true,
                width: fitWidth,
                height: fitHeight,
                x: offsetX,
                y: offsetY,
            });

            const imageLayer: LayerDescriptor = {
                id: newLayerId,
                name: `Image ${present.layers.length + 1}`,
                visible: true,
                position: { x: 0, y: 0 },
                rotation: 0,
                scale: { x: 1, y: 1 },
                opacity: 1,
                strokes: [],
                texts: [],
                render: () => imageNode,
            };

            // Insert above the currently selected layer; if none are selected, place it on top.
            const insertIndex = getInsertIndexAboveSelection();

            const nextLayers = [...present.layers];
            nextLayers.splice(insertIndex, 0, imageLayer);

            applyLayers(nextLayers, [newLayerId], newLayerId);
        };
        img.src = src;
    }, [applyLayers, getInsertIndexAboveSelection, present.layers, stageHeight, stageWidth]);

    const undo = useCallback(() => {
        undoLayers();
    }, []);

    const redo = useCallback(() => {
        redoLayers();
    }, []);

    return {
        layers: present.layers,
        selectedLayerIds: present.selectedLayerIds,
        primaryLayerId: present.primaryLayerId,
        layersRevision: present.revision,
        addImageLayer,
        layerIndexMap,
        selectLayer,
        clearSelection,
        addLayer,
        removeLayer,
        duplicateLayer,
        copyLayer,
        moveLayer,
        toggleVisibility,
        reorderLayer,
        updateLayerPosition,
        updateLayerRotation,
        updateLayerScale,
        updateLayerTransform,
        updateLayerOpacity,
        updateLayerOpacityLive,
        updateLayerOpacityCommit,
        updateLayerStrokes,
        updateLayerTexts,
        addTextLayer,
        addTextToLayer,
        rasterizeLayer,
        updateLayerBounds,
        undo,
        redo,
        canUndo: (historyState?.history.length ?? 0) > 0,
        canRedo: (historyState?.future.length ?? 0) > 0,
    };
};
