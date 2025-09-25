import { useEffect, type RefObject } from 'react';
import type { Vector2d } from '../../types/konva';

export interface BaseNodeProps<T> {
  shape: T;
  isSelected: boolean;
  selectionEnabled: boolean;
  onSelect: () => void;
  onChange: (attributes: Partial<T>) => void;
  dragBoundFunc?: (position: Vector2d) => Vector2d;
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
