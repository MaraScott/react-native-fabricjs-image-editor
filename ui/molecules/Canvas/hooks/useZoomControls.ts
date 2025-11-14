import { useCallback, useState, useLayoutEffect } from 'react';

// Constants from SimpleCanvas
const MIN_ZOOM = -100;
const MAX_ZOOM = 200;
const MIN_EFFECTIVE_SCALE = 0.05;

const clampZoomValue = (value: number): number => {
  /**
   * max - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} MIN_ZOOM - Parameter derived from the static analyzer.
   * @param {*} Math.min(MAX_ZOOM - Parameter derived from the static analyzer.
   * @param {*} value - Parameter derived from the static analyzer.
   */
  /**
 * UseZoomControlsProps Interface
 * 
 * Type definition for UseZoomControlsProps.
 */
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
};

/**
 * UseZoomControlsProps interface - Auto-generated interface summary; customize as needed.
 */
/**
 * UseZoomControlsProps interface - Generated documentation block.
 */
interface UseZoomControlsProps {
  width: number;
  height: number;
  initialZoom?: number;
  containerRef: React.RefObject<HTMLDivElement>;
  onZoomChange?: (zoom: number) => void;
}

/**
 * UseZoomControlsResult interface - Auto-generated interface summary; customize as needed.
 */
/**
 * UseZoomControlsResult interface - Generated documentation block.
 */
interface UseZoomControlsResult {
  scale: number;
  internalZoom: number;
  updateZoom: (updater: (previousZoom: number) => number, options?: { threshold?: number }) => void;
  applyZoomDelta: (delta: number, threshold?: number) => void;
}

