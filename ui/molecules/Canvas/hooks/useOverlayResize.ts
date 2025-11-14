import { useRef, useCallback } from 'react';
import type { LayerControlHandlers } from '../types/canvas.types';

const MIN_PROXY_DIMENSION = 1;

interface OverlaySelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

interface OverlayResizeState {
  pointerId: number;
  direction: string;
  rotationDeg: number;
  rotationRad: number;
  captureTarget: Element | null;
  startScreen: { x: number; y: number };
  initialCenterStage: { x: number; y: number };
  initialCenterScreen: { x: number; y: number };
  initialLeft: number;
  initialRight: number;
  initialTop: number;
  initialBottom: number;
}

export interface UseOverlayResizeParams {
  overlaySelectionBox: OverlaySelectionBox | null;
  selectModeActive: boolean;
  layerControls: LayerControlHandlers | null;
  selectionProxyRef: React.MutableRefObject<any>;
  isSelectionTransformingRef: React.MutableRefObject<boolean>;
  scale: number;
  captureSelectionTransformState: () => void;
  applySelectionTransformDelta: () => void;
  finalizeSelectionTransformWithRotation: () => void;
  scheduleBoundsRefresh: () => void;
  setOverlaySelectionBox: React.Dispatch<React.SetStateAction<OverlaySelectionBox | null>>;
  stageRef: React.MutableRefObject<any>;
  selectionTransformStateRef: React.MutableRefObject<any>;
}

export interface UseOverlayResizeReturn {
  handleOverlayResizePointerDown: (direction: string, event: React.PointerEvent<HTMLDivElement>) => void;
  handleOverlayResizePointerMove: (event: React.PointerEvent<HTMLDivElement>) => boolean;
  handleOverlayResizePointerUp: (event: React.PointerEvent<HTMLDivElement>) => boolean;
}

export function useOverlayResize({
  overlaySelectionBox,
  selectModeActive,
  layerControls,
  selectionProxyRef,
  isSelectionTransformingRef,
  scale,
  captureSelectionTransformState,
  applySelectionTransformDelta,
  finalizeSelectionTransformWithRotation,
  scheduleBoundsRefresh,
  setOverlaySelectionBox,
  stageRef,
  selectionTransformStateRef,
}: UseOverlayResizeParams): UseOverlayResizeReturn {
  const overlayResizeState = useRef<OverlayResizeState | null>(null);

  const handleOverlayResizePointerDown = useCallback(
    (direction: string, event: React.PointerEvent<HTMLDivElement>) => {
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

      const rotationDeg = overlaySelectionBox.rotation || 0;
      const rotationRad = (rotationDeg * Math.PI) / 180;

      // Store initial proxy dimensions in local (unrotated) coordinates
      const proxyWidth = proxy.width();
      const proxyHeight = proxy.height();
      const proxyOffsetX = proxy.offsetX();
      const proxyOffsetY = proxy.offsetY();

      const initialLeft = -proxyOffsetX;
      const initialRight = proxyWidth - proxyOffsetX;
      const initialTop = -proxyOffsetY;
      const initialBottom = proxyHeight - proxyOffsetY;

      const initialCenterStage = proxy.position();
      const initialCenterScreen = {
        x: overlaySelectionBox.x,
        y: overlaySelectionBox.y,
      };

      overlayResizeState.current = {
        pointerId,
        direction,
        rotationDeg,
        rotationRad,
        captureTarget,
        startScreen: { x: event.clientX, y: event.clientY },
        initialCenterStage,
        initialCenterScreen,
        initialLeft,
        initialRight,
        initialTop,
        initialBottom,
      };

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

  const handleOverlayResizePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): boolean => {
      const state = overlayResizeState.current;
      if (!state || event.pointerId !== state.pointerId) {
        return false;
      }

      event.preventDefault();
      event.stopPropagation();

      const safeScale = Math.max(scale, 0.0001);
      const dxStage = (event.clientX - state.startScreen.x) / safeScale;
      const dyStage = (event.clientY - state.startScreen.y) / safeScale;

      const cos = Math.cos(state.rotationRad);
      const sin = Math.sin(state.rotationRad);
      const localDx = cos * dxStage + sin * dyStage;
      const localDy = -sin * dxStage + cos * dyStage;

      let left = state.initialLeft;
      let right = state.initialRight;
      let top = state.initialTop;
      let bottom = state.initialBottom;

      if (state.direction.includes('e')) {
        right = state.initialRight + localDx;
      }
      if (state.direction.includes('w')) {
        left = state.initialLeft + localDx;
      }
      if (state.direction.includes('s')) {
        bottom = state.initialBottom + localDy;
      }
      if (state.direction.includes('n')) {
        top = state.initialTop + localDy;
      }

      if (right - left < MIN_PROXY_DIMENSION) {
        if (state.direction.includes('e')) {
          right = left + MIN_PROXY_DIMENSION;
        } else {
          left = right - MIN_PROXY_DIMENSION;
        }
      }
      if (bottom - top < MIN_PROXY_DIMENSION) {
        if (state.direction.includes('s')) {
          bottom = top + MIN_PROXY_DIMENSION;
        } else {
          top = bottom - MIN_PROXY_DIMENSION;
        }
      }

      const nextWidth = Math.max(MIN_PROXY_DIMENSION, right - left);
      const nextHeight = Math.max(MIN_PROXY_DIMENSION, bottom - top);

      const offsetLocalX = (left + right) / 2;
      const offsetLocalY = (top + bottom) / 2;
      const offsetStageX = cos * offsetLocalX - sin * offsetLocalY;
      const offsetStageY = sin * offsetLocalX + cos * offsetLocalY;

      const proxy = selectionProxyRef.current;
      if (!proxy) {
        return true;
      }

      proxy.width(nextWidth);
      proxy.height(nextHeight);
      proxy.offset({ x: nextWidth / 2, y: nextHeight / 2 });
      proxy.position({
        x: state.initialCenterStage.x + offsetStageX,
        y: state.initialCenterStage.y + offsetStageY,
      });

      applySelectionTransformDelta();

      setOverlaySelectionBox((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          x: state.initialCenterScreen.x + offsetStageX * safeScale,
          y: state.initialCenterScreen.y + offsetStageY * safeScale,
          width: nextWidth * safeScale,
          height: nextHeight * safeScale,
          rotation: state.rotationDeg,
        };
      });

      scheduleBoundsRefresh();
      stageRef.current?.batchDraw();
      return true;
    },
    [
      scale,
      selectionProxyRef,
      applySelectionTransformDelta,
      setOverlaySelectionBox,
      scheduleBoundsRefresh,
      stageRef,
    ]
  );

  const handleOverlayResizePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): boolean => {
      const state = overlayResizeState.current;
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
      overlayResizeState.current = null;
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
    handleOverlayResizePointerDown,
    handleOverlayResizePointerMove,
    handleOverlayResizePointerUp,
  };
}
