import type { ReactNode } from 'react';
import type { Bounds } from '@molecules/Canvas/types/canvas.types';

export interface LayerStroke {
  id: string;
  points: number[];
  color: string;
  size: number;
  hardness: number;
  opacity: number;
  mode?: 'draw' | 'erase' | 'paint';
  paintShape?: LayerPaintShape;
  layerTransform?: LayerElementTransform;
}

export interface LayerTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontStyle?: 'normal' | 'italic';
  fontWeight?: string;
  fill?: string;
  layerTransform?: LayerElementTransform;
}

export type LayerTextInput = Omit<LayerTextItem, 'id'> & { id?: string };

/**
 * ScaleVector Type
 *
 * Type definition for ScaleVector.
 */
export type ScaleVector = {
  x: number;
  y: number;
};

export interface LayerElementTransform {
  position: { x: number; y: number };
  rotation: number;
  scale: ScaleVector;
}

export interface RasterizeLayerOptions {
  bounds?: Bounds | null;
}

/**
 * Common render and transform fields shared by input definitions and runtime descriptors.
 */
export type LayerShape = RectShape | LayerPaintShape;

export interface RectShape {
  id: string;
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  layerTransform?: LayerElementTransform;
}

export interface LayerPaintShape {
  id: string;
  type: 'paint';
  imageSrc: string;
  bounds: Bounds;
  fill?: string;
  opacity?: number;
  transform?: {
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
  };
  layerTransform?: LayerElementTransform;
}

export interface LayerRenderable {
  name: string;
  render: () => ReactNode;
  visible?: boolean;
  position?: { x: number; y: number };
  rotation?: number;
  scale?: ScaleVector;
  opacity?: number;
  strokes?: LayerStroke[];
  texts?: LayerTextItem[];
  imageSrc?: string;
  bounds?: Bounds | null;
  shapes?: LayerShape[];
  needsRasterization?: boolean;
}

/**
 * Input-facing layer definition used when seeding the canvas.
 */
export interface InitialLayerDefinition extends LayerRenderable {
  id?: string;
  paintShapes?: LayerPaintShape[];
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
  texts?: LayerTextItem[];
  bounds?: Bounds | null;
  needsRasterization: boolean;
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
  updateLayerPosition: (layerId: string, position: { x: number; y: number }) => void;
  updateLayerName?: (layerId: string, name: string) => void;
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
  updateLayerTexts?: (layerId: string, texts: LayerTextItem[]) => void;
  updateLayerRender?: (layerId: string, render: () => ReactNode, extras?: Partial<LayerRenderable>) => void;
  addTextToLayer?: (layerId: string, text: LayerTextInput) => void;
  addImageLayer?: (src: string) => void;
  addTextLayer?: (text: LayerTextInput) => { layerId: string; textId: string } | void;
  rasterizeLayer?: (layerId: string, dataUrl?: string, options?: RasterizeLayerOptions) => void;
  replaceLayers?: (layers: LayerDescriptor[]) => void;
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}
