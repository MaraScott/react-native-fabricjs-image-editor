/**
 * Canvas Utility Functions
 * Helper functions for canvas calculations and transformations
 */

import type Konva from 'konva';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Compute the axis-aligned bounding box of a Konva node
 */
export const computeNodeBounds = (node: Konva.Node): Bounds | null => {
  try {
    /**
     * getClientRect - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * getClientRect - Auto-generated documentation stub.
     */
    const clientRect = node.getClientRect();
    
    if (
      /**
       * isFinite - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {clientRect.width} Refer to the implementation for the precise returned value.
       */
      /**
       * isFinite - Auto-generated documentation stub.
       *
       * @returns {clientRect.width} Result produced by isFinite.
       */
      !Number.isFinite(clientRect.width) ||
      /**
       * isFinite - Auto-generated documentation stub.
       *
       * @returns {clientRect.height} Result produced by isFinite.
       */
      !Number.isFinite(clientRect.height) ||
      clientRect.width <= 0 ||
      clientRect.height <= 0
    ) {
      return null;
    }

    return {
      x: clientRect.x,
      y: clientRect.y,
      width: clientRect.width,
      height: clientRect.height,
    };
  /**
   * catch - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {error} Refer to the implementation for the precise returned value.
   */
  /**
   * catch - Auto-generated documentation stub.
   *
   * @returns {error} Result produced by catch.
   */
  } catch (error) {
    /**
     * warn - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'Failed to compute node bounds - Parameter derived from the static analyzer.
     * @param {*} error - Parameter derived from the static analyzer.
     *
     * @returns {'Failed to compute node bounds:', error} Refer to the implementation for the precise returned value.
     */
    /**
 * areBoundsEqual Component
 * 
 * Renders the areBoundsEqual component.
 */
    console.warn('Failed to compute node bounds:', error);
    return null;
  }
};

/**
 * Check if two bounds objects are equal
 */
export const areBoundsEqual = (
  a: Bounds | null,
  b: Bounds | null
): boolean => {
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  if (a === b) {
    return true;
  }

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {!a || !b} Refer to the implementation for the precise returned value.
   */
  /**
   * if - Auto-generated documentation stub.
   *
   * @returns {!a || !b} Result produced by if.
   */
  if (!a || !b) {
    return false;
  }

  return (
    /**
     * abs - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {a.x - b.x} Refer to the implementation for the precise returned value.
     */
    /**
     * abs - Auto-generated documentation stub.
     *
     * @returns {a.x - b.x} Result produced by abs.
     */
    Math.abs(a.x - b.x) < 0.01 &&
    /**
     * abs - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {a.y - b.y} Refer to the implementation for the precise returned value.
     */
    /**
     * abs - Auto-generated documentation stub.
     *
     * @returns {a.y - b.y} Result produced by abs.
     */
    Math.abs(a.y - b.y) < 0.01 &&
    /**
     * abs - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {a.width - b.width} Refer to the implementation for the precise returned value.
     */
    /**
     * abs - Auto-generated documentation stub.
     *
     * @returns {a.width - b.width} Result produced by abs.
     */
    Math.abs(a.width - b.width) < 0.01 &&
    /**
     * abs - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {a.height - b.height} Refer to the implementation for the precise returned value.
     */
    /**
 * clamp Component
 * 
 * Renders the clamp component.
 */
    Math.abs(a.height - b.height) < 0.01
  );
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  /**
   * max - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} min - Parameter derived from the static analyzer.
   * @param {*} Math.min(max - Parameter derived from the static analyzer.
   * @param {*} value - Parameter derived from the static analyzer.
   */
  /**
 * clampZoomValue Component
 * 
 * Renders the clampZoomValue component.
 */
  return Math.max(min, Math.min(max, value));
};

/**
 * Clamp zoom value within allowed range
 */
export const clampZoomValue = (value: number, min: number = -100, max: number = 200): number => {
  /**
   * clamp - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} value - Parameter derived from the static analyzer.
   * @param {*} min - Parameter derived from the static analyzer.
   * @param {*} max - Parameter derived from the static analyzer.
   *
   * @returns {value, min, max} Refer to the implementation for the precise returned value.
   */
  /**
 * calculateScaleFromZoom Component
 * 
 * Renders the calculateScaleFromZoom component.
 */
  return clamp(value, min, max);
};

/**
 * Calculate scale based on zoom percentage
 * zoom = 0: fit to container
 * zoom > 0: zoom in
 * zoom < 0: zoom out
 */
