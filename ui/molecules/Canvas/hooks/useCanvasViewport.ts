import { useCallback, useEffect, useRef, useState } from "react";
import {
  WHEEL_ZOOM_STEP,
  KEYBOARD_ZOOM_STEP,
  PINCH_ZOOM_SENSITIVITY,
  TOUCH_DELTA_THRESHOLD,
  useUpdateZoom,
  useApplyZoomDelta,
} from "@molecules//Canvas/hooks/zoomUtils";
import { useResize } from "@molecules//Canvas/hooks/useResize";

import type { PanOffset } from "@molecules/Layer/Layer.types";

interface UseCanvasViewportParams {
  stageWidth: number;
  stageHeight: number;
  initialZoom: number;
  onZoomChange?: (zoom: number) => void;
  panModeActive: boolean;
}

export function useCanvasViewport({
  stageWidth,
  stageHeight,
  initialZoom,
  onZoomChange,
  panModeActive,
}: UseCanvasViewportParams) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [internalZoom, setInternalZoom] = useState(initialZoom);
  const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 });
  const panOffsetRef = useRef(panOffset);
  const [spacePressed, setSpacePressed] = useState(false);
  const [isPointerPanning, setIsPointerPanning] = useState(false);
  const [isTouchPanning, setIsTouchPanning] = useState(false);

  const pointerPanState = useRef<{
    pointerId: number;
    start: { x: number; y: number };
    origin: PanOffset;
  } | null>(null);

  const touchPanState = useRef<{
    center: { x: number; y: number };
    origin: PanOffset;
    touchCount: 1 | 3;
  } | null>(null);

  const lastTouchDistance = useRef(0);

  const { dimensions: containerDimensions, scale, setDimensions, setScale } =
    useResize(containerRef, stageWidth, stageHeight, internalZoom);

  const safeScale = Math.max(scale, 0.0001);

  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  const updateZoom = useUpdateZoom(onZoomChange, setInternalZoom);
  const applyZoomDelta = useApplyZoomDelta(updateZoom);

  const renderWidth = Math.max(1, stageWidth * scale);
  const renderHeight = Math.max(1, stageHeight * scale);

  const stageViewportOffsetX =
    (containerDimensions.width - renderWidth) / 2 / safeScale +
    panOffset.x / safeScale;
  const stageViewportOffsetY =
    (containerDimensions.height - renderHeight) / 2 / safeScale +
    panOffset.y / safeScale;

  const getRelativePointerPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return {
      x: pos.x / safeScale - stageViewportOffsetX,
      y: pos.y / safeScale - stageViewportOffsetY,
    };
  }, [safeScale, stageViewportOffsetX, stageViewportOffsetY]);

  // ----- Mouse wheel zoom -----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.closest(".layer-panel-ui") ||
          target.closest(".settings-panel-ui"))
      ) {
        return;
      }

      event.preventDefault();
      if (event.deltaY === 0) return;

      const direction = -Math.sign(event.deltaY);
      applyZoomDelta(direction * WHEEL_ZOOM_STEP);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [applyZoomDelta]);

  // ----- Keyboard zoom + space-pan -----
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      if (event.code === "Space") {
        if (!event.repeat) {
          setSpacePressed(true);
        }
        event.preventDefault();
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        applyZoomDelta(KEYBOARD_ZOOM_STEP);
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        applyZoomDelta(-KEYBOARD_ZOOM_STEP);
      } else if (event.key === "0" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        updateZoom(() => 0);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setSpacePressed(false);
      }
    };

    const handleWindowBlur = () => {
      setSpacePressed(false);
      pointerPanState.current = null;
      setIsPointerPanning(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [applyZoomDelta, updateZoom]);

  // ----- Pointer pan (mouse/pen) -----
  const finishPointerPan = useCallback(
    (event?: React.PointerEvent<HTMLDivElement>) => {
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
          // ignore
        }
      }

      pointerPanState.current = null;
      setIsPointerPanning(false);
    },
    []
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
        return;
      }
      if (event.button !== 0) return;
      if (!(panModeActive || spacePressed)) return;

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
        // ignore
      }
    },
    [panModeActive, spacePressed]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
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
    },
    []
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = pointerPanState.current;
      if (!state || event.pointerId !== state.pointerId) {
        return;
      }
      event.preventDefault();
      finishPointerPan(event);
    },
    [finishPointerPan]
  );

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = pointerPanState.current;
      if (!state || event.pointerId !== state.pointerId) {
        return;
      }
      finishPointerPan(event);
    },
    [finishPointerPan]
  );

  const handlePointerLeave = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = pointerPanState.current;
      if (!state || event.pointerId !== state.pointerId) {
        return;
      }
      finishPointerPan(event);
    },
    [finishPointerPan]
  );

  // ----- Touch: pinch-zoom + pan -----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getTouchDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const t1 = touches[0];
      const t2 = touches[1];
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (touches: TouchList) => {
      let sumX = 0;
      let sumY = 0;
      const count = touches.length;

      for (let i = 0; i < count; i++) {
        const touch = touches[i];
        sumX += touch.clientX;
        sumY += touch.clientY;
      }

      return { x: sumX / count, y: sumY / count };
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
        if (
          (activeCount === 3 && event.touches.length < 3) ||
          (activeCount === 1 && event.touches.length === 0)
        ) {
          clearTouchPan();
        }
      }

      if (event.touches.length < 2) {
        lastTouchDistance.current = 0;
      }

      if (
        panModeActive &&
        event.touches.length === 1 &&
        (!touchPanState.current || touchPanState.current.touchCount !== 1)
      ) {
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

    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [applyZoomDelta, panModeActive]);

  const baseCursor =
    isPointerPanning || isTouchPanning
      ? "grabbing"
      : panModeActive || spacePressed
      ? "grab"
      : "default";

  return {
    // refs
    stageRef,
    containerRef,

    // layout / transforms
    containerDimensions,
    scale: safeScale,
    panOffset,
    setPanOffset,
    stageViewportOffsetX,
    stageViewportOffsetY,

    // zoom
    internalZoom,
    setInternalZoom,
    updateZoom,
    applyZoomDelta,

    // pointer handlers
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,

    // misc
    baseCursor,
    isPointerPanning,
    isTouchPanning,
    getRelativePointerPosition,
  };
}
