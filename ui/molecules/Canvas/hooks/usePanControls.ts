import { useCallback, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@store/CanvasApp';
import { viewActions } from '@store/CanvasApp/view';
import type { PanOffset, PointerPanState, TouchPanState } from '../types/canvas.types';

interface UsePanControlsProps {
  panModeActive?: boolean;
  spacePressed?: boolean;
  selectModeActive?: boolean;
}

interface UsePanControlsResult {
  panOffset: PanOffset;
  isPointerPanning: boolean;
  isTouchPanning: boolean;
  handlePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerLeave: (event: React.PointerEvent<HTMLDivElement>) => void;
  handleTouchStart: (event: TouchEvent) => void;
  handleTouchMove: (event: TouchEvent) => void;
  handleTouchEnd: (event: TouchEvent) => void;
  handleTouchCancel: () => void;
  setPanOffset: (offset: PanOffset) => void;
}

export const usePanControls = ({
  panModeActive = false,
  spacePressed = false,
  selectModeActive = false,
}: UsePanControlsProps): UsePanControlsResult => {
  const dispatch = useDispatch();
  const panOffset = useSelector((state: RootState) => state.view.pan.offset);
  const panOffsetRef = useRef(panOffset);
  const [isPointerPanning, setIsPointerPanning] = useState(false);
  const [isTouchPanning, setIsTouchPanning] = useState(false);
  const pointerPanState = useRef<PointerPanState | null>(null);
  const touchPanState = useRef<TouchPanState | null>(null);
  const lastTouchDistance = useRef(0);

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

    if (selectModeActive) {
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
  }, [panModeActive, spacePressed, selectModeActive]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerPanState.current;
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    event.preventDefault();

    const deltaX = event.clientX - state.start.x;
    const deltaY = event.clientY - state.start.y;

    dispatch(viewActions.pan.setOffset({
      x: state.origin.x + deltaX,
      y: state.origin.y + deltaY,
    }));
  }, [dispatch]);

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

  const clearTouchPan = useCallback(() => {
    if (touchPanState.current) {
      touchPanState.current = null;
      setIsTouchPanning(false);
    }
  }, []);

  const handleTouchStart = useCallback((event: TouchEvent) => {
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
    }
  }, [panModeActive]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
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

        dispatch(viewActions.pan.setOffset({
          x: panState.origin.x + (center.x - panState.center.x),
          y: panState.origin.y + (center.y - panState.center.y),
        }));
        return;
      }
    }

    if (panState && panState.touchCount === 3 && touches.length === 3) {
      event.preventDefault();
      const center = getTouchCenter(touches);

      dispatch(viewActions.pan.setOffset({
        x: panState.origin.x + (center.x - panState.center.x),
        y: panState.origin.y + (center.y - panState.center.y),
      }));
    }
  }, [panModeActive, clearTouchPan, dispatch]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
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
  }, [clearTouchPan, panModeActive]);

  const handleTouchCancel = useCallback(() => {
    clearTouchPan();
    lastTouchDistance.current = 0;
  }, [clearTouchPan]);

  const setPanOffset = useCallback((offset: PanOffset) => {
    dispatch(viewActions.pan.setOffset(offset));
  }, [dispatch]);

  return {
    panOffset,
    isPointerPanning,
    isTouchPanning,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    setPanOffset,
  };
};