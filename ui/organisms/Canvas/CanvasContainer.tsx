/**
 * Atomic Design - Organism: CanvasContainer
 * Full-featured canvas container with state management, zoom controls, and layer panel
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { SimpleCanvas } from '@molecules/Canvas';
import type {
  LayerDescriptor,
  LayerControlHandlers
} from '@molecules/Canvas';
import type Konva from 'konva';

export interface CanvasLayerDefinition {
  id?: string;
  name: string;
  visible?: boolean;
  position?: { x: number; y: number };
  render: () => ReactNode;
}

export interface CanvasContainerProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  containerBackground?: string;
  zoom?: number;
  children?: ReactNode;
  onStageReady?: (stage: Konva.Stage) => void;
  onZoomChange?: (zoom: number) => void;
  panModeActive?: boolean;
  initialLayers?: CanvasLayerDefinition[];
  selectModeActive?: boolean;
}

const generateLayerId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `layer-${Math.random().toString(36).slice(2, 11)}`;
};

const normaliseLayerDefinitions = (
  definitions: CanvasLayerDefinition[]
): LayerDescriptor[] => {
  return definitions.map((definition, index) => ({
    id: definition.id ?? generateLayerId(),
    name: definition.name ?? `Layer ${index + 1}`,
    visible: definition.visible ?? true,
    position: definition.position ?? { x: 0, y: 0 },
    render: definition.render,
  }));
};

const areSelectionsEqual = (first: string[], second: string[]): boolean => {
  if (first === second) {
    return true;
  }

  if (first.length !== second.length) {
    return false;
  }

  for (let index = 0; index < first.length; index += 1) {
    if (first[index] !== second[index]) {
      return false;
    }
  }

  return true;
};

/**
 * CanvasContainer Organism - Main canvas component with full functionality
 * Manages canvas state, zoom, and high-level layer operations for the canvas
 */
