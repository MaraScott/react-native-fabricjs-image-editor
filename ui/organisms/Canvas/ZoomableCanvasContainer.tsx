/**
 * Atomic Design - Organism: ZoomableCanvasContainer
 * Canvas container with mouse wheel, keyboard, and touch zoom support
 */

import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { SimpleCanvas } from '@molecules/Canvas';
import type Konva from 'konva';

export interface ZoomableCanvasContainerProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  containerBackground?: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  wheelZoomStep?: number;
  children?: ReactNode;
  onStageReady?: (stage: Konva.Stage) => void;
  panModeActive?: boolean;
}

/**
 * ZoomableCanvasContainer Organism - Canvas with multiple zoom input methods
 * Supports:
 /**
  * zoom - Auto-generated summary; refine if additional context is needed.
  *
  * @returns {Ctrl/Cmd + wheel} Refer to the implementation for the precise returned value.
  */
 /**
  * zoom - Auto-generated documentation stub.
  *
  * @returns {Ctrl/Cmd + wheel} Result produced by zoom.
  */
 * - Mouse wheel zoom (Ctrl/Cmd + wheel)
 /**
  * zoom - Auto-generated summary; refine if additional context is needed.
  *
  * @returns {+ and - keys} Refer to the implementation for the precise returned value.
  */
 * - Keyboard zoom (+ and - keys)
 /**
  * zoom - Auto-generated summary; refine if additional context is needed.
  *
  * @returns {two-finger gesture on mobile} Refer to the implementation for the precise returned value.
  */
 * - Touch pinch zoom (two-finger gesture on mobile)
 */
