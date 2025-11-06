import { useCallback, useState, useLayoutEffect } from 'react';

// Constants from SimpleCanvas
const MIN_ZOOM = -100;
const MAX_ZOOM = 200;
const MIN_EFFECTIVE_SCALE = 0.05;

const clampZoomValue = (value: number): number => {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
};

interface UseZoomControlsProps {
  width: number;
  height: number;
  initialZoom?: number;
  containerRef: React.RefObject<HTMLDivElement>;
  onZoomChange?: (zoom: number) => void;
}

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
  const [scale, setScale] = useState(1);
  const [internalZoom, setInternalZoom] = useState<number>(initialZoom);

  const updateZoom = useCallback(
    (
      updater: (previousZoom: number) => number,
      options?: { threshold?: number }
    ) => {
      const threshold = options?.threshold ?? 0;

      setInternalZoom((previousZoom) => {
        const nextZoom = clampZoomValue(updater(previousZoom));

        if (threshold > 0 && Math.abs(nextZoom - previousZoom) < threshold) {
          return previousZoom;
        }

        if (nextZoom !== previousZoom) {
          if (onZoomChange) {
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
      if (!delta) return;

      updateZoom((previousZoom) => previousZoom + delta, {
        threshold,
      });
    },
    [updateZoom]
  );

  useLayoutEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      if (containerWidth === 0 || containerHeight === 0) {
        return;
      }

      // Calculate fit-to-container scale
      const scaleX = containerWidth / width;
      const scaleY = containerHeight / height;
      const fitScale = Math.min(scaleX, scaleY);

      // Apply zoom adjustment
      // zoom = 0 means use fitScale
      // zoom > 0 means zoom in (increase scale)
      // zoom < 0 means zoom out (decrease scale)
      const zoomFactor = 1 + internalZoom / 100;
      const finalScale = Math.max(fitScale * zoomFactor, MIN_EFFECTIVE_SCALE);

      if (Number.isFinite(finalScale)) {
        setScale(finalScale);
      }
    };

    updateScale();

    // Update on resize events
    window.addEventListener('resize', updateScale);

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => updateScale());
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateScale);
      if (resizeObserver) {
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