export const CanvasContainer = ({
  width = 1024,
  height = 1024,
  backgroundColor = '#ffffff',
  containerBackground = '#cccccc',
  zoom = 0,
  children,
  onStageReady,
  onZoomChange,
  panModeActive = false,
  initialLayers,
  selectModeActive = false,
}: CanvasContainerProps) => {
  const [, setStage] = useState<Konva.Stage | null>(null);
  const [layersRevision, setLayersRevision] = useState(0);

  const bumpLayersRevision = useCallback(() => {
    setLayersRevision((previous) => previous + 1);
  }, []);

  const initialLayerState = useMemo<LayerDescriptor[]>(() => {
    if (initialLayers && initialLayers.length > 0) {
      return normaliseLayerDefinitions(initialLayers);
    }

    if (children) {
      return normaliseLayerDefinitions([
        {
          name: 'Layer 1',
          position: { x: 0, y: 0 },
          render: () => <>{children}</>,
        },
      ]);
    }

    return [];
  }, [initialLayers, children]);

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
        render: () => null,
      },
    ];
  });

  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(() => {
    const firstLayer = initialLayerState[0];
    return firstLayer ? [firstLayer.id] : [];
  });
  const [primaryLayerId, setPrimaryLayerId] = useState<string | null>(() => {
    const firstLayer = initialLayerState[0];
    return firstLayer?.id ?? null;
  });

  const layerIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    layers.forEach((layer, index) => {
      map.set(layer.id, index);
    });
    return map;
  }, [layers]);

  useEffect(() => {
    if (layers.length === 0) {
      if (selectedLayerIds.length > 0) {
        setSelectedLayerIds([]);
      }
      if (primaryLayerId !== null) {
        setPrimaryLayerId(null);
      }
      return;
    }

    const validSelected = selectedLayerIds.filter((id) => layerIndexMap.has(id));
    const sortedSelection = validSelected.length > 0
      ? [...validSelected].sort(
        (a, b) => (layerIndexMap.get(a) ?? 0) - (layerIndexMap.get(b) ?? 0)
      )
      : [layers[0].id];

    if (!areSelectionsEqual(selectedLayerIds, sortedSelection)) {
      setSelectedLayerIds(sortedSelection);
    }

    const primaryCandidate = sortedSelection.includes(primaryLayerId ?? '')
      ? (primaryLayerId ?? sortedSelection[sortedSelection.length - 1])
      : sortedSelection[sortedSelection.length - 1];

    if (primaryCandidate !== primaryLayerId) {
      setPrimaryLayerId(primaryCandidate);
    }
  }, [layers, layerIndexMap, primaryLayerId, selectedLayerIds]);

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
        if (isSelected) {
          const remaining = currentSelection.filter((id) => id !== layerId);
          nextSelection = remaining.length > 0 ? remaining : currentSelection;
        } else {
          nextSelection = uniqueAndSorted([...currentSelection, layerId]);
        }
        break;
      }
      case 'range': {
        const anchorId =
          (primaryLayerId && layerIndexMap.has(primaryLayerId))
            ? primaryLayerId
            : currentSelection[currentSelection.length - 1] ?? layerId;
        const anchorIndex = layerIndexMap.get(anchorId) ?? 0;
        const targetIndex = layerIndexMap.get(layerId) ?? anchorIndex;
        const [start, end] =
          anchorIndex <= targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
        const rangeSelection = layers.slice(start, end + 1).map((layer) => layer.id);
        nextSelection = uniqueAndSorted([...currentSelection, ...rangeSelection]);
        break;
      }
      case 'replace':
      default:
        nextSelection = [layerId];
        break;
    }

    if (nextSelection.length === 0) {
      nextSelection = [layerId];
    }

    if (!areSelectionsEqual(selectedLayerIds, nextSelection)) {
      setSelectedLayerIds(nextSelection);
    }

    const nextPrimary =
      mode === 'toggle' && isSelected && nextSelection.length > 0
        ? nextSelection[nextSelection.length - 1]
        : layerId;

    if (nextPrimary !== primaryLayerId) {
      setPrimaryLayerId(nextPrimary);
    }

    return nextSelection;
  }, [layerIndexMap, layers, primaryLayerId, selectedLayerIds]);

  const addLayer = useCallback<LayerControlHandlers['addLayer']>(() => {
    let newLayerId: string | null = null;

    setLayers((previousLayers) => {
      const id = generateLayerId();
      newLayerId = id;

      const nextLayer: LayerDescriptor = {
        id,
        name: `Layer ${previousLayers.length + 1}`,
        visible: true,
        position: { x: 0, y: 0 },
        render: () => null,
      };

      return [nextLayer, ...previousLayers];
    });

    bumpLayersRevision();

    if (newLayerId) {
      setSelectedLayerIds([newLayerId]);
      setPrimaryLayerId(newLayerId);
    }
  }, [bumpLayersRevision]);

  const removeLayer = useCallback<LayerControlHandlers['removeLayer']>((layerId) => {
    let fallbackLayerId: string | null = null;

    setLayers((previousLayers) => {
      if (previousLayers.length <= 1) {
        return previousLayers;
      }

      const index = previousLayers.findIndex((layer) => layer.id === layerId);
      if (index === -1) {
        return previousLayers;
      }

      const updatedLayers = [
        ...previousLayers.slice(0, index),
        ...previousLayers.slice(index + 1),
      ];

      fallbackLayerId = updatedLayers[Math.min(index, updatedLayers.length - 1)]?.id ?? null;

      return updatedLayers;
    });

    setSelectedLayerIds((currentSelection) => {
      if (!currentSelection.includes(layerId)) {
        return currentSelection;
      }

      const filtered = currentSelection.filter((id) => id !== layerId);
      if (filtered.length > 0) {
        return filtered;
      }

      return fallbackLayerId ? [fallbackLayerId] : [];
    });

    setPrimaryLayerId((currentPrimary) => {
      if (currentPrimary === layerId) {
        return fallbackLayerId;
      }
      if (currentPrimary && currentPrimary !== layerId) {
        return currentPrimary;
      }
      return fallbackLayerId;
    });

    bumpLayersRevision();
  }, [bumpLayersRevision]);

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
    bumpLayersRevision();

    if (newLayerId) {
      setSelectedLayerIds([newLayerId]);
      setPrimaryLayerId(newLayerId);
    }
  }, [bumpLayersRevision]);

  const copyLayer = useCallback<LayerControlHandlers['copyLayer']>(async (layerId) => {
    const target = layers.find((layer) => layer.id === layerId);

    if (!target) {
      return 'Layer not found';
    }

    const summary = JSON.stringify(
      {
        name: target.name,
        visible: target.visible,
      },
      null,
      2
    );

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(summary);
        return 'Layer details copied to clipboard';
      } catch (error) {
        console.warn('Failed to copy layer details', error);
        return 'Clipboard copy failed';
      }
    }

    return summary;
  }, [layers]);

  const moveLayer = useCallback<LayerControlHandlers['moveLayer']>((layerId, direction) => {
    setLayers((previousLayers) => {
      const index = previousLayers.findIndex((layer) => layer.id === layerId);
      if (index === -1) {
        return previousLayers;
      }

      let targetIndex = index;

      switch (direction) {
        case 'up':
          targetIndex = Math.max(0, index - 1);
          break;
        case 'down':
          targetIndex = Math.min(previousLayers.length - 1, index + 1);
          break;
        case 'top':
          targetIndex = 0;
          break;
        case 'bottom':
          targetIndex = previousLayers.length - 1;
          break;
        default:
          targetIndex = index;
          break;
      }

      if (targetIndex === index) {
        return previousLayers;
      }

      const updatedLayers = [...previousLayers];
      const [layer] = updatedLayers.splice(index, 1);
      updatedLayers.splice(targetIndex, 0, layer);

      return updatedLayers.map((entry) =>
        entry.visible ? entry : { ...entry, visible: true }
      );
    });
    bumpLayersRevision();
  }, [bumpLayersRevision]);

  const reorderLayer = useCallback<LayerControlHandlers['reorderLayer']>((sourceId, targetId, position) => {
    if (sourceId === targetId) {
      return;
    }

    setLayers((previousLayers) => {
      const sourceIndex = previousLayers.findIndex((layer) => layer.id === sourceId);
      const targetIndex = previousLayers.findIndex((layer) => layer.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return previousLayers;
      }

      const updatedLayers = [...previousLayers];
      const [movedLayer] = updatedLayers.splice(sourceIndex, 1);

      let insertionIndex = targetIndex;

      if (sourceIndex < targetIndex) {
        insertionIndex -= 1;
      }

      if (position === 'below') {
        insertionIndex += 1;
      }

      insertionIndex = Math.max(0, Math.min(updatedLayers.length, insertionIndex));

      updatedLayers.splice(insertionIndex, 0, movedLayer);
      return updatedLayers;
    });
    bumpLayersRevision();
  }, [bumpLayersRevision]);

  const toggleVisibility = useCallback<LayerControlHandlers['toggleVisibility']>((layerId) => {
    setLayers((previousLayers) =>
      previousLayers.map((layer) =>
        layer.id === layerId
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    );
    bumpLayersRevision();
  }, [bumpLayersRevision]);

  const ensureAllVisible = useCallback(() => {
    setLayers((previousLayers) =>
      previousLayers.map((layer) =>
        layer.visible ? layer : { ...layer, visible: true }
      )
    );
    bumpLayersRevision();
  }, [bumpLayersRevision]);

  const updateLayerPosition = useCallback<LayerControlHandlers['updateLayerPosition']>((layerId, position) => {
    setLayers((previousLayers) =>
      previousLayers.map((layer) =>
        layer.id === layerId
          ? { ...layer, position }
          : layer
      )
    );
  }, []);

  const layerControls = useMemo<LayerControlHandlers>(() => ({
    layers,
    selectedLayerIds,
    primaryLayerId,
    selectLayer,
    addLayer,
    removeLayer,
    duplicateLayer,
    copyLayer,
    moveLayer,
    toggleVisibility,
    reorderLayer,
    ensureAllVisible,
    updateLayerPosition,
  }), [
    layers,
    selectedLayerIds,
    primaryLayerId,
    selectLayer,
    addLayer,
    removeLayer,
    duplicateLayer,
    copyLayer,
    moveLayer,
    toggleVisibility,
    reorderLayer,
    ensureAllVisible,
    updateLayerPosition,
  ]);

  const handleStageReady = (stageInstance: Konva.Stage) => {
    setStage(stageInstance);
    console.log('Canvas stage ready:', stageInstance);

    if (onStageReady) {
      onStageReady(stageInstance);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SimpleCanvas
        width={width}
        height={height}
        backgroundColor={backgroundColor}
        containerBackground={containerBackground}
        zoom={zoom}
        onStageReady={handleStageReady}
        onZoomChange={onZoomChange}
        panModeActive={panModeActive}
        layerControls={layerControls}
        layersRevision={layersRevision}
        selectModeActive={selectModeActive}
      />
    </div>
  );
};
