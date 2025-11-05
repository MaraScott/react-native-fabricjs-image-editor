/**
 * Atomic Design - Molecule: SimpleCanvas
 * Combines Stage and Layer atoms into a basic canvas with zoom support
 */

import { useRef, useEffect, useState, useCallback, useLayoutEffect, useMemo } from 'react';
import type { ReactNode, CSSProperties, DragEvent } from 'react';
import { Stage, Layer } from '@atoms/Canvas';
import { Rect, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';

type PanOffset = { x: number; y: number };
type ScaleVector = { x: number; y: number };
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

type SelectionDragState = {
  anchorLayerId: string;
  initialPositions: Map<string, PanOffset>;
};

type SelectionNodeSnapshot = {
  id: string;
  node: Konva.Layer;
  transform: Konva.Transform;
};

type SelectionTransformSnapshot = {
  proxyTransform: Konva.Transform;
  nodes: SelectionNodeSnapshot[];
};

export type LayerMoveDirection = 'up' | 'down' | 'top' | 'bottom';

export interface LayerDescriptor {
  id: string;
  name: string;
  visible: boolean;
  position: { x: number; y: number };
  /** Optional persisted rotation (degrees) */
  rotation?: number;
  /** Optional persisted scale */
  scale?: ScaleVector;
  render: () => ReactNode;
}

export type LayerSelectionMode = 'replace' | 'append' | 'toggle' | 'range';

export interface LayerSelectionOptions {
  mode?: LayerSelectionMode;
}

export interface LayerControlHandlers {
  layers: LayerDescriptor[];
  selectedLayerIds: string[];
  primaryLayerId: string | null;
  selectLayer: (layerId: string, options?: LayerSelectionOptions) => string[];
  /** Clear any selection (deselect all) */
  clearSelection?: () => void;
  addLayer: () => void;
  removeLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  copyLayer: (layerId: string) => Promise<string | void> | string | void;
  moveLayer: (layerId: string, direction: LayerMoveDirection) => void;
  toggleVisibility: (layerId: string) => void;
  reorderLayer: (sourceId: string, targetId: string, position: 'above' | 'below') => void;
  ensureAllVisible: () => void;
  updateLayerPosition: (layerId: string, position: { x: number; y: number }) => void;
  updateLayerScale?: (layerId: string, scale: ScaleVector) => void;
  updateLayerRotation?: (layerId: string, rotation: number) => void;
  updateLayerTransform?: (
    layerId: string,
    transform: {
      position: PanOffset;
      scale: ScaleVector;
      rotation: number;
    }
  ) => void;
}

const MIN_ZOOM = -100;
const MAX_ZOOM = 200;
const WHEEL_ZOOM_STEP = 5;
const KEYBOARD_ZOOM_STEP = 10;
const PINCH_ZOOM_SENSITIVITY = 50;
const TOUCH_DELTA_THRESHOLD = 0.5;
const MIN_EFFECTIVE_SCALE = 0.05;
const BOUNDS_RETRY_LIMIT = 4;

const clampZoomValue = (value: number): number => {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
};

type Bounds = { x: number; y: number; width: number; height: number };

const isFiniteNumber = (value: number): boolean => Number.isFinite(value);

const normaliseBounds = (rect: Bounds | null | undefined): Bounds | null => {
  if (!rect) {
    return null;
  }

  const { x, y, width, height } = rect;

  if (![x, y, width, height].every(isFiniteNumber)) {
    return null;
  }

  return {
    x,
    y,
    width: Math.max(0, width),
    height: Math.max(0, height),
  };
};

const computeNodeBounds = (node: Konva.Node | null): Bounds | null => {
  if (!node) {
    return null;
  }

  const rect = node.getClientRect({
    skipTransform: false,
    relativeTo: node.getStage() ?? undefined,
  });

  return normaliseBounds(rect);
};

const areBoundsEqual = (first: Bounds | null, second: Bounds | null): boolean => {
  if (first === second) {
    return true;
  }

  if (!first || !second) {
    return false;
  }

  return (
    first.x === second.x &&
    first.y === second.y &&
    first.width === second.width &&
    first.height === second.height
  );
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
  selectModeActive?: boolean;
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
  selectModeActive = false,
}: SimpleCanvasProps) => {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef(0);
  const pointerPanState = useRef<PointerPanState | null>(null);
  const touchPanState = useRef<TouchPanState | null>(null);
  const selectionDragStateRef = useRef<SelectionDragState | null>(null);
  const pendingSelectionRef = useRef<string[] | null>(null);
  const selectionTransformerRef = useRef<Konva.Transformer | null>(null);
  const selectionProxyRef = useRef<Konva.Rect | null>(null);
  const selectionTransformStateRef = useRef<SelectionTransformSnapshot | null>(null);
  const selectionProxyRotationRef = useRef<number>(0);
  const transformAnimationFrameRef = useRef<number | null>(null);
  const isSelectionTransformingRef = useRef(false);
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
  const [selectedLayerBounds, setSelectedLayerBounds] = useState<Bounds | null>(null);
  const layerNodeRefs = useRef<Map<string, Konva.Layer>>(new Map());
  const renderableLayers = layerControls ? [...layerControls.layers].reverse() : null;
  const selectedLayerIds = layerControls?.selectedLayerIds ?? [];
  const selectedLayerSet = useMemo(() => new Set(selectedLayerIds), [selectedLayerIds]);
  const primaryLayerId = layerControls?.primaryLayerId ?? null;

  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  useEffect(() => {
    return () => {
      if (transformAnimationFrameRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(transformAnimationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!layerControls || !stageRef.current) {
      return;
    }

    stageRef.current.batchDraw();
  }, [layerControls, layersRevision, selectModeActive]);

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

  const updateBoundsFromLayerIds = useCallback(
    (layerIds: string[] | null | undefined, attempt: number = 0) => {
      if (!selectModeActive) {
        setSelectedLayerBounds(null);
        return;
      }

      if (!layerIds || layerIds.length === 0) {
        setSelectedLayerBounds(null);
        return;
      }

      const stage = stageRef.current;
      const nodes = layerIds
        .map((layerId) => {
          const cachedNode = layerNodeRefs.current.get(layerId);
          return cachedNode ?? stage?.findOne(`#layer-${layerId}`) ?? null;
        })
        .filter((node): node is Konva.Layer => Boolean(node));

      if (nodes.length !== layerIds.length) {
        if (attempt < BOUNDS_RETRY_LIMIT && typeof window !== 'undefined') {
          window.requestAnimationFrame(() => updateBoundsFromLayerIds(layerIds, attempt + 1));
        }
        return;
      }

      const boundsList = nodes
        .map((node) => computeNodeBounds(node))
        .filter((bounds): bounds is Bounds => Boolean(bounds));

      if (boundsList.length === 0) {
        if (attempt < BOUNDS_RETRY_LIMIT && typeof window !== 'undefined') {
          window.requestAnimationFrame(() => updateBoundsFromLayerIds(layerIds, attempt + 1));
        }
        return;
      }

      const unifiedBounds = boundsList.reduce<Bounds>((accumulator, bounds) => {
        const minX = Math.min(accumulator.x, bounds.x);
        const minY = Math.min(accumulator.y, bounds.y);
        const maxX = Math.max(accumulator.x + accumulator.width, bounds.x + bounds.width);
        const maxY = Math.max(accumulator.y + accumulator.height, bounds.y + bounds.height);

        return {
          x: minX,
          y: minY,
          width: Math.max(0, maxX - minX),
          height: Math.max(0, maxY - minY),
        };
      }, boundsList[0]);

      setSelectedLayerBounds((previous) => (areBoundsEqual(previous, unifiedBounds) ? previous : unifiedBounds));
      nodes[0]?.getStage()?.batchDraw();
    },
    [selectModeActive]
  );

  const refreshBoundsFromSelection = useCallback(() => {
    const targetIds = pendingSelectionRef.current ?? layerControls?.selectedLayerIds ?? null;
    updateBoundsFromLayerIds(targetIds);
  }, [layerControls?.selectedLayerIds, updateBoundsFromLayerIds]);

  const scheduleBoundsRefresh = useCallback(() => {
    if (!selectModeActive) {
      return;
    }

    if (typeof window === 'undefined') {
      refreshBoundsFromSelection();
      return;
    }

    if (transformAnimationFrameRef.current !== null) {
      return;
    }

    transformAnimationFrameRef.current = window.requestAnimationFrame(() => {
      transformAnimationFrameRef.current = null;
      refreshBoundsFromSelection();
    });
  }, [refreshBoundsFromSelection, selectModeActive]);

  const captureSelectionTransformState = useCallback(() => {
    const proxy = selectionProxyRef.current;
    if (!proxy) {
      selectionTransformStateRef.current = null;
      return;
    }

    // Capture current proxy rotation so we can persist it when not actively transforming
    selectionProxyRotationRef.current = proxy.rotation() ?? 0;

    const nodeSnapshots = selectedLayerIds
      .map((layerId) => {
        const node = layerNodeRefs.current.get(layerId);
        if (!node) {
          return null;
        }

        return {
          id: layerId,
          node,
          transform: node.getAbsoluteTransform().copy(),
        };
      })
      .filter((snapshot): snapshot is SelectionNodeSnapshot => Boolean(snapshot));

    if (nodeSnapshots.length === 0) {
      selectionTransformStateRef.current = null;
      return;
    }

    selectionTransformStateRef.current = {
      proxyTransform: proxy.getAbsoluteTransform().copy(),
      nodes: nodeSnapshots,
    };
  }, [selectedLayerIds]);

  const applySelectionTransformDelta = useCallback(() => {
    const snapshot = selectionTransformStateRef.current;
    const proxy = selectionProxyRef.current;

    if (!snapshot || !proxy) {
      return;
    }

    const currentProxyTransform = proxy.getAbsoluteTransform();
    const initialProxyTransform = snapshot.proxyTransform;

    const initialInverse = initialProxyTransform.copy().invert();
    const delta = currentProxyTransform.copy();
    delta.multiply(initialInverse);

    snapshot.nodes.forEach(({ node, transform }) => {
      const absoluteTransform = delta.copy().multiply(transform);

      const parent = node.getParent();
      const localTransform = parent
        ? parent.getAbsoluteTransform().copy().invert().multiply(absoluteTransform)
        : absoluteTransform;

      const decomposition = localTransform.decompose();

      if (Number.isFinite(decomposition.x) && Number.isFinite(decomposition.y)) {
        node.position({
          x: decomposition.x,
          y: decomposition.y,
        });
      }

      if (Number.isFinite(decomposition.rotation)) {
        node.rotation(decomposition.rotation);
      }

      if (Number.isFinite(decomposition.scaleX)) {
        node.scaleX(decomposition.scaleX);
      }

      if (Number.isFinite(decomposition.scaleY)) {
        node.scaleY(decomposition.scaleY);
      }

      if (Number.isFinite(decomposition.skewX)) {
        node.skewX(decomposition.skewX);
      }

      if (Number.isFinite(decomposition.skewY)) {
        node.skewY(decomposition.skewY);
      }

      if (Number.isFinite(decomposition.offsetX)) {
        node.offsetX(decomposition.offsetX);
      }

      if (Number.isFinite(decomposition.offsetY)) {
        node.offsetY(decomposition.offsetY);
      }

      if (typeof node.batchDraw === 'function') {
        node.batchDraw();
      }
    });

    proxy.getStage()?.batchDraw();
  }, []);

  const finalizeSelectionTransform = useCallback(() => {
    const proxy = selectionProxyRef.current;

    if (layerControls) {
      selectedLayerIds.forEach((layerId) => {
        const node = layerNodeRefs.current.get(layerId);
        if (!node) {
          return;
        }

        const position = node.position();
        layerControls.updateLayerPosition(layerId, {
          x: position.x,
          y: position.y,
        });

        const rotation = node.rotation();
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        if (typeof layerControls.updateLayerTransform === 'function') {
          layerControls.updateLayerTransform(layerId, {
            position: { x: position.x, y: position.y },
            rotation,
            scale: { x: scaleX, y: scaleY },
          });
        } else {
          if (typeof layerControls.updateLayerRotation === 'function') {
            layerControls.updateLayerRotation(layerId, rotation);
          }
          if (typeof layerControls.updateLayerScale === 'function') {
            layerControls.updateLayerScale(layerId, { x: scaleX, y: scaleY });
          }
        }
      });

      layerControls.ensureAllVisible();
    }

    selectionTransformStateRef.current = null;
    isSelectionTransformingRef.current = false;
    scheduleBoundsRefresh();
    proxy?.getLayer()?.batchDraw();
  }, [layerControls, scheduleBoundsRefresh, selectedLayerIds]);
  
  // Persist the proxy rotation when a selection transform finalizes so the visual selection keeps orientation
  const finalizeSelectionTransformWithRotation = useCallback(() => {
    const proxy = selectionProxyRef.current;
    if (proxy) {
      selectionProxyRotationRef.current = proxy.rotation() ?? selectionProxyRotationRef.current;
    }
    finalizeSelectionTransform();
  }, [finalizeSelectionTransform]);


  useEffect(() => {
    refreshBoundsFromSelection();
  }, [refreshBoundsFromSelection, layersRevision, scale]);

  useEffect(() => {
    if (!selectModeActive) {
      setSelectedLayerBounds(null);
      return;
    }

    refreshBoundsFromSelection();
  }, [selectModeActive, refreshBoundsFromSelection]);

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

  

  const handleTransformerTransformStart = useCallback(() => {
    isSelectionTransformingRef.current = true;
    captureSelectionTransformState();
  }, [captureSelectionTransformState]);

  const handleTransformerTransform = useCallback(() => {
    applySelectionTransformDelta();
    scheduleBoundsRefresh();
  }, [applySelectionTransformDelta, scheduleBoundsRefresh]);

  const handleTransformerTransformEnd = useCallback(() => {
    applySelectionTransformDelta();
    finalizeSelectionTransformWithRotation();
  }, [applySelectionTransformDelta, finalizeSelectionTransformWithRotation]);

  const handleSelectionProxyDragStart = useCallback(() => {
    if (!selectModeActive) {
      return;
    }
    isSelectionTransformingRef.current = true;
    captureSelectionTransformState();
    const stage = stageRef.current;
    if (stage) {
      stage.container().style.cursor = 'grabbing';
    }
  }, [captureSelectionTransformState, selectModeActive]);

  const handleSelectionProxyDragMove = useCallback(() => {
    if (!selectModeActive) {
      return;
    }
    applySelectionTransformDelta();
    scheduleBoundsRefresh();
  }, [applySelectionTransformDelta, scheduleBoundsRefresh, selectModeActive]);

  const handleSelectionProxyDragEnd = useCallback(() => {
    if (!selectModeActive) {
      return;
    }
    applySelectionTransformDelta();
    finalizeSelectionTransformWithRotation();
    const stage = stageRef.current;
    if (stage) {
      stage.container().style.cursor = 'pointer';
    }
  }, [applySelectionTransformDelta, finalizeSelectionTransformWithRotation, selectModeActive]);

  

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

  const clearSelection = useCallback(() => {
    if (layerControls && typeof layerControls.clearSelection === 'function') {
      layerControls.clearSelection();
    } else {
      pendingSelectionRef.current = null;
      setSelectedLayerBounds(null);
    }
  }, [layerControls]);

  const handleStageMouseDown = useCallback((event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!selectModeActive || !layerControls) return;

    // If the click is on the stage itself (i.e. not on any shape), clear selection
    if (event.target.getStage && event.target === event.target.getStage()) {
      clearSelection();
    }
  }, [selectModeActive, layerControls, clearSelection]);

  // Deselect when clicking anywhere outside the canvas container
  useEffect(() => {
    if (!selectModeActive || !layerControls) return;
    if (typeof document === 'undefined') return;

    const handleDocumentPointerDown = (ev: PointerEvent) => {
      const target = ev.target as Node | null;
      if (containerRef.current && target && containerRef.current.contains(target)) {
        // Click was inside the canvas container - ignore (stage handler handles background clicks)
        return;
      }

      clearSelection();
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown);
    return () => document.removeEventListener('pointerdown', handleDocumentPointerDown);
  }, [selectModeActive, layerControls, clearSelection]);

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
  const safeScale = Math.max(scale, 0.0001);
  const outlineDash: [number, number] = [8 / safeScale, 4 / safeScale];
  const transformerAnchorSize = Math.max(8 / safeScale, 6);
  const transformerAnchorStrokeWidth = Math.max(1 / safeScale, 0.75);
  const transformerAnchorCornerRadius = Math.max(2 / safeScale, 1);
  const transformerPadding = 0;
  const transformerHitStrokeWidth = Math.max(12 / safeScale, 6);

  const baseCursor = (isPointerPanning || isTouchPanning)
    ? 'grabbing'
    : (panModeActive || spacePressed ? 'grab' : 'default');

  useEffect(() => {
    if (!stageRef.current) {
      return;
    }

    stageRef.current.container().style.cursor = baseCursor;
  }, [baseCursor, selectModeActive]);

  const syncTransformerToSelection = useCallback(() => {
    const transformer = selectionTransformerRef.current;
    const proxy = selectionProxyRef.current;

    if (!transformer || !proxy) {
      return;
    }

    if (!selectModeActive || !selectedLayerBounds) {
      proxy.visible(false);
      transformer.nodes([]);
      transformer.visible(false);
      transformer.getLayer()?.batchDraw();
      return;
    }

    if (!isSelectionTransformingRef.current) {
      const minimumSize = 0.001;
      // axis-aligned bounding box from nodes
      const bboxW = Math.max(selectedLayerBounds.width, minimumSize);
      const bboxH = Math.max(selectedLayerBounds.height, minimumSize);
      const centerX = selectedLayerBounds.x + selectedLayerBounds.width / 2;
      const centerY = selectedLayerBounds.y + selectedLayerBounds.height / 2;

      // Determine desired rotation in degrees.
      // Prefer per-layer persisted rotation when a single layer is selected so
      // selection orientation isn't shared across different layers. For multi-
      // selection prefer the primary layer's rotation if available, otherwise
      // fall back to the transient selectionProxyRotationRef used during group transforms.
      let rotationDeg = 0;
      try {
        const selectedIds = layerControls?.selectedLayerIds ?? [];
        if (selectedIds.length === 1) {
          const single = layerControls?.layers.find((l) => l.id === selectedIds[0]);
          rotationDeg = single?.rotation ?? 0;
        } else if (layerControls?.primaryLayerId) {
          const primary = layerControls?.layers.find((l) => l.id === layerControls.primaryLayerId);
          rotationDeg = primary?.rotation ?? (selectionProxyRotationRef.current ?? 0);
        } else {
          rotationDeg = selectionProxyRotationRef.current ?? 0;
        }
      } catch (e) {
        rotationDeg = selectionProxyRotationRef.current ?? 0;
      }
      const rotationRad = (rotationDeg * Math.PI) / 180;

      // Compute absolute trig values for the rotation
      const a = Math.abs(Math.cos(rotationRad));
      const b = Math.abs(Math.sin(rotationRad));

      // Solve for local (unrotated) width/height so that when rotated by rotationDeg
      // the axis-aligned bounding box becomes [bboxW, bboxH].
      // [bboxW]   [ a  b ] [w]
      // [bboxH] = [ b  a ] [h]
      // Invert when possible: det = a^2 - b^2 = cos(2R)
      let localW = bboxW;
      let localH = bboxH;
      const denom = a * a - b * b;

      if (Math.abs(denom) < 1e-6) {
        // Near singular (around 45deg) – fall back to a square to avoid instability
        const maxSide = Math.max(bboxW, bboxH);
        localW = maxSide;
        localH = maxSide;
      } else {
        localW = (a * bboxW - b * bboxH) / denom;
        localH = (-b * bboxW + a * bboxH) / denom;

        // sanity clamps: ensure positive finite sizes
        if (!Number.isFinite(localW) || localW <= 0) {
          localW = bboxW;
        }
        if (!Number.isFinite(localH) || localH <= 0) {
          localH = bboxH;
        }
      }

      proxy.width(localW);
      proxy.height(localH);
      proxy.offset({
        x: localW / 2,
        y: localH / 2,
      });
      proxy.position({
        x: centerX,
        y: centerY,
      });
      proxy.rotation(rotationDeg);
      proxy.scale({ x: 1, y: 1 });
    }

    proxy.visible(true);

    transformer.nodes([proxy]);
    transformer.visible(true);
    transformer.forceUpdate();
    transformer.getLayer()?.batchDraw();
  }, [selectModeActive, selectedLayerBounds, layerControls, selectedLayerIds]);

  useEffect(() => {
    syncTransformerToSelection();
  }, [layersRevision, syncTransformerToSelection]);

  useEffect(() => {
    if (!pendingSelectionRef.current) {
      return;
    }

    const pending = pendingSelectionRef.current;
    if (pending.length !== selectedLayerIds.length) {
      return;
    }

    const matches = pending.every((id, index) => id === selectedLayerIds[index]);
    if (matches) {
      pendingSelectionRef.current = null;
    }
  }, [selectedLayerIds]);
  useEffect(() => {
    selectionTransformStateRef.current = null;
  }, [selectedLayerIds]);

  // Attach Konva stage listeners for background clicks (use Konva events to satisfy typings)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !selectModeActive) return;

    const handler = (event: any) => {
      if (event.target === event.target.getStage()) {
        clearSelection();
      }
    };

    stage.on('mousedown', handler);
    stage.on('touchstart', handler);

    return () => {
      stage.off('mousedown', handler);
      stage.off('touchstart', handler);
    };
  }, [selectModeActive, clearSelection]);

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
                    const isSelected = selectedLayerSet.has(layer.id);
                    const isPrimary = primaryLayerId === layer.id;
                    const isTop = index === 0;
                    const isBottom = index === layerControls.layers.length - 1;
                    const dropPosition =
                      dragOverLayer?.id === layer.id ? dragOverLayer.position : null;
                    const isDragging = draggingLayerId === layer.id;
                    const containerStyle: CSSProperties = {
                      border: `1px solid ${isSelected ? '#4a90e2' : '#e0e0e0'}`,
                      borderRadius: '8px',
                      padding: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      backgroundColor: isSelected ? '#f4f8ff' : '#ffffff',
                      opacity: isDragging ? 0.6 : 1,
                      position: 'relative',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                      boxShadow: isPrimary ? '0 0 0 2px rgba(74,144,226,0.25)' : undefined,
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
                        onDragStart={(event: KonvaEventObject<DragEvent>) => {
                          event.stopPropagation();
                          setDraggingLayerId(layer.id);
                          setDragOverLayer(null);
                          if (event.dataTransfer) {
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', layer.id);
                          }
                        }}
                        onDragEnd={(event: KonvaEventObject<DragEvent>) => {
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
                            onClick={(event) => {
                              // Multiselect disabled: always replace the current selection
                              // when clicking a layer in the layer panel. Previously the
                              // code respected shift/meta keys to support multi-select;
                              // that behavior is intentionally disabled.
                              pendingSelectionRef.current = layerControls.selectLayer(layer.id, { mode: 'replace' });
                            }}
                            style={{
                              flex: 1,
                              textAlign: 'left',
                              border: 'none',
                              background: 'transparent',
                              fontSize: '0.875rem',
                              fontWeight: isSelected ? 700 : 500,
                              color: '#333333',
                              cursor: 'pointer',
                            }}
                            aria-pressed={isSelected}
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
          cursor: baseCursor,
        }}
      >
        {renderableLayers && renderableLayers.length > 0 ? (
          renderableLayers.map((layer) => {
            const layerIsSelected = selectedLayerSet.has(layer.id);

            return (
              <Layer
                ref={(node) => {
                  if (node) {
                    layerNodeRefs.current.set(layer.id, node);
                    if (selectModeActive && layerIsSelected) {
                      updateBoundsFromLayerIds(pendingSelectionRef.current ?? selectedLayerIds);
                    }
                  } else {
                    layerNodeRefs.current.delete(layer.id);
                  }
                  syncTransformerToSelection();
                }}
                key={layer.id}
                id={`layer-${layer.id}`}
                visible={layer.visible}
                x={layer.position.x}
                y={layer.position.y}
                rotation={layer.rotation ?? 0}
                scaleX={layer.scale?.x ?? 1}
                scaleY={layer.scale?.y ?? 1}
                draggable={Boolean(selectModeActive)}
                onClick={(event: KonvaEventObject<MouseEvent>) => {
                  if (!selectModeActive || !layerControls) {
                    return;
                  }

                  event.cancelBubble = true;

                  // Multiselect disabled for canvas selection: always replace
                  // the selection when clicking a layer on the stage.
                  pendingSelectionRef.current = layerControls.selectLayer(layer.id, { mode: 'replace' });
                }}
                onTap={(event: KonvaEventObject<TouchEvent>) => {
                  if (!selectModeActive || !layerControls) {
                    return;
                  }

                  event.cancelBubble = true;
                  pendingSelectionRef.current = layerControls.selectLayer(layer.id, { mode: 'replace' });
                }}
                onPointerDown={(event: KonvaEventObject<PointerEvent>) => {
                  if (!selectModeActive || !layerControls) {
                    return;
                  }

                  // Multiselect disabled for pointer down selection: always
                  // replace selection on pointer down.
                  pendingSelectionRef.current = layerControls.selectLayer(layer.id, { mode: 'replace' });

                  const stage = event.target.getStage();
                  if (stage) {
                    stage.container().style.cursor = 'pointer';
                  }

                  event.cancelBubble = true;
                }}
                onPointerEnter={(event: KonvaEventObject<PointerEvent>) => {
                  const stage = event.target.getStage();
                  if (!stage) return;
                  stage.container().style.cursor = selectModeActive ? 'pointer' : baseCursor;
                }}
                onPointerLeave={(event: KonvaEventObject<PointerEvent>) => {
                  const stage = event.target.getStage();
                  if (!stage) return;
                  stage.container().style.cursor = baseCursor;
                }}
                onPointerUp={(event: KonvaEventObject<PointerEvent>) => {
                  if (!selectModeActive || !layerControls) {
                    return;
                  }

                  updateBoundsFromLayerIds(pendingSelectionRef.current ?? layerControls.selectedLayerIds);
                  const stage = event.target.getStage();
                  if (stage) {
                    stage.container().style.cursor = 'pointer';
                  }
                }}
                onDragStart={(event: KonvaEventObject<DragEvent>) => {
                  if (!selectModeActive || !layerControls) return;

                  event.cancelBubble = true;

                  const activeSelection = pendingSelectionRef.current ?? layerControls.selectedLayerIds;
                  const selection = activeSelection.includes(layer.id) ? activeSelection : [layer.id];

                  const initialPositions = new Map<string, PanOffset>();
                  selection.forEach((id) => {
                    const descriptor = layerControls.layers.find((entry) => entry.id === id);
                    if (descriptor) {
                      initialPositions.set(id, { ...descriptor.position });
                    }
                  });

                  if (!initialPositions.has(layer.id)) {
                    initialPositions.set(layer.id, { ...layer.position });
                  }

                  selectionDragStateRef.current = {
                    anchorLayerId: layer.id,
                    initialPositions,
                  };

                  const stage = event.target.getStage();
                  if (stage) {
                    stage.container().style.cursor = 'grabbing';
                  }
                }}
                onDragMove={(event: KonvaEventObject<DragEvent>) => {
                  if (!selectModeActive || !layerControls) return;

                  const dragState = selectionDragStateRef.current;
                  const activeSelection = pendingSelectionRef.current ?? layerControls.selectedLayerIds;

                  if (!dragState) {
                    updateBoundsFromLayerIds(activeSelection);
                    event.target.getStage()?.batchDraw();
                    return;
                  }

                  const anchorInitial = dragState.initialPositions.get(layer.id);
                  if (!anchorInitial) {
                    return;
                  }

                  const currentPosition = event.target.position();
                  const deltaX = currentPosition.x - anchorInitial.x;
                  const deltaY = currentPosition.y - anchorInitial.y;

                  activeSelection.forEach((id) => {
                    if (id === layer.id) {
                      return;
                    }
                    const original = dragState.initialPositions.get(id);
                    const node = layerNodeRefs.current.get(id);
                    if (!original || !node) {
                      return;
                    }
                    node.position({
                      x: original.x + deltaX,
                      y: original.y + deltaY,
                    });
                  });

                  updateBoundsFromLayerIds(activeSelection);
                  event.target.getStage()?.batchDraw();
                }}
                onDragEnd={(event: KonvaEventObject<DragEvent>) => {
                  if (!selectModeActive || !layerControls) return;

                  const dragState = selectionDragStateRef.current;
                  selectionDragStateRef.current = null;

                  const activeSelection = (pendingSelectionRef.current ?? layerControls.selectedLayerIds).slice();
                  pendingSelectionRef.current = null;

                  const idsToUpdate = dragState?.initialPositions ? activeSelection : [layer.id];

                  idsToUpdate.forEach((id) => {
                    const node = id === layer.id ? event.target : layerNodeRefs.current.get(id);
                    if (!node) {
                      return;
                    }
                    const position = node.position();
                    layerControls.updateLayerPosition(id, {
                      x: position.x,
                      y: position.y,
                    });
                  });

                  layerControls.ensureAllVisible();
                  updateBoundsFromLayerIds(layerControls.selectedLayerIds);

                  const stage = event.target.getStage();
                  if (stage) {
                    stage.container().style.cursor = 'pointer';
                  }
                  event.target.getStage()?.batchDraw();
                }}
              >
                {layer.render()}
              </Layer>
            );
          })
        ) : (
          <Layer>
            {children}
          </Layer>
        )}
        {selectModeActive && (
          <Layer listening={Boolean(selectedLayerIds.length > 0)}>
            <Rect
              ref={selectionProxyRef}
              x={0}
              y={0}
              width={0}
              height={0}
              opacity={0.001}
              fill="#ffffff"
              strokeEnabled={false}
              listening={Boolean(selectedLayerBounds && selectedLayerIds.length > 0)}
              draggable
              perfectDrawEnabled={false}
              onDragStart={handleSelectionProxyDragStart}
              onDragMove={handleSelectionProxyDragMove}
              onDragEnd={handleSelectionProxyDragEnd}
            />
            <Transformer
              ref={selectionTransformerRef}
              rotateEnabled
              resizeEnabled
              visible={Boolean(selectedLayerBounds && selectedLayerIds.length > 0)}
              anchorSize={transformerAnchorSize}
              anchorCornerRadius={transformerAnchorCornerRadius}
              anchorStroke="#00f6ff"
              anchorFill="#00f6ff"
              anchorStrokeWidth={transformerAnchorStrokeWidth}
              anchorHitStrokeWidth={transformerHitStrokeWidth}
              borderStroke="#00f6ff"
              borderStrokeWidth={transformerAnchorStrokeWidth}
              borderDash={outlineDash}
              padding={transformerPadding}
              ignoreStroke={false}
              onTransformStart={handleTransformerTransformStart}
              onTransform={handleTransformerTransform}
              onTransformEnd={handleTransformerTransformEnd}
            />
          </Layer>
        )}
      </Stage>
    </div>
  );
};
