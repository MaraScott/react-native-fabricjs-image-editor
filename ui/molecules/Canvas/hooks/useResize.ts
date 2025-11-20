import { useCallback } from 'react';

// Resize-related useCallback hooks (if any needed, e.g., for setting scale)
export function useSetScale() {
  return useCallback((setScale: (scale: number) => void, newScale: number) => {
    setScale(newScale);
  }, []);
}
import { useState, useLayoutEffect, useRef } from 'react';

export function useResize(layerRef: React.RefObject<HTMLDivElement>, width: number, height: number, internalZoom: number) {
  const [dimensions, setDimensions] = useState({ width: width ?? 1024, height: height ?? 1024 });
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const updateScale = () => {
      if (!layerRef.current) return;
      const layer = layerRef.current;
      const layerWidth = layer.clientWidth;
      const layerHeight = layer.clientHeight;
      if (layerWidth === 0 || layerHeight === 0) return;
      setDimensions({ width: layerWidth, height: layerHeight });
      const scaleX = layerWidth / width;
      const scaleY = layerHeight / height;
      const fitScale = Math.min(scaleX, scaleY);
      const zoomFactor = 1 + internalZoom / 100;
      const MIN_EFFECTIVE_SCALE = 0.05;
      const finalScale = Math.max(fitScale * zoomFactor, MIN_EFFECTIVE_SCALE);
      if (Number.isFinite(finalScale)) setScale(finalScale);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined' && layerRef.current) {
      resizeObserver = new ResizeObserver(() => updateScale());
      resizeObserver.observe(layerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateScale);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [layerRef, width, height, internalZoom]);

  return { dimensions, scale, setDimensions, setScale };
}
