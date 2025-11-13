/**
 * Canvas Transform Utilities
 * Functions for handling node transformations
 */

import type Konva from 'konva';

export interface Transform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  skewX?: number;
  skewY?: number;
  offsetX?: number;
  offsetY?: number;
}

/**
 * Apply transform decomposition to a Konva node
 * Note: Uses 'any' to bypass Konva typing issues
 */
export const applyTransformToNode = (
  node: any,
  transform: Partial<Transform>
): void => {
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (transform.x !== undefined && Number.isFinite(transform.x)) {
    node.x(transform.x);
  }

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  if (transform.y !== undefined && Number.isFinite(transform.y)) {
    node.y(transform.y);
  }

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  if (transform.rotation !== undefined && Number.isFinite(transform.rotation)) {
    /**
     * rotation - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {transform.rotation} Refer to the implementation for the precise returned value.
     */
    node.rotation(transform.rotation);
  }

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (transform.scaleX !== undefined && Number.isFinite(transform.scaleX)) {
    /**
     * scaleX - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {transform.scaleX} Refer to the implementation for the precise returned value.
     */
    node.scaleX(transform.scaleX);
  }

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (transform.scaleY !== undefined && Number.isFinite(transform.scaleY)) {
    /**
     * scaleY - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {transform.scaleY} Refer to the implementation for the precise returned value.
     */
    node.scaleY(transform.scaleY);
  }

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (transform.skewX !== undefined && Number.isFinite(transform.skewX)) {
    /**
     * skewX - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {transform.skewX} Refer to the implementation for the precise returned value.
     */
    node.skewX(transform.skewX);
  }

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (transform.skewY !== undefined && Number.isFinite(transform.skewY)) {
    /**
     * skewY - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {transform.skewY} Refer to the implementation for the precise returned value.
     */
    node.skewY(transform.skewY);
  }

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (transform.offsetX !== undefined && Number.isFinite(transform.offsetX)) {
    /**
     * offsetX - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {transform.offsetX} Refer to the implementation for the precise returned value.
     */
    node.offsetX(transform.offsetX);
  }

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (transform.offsetY !== undefined && Number.isFinite(transform.offsetY)) {
    /**
     * offsetY - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {transform.offsetY} Refer to the implementation for the precise returned value.
     */
    node.offsetY(transform.offsetY);
  }
};

/**
 * Get the absolute transform of a node
 */
export const getNodeAbsoluteTransform = (node: any): Konva.Transform => {
  /**
   * getAbsoluteTransform - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * getAbsoluteTransform - Auto-generated documentation stub.
   */
  return node.getAbsoluteTransform().copy();
};

/**
 * Calculate rotation bounding box dimensions
 /**
  * local - Auto-generated documentation stub.
  *
  * @returns {unrotated} Result produced by local.
  */
 * Given a rotated rectangle, calculate the local (unrotated) dimensions
 * that would produce the given axis-aligned bounding box when rotated
 */
export const calculateRotatedDimensions = (
  bboxWidth: number,
  bboxHeight: number,
  rotationDeg: number
): { width: number; height: number } => {
  const rotationRad = (rotationDeg * Math.PI) / 180;
  /**
   * abs - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * abs - Auto-generated documentation stub.
   */
  const a = Math.abs(Math.cos(rotationRad));
  /**
   * abs - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * abs - Auto-generated documentation stub.
   */
  const b = Math.abs(Math.sin(rotationRad));

  const denom = a * a - b * b;

  /**
   * singular - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {around 45deg} Refer to the implementation for the precise returned value.
   */
  /**
   * singular - Auto-generated documentation stub.
   *
   * @returns {around 45deg} Result produced by singular.
   */
  // Near singular (around 45deg) – fall back to a square
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  if (Math.abs(denom) < 1e-6) {
    /**
     * max - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} bboxWidth - Parameter derived from the static analyzer.
     * @param {*} bboxHeight - Parameter derived from the static analyzer.
     *
     * @returns {bboxWidth, bboxHeight} Refer to the implementation for the precise returned value.
     */
    /**
     * max - Auto-generated documentation stub.
     *
     * @param {*} bboxWidth - Parameter forwarded to max.
     * @param {*} bboxHeight - Parameter forwarded to max.
     *
     * @returns {bboxWidth, bboxHeight} Result produced by max.
     */
    const maxSide = Math.max(bboxWidth, bboxHeight);
    return { width: maxSide, height: maxSide };
  }

  let localW = (a * bboxWidth - b * bboxHeight) / denom;
  let localH = (-b * bboxWidth + a * bboxHeight) / denom;

  // Sanity clamps: ensure positive finite sizes
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (!Number.isFinite(localW) || localW <= 0) {
    localW = bboxWidth;
  }
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  if (!Number.isFinite(localH) || localH <= 0) {
    localH = bboxHeight;
  }

  return { width: localW, height: localH };
};
