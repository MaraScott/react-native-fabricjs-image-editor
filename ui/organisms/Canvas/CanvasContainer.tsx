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

  const [activeLayerId, setActiveLayerId] = useState<string | null>(() => {
    const firstLayer = initialLayerState[0];
    return firstLayer?.id ?? null;
  });

  useEffect(() => {
    if (!activeLayerId && layers.length > 0) {
      setActiveLayerId(layers[0].id);
    }
  }, [activeLayerId, layers]);

  const selectLayer = useCallback<LayerControlHandlers['selectLayer']>((layerId) => {
    setActiveLayerId(layerId);
  }, []);

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
      setActiveLayerId(newLayerId);
    }
  }, [bumpLayersRevision]);

  const removeLayer = useCallback<LayerControlHandlers['removeLayer']>((layerId) => {
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

      setActiveLayerId((current) => {
        if (current === layerId) {
          return updatedLayers[Math.min(index, updatedLayers.length - 1)]?.id ?? null;
        }
        return current;
      });

      return updatedLayers;
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
      setActiveLayerId(newLayerId);
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
    bumpLayersRevision();
  }, [bumpLayersRevision]);

  const layerControls = useMemo<LayerControlHandlers>(() => ({
    layers,
    activeLayerId,
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
    activeLayerId,
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