export const useZoomControls = ({
  width,
  height,
  initialZoom = 0,
  containerRef,
  onZoomChange,
}: UseZoomControlsProps): UseZoomControlsResult => {
  /**
   * useState - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {1} Refer to the implementation for the precise returned value.
   */
  /**
   * useState - Auto-generated documentation stub.
   *
   * @returns {1} Result produced by useState.
   */
  const [scale, setScale] = useState(1);
  const [internalZoom, setInternalZoom] = useState<number>(initialZoom);

  const updateZoom = useCallback(
    (
      updater: (previousZoom: number) => number,
      options?: { threshold?: number }
    ) => {
      const threshold = options?.threshold ?? 0;

      /**
       * setInternalZoom - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * setInternalZoom - Auto-generated documentation stub.
       */
      setInternalZoom((previousZoom) => {
        /**
         * clampZoomValue - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * clampZoomValue - Auto-generated documentation stub.
         */
        const nextZoom = clampZoomValue(updater(previousZoom));

        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * if - Auto-generated documentation stub.
         */
        if (threshold > 0 && Math.abs(nextZoom - previousZoom) < threshold) {
          return previousZoom;
        }

        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        if (nextZoom !== previousZoom) {
          /**
           * if - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {onZoomChange} Refer to the implementation for the precise returned value.
           */
          if (onZoomChange) {
            /**
             * onZoomChange - Auto-generated summary; refine if additional context is needed.
             *
             * @returns {nextZoom} Refer to the implementation for the precise returned value.
             */
            /**
             * onZoomChange - Auto-generated documentation stub.
             *
             * @returns {nextZoom} Result produced by onZoomChange.
             */
            onZoomChange(nextZoom);
          }
          return nextZoom;
        }

        return previousZoom;
      });
    },
    [onZoomChange]
  );

  const applyZoomDelta = useCallback(
    (delta: number, threshold?: number) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!delta} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {!delta} Result produced by if.
       */
      if (!delta) return;

      /**
       * updateZoom - Auto-generated summary; refine if additional context is needed.
       */
      updateZoom((previousZoom) => previousZoom + delta, {
        threshold,
      });
    },
    [updateZoom]
  );

  /**
   * useLayoutEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useLayoutEffect - Auto-generated documentation stub.
   */
  useLayoutEffect(() => {
    /**
     * updateScale - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * updateScale - Auto-generated documentation stub.
     */
    const updateScale = () => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!containerRef.current} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {!containerRef.current} Result produced by if.
       */
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (containerWidth === 0 || containerHeight === 0) {
        return;
      }

      // Calculate fit-to-container scale
      const scaleX = containerWidth / width;
      const scaleY = containerHeight / height;
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
      // zoom = 0 means use fitScale
      /**
       * in - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {increase scale} Refer to the implementation for the precise returned value.
       */
      /**
       * in - Auto-generated documentation stub.
       *
       * @returns {increase scale} Result produced by in.
       */
      // zoom > 0 means zoom in (increase scale)
      /**
       * out - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {decrease scale} Refer to the implementation for the precise returned value.
       */
      // zoom < 0 means zoom out (decrease scale)
      const zoomFactor = 1 + internalZoom / 100;
      /**
       * max - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} fitScale * zoomFactor - Parameter derived from the static analyzer.
       * @param {*} MIN_EFFECTIVE_SCALE - Parameter derived from the static analyzer.
       *
       * @returns {fitScale * zoomFactor, MIN_EFFECTIVE_SCALE} Refer to the implementation for the precise returned value.
       */
      /**
       * max - Auto-generated documentation stub.
       *
       * @param {*} fitScale * zoomFactor - Parameter forwarded to max.
       * @param {*} MIN_EFFECTIVE_SCALE - Parameter forwarded to max.
       *
       * @returns {fitScale * zoomFactor, MIN_EFFECTIVE_SCALE} Result produced by max.
       */
      const finalScale = Math.max(fitScale * zoomFactor, MIN_EFFECTIVE_SCALE);

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (Number.isFinite(finalScale)) {
        /**
         * setScale - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {finalScale} Refer to the implementation for the precise returned value.
         */
        setScale(finalScale);
      }
    };

    /**
     * updateScale - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * updateScale - Auto-generated documentation stub.
     */
    updateScale();

    // Update on resize events
    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'resize' - Parameter derived from the static analyzer.
     * @param {*} updateScale - Parameter derived from the static analyzer.
     *
     * @returns {'resize', updateScale} Refer to the implementation for the precise returned value.
     */
    window.addEventListener('resize', updateScale);

    let resizeObserver: ResizeObserver | undefined;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      /**
       * ResizeObserver - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * ResizeObserver - Auto-generated documentation stub.
       */
      resizeObserver = new ResizeObserver(() => updateScale());
      /**
       * observe - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {containerRef.current} Refer to the implementation for the precise returned value.
       */
      /**
       * observe - Auto-generated documentation stub.
       *
       * @returns {containerRef.current} Result produced by observe.
       */
      resizeObserver.observe(containerRef.current);
    }

    /**
     * return - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * return - Auto-generated documentation stub.
     */
    return () => {
      /**
       * removeEventListener - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'resize' - Parameter derived from the static analyzer.
       * @param {*} updateScale - Parameter derived from the static analyzer.
       *
       * @returns {'resize', updateScale} Refer to the implementation for the precise returned value.
       */
      /**
       * removeEventListener - Auto-generated documentation stub.
       *
       * @param {*} 'resize' - Parameter forwarded to removeEventListener.
       * @param {*} updateScale - Parameter forwarded to removeEventListener.
       *
       * @returns {'resize', updateScale} Result produced by removeEventListener.
       */
      window.removeEventListener('resize', updateScale);
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {resizeObserver} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {resizeObserver} Result produced by if.
       */
      if (resizeObserver) {
        /**
         * disconnect - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * disconnect - Auto-generated documentation stub.
         */
        resizeObserver.disconnect();
      }
    };
  }, [width, height, internalZoom, containerRef]);

  return {
    scale,
    internalZoom,
    updateZoom,
    applyZoomDelta,
  };
};