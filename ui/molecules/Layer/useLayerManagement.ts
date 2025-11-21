/**
 * Layer Panel Hook - useLayerManagement
 * 
 * Custom hook for managing layer state and operations
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { LayerDescriptor, LayerControlHandlers, LayerMoveDirection, ScaleVector, PanOffset } from '@molecules/Layer/Layer.types';
import type { Bounds } from '@molecules/Canvas/types/canvas.types';
import { areBoundsEqual } from '@molecules/Canvas/utils/bounds';
import type { CanvasLayerDefinition } from './types';
import { generateLayerId, normaliseLayerDefinitions, areSelectionsEqual } from './utils';

/**
 * Hook parameters for useLayerManagement
 */
export interface UseLayerManagementParams {
  /**
   * Initial layer definitions
   */
  initialLayers?: CanvasLayerDefinition[];
}

/**
 * Hook return value for useLayerManagement
 */
export interface UseLayerManagementReturn {
  /**
   * Array of layer descriptors
   */
  layers: LayerDescriptor[];
  /**
   * Array of selected layer IDs
   */
  selectedLayerIds: string[];
  /**
   * Primary layer ID (first in selection)
   */
  primaryLayerId: string | null;
  /**
   * Layers revision number - increments when layers change
   */
  layersRevision: number;
  /**
   * Map of layer IDs to their indices
   */
  layerIndexMap: Map<string, number>;
  /**
   * Select a layer with options
   */
  selectLayer: LayerControlHandlers['selectLayer'];
  /**
   * Clear layer selection
   */
  clearSelection: () => void;
  /**
   * Add a new layer
   */
  addLayer: () => void;
  /**
   * Remove a layer by ID
   */
  removeLayer: (layerId: string) => void;
  /**
   * Duplicate a layer by ID
   */
  duplicateLayer: (layerId: string) => void;
  /**
   * Copy a layer by ID
   */
  copyLayer: (layerId: string) => Promise<string | void> | string | void;
  /**
   * Move a layer up or down
   */
  moveLayer: (layerId: string, direction: LayerMoveDirection) => void;
  /**
   * Toggle layer visibility
   */
  toggleVisibility: (layerId: string) => void;
  /**
   * Reorder a layer
   */
  reorderLayer: (sourceId: string, targetId: string, position: 'above' | 'below') => void;
  /**
   * Ensure all layers are visible
   */
  ensureAllVisible: () => void;
  /**
   * Update layer position
   */
  updateLayerPosition: (layerId: string, position: { x: number; y: number }) => void;
  /**
   * Update layer rotation
   */
  updateLayerRotation: (layerId: string, rotation: number) => void;
  /**
   * Update layer scale
   */
  updateLayerScale: (layerId: string, scale: ScaleVector) => void;
  /**
   * Update layer transform
   */
  updateLayerTransform: (
    layerId: string,
    transform: {
      position: PanOffset;
      scale: ScaleVector;
      rotation: number;
    }
  ) => void;
}

/**
 * Custom hook for managing canvas layers
 * 
 * Provides state management and handlers for layer operations including
 * selection, reordering, duplication, and transformation
 * 
 * @param {UseLayerManagementParams} params - Hook parameters
 * @returns {UseLayerManagementReturn} Layer state and control handlers
 */
