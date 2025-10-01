import { useEffect, type RefObject } from 'react';
import type { Vector2d } from '../../types/konva';

export interface BaseNodeProps<T> {
  shape: T;
  isSelected: boolean;
  selectionEnabled: boolean;
  onSelect: () => void;
  onChange: (attributes: Partial<T>) => void;
  dragBoundFunc?: (position: Vector2d) => Vector2d;
  zIndex: number;
  rasterize: boolean;
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

type RasterizableNode = {
  cache?: (config?: { pixelRatio?: number }) => unknown;
  clearCache?: () => unknown;
  isCached?: () => boolean;
  getLayer?: () => { batchDraw: () => void } | null;
};

function getDevicePixelRatio() {
  if (typeof window === 'undefined') {
    return 1;
  }
  const ratio = window.devicePixelRatio || 1;
  return Number.isFinite(ratio) ? Math.min(Math.max(ratio, 1), 2) : 1;
}

export function useRasterization<T extends RasterizableNode>(
  enabled: boolean,
  shapeRef: RefObject<T | null>,
  deps: readonly unknown[] = [],
) {
  useEffect(() => {
    const node = shapeRef.current;
    if (!node) return;

    const canCache = typeof node.cache === 'function' && typeof node.clearCache === 'function';
    if (!canCache) {
      return;
    }

    const layer = typeof node.getLayer === 'function' ? node.getLayer() : null;

    if (enabled) {
      try {
        if (typeof node.clearCache === 'function') {
          node.clearCache();
        }
        const pixelRatio = getDevicePixelRatio();
        node.cache?.({ pixelRatio });
        layer?.batchDraw();
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[KonvaNodes] Unable to rasterize node', error);
        }
      }
      return;
    }

    if (typeof node.isCached === 'function' ? node.isCached() : true) {
      node.clearCache?.();
      layer?.batchDraw();
    }
  }, [enabled, shapeRef, ...deps]);
}
