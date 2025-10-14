/**
 * Atomic Design - Molecule: SimpleCanvas
 * Combines Stage and Layer atoms into a basic canvas with zoom support
 */

import { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import type { ReactNode, CSSProperties, DragEvent } from 'react';
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

export type LayerMoveDirection = 'up' | 'down' | 'top' | 'bottom';

export interface LayerDescriptor {
  id: string;
  name: string;
  visible: boolean;
  render: () => ReactNode;
}

export interface LayerControlHandlers {
  layers: LayerDescriptor[];
  activeLayerId: string | null;
  selectLayer: (layerId: string) => void;
  addLayer: () => void;
  removeLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  copyLayer: (layerId: string) => Promise<string | void> | string | void;
  moveLayer: (layerId: string, direction: LayerMoveDirection) => void;
  toggleVisibility: (layerId: string) => void;
  reorderLayer: (sourceId: string, targetId: string, position: 'above' | 'below') => void;
  ensureAllVisible: () => void;
}

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
  layerControls?: LayerControlHandlers;
  layersRevision?: number;
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
  layerControls,
  layersRevision = 0,
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
  const layerButtonRef = useRef<HTMLButtonElement | null>(null);
  const layerPanelRef = useRef<HTMLDivElement | null>(null);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [dragOverLayer, setDragOverLayer] = useState<{
    id: string;
    position: 'above' | 'below';
  } | null>(null);

  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  useEffect(() => {
    if (!layerControls || !stageRef.current) {
      return;
    }

    stageRef.current.batchDraw();
  }, [layerControls, layersRevision]);

  useEffect(() => {
    if (zoom === 0 && (panOffsetRef.current.x !== 0 || panOffsetRef.current.y !== 0)) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoom]);

  useEffect(() => {
    if (!copyFeedback) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopyFeedback(null), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [copyFeedback]);

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
  }, [applyZoomDelta]);

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

  useEffect(() => {
    if (!isLayerPanelOpen) {
      return;
    }

    if (typeof document === 'undefined') {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (target) {
        if (layerPanelRef.current?.contains(target)) {
          return;
        }
        if (layerButtonRef.current?.contains(target)) {
          return;
        }
      }

      setIsLayerPanelOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLayerPanelOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLayerPanelOpen]);

  useEffect(() => {
    if (!layerControls && isLayerPanelOpen) {
      setIsLayerPanelOpen(false);
    }
  }, [layerControls, isLayerPanelOpen]);

  useEffect(() => {
    if (!isLayerPanelOpen) {
      if (copyFeedback) {
        setCopyFeedback(null);
      }
      if (draggingLayerId) {
        setDraggingLayerId(null);
      }
      if (dragOverLayer) {
        setDragOverLayer(null);
      }
    }
  }, [isLayerPanelOpen, copyFeedback, draggingLayerId, dragOverLayer]);

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

  const handleCopyLayer = useCallback(
    async (layerId: string) => {
      if (!layerControls) {
        return;
      }

      try {
        const result = await layerControls.copyLayer(layerId);
        if (typeof result === 'string' && result.trim().length > 0) {
          setCopyFeedback(result);
        } else {
          setCopyFeedback('Layer copied');
        }
      } catch (error) {
        console.warn('Unable to copy layer', error);
        setCopyFeedback('Unable to copy layer');
      }
    },
    [layerControls]
  );

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

  const renderableLayers = layerControls ? [...layerControls.layers].reverse() : null;
  const bottomLayerId = layerControls?.layers[layerControls.layers.length - 1]?.id ?? null;
  const smallActionButtonStyle: CSSProperties = {
    border: '1px solid #d0d0d0',
    background: '#ffffff',
    color: '#333333',
    borderRadius: '6px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    cursor: 'pointer',
  };

  const getActionButtonStyle = (disabled?: boolean): CSSProperties => ({
    ...smallActionButtonStyle,
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  });

  const resolveDropPosition = (event: DragEvent<HTMLDivElement>): 'above' | 'below' => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - bounds.top;
    return offsetY < bounds.height / 2 ? 'above' : 'below';
  };

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
        position: 'relative',
      }}
    >
      {layerControls && (
        <>
          <button
            ref={layerButtonRef}
            type="button"
            aria-expanded={isLayerPanelOpen}
            aria-label={isLayerPanelOpen ? 'Hide layer controls' : 'Show layer controls'}
            title={isLayerPanelOpen ? 'Hide layer controls' : 'Show layer controls'}
            onClick={() => setIsLayerPanelOpen((previous) => !previous)}
            onPointerDown={(event) => event.stopPropagation()}
            style={{
              position: 'absolute',
              left: '16px',
              bottom: '16px',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              border: '1px solid #d0d0d0',
              backgroundColor: isLayerPanelOpen ? '#333333' : '#ffffff',
              color: isLayerPanelOpen ? '#ffffff' : '#333333',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              cursor: 'pointer',
              zIndex: 12,
              transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
            }}
          >
            ☰
          </button>

          {isLayerPanelOpen && (
            <div
              ref={layerPanelRef}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onWheel={(event) => event.stopPropagation()}
              style={{
                position: 'absolute',
                left: '16px',
                bottom: '80px',
                width: '280px',
                maxHeight: '70%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                backgroundColor: '#ffffff',
                border: '1px solid #d7d7d7',
                borderRadius: '12px',
                boxShadow: '0 16px 32px rgba(0,0,0,0.16)',
                padding: '1rem',
                zIndex: 12,
                overflow: 'hidden',
                touchAction: 'manipulation',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  Layers
                </span>

                <button
                  type="button"
                  onClick={() => setIsLayerPanelOpen(false)}
                  onPointerDown={(event) => event.stopPropagation()}
                  aria-label="Close layer panel"
                  title="Close layer panel"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  layerControls.addLayer();
                }}
                onPointerDown={(event) => event.stopPropagation()}
                style={{
                  border: '1px solid #4a90e2',
                  backgroundColor: '#4a90e2',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease, border-color 0.2s ease',
                }}
              >
                + Add Layer
              </button>

              {copyFeedback && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#2d7a2d',
                    backgroundColor: '#ecf7ec',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '6px',
                  }}
                >
                  {copyFeedback}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  overflowY: 'auto',
                  paddingRight: '0.25rem',
                }}
              >
                {layerControls.layers.length === 0 ? (
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      color: '#555555',
                      padding: '0.5rem 0.25rem',
                    }}
                  >
                    No layers yet. Add one to get started.
                  </div>
                ) : (
                  layerControls.layers.map((layer, index) => {
                    const isActive = layerControls.activeLayerId === layer.id;
                    const isTop = index === 0;
                    const isBottom = index === layerControls.layers.length - 1;
                    const dropPosition =
                      dragOverLayer?.id === layer.id ? dragOverLayer.position : null;
                    const isDragging = draggingLayerId === layer.id;
                    const containerStyle: CSSProperties = {
                      border: `1px solid ${isActive ? '#4a90e2' : '#e0e0e0'}`,
                      borderRadius: '8px',
                      padding: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      backgroundColor: isActive ? '#f4f8ff' : '#ffffff',
                      opacity: isDragging ? 0.6 : 1,
                      position: 'relative',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    };

                    if (dropPosition === 'above') {
                      containerStyle.boxShadow = '0 -4px 0 0 #4a90e2';
                    } else if (dropPosition === 'below') {
                      containerStyle.boxShadow = '0 4px 0 0 #4a90e2';
                    }

                    return (
                      <div
                        key={layer.id}
                        style={containerStyle}
                        draggable
                        onDragStart={(event) => {
                          event.stopPropagation();
                          setDraggingLayerId(layer.id);
                          setDragOverLayer(null);
                          if (event.dataTransfer) {
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', layer.id);
                          }
                        }}
                        onDragEnd={(event) => {
                          event.stopPropagation();
                          setDraggingLayerId(null);
                          setDragOverLayer(null);
                          layerControls.ensureAllVisible();
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (!draggingLayerId || draggingLayerId === layer.id) {
                            return;
                          }
                          if (event.dataTransfer) {
                            event.dataTransfer.dropEffect = 'move';
                          }
                          const position = resolveDropPosition(event);
                          setDragOverLayer((current) => {
                            if (
                              current &&
                              current.id === layer.id &&
                              current.position === position
                            ) {
                              return current;
                            }
                            return { id: layer.id, position };
                          });
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          const sourceId =
                            draggingLayerId || event.dataTransfer?.getData('text/plain');
                          if (!sourceId || sourceId === layer.id) {
                            setDragOverLayer(null);
                            setDraggingLayerId(null);
                            return;
                          }
                          const position = resolveDropPosition(event);
                          layerControls.reorderLayer(sourceId, layer.id, position);
                          setDragOverLayer(null);
                          setDraggingLayerId(null);
                          layerControls.ensureAllVisible();
                        }}
                        onDragLeave={(event) => {
                          event.stopPropagation();
                          if (
                            !event.currentTarget.contains(
                              event.relatedTarget as Node | null
                            )
                          ) {
                            setDragOverLayer((current) =>
                              current?.id === layer.id ? null : current
                            );
                          }
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => layerControls.toggleVisibility(layer.id)}
                            title={layer.visible ? 'Hide layer' : 'Show layer'}
                            aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
                            style={{
                              border: '1px solid #d0d0d0',
                              backgroundColor: layer.visible ? '#ffffff' : '#f5f5f5',
                              color: '#333333',
                              borderRadius: '6px',
                              padding: '0.25rem 0.5rem',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                            }}
                          >
                            {layer.visible ? '👁' : '🙈'}
                          </button>

                          <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => layerControls.selectLayer(layer.id)}
                            style={{
                              flex: 1,
                              textAlign: 'left',
                              border: 'none',
                              background: 'transparent',
                              fontSize: '0.875rem',
                              fontWeight: isActive ? 700 : 500,
                              color: '#333333',
                              cursor: 'pointer',
                            }}
                          >
                            {layer.name}
                          </button>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.35rem',
                          }}
                        >
                          <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => handleCopyLayer(layer.id)}
                            title="Copy layer details"
                            aria-label="Copy layer details"
                            style={getActionButtonStyle()}
                          >
                            ⧉
                          </button>
                          <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => layerControls.duplicateLayer(layer.id)}
                            title="Duplicate layer"
                            aria-label="Duplicate layer"
                            style={getActionButtonStyle()}
                          >
                            ⧺
                          </button>
                          <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => layerControls.moveLayer(layer.id, 'up')}
                            title="Move layer up"
                            aria-label="Move layer up"
                            style={getActionButtonStyle(isTop)}
                            disabled={isTop}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => layerControls.moveLayer(layer.id, 'down')}
                            title="Move layer down"
                            aria-label="Move layer down"
                            style={getActionButtonStyle(isBottom)}
                            disabled={isBottom}
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => layerControls.moveLayer(layer.id, 'top')}
                            title="Send layer to top"
                            aria-label="Send layer to top"
                            style={getActionButtonStyle(isTop)}
                            disabled={isTop}
                          >
                            ⤒
                          </button>
                          <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => layerControls.moveLayer(layer.id, 'bottom')}
                            title="Send layer to bottom"
                            aria-label="Send layer to bottom"
                            style={getActionButtonStyle(isBottom)}
                            disabled={isBottom}
                          >
                            ⤓
                          </button>
                          <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => layerControls.removeLayer(layer.id)}
                            title="Remove layer"
                            aria-label="Remove layer"
                            style={{ ...getActionButtonStyle(layerControls.layers.length <= 1), color: '#a11b1b' }}
                            disabled={layerControls.layers.length <= 1}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
                {layerControls.layers.length > 0 && (
                  <div
                    onDragOver={(event) => {
                  if (!draggingLayerId || !bottomLayerId) return;
                  event.preventDefault();
                  event.stopPropagation();
                  if (event.dataTransfer) {
                    event.dataTransfer.dropEffect = 'move';
                  }
                  setDragOverLayer({ id: bottomLayerId, position: 'below' });
                }}
                onDrop={(event) => {
                  if (!draggingLayerId || !bottomLayerId) return;
                  event.preventDefault();
                  event.stopPropagation();
                  if (draggingLayerId !== bottomLayerId) {
                    layerControls.reorderLayer(draggingLayerId, bottomLayerId, 'below');
                  }
                  setDragOverLayer(null);
                  setDraggingLayerId(null);
                  layerControls.ensureAllVisible();
                }}
                onDragLeave={(event) => {
                  if (
                    !event.currentTarget.contains(
                      event.relatedTarget as Node | null
                    )
                  ) {
                    setDragOverLayer((current) =>
                      current?.id === bottomLayerId ? null : current
                    );
                  }
                }}
                style={{
                  height: draggingLayerId ? '12px' : '0px',
                  backgroundColor:
                    dragOverLayer?.id === bottomLayerId && dragOverLayer?.position === 'below'
                      ? '#e3f0ff'
                      : 'transparent',
                  transition: 'height 0.15s ease',
                  pointerEvents: draggingLayerId ? 'auto' : 'none',
                }}
              />
            )}
              </div>
            </div>
          )}
        </>
      )}

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
        {renderableLayers && renderableLayers.length > 0 ? (
          renderableLayers.map((layer) => (
            <Layer key={`${layer.id}-${layersRevision}`} visible={layer.visible}>
              {layer.render()}
            </Layer>
          ))
        ) : (
          <Layer>
            {children}
          </Layer>
        )}
      </Stage>
    </div>
  );
};
