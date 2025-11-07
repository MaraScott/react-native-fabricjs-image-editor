import type Konva from 'konva';
import type { Bounds } from '../types/canvas.types';

export const isFiniteNumber = (value: number): boolean => Number.isFinite(value);

export const normaliseBounds = (rect: Bounds | null | undefined): Bounds | null => {
  if (!rect) {
    return null;
  }

  const { x, y, width, height } = rect;

  if (![x, y, width, height].every(isFiniteNumber)) {
    return null;
  }

  return {
    x,
    y,
    width: Math.max(0, width),
    height: Math.max(0, height),
  };
};

export const computeNodeBounds = (node: Konva.Node | null): Bounds | null => {
  if (!node) {
    return null;
  }

  const rect = node.getClientRect({
    skipTransform: false,
    relativeTo: node.getStage() ?? undefined,
  });

  return normaliseBounds(rect);
};

export const areBoundsEqual = (first: Bounds | null, second: Bounds | null): boolean => {
  if (first === second) {
    return true;
  }

  if (!first || !second) {
    return false;
  }

  return (
    first.x === second.x &&
    first.y === second.y &&
    first.width === second.width &&
    first.height === second.height
  );
};

/**
 * Calculate the unified bounding box that contains all provided bounds
 */
export const unifyBounds = (boundsList: Bounds[]): Bounds | null => {
  if (boundsList.length === 0) {
    return null;
  }

  return boundsList.reduce<Bounds>((accumulator, bounds) => {
    const minX = Math.min(accumulator.x, bounds.x);
    const minY = Math.min(accumulator.y, bounds.y);
    const maxX = Math.max(accumulator.x + accumulator.width, bounds.x + bounds.width);
    const maxY = Math.max(accumulator.y + accumulator.height, bounds.y + bounds.height);

    return {
      x: minX,
      y: minY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY),
    };
  }, boundsList[0]);
};