export const calculateScaleFromZoom = (
  zoom: number,
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  minEffectiveScale: number = 0.05
): number => {
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (containerWidth === 0 || containerHeight === 0) {
    return 1;
  }

  // Calculate fit-to-container scale
  const scaleX = containerWidth / canvasWidth;
  const scaleY = containerHeight / canvasHeight;
  /**
   * min - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} scaleX - Parameter derived from the static analyzer.
   * @param {*} scaleY - Parameter derived from the static analyzer.
   *
   * @returns {scaleX, scaleY} Refer to the implementation for the precise returned value.
   */
  /**
   * min - Auto-generated documentation stub.
   *
   * @param {*} scaleX - Parameter forwarded to min.
   * @param {*} scaleY - Parameter forwarded to min.
   *
   * @returns {scaleX, scaleY} Result produced by min.
   */
  const fitScale = Math.min(scaleX, scaleY);

  // Apply zoom adjustment
  const zoomFactor = 1 + zoom / 100;
  /**
   * max - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} fitScale * zoomFactor - Parameter derived from the static analyzer.
   * @param {*} minEffectiveScale - Parameter derived from the static analyzer.
   *
   * @returns {fitScale * zoomFactor, minEffectiveScale} Refer to the implementation for the precise returned value.
   */
  /**
   * max - Auto-generated documentation stub.
   *
   * @param {*} fitScale * zoomFactor - Parameter forwarded to max.
   * @param {*} minEffectiveScale - Parameter forwarded to max.
   *
   * @returns {fitScale * zoomFactor, minEffectiveScale} Result produced by max.
   */
  const finalScale = Math.max(fitScale * zoomFactor, minEffectiveScale);

  /**
   * isFinite - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {finalScale} Refer to the implementation for the precise returned value.
   */
  /**
 * screenToStageCoordinates Component
 * 
 * Renders the screenToStageCoordinates component.
 */
  return Number.isFinite(finalScale) ? finalScale : 1;
};

/**
 * Convert screen coordinates to stage coordinates
 */
export const screenToStageCoordinates = (
  screenX: number,
  screenY: number,
  scale: number
): { x: number; y: number } => {
  /**
   * max - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} scale - Parameter derived from the static analyzer.
   * @param {*} 0.0001 - Parameter derived from the static analyzer.
   *
   * @returns {scale, 0.0001} Refer to the implementation for the precise returned value.
   */
  /**
 * calculateSelectionCenter Component
 * 
 * Renders the calculateSelectionCenter component.
 */
  const safeScale = Math.max(scale, 0.0001);
  return {
    x: screenX / safeScale,
    y: screenY / safeScale,
  };
};

/**
 * Calculate the center position of a selection box on screen
 */
export const calculateSelectionCenter = (
  bounds: Bounds,
  scale: number,
  panOffset: { x: number; y: number },
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } => {
  // Stage render size in screen pixels
  /**
   * max - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} 1 - Parameter derived from the static analyzer.
   * @param {*} canvasWidth * scale - Parameter derived from the static analyzer.
   *
   * @returns {1, canvasWidth * scale} Refer to the implementation for the precise returned value.
   */
  /**
   * max - Auto-generated documentation stub.
   *
   * @param {*} 1 - Parameter forwarded to max.
   * @param {*} canvasWidth * scale - Parameter forwarded to max.
   *
   * @returns {1, canvasWidth * scale} Result produced by max.
   */
  const renderWidth = Math.max(1, canvasWidth * scale);
  /**
   * max - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} 1 - Parameter derived from the static analyzer.
   * @param {*} canvasHeight * scale - Parameter derived from the static analyzer.
   *
   * @returns {1, canvasHeight * scale} Refer to the implementation for the precise returned value.
   */
  /**
   * max - Auto-generated documentation stub.
   *
   * @param {*} 1 - Parameter forwarded to max.
   * @param {*} canvasHeight * scale - Parameter forwarded to max.
   *
   * @returns {1, canvasHeight * scale} Result produced by max.
   */
  const renderHeight = Math.max(1, canvasHeight * scale);

  /**
   * coordinates - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {centered + pan offset} Refer to the implementation for the precise returned value.
   */
  /**
   * coordinates - Auto-generated documentation stub.
   *
   * @returns {centered + pan offset} Result produced by coordinates.
   */
  // Stage top-left in container coordinates (centered + pan offset)
  const stageLeft = (containerWidth - renderWidth) / 2 + panOffset.x;
  const stageTop = (containerHeight - renderHeight) / 2 + panOffset.y;

  // Selection center in screen coordinates
  const centerX = stageLeft + (bounds.x + bounds.width / 2) * scale;
  const centerY = stageTop + (bounds.y + bounds.height / 2) * scale;

  return { x: centerX, y: centerY };
};
