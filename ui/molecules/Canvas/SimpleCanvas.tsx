/**
 * Atomic Design - Molecule: SimpleCanvas
 * Combines Stage and Layer atoms into a basic canvas with zoom support
 */

import { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import type { ReactNode } from 'react';
import { Stage, Layer } from '@atoms/Canvas';
import type Konva from 'konva';

type PanOffset = { x: number; y: number };
type PointerPanState = {
  pointerId: number;
  start: { x: number; y: number };
  origin: PanOffset;
};
type TouchPanState = {
  center: { x: number; y: number };
  origin: PanOffset;
  touchCount: number;
};

const MIN_ZOOM = -100;
const MAX_ZOOM = 200;
const WHEEL_ZOOM_STEP = 5;
const KEYBOARD_ZOOM_STEP = 10;
const PINCH_ZOOM_SENSITIVITY = 50;
const TOUCH_DELTA_THRESHOLD = 0.5;
const MIN_EFFECTIVE_SCALE = 0.05;

const clampZoomValue = (value: number): number => {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
};

export interface SimpleCanvasProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  containerBackground?: string;
  zoom?: number;
  children?: ReactNode;
  onStageReady?: (stage: Konva.Stage) => void;
  onZoomChange?: (zoom: number) => void;
  panModeActive?: boolean;
}

/**
 * SimpleCanvas Molecule - A ready-to-use canvas with stage and layer
 * Provides zoom functionality where:
 * - zoom = 0 (default): Stage fits to container
 * - zoom > 0: Zoom in (percentage increase)
 * - zoom < 0: Zoom out (percentage decrease)
 */
