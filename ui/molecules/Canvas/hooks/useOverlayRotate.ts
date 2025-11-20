import { useRef, useCallback } from 'react';
import type { LayerControlHandlers } from '@molecules/Layer/Layer.types';

interface OverlaySelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

interface OverlayRotateState {
  pointerId: number;
  startAngle: number; // degrees
  startProxyRotation: number; // degrees
  center: { x: number; y: number };
  captureTarget: Element | null;
}

export interface UseOverlayRotateParams {
  overlaySelectionBox: OverlaySelectionBox | null;
  selectModeActive: boolean;
  layerControls: LayerControlHandlers | null;
  selectionProxyRef: React.MutableRefObject<any>;
  selectionProxyRotationRef: React.MutableRefObject<number>;
  isSelectionTransformingRef: React.MutableRefObject<boolean>;
  stageRef: React.MutableRefObject<any>;
  captureSelectionTransformState: () => void;
  applySelectionTransformDelta: () => void;
  finalizeSelectionTransformWithRotation: () => void;
  scheduleBoundsRefresh: () => void;
  setOverlaySelectionBox: React.Dispatch<React.SetStateAction<OverlaySelectionBox | null>>;
  selectionTransformStateRef: React.MutableRefObject<any>;
}

export interface UseOverlayRotateReturn {
  handleOverlayRotatePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  handleOverlayRotatePointerMove: (event: React.PointerEvent<HTMLDivElement>) => boolean;
  handleOverlayRotatePointerUp: (event: React.PointerEvent<HTMLDivElement>) => boolean;
}

export function useOverlayRotate({
  overlaySelectionBox,
  selectModeActive,
  layerControls,
  selectionProxyRef,
  selectionProxyRotationRef,
  isSelectionTransformingRef,
  stageRef,
  captureSelectionTransformState,
  applySelectionTransformDelta,
  finalizeSelectionTransformWithRotation,
  scheduleBoundsRefresh,
  setOverlaySelectionBox,
  selectionTransformStateRef,
}: UseOverlayRotateParams): UseOverlayRotateReturn {
  const overlayRotateState = useRef<OverlayRotateState | null>(null);

  const handleOverlayRotatePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!overlaySelectionBox || !selectModeActive || !layerControls) return;
      const proxy = selectionProxyRef.current;
      if (!proxy) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const pointerId = event.pointerId;
      const captureTarget = event.currentTarget as Element | null;
      try {
        captureTarget?.setPointerCapture(pointerId);
      } catch {}

      const center = { x: overlaySelectionBox.x, y: overlaySelectionBox.y };
      const startAngleRad = Math.atan2(event.clientY - center.y, event.clientX - center.x);
      const startAngleDeg = (startAngleRad * 180) / Math.PI;

      overlayRotateState.current = {
        pointerId,
        startAngle: startAngleDeg,
        startProxyRotation: proxy.rotation() ?? 0,
        center,
        captureTarget,
      };

      // prepare for transform
      captureSelectionTransformState();
      isSelectionTransformingRef.current = true;
    },
    [
      overlaySelectionBox,
      selectModeActive,
      layerControls,
      selectionProxyRef,
      captureSelectionTransformState,
      isSelectionTransformingRef,
    ]
  );

  const handleOverlayRotatePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): boolean => {
      const state = overlayRotateState.current;
      const proxy = selectionProxyRef.current;
      if (!state || !proxy || event.pointerId !== state.pointerId) {
        return false;
      }

      event.preventDefault();
      event.stopPropagation();

      const currentAngleRad = Math.atan2(event.clientY - state.center.y, event.clientX - state.center.x);
      const currentAngleDeg = (currentAngleRad * 180) / Math.PI;
      const delta = currentAngleDeg - state.startAngle;

      const newRotation = state.startProxyRotation + delta;

      proxy.rotation(newRotation);
      selectionProxyRotationRef.current = newRotation;

      applySelectionTransformDelta();
      scheduleBoundsRefresh();

      setOverlaySelectionBox((prev) => (prev ? { ...prev, rotation: newRotation } : prev));

      stageRef.current?.batchDraw();
      return true;
    },
    [
      selectionProxyRef,
      selectionProxyRotationRef,
      applySelectionTransformDelta,
      scheduleBoundsRefresh,
      setOverlaySelectionBox,
      stageRef,
    ]
  );

  const handleOverlayRotatePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): boolean => {
      const state = overlayRotateState.current;
      if (!state || event.pointerId !== state.pointerId) {
        return false;
      }

      event.preventDefault();
      event.stopPropagation();

      try {
        state.captureTarget?.releasePointerCapture(state.pointerId);
      } catch {}

      applySelectionTransformDelta();
      finalizeSelectionTransformWithRotation();
      overlayRotateState.current = null;
      isSelectionTransformingRef.current = false;
      selectionTransformStateRef.current = null;
      scheduleBoundsRefresh();
      return true;
    },
    [
      applySelectionTransformDelta,
      finalizeSelectionTransformWithRotation,
      isSelectionTransformingRef,
      selectionTransformStateRef,
      scheduleBoundsRefresh,
    ]
  );

  return {
    handleOverlayRotatePointerDown,
    handleOverlayRotatePointerMove,
    handleOverlayRotatePointerUp,
  };
}
