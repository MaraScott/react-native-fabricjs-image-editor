import { useCallback } from 'react';

// Zoom-related useCallback hooks
export function useUpdateZoom(onZoomChange?: (zoom: number) => void) {
  return useCallback(
    (
      updater: (previousZoom: number) => number,
      options?: { threshold?: number }
    ) => {
      const threshold = options?.threshold ?? 0;
      return (setInternalZoom: (updater: (prev: number) => number) => void) => {
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
      };
    },
    [onZoomChange]
  );
}

export function useApplyZoomDelta(updateZoom: ReturnType<typeof useUpdateZoom>) {
  return useCallback(
    (delta: number, threshold?: number) => {
      if (!delta) return;
      updateZoom((previousZoom) => previousZoom + delta, { threshold });
    },
    [updateZoom]
  );
}
// Zoom-related constants and utilities for SimpleCanvas

export const MIN_ZOOM = -100;
export const MAX_ZOOM = 200;
export const WHEEL_ZOOM_STEP = 5;
export const KEYBOARD_ZOOM_STEP = 10;
export const PINCH_ZOOM_SENSITIVITY = 50;
export const TOUCH_DELTA_THRESHOLD = 0.5;
export const MIN_EFFECTIVE_SCALE = 0.05;

export const clampZoomValue = (value: number): number => {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
};
