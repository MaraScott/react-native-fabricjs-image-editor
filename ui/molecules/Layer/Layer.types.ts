import type { ReactNode } from 'react';
import type { Bounds } from '@molecules/Canvas/types/canvas.types';

export interface LayerStroke {
  id: string;
  points: number[];
  color: string;
  size: number;
  hardness: number;
  opacity: number;
  mode?: 'draw' | 'erase';
}

/**
 * ScaleVector Type
 *
 * Type definition for ScaleVector.
 */
export type ScaleVector = {
  x: number;
  y: number;
};

/**
 * Common render and transform fields shared by input definitions and runtime descriptors.
 */
export interface LayerRenderable {
  name: string;
  render: () => ReactNode;
  visible?: boolean;
  position?: { x: number; y: number };
  rotation?: number;
  scale?: ScaleVector;
  opacity?: number;
  strokes?: LayerStroke[];
}

/**
 * Input-facing layer definition used when seeding the canvas.
 */
export interface InitialLayerDefinition extends LayerRenderable {
  id?: string;
}

/**
 * LayerDescriptor interface - Auto-generated interface summary; customize as needed.
 */
export interface LayerDescriptor extends LayerRenderable {
  id: string;
  visible: boolean;
  position: { x: number; y: number };
  rotation?: number;
  scale?: ScaleVector;
  opacity?: number;
  strokes?: LayerStroke[];
  bounds?: Bounds | null;
}


/**
 * LayerMoveDirection Type
 * 
 * Type definition for LayerMoveDirection.
 */
export type LayerMoveDirection = 'up' | 'down' | 'top' | 'bottom';

/**
 * PanOffset Type
 * 
 * Type definition for PanOffset.
 */
export type PanOffset = { 
  x: number; 
  y: number; 
};

/**
 * LayerControlHandlers interface - Auto-generated interface summary; customize as needed.
 */
export interface LayerControlHandlers {
  layers: LayerDescriptor[];
  selectedLayerIds: string[];
  primaryLayerId: string | null;
  layersRevision: number;
  selectLayer: (layerId: string, options?: { mode?: 'append' | 'toggle' |'exclusive' | 'replace' }) => string[];
  clearSelection?: () => void;
  addLayer: () => void;
  removeLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  copyLayer: (layerId: string) => Promise<string | void> | string | void;
  moveLayer: (layerId: string, direction: LayerMoveDirection) => void;
  toggleVisibility: (layerId: string) => void;
  reorderLayer: (sourceId: string, targetId: string, position: 'above' | 'below') => void;
  ensureAllVisible: () => void;
  updateLayerPosition: (layerId: string, position: { x: number; y: number }) => void;
  updateLayerScale?: (layerId: string, scale: ScaleVector) => void;
  updateLayerRotation?: (layerId: string, rotation: number) => void;
  updateLayerTransform?: (
    layerId: string,
    transform: {
      position: PanOffset;
      scale: ScaleVector;
      rotation: number;
    }
  ) => void;
  updateLayerOpacity?: (layerId: string, opacity: number) => void;
  updateLayerOpacityLive?: (layerId: string, opacity: number) => void;
  updateLayerOpacityCommit?: (layerId: string, opacity: number) => void;
  updateLayerBounds?: (layerId: string, bounds: Bounds | null) => void;
  updateLayerStrokes?: (layerId: string, strokes: LayerStroke[]) => void;
  addImageLayer?: (src: string) => void;
  rasterizeLayer?: (layerId: string) => void;
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}
