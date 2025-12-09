import type Konva from 'konva';
import type { Bounds } from '../types/canvas.types';

/**
 * isFinite - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {value} Refer to the implementation for the precise returned value.
 */
/**
 * normaliseBounds Component
 * 
 * Renders the normaliseBounds component.
 */

/**
 * isFiniteNumber
 * 
 * Function to check if a value is a finite number.
 * 
 * @param {number} value - The value to check
 * @returns {boolean} True if the value is finite
 */
/**
 * isFiniteNumber
 * 
 * Function to is finite number.
 */
/**
 * isFiniteNumber
 * 
 * Function to is finite number.
 */
export const isFiniteNumber = (value: number): boolean => Number.isFinite(value);

export const normaliseBounds = (rect: Bounds | null | undefined): Bounds | null => {
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {!rect} Refer to the implementation for the precise returned value.
   */
  /**
   * if - Auto-generated documentation stub.
   *
   * @returns {!rect} Result produced by if.
   */
  if (!rect) {
    return null;
  }

  const { x, y, width, height } = rect;

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} ![x - Parameter derived from the static analyzer.
   * @param {*} y - Parameter derived from the static analyzer.
   * @param {*} width - Parameter derived from the static analyzer.
   * @param {*} height].every(isFiniteNumber - Parameter derived from the static analyzer.
   */
  /**
   * if - Auto-generated documentation stub.
   *
   * @param {*} ![x - Parameter forwarded to if.
   * @param {*} y - Parameter forwarded to if.
   * @param {*} width - Parameter forwarded to if.
   * @param {*} height].every(isFiniteNumber - Parameter forwarded to if.
   */
  if (![x, y, width, height].every(isFiniteNumber)) {
    return null;
  }

  return {
    x,
    y,
    /**
     * max - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 0 - Parameter derived from the static analyzer.
     * @param {*} width - Parameter derived from the static analyzer.
     *
     * @returns {0, width} Refer to the implementation for the precise returned value.
     */
    /**
     * max - Auto-generated documentation stub.
     *
     * @param {*} 0 - Parameter forwarded to max.
     * @param {*} width - Parameter forwarded to max.
     *
     * @returns {0, width} Result produced by max.
     */
    width: Math.max(0, width),
    /**
     * max - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 0 - Parameter derived from the static analyzer.
     * @param {*} height - Parameter derived from the static analyzer.
     *
     * @returns {0, height} Refer to the implementation for the precise returned value.
     */
    /**
 * computeNodeBounds Component
 * 
 * Renders the computeNodeBounds component.
 */
    height: Math.max(0, height),
  };
};

/**
 * Compute bounds from child elements of a Group/Layer
 * This calculates the tightest bounding box around visible content,
 * excluding empty canvas areas.
 */
const computeChildrenBounds = (node: Konva.Node): Bounds | null => {
  if (!('getChildren' in node)) {
    return null;
  }

  const children = (node as any).getChildren?.();
  if (!children || children.length === 0) {
    return null;
  }

  let minX: number | null = null;
  let minY: number | null = null;
  let maxX: number | null = null;
  let maxY: number | null = null;

  for (const child of children) {
    try {
      const childRect = child.getClientRect({
        skipTransform: false,
        relativeTo: node.getStage() ?? undefined,
      });

      if (
        childRect &&
        Number.isFinite(childRect.x) &&
        Number.isFinite(childRect.y) &&
        Number.isFinite(childRect.width) &&
        Number.isFinite(childRect.height) &&
        childRect.width > 0 &&
        childRect.height > 0
      ) {
        const childMinX = childRect.x;
        const childMinY = childRect.y;
        const childMaxX = childRect.x + childRect.width;
        const childMaxY = childRect.y + childRect.height;

        minX = minX === null ? childMinX : Math.min(minX, childMinX);
        minY = minY === null ? childMinY : Math.min(minY, childMinY);
        maxX = maxX === null ? childMaxX : Math.max(maxX, childMaxX);
        maxY = maxY === null ? childMaxY : Math.max(maxY, childMaxY);
      }
    } catch (e) {
      // Skip children that can't compute bounds
      continue;
    }
  }

  if (minX === null || minY === null || maxX === null || maxY === null) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

/**
 * computeNodeBounds Component
 * 
 * Renders the computeNodeBounds component.
 */
/**
 * computeNodeBounds Component
 * 
 * Renders the computeNodeBounds component.
 */
export const computeNodeBounds = (node: Konva.Node | null): Bounds | null => {
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {!node} Refer to the implementation for the precise returned value.
   */
  /**
   * if - Auto-generated documentation stub.
   *
   * @returns {!node} Result produced by if.
   */
  if (!node) {
    return null;
  }

  // Try to compute bounds from children first (for Groups/Layers)
  // This gives us a tighter bounding box around actual content
  const childrenBounds = computeChildrenBounds(node);
  if (childrenBounds) {
    return childrenBounds;
  }

  // Fallback to the node's own bounds if it has no children or they can't be computed
  const rect = node.getClientRect({
    skipTransform: false,
    /**
     * getStage - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * getStage - Auto-generated documentation stub.
     */
    relativeTo: node.getStage() ?? undefined,
  });

  /**
   * normaliseBounds - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {rect} Refer to the implementation for the precise returned value.
   */
  /**
 * areBoundsEqual Component
 * 
 * Renders the areBoundsEqual component.
 */
  return normaliseBounds(rect);
};

export const areBoundsEqual = (first: Bounds | null, second: Bounds | null): boolean => {
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (first === second) {
    return true;
  }

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {!first || !second} Refer to the implementation for the precise returned value.
   */
  /**
   * if - Auto-generated documentation stub.
   *
   * @returns {!first || !second} Result produced by if.
   */
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