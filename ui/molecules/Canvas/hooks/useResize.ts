import { useCallback } from 'react';

// Resize-related useCallback hooks (if any needed, e.g., for setting scale)
export function useSetScale() {
  return useCallback((setScale: (scale: number) => void, newScale: number) => {
    setScale(newScale);
  }, []);
}
import { useState, useLayoutEffect, useRef } from 'react';

export function useResize(containerRef: React.RefObject<HTMLDivElement>, width: number, height: number, internalZoom: number) {
  const [containerDimensions, setContainerDimensions] = useState({ width: 1024, height: 1024 });
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      if (containerWidth === 0 || containerHeight === 0) return;
      setContainerDimensions({ width: containerWidth, height: containerHeight });
      const scaleX = containerWidth / width;
      const scaleY = containerHeight / height;
      const fitScale = Math.min(scaleX, scaleY);
      const zoomFactor = 1 + internalZoom / 100;
      const MIN_EFFECTIVE_SCALE = 0.05;
      const finalScale = Math.max(fitScale * zoomFactor, MIN_EFFECTIVE_SCALE);
      if (Number.isFinite(finalScale)) setScale(finalScale);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => updateScale());
      resizeObserver.observe(containerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateScale);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [width, height, internalZoom, containerRef]);

  return { containerDimensions, scale, setContainerDimensions, setScale };
}
