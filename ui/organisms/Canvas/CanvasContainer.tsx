/**
 * Atomic Design - Organism: CanvasContainer
 * Full-featured canvas container with state management, zoom controls, and layer panel
 */

import { useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { SimpleCanvas } from '@molecules/Canvas';
import type { LayerControlHandlers } from '@molecules/Layer/Layer.types';
import { useLayerManagement } from '@molecules/Layer';
import type { CanvasLayerDefinition } from '@molecules/Layer';
import {
  setSimpleCanvasLayerState,
  clearSimpleCanvasLayerControls,
} from '@store/SimpleCanvas';

/**
 * CanvasContainerProps interface - Auto-generated interface summary; customize as needed.
 */
/**
 * CanvasContainerProps interface - Generated documentation block.
 */
export interface CanvasContainerProps { 
  key?: string;
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
  
  // Prepare initial layers, including children as a layer if provided
  const preparedInitialLayers = useMemo<CanvasLayerDefinition[] | undefined>(() => {
    if (initialLayers && initialLayers.length > 0) {
      return initialLayers;
    }
    
    if (children) {
      return [
        {
          name: 'Layer 1',
          position: { x: 0, y: 0 },
          render: () => <>{children}</>,
        },
      ];
    }
    
    return undefined;
  }, [initialLayers, children]);

  // Use layer management hook
  const layerManagement = useLayerManagement({
    initialLayers: preparedInitialLayers,
  });

  // Destructure everything from layer management
  const {
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
  } = layerManagement;

  // Create layerControls object for SimpleCanvas
  const layerControls = useMemo<LayerControlHandlers>(() => ({
    layers,
    selectedLayerIds,
    primaryLayerId,
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
    updateLayerScale,
    updateLayerRotation,
    updateLayerTransform,
  }), [
    layers,
    selectedLayerIds,
    primaryLayerId,
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
    updateLayerScale,
    updateLayerRotation,
    updateLayerTransform,
  ]);

  useEffect(() => {
    setSimpleCanvasLayerState(layerControls, layers);
  }, [layerControls, layers]);

  useEffect(() => {
    return () => {
      clearSimpleCanvasLayerControls();
    };
  }, []);

  /**
   * handleStageReady - Auto-generated documentation stub.
   */
  const handleStageReady = (stageInstance: Konva.Stage) => {
    setStage(stageInstance);
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
        stageWidth={width}
        stageHeight={height}
        backgroundColor={backgroundColor}
        containerBackground={containerBackground}
        zoom={zoom}
        onStageReady={handleStageReady}
        onZoomChange={onZoomChange}
        panModeActive={panModeActive}
        layersRevision={layersRevision}
        selectModeActive={selectModeActive}
      />
    </div>
  );
};
