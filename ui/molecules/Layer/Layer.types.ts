import type { ReactNode } from 'react';
import type { Bounds } from '@molecules/Canvas/types/canvas.types';

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
 * LayerDescriptor interface - Auto-generated interface summary; customize as needed.
 */
export interface LayerDescriptor {
  id: string;
  name: string;
  visible: boolean;
  position: { x: number; y: number };
  /**
   * rotation - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {degrees} Refer to the implementation for the precise returned value.
   */
  /**
   * rotation - Auto-generated documentation stub.
   *
   * @returns {degrees} Result produced by rotation.
   */
  /** Optional persisted rotation (degrees) */
  rotation?: number;
  /** Optional persisted scale */
  scale?: ScaleVector;
  /** Last known bounds of the rendered content */
  bounds?: Bounds | null;
  render: () => ReactNode;
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
  updateLayerBounds?: (layerId: string, bounds: Bounds | null) => void;
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}
