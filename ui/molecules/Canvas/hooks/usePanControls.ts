import { useCallback, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@store/CanvasApp';
import { viewActions } from '@store/CanvasApp/view';
import type { PanOffset, PointerPanState, TouchPanState } from '../types/canvas.types';

/**
 * UsePanControlsProps interface - Auto-generated interface summary; customize as needed.
 */
/**
 * UsePanControlsProps interface - Generated documentation block.
 */
/**
 * UsePanControlsProps Interface
 * 
 * Type definition for UsePanControlsProps.
 */
interface UsePanControlsProps {
  panModeActive?: boolean;
  spacePressed?: boolean;
  selectModeActive?: boolean;
}

/**
 * UsePanControlsResult interface - Auto-generated interface summary; customize as needed.
 */
/**
 * UsePanControlsResult interface - Generated documentation block.
 */
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

/**
 * usePanControls Component
 * 
 * Renders the usePanControls component.
 */
export const usePanControls = ({
  panModeActive = false,
  spacePressed = false,
  selectModeActive = false,
}: UsePanControlsProps): UsePanControlsResult => {
  /**
   * useDispatch - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useDispatch - Auto-generated documentation stub.
   */
  const dispatch = useDispatch();
  /**
   * useSelector - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} (state - Parameter derived from the static analyzer.
   */
  /**
   * useSelector - Auto-generated documentation stub.
   *
   * @param {*} (state - Parameter forwarded to useSelector.
   */
  const panOffset = useSelector((state: RootState) => state.view.pan.offset);
  /**
   * useRef - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {panOffset} Refer to the implementation for the precise returned value.
   */
  /**
   * useRef - Auto-generated documentation stub.
   *
   * @returns {panOffset} Result produced by useRef.
   */
  const panOffsetRef = useRef(panOffset);
  /**
   * useState - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {false} Refer to the implementation for the precise returned value.
   */
  /**
   * useState - Auto-generated documentation stub.
   *
   * @returns {false} Result produced by useState.
   */
  const [isPointerPanning, setIsPointerPanning] = useState(false);
  /**
   * useState - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {false} Refer to the implementation for the precise returned value.
   */
  /**
   * useState - Auto-generated documentation stub.
   *
   * @returns {false} Result produced by useState.
   */
  const [isTouchPanning, setIsTouchPanning] = useState(false);
  const pointerPanState = useRef<PointerPanState | null>(null);
  const touchPanState = useRef<TouchPanState | null>(null);
  /**
   * useRef - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {0} Refer to the implementation for the precise returned value.
   */
  /**
   * useRef - Auto-generated documentation stub.
   *
   * @returns {0} Result produced by useRef.
   */
  const lastTouchDistance = useRef(0);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} (event? - Parameter derived from the static analyzer.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   *
   * @param {*} (event? - Parameter forwarded to useCallback.
   */
  const finishPointerPan = useCallback((event?: React.PointerEvent<HTMLDivElement>) => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!pointerPanState.current} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {!pointerPanState.current} Result produced by if.
     */
    if (!pointerPanState.current) {
      return;
    }

    const { pointerId } = pointerPanState.current;

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {event} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {event} Result produced by if.
     */
    if (event) {
      try {
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        if (event.currentTarget.hasPointerCapture(pointerId)) {
          /**
           * releasePointerCapture - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {pointerId} Refer to the implementation for the precise returned value.
           */
          /**
           * releasePointerCapture - Auto-generated documentation stub.
           *
           * @returns {pointerId} Result produced by releasePointerCapture.
           */
          event.currentTarget.releasePointerCapture(pointerId);
        }
      } catch {
        // Ignore pointer capture release issues
      }
    }

    pointerPanState.current = null;
    /**
     * setIsPointerPanning - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {false} Refer to the implementation for the precise returned value.
     */
    /**
     * setIsPointerPanning - Auto-generated documentation stub.
     *
     * @returns {false} Result produced by setIsPointerPanning.
     */
    setIsPointerPanning(false);
  }, []);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} (event - Parameter derived from the static analyzer.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   *
   * @param {*} (event - Parameter forwarded to useCallback.
   */
  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
      return;
    }

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    if (event.button !== 0) {
      return;
    }

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {selectModeActive} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {selectModeActive} Result produced by if.
     */
    if (selectModeActive) {
      return;
    }

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (!(panModeActive || spacePressed)) {
      return;
    }

    /**
     * preventDefault - Auto-generated summary; refine if additional context is needed.
     */
    event.preventDefault();
    /**
     * stopPropagation - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * stopPropagation - Auto-generated documentation stub.
     */
    event.stopPropagation();

    pointerPanState.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      origin: { ...panOffsetRef.current },
    };
    /**
     * setIsPointerPanning - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {true} Refer to the implementation for the precise returned value.
     */
    /**
     * setIsPointerPanning - Auto-generated documentation stub.
     *
     * @returns {true} Result produced by setIsPointerPanning.
     */
    setIsPointerPanning(true);

    try {
      /**
       * setPointerCapture - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {event.pointerId} Refer to the implementation for the precise returned value.
       */
      /**
       * setPointerCapture - Auto-generated documentation stub.
       *
       * @returns {event.pointerId} Result produced by setPointerCapture.
       */
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Ignore pointer capture issues, panning will still work without it
    }
  }, [panModeActive, spacePressed, selectModeActive]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} (event - Parameter derived from the static analyzer.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   *
   * @param {*} (event - Parameter forwarded to useCallback.
   */
  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerPanState.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    /**
     * preventDefault - Auto-generated summary; refine if additional context is needed.
     */
    event.preventDefault();

    const deltaX = event.clientX - state.start.x;
    const deltaY = event.clientY - state.start.y;

    dispatch(viewActions.pan.setOffset({
      x: state.origin.x + deltaX,
      y: state.origin.y + deltaY,
    }));
  }, [dispatch]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} (event - Parameter derived from the static analyzer.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   *
   * @param {*} (event - Parameter forwarded to useCallback.
   */
  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerPanState.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    /**
     * preventDefault - Auto-generated summary; refine if additional context is needed.
     */
    event.preventDefault();
    /**
     * finishPointerPan - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {event} Refer to the implementation for the precise returned value.
     */
    finishPointerPan(event);
  }, [finishPointerPan]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} (event - Parameter derived from the static analyzer.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   *
   * @param {*} (event - Parameter forwarded to useCallback.
   */
  const handlePointerCancel = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerPanState.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    /**
     * finishPointerPan - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {event} Refer to the implementation for the precise returned value.
     */
    /**
     * finishPointerPan - Auto-generated documentation stub.
     *
     * @returns {event} Result produced by finishPointerPan.
     */
    finishPointerPan(event);
  }, [finishPointerPan]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} (event - Parameter derived from the static analyzer.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   *
   * @param {*} (event - Parameter forwarded to useCallback.
   */
  const handlePointerLeave = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerPanState.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    /**
     * finishPointerPan - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {event} Refer to the implementation for the precise returned value.
     */
    /**
     * finishPointerPan - Auto-generated documentation stub.
     *
     * @returns {event} Result produced by finishPointerPan.
     */
    finishPointerPan(event);
  }, [finishPointerPan]);

  /**
   * getTouchCenter - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * getTouchCenter - Auto-generated documentation stub.
   */
  const getTouchCenter = (touches: TouchList) => {
    let sumX = 0;
    let sumY = 0;
    const count = touches.length;

    /**
     * for - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * for - Auto-generated documentation stub.
     */
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

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   */
  const clearTouchPan = useCallback(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {touchPanState.current} Refer to the implementation for the precise returned value.
     */
    if (touchPanState.current) {
      touchPanState.current = null;
      /**
       * setIsTouchPanning - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {false} Refer to the implementation for the precise returned value.
       */
      /**
       * setIsTouchPanning - Auto-generated documentation stub.
       *
       * @returns {false} Result produced by setIsTouchPanning.
       */
      setIsTouchPanning(false);
    }
  }, []);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} (event - Parameter derived from the static analyzer.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   *
   * @param {*} (event - Parameter forwarded to useCallback.
   */
  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touches = event.touches;

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (panModeActive && touches.length === 1) {
      /**
       * preventDefault - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * preventDefault - Auto-generated documentation stub.
       */
      event.preventDefault();
      touchPanState.current = {
        /**
         * getTouchCenter - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {touches} Refer to the implementation for the precise returned value.
         */
        center: getTouchCenter(touches),
        origin: { ...panOffsetRef.current },
        touchCount: 1,
      };
      /**
       * setIsTouchPanning - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {true} Refer to the implementation for the precise returned value.
       */
      /**
       * setIsTouchPanning - Auto-generated documentation stub.
       *
       * @returns {true} Result produced by setIsTouchPanning.
       */
      setIsTouchPanning(true);
      lastTouchDistance.current = 0;
      return;
    }

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (touches.length === 3) {
      /**
       * preventDefault - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * preventDefault - Auto-generated documentation stub.
       */
      event.preventDefault();
      touchPanState.current = {
        /**
         * getTouchCenter - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {touches} Refer to the implementation for the precise returned value.
         */
        center: getTouchCenter(touches),
        origin: { ...panOffsetRef.current },
        touchCount: 3,
      };
      /**
       * setIsTouchPanning - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {true} Refer to the implementation for the precise returned value.
       */
      /**
       * setIsTouchPanning - Auto-generated documentation stub.
       *
       * @returns {true} Result produced by setIsTouchPanning.
       */
      setIsTouchPanning(true);
      lastTouchDistance.current = 0;
    }
  }, [panModeActive]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} (event - Parameter derived from the static analyzer.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   *
   * @param {*} (event - Parameter forwarded to useCallback.
   */
  const handleTouchMove = useCallback((event: TouchEvent) => {
    const touches = event.touches;
    const panState = touchPanState.current;

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (panState && panState.touchCount === 1) {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!panModeActive} Refer to the implementation for the precise returned value.
       */
      if (!panModeActive) {
        /**
         * clearTouchPan - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * clearTouchPan - Auto-generated documentation stub.
         */
        clearTouchPan();
        return;
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      if (touches.length === 1) {
        /**
         * preventDefault - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * preventDefault - Auto-generated documentation stub.
         */
        event.preventDefault();
        /**
         * getTouchCenter - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {touches} Refer to the implementation for the precise returned value.
         */
        /**
         * getTouchCenter - Auto-generated documentation stub.
         *
         * @returns {touches} Result produced by getTouchCenter.
         */
        const center = getTouchCenter(touches);

        dispatch(viewActions.pan.setOffset({
          x: panState.origin.x + (center.x - panState.center.x),
          y: panState.origin.y + (center.y - panState.center.y),
        }));
        return;
      }
    }

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (panState && panState.touchCount === 3 && touches.length === 3) {
      /**
       * preventDefault - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * preventDefault - Auto-generated documentation stub.
       */
      event.preventDefault();
      /**
       * getTouchCenter - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {touches} Refer to the implementation for the precise returned value.
       */
      /**
       * getTouchCenter - Auto-generated documentation stub.
       *
       * @returns {touches} Result produced by getTouchCenter.
       */
      const center = getTouchCenter(touches);

      dispatch(viewActions.pan.setOffset({
        x: panState.origin.x + (center.x - panState.center.x),
        y: panState.origin.y + (center.y - panState.center.y),
      }));
    }
  }, [panModeActive, clearTouchPan, dispatch]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} (event - Parameter derived from the static analyzer.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   *
   * @param {*} (event - Parameter forwarded to useCallback.
   */
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {touchPanState.current} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {touchPanState.current} Result produced by if.
     */
    if (touchPanState.current) {
      const activeCount = touchPanState.current.touchCount;

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if ((activeCount === 3 && event.touches.length < 3) || (activeCount === 1 && event.touches.length === 0)) {
        /**
         * clearTouchPan - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * clearTouchPan - Auto-generated documentation stub.
         */
        clearTouchPan();
      }
    }

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {event.touches.length < 2} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {event.touches.length < 2} Result produced by if.
     */
    if (event.touches.length < 2) {
      lastTouchDistance.current = 0;
    }

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (panModeActive && event.touches.length === 1 && (!touchPanState.current || touchPanState.current.touchCount !== 1)) {
      touchPanState.current = {
        /**
         * getTouchCenter - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {event.touches} Refer to the implementation for the precise returned value.
         */
        center: getTouchCenter(event.touches),
        origin: { ...panOffsetRef.current },
        touchCount: 1,
      };
      /**
       * setIsTouchPanning - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {true} Refer to the implementation for the precise returned value.
       */
      /**
       * setIsTouchPanning - Auto-generated documentation stub.
       *
       * @returns {true} Result produced by setIsTouchPanning.
       */
      setIsTouchPanning(true);
      lastTouchDistance.current = 0;
    }
  }, [clearTouchPan, panModeActive]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   */
  const handleTouchCancel = useCallback(() => {
    /**
     * clearTouchPan - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * clearTouchPan - Auto-generated documentation stub.
     */
    clearTouchPan();
    lastTouchDistance.current = 0;
  }, [clearTouchPan]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} (offset - Parameter derived from the static analyzer.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   *
   * @param {*} (offset - Parameter forwarded to useCallback.
   */
  const setPanOffset = useCallback((offset: PanOffset) => {
    /**
     * dispatch - Auto-generated summary; refine if additional context is needed.
     */
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