export const SimpleCanvas = ({
  width = 1024,
  height = 1024,
  backgroundColor = '#ffffff',
  containerBackground = '#cccccc',
  zoom = 0,
  children,
  onStageReady,
  onZoomChange,
  panModeActive = false,
}: SimpleCanvasProps) => {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef(0);
  const pointerPanState = useRef<PointerPanState | null>(null);
  const touchPanState = useRef<TouchPanState | null>(null);
  const [scale, setScale] = useState(1);
  const [internalZoom, setInternalZoom] = useState<number>(zoom);
  const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 });
  const panOffsetRef = useRef(panOffset);
  const [spacePressed, setSpacePressed] = useState(false);
  const [isPointerPanning, setIsPointerPanning] = useState(false);
  const [isTouchPanning, setIsTouchPanning] = useState(false);

  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  useEffect(() => {
    if (zoom === 0 && (panOffsetRef.current.x !== 0 || panOffsetRef.current.y !== 0)) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoom]);

  // Calculate scale based on zoom and container size
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
  }, [width, height, internalZoom]);

  // Notify when stage is ready
  useEffect(() => {
    if (stageRef.current && onStageReady) {
      onStageReady(stageRef.current);
    }
  }, [onStageReady]);

  // Update stage scale when it changes
  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.scale({ x: scale, y: scale });
      stageRef.current.batchDraw();
    }
  }, [scale]);

  // Sync internal zoom when parent-controlled zoom updates
  useEffect(() => {
    setInternalZoom(zoom);
  }, [zoom]);

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

  // Mouse wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (event.deltaY === 0) return;

      const direction = -Math.sign(event.deltaY);
      applyZoomDelta(direction * WHEEL_ZOOM_STEP);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [applyZoomDelta, panModeActive]);

  // Keyboard zoom controls and pan activation via space bar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }

      if (event.code === 'Space') {
        if (!event.repeat) {
          setSpacePressed(true);
        }
        event.preventDefault();
        return;
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        applyZoomDelta(KEYBOARD_ZOOM_STEP);
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        applyZoomDelta(-KEYBOARD_ZOOM_STEP);
      } else if (event.key === '0' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        updateZoom(() => 0);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpacePressed(false);
      }
    };

    const handleWindowBlur = () => {
      setSpacePressed(false);
      pointerPanState.current = null;
      setIsPointerPanning(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [applyZoomDelta, updateZoom]);

  const finishPointerPan = useCallback((event?: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerPanState.current) {
      return;
    }

    const { pointerId } = pointerPanState.current;

    if (event) {
      try {
        if (event.currentTarget.hasPointerCapture(pointerId)) {
          event.currentTarget.releasePointerCapture(pointerId);
        }
      } catch {
        // Ignore pointer capture release issues
      }
    }

    pointerPanState.current = null;
    setIsPointerPanning(false);
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    if (!(panModeActive || spacePressed)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    pointerPanState.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      origin: { ...panOffsetRef.current },
    };
    setIsPointerPanning(true);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Ignore pointer capture issues, panning will still work without it
    }
  }, [panModeActive, spacePressed]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerPanState.current;
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    event.preventDefault();

    const deltaX = event.clientX - state.start.x;
    const deltaY = event.clientY - state.start.y;

    setPanOffset({
      x: state.origin.x + deltaX,
      y: state.origin.y + deltaY,
    });
  }, []);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerPanState.current;
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    event.preventDefault();
    finishPointerPan(event);
  }, [finishPointerPan]);

  const handlePointerCancel = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerPanState.current;
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    finishPointerPan(event);
  }, [finishPointerPan]);

  const handlePointerLeave = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerPanState.current;
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    finishPointerPan(event);
  }, [finishPointerPan]);

  // Touch pinch zoom and three-finger pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getTouchDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;

      const touchOne = touches[0];
      const touchTwo = touches[1];

      const dx = touchTwo.clientX - touchOne.clientX;
      const dy = touchTwo.clientY - touchOne.clientY;

      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (touches: TouchList) => {
      let sumX = 0;
      let sumY = 0;
      const count = touches.length;

      for (let index = 0; index < count; index += 1) {
        const touch = touches[index];
        sumX += touch.clientX;
        sumY += touch.clientY;
      }

      return {
        x: sumX / count,
        y: sumY / count,
      };
    };

    const clearTouchPan = () => {
      if (touchPanState.current) {
        touchPanState.current = null;
        setIsTouchPanning(false);
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touches = event.touches;

      if (panModeActive && touches.length === 1) {
        event.preventDefault();
        touchPanState.current = {
          center: getTouchCenter(touches),
          origin: { ...panOffsetRef.current },
          touchCount: 1,
        };
        setIsTouchPanning(true);
        lastTouchDistance.current = 0;
        return;
      }

      if (touches.length === 3) {
        event.preventDefault();
        touchPanState.current = {
          center: getTouchCenter(touches),
          origin: { ...panOffsetRef.current },
          touchCount: 3,
        };
        setIsTouchPanning(true);
        lastTouchDistance.current = 0;
      } else if (touches.length === 2) {
        event.preventDefault();
        clearTouchPan();
        lastTouchDistance.current = getTouchDistance(touches);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touches = event.touches;
      const panState = touchPanState.current;

      if (panState && panState.touchCount === 1) {
        if (!panModeActive) {
          clearTouchPan();
          return;
        }

        if (touches.length === 1) {
          event.preventDefault();
          const center = getTouchCenter(touches);

          setPanOffset({
            x: panState.origin.x + (center.x - panState.center.x),
            y: panState.origin.y + (center.y - panState.center.y),
          });
          return;
        }
      }

      if (panState && panState.touchCount === 3 && touches.length === 3) {
        event.preventDefault();
        const center = getTouchCenter(touches);

        setPanOffset({
          x: panState.origin.x + (center.x - panState.center.x),
          y: panState.origin.y + (center.y - panState.center.y),
        });
        return;
      }

      if (touches.length === 2) {
        event.preventDefault();

        const currentDistance = getTouchDistance(touches);
        const previousDistance = lastTouchDistance.current;

        if (previousDistance > 0) {
          const scaleFactor = currentDistance / previousDistance;
          const deltaZoom = (scaleFactor - 1) * PINCH_ZOOM_SENSITIVITY;

          applyZoomDelta(deltaZoom, TOUCH_DELTA_THRESHOLD);
        }

        lastTouchDistance.current = currentDistance;
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (touchPanState.current) {
        const activeCount = touchPanState.current.touchCount;

        if ((activeCount === 3 && event.touches.length < 3) || (activeCount === 1 && event.touches.length === 0)) {
          clearTouchPan();
        }
      }

      if (event.touches.length < 2) {
        lastTouchDistance.current = 0;
      }

      if (panModeActive && event.touches.length === 1 && (!touchPanState.current || touchPanState.current.touchCount !== 1)) {
        touchPanState.current = {
          center: getTouchCenter(event.touches),
          origin: { ...panOffsetRef.current },
          touchCount: 1,
        };
        setIsTouchPanning(true);
        lastTouchDistance.current = 0;
      }
    };

    const handleTouchCancel = () => {
      clearTouchPan();
      lastTouchDistance.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [applyZoomDelta, panModeActive]);

  const renderWidth = Math.max(1, width * scale);
  const renderHeight = Math.max(1, height * scale);

  const cursorStyle = (isPointerPanning || isTouchPanning)
    ? 'grabbing'
    : (panModeActive || spacePressed ? 'grab' : 'default');

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: containerBackground,
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <Stage
        ref={stageRef}
        width={renderWidth}
        height={renderHeight}
        style={{
          backgroundColor,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          cursor: cursorStyle,
        }}
      >
        <Layer>
          {children}
        </Layer>
      </Stage>
    </div>
  );
};
