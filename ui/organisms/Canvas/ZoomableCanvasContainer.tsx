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
 * - Mouse wheel zoom (Ctrl/Cmd + wheel)
 * - Keyboard zoom (+ and - keys)
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

  const handleStageReady = (stageInstance: Konva.Stage) => {
    setStage(stageInstance);
    console.log('Canvas stage ready:', stageInstance);

    if (onStageReady) {
      onStageReady(stageInstance);
    }
  };

  const clampZoom = (value: number) => {
    return Math.max(minZoom, Math.min(maxZoom, value));
  };

  // Mouse wheel zoom (with Ctrl/Cmd key)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Only zoom if Ctrl (Windows/Linux) or Cmd (Mac) key is pressed
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        // deltaY is positive when scrolling down, negative when scrolling up
        // We want to zoom in when scrolling up, zoom out when scrolling down
        const delta = -Math.sign(e.deltaY) * wheelZoomStep;
        const newZoom = clampZoom(zoom + delta);

        if (newZoom !== zoom) {
          onZoomChange(newZoom);
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoom, onZoomChange, wheelZoomStep, minZoom, maxZoom]);

  // Keyboard zoom (+ and - keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      let delta = 0;

      // Plus/Equals key (with or without Shift)
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        delta = zoomStep;
      }
      // Minus key
      else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        delta = -zoomStep;
      }
      // Reset with 0 key
      else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onZoomChange(0);
        return;
      }

      if (delta !== 0) {
        const newZoom = clampZoom(zoom + delta);
        if (newZoom !== zoom) {
          onZoomChange(newZoom);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom, onZoomChange, zoomStep, minZoom, maxZoom]);

  // Touch pinch zoom (two-finger gesture)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getTouchDistance = (touches: TouchList): number => {
      if (touches.length < 2) return 0;

      const touch1 = touches[0];
      const touch2 = touches[1];

      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;

      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        lastTouchDistance.current = getTouchDistance(e.touches);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();

        const currentDistance = getTouchDistance(e.touches);
        const previousDistance = lastTouchDistance.current;

        if (previousDistance > 0) {
          // Calculate the scale factor
          const scaleFactor = currentDistance / previousDistance;

          // Convert scale factor to zoom percentage change
          // Scale factor > 1 means pinching out (zoom in)
          // Scale factor < 1 means pinching in (zoom out)
          const deltaZoom = (scaleFactor - 1) * 50; // Sensitivity factor

          const newZoom = clampZoom(zoom + deltaZoom);

          if (Math.abs(newZoom - zoom) > 0.5) { // Threshold to avoid jitter
            onZoomChange(Math.round(newZoom));
          }
        }

        lastTouchDistance.current = currentDistance;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        lastTouchDistance.current = 0;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
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