export const useLayerManagement = (params: UseLayerManagementParams = {}): UseLayerManagementReturn => {
  const { initialLayers } = params;

  // Normalize initial layers
  const initialLayerState = useMemo(() => {
    if (!initialLayers || initialLayers.length === 0) {
      return [];
    }
    return normaliseLayerDefinitions(initialLayers);
  }, [initialLayers]);

  // Revision counter for layer changes
  const [layersRevision, setLayersRevision] = useState(0);

  const bumpLayersRevision = useCallback(() => {
    setLayersRevision((previous) => previous + 1);
  }, []);

  // Layer state
  const [layers, setLayers] = useState<LayerDescriptor[]>(() => {
    if (initialLayerState.length > 0) {
      return initialLayerState;
    }

    return [
      {
        id: generateLayerId(),
        name: 'Layer 1',
        visible: true,
        position: { x: 0, y: 0 },
        rotation: 0,
        scale: { x: 1, y: 1 },
        render: () => null,
      },
    ];
  });

  // Selection state
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(() => {
    const firstLayer = initialLayerState[0];
    return firstLayer ? [firstLayer.id] : [];
  });

  const [primaryLayerId, setPrimaryLayerId] = useState<string | null>(() => {
    const firstLayer = initialLayerState[0];
    return firstLayer?.id ?? null;
  });

  // Layer index map for efficient lookups
  const layerIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    layers.forEach((layer, index) => {
      map.set(layer.id, index);
    });
    return map;
  }, [layers]);

  // Ensure at least one layer exists
  useEffect(() => {
    if (layers.length === 0) {
      let seedLayers: LayerDescriptor[] = [];
      if (initialLayerState.length > 0) {
        seedLayers = initialLayerState;
      } else {
        seedLayers = [{
          id: generateLayerId(),
          name: 'Layer 1',
          visible: true,
          position: { x: 0, y: 0 },
          rotation: 0,
          scale: { x: 1, y: 1 },
          render: () => null,
        }];
      }
      const first = seedLayers[0];
      setLayers(seedLayers);
      setSelectedLayerIds(first ? [first.id] : []);
      setPrimaryLayerId(first ? first.id : null);
    }
  }, [layers.length, initialLayerState]);

  const updateLayerById = useCallback((layerId: string, transformer: (layer: LayerDescriptor) => LayerDescriptor) => {
    let changed = false;
    setLayers((previousLayers) => {
      let localChange = false;
      const nextLayers = previousLayers.map((layer) => {
        if (layer.id !== layerId) {
          return layer;
        }
        const updatedLayer = transformer(layer);
        if (updatedLayer !== layer) {
          localChange = true;
        }
        return updatedLayer;
      });
      if (!localChange) {
        return previousLayers;
      }
      changed = true;
      return nextLayers;
    });
    return changed;
  }, [primaryLayerId, selectedLayerIds]);

  const mapAllLayers = useCallback((transformer: (layer: LayerDescriptor) => LayerDescriptor) => {
    let changed = false;
    setLayers((previousLayers) => {
      let localChange = false;
      const nextLayers = previousLayers.map((layer) => {
        const updatedLayer = transformer(layer);
        if (updatedLayer !== layer) {
          localChange = true;
        }
        return updatedLayer;
      });
      if (!localChange) {
        return previousLayers;
      }
      changed = true;
      return nextLayers;
    });
    return changed;
  }, [primaryLayerId, selectedLayerIds]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedLayerIds([]);
    setPrimaryLayerId(null);
  }, []);

  // Select layer with various modes
  const selectLayer = useCallback<LayerControlHandlers['selectLayer']>((layerId, options) => {
    const mode = options?.mode ?? 'replace';

    if (!layerIndexMap.has(layerId)) {
      return selectedLayerIds;
    }

    const uniqueAndSorted = (ids: string[]): string[] => {
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

    const currentSelection = selectedLayerIds.filter((id) => layerIndexMap.has(id));
    const isSelected = currentSelection.includes(layerId);
    let nextSelection: string[] = [];

    switch (mode) {
      case 'append': {
        nextSelection = isSelected
          ? currentSelection
          : uniqueAndSorted([...currentSelection, layerId]);
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
      setSelectedLayerIds(nextSelection);
      setPrimaryLayerId(nextSelection[0] ?? null);
    }

    return nextSelection;
  }, [layerIndexMap, layers, selectedLayerIds]);

  // Add new layer
  const addLayer = useCallback(() => {
    const newLayer: LayerDescriptor = {
      id: generateLayerId(),
      name: `Layer ${layers.length + 1}`,
      visible: true,
      position: { x: 0, y: 0 },
      rotation: 0,
      scale: { x: 1, y: 1 },
      render: () => null,
    };

    setLayers((previous) => [...previous, newLayer]);
    setSelectedLayerIds([newLayer.id]);
    setPrimaryLayerId(newLayer.id);
    bumpLayersRevision();
  }, [layers.length, bumpLayersRevision]);

  // Remove layer
  const removeLayer = useCallback<LayerControlHandlers['removeLayer']>((layerId) => {
    setLayers((previousLayers) => {
      if (previousLayers.length === 1) {
        return previousLayers;
      }

      const nextLayers = previousLayers.filter((layer) => layer.id !== layerId);

      if (nextLayers.length === 0) {
        return previousLayers;
      }

      return nextLayers;
    });

    setSelectedLayerIds((previousSelection) => {
      const filtered = previousSelection.filter((id) => id !== layerId);

      if (filtered.length === 0 && layers.length > 1) {
        const fallbackLayer = layers.find((layer) => layer.id !== layerId);
        return fallbackLayer ? [fallbackLayer.id] : [];
      }

      return filtered;
    });

    setPrimaryLayerId((currentPrimary) => {
      if (!currentPrimary || currentPrimary !== layerId) {
        return currentPrimary;
      }

      const fallbackLayer = layers.find((layer) => layer.id !== layerId);
      return fallbackLayer?.id ?? null;
    });

    bumpLayersRevision();
  }, [layers, bumpLayersRevision]);

  // Duplicate layer
  const duplicateLayer = useCallback<LayerControlHandlers['duplicateLayer']>((layerId) => {
    let newLayerId: string | null = null;

    setLayers((previousLayers) => {
      const index = previousLayers.findIndex((layer) => layer.id === layerId);
      if (index === -1) {
        return previousLayers;
      }

      const source = previousLayers[index];
      const id = generateLayerId();
      newLayerId = id;

      const clone: LayerDescriptor = {
        ...source,
        id,
        name: `${source.name} Copy`,
      };

      const nextLayers = [...previousLayers];
      nextLayers.splice(index, 0, clone);
      return nextLayers;
    });

    if (newLayerId) {
      setSelectedLayerIds([newLayerId]);
      setPrimaryLayerId(newLayerId);
    }

    bumpLayersRevision();
  }, [bumpLayersRevision]);

  // Copy layer (placeholder implementation)
  const copyLayer = useCallback<LayerControlHandlers['copyLayer']>((layerId) => {
    // Placeholder - actual implementation depends on clipboard API
    return layerId;
  }, []);

  // Move layer within stack
  const moveLayer = useCallback<LayerControlHandlers['moveLayer']>((layerId, direction) => {
    let didMove = false;

    setLayers((previousLayers) => {
        
      const currentIndex = previousLayers.findIndex((layer) => layer.id === layerId);

      if (currentIndex === -1 || previousLayers.length < 2) {
        return previousLayers;
      }

      const isAtTop = currentIndex === previousLayers.length - 1;
      const isAtBottom = currentIndex === 0;

      if (
        (direction === 'up' && isAtTop) ||
        (direction === 'top' && isAtTop) ||
        (direction === 'down' && isAtBottom) ||
        (direction === 'bottom' && isAtBottom)
      ) {
        return previousLayers;
      }

      const nextLayers = [...previousLayers];
      const [moved] = nextLayers.splice(currentIndex, 1);

      let insertIndex = currentIndex;
      switch (direction) {
        case 'up':
          insertIndex = Math.min(currentIndex + 1, nextLayers.length);
          break;
        case 'down':
          insertIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'top':
          insertIndex = nextLayers.length;
          break;
        case 'bottom':
          insertIndex = 0;
          break;
        default: {
          const fallbackIndex = Math.min(currentIndex, nextLayers.length);
          nextLayers.splice(fallbackIndex, 0, moved);
          return nextLayers;
        }
      }

      nextLayers.splice(insertIndex, 0, moved);
      didMove = true;
      return nextLayers;
    });

    if (didMove) {
      setSelectedLayerIds([layerId]);
      setPrimaryLayerId(layerId);
      bumpLayersRevision();
    }
  }, [bumpLayersRevision]);

  // Toggle layer visibility
  const toggleVisibility = useCallback<LayerControlHandlers['toggleVisibility']>((layerId) => {
    if (updateLayerById(layerId, (layer) => ({ ...layer, visible: !layer.visible }))) {
      bumpLayersRevision();
    }
  }, [updateLayerById, bumpLayersRevision]);

  // Reorder layer
  const reorderLayer = useCallback<LayerControlHandlers['reorderLayer']>((sourceId, targetId, position) => {
    setLayers((previousLayers) => {
      const sourceIndex = previousLayers.findIndex((layer) => layer.id === sourceId);
      const targetIndex = previousLayers.findIndex((layer) => layer.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
        return previousLayers;
      }

      const nextLayers = [...previousLayers];
      const [movedLayer] = nextLayers.splice(sourceIndex, 1);

      const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      const insertIndex = position === 'above' ? adjustedTargetIndex + 1  : adjustedTargetIndex;

      nextLayers.splice(insertIndex, 0, movedLayer);

      return nextLayers;
    });

    bumpLayersRevision();
  }, [bumpLayersRevision]);

  // Ensure all layers are visible
  const ensureAllVisible = useCallback(() => {
    if (mapAllLayers((layer) => (layer.visible ? layer : { ...layer, visible: true }))) {
      bumpLayersRevision();
    }
  }, [mapAllLayers, bumpLayersRevision]);

  // Update layer position
  const updateLayerPosition = useCallback<LayerControlHandlers['updateLayerPosition']>((layerId, position) => {
    if (updateLayerById(layerId, (layer) => ({ ...layer, position }))) {
      bumpLayersRevision();
    }
  }, [updateLayerById, bumpLayersRevision]);

  // Update layer rotation
  const updateLayerRotation = useCallback<NonNullable<LayerControlHandlers['updateLayerRotation']>>((layerId, rotation) => {
    if (updateLayerById(layerId, (layer) => ({ ...layer, rotation }))) {
      bumpLayersRevision();
    }
  }, [updateLayerById, bumpLayersRevision]);

  // Update layer scale
  const updateLayerScale = useCallback<NonNullable<LayerControlHandlers['updateLayerScale']>>((layerId, scale) => {
    if (updateLayerById(layerId, (layer) => ({ ...layer, scale }))) {
      bumpLayersRevision();
    }
  }, [updateLayerById, bumpLayersRevision]);

  // Update layer transform (position, rotation, scale)
  const updateLayerTransform = useCallback<NonNullable<LayerControlHandlers['updateLayerTransform']>>((layerId, transform) => {
    if (updateLayerById(layerId, (layer) => ({
      ...layer,
      position: transform.position,
      rotation: transform.rotation,
      scale: transform.scale,
    }))) {
      bumpLayersRevision();
    }
  }, [updateLayerById, bumpLayersRevision]);

  const updateLayerBounds = useCallback<NonNullable<LayerControlHandlers['updateLayerBounds']>>((layerId, bounds) => {
    setLayers((previousLayers) => {
      let changed = false;
      const nextLayers = previousLayers.map((layer) => {
        if (layer.id !== layerId) {
          return layer;
        }

        const currentBounds = layer.bounds ?? null;
        if (areBoundsEqual(currentBounds, bounds)) {
          return layer;
        }

        changed = true;
        return {
          ...layer,
          bounds: bounds ? { ...bounds } : null,
        };
      });

      return changed ? nextLayers : previousLayers;
    });
  }, []);

  return {
    layers,
    selectedLayerIds,
    primaryLayerId,
    layersRevision,
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
    ensureAllVisible,
    updateLayerPosition,
    updateLayerRotation,
    updateLayerScale,
    updateLayerTransform,
    updateLayerBounds,
  };
};
