import type { ReactNode, CSSProperties } from 'react';
import type Konva from 'konva';

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
 * ScaleVector Type
 * 
 * Type definition for ScaleVector.
 */
export type ScaleVector = { 
  x: number; 
  y: number;
};

/**
 * PointerPanState Type
 * 
 * Type definition for PointerPanState.
 */
export type PointerPanState = {
  pointerId: number;
  start: { x: number; y: number };
  origin: PanOffset;
};

/**
 * TouchPanState Type
 * 
 * Type definition for TouchPanState.
 */
export type TouchPanState = {
  center: { x: number; y: number };
  origin: PanOffset;
  touchCount: number;
};

/**
 * SelectionDragState Type
 * 
 * Type definition for SelectionDragState.
 */
export type SelectionDragState = {
  anchorLayerId: string;
  initialPositions: Map<string, PanOffset>;
};

/**
 * SelectionNodeSnapshot Type
 * 
 * Type definition for SelectionNodeSnapshot.
 */
export type SelectionNodeSnapshot = {
  id: string;
  node: Konva.Layer;
  transform: Konva.Transform;
};

/**
 * SelectionTransformSnapshot Type
 * 
 * Type definition for SelectionTransformSnapshot.
 */
export type SelectionTransformSnapshot = {
  proxyTransform: Konva.Transform;
  nodes: SelectionNodeSnapshot[];
};

/**
 * LayerMoveDirection Type
 * 
 * Type definition for LayerMoveDirection.
 */
export type LayerMoveDirection = 'up' | 'down' | 'top' | 'bottom';

/**
 * LayerSelectionMode Type
 * 
 * Type definition for LayerSelectionMode.
 */
export type LayerSelectionMode = 'replace' | 'append' | 'toggle' | 'range';

/**
 * LayerSelectionOptions interface - Auto-generated interface summary; customize as needed.
 */
/**
 * LayerSelectionOptions interface - Generated documentation block.
 */
/**
 * LayerSelectionOptions Interface
 * 
 * Type definition for LayerSelectionOptions.
 */
export interface LayerSelectionOptions {
  mode?: LayerSelectionMode;
}

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
 * LayerControlHandlers interface - Auto-generated interface summary; customize as needed.
 */
export interface LayerControlHandlers {
  layers: LayerDescriptor[];
  selectedLayerIds: string[];
  primaryLayerId: string | null;
  selectLayer: (layerId: string, options?: LayerSelectionOptions) => string[];
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

/**
 * Bounds interface - Auto-generated interface summary; customize as needed.
 */
/**
 * Bounds interface - Generated documentation block.
 */
/**
 * Bounds Interface
 * 
 * Type definition for Bounds.
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * SimpleCanvasProps interface - Auto-generated interface summary; customize as needed.
 */
/**
 * SimpleCanvasProps interface - Generated documentation block.
 */
export interface SimpleCanvasProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  containerBackground?: string;
  zoom?: number;
  children?: ReactNode;
  onStageReady?: (stage: Konva.Stage) => void;
  onZoomChange?: (zoom: number) => void;
  panModeActive?: boolean;
  layerControls?: LayerControlHandlers;
  layersRevision?: number;
  selectModeActive?: boolean;
}