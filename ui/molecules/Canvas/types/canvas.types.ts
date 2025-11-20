import type { PanOffset } from "@molecules/Layer/Layer.types"; 

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
