import type { ReactNode } from 'react';

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
  selectLayer: (layerId: string) => string[];
  /**
   * selection - Auto-generated documentation stub.
   *
   * @returns {deselect all} Result produced by selection.
   */
  /** Clear any selection (deselect all) */
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
}

