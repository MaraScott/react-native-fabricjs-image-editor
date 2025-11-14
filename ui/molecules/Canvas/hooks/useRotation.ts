

// Rotation-related useCallback hooks (if any needed, e.g., for updating rotation)
export function useSetRotation() {
  return useCallback((setRotation: (rotation: number) => void, newRotation: number) => {
    setRotation(newRotation);
  }, []);
}
// Rotation-related utilities and hooks
import { useRef, useCallback } from 'react';

export function useRotation(resolveSelectionRotation: () => number) {
  const selectionProxyRotationRef = useRef<number>(0);

  const getRotationDeg = useCallback(() => {
    return resolveSelectionRotation();
  }, [resolveSelectionRotation]);

  const getRotationRad = useCallback(() => {
    const deg = getRotationDeg();
    return (deg * Math.PI) / 180;
  }, [getRotationDeg]);

  return {
    selectionProxyRotationRef,
    getRotationDeg,
    getRotationRad,
  };
}
