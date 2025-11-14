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