export const ZoomableCanvasContainer = ({
  width = 1024,
  height = 1024,
  backgroundColor = '#ffffff',
  containerBackground = '#cccccc',
  zoom,
  onZoomChange,
  minZoom = -100,
  maxZoom = -1 * minZoom,
  zoomStep = 10,
  wheelZoomStep = 5,
  children,
  onStageReady,
  panModeActive = false,
}: ZoomableCanvasContainerProps) => {
  const [stage, setStage] = useState<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number>(0);

  /**
   * handleStageReady - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * handleStageReady - Auto-generated documentation stub.
   */
  const handleStageReady = (stageInstance: Konva.Stage) => {
    /**
     * setStage - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {stageInstance} Refer to the implementation for the precise returned value.
     */
    setStage(stageInstance);
    /**
     * log - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'Canvas stage ready - Parameter derived from the static analyzer.
     * @param {*} stageInstance - Parameter derived from the static analyzer.
     *
     * @returns {'Canvas stage ready:', stageInstance} Refer to the implementation for the precise returned value.
     */
    /**
     * log - Auto-generated documentation stub.
     *
     * @param {*} 'Canvas stage ready - Parameter forwarded to log.
     * @param {*} stageInstance - Parameter forwarded to log.
     *
     * @returns {'Canvas stage ready:', stageInstance} Result produced by log.
     */
    console.log('Canvas stage ready:', stageInstance);

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {onStageReady} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {onStageReady} Result produced by if.
     */
    if (onStageReady) {
      /**
       * onStageReady - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {stageInstance} Refer to the implementation for the precise returned value.
       */
      /**
       * onStageReady - Auto-generated documentation stub.
       *
       * @returns {stageInstance} Result produced by onStageReady.
       */
      onStageReady(stageInstance);
    }
  };

  /**
   * clampZoom - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * clampZoom - Auto-generated documentation stub.
   */
  const clampZoom = (value: number) => {
    /**
     * max - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} minZoom - Parameter derived from the static analyzer.
     * @param {*} Math.min(maxZoom - Parameter derived from the static analyzer.
     * @param {*} value - Parameter derived from the static analyzer.
     */
    /**
     * max - Auto-generated documentation stub.
     *
     * @param {*} minZoom - Parameter forwarded to max.
     * @param {*} Math.min(maxZoom - Parameter forwarded to max.
     * @param {*} value - Parameter forwarded to max.
     */
    return Math.max(minZoom, Math.min(maxZoom, value));
  };

  /**
   * zoom - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {with Ctrl/Cmd key} Refer to the implementation for the precise returned value.
   */
  /**
   * zoom - Auto-generated documentation stub.
   *
   * @returns {with Ctrl/Cmd key} Result produced by zoom.
   */
  // Mouse wheel zoom (with Ctrl/Cmd key)
  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  useEffect(() => {
    const container = containerRef.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!container} Refer to the implementation for the precise returned value.
     */
    if (!container) return;

    /**
     * handleWheel - Auto-generated summary; refine if additional context is needed.
     */
    const handleWheel = (e: WheelEvent) => {
      /**
       * Ctrl - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {Windows/Linux} Refer to the implementation for the precise returned value.
       */
      // Only zoom if Ctrl (Windows/Linux) or Cmd (Mac) key is pressed
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {e.ctrlKey || e.metaKey} Refer to the implementation for the precise returned value.
       */
      if (e.ctrlKey || e.metaKey) {
        /**
         * preventDefault - Auto-generated summary; refine if additional context is needed.
         */
        e.preventDefault();

        // deltaY is positive when scrolling down, negative when scrolling up
        // We want to zoom in when scrolling up, zoom out when scrolling down
        /**
         * sign - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {e.deltaY} Refer to the implementation for the precise returned value.
         */
        /**
         * sign - Auto-generated documentation stub.
         *
         * @returns {e.deltaY} Result produced by sign.
         */
        const delta = -Math.sign(e.deltaY) * wheelZoomStep;
        /**
         * clampZoom - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {zoom + delta} Refer to the implementation for the precise returned value.
         */
        /**
         * clampZoom - Auto-generated documentation stub.
         *
         * @returns {zoom + delta} Result produced by clampZoom.
         */
        const newZoom = clampZoom(zoom + delta);

        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        if (newZoom !== zoom) {
          /**
           * onZoomChange - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {newZoom} Refer to the implementation for the precise returned value.
           */
          onZoomChange(newZoom);
        }
      }
    };

    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'wheel' - Parameter derived from the static analyzer.
     * @param {*} handleWheel - Parameter derived from the static analyzer.
     * @param {*} { passive - Parameter derived from the static analyzer.
     *
     * @returns {'wheel', handleWheel, { passive: false }} Refer to the implementation for the precise returned value.
     */
    container.addEventListener('wheel', handleWheel, { passive: false });
    /**
     * return - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * return - Auto-generated documentation stub.
     */
    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoom, onZoomChange, wheelZoomStep, minZoom, maxZoom]);

  /**
   * zoom - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {+ and - keys} Refer to the implementation for the precise returned value.
   */
  /**
   * zoom - Auto-generated documentation stub.
   *
   * @returns {+ and - keys} Result produced by zoom.
   */
  // Keyboard zoom (+ and - keys)
  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  useEffect(() => {
    /**
     * handleKeyDown - Auto-generated summary; refine if additional context is needed.
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = e.target as HTMLElement;
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      let delta = 0;

      /**
       * key - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {with or without Shift} Refer to the implementation for the precise returned value.
       */
      /**
       * key - Auto-generated documentation stub.
       *
       * @returns {with or without Shift} Result produced by key.
       */
      // Plus/Equals key (with or without Shift)
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      if (e.key === '+' || e.key === '=') {
        /**
         * preventDefault - Auto-generated summary; refine if additional context is needed.
         */
        e.preventDefault();
        delta = zoomStep;
      }
      // Minus key
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      else if (e.key === '-' || e.key === '_') {
        /**
         * preventDefault - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * preventDefault - Auto-generated documentation stub.
         */
        e.preventDefault();
        delta = -zoomStep;
      }
      // Reset with 0 key
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        /**
         * preventDefault - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * preventDefault - Auto-generated documentation stub.
         */
        e.preventDefault();
        /**
         * onZoomChange - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {0} Refer to the implementation for the precise returned value.
         */
        /**
         * onZoomChange - Auto-generated documentation stub.
         *
         * @returns {0} Result produced by onZoomChange.
         */
        onZoomChange(0);
        return;
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (delta !== 0) {
        /**
         * clampZoom - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {zoom + delta} Refer to the implementation for the precise returned value.
         */
        const newZoom = clampZoom(zoom + delta);
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * if - Auto-generated documentation stub.
         */
        if (newZoom !== zoom) {
          /**
           * onZoomChange - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {newZoom} Refer to the implementation for the precise returned value.
           */
          /**
           * onZoomChange - Auto-generated documentation stub.
           *
           * @returns {newZoom} Result produced by onZoomChange.
           */
          onZoomChange(newZoom);
        }
      }
    };

    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'keydown' - Parameter derived from the static analyzer.
     * @param {*} handleKeyDown - Parameter derived from the static analyzer.
     *
     * @returns {'keydown', handleKeyDown} Refer to the implementation for the precise returned value.
     */
    /**
     * addEventListener - Auto-generated documentation stub.
     *
     * @param {*} 'keydown' - Parameter forwarded to addEventListener.
     * @param {*} handleKeyDown - Parameter forwarded to addEventListener.
     *
     * @returns {'keydown', handleKeyDown} Result produced by addEventListener.
     */
    window.addEventListener('keydown', handleKeyDown);
    /**
     * return - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * return - Auto-generated documentation stub.
     */
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom, onZoomChange, zoomStep, minZoom, maxZoom]);

  /**
   * zoom - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {two-finger gesture} Refer to the implementation for the precise returned value.
   */
  /**
   * zoom - Auto-generated documentation stub.
   *
   * @returns {two-finger gesture} Result produced by zoom.
   */
  // Touch pinch zoom (two-finger gesture)
  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  useEffect(() => {
    const container = containerRef.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!container} Refer to the implementation for the precise returned value.
     */
    if (!container) return;

    const getTouchDistance = (touches: TouchList): number => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {touches.length < 2} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {touches.length < 2} Result produced by if.
       */
      if (touches.length < 2) return 0;

      const touch1 = touches[0];
      const touch2 = touches[1];

      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;

      /**
       * sqrt - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {dx * dx + dy * dy} Refer to the implementation for the precise returned value.
       */
      /**
       * sqrt - Auto-generated documentation stub.
       *
       * @returns {dx * dx + dy * dy} Result produced by sqrt.
       */
      return Math.sqrt(dx * dx + dy * dy);
    };

    /**
     * handleTouchStart - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * handleTouchStart - Auto-generated documentation stub.
     */
    const handleTouchStart = (e: TouchEvent) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (e.touches.length === 2) {
        /**
         * preventDefault - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * preventDefault - Auto-generated documentation stub.
         */
        e.preventDefault();
        /**
         * getTouchDistance - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {e.touches} Refer to the implementation for the precise returned value.
         */
        /**
         * getTouchDistance - Auto-generated documentation stub.
         *
         * @returns {e.touches} Result produced by getTouchDistance.
         */
        lastTouchDistance.current = getTouchDistance(e.touches);
      }
    };

    /**
     * handleTouchMove - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * handleTouchMove - Auto-generated documentation stub.
     */
    const handleTouchMove = (e: TouchEvent) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (e.touches.length === 2) {
        /**
         * preventDefault - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * preventDefault - Auto-generated documentation stub.
         */
        e.preventDefault();

        /**
         * getTouchDistance - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {e.touches} Refer to the implementation for the precise returned value.
         */
        const currentDistance = getTouchDistance(e.touches);
        const previousDistance = lastTouchDistance.current;

        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {previousDistance > 0} Refer to the implementation for the precise returned value.
         */
        /**
         * if - Auto-generated documentation stub.
         *
         * @returns {previousDistance > 0} Result produced by if.
         */
        if (previousDistance > 0) {
          // Calculate the scale factor
          const scaleFactor = currentDistance / previousDistance;

          // Convert scale factor to zoom percentage change
          /**
           * out - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {zoom in} Refer to the implementation for the precise returned value.
           */
          /**
           * out - Auto-generated documentation stub.
           *
           * @returns {zoom in} Result produced by out.
           */
          // Scale factor > 1 means pinching out (zoom in)
          /**
           * in - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {zoom out} Refer to the implementation for the precise returned value.
           */
          // Scale factor < 1 means pinching in (zoom out)
          const deltaZoom = (scaleFactor - 1) * 50; // Sensitivity factor

          /**
           * clampZoom - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {zoom + deltaZoom} Refer to the implementation for the precise returned value.
           */
          /**
           * clampZoom - Auto-generated documentation stub.
           *
           * @returns {zoom + deltaZoom} Result produced by clampZoom.
           */
          const newZoom = clampZoom(zoom + deltaZoom);

          /**
           * if - Auto-generated summary; refine if additional context is needed.
           */
          if (Math.abs(newZoom - zoom) > 0.5) { // Threshold to avoid jitter
            /**
             * onZoomChange - Auto-generated summary; refine if additional context is needed.
             */
            /**
             * onZoomChange - Auto-generated documentation stub.
             */
            onZoomChange(Math.round(newZoom));
          }
        }

        lastTouchDistance.current = currentDistance;
      }
    };

    /**
     * handleTouchEnd - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * handleTouchEnd - Auto-generated documentation stub.
     */
    const handleTouchEnd = (e: TouchEvent) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {e.touches.length < 2} Refer to the implementation for the precise returned value.
       */
      if (e.touches.length < 2) {
        lastTouchDistance.current = 0;
      }
    };

    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'touchstart' - Parameter derived from the static analyzer.
     * @param {*} handleTouchStart - Parameter derived from the static analyzer.
     * @param {*} { passive - Parameter derived from the static analyzer.
     *
     * @returns {'touchstart', handleTouchStart, { passive: false }} Refer to the implementation for the precise returned value.
     */
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'touchmove' - Parameter derived from the static analyzer.
     * @param {*} handleTouchMove - Parameter derived from the static analyzer.
     * @param {*} { passive - Parameter derived from the static analyzer.
     *
     * @returns {'touchmove', handleTouchMove, { passive: false }} Refer to the implementation for the precise returned value.
     */
    /**
     * addEventListener - Auto-generated documentation stub.
     *
     * @param {*} 'touchmove' - Parameter forwarded to addEventListener.
     * @param {*} handleTouchMove - Parameter forwarded to addEventListener.
     * @param {*} { passive - Parameter forwarded to addEventListener.
     *
     * @returns {'touchmove', handleTouchMove, { passive: false }} Result produced by addEventListener.
     */
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'touchend' - Parameter derived from the static analyzer.
     * @param {*} handleTouchEnd - Parameter derived from the static analyzer.
     *
     * @returns {'touchend', handleTouchEnd} Refer to the implementation for the precise returned value.
     */
    /**
     * addEventListener - Auto-generated documentation stub.
     *
     * @param {*} 'touchend' - Parameter forwarded to addEventListener.
     * @param {*} handleTouchEnd - Parameter forwarded to addEventListener.
     *
     * @returns {'touchend', handleTouchEnd} Result produced by addEventListener.
     */
    container.addEventListener('touchend', handleTouchEnd);

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
       * @param {*} 'touchstart' - Parameter derived from the static analyzer.
       * @param {*} handleTouchStart - Parameter derived from the static analyzer.
       *
       * @returns {'touchstart', handleTouchStart} Refer to the implementation for the precise returned value.
       */
      /**
       * removeEventListener - Auto-generated documentation stub.
       *
       * @param {*} 'touchstart' - Parameter forwarded to removeEventListener.
       * @param {*} handleTouchStart - Parameter forwarded to removeEventListener.
       *
       * @returns {'touchstart', handleTouchStart} Result produced by removeEventListener.
       */
      container.removeEventListener('touchstart', handleTouchStart);
      /**
       * removeEventListener - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'touchmove' - Parameter derived from the static analyzer.
       * @param {*} handleTouchMove - Parameter derived from the static analyzer.
       *
       * @returns {'touchmove', handleTouchMove} Refer to the implementation for the precise returned value.
       */
      /**
       * removeEventListener - Auto-generated documentation stub.
       *
       * @param {*} 'touchmove' - Parameter forwarded to removeEventListener.
       * @param {*} handleTouchMove - Parameter forwarded to removeEventListener.
       *
       * @returns {'touchmove', handleTouchMove} Result produced by removeEventListener.
       */
      container.removeEventListener('touchmove', handleTouchMove);
      /**
       * removeEventListener - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'touchend' - Parameter derived from the static analyzer.
       * @param {*} handleTouchEnd - Parameter derived from the static analyzer.
       *
       * @returns {'touchend', handleTouchEnd} Refer to the implementation for the precise returned value.
       */
      /**
       * removeEventListener - Auto-generated documentation stub.
       *
       * @param {*} 'touchend' - Parameter forwarded to removeEventListener.
       * @param {*} handleTouchEnd - Parameter forwarded to removeEventListener.
       *
       * @returns {'touchend', handleTouchEnd} Result produced by removeEventListener.
       */
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [zoom, onZoomChange, minZoom, maxZoom]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        touchAction: 'none', // Prevent browser default touch behaviors
      }}
    >
      <SimpleCanvas
        width={width}
        height={height}
        backgroundColor={backgroundColor}
        containerBackground={containerBackground}
        zoom={zoom}
        onStageReady={handleStageReady}
        panModeActive={panModeActive}
      >
        {children}
      </SimpleCanvas>
    </div>
  );
};
