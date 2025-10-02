import { useEffect, type RefObject } from 'react';
import type { KonvaEventObject } from '../../types/konva';
import type { Vector2d } from '../../types/konva';

export interface StageSize {
  width: number;
  height: number;
}

export interface BaseNodeProps<T> {
  shape: T;
  isSelected: boolean;
  selectionEnabled: boolean;
  onSelect: (event: KonvaEventObject<any>) => void;
  onChange: (attributes: Partial<T>) => void;
  dragBoundFunc?: (position: Vector2d) => Vector2d;
  zIndex: number;
  stageSize?: StageSize;
}

export const TRANSFORMER_PROPS = {
  anchorSize: 8,
  borderStroke: '#38bdf8',
  rotateAnchorOffset: 40,
};

export function useAttachTransformer<
  T extends { getLayer?: () => { batchDraw: () => void } | null }
>(
  isSelected: boolean,
  selectionEnabled: boolean,
  shapeRef: RefObject<T>,
  transformerRef: RefObject<any>,
) {
  useEffect(() => {
    if (!selectionEnabled) return;
    const transformer = transformerRef.current;
    const node = shapeRef.current;
    if (!isSelected || !transformer || !node) return;
    transformer.nodes([node]);
    transformer.getLayer()?.batchDraw();
  }, [isSelected, selectionEnabled, shapeRef, transformerRef]);
}

export function shouldListen(draggable: boolean, visible: boolean): boolean {
  return visible || draggable;
}

type ZIndexNode = {
  zIndex: (index: number) => unknown;
  getLayer?: () => { batchDraw: () => void } | null;
};

export function useApplyZIndex<T extends ZIndexNode>(zIndex: number, shapeRef: RefObject<T | null>) {
  useEffect(() => {
    const node = shapeRef.current;
    if (!node) return;
    node.zIndex(zIndex);
    const layer = typeof node.getLayer === 'function' ? node.getLayer() : null;
    layer?.batchDraw();
  }, [zIndex, shapeRef]);
}

type BoundBox = { x: number; y: number; width: number; height: number };

export function clampBoundingBoxToStage(
  box: BoundBox,
  stageSize?: StageSize,
  minWidth = 1,
  minHeight = 1,
): BoundBox {
  if (!stageSize) {
    return box;
  }

  const stageWidth = Number.isFinite(stageSize.width) ? Math.max(0, stageSize.width) : 0;
  const stageHeight = Number.isFinite(stageSize.height) ? Math.max(0, stageSize.height) : 0;

  let width = Number.isFinite(box.width) ? box.width : minWidth;
  let height = Number.isFinite(box.height) ? box.height : minHeight;

  width = Math.max(minWidth, stageWidth > 0 ? Math.min(width, stageWidth) : width);
  height = Math.max(minHeight, stageHeight > 0 ? Math.min(height, stageHeight) : height);

  let x = Number.isFinite(box.x) ? box.x : 0;
  let y = Number.isFinite(box.y) ? box.y : 0;

  if (stageWidth > 0) {
    const maxX = stageWidth - width;
    if (maxX >= 0) {
      x = Math.min(Math.max(0, x), maxX);
    } else {
      x = maxX / 2;
    }
  }

  if (stageHeight > 0) {
    const maxY = stageHeight - height;
    if (maxY >= 0) {
      y = Math.min(Math.max(0, y), maxY);
    } else {
      y = maxY / 2;
    }
  }

  return { x, y, width, height };
}
