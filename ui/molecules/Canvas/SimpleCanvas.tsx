/**
 * Atomic Design - Molecule: SimpleCanvas
 * Combines Stage and Layer atoms into a basic canvas with zoom support
 * REFACTORED: Now uses atomic components and extracted utilities
 */

import { useRef, useEffect, useState, useCallback, useLayoutEffect, useMemo } from 'react';
import type { ReactNode, CSSProperties, DragEvent } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@store/CanvasApp';
import { Stage, Layer } from '@atoms/Canvas';
import { Rect, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type {
  PanOffset,
  ScaleVector,
  PointerPanState,
  TouchPanState,
  SelectionDragState,
  SelectionNodeSnapshot,
  SelectionTransformSnapshot,
  LayerControlHandlers,
  LayerDescriptor,
  LayerMoveDirection,
  LayerSelectionMode,
  LayerSelectionOptions,
  Bounds,
  SimpleCanvasProps,
} from './types/canvas.types';
import {
  isFiniteNumber,
  normaliseBounds,
  computeNodeBounds,
  areBoundsEqual,
} from './utils';
import { SelectionBox, KonvaSelectionBox } from '@molecules/Selection';
import type { KonvaOverlayBox } from '@molecules/Selection';

const MIN_ZOOM = -100;
const MAX_ZOOM = 200;
const WHEEL_ZOOM_STEP = 5;
const KEYBOARD_ZOOM_STEP = 10;
const PINCH_ZOOM_SENSITIVITY = 50;
const TOUCH_DELTA_THRESHOLD = 0.5;
const MIN_EFFECTIVE_SCALE = 0.05;
const BOUNDS_RETRY_LIMIT = 4;
const MIN_PROXY_DIMENSION = 1;

const clampZoomValue = (value: number): number => {
  /**
   * max - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} MIN_ZOOM - Parameter derived from the static analyzer.
   * @param {*} Math.min(MAX_ZOOM - Parameter derived from the static analyzer.
   * @param {*} value - Parameter derived from the static analyzer.
   */
  /**
   * max - Auto-generated documentation stub.
   *
   * @param {*} MIN_ZOOM - Parameter forwarded to max.
   * @param {*} Math.min(MAX_ZOOM - Parameter forwarded to max.
   * @param {*} value - Parameter forwarded to max.
   */
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
};

/**
 * SimpleCanvas Molecule - A ready-to-use canvas with stage and layer
 * Provides zoom functionality where:
 * - zoom = 0 (default): Stage fits to container
 /**
/**
 * SimpleCanvas Molecule - A ready-to-use canvas with stage and layer
 * Provides zoom functionality where:
 * - zoom = 0 (default): Stage fits to container
 * - zoom greater than 0: Zoom in (percentage increase)
 * - zoom less than 0: Zoom out (percentage decrease)
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
  // Get active tool from Redux store
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
  const isSelectToolActive = useSelector((state: RootState) => state.view.select.active);
  
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
  const pointerPanState = useRef<PointerPanState | null>(null);
  const touchPanState = useRef<TouchPanState | null>(null);
  const selectionDragStateRef = useRef<SelectionDragState | null>(null);
  const pendingSelectionRef = useRef<string[] | null>(null);
  const selectionTransformerRef = useRef<Konva.Transformer | null>(null);
  const selectionProxyRef = useRef<Konva.Rect | null>(null);
  const selectionTransformStateRef = useRef<SelectionTransformSnapshot | null>(null);
  const selectionProxyRotationRef = useRef<number>(0);
  const transformAnimationFrameRef = useRef<number | null>(null);
  /**
   * useRef - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {false} Refer to the implementation for the precise returned value.
   */
  /**
   * useRef - Auto-generated documentation stub.
   *
   * @returns {false} Result produced by useRef.
   */
  const isSelectionTransformingRef = useRef(false);
  const overlayDragState = useRef<
    | null
    | {
        pointerId: number;
        startX: number;
        startY: number;
        initialPositions: Map<string, { x: number; y: number }>;
      }
  >(null);
  const overlayResizeState = useRef<
    | null
    | {
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
  >(null);
  /**
   * useState - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {1} Refer to the implementation for the precise returned value.
   */
  /**
   * useState - Auto-generated documentation stub.
   *
   * @returns {1} Result produced by useState.
   */
  const [scale, setScale] = useState(1);
  const [internalZoom, setInternalZoom] = useState<number>(zoom);
  const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 1024, height: 1024 });
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
  const [spacePressed, setSpacePressed] = useState(false);
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
  const layerButtonRef = useRef<HTMLButtonElement | null>(null);
  const layerPanelRef = useRef<HTMLDivElement | null>(null);
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
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [dragOverLayer, setDragOverLayer] = useState<{
    id: string;
    position: 'above' | 'below';
  } | null>(null);
  const [selectedLayerBounds, setSelectedLayerBounds] = useState<Bounds | null>(null);
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
  const [isInteractingWithSelection, setIsInteractingWithSelection] = useState(false);
  const [overlaySelectionBox, setOverlaySelectionBox] = useState<
    | { x: number; y: number; width: number; height: number; rotation?: number }
    | null
  >(null);
  /**
   * Map - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * Map - Auto-generated documentation stub.
   */
  const layerNodeRefs = useRef<Map<string, Konva.Layer>>(new Map());
  /**
   * reverse - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {null;} Refer to the implementation for the precise returned value.
   */
  /**
   * reverse - Auto-generated documentation stub.
   *
   * @returns {null;} Result produced by reverse.
   */
  const renderableLayers = layerControls ? [...layerControls.layers].reverse() : null;
  const selectedLayerIds = layerControls?.selectedLayerIds ?? [];
  /**
   * useMemo - Auto-generated summary; refine if additional context is needed.
   */
  const selectedLayerSet = useMemo(() => new Set(selectedLayerIds), [selectedLayerIds]);
  const primaryLayerId = layerControls?.primaryLayerId ?? null;

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  useEffect(() => {
    /**
     * return - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * return - Auto-generated documentation stub.
     */
    return () => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (transformAnimationFrameRef.current !== null && typeof window !== 'undefined') {
        /**
         * cancelAnimationFrame - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {transformAnimationFrameRef.current} Refer to the implementation for the precise returned value.
         */
        /**
         * cancelAnimationFrame - Auto-generated documentation stub.
         *
         * @returns {transformAnimationFrameRef.current} Result produced by cancelAnimationFrame.
         */
        window.cancelAnimationFrame(transformAnimationFrameRef.current);
      }
    };
  }, [layerControls]);

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!layerControls || !stageRef.current} Refer to the implementation for the precise returned value.
     */
    if (!layerControls || !stageRef.current) {
      return;
    }

    /**
     * batchDraw - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * batchDraw - Auto-generated documentation stub.
     */
    stageRef.current.batchDraw();
  }, [layerControls, layersRevision, selectModeActive]);

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  useEffect(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (zoom === 0 && (panOffsetRef.current.x !== 0 || panOffsetRef.current.y !== 0)) {
      /**
       * setPanOffset - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} { x - Parameter derived from the static analyzer.
       * @param {*} y - Parameter derived from the static analyzer.
       *
       * @returns {{ x: 0, y: 0 }} Refer to the implementation for the precise returned value.
       */
      /**
       * setPanOffset - Auto-generated documentation stub.
       *
       * @param {*} { x - Parameter forwarded to setPanOffset.
       * @param {*} y - Parameter forwarded to setPanOffset.
       *
       * @returns {{ x: 0, y: 0 }} Result produced by setPanOffset.
       */
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoom]);

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!copyFeedback} Refer to the implementation for the precise returned value.
     */
    if (!copyFeedback) {
      return;
    }

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (typeof window === 'undefined') {
      return;
    }

    /**
     * setTimeout - Auto-generated summary; refine if additional context is needed.
     */
    const timeoutId = window.setTimeout(() => setCopyFeedback(null), 2000);
    /**
     * return - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * return - Auto-generated documentation stub.
     */
    return () => window.clearTimeout(timeoutId);
  }, [copyFeedback]);

  const updateBoundsFromLayerIds = useCallback(
    (layerIds: string[] | null | undefined, attempt: number = 0) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!selectModeActive} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {!selectModeActive} Result produced by if.
       */
      if (!selectModeActive) {
        /**
         * setSelectedLayerBounds - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {null} Refer to the implementation for the precise returned value.
         */
        /**
         * setSelectedLayerBounds - Auto-generated documentation stub.
         *
         * @returns {null} Result produced by setSelectedLayerBounds.
         */
        setSelectedLayerBounds(null);
        return;
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (!layerIds || layerIds.length === 0) {
        /**
         * setSelectedLayerBounds - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {null} Refer to the implementation for the precise returned value.
         */
        setSelectedLayerBounds(null);
        return;
      }

      const stage = stageRef.current;
      const nodes = layerIds
        /**
         * map - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * map - Auto-generated documentation stub.
         */
        .map((layerId) => {
          /**
           * get - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {layerId} Refer to the implementation for the precise returned value.
           */
          /**
           * get - Auto-generated documentation stub.
           *
           * @returns {layerId} Result produced by get.
           */
          const cachedNode = layerNodeRefs.current.get(layerId);
          /**
           * findOne - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {`#layer-${layerId}`} Refer to the implementation for the precise returned value.
           */
          /**
           * findOne - Auto-generated documentation stub.
           *
           * @returns {`#layer-${layerId}`} Result produced by findOne.
           */
          return cachedNode ?? stage?.findOne(`#layer-${layerId}`) ?? null;
        })
        /**
         * filter - Auto-generated summary; refine if additional context is needed.
         */
        .filter((node): node is Konva.Layer => Boolean(node));

      /**
       * log - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} '[updateBounds] attempt - Parameter derived from the static analyzer.
       * @param {*} attempt - Parameter derived from the static analyzer.
       * @param {*} 'layerIds - Parameter derived from the static analyzer.
       * @param {*} layerIds.length - Parameter derived from the static analyzer.
       * @param {*} 'nodes found - Parameter derived from the static analyzer.
       * @param {*} nodes.length - Parameter derived from the static analyzer.
       *
       * @returns {'[updateBounds] attempt:', attempt, 'layerIds:', layerIds.length, 'nodes found:', nodes.length} Refer to the implementation for the precise returned value.
       */
      /**
       * log - Auto-generated documentation stub.
       *
       * @param {*} '[updateBounds] attempt - Parameter forwarded to log.
       * @param {*} attempt - Parameter forwarded to log.
       * @param {*} 'layerIds - Parameter forwarded to log.
       * @param {*} layerIds.length - Parameter forwarded to log.
       * @param {*} 'nodes found - Parameter forwarded to log.
       * @param {*} nodes.length - Parameter forwarded to log.
       *
       * @returns {'[updateBounds] attempt:', attempt, 'layerIds:', layerIds.length, 'nodes found:', nodes.length} Result produced by log.
       */
      console.log('[updateBounds] attempt:', attempt, 'layerIds:', layerIds.length, 'nodes found:', nodes.length);

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (nodes.length !== layerIds.length) {
        /**
         * log - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} '[updateBounds] Missing nodes - Parameter derived from the static analyzer.
         * @param {*} scheduling retry' - Parameter derived from the static analyzer.
         *
         * @returns {'[updateBounds] Missing nodes, scheduling retry'} Refer to the implementation for the precise returned value.
         */
        /**
         * log - Auto-generated documentation stub.
         *
         * @param {*} '[updateBounds] Missing nodes - Parameter forwarded to log.
         * @param {*} scheduling retry' - Parameter forwarded to log.
         *
         * @returns {'[updateBounds] Missing nodes, scheduling retry'} Result produced by log.
         */
        console.log('[updateBounds] Missing nodes, scheduling retry');
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * if - Auto-generated documentation stub.
         */
        if (attempt < BOUNDS_RETRY_LIMIT && typeof window !== 'undefined') {
          /**
           * requestAnimationFrame - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * requestAnimationFrame - Auto-generated documentation stub.
           */
          window.requestAnimationFrame(() => updateBoundsFromLayerIds(layerIds, attempt + 1));
        }
        return;
      }

      const boundsList = nodes
        /**
         * map - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * map - Auto-generated documentation stub.
         */
        .map((node) => computeNodeBounds(node))
        /**
         * filter - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * filter - Auto-generated documentation stub.
         */
        .filter((bounds): bounds is Bounds => Boolean(bounds) && bounds.width > 0 && bounds.height > 0);

      /**
       * log - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} '[updateBounds] boundsList - Parameter derived from the static analyzer.
       * @param {*} boundsList.length - Parameter derived from the static analyzer.
       * @param {*} 'from' - Parameter derived from the static analyzer.
       * @param {*} nodes.length - Parameter derived from the static analyzer.
       * @param {*} 'nodes' - Parameter derived from the static analyzer.
       *
       * @returns {'[updateBounds] boundsList:', boundsList.length, 'from', nodes.length, 'nodes'} Refer to the implementation for the precise returned value.
       */
      /**
       * log - Auto-generated documentation stub.
       *
       * @param {*} '[updateBounds] boundsList - Parameter forwarded to log.
       * @param {*} boundsList.length - Parameter forwarded to log.
       * @param {*} 'from' - Parameter forwarded to log.
       * @param {*} nodes.length - Parameter forwarded to log.
       * @param {*} 'nodes' - Parameter forwarded to log.
       *
       * @returns {'[updateBounds] boundsList:', boundsList.length, 'from', nodes.length, 'nodes'} Result produced by log.
       */
      console.log('[updateBounds] boundsList:', boundsList.length, 'from', nodes.length, 'nodes');

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (boundsList.length === 0) {
        /**
         * log - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * log - Auto-generated documentation stub.
         */
        console.log('[updateBounds] No valid bounds (zero dimensions), scheduling retry');
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * if - Auto-generated documentation stub.
         */
        if (attempt < BOUNDS_RETRY_LIMIT && typeof window !== 'undefined') {
          /**
           * requestAnimationFrame - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * requestAnimationFrame - Auto-generated documentation stub.
           */
          window.requestAnimationFrame(() => updateBoundsFromLayerIds(layerIds, attempt + 1));
        }
        return;
      }

      const unifiedBounds = boundsList.reduce<Bounds>((accumulator, bounds) => {
        /**
         * min - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} accumulator.x - Parameter derived from the static analyzer.
         * @param {*} bounds.x - Parameter derived from the static analyzer.
         *
         * @returns {accumulator.x, bounds.x} Refer to the implementation for the precise returned value.
         */
        /**
         * min - Auto-generated documentation stub.
         *
         * @param {*} accumulator.x - Parameter forwarded to min.
         * @param {*} bounds.x - Parameter forwarded to min.
         *
         * @returns {accumulator.x, bounds.x} Result produced by min.
         */
        const minX = Math.min(accumulator.x, bounds.x);
        /**
         * min - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} accumulator.y - Parameter derived from the static analyzer.
         * @param {*} bounds.y - Parameter derived from the static analyzer.
         *
         * @returns {accumulator.y, bounds.y} Refer to the implementation for the precise returned value.
         */
        /**
         * min - Auto-generated documentation stub.
         *
         * @param {*} accumulator.y - Parameter forwarded to min.
         * @param {*} bounds.y - Parameter forwarded to min.
         *
         * @returns {accumulator.y, bounds.y} Result produced by min.
         */
        const minY = Math.min(accumulator.y, bounds.y);
        /**
         * max - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} accumulator.x + accumulator.width - Parameter derived from the static analyzer.
         * @param {*} bounds.x + bounds.width - Parameter derived from the static analyzer.
         *
         * @returns {accumulator.x + accumulator.width, bounds.x + bounds.width} Refer to the implementation for the precise returned value.
         */
        /**
         * max - Auto-generated documentation stub.
         *
         * @param {*} accumulator.x + accumulator.width - Parameter forwarded to max.
         * @param {*} bounds.x + bounds.width - Parameter forwarded to max.
         *
         * @returns {accumulator.x + accumulator.width, bounds.x + bounds.width} Result produced by max.
         */
        const maxX = Math.max(accumulator.x + accumulator.width, bounds.x + bounds.width);
        /**
         * max - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} accumulator.y + accumulator.height - Parameter derived from the static analyzer.
         * @param {*} bounds.y + bounds.height - Parameter derived from the static analyzer.
         *
         * @returns {accumulator.y + accumulator.height, bounds.y + bounds.height} Refer to the implementation for the precise returned value.
         */
        /**
         * max - Auto-generated documentation stub.
         *
         * @param {*} accumulator.y + accumulator.height - Parameter forwarded to max.
         * @param {*} bounds.y + bounds.height - Parameter forwarded to max.
         *
         * @returns {accumulator.y + accumulator.height, bounds.y + bounds.height} Result produced by max.
         */
        const maxY = Math.max(accumulator.y + accumulator.height, bounds.y + bounds.height);

        return {
          x: minX,
          y: minY,
          /**
           * max - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} 0 - Parameter derived from the static analyzer.
           * @param {*} maxX - minX - Parameter derived from the static analyzer.
           *
           * @returns {0, maxX - minX} Refer to the implementation for the precise returned value.
           */
          /**
           * max - Auto-generated documentation stub.
           *
           * @param {*} 0 - Parameter forwarded to max.
           * @param {*} maxX - minX - Parameter forwarded to max.
           *
           * @returns {0, maxX - minX} Result produced by max.
           */
          width: Math.max(0, maxX - minX),
          /**
           * max - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} 0 - Parameter derived from the static analyzer.
           * @param {*} maxY - minY - Parameter derived from the static analyzer.
           *
           * @returns {0, maxY - minY} Refer to the implementation for the precise returned value.
           */
          /**
           * max - Auto-generated documentation stub.
           *
           * @param {*} 0 - Parameter forwarded to max.
           * @param {*} maxY - minY - Parameter forwarded to max.
           *
           * @returns {0, maxY - minY} Result produced by max.
           */
          height: Math.max(0, maxY - minY),
        };
      }, boundsList[0]);

      /**
       * log - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} '[updateBounds] Setting bounds - Parameter derived from the static analyzer.
       * @param {*} unifiedBounds - Parameter derived from the static analyzer.
       *
       * @returns {'[updateBounds] Setting bounds:', unifiedBounds} Refer to the implementation for the precise returned value.
       */
      /**
       * log - Auto-generated documentation stub.
       *
       * @param {*} '[updateBounds] Setting bounds - Parameter forwarded to log.
       * @param {*} unifiedBounds - Parameter forwarded to log.
       *
       * @returns {'[updateBounds] Setting bounds:', unifiedBounds} Result produced by log.
       */
      console.log('[updateBounds] Setting bounds:', unifiedBounds);
      /**
       * setSelectedLayerBounds - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * setSelectedLayerBounds - Auto-generated documentation stub.
       */
      setSelectedLayerBounds((previous) => (areBoundsEqual(previous, unifiedBounds) ? previous : unifiedBounds));
      /**
       * getStage - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * getStage - Auto-generated documentation stub.
       */
      nodes[0]?.getStage()?.batchDraw();
    },
    [selectModeActive]
  );

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   */
  const refreshBoundsFromSelection = useCallback(() => {
    const targetIds = pendingSelectionRef.current ?? layerControls?.selectedLayerIds ?? null;
    /**
     * updateBoundsFromLayerIds - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {targetIds} Refer to the implementation for the precise returned value.
     */
    updateBoundsFromLayerIds(targetIds);
  }, [layerControls?.selectedLayerIds, updateBoundsFromLayerIds]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   */
  const scheduleBoundsRefresh = useCallback(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!selectModeActive} Refer to the implementation for the precise returned value.
     */
    if (!selectModeActive) {
      return;
    }

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (typeof window === 'undefined') {
      /**
       * refreshBoundsFromSelection - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * refreshBoundsFromSelection - Auto-generated documentation stub.
       */
      refreshBoundsFromSelection();
      return;
    }

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    if (transformAnimationFrameRef.current !== null) {
      return;
    }

    /**
     * requestAnimationFrame - Auto-generated summary; refine if additional context is needed.
     */
    transformAnimationFrameRef.current = window.requestAnimationFrame(() => {
      transformAnimationFrameRef.current = null;
      /**
       * refreshBoundsFromSelection - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * refreshBoundsFromSelection - Auto-generated documentation stub.
       */
      refreshBoundsFromSelection();
    });
  }, [refreshBoundsFromSelection, selectModeActive]);

  const getLayerRotation = useCallback(
    (layerId: string | null | undefined): number | null => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!layerId} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {!layerId} Result produced by if.
       */
      if (!layerId) {
        return null;
      }

      /**
       * get - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {layerId} Refer to the implementation for the precise returned value.
       */
      /**
       * get - Auto-generated documentation stub.
       *
       * @returns {layerId} Result produced by get.
       */
      const node = layerNodeRefs.current.get(layerId);
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {node} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {node} Result produced by if.
       */
      if (node) {
        /**
         * rotation - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * rotation - Auto-generated documentation stub.
         */
        const nodeRotation = node.rotation();
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * if - Auto-generated documentation stub.
         */
        if (Number.isFinite(nodeRotation)) {
          return nodeRotation;
        }
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!layerControls} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {!layerControls} Result produced by if.
       */
      if (!layerControls) {
        return null;
      }

      /**
       * find - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * find - Auto-generated documentation stub.
       */
      const descriptor = layerControls.layers.find((layer) => layer.id === layerId);
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!descriptor} Refer to the implementation for the precise returned value.
       */
      if (!descriptor) {
        return null;
      }

      const descriptorRotation = descriptor.rotation ?? 0;
      /**
       * isFinite - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {descriptorRotation} Refer to the implementation for the precise returned value.
       */
      /**
       * isFinite - Auto-generated documentation stub.
       *
       * @returns {descriptorRotation} Result produced by isFinite.
       */
      return Number.isFinite(descriptorRotation) ? descriptorRotation : 0;
    },
    [layerControls]
  );

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   */
  const resolveSelectionRotation = useCallback((): number => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (!layerControls || selectedLayerIds.length === 0) {
      return 0;
    }

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    if (selectedLayerIds.length === 1) {
      /**
       * getLayerRotation - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {selectedLayerIds[0]} Refer to the implementation for the precise returned value.
       */
      return getLayerRotation(selectedLayerIds[0]) ?? 0;
    }

    return (
      /**
       * getLayerRotation - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {layerControls.primaryLayerId} Refer to the implementation for the precise returned value.
       */
      /**
       * getLayerRotation - Auto-generated documentation stub.
       *
       * @returns {layerControls.primaryLayerId} Result produced by getLayerRotation.
       */
      getLayerRotation(layerControls.primaryLayerId) ??
      /**
       * getLayerRotation - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {selectedLayerIds[0]} Refer to the implementation for the precise returned value.
       */
      /**
       * getLayerRotation - Auto-generated documentation stub.
       *
       * @returns {selectedLayerIds[0]} Result produced by getLayerRotation.
       */
      getLayerRotation(selectedLayerIds[0]) ??
      0
    );
  }, [getLayerRotation, layerControls, selectedLayerIds]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   */
  const captureSelectionTransformState = useCallback(() => {
    const proxy = selectionProxyRef.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!proxy} Refer to the implementation for the precise returned value.
     */
    if (!proxy) {
      selectionTransformStateRef.current = null;
      return;
    }

    // Capture current proxy rotation so we can persist it when not actively transforming
    /**
     * rotation - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * rotation - Auto-generated documentation stub.
     */
    selectionProxyRotationRef.current = proxy.rotation() ?? 0;

    const nodeSnapshots = selectedLayerIds
      /**
       * map - Auto-generated summary; refine if additional context is needed.
       */
      .map((layerId) => {
        /**
         * get - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {layerId} Refer to the implementation for the precise returned value.
         */
        /**
         * get - Auto-generated documentation stub.
         *
         * @returns {layerId} Result produced by get.
         */
        const node = layerNodeRefs.current.get(layerId);
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {!node} Refer to the implementation for the precise returned value.
         */
        /**
         * if - Auto-generated documentation stub.
         *
         * @returns {!node} Result produced by if.
         */
        if (!node) {
          return null;
        }

        return {
          id: layerId,
          node,
          /**
           * getAbsoluteTransform - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * getAbsoluteTransform - Auto-generated documentation stub.
           */
          transform: node.getAbsoluteTransform().copy(),
        };
      })
      /**
       * filter - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * filter - Auto-generated documentation stub.
       */
      .filter((snapshot): snapshot is SelectionNodeSnapshot => Boolean(snapshot));

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (nodeSnapshots.length === 0) {
      selectionTransformStateRef.current = null;
      return;
    }

    selectionTransformStateRef.current = {
      /**
       * getAbsoluteTransform - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * getAbsoluteTransform - Auto-generated documentation stub.
       */
      proxyTransform: proxy.getAbsoluteTransform().copy(),
      nodes: nodeSnapshots,
    };
  }, [selectedLayerIds]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   */
  const applySelectionTransformDelta = useCallback(() => {
    const snapshot = selectionTransformStateRef.current;
    const proxy = selectionProxyRef.current;

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!snapshot || !proxy} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {!snapshot || !proxy} Result produced by if.
     */
    if (!snapshot || !proxy) {
      return;
    }

    /**
     * getAbsoluteTransform - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * getAbsoluteTransform - Auto-generated documentation stub.
     */
    const currentProxyTransform = proxy.getAbsoluteTransform();
    const initialProxyTransform = snapshot.proxyTransform;

    /**
     * copy - Auto-generated summary; refine if additional context is needed.
     */
    const initialInverse = initialProxyTransform.copy().invert();
    /**
     * copy - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * copy - Auto-generated documentation stub.
     */
    const delta = currentProxyTransform.copy();
    /**
     * multiply - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {initialInverse} Refer to the implementation for the precise returned value.
     */
    /**
     * multiply - Auto-generated documentation stub.
     *
     * @returns {initialInverse} Result produced by multiply.
     */
    delta.multiply(initialInverse);

    /**
     * forEach - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} ({ node - Parameter derived from the static analyzer.
     * @param {*} transform } - Parameter derived from the static analyzer.
     */
    /**
     * forEach - Auto-generated documentation stub.
     *
     * @param {*} ({ node - Parameter forwarded to forEach.
     * @param {*} transform } - Parameter forwarded to forEach.
     */
    snapshot.nodes.forEach(({ node, transform }) => {
      /**
       * copy - Auto-generated summary; refine if additional context is needed.
       */
      const absoluteTransform = delta.copy().multiply(transform);

      /**
       * getParent - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * getParent - Auto-generated documentation stub.
       */
      const parent = node.getParent();
      const localTransform = parent
        /**
         * getAbsoluteTransform - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * getAbsoluteTransform - Auto-generated documentation stub.
         */
        ? parent.getAbsoluteTransform().copy().invert().multiply(absoluteTransform)
        : absoluteTransform;

      /**
       * decompose - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * decompose - Auto-generated documentation stub.
       */
      const decomposition = localTransform.decompose();

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (Number.isFinite(decomposition.x) && Number.isFinite(decomposition.y)) {
        node.position({
          x: decomposition.x,
          y: decomposition.y,
        });
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (Number.isFinite(decomposition.rotation)) {
        /**
         * rotation - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {decomposition.rotation} Refer to the implementation for the precise returned value.
         */
        node.rotation(decomposition.rotation);
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (Number.isFinite(decomposition.scaleX)) {
        /**
         * scaleX - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {decomposition.scaleX} Refer to the implementation for the precise returned value.
         */
        node.scaleX(decomposition.scaleX);
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (Number.isFinite(decomposition.scaleY)) {
        /**
         * scaleY - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {decomposition.scaleY} Refer to the implementation for the precise returned value.
         */
        node.scaleY(decomposition.scaleY);
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (Number.isFinite(decomposition.skewX)) {
        /**
         * skewX - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {decomposition.skewX} Refer to the implementation for the precise returned value.
         */
        node.skewX(decomposition.skewX);
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (Number.isFinite(decomposition.skewY)) {
        /**
         * skewY - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {decomposition.skewY} Refer to the implementation for the precise returned value.
         */
        node.skewY(decomposition.skewY);
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (Number.isFinite(decomposition.offsetX)) {
        /**
         * offsetX - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {decomposition.offsetX} Refer to the implementation for the precise returned value.
         */
        node.offsetX(decomposition.offsetX);
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (Number.isFinite(decomposition.offsetY)) {
        /**
         * offsetY - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {decomposition.offsetY} Refer to the implementation for the precise returned value.
         */
        node.offsetY(decomposition.offsetY);
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (typeof node.batchDraw === 'function') {
        /**
         * batchDraw - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * batchDraw - Auto-generated documentation stub.
         */
        node.batchDraw();
      }
    });

    /**
     * getStage - Auto-generated summary; refine if additional context is needed.
     */
    proxy.getStage()?.batchDraw();
  }, []);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  const finalizeSelectionTransform = useCallback(() => {
    const proxy = selectionProxyRef.current;

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {layerControls} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {layerControls} Result produced by if.
     */
    if (layerControls) {
      /**
       * forEach - Auto-generated summary; refine if additional context is needed.
       */
      selectedLayerIds.forEach((layerId) => {
        /**
         * get - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {layerId} Refer to the implementation for the precise returned value.
         */
        /**
         * get - Auto-generated documentation stub.
         *
         * @returns {layerId} Result produced by get.
         */
        const node = layerNodeRefs.current.get(layerId);
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {!node} Refer to the implementation for the precise returned value.
         */
        /**
         * if - Auto-generated documentation stub.
         *
         * @returns {!node} Result produced by if.
         */
        if (!node) {
          return;
        }

        /**
         * position - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * position - Auto-generated documentation stub.
         */
        const position = node.position();
        layerControls.updateLayerPosition(layerId, {
          x: position.x,
          y: position.y,
        });

        /**
         * rotation - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * rotation - Auto-generated documentation stub.
         */
        const rotation = node.rotation();
        /**
         * scaleX - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * scaleX - Auto-generated documentation stub.
         */
        const scaleX = node.scaleX();
        /**
         * scaleY - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * scaleY - Auto-generated documentation stub.
         */
        const scaleY = node.scaleY();

        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * if - Auto-generated documentation stub.
         */
        if (typeof layerControls.updateLayerTransform === 'function') {
          layerControls.updateLayerTransform(layerId, {
            position: { x: position.x, y: position.y },
            rotation,
            scale: { x: scaleX, y: scaleY },
          });
        } else {
          /**
           * if - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * if - Auto-generated documentation stub.
           */
          if (typeof layerControls.updateLayerRotation === 'function') {
            /**
             * updateLayerRotation - Auto-generated summary; refine if additional context is needed.
             *
             * @param {*} layerId - Parameter derived from the static analyzer.
             * @param {*} rotation - Parameter derived from the static analyzer.
             *
             * @returns {layerId, rotation} Refer to the implementation for the precise returned value.
             */
            /**
             * updateLayerRotation - Auto-generated documentation stub.
             *
             * @param {*} layerId - Parameter forwarded to updateLayerRotation.
             * @param {*} rotation - Parameter forwarded to updateLayerRotation.
             *
             * @returns {layerId, rotation} Result produced by updateLayerRotation.
             */
            layerControls.updateLayerRotation(layerId, rotation);
          }
          /**
           * if - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * if - Auto-generated documentation stub.
           */
          if (typeof layerControls.updateLayerScale === 'function') {
            /**
             * updateLayerScale - Auto-generated summary; refine if additional context is needed.
             *
             * @param {*} layerId - Parameter derived from the static analyzer.
             * @param {*} { x - Parameter derived from the static analyzer.
             * @param {*} y - Parameter derived from the static analyzer.
             *
             * @returns {layerId, { x: scaleX, y: scaleY }} Refer to the implementation for the precise returned value.
             */
            /**
             * updateLayerScale - Auto-generated documentation stub.
             *
             * @param {*} layerId - Parameter forwarded to updateLayerScale.
             * @param {*} { x - Parameter forwarded to updateLayerScale.
             * @param {*} y - Parameter forwarded to updateLayerScale.
             *
             * @returns {layerId, { x: scaleX, y: scaleY }} Result produced by updateLayerScale.
             */
            layerControls.updateLayerScale(layerId, { x: scaleX, y: scaleY });
          }
        }
      });

      /**
       * ensureAllVisible - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * ensureAllVisible - Auto-generated documentation stub.
       */
      layerControls.ensureAllVisible();
    }

    selectionTransformStateRef.current = null;
    isSelectionTransformingRef.current = false;
    /**
     * scheduleBoundsRefresh - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * scheduleBoundsRefresh - Auto-generated documentation stub.
     */
    scheduleBoundsRefresh();
    /**
     * getLayer - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * getLayer - Auto-generated documentation stub.
     */
    proxy?.getLayer()?.batchDraw();
  }, [layerControls, scheduleBoundsRefresh, selectedLayerIds]);
  
  // Persist the proxy rotation when a selection transform finalizes so the visual selection keeps orientation
  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  const finalizeSelectionTransformWithRotation = useCallback(() => {
    const proxy = selectionProxyRef.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {proxy} Refer to the implementation for the precise returned value.
     */
    if (proxy) {
      /**
       * rotation - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * rotation - Auto-generated documentation stub.
       */
      selectionProxyRotationRef.current = proxy.rotation() ?? selectionProxyRotationRef.current;
    }
    /**
     * finalizeSelectionTransform - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * finalizeSelectionTransform - Auto-generated documentation stub.
     */
    finalizeSelectionTransform();
  }, [finalizeSelectionTransform]);


  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  useEffect(() => {
    /**
     * refreshBoundsFromSelection - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * refreshBoundsFromSelection - Auto-generated documentation stub.
     */
    refreshBoundsFromSelection();
  }, [refreshBoundsFromSelection, layersRevision, scale]);

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!selectModeActive} Refer to the implementation for the precise returned value.
     */
    if (!selectModeActive) {
      /**
       * setSelectedLayerBounds - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {null} Refer to the implementation for the precise returned value.
       */
      /**
       * setSelectedLayerBounds - Auto-generated documentation stub.
       *
       * @returns {null} Result produced by setSelectedLayerBounds.
       */
      setSelectedLayerBounds(null);
      return;
    }

    /**
     * refreshBoundsFromSelection - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * refreshBoundsFromSelection - Auto-generated documentation stub.
     */
    refreshBoundsFromSelection();
  }, [selectModeActive, refreshBoundsFromSelection]);

  // Calculate scale based on zoom and container size
  /**
   * useLayoutEffect - Auto-generated summary; refine if additional context is needed.
   */
  useLayoutEffect(() => {
    /**
     * updateScale - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * updateScale - Auto-generated documentation stub.
     */
    const updateScale = () => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!containerRef.current} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {!containerRef.current} Result produced by if.
       */
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (containerWidth === 0 || containerHeight === 0) {
        return;
      }

      // Update container dimensions state
      setContainerDimensions({ width: containerWidth, height: containerHeight });

      // Calculate fit-to-container scale
      const scaleX = containerWidth / width;
      const scaleY = containerHeight / height;
      /**
       * min - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} scaleX - Parameter derived from the static analyzer.
       * @param {*} scaleY - Parameter derived from the static analyzer.
       *
       * @returns {scaleX, scaleY} Refer to the implementation for the precise returned value.
       */
      /**
       * min - Auto-generated documentation stub.
       *
       * @param {*} scaleX - Parameter forwarded to min.
       * @param {*} scaleY - Parameter forwarded to min.
       *
       * @returns {scaleX, scaleY} Result produced by min.
       */
      const fitScale = Math.min(scaleX, scaleY);

      // Apply zoom adjustment
      // zoom = 0 means use fitScale
      /**
       * in - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {increase scale} Refer to the implementation for the precise returned value.
       */
      /**
       * in - Auto-generated documentation stub.
       *
       * @returns {increase scale} Result produced by in.
       */
      // zoom > 0 means zoom in (increase scale)
      /**
       * out - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {decrease scale} Refer to the implementation for the precise returned value.
       */
      // zoom < 0 means zoom out (decrease scale)
      const zoomFactor = 1 + internalZoom / 100;
      /**
       * max - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} fitScale * zoomFactor - Parameter derived from the static analyzer.
       * @param {*} MIN_EFFECTIVE_SCALE - Parameter derived from the static analyzer.
       *
       * @returns {fitScale * zoomFactor, MIN_EFFECTIVE_SCALE} Refer to the implementation for the precise returned value.
       */
      /**
       * max - Auto-generated documentation stub.
       *
       * @param {*} fitScale * zoomFactor - Parameter forwarded to max.
       * @param {*} MIN_EFFECTIVE_SCALE - Parameter forwarded to max.
       *
       * @returns {fitScale * zoomFactor, MIN_EFFECTIVE_SCALE} Result produced by max.
       */
      const finalScale = Math.max(fitScale * zoomFactor, MIN_EFFECTIVE_SCALE);

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (Number.isFinite(finalScale)) {
        /**
         * setScale - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {finalScale} Refer to the implementation for the precise returned value.
         */
        setScale(finalScale);
      }
    };

    /**
     * updateScale - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * updateScale - Auto-generated documentation stub.
     */
    updateScale();

    // Update on resize events
    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'resize' - Parameter derived from the static analyzer.
     * @param {*} updateScale - Parameter derived from the static analyzer.
     *
     * @returns {'resize', updateScale} Refer to the implementation for the precise returned value.
     */
    window.addEventListener('resize', updateScale);

    let resizeObserver: ResizeObserver | undefined;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      /**
       * ResizeObserver - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * ResizeObserver - Auto-generated documentation stub.
       */
      resizeObserver = new ResizeObserver(() => updateScale());
      /**
       * observe - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {containerRef.current} Refer to the implementation for the precise returned value.
       */
      /**
       * observe - Auto-generated documentation stub.
       *
       * @returns {containerRef.current} Result produced by observe.
       */
      resizeObserver.observe(containerRef.current);
    }

    /**
     * return - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * return - Auto-generated documentation stub.
     */
    return () => {
      /**
       * removeEventListener - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'resize' - Parameter derived from the static analyzer.
       * @param {*} updateScale - Parameter derived from the static analyzer.
       *
       * @returns {'resize', updateScale} Refer to the implementation for the precise returned value.
       */
      /**
       * removeEventListener - Auto-generated documentation stub.
       *
       * @param {*} 'resize' - Parameter forwarded to removeEventListener.
       * @param {*} updateScale - Parameter forwarded to removeEventListener.
       *
       * @returns {'resize', updateScale} Result produced by removeEventListener.
       */
      window.removeEventListener('resize', updateScale);
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {resizeObserver} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {resizeObserver} Result produced by if.
       */
      if (resizeObserver) {
        /**
         * disconnect - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * disconnect - Auto-generated documentation stub.
         */
        resizeObserver.disconnect();
      }
    };
  }, [width, height, internalZoom]);

  // Notify when stage is ready
  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {stageRef.current && onStageReady} Refer to the implementation for the precise returned value.
     */
    if (stageRef.current && onStageReady) {
      /**
       * onStageReady - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {stageRef.current} Refer to the implementation for the precise returned value.
       */
      /**
       * onStageReady - Auto-generated documentation stub.
       *
       * @returns {stageRef.current} Result produced by onStageReady.
       */
      onStageReady(stageRef.current);
    }
  }, [onStageReady]);

  // Update stage scale when it changes
  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {stageRef.current} Refer to the implementation for the precise returned value.
     */
    if (stageRef.current) {
      /**
       * scale - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} { x - Parameter derived from the static analyzer.
       * @param {*} y - Parameter derived from the static analyzer.
       *
       * @returns {{ x: scale, y: scale }} Refer to the implementation for the precise returned value.
       */
      /**
       * scale - Auto-generated documentation stub.
       *
       * @param {*} { x - Parameter forwarded to scale.
       * @param {*} y - Parameter forwarded to scale.
       *
       * @returns {{ x: scale, y: scale }} Result produced by scale.
       */
      stageRef.current.scale({ x: scale, y: scale });
      /**
       * batchDraw - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * batchDraw - Auto-generated documentation stub.
       */
      stageRef.current.batchDraw();
    }
  }, [scale]);

  // Sync internal zoom when parent-controlled zoom updates
  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    /**
     * setInternalZoom - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {zoom} Refer to the implementation for the precise returned value.
     */
    setInternalZoom(zoom);
  }, [zoom]);

  const updateZoom = useCallback(
    (
      updater: (previousZoom: number) => number,
      options?: { threshold?: number }
    ) => {
      const threshold = options?.threshold ?? 0;

      /**
       * setInternalZoom - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * setInternalZoom - Auto-generated documentation stub.
       */
      setInternalZoom((previousZoom) => {
        /**
         * clampZoomValue - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * clampZoomValue - Auto-generated documentation stub.
         */
        const nextZoom = clampZoomValue(updater(previousZoom));

        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * if - Auto-generated documentation stub.
         */
        if (threshold > 0 && Math.abs(nextZoom - previousZoom) < threshold) {
          return previousZoom;
        }

        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        if (nextZoom !== previousZoom) {
          /**
           * if - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {onZoomChange} Refer to the implementation for the precise returned value.
           */
          if (onZoomChange) {
            /**
             * onZoomChange - Auto-generated summary; refine if additional context is needed.
             *
             * @returns {nextZoom} Refer to the implementation for the precise returned value.
             */
            /**
             * onZoomChange - Auto-generated documentation stub.
             *
             * @returns {nextZoom} Result produced by onZoomChange.
             */
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
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!delta} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {!delta} Result produced by if.
       */
      if (!delta) return;

      /**
       * updateZoom - Auto-generated summary; refine if additional context is needed.
       */
      updateZoom((previousZoom) => previousZoom + delta, {
        threshold,
      });
    },
    [updateZoom]
  );

  

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   */
  const handleTransformerTransformStart = useCallback(() => {
    isSelectionTransformingRef.current = true;
    /**
     * captureSelectionTransformState - Auto-generated summary; refine if additional context is needed.
     */
    captureSelectionTransformState();
  }, [captureSelectionTransformState]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   */
  const handleTransformerTransform = useCallback(() => {
    /**
     * applySelectionTransformDelta - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * applySelectionTransformDelta - Auto-generated documentation stub.
     */
    applySelectionTransformDelta();
    /**
     * scheduleBoundsRefresh - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * scheduleBoundsRefresh - Auto-generated documentation stub.
     */
    scheduleBoundsRefresh();
  }, [applySelectionTransformDelta, scheduleBoundsRefresh]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   */
  const handleTransformerTransformEnd = useCallback(() => {
    /**
     * applySelectionTransformDelta - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * applySelectionTransformDelta - Auto-generated documentation stub.
     */
    applySelectionTransformDelta();
    /**
     * finalizeSelectionTransformWithRotation - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * finalizeSelectionTransformWithRotation - Auto-generated documentation stub.
     */
    finalizeSelectionTransformWithRotation();
  }, [applySelectionTransformDelta, finalizeSelectionTransformWithRotation]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   */
  const handleSelectionProxyDragStart = useCallback(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!selectModeActive} Refer to the implementation for the precise returned value.
     */
    if (!selectModeActive) {
      return;
    }
    isSelectionTransformingRef.current = true;
    /**
     * captureSelectionTransformState - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * captureSelectionTransformState - Auto-generated documentation stub.
     */
    captureSelectionTransformState();
    const stage = stageRef.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {stage} Refer to the implementation for the precise returned value.
     */
    if (stage) {
      /**
       * container - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * container - Auto-generated documentation stub.
       */
      stage.container().style.cursor = 'grabbing';
    }
  }, [captureSelectionTransformState, selectModeActive]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  const handleSelectionProxyDragMove = useCallback(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!selectModeActive} Refer to the implementation for the precise returned value.
     */
    if (!selectModeActive) {
      return;
    }
    /**
     * applySelectionTransformDelta - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * applySelectionTransformDelta - Auto-generated documentation stub.
     */
    applySelectionTransformDelta();
    /**
     * scheduleBoundsRefresh - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * scheduleBoundsRefresh - Auto-generated documentation stub.
     */
    scheduleBoundsRefresh();
  }, [applySelectionTransformDelta, scheduleBoundsRefresh, selectModeActive]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   */
  const handleSelectionProxyDragEnd = useCallback(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!selectModeActive} Refer to the implementation for the precise returned value.
     */
    if (!selectModeActive) {
      return;
    }
    /**
     * applySelectionTransformDelta - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * applySelectionTransformDelta - Auto-generated documentation stub.
     */
    applySelectionTransformDelta();
    /**
     * finalizeSelectionTransformWithRotation - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * finalizeSelectionTransformWithRotation - Auto-generated documentation stub.
     */
    finalizeSelectionTransformWithRotation();
    const stage = stageRef.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {stage} Refer to the implementation for the precise returned value.
     */
    if (stage) {
      /**
       * container - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * container - Auto-generated documentation stub.
       */
      stage.container().style.cursor = 'pointer';
    }
  }, [applySelectionTransformDelta, finalizeSelectionTransformWithRotation, selectModeActive]);

  // Overlay drag handlers - allow dragging the visual bounding box when it's rendered
  // outside of the Konva stage. This moves the selected layers by translating their
  /**
   * coordinates - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {screen delta / scale} Refer to the implementation for the precise returned value.
   */
  /**
   * coordinates - Auto-generated documentation stub.
   *
   * @returns {screen delta / scale} Result produced by coordinates.
   */
  // positions in stage coordinates (screen delta / scale).
  const handleOverlayPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!overlaySelectionBox || !selectModeActive || !layerControls} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {!overlaySelectionBox || !selectModeActive || !layerControls} Result produced by if.
       */
      if (!overlaySelectionBox || !selectModeActive || !layerControls) return;

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

      const pointerId = event.pointerId;
      try {
        /**
         * setPointerCapture - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {pointerId} Refer to the implementation for the precise returned value.
         */
        /**
         * setPointerCapture - Auto-generated documentation stub.
         *
         * @returns {pointerId} Result produced by setPointerCapture.
         */
        (event.currentTarget as Element).setPointerCapture(pointerId);
      } catch {}

      /**
       * descriptors - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {fallback to node positions} Refer to the implementation for the precise returned value.
       */
      /**
       * descriptors - Auto-generated documentation stub.
       *
       * @returns {fallback to node positions} Result produced by descriptors.
       */
      // capture initial positions from layer descriptors (fallback to node positions)
      const initialPositions = new Map<string, { x: number; y: number }>();
      const activeSelection = layerControls.selectedLayerIds;
      /**
       * forEach - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * forEach - Auto-generated documentation stub.
       */
      activeSelection.forEach((id) => {
        /**
         * get - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {id} Refer to the implementation for the precise returned value.
         */
        /**
         * get - Auto-generated documentation stub.
         *
         * @returns {id} Result produced by get.
         */
        const node = layerNodeRefs.current.get(id);
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {node} Refer to the implementation for the precise returned value.
         */
        /**
         * if - Auto-generated documentation stub.
         *
         * @returns {node} Result produced by if.
         */
        if (node) {
          /**
           * position - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * position - Auto-generated documentation stub.
           */
          const p = node.position();
          /**
           * set - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} id - Parameter derived from the static analyzer.
           * @param {*} { x - Parameter derived from the static analyzer.
           * @param {*} y - Parameter derived from the static analyzer.
           *
           * @returns {id, { x: p.x, y: p.y }} Refer to the implementation for the precise returned value.
           */
          /**
           * set - Auto-generated documentation stub.
           *
           * @param {*} id - Parameter forwarded to set.
           * @param {*} { x - Parameter forwarded to set.
           * @param {*} y - Parameter forwarded to set.
           *
           * @returns {id, { x: p.x, y: p.y }} Result produced by set.
           */
          initialPositions.set(id, { x: p.x, y: p.y });
        } else {
          /**
           * find - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * find - Auto-generated documentation stub.
           */
          const desc = layerControls.layers.find((l) => l.id === id);
          /**
           * if - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {desc} Refer to the implementation for the precise returned value.
           */
          /**
           * if - Auto-generated documentation stub.
           *
           * @returns {desc} Result produced by if.
           */
          if (desc) {
            /**
             * set - Auto-generated summary; refine if additional context is needed.
             *
             * @param {*} id - Parameter derived from the static analyzer.
             * @param {*} { x - Parameter derived from the static analyzer.
             * @param {*} y - Parameter derived from the static analyzer.
             *
             * @returns {id, { x: desc.position.x, y: desc.position.y }} Refer to the implementation for the precise returned value.
             */
            /**
             * set - Auto-generated documentation stub.
             *
             * @param {*} id - Parameter forwarded to set.
             * @param {*} { x - Parameter forwarded to set.
             * @param {*} y - Parameter forwarded to set.
             *
             * @returns {id, { x: desc.position.x, y: desc.position.y }} Result produced by set.
             */
            initialPositions.set(id, { x: desc.position.x, y: desc.position.y });
          }
        }
      });

      overlayDragState.current = {
        pointerId,
        startX: event.clientX,
        startY: event.clientY,
        initialPositions,
      };

      /**
       * transforms - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {rotation/scale} Refer to the implementation for the precise returned value.
       */
      /**
       * transforms - Auto-generated documentation stub.
       *
       * @returns {rotation/scale} Result produced by transforms.
       */
      // prepare transform snapshot so transforms (rotation/scale) remain consistent
      /**
       * captureSelectionTransformState - Auto-generated summary; refine if additional context is needed.
       */
      captureSelectionTransformState();
      isSelectionTransformingRef.current = true;
      const stage = stageRef.current;
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {stage} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {stage} Result produced by if.
       */
      if (stage) stage.container().style.cursor = 'grabbing';
    },
    [overlaySelectionBox, selectModeActive, layerControls, captureSelectionTransformState]
  );

  const overlayRotateState = useRef<
    | null
    | {
        pointerId: number;
        startAngle: number; // degrees
        startProxyRotation: number; // degrees
        center: { x: number; y: number };
        captureTarget: Element | null;
      }
  >(null);

  /**
   * Handles pointer-down events on the HTML overlay rotate handle so the Konva
   * proxy can capture pointer state and rotate around the selection center even
   * when the user drags outside the canvas.
   */
  const handleOverlayRotatePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!overlaySelectionBox || !selectModeActive || !layerControls} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {!overlaySelectionBox || !selectModeActive || !layerControls} Result produced by if.
       */
      if (!overlaySelectionBox || !selectModeActive || !layerControls) return;
      const proxy = selectionProxyRef.current;
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!proxy} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {!proxy} Result produced by if.
       */
      if (!proxy) {
        return;
      }

      /**
       * preventDefault - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * preventDefault - Auto-generated documentation stub.
       */
      event.preventDefault();
      /**
       * stopPropagation - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * stopPropagation - Auto-generated documentation stub.
       */
      event.stopPropagation();

      const pointerId = event.pointerId;
      const captureTarget = event.currentTarget as Element | null;
      try {
        /**
         * setPointerCapture - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {pointerId} Refer to the implementation for the precise returned value.
         */
        /**
         * setPointerCapture - Auto-generated documentation stub.
         *
         * @returns {pointerId} Result produced by setPointerCapture.
         */
        captureTarget?.setPointerCapture(pointerId);
      } catch {}

      const center = { x: overlaySelectionBox.x, y: overlaySelectionBox.y };
      /**
       * atan2 - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} event.clientY - center.y - Parameter derived from the static analyzer.
       * @param {*} event.clientX - center.x - Parameter derived from the static analyzer.
       *
       * @returns {event.clientY - center.y, event.clientX - center.x} Refer to the implementation for the precise returned value.
       */
      /**
       * atan2 - Auto-generated documentation stub.
       *
       * @param {*} event.clientY - center.y - Parameter forwarded to atan2.
       * @param {*} event.clientX - center.x - Parameter forwarded to atan2.
       *
       * @returns {event.clientY - center.y, event.clientX - center.x} Result produced by atan2.
       */
      const startAngleRad = Math.atan2(event.clientY - center.y, event.clientX - center.x);
      const startAngleDeg = (startAngleRad * 180) / Math.PI;

      overlayRotateState.current = {
        pointerId,
        startAngle: startAngleDeg,
        /**
         * rotation - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * rotation - Auto-generated documentation stub.
         */
        startProxyRotation: proxy.rotation() ?? 0,
        center,
        captureTarget,
      };

      // prepare for transform
      /**
       * captureSelectionTransformState - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * captureSelectionTransformState - Auto-generated documentation stub.
       */
      captureSelectionTransformState();
      isSelectionTransformingRef.current = true;
    },
    [overlaySelectionBox, selectModeActive, layerControls, captureSelectionTransformState]
  );

  /**
   * Handles pointer-move events on the HTML overlay rotate handle so the Konva
   * proxy can capture pointer state and rotate around the selection center even
   * when the user drags outside the canvas.
   */

  const handleOverlayRotatePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): boolean => {
      const state = overlayRotateState.current;
      const proxy = selectionProxyRef.current;
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (!state || !proxy || event.pointerId !== state.pointerId) {
        return false;
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

      /**
       * atan2 - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} event.clientY - state.center.y - Parameter derived from the static analyzer.
       * @param {*} event.clientX - state.center.x - Parameter derived from the static analyzer.
       *
       * @returns {event.clientY - state.center.y, event.clientX - state.center.x} Refer to the implementation for the precise returned value.
       */
      /**
       * atan2 - Auto-generated documentation stub.
       *
       * @param {*} event.clientY - state.center.y - Parameter forwarded to atan2.
       * @param {*} event.clientX - state.center.x - Parameter forwarded to atan2.
       *
       * @returns {event.clientY - state.center.y, event.clientX - state.center.x} Result produced by atan2.
       */
      const currentAngleRad = Math.atan2(event.clientY - state.center.y, event.clientX - state.center.x);
      const currentAngleDeg = (currentAngleRad * 180) / Math.PI;
      const delta = currentAngleDeg - state.startAngle;

      const newRotation = state.startProxyRotation + delta;

      /**
       * rotation - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {newRotation} Refer to the implementation for the precise returned value.
       */
      /**
       * rotation - Auto-generated documentation stub.
       *
       * @returns {newRotation} Result produced by rotation.
       */
      proxy.rotation(newRotation);
      selectionProxyRotationRef.current = newRotation;

      /**
       * applySelectionTransformDelta - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * applySelectionTransformDelta - Auto-generated documentation stub.
       */
      applySelectionTransformDelta();
      /**
       * scheduleBoundsRefresh - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * scheduleBoundsRefresh - Auto-generated documentation stub.
       */
      scheduleBoundsRefresh();

      /**
       * setOverlaySelectionBox - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * setOverlaySelectionBox - Auto-generated documentation stub.
       */
      setOverlaySelectionBox((prev) => (prev ? { ...prev, rotation: newRotation } : prev));

      /**
       * batchDraw - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * batchDraw - Auto-generated documentation stub.
       */
      stageRef.current?.batchDraw();
      return true;
    },
    [applySelectionTransformDelta, scheduleBoundsRefresh]
  );

  const handleOverlayRotatePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): boolean => {
      const state = overlayRotateState.current;
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (!state || event.pointerId !== state.pointerId) {
        return false;
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

      try {
        /**
         * releasePointerCapture - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {state.pointerId} Refer to the implementation for the precise returned value.
         */
        /**
         * releasePointerCapture - Auto-generated documentation stub.
         *
         * @returns {state.pointerId} Result produced by releasePointerCapture.
         */
        state.captureTarget?.releasePointerCapture(state.pointerId);
      } catch {}

      /**
       * applySelectionTransformDelta - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * applySelectionTransformDelta - Auto-generated documentation stub.
       */
      applySelectionTransformDelta();
      /**
       * finalizeSelectionTransformWithRotation - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * finalizeSelectionTransformWithRotation - Auto-generated documentation stub.
       */
      finalizeSelectionTransformWithRotation();
      overlayRotateState.current = null;
      isSelectionTransformingRef.current = false;
      selectionTransformStateRef.current = null;
      /**
       * scheduleBoundsRefresh - Auto-generated summary; refine if additional context is needed.
       */
      scheduleBoundsRefresh();
      return true;
    },
    [applySelectionTransformDelta, finalizeSelectionTransformWithRotation, scheduleBoundsRefresh]
  );

  const handleOverlayResizePointerDown = useCallback(
    (direction: string, event: React.PointerEvent<HTMLDivElement>) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!overlaySelectionBox || !selectModeActive || !layerControls} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {!overlaySelectionBox || !selectModeActive || !layerControls} Result produced by if.
       */
      if (!overlaySelectionBox || !selectModeActive || !layerControls) {
        return;
      }

      const proxy = selectionProxyRef.current;
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!proxy} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {!proxy} Result produced by if.
       */
      if (!proxy) {
        return;
      }

      /**
       * preventDefault - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * preventDefault - Auto-generated documentation stub.
       */
      event.preventDefault();

      const pointerId = event.pointerId;
      const captureTarget = event.currentTarget as Element | null;
      try {
        /**
         * setPointerCapture - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {pointerId} Refer to the implementation for the precise returned value.
         */
        /**
         * setPointerCapture - Auto-generated documentation stub.
         *
         * @returns {pointerId} Result produced by setPointerCapture.
         */
        captureTarget?.setPointerCapture(pointerId);
      } catch {}

      /**
       * resolveSelectionRotation - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * resolveSelectionRotation - Auto-generated documentation stub.
       */
      const rotationDeg = overlaySelectionBox.rotation ?? resolveSelectionRotation();
      const rotationRad = (rotationDeg * Math.PI) / 180;
      /**
       * max - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} MIN_PROXY_DIMENSION - Parameter derived from the static analyzer.
       * @param {*} proxy.width( - Parameter derived from the static analyzer.
       */
      /**
       * max - Auto-generated documentation stub.
       *
       * @param {*} MIN_PROXY_DIMENSION - Parameter forwarded to max.
       * @param {*} proxy.width( - Parameter forwarded to max.
       */
      const initialWidth = Math.max(MIN_PROXY_DIMENSION, proxy.width());
      /**
       * max - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} MIN_PROXY_DIMENSION - Parameter derived from the static analyzer.
       * @param {*} proxy.height( - Parameter derived from the static analyzer.
       */
      /**
       * max - Auto-generated documentation stub.
       *
       * @param {*} MIN_PROXY_DIMENSION - Parameter forwarded to max.
       * @param {*} proxy.height( - Parameter forwarded to max.
       */
      const initialHeight = Math.max(MIN_PROXY_DIMENSION, proxy.height());

      overlayResizeState.current = {
        pointerId,
        direction,
        rotationDeg,
        rotationRad,
        captureTarget,
        startScreen: { x: event.clientX, y: event.clientY },
        initialCenterStage: { x: proxy.x(), y: proxy.y() },
        initialCenterScreen: { x: overlaySelectionBox.x, y: overlaySelectionBox.y },
        initialLeft: -initialWidth / 2,
        initialRight: initialWidth / 2,
        initialTop: -initialHeight / 2,
        initialBottom: initialHeight / 2,
      };

      /**
       * captureSelectionTransformState - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * captureSelectionTransformState - Auto-generated documentation stub.
       */
      captureSelectionTransformState();
      isSelectionTransformingRef.current = true;
    },
    [overlaySelectionBox, selectModeActive, layerControls, resolveSelectionRotation, captureSelectionTransformState]
  );

  const handleOverlayResizePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): boolean => {
      const state = overlayResizeState.current;
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (!state || event.pointerId !== state.pointerId) {
        return false;
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

      /**
       * max - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} scale - Parameter derived from the static analyzer.
       * @param {*} 0.0001 - Parameter derived from the static analyzer.
       *
       * @returns {scale, 0.0001} Refer to the implementation for the precise returned value.
       */
      /**
       * max - Auto-generated documentation stub.
       *
       * @param {*} scale - Parameter forwarded to max.
       * @param {*} 0.0001 - Parameter forwarded to max.
       *
       * @returns {scale, 0.0001} Result produced by max.
       */
      const safeScale = Math.max(scale, 0.0001);
      const dxStage = (event.clientX - state.startScreen.x) / safeScale;
      const dyStage = (event.clientY - state.startScreen.y) / safeScale;

      /**
       * cos - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {state.rotationRad} Refer to the implementation for the precise returned value.
       */
      /**
       * cos - Auto-generated documentation stub.
       *
       * @returns {state.rotationRad} Result produced by cos.
       */
      const cos = Math.cos(state.rotationRad);
      /**
       * sin - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {state.rotationRad} Refer to the implementation for the precise returned value.
       */
      /**
       * sin - Auto-generated documentation stub.
       *
       * @returns {state.rotationRad} Result produced by sin.
       */
      const sin = Math.sin(state.rotationRad);
      const localDx = cos * dxStage + sin * dyStage;
      const localDy = -sin * dxStage + cos * dyStage;

      let left = state.initialLeft;
      let right = state.initialRight;
      let top = state.initialTop;
      let bottom = state.initialBottom;

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (state.direction.includes('e')) {
        right = state.initialRight + localDx;
      }
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      if (state.direction.includes('w')) {
        left = state.initialLeft + localDx;
      }
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (state.direction.includes('s')) {
        bottom = state.initialBottom + localDy;
      }
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (state.direction.includes('n')) {
        top = state.initialTop + localDy;
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {right - left < MIN_PROXY_DIMENSION} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {right - left < MIN_PROXY_DIMENSION} Result produced by if.
       */
      if (right - left < MIN_PROXY_DIMENSION) {
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        if (state.direction.includes('e')) {
          right = left + MIN_PROXY_DIMENSION;
        } else {
          left = right - MIN_PROXY_DIMENSION;
        }
      }
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {bottom - top < MIN_PROXY_DIMENSION} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {bottom - top < MIN_PROXY_DIMENSION} Result produced by if.
       */
      if (bottom - top < MIN_PROXY_DIMENSION) {
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * if - Auto-generated documentation stub.
         */
        if (state.direction.includes('s')) {
          bottom = top + MIN_PROXY_DIMENSION;
        } else {
          top = bottom - MIN_PROXY_DIMENSION;
        }
      }

      /**
       * max - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} MIN_PROXY_DIMENSION - Parameter derived from the static analyzer.
       * @param {*} right - left - Parameter derived from the static analyzer.
       *
       * @returns {MIN_PROXY_DIMENSION, right - left} Refer to the implementation for the precise returned value.
       */
      /**
       * max - Auto-generated documentation stub.
       *
       * @param {*} MIN_PROXY_DIMENSION - Parameter forwarded to max.
       * @param {*} right - left - Parameter forwarded to max.
       *
       * @returns {MIN_PROXY_DIMENSION, right - left} Result produced by max.
       */
      const nextWidth = Math.max(MIN_PROXY_DIMENSION, right - left);
      /**
       * max - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} MIN_PROXY_DIMENSION - Parameter derived from the static analyzer.
       * @param {*} bottom - top - Parameter derived from the static analyzer.
       *
       * @returns {MIN_PROXY_DIMENSION, bottom - top} Refer to the implementation for the precise returned value.
       */
      /**
       * max - Auto-generated documentation stub.
       *
       * @param {*} MIN_PROXY_DIMENSION - Parameter forwarded to max.
       * @param {*} bottom - top - Parameter forwarded to max.
       *
       * @returns {MIN_PROXY_DIMENSION, bottom - top} Result produced by max.
       */
      const nextHeight = Math.max(MIN_PROXY_DIMENSION, bottom - top);

      const offsetLocalX = (left + right) / 2;
      const offsetLocalY = (top + bottom) / 2;
      const offsetStageX = cos * offsetLocalX - sin * offsetLocalY;
      const offsetStageY = sin * offsetLocalX + cos * offsetLocalY;

      const proxy = selectionProxyRef.current;
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!proxy} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {!proxy} Result produced by if.
       */
      if (!proxy) {
        return true;
      }

      /**
       * width - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {nextWidth} Refer to the implementation for the precise returned value.
       */
      /**
       * width - Auto-generated documentation stub.
       *
       * @returns {nextWidth} Result produced by width.
       */
      proxy.width(nextWidth);
      /**
       * height - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {nextHeight} Refer to the implementation for the precise returned value.
       */
      /**
       * height - Auto-generated documentation stub.
       *
       * @returns {nextHeight} Result produced by height.
       */
      proxy.height(nextHeight);
      /**
       * offset - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} { x - Parameter derived from the static analyzer.
       * @param {*} y - Parameter derived from the static analyzer.
       *
       * @returns {{ x: nextWidth / 2, y: nextHeight / 2 }} Refer to the implementation for the precise returned value.
       */
      /**
       * offset - Auto-generated documentation stub.
       *
       * @param {*} { x - Parameter forwarded to offset.
       * @param {*} y - Parameter forwarded to offset.
       *
       * @returns {{ x: nextWidth / 2, y: nextHeight / 2 }} Result produced by offset.
       */
      proxy.offset({ x: nextWidth / 2, y: nextHeight / 2 });
      proxy.position({
        x: state.initialCenterStage.x + offsetStageX,
        y: state.initialCenterStage.y + offsetStageY,
      });

      /**
       * applySelectionTransformDelta - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * applySelectionTransformDelta - Auto-generated documentation stub.
       */
      applySelectionTransformDelta();

      /**
       * setOverlaySelectionBox - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * setOverlaySelectionBox - Auto-generated documentation stub.
       */
      setOverlaySelectionBox((prev) => {
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {!prev} Refer to the implementation for the precise returned value.
         */
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

      /**
       * scheduleBoundsRefresh - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * scheduleBoundsRefresh - Auto-generated documentation stub.
       */
      scheduleBoundsRefresh();
      /**
       * batchDraw - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * batchDraw - Auto-generated documentation stub.
       */
      stageRef.current?.batchDraw();
      return true;
    },
    [applySelectionTransformDelta, scale, scheduleBoundsRefresh]
  );

  const handleOverlayResizePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): boolean => {
      const state = overlayResizeState.current;
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (!state || event.pointerId !== state.pointerId) {
        return false;
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

      try {
        /**
         * releasePointerCapture - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {state.pointerId} Refer to the implementation for the precise returned value.
         */
        /**
         * releasePointerCapture - Auto-generated documentation stub.
         *
         * @returns {state.pointerId} Result produced by releasePointerCapture.
         */
        state.captureTarget?.releasePointerCapture(state.pointerId);
      } catch {}

      /**
       * applySelectionTransformDelta - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * applySelectionTransformDelta - Auto-generated documentation stub.
       */
      applySelectionTransformDelta();
      /**
       * finalizeSelectionTransformWithRotation - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * finalizeSelectionTransformWithRotation - Auto-generated documentation stub.
       */
      finalizeSelectionTransformWithRotation();
      overlayResizeState.current = null;
      return true;
    },
    [applySelectionTransformDelta, finalizeSelectionTransformWithRotation]
  );

  const handleOverlayPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (handleOverlayRotatePointerMove(event)) {
        return;
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      if (handleOverlayResizePointerMove(event)) {
        return;
      }

      const state = overlayDragState.current;
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (!state || event.pointerId !== state.pointerId) return;

      /**
       * preventDefault - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * preventDefault - Auto-generated documentation stub.
       */
      event.preventDefault();
      /**
       * stopPropagation - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * stopPropagation - Auto-generated documentation stub.
       */
      event.stopPropagation();

      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;

      // Convert screen delta to stage coordinates using current scale
      /**
       * max - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} scale - Parameter derived from the static analyzer.
       * @param {*} 0.0001 - Parameter derived from the static analyzer.
       *
       * @returns {scale, 0.0001} Refer to the implementation for the precise returned value.
       */
      const dxStage = dx / Math.max(scale, 0.0001);
      /**
       * max - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} scale - Parameter derived from the static analyzer.
       * @param {*} 0.0001 - Parameter derived from the static analyzer.
       *
       * @returns {scale, 0.0001} Refer to the implementation for the precise returned value.
       */
      /**
       * max - Auto-generated documentation stub.
       *
       * @param {*} scale - Parameter forwarded to max.
       * @param {*} 0.0001 - Parameter forwarded to max.
       *
       * @returns {scale, 0.0001} Result produced by max.
       */
      const dyStage = dy / Math.max(scale, 0.0001);

      /**
       * forEach - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} (pos - Parameter derived from the static analyzer.
       * @param {*} id - Parameter derived from the static analyzer.
       */
      /**
       * forEach - Auto-generated documentation stub.
       *
       * @param {*} (pos - Parameter forwarded to forEach.
       * @param {*} id - Parameter forwarded to forEach.
       */
      state.initialPositions.forEach((pos, id) => {
        /**
         * get - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {id} Refer to the implementation for the precise returned value.
         */
        /**
         * get - Auto-generated documentation stub.
         *
         * @returns {id} Result produced by get.
         */
        const node = layerNodeRefs.current.get(id);
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {!node} Refer to the implementation for the precise returned value.
         */
        /**
         * if - Auto-generated documentation stub.
         *
         * @returns {!node} Result produced by if.
         */
        if (!node) return;
        const newX = pos.x + dxStage;
        const newY = pos.y + dyStage;
        /**
         * position - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} { x - Parameter derived from the static analyzer.
         * @param {*} y - Parameter derived from the static analyzer.
         *
         * @returns {{ x: newX, y: newY }} Refer to the implementation for the precise returned value.
         */
        /**
         * position - Auto-generated documentation stub.
         *
         * @param {*} { x - Parameter forwarded to position.
         * @param {*} y - Parameter forwarded to position.
         *
         * @returns {{ x: newX, y: newY }} Result produced by position.
         */
        node.position({ x: newX, y: newY });
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * if - Auto-generated documentation stub.
         */
        if (typeof node.batchDraw === 'function') node.batchDraw();
      });

      /**
       * batchDraw - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * batchDraw - Auto-generated documentation stub.
       */
      stageRef.current?.batchDraw();
      // update overlay visual position to follow pointer
      /**
       * setOverlaySelectionBox - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * setOverlaySelectionBox - Auto-generated documentation stub.
       */
      setOverlaySelectionBox((prev) => (prev ? { ...prev, x: prev.x + dx, y: prev.y + dy } : prev));
      // Update the computed bounds so the Konva transformer and proxy stay in sync
      try {
        /**
         * from - Auto-generated summary; refine if additional context is needed.
         */
        const activeSelection = layerControls?.selectedLayerIds ?? Array.from(state.initialPositions.keys());
        /**
         * updateBoundsFromLayerIds - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {activeSelection} Refer to the implementation for the precise returned value.
         */
        /**
         * updateBoundsFromLayerIds - Auto-generated documentation stub.
         *
         * @returns {activeSelection} Result produced by updateBoundsFromLayerIds.
         */
        updateBoundsFromLayerIds(activeSelection);
      /**
       * catch - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {e} Refer to the implementation for the precise returned value.
       */
      /**
       * catch - Auto-generated documentation stub.
       *
       * @returns {e} Result produced by catch.
       */
      } catch (e) {
        // ignore
      }
    },
    [
      handleOverlayRotatePointerMove,
      handleOverlayResizePointerMove,
      scale,
      layerNodeRefs,
      stageRef,
      layerControls,
      updateBoundsFromLayerIds,
    ]
  );

  const handleOverlayPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (handleOverlayRotatePointerUp(event)) {
        return;
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      if (handleOverlayResizePointerUp(event)) {
        return;
      }

      const state = overlayDragState.current;
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (!state || event.pointerId !== state.pointerId) return;

      /**
       * preventDefault - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * preventDefault - Auto-generated documentation stub.
       */
      event.preventDefault();
      /**
       * stopPropagation - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * stopPropagation - Auto-generated documentation stub.
       */
      event.stopPropagation();

      try {
        /**
         * releasePointerCapture - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {state.pointerId} Refer to the implementation for the precise returned value.
         */
        /**
         * releasePointerCapture - Auto-generated documentation stub.
         *
         * @returns {state.pointerId} Result produced by releasePointerCapture.
         */
        (event.currentTarget as Element).releasePointerCapture(state.pointerId);
      } catch {}

      // Persist final positions
      /**
       * from - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * from - Auto-generated documentation stub.
       */
      const ids = Array.from(state.initialPositions.keys());
      /**
       * forEach - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * forEach - Auto-generated documentation stub.
       */
      ids.forEach((id) => {
        /**
         * get - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {id} Refer to the implementation for the precise returned value.
         */
        /**
         * get - Auto-generated documentation stub.
         *
         * @returns {id} Result produced by get.
         */
        const node = layerNodeRefs.current.get(id);
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {!node} Refer to the implementation for the precise returned value.
         */
        /**
         * if - Auto-generated documentation stub.
         *
         * @returns {!node} Result produced by if.
         */
        if (!node) return;
        /**
         * position - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * position - Auto-generated documentation stub.
         */
        const p = node.position();
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {layerControls} Refer to the implementation for the precise returned value.
         */
        /**
         * if - Auto-generated documentation stub.
         *
         * @returns {layerControls} Result produced by if.
         */
        if (layerControls) {
          /**
           * updateLayerPosition - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} id - Parameter derived from the static analyzer.
           * @param {*} { x - Parameter derived from the static analyzer.
           * @param {*} y - Parameter derived from the static analyzer.
           *
           * @returns {id, { x: p.x, y: p.y }} Refer to the implementation for the precise returned value.
           */
          /**
           * updateLayerPosition - Auto-generated documentation stub.
           *
           * @param {*} id - Parameter forwarded to updateLayerPosition.
           * @param {*} { x - Parameter forwarded to updateLayerPosition.
           * @param {*} y - Parameter forwarded to updateLayerPosition.
           *
           * @returns {id, { x: p.x, y: p.y }} Result produced by updateLayerPosition.
           */
          layerControls.updateLayerPosition(id, { x: p.x, y: p.y });
        }
      });

      overlayDragState.current = null;
      isSelectionTransformingRef.current = false;
      // Ensure bounds are updated immediately after finishing drag so the transformer
      // and proxy reflect the new positions.
      try {
        /**
         * from - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * from - Auto-generated documentation stub.
         */
        const activeSelection = layerControls?.selectedLayerIds ?? Array.from(state.initialPositions.keys());
        /**
         * updateBoundsFromLayerIds - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {activeSelection} Refer to the implementation for the precise returned value.
         */
        /**
         * updateBoundsFromLayerIds - Auto-generated documentation stub.
         *
         * @returns {activeSelection} Result produced by updateBoundsFromLayerIds.
         */
        updateBoundsFromLayerIds(activeSelection);
      } catch {}
      // clear any transient transform snapshot
      selectionTransformStateRef.current = null;
      /**
       * scheduleBoundsRefresh - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * scheduleBoundsRefresh - Auto-generated documentation stub.
       */
      scheduleBoundsRefresh();
      const stage = stageRef.current;
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {stage} Refer to the implementation for the precise returned value.
       */
      if (stage) stage.container().style.cursor = 'pointer';
    },
    [
      handleOverlayRotatePointerUp,
      handleOverlayResizePointerUp,
      scheduleBoundsRefresh,
      layerControls,
      updateBoundsFromLayerIds,
    ]
  );

  

  // Mouse wheel zoom
  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    const container = containerRef.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!container} Refer to the implementation for the precise returned value.
     */
    if (!container) return;

    /**
     * handleWheel - Auto-generated summary; refine if additional context is needed.
     */
    const handleWheel = (event: WheelEvent) => {
      /**
       * preventDefault - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * preventDefault - Auto-generated documentation stub.
       */
      event.preventDefault();

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (event.deltaY === 0) return;

      /**
       * sign - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {event.deltaY} Refer to the implementation for the precise returned value.
       */
      const direction = -Math.sign(event.deltaY);
      /**
       * applyZoomDelta - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {direction * WHEEL_ZOOM_STEP} Refer to the implementation for the precise returned value.
       */
      /**
       * applyZoomDelta - Auto-generated documentation stub.
       *
       * @returns {direction * WHEEL_ZOOM_STEP} Result produced by applyZoomDelta.
       */
      applyZoomDelta(direction * WHEEL_ZOOM_STEP);
    };

    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'wheel' - Parameter derived from the static analyzer.
     * @param {*} handleWheel - Parameter derived from the static analyzer.
     * @param {*} { passive - Parameter derived from the static analyzer.
     *
     * @returns {'wheel', handleWheel, { passive: false }} Refer to the implementation for the precise returned value.
     */
    container.addEventListener('wheel', handleWheel, { passive: false });
    /**
     * return - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * return - Auto-generated documentation stub.
     */
    return () => container.removeEventListener('wheel', handleWheel);
  }, [applyZoomDelta]);

  // Keyboard zoom controls and pan activation via space bar
  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  useEffect(() => {
    /**
     * handleKeyDown - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * handleKeyDown - Auto-generated documentation stub.
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {target} Refer to the implementation for the precise returned value.
       */
      if (target) {
        const tagName = target.tagName;
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (event.code === 'Space') {
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {!event.repeat} Refer to the implementation for the precise returned value.
         */
        if (!event.repeat) {
          /**
           * setSpacePressed - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {true} Refer to the implementation for the precise returned value.
           */
          /**
           * setSpacePressed - Auto-generated documentation stub.
           *
           * @returns {true} Result produced by setSpacePressed.
           */
          setSpacePressed(true);
        }
        /**
         * preventDefault - Auto-generated summary; refine if additional context is needed.
         */
        event.preventDefault();
        return;
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      if (event.key === '+' || event.key === '=') {
        /**
         * preventDefault - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * preventDefault - Auto-generated documentation stub.
         */
        event.preventDefault();
        /**
         * applyZoomDelta - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {KEYBOARD_ZOOM_STEP} Refer to the implementation for the precise returned value.
         */
        /**
         * applyZoomDelta - Auto-generated documentation stub.
         *
         * @returns {KEYBOARD_ZOOM_STEP} Result produced by applyZoomDelta.
         */
        applyZoomDelta(KEYBOARD_ZOOM_STEP);
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      } else if (event.key === '-' || event.key === '_') {
        /**
         * preventDefault - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * preventDefault - Auto-generated documentation stub.
         */
        event.preventDefault();
        /**
         * applyZoomDelta - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {-KEYBOARD_ZOOM_STEP} Refer to the implementation for the precise returned value.
         */
        /**
         * applyZoomDelta - Auto-generated documentation stub.
         *
         * @returns {-KEYBOARD_ZOOM_STEP} Result produced by applyZoomDelta.
         */
        applyZoomDelta(-KEYBOARD_ZOOM_STEP);
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      } else if (event.key === '0' && (event.ctrlKey || event.metaKey)) {
        /**
         * preventDefault - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * preventDefault - Auto-generated documentation stub.
         */
        event.preventDefault();
        /**
         * updateZoom - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * updateZoom - Auto-generated documentation stub.
         */
        updateZoom(() => 0);
      }
    };

    /**
     * handleKeyUp - Auto-generated summary; refine if additional context is needed.
     */
    const handleKeyUp = (event: KeyboardEvent) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (event.code === 'Space') {
        /**
         * setSpacePressed - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {false} Refer to the implementation for the precise returned value.
         */
        /**
         * setSpacePressed - Auto-generated documentation stub.
         *
         * @returns {false} Result produced by setSpacePressed.
         */
        setSpacePressed(false);
      }
    };

    /**
     * handleWindowBlur - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * handleWindowBlur - Auto-generated documentation stub.
     */
    const handleWindowBlur = () => {
      /**
       * setSpacePressed - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {false} Refer to the implementation for the precise returned value.
       */
      setSpacePressed(false);
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
    };

    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'keydown' - Parameter derived from the static analyzer.
     * @param {*} handleKeyDown - Parameter derived from the static analyzer.
     *
     * @returns {'keydown', handleKeyDown} Refer to the implementation for the precise returned value.
     */
    /**
     * addEventListener - Auto-generated documentation stub.
     *
     * @param {*} 'keydown' - Parameter forwarded to addEventListener.
     * @param {*} handleKeyDown - Parameter forwarded to addEventListener.
     *
     * @returns {'keydown', handleKeyDown} Result produced by addEventListener.
     */
    window.addEventListener('keydown', handleKeyDown);
    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'keyup' - Parameter derived from the static analyzer.
     * @param {*} handleKeyUp - Parameter derived from the static analyzer.
     *
     * @returns {'keyup', handleKeyUp} Refer to the implementation for the precise returned value.
     */
    /**
     * addEventListener - Auto-generated documentation stub.
     *
     * @param {*} 'keyup' - Parameter forwarded to addEventListener.
     * @param {*} handleKeyUp - Parameter forwarded to addEventListener.
     *
     * @returns {'keyup', handleKeyUp} Result produced by addEventListener.
     */
    window.addEventListener('keyup', handleKeyUp);
    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'blur' - Parameter derived from the static analyzer.
     * @param {*} handleWindowBlur - Parameter derived from the static analyzer.
     *
     * @returns {'blur', handleWindowBlur} Refer to the implementation for the precise returned value.
     */
    /**
     * addEventListener - Auto-generated documentation stub.
     *
     * @param {*} 'blur' - Parameter forwarded to addEventListener.
     * @param {*} handleWindowBlur - Parameter forwarded to addEventListener.
     *
     * @returns {'blur', handleWindowBlur} Result produced by addEventListener.
     */
    window.addEventListener('blur', handleWindowBlur);

    /**
     * return - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * return - Auto-generated documentation stub.
     */
    return () => {
      /**
       * removeEventListener - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'keydown' - Parameter derived from the static analyzer.
       * @param {*} handleKeyDown - Parameter derived from the static analyzer.
       *
       * @returns {'keydown', handleKeyDown} Refer to the implementation for the precise returned value.
       */
      /**
       * removeEventListener - Auto-generated documentation stub.
       *
       * @param {*} 'keydown' - Parameter forwarded to removeEventListener.
       * @param {*} handleKeyDown - Parameter forwarded to removeEventListener.
       *
       * @returns {'keydown', handleKeyDown} Result produced by removeEventListener.
       */
      window.removeEventListener('keydown', handleKeyDown);
      /**
       * removeEventListener - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'keyup' - Parameter derived from the static analyzer.
       * @param {*} handleKeyUp - Parameter derived from the static analyzer.
       *
       * @returns {'keyup', handleKeyUp} Refer to the implementation for the precise returned value.
       */
      /**
       * removeEventListener - Auto-generated documentation stub.
       *
       * @param {*} 'keyup' - Parameter forwarded to removeEventListener.
       * @param {*} handleKeyUp - Parameter forwarded to removeEventListener.
       *
       * @returns {'keyup', handleKeyUp} Result produced by removeEventListener.
       */
      window.removeEventListener('keyup', handleKeyUp);
      /**
       * removeEventListener - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'blur' - Parameter derived from the static analyzer.
       * @param {*} handleWindowBlur - Parameter derived from the static analyzer.
       *
       * @returns {'blur', handleWindowBlur} Refer to the implementation for the precise returned value.
       */
      /**
       * removeEventListener - Auto-generated documentation stub.
       *
       * @param {*} 'blur' - Parameter forwarded to removeEventListener.
       * @param {*} handleWindowBlur - Parameter forwarded to removeEventListener.
       *
       * @returns {'blur', handleWindowBlur} Result produced by removeEventListener.
       */
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [applyZoomDelta, updateZoom]);

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!isLayerPanelOpen} Refer to the implementation for the precise returned value.
     */
    if (!isLayerPanelOpen) {
      return;
    }

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (typeof document === 'undefined') {
      return;
    }

    /**
     * handlePointerDown - Auto-generated summary; refine if additional context is needed.
     */
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {target} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {target} Result produced by if.
       */
      if (target) {
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        if (layerPanelRef.current?.contains(target)) {
          return;
        }
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * if - Auto-generated documentation stub.
         */
        if (layerButtonRef.current?.contains(target)) {
          return;
        }
      }

      /**
       * setIsLayerPanelOpen - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {false} Refer to the implementation for the precise returned value.
       */
      /**
       * setIsLayerPanelOpen - Auto-generated documentation stub.
       *
       * @returns {false} Result produced by setIsLayerPanelOpen.
       */
      setIsLayerPanelOpen(false);
    };

    /**
     * handleKeyDown - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * handleKeyDown - Auto-generated documentation stub.
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (event.key === 'Escape') {
        /**
         * setIsLayerPanelOpen - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {false} Refer to the implementation for the precise returned value.
         */
        /**
         * setIsLayerPanelOpen - Auto-generated documentation stub.
         *
         * @returns {false} Result produced by setIsLayerPanelOpen.
         */
        setIsLayerPanelOpen(false);
      }
    };

    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'pointerdown' - Parameter derived from the static analyzer.
     * @param {*} handlePointerDown - Parameter derived from the static analyzer.
     *
     * @returns {'pointerdown', handlePointerDown} Refer to the implementation for the precise returned value.
     */
    /**
     * addEventListener - Auto-generated documentation stub.
     *
     * @param {*} 'pointerdown' - Parameter forwarded to addEventListener.
     * @param {*} handlePointerDown - Parameter forwarded to addEventListener.
     *
     * @returns {'pointerdown', handlePointerDown} Result produced by addEventListener.
     */
    document.addEventListener('pointerdown', handlePointerDown);
    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'keydown' - Parameter derived from the static analyzer.
     * @param {*} handleKeyDown - Parameter derived from the static analyzer.
     *
     * @returns {'keydown', handleKeyDown} Refer to the implementation for the precise returned value.
     */
    /**
     * addEventListener - Auto-generated documentation stub.
     *
     * @param {*} 'keydown' - Parameter forwarded to addEventListener.
     * @param {*} handleKeyDown - Parameter forwarded to addEventListener.
     *
     * @returns {'keydown', handleKeyDown} Result produced by addEventListener.
     */
    document.addEventListener('keydown', handleKeyDown);

    /**
     * return - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * return - Auto-generated documentation stub.
     */
    return () => {
      /**
       * removeEventListener - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'pointerdown' - Parameter derived from the static analyzer.
       * @param {*} handlePointerDown - Parameter derived from the static analyzer.
       *
       * @returns {'pointerdown', handlePointerDown} Refer to the implementation for the precise returned value.
       */
      /**
       * removeEventListener - Auto-generated documentation stub.
       *
       * @param {*} 'pointerdown' - Parameter forwarded to removeEventListener.
       * @param {*} handlePointerDown - Parameter forwarded to removeEventListener.
       *
       * @returns {'pointerdown', handlePointerDown} Result produced by removeEventListener.
       */
      document.removeEventListener('pointerdown', handlePointerDown);
      /**
       * removeEventListener - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'keydown' - Parameter derived from the static analyzer.
       * @param {*} handleKeyDown - Parameter derived from the static analyzer.
       *
       * @returns {'keydown', handleKeyDown} Refer to the implementation for the precise returned value.
       */
      /**
       * removeEventListener - Auto-generated documentation stub.
       *
       * @param {*} 'keydown' - Parameter forwarded to removeEventListener.
       * @param {*} handleKeyDown - Parameter forwarded to removeEventListener.
       *
       * @returns {'keydown', handleKeyDown} Result produced by removeEventListener.
       */
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLayerPanelOpen]);

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!layerControls && isLayerPanelOpen} Refer to the implementation for the precise returned value.
     */
    if (!layerControls && isLayerPanelOpen) {
      /**
       * setIsLayerPanelOpen - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {false} Refer to the implementation for the precise returned value.
       */
      /**
       * setIsLayerPanelOpen - Auto-generated documentation stub.
       *
       * @returns {false} Result produced by setIsLayerPanelOpen.
       */
      setIsLayerPanelOpen(false);
    }
  }, [layerControls, isLayerPanelOpen]);

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!isLayerPanelOpen} Refer to the implementation for the precise returned value.
     */
    if (!isLayerPanelOpen) {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {copyFeedback} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {copyFeedback} Result produced by if.
       */
      if (copyFeedback) {
        /**
         * setCopyFeedback - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {null} Refer to the implementation for the precise returned value.
         */
        /**
         * setCopyFeedback - Auto-generated documentation stub.
         *
         * @returns {null} Result produced by setCopyFeedback.
         */
        setCopyFeedback(null);
      }
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {draggingLayerId} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {draggingLayerId} Result produced by if.
       */
      if (draggingLayerId) {
        /**
         * setDraggingLayerId - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {null} Refer to the implementation for the precise returned value.
         */
        /**
         * setDraggingLayerId - Auto-generated documentation stub.
         *
         * @returns {null} Result produced by setDraggingLayerId.
         */
        setDraggingLayerId(null);
      }
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {dragOverLayer} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {dragOverLayer} Result produced by if.
       */
      if (dragOverLayer) {
        /**
         * setDragOverLayer - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {null} Refer to the implementation for the precise returned value.
         */
        /**
         * setDragOverLayer - Auto-generated documentation stub.
         *
         * @returns {null} Result produced by setDragOverLayer.
         */
        setDragOverLayer(null);
      }
    }
  }, [isLayerPanelOpen, copyFeedback, draggingLayerId, dragOverLayer]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   */
  const clearSelection = useCallback(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (layerControls && typeof layerControls.clearSelection === 'function') {
      /**
       * clearSelection - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * clearSelection - Auto-generated documentation stub.
       */
      layerControls.clearSelection();
    } else {
      pendingSelectionRef.current = null;
      /**
       * setSelectedLayerBounds - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {null} Refer to the implementation for the precise returned value.
       */
      /**
       * setSelectedLayerBounds - Auto-generated documentation stub.
       *
       * @returns {null} Result produced by setSelectedLayerBounds.
       */
      setSelectedLayerBounds(null);
    }
  }, [layerControls]);

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
  const handleStageMouseDown = useCallback((event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!selectModeActive || !layerControls} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {!selectModeActive || !layerControls} Result produced by if.
     */
    if (!selectModeActive || !layerControls) return;

    /**
     * itself - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {i.e. not on any shape} Refer to the implementation for the precise returned value.
     */
    /**
     * itself - Auto-generated documentation stub.
     *
     * @returns {i.e. not on any shape} Result produced by itself.
     */
    // If the click is on the stage itself (i.e. not on any shape), clear selection
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    if (event.target.getStage && event.target === event.target.getStage()) {
      /**
       * clearSelection - Auto-generated summary; refine if additional context is needed.
       */
      clearSelection();
    }
  }, [selectModeActive, layerControls, clearSelection]);

  // Deselect when clicking anywhere outside the canvas container
  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!selectModeActive || !layerControls} Refer to the implementation for the precise returned value.
     */
    if (!selectModeActive || !layerControls) return;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (typeof document === 'undefined') return;

    /**
     * handleDocumentPointerDown - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * handleDocumentPointerDown - Auto-generated documentation stub.
     */
    const handleDocumentPointerDown = (ev: PointerEvent) => {
      const target = ev.target as Node | null;
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (containerRef.current && target && containerRef.current.contains(target)) {
        /**
         * ignore - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {stage handler handles background clicks} Refer to the implementation for the precise returned value.
         */
        /**
         * ignore - Auto-generated documentation stub.
         *
         * @returns {stage handler handles background clicks} Result produced by ignore.
         */
        // Click was inside the canvas container - ignore (stage handler handles background clicks)
        return;
      }

      /**
       * clearSelection - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * clearSelection - Auto-generated documentation stub.
       */
      clearSelection();
    };

    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'pointerdown' - Parameter derived from the static analyzer.
     * @param {*} handleDocumentPointerDown - Parameter derived from the static analyzer.
     *
     * @returns {'pointerdown', handleDocumentPointerDown} Refer to the implementation for the precise returned value.
     */
    /**
     * addEventListener - Auto-generated documentation stub.
     *
     * @param {*} 'pointerdown' - Parameter forwarded to addEventListener.
     * @param {*} handleDocumentPointerDown - Parameter forwarded to addEventListener.
     *
     * @returns {'pointerdown', handleDocumentPointerDown} Result produced by addEventListener.
     */
    document.addEventListener('pointerdown', handleDocumentPointerDown);
    /**
     * return - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * return - Auto-generated documentation stub.
     */
    return () => document.removeEventListener('pointerdown', handleDocumentPointerDown);
  }, [selectModeActive, layerControls, clearSelection]);

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
  }, [panModeActive, spacePressed]);

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

    setPanOffset({
      x: state.origin.x + deltaX,
      y: state.origin.y + deltaY,
    });
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

  const handleCopyLayer = useCallback(
    async (layerId: string) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!layerControls} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {!layerControls} Result produced by if.
       */
      if (!layerControls) {
        return;
      }

      try {
        /**
         * copyLayer - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {layerId} Refer to the implementation for the precise returned value.
         */
        /**
         * copyLayer - Auto-generated documentation stub.
         *
         * @returns {layerId} Result produced by copyLayer.
         */
        const result = await layerControls.copyLayer(layerId);
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * if - Auto-generated documentation stub.
         */
        if (typeof result === 'string' && result.trim().length > 0) {
          /**
           * setCopyFeedback - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {result} Refer to the implementation for the precise returned value.
           */
          /**
           * setCopyFeedback - Auto-generated documentation stub.
           *
           * @returns {result} Result produced by setCopyFeedback.
           */
          setCopyFeedback(result);
        } else {
          /**
           * setCopyFeedback - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {'Layer copied'} Refer to the implementation for the precise returned value.
           */
          /**
           * setCopyFeedback - Auto-generated documentation stub.
           *
           * @returns {'Layer copied'} Result produced by setCopyFeedback.
           */
          setCopyFeedback('Layer copied');
        }
      /**
       * catch - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {error} Refer to the implementation for the precise returned value.
       */
      /**
       * catch - Auto-generated documentation stub.
       *
       * @returns {error} Result produced by catch.
       */
      } catch (error) {
        /**
         * warn - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} 'Unable to copy layer' - Parameter derived from the static analyzer.
         * @param {*} error - Parameter derived from the static analyzer.
         *
         * @returns {'Unable to copy layer', error} Refer to the implementation for the precise returned value.
         */
        /**
         * warn - Auto-generated documentation stub.
         *
         * @param {*} 'Unable to copy layer' - Parameter forwarded to warn.
         * @param {*} error - Parameter forwarded to warn.
         *
         * @returns {'Unable to copy layer', error} Result produced by warn.
         */
        console.warn('Unable to copy layer', error);
        /**
         * setCopyFeedback - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {'Unable to copy layer'} Refer to the implementation for the precise returned value.
         */
        /**
         * setCopyFeedback - Auto-generated documentation stub.
         *
         * @returns {'Unable to copy layer'} Result produced by setCopyFeedback.
         */
        setCopyFeedback('Unable to copy layer');
      }
    },
    [layerControls]
  );

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

  // Touch pinch zoom and three-finger pan
  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    const container = containerRef.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!container} Refer to the implementation for the precise returned value.
     */
    if (!container) return;

    /**
     * getTouchDistance - Auto-generated summary; refine if additional context is needed.
     */
    const getTouchDistance = (touches: TouchList) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {touches.length < 2} Refer to the implementation for the precise returned value.
       */
      if (touches.length < 2) return 0;

      const touchOne = touches[0];
      const touchTwo = touches[1];

      const dx = touchTwo.clientX - touchOne.clientX;
      const dy = touchTwo.clientY - touchOne.clientY;

      /**
       * sqrt - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {dx * dx + dy * dy} Refer to the implementation for the precise returned value.
       */
      /**
       * sqrt - Auto-generated documentation stub.
       *
       * @returns {dx * dx + dy * dy} Result produced by sqrt.
       */
      return Math.sqrt(dx * dx + dy * dy);
    };

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
     * clearTouchPan - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * clearTouchPan - Auto-generated documentation stub.
     */
    const clearTouchPan = () => {
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
    };

    /**
     * handleTouchStart - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * handleTouchStart - Auto-generated documentation stub.
     */
    const handleTouchStart = (event: TouchEvent) => {
      const touches = event.touches;

      /**
       * if - Auto-generated summary; refine if additional context is needed.
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
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      } else if (touches.length === 2) {
        /**
         * preventDefault - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * preventDefault - Auto-generated documentation stub.
         */
        event.preventDefault();
        /**
         * clearTouchPan - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * clearTouchPan - Auto-generated documentation stub.
         */
        clearTouchPan();
        /**
         * getTouchDistance - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {touches} Refer to the implementation for the precise returned value.
         */
        /**
         * getTouchDistance - Auto-generated documentation stub.
         *
         * @returns {touches} Result produced by getTouchDistance.
         */
        lastTouchDistance.current = getTouchDistance(touches);
      }
    };

    /**
     * handleTouchMove - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * handleTouchMove - Auto-generated documentation stub.
     */
    const handleTouchMove = (event: TouchEvent) => {
      const touches = event.touches;
      const panState = touchPanState.current;

      /**
       * if - Auto-generated summary; refine if additional context is needed.
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

          setPanOffset({
            x: panState.origin.x + (center.x - panState.center.x),
            y: panState.origin.y + (center.y - panState.center.y),
          });
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

        setPanOffset({
          x: panState.origin.x + (center.x - panState.center.x),
          y: panState.origin.y + (center.y - panState.center.y),
        });
        return;
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (touches.length === 2) {
        /**
         * preventDefault - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * preventDefault - Auto-generated documentation stub.
         */
        event.preventDefault();

        /**
         * getTouchDistance - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {touches} Refer to the implementation for the precise returned value.
         */
        const currentDistance = getTouchDistance(touches);
        const previousDistance = lastTouchDistance.current;

        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {previousDistance > 0} Refer to the implementation for the precise returned value.
         */
        /**
         * if - Auto-generated documentation stub.
         *
         * @returns {previousDistance > 0} Result produced by if.
         */
        if (previousDistance > 0) {
          const scaleFactor = currentDistance / previousDistance;
          const deltaZoom = (scaleFactor - 1) * PINCH_ZOOM_SENSITIVITY;

          /**
           * applyZoomDelta - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} deltaZoom - Parameter derived from the static analyzer.
           * @param {*} TOUCH_DELTA_THRESHOLD - Parameter derived from the static analyzer.
           *
           * @returns {deltaZoom, TOUCH_DELTA_THRESHOLD} Refer to the implementation for the precise returned value.
           */
          /**
           * applyZoomDelta - Auto-generated documentation stub.
           *
           * @param {*} deltaZoom - Parameter forwarded to applyZoomDelta.
           * @param {*} TOUCH_DELTA_THRESHOLD - Parameter forwarded to applyZoomDelta.
           *
           * @returns {deltaZoom, TOUCH_DELTA_THRESHOLD} Result produced by applyZoomDelta.
           */
          applyZoomDelta(deltaZoom, TOUCH_DELTA_THRESHOLD);
        }

        lastTouchDistance.current = currentDistance;
      }
    };

    /**
     * handleTouchEnd - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * handleTouchEnd - Auto-generated documentation stub.
     */
    const handleTouchEnd = (event: TouchEvent) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {touchPanState.current} Refer to the implementation for the precise returned value.
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
    };

    /**
     * handleTouchCancel - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * handleTouchCancel - Auto-generated documentation stub.
     */
    const handleTouchCancel = () => {
      /**
       * clearTouchPan - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * clearTouchPan - Auto-generated documentation stub.
       */
      clearTouchPan();
      lastTouchDistance.current = 0;
    };

    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'touchstart' - Parameter derived from the static analyzer.
     * @param {*} handleTouchStart - Parameter derived from the static analyzer.
     * @param {*} { passive - Parameter derived from the static analyzer.
     *
     * @returns {'touchstart', handleTouchStart, { passive: false }} Refer to the implementation for the precise returned value.
     */
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'touchmove' - Parameter derived from the static analyzer.
     * @param {*} handleTouchMove - Parameter derived from the static analyzer.
     * @param {*} { passive - Parameter derived from the static analyzer.
     *
     * @returns {'touchmove', handleTouchMove, { passive: false }} Refer to the implementation for the precise returned value.
     */
    /**
     * addEventListener - Auto-generated documentation stub.
     *
     * @param {*} 'touchmove' - Parameter forwarded to addEventListener.
     * @param {*} handleTouchMove - Parameter forwarded to addEventListener.
     * @param {*} { passive - Parameter forwarded to addEventListener.
     *
     * @returns {'touchmove', handleTouchMove, { passive: false }} Result produced by addEventListener.
     */
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'touchend' - Parameter derived from the static analyzer.
     * @param {*} handleTouchEnd - Parameter derived from the static analyzer.
     *
     * @returns {'touchend', handleTouchEnd} Refer to the implementation for the precise returned value.
     */
    /**
     * addEventListener - Auto-generated documentation stub.
     *
     * @param {*} 'touchend' - Parameter forwarded to addEventListener.
     * @param {*} handleTouchEnd - Parameter forwarded to addEventListener.
     *
     * @returns {'touchend', handleTouchEnd} Result produced by addEventListener.
     */
    container.addEventListener('touchend', handleTouchEnd);
    /**
     * addEventListener - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'touchcancel' - Parameter derived from the static analyzer.
     * @param {*} handleTouchCancel - Parameter derived from the static analyzer.
     *
     * @returns {'touchcancel', handleTouchCancel} Refer to the implementation for the precise returned value.
     */
    /**
     * addEventListener - Auto-generated documentation stub.
     *
     * @param {*} 'touchcancel' - Parameter forwarded to addEventListener.
     * @param {*} handleTouchCancel - Parameter forwarded to addEventListener.
     *
     * @returns {'touchcancel', handleTouchCancel} Result produced by addEventListener.
     */
    container.addEventListener('touchcancel', handleTouchCancel);

    /**
     * return - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * return - Auto-generated documentation stub.
     */
    return () => {
      /**
       * removeEventListener - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'touchstart' - Parameter derived from the static analyzer.
       * @param {*} handleTouchStart - Parameter derived from the static analyzer.
       *
       * @returns {'touchstart', handleTouchStart} Refer to the implementation for the precise returned value.
       */
      /**
       * removeEventListener - Auto-generated documentation stub.
       *
       * @param {*} 'touchstart' - Parameter forwarded to removeEventListener.
       * @param {*} handleTouchStart - Parameter forwarded to removeEventListener.
       *
       * @returns {'touchstart', handleTouchStart} Result produced by removeEventListener.
       */
      container.removeEventListener('touchstart', handleTouchStart);
      /**
       * removeEventListener - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'touchmove' - Parameter derived from the static analyzer.
       * @param {*} handleTouchMove - Parameter derived from the static analyzer.
       *
       * @returns {'touchmove', handleTouchMove} Refer to the implementation for the precise returned value.
       */
      /**
       * removeEventListener - Auto-generated documentation stub.
       *
       * @param {*} 'touchmove' - Parameter forwarded to removeEventListener.
       * @param {*} handleTouchMove - Parameter forwarded to removeEventListener.
       *
       * @returns {'touchmove', handleTouchMove} Result produced by removeEventListener.
       */
      container.removeEventListener('touchmove', handleTouchMove);
      /**
       * removeEventListener - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'touchend' - Parameter derived from the static analyzer.
       * @param {*} handleTouchEnd - Parameter derived from the static analyzer.
       *
       * @returns {'touchend', handleTouchEnd} Refer to the implementation for the precise returned value.
       */
      /**
       * removeEventListener - Auto-generated documentation stub.
       *
       * @param {*} 'touchend' - Parameter forwarded to removeEventListener.
       * @param {*} handleTouchEnd - Parameter forwarded to removeEventListener.
       *
       * @returns {'touchend', handleTouchEnd} Result produced by removeEventListener.
       */
      container.removeEventListener('touchend', handleTouchEnd);
      /**
       * removeEventListener - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'touchcancel' - Parameter derived from the static analyzer.
       * @param {*} handleTouchCancel - Parameter derived from the static analyzer.
       *
       * @returns {'touchcancel', handleTouchCancel} Refer to the implementation for the precise returned value.
       */
      /**
       * removeEventListener - Auto-generated documentation stub.
       *
       * @param {*} 'touchcancel' - Parameter forwarded to removeEventListener.
       * @param {*} handleTouchCancel - Parameter forwarded to removeEventListener.
       *
       * @returns {'touchcancel', handleTouchCancel} Result produced by removeEventListener.
       */
      container.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [applyZoomDelta, panModeActive]);

  /**
   * max - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} 1 - Parameter derived from the static analyzer.
   * @param {*} width * scale - Parameter derived from the static analyzer.
   *
   * @returns {1, width * scale} Refer to the implementation for the precise returned value.
   */
  /**
   * max - Auto-generated documentation stub.
   *
   * @param {*} 1 - Parameter forwarded to max.
   * @param {*} width * scale - Parameter forwarded to max.
   *
   * @returns {1, width * scale} Result produced by max.
   */
  const renderWidth = Math.max(1, width * scale);
  /**
   * max - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} 1 - Parameter derived from the static analyzer.
   * @param {*} height * scale - Parameter derived from the static analyzer.
   *
   * @returns {1, height * scale} Refer to the implementation for the precise returned value.
   */
  /**
   * max - Auto-generated documentation stub.
   *
   * @param {*} 1 - Parameter forwarded to max.
   * @param {*} height * scale - Parameter forwarded to max.
   *
   * @returns {1, height * scale} Result produced by max.
   */
  const renderHeight = Math.max(1, height * scale);
  /**
   * max - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} scale - Parameter derived from the static analyzer.
   * @param {*} 0.0001 - Parameter derived from the static analyzer.
   *
   * @returns {scale, 0.0001} Refer to the implementation for the precise returned value.
   */
  /**
   * max - Auto-generated documentation stub.
   *
   * @param {*} scale - Parameter forwarded to max.
   * @param {*} 0.0001 - Parameter forwarded to max.
   *
   * @returns {scale, 0.0001} Result produced by max.
   */
  const safeScale = Math.max(scale, 0.0001);
  const stageViewportOffsetX = ((containerDimensions.width - renderWidth) / 2 + panOffset.x) / Math.max(safeScale, 0.000001);
  const stageViewportOffsetY = ((containerDimensions.height - renderHeight) / 2 + panOffset.y) / Math.max(safeScale, 0.000001);
  const outlineDash: [number, number] = [8 / safeScale, 4 / safeScale];
  /**
   * max - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} 8 / safeScale - Parameter derived from the static analyzer.
   * @param {*} 6 - Parameter derived from the static analyzer.
   *
   * @returns {8 / safeScale, 6} Refer to the implementation for the precise returned value.
   */
  /**
   * max - Auto-generated documentation stub.
   *
   * @param {*} 8 / safeScale - Parameter forwarded to max.
   * @param {*} 6 - Parameter forwarded to max.
   *
   * @returns {8 / safeScale, 6} Result produced by max.
   */
  const transformerAnchorSize = Math.max(8 / safeScale, 6);
  /**
   * max - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} 1 / safeScale - Parameter derived from the static analyzer.
   * @param {*} 0.75 - Parameter derived from the static analyzer.
   *
   * @returns {1 / safeScale, 0.75} Refer to the implementation for the precise returned value.
   */
  /**
   * max - Auto-generated documentation stub.
   *
   * @param {*} 1 / safeScale - Parameter forwarded to max.
   * @param {*} 0.75 - Parameter forwarded to max.
   *
   * @returns {1 / safeScale, 0.75} Result produced by max.
   */
  const transformerAnchorStrokeWidth = Math.max(1 / safeScale, 0.75);
  /**
   * max - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} 2 / safeScale - Parameter derived from the static analyzer.
   * @param {*} 1 - Parameter derived from the static analyzer.
   *
   * @returns {2 / safeScale, 1} Refer to the implementation for the precise returned value.
   */
  /**
   * max - Auto-generated documentation stub.
   *
   * @param {*} 2 / safeScale - Parameter forwarded to max.
   * @param {*} 1 - Parameter forwarded to max.
   *
   * @returns {2 / safeScale, 1} Result produced by max.
   */
  const transformerAnchorCornerRadius = Math.max(2 / safeScale, 1);
  const transformerPadding = 0;
  /**
   * max - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} 12 / safeScale - Parameter derived from the static analyzer.
   * @param {*} 6 - Parameter derived from the static analyzer.
   *
   * @returns {12 / safeScale, 6} Refer to the implementation for the precise returned value.
   */
  /**
   * max - Auto-generated documentation stub.
   *
   * @param {*} 12 / safeScale - Parameter forwarded to max.
   * @param {*} 6 - Parameter forwarded to max.
   *
   * @returns {12 / safeScale, 6} Result produced by max.
   */
  const transformerHitStrokeWidth = Math.max(12 / safeScale, 6);

  const baseCursor = (isPointerPanning || isTouchPanning)
    ? 'grabbing'
    : (panModeActive || spacePressed ? 'grab' : 'default');

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!stageRef.current} Refer to the implementation for the precise returned value.
     */
    if (!stageRef.current) {
      return;
    }

    /**
     * container - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * container - Auto-generated documentation stub.
     */
    stageRef.current.container().style.cursor = baseCursor;
  }, [baseCursor, selectModeActive]);

  /**
   * box - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {screen-space} Refer to the implementation for the precise returned value.
   */
  /**
   * box - Auto-generated documentation stub.
   *
   * @returns {screen-space} Result produced by box.
   */
  // Compute an HTML overlay selection box (screen-space) so the selection
  // bounding box can be visible even when portions are outside the Konva stage.
  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  useEffect(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!selectedLayerBounds} Refer to the implementation for the precise returned value.
     */
    if (!selectedLayerBounds) {
      /**
       * setOverlaySelectionBox - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {null} Refer to the implementation for the precise returned value.
       */
      /**
       * setOverlaySelectionBox - Auto-generated documentation stub.
       *
       * @returns {null} Result produced by setOverlaySelectionBox.
       */
      setOverlaySelectionBox(null);
      return;
    }

    const boxW = Math.max(0, selectedLayerBounds.width);
    const boxH = Math.max(0, selectedLayerBounds.height);

    // Center coordinates in stage space
    const centerX = selectedLayerBounds.x + selectedLayerBounds.width / 2;
    const centerY = selectedLayerBounds.y + selectedLayerBounds.height / 2;

    // Decide rotation for overlay — reuse the same logic used for transformer rotation
    const rotationDeg = resolveSelectionRotation();

    /**
     * setOverlaySelectionBox - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} { x - Parameter derived from the static analyzer.
     * @param {*} y - Parameter derived from the static analyzer.
     * @param {*} width - Parameter derived from the static analyzer.
     * @param {*} height - Parameter derived from the static analyzer.
     * @param {*} rotation - Parameter derived from the static analyzer.
     *
     * @returns {{ x: centerX, y: centerY, width: boxW, height: boxH, rotation: rotationDeg }} Refer to the implementation for the precise returned value.
     */
    /**
     * setOverlaySelectionBox - Auto-generated documentation stub.
     *
     * @param {*} { x - Parameter forwarded to setOverlaySelectionBox.
     * @param {*} y - Parameter forwarded to setOverlaySelectionBox.
     * @param {*} width - Parameter forwarded to setOverlaySelectionBox.
     * @param {*} height - Parameter forwarded to setOverlaySelectionBox.
     * @param {*} rotation - Parameter forwarded to setOverlaySelectionBox.
     *
     * @returns {{ x: centerX, y: centerY, width: boxW, height: boxH, rotation: rotationDeg }} Result produced by setOverlaySelectionBox.
     */
    const newBox = { x: centerX, y: centerY, width: boxW, height: boxH, rotation: rotationDeg };
    console.log('[DEBUG] updateOverlaySelectionBox - Setting selection box:', newBox);
    console.log('[DEBUG] selectedLayerBounds:', selectedLayerBounds);
    console.log('[DEBUG] containerDimensions:', containerDimensions);
    console.log('[DEBUG] renderWidth:', renderWidth, 'renderHeight:', renderHeight);
    console.log('[DEBUG] panOffset:', panOffset);
    console.log('[DEBUG] scale:', scale);
    setOverlaySelectionBox(newBox);
  }, [selectedLayerBounds, resolveSelectionRotation, containerDimensions, renderWidth, renderHeight, panOffset, scale]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   */
  const syncTransformerToSelection = useCallback(() => {
    const transformer = selectionTransformerRef.current;
    const proxy = selectionProxyRef.current;

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!transformer || !proxy} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {!transformer || !proxy} Result produced by if.
     */
    if (!transformer || !proxy) {
      return;
    }

    /**
     * active - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {selection extends outside the stage} Refer to the implementation for the precise returned value.
     */
    /**
     * active - Auto-generated documentation stub.
     *
     * @returns {selection extends outside the stage} Result produced by active.
     */
    // If we have an HTML overlay active (selection extends outside the stage) hide
    // the Konva transformer and proxy so only the overlay is visible.
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {overlaySelectionBox} Refer to the implementation for the precise returned value.
     */
    if (overlaySelectionBox) {
      try {
        /**
         * visible - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {false} Refer to the implementation for the precise returned value.
         */
        /**
         * visible - Auto-generated documentation stub.
         *
         * @returns {false} Result produced by visible.
         */
        proxy.visible(false);
      } catch {}
      try {
        /**
         * nodes - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {[]} Refer to the implementation for the precise returned value.
         */
        /**
         * nodes - Auto-generated documentation stub.
         *
         * @returns {[]} Result produced by nodes.
         */
        transformer.nodes([]);
        /**
         * visible - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {false} Refer to the implementation for the precise returned value.
         */
        /**
         * visible - Auto-generated documentation stub.
         *
         * @returns {false} Result produced by visible.
         */
        transformer.visible(false);
        /**
         * getLayer - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * getLayer - Auto-generated documentation stub.
         */
        transformer.getLayer()?.batchDraw();
      } catch {}
      return;
    }

    // Allow transformer to be visible during interaction even without valid bounds yet
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (!selectModeActive || (!selectedLayerBounds && !isInteractingWithSelection)) {
      /**
       * visible - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {false} Refer to the implementation for the precise returned value.
       */
      proxy.visible(false);
      /**
       * nodes - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {[]} Refer to the implementation for the precise returned value.
       */
      /**
       * nodes - Auto-generated documentation stub.
       *
       * @returns {[]} Result produced by nodes.
       */
      transformer.nodes([]);
      /**
       * visible - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {false} Refer to the implementation for the precise returned value.
       */
      /**
       * visible - Auto-generated documentation stub.
       *
       * @returns {false} Result produced by visible.
       */
      transformer.visible(false);
      /**
       * getLayer - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * getLayer - Auto-generated documentation stub.
       */
      transformer.getLayer()?.batchDraw();
      return;
    }

    // If we're interacting but don't have bounds yet, keep transformer visible but without nodes
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {isInteractingWithSelection && !selectedLayerBounds} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {isInteractingWithSelection && !selectedLayerBounds} Result produced by if.
     */
    if (isInteractingWithSelection && !selectedLayerBounds) {
      /**
       * visible - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {false} Refer to the implementation for the precise returned value.
       */
      /**
       * visible - Auto-generated documentation stub.
       *
       * @returns {false} Result produced by visible.
       */
      proxy.visible(false);
      /**
       * nodes - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {[]} Refer to the implementation for the precise returned value.
       */
      /**
       * nodes - Auto-generated documentation stub.
       *
       * @returns {[]} Result produced by nodes.
       */
      transformer.nodes([]);
      /**
       * visible - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {true} Refer to the implementation for the precise returned value.
       */
      /**
       * visible - Auto-generated documentation stub.
       *
       * @returns {true} Result produced by visible.
       */
      transformer.visible(true);
      /**
       * getLayer - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * getLayer - Auto-generated documentation stub.
       */
      transformer.getLayer()?.batchDraw();
      return;
    }

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!isSelectionTransformingRef.current} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {!isSelectionTransformingRef.current} Result produced by if.
     */
    if (!isSelectionTransformingRef.current) {
      const minimumSize = 0.001;
      // axis-aligned bounding box from nodes
      /**
       * max - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} selectedLayerBounds.width - Parameter derived from the static analyzer.
       * @param {*} minimumSize - Parameter derived from the static analyzer.
       *
       * @returns {selectedLayerBounds.width, minimumSize} Refer to the implementation for the precise returned value.
       */
      /**
       * max - Auto-generated documentation stub.
       *
       * @param {*} selectedLayerBounds.width - Parameter forwarded to max.
       * @param {*} minimumSize - Parameter forwarded to max.
       *
       * @returns {selectedLayerBounds.width, minimumSize} Result produced by max.
       */
      const bboxW = Math.max(selectedLayerBounds.width, minimumSize);
      /**
       * max - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} selectedLayerBounds.height - Parameter derived from the static analyzer.
       * @param {*} minimumSize - Parameter derived from the static analyzer.
       *
       * @returns {selectedLayerBounds.height, minimumSize} Refer to the implementation for the precise returned value.
       */
      /**
       * max - Auto-generated documentation stub.
       *
       * @param {*} selectedLayerBounds.height - Parameter forwarded to max.
       * @param {*} minimumSize - Parameter forwarded to max.
       *
       * @returns {selectedLayerBounds.height, minimumSize} Result produced by max.
       */
      const bboxH = Math.max(selectedLayerBounds.height, minimumSize);
      const centerX = selectedLayerBounds.x + selectedLayerBounds.width / 2;
      const centerY = selectedLayerBounds.y + selectedLayerBounds.height / 2;

      // Determine desired rotation in degrees using the same logic as the overlay selection.
      /**
       * resolveSelectionRotation - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * resolveSelectionRotation - Auto-generated documentation stub.
       */
      const rotationDeg = resolveSelectionRotation();
      const rotationRad = (rotationDeg * Math.PI) / 180;

      // Compute absolute trig values for the rotation
      /**
       * abs - Auto-generated summary; refine if additional context is needed.
       */
      const a = Math.abs(Math.cos(rotationRad));
      /**
       * abs - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * abs - Auto-generated documentation stub.
       */
      const b = Math.abs(Math.sin(rotationRad));

      /**
       * local - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {unrotated} Refer to the implementation for the precise returned value.
       */
      // Solve for local (unrotated) width/height so that when rotated by rotationDeg
      // the axis-aligned bounding box becomes [bboxW, bboxH].
      // [bboxW]   [ a  b ] [w]
      // [bboxH] = [ b  a ] [h]
      /**
       * cos - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {2R} Refer to the implementation for the precise returned value.
       */
      // Invert when possible: det = a^2 - b^2 = cos(2R)
      let localW = bboxW;
      let localH = bboxH;
      const denom = a * a - b * b;

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (Math.abs(denom) < 1e-6) {
        /**
         * singular - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {around 45deg} Refer to the implementation for the precise returned value.
         */
        // Near singular (around 45deg) – fall back to a square to avoid instability
        /**
         * max - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} bboxW - Parameter derived from the static analyzer.
         * @param {*} bboxH - Parameter derived from the static analyzer.
         *
         * @returns {bboxW, bboxH} Refer to the implementation for the precise returned value.
         */
        const maxSide = Math.max(bboxW, bboxH);
        localW = maxSide;
        localH = maxSide;
      } else {
        localW = (a * bboxW - b * bboxH) / denom;
        localH = (-b * bboxW + a * bboxH) / denom;

        // sanity clamps: ensure positive finite sizes
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * if - Auto-generated documentation stub.
         */
        if (!Number.isFinite(localW) || localW <= 0) {
          localW = bboxW;
        }
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        if (!Number.isFinite(localH) || localH <= 0) {
          localH = bboxH;
        }
      }

      /**
       * width - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {localW} Refer to the implementation for the precise returned value.
       */
      /**
       * width - Auto-generated documentation stub.
       *
       * @returns {localW} Result produced by width.
       */
      proxy.width(localW);
      /**
       * height - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {localH} Refer to the implementation for the precise returned value.
       */
      /**
       * height - Auto-generated documentation stub.
       *
       * @returns {localH} Result produced by height.
       */
      proxy.height(localH);
      proxy.offset({
        x: localW / 2,
        y: localH / 2,
      });
      proxy.position({
        x: centerX,
        y: centerY,
      });
      /**
       * rotation - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {rotationDeg} Refer to the implementation for the precise returned value.
       */
      /**
       * rotation - Auto-generated documentation stub.
       *
       * @returns {rotationDeg} Result produced by rotation.
       */
      proxy.rotation(rotationDeg);
      /**
       * scale - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} { x - Parameter derived from the static analyzer.
       * @param {*} y - Parameter derived from the static analyzer.
       *
       * @returns {{ x: 1, y: 1 }} Refer to the implementation for the precise returned value.
       */
      /**
       * scale - Auto-generated documentation stub.
       *
       * @param {*} { x - Parameter forwarded to scale.
       * @param {*} y - Parameter forwarded to scale.
       *
       * @returns {{ x: 1, y: 1 }} Result produced by scale.
       */
      proxy.scale({ x: 1, y: 1 });
    }

    /**
     * visible - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {true} Refer to the implementation for the precise returned value.
     */
    /**
     * visible - Auto-generated documentation stub.
     *
     * @returns {true} Result produced by visible.
     */
    proxy.visible(true);

    /**
     * nodes - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {[proxy]} Refer to the implementation for the precise returned value.
     */
    /**
     * nodes - Auto-generated documentation stub.
     *
     * @returns {[proxy]} Result produced by nodes.
     */
    transformer.nodes([proxy]);
    /**
     * visible - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {true} Refer to the implementation for the precise returned value.
     */
    /**
     * visible - Auto-generated documentation stub.
     *
     * @returns {true} Result produced by visible.
     */
    transformer.visible(true);
    /**
     * forceUpdate - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * forceUpdate - Auto-generated documentation stub.
     */
    transformer.forceUpdate();
    /**
     * getLayer - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * getLayer - Auto-generated documentation stub.
     */
    transformer.getLayer()?.batchDraw();
  }, [selectModeActive, selectedLayerBounds, layerControls, selectedLayerIds, overlaySelectionBox, isInteractingWithSelection, resolveSelectionRotation]);

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    /**
     * syncTransformerToSelection - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * syncTransformerToSelection - Auto-generated documentation stub.
     */
    syncTransformerToSelection();
  }, [layersRevision, syncTransformerToSelection]);

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!selectModeActive || isSelectionTransformingRef.current} Refer to the implementation for the precise returned value.
     */
    if (!selectModeActive || isSelectionTransformingRef.current) {
      return;
    }

    /**
     * resolveSelectionRotation - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * resolveSelectionRotation - Auto-generated documentation stub.
     */
    const nextRotation = resolveSelectionRotation();
    /**
     * isFinite - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {nextRotation} Refer to the implementation for the precise returned value.
     */
    const normalizedRotation = Number.isFinite(nextRotation) ? nextRotation : 0;

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    if (selectionProxyRotationRef.current !== normalizedRotation) {
      selectionProxyRotationRef.current = normalizedRotation;
      /**
       * syncTransformerToSelection - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * syncTransformerToSelection - Auto-generated documentation stub.
       */
      syncTransformerToSelection();
    }
  }, [resolveSelectionRotation, selectModeActive, syncTransformerToSelection]);

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  useEffect(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!pendingSelectionRef.current} Refer to the implementation for the precise returned value.
     */
    if (!pendingSelectionRef.current) {
      return;
    }

    const pending = pendingSelectionRef.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (pending.length !== selectedLayerIds.length) {
      return;
    }

    /**
     * every - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} (id - Parameter derived from the static analyzer.
     * @param {*} index - Parameter derived from the static analyzer.
     */
    /**
     * every - Auto-generated documentation stub.
     *
     * @param {*} (id - Parameter forwarded to every.
     * @param {*} index - Parameter forwarded to every.
     */
    const matches = pending.every((id, index) => id === selectedLayerIds[index]);
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {matches} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {matches} Result produced by if.
     */
    if (matches) {
      pendingSelectionRef.current = null;
    }
  }, [selectedLayerIds]);
  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    selectionTransformStateRef.current = null;
  }, [selectedLayerIds]);

  /**
   * clicks - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {use Konva events to satisfy typings} Refer to the implementation for the precise returned value.
   */
  /**
   * clicks - Auto-generated documentation stub.
   *
   * @returns {use Konva events to satisfy typings} Result produced by clicks.
   */
  // Attach Konva stage listeners for background clicks (use Konva events to satisfy typings)
  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  useEffect(() => {
    const stage = stageRef.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!stage || !selectModeActive} Refer to the implementation for the precise returned value.
     */
    if (!stage || !selectModeActive) return;

    /**
     * handler - Auto-generated summary; refine if additional context is needed.
     */
    const handler = (event: any) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (event.target === event.target.getStage()) {
        /**
         * clearSelection - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * clearSelection - Auto-generated documentation stub.
         */
        clearSelection();
      }
    };

    /**
     * on - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'mousedown' - Parameter derived from the static analyzer.
     * @param {*} handler - Parameter derived from the static analyzer.
     *
     * @returns {'mousedown', handler} Refer to the implementation for the precise returned value.
     */
    /**
     * on - Auto-generated documentation stub.
     *
     * @param {*} 'mousedown' - Parameter forwarded to on.
     * @param {*} handler - Parameter forwarded to on.
     *
     * @returns {'mousedown', handler} Result produced by on.
     */
    stage.on('mousedown', handler);
    /**
     * on - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'touchstart' - Parameter derived from the static analyzer.
     * @param {*} handler - Parameter derived from the static analyzer.
     *
     * @returns {'touchstart', handler} Refer to the implementation for the precise returned value.
     */
    /**
     * on - Auto-generated documentation stub.
     *
     * @param {*} 'touchstart' - Parameter forwarded to on.
     * @param {*} handler - Parameter forwarded to on.
     *
     * @returns {'touchstart', handler} Result produced by on.
     */
    stage.on('touchstart', handler);

    /**
     * return - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * return - Auto-generated documentation stub.
     */
    return () => {
      /**
       * off - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'mousedown' - Parameter derived from the static analyzer.
       * @param {*} handler - Parameter derived from the static analyzer.
       *
       * @returns {'mousedown', handler} Refer to the implementation for the precise returned value.
       */
      /**
       * off - Auto-generated documentation stub.
       *
       * @param {*} 'mousedown' - Parameter forwarded to off.
       * @param {*} handler - Parameter forwarded to off.
       *
       * @returns {'mousedown', handler} Result produced by off.
       */
      stage.off('mousedown', handler);
      /**
       * off - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 'touchstart' - Parameter derived from the static analyzer.
       * @param {*} handler - Parameter derived from the static analyzer.
       *
       * @returns {'touchstart', handler} Refer to the implementation for the precise returned value.
       */
      /**
       * off - Auto-generated documentation stub.
       *
       * @param {*} 'touchstart' - Parameter forwarded to off.
       * @param {*} handler - Parameter forwarded to off.
       *
       * @returns {'touchstart', handler} Result produced by off.
       */
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
    /**
     * getBoundingClientRect - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * getBoundingClientRect - Auto-generated documentation stub.
     */
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
      {layerControls && isSelectToolActive && (
        <>
          <button
            ref={layerButtonRef}
            type="button"
            aria-expanded={isLayerPanelOpen}
            aria-label={isLayerPanelOpen ? 'Hide layer controls' : 'Show layer controls'}
            title={isLayerPanelOpen ? 'Hide layer controls' : 'Show layer controls'}
            /**
             * setIsLayerPanelOpen - Auto-generated summary; refine if additional context is needed.
             */
            /**
             * setIsLayerPanelOpen - Auto-generated documentation stub.
             */
            onClick={() => setIsLayerPanelOpen((previous) => !previous)}
            /**
             * stopPropagation - Auto-generated summary; refine if additional context is needed.
             */
            /**
             * stopPropagation - Auto-generated documentation stub.
             */
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
              /**
               * rgba - Auto-generated summary; refine if additional context is needed.
               *
               * @param {*} 0 - Parameter derived from the static analyzer.
               * @param {*} 0 - Parameter derived from the static analyzer.
               * @param {*} 0 - Parameter derived from the static analyzer.
               * @param {*} 0.12 - Parameter derived from the static analyzer.
               *
               * @returns {0,0,0,0.12} Refer to the implementation for the precise returned value.
               */
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
              /**
               * stopPropagation - Auto-generated summary; refine if additional context is needed.
               */
              /**
               * stopPropagation - Auto-generated documentation stub.
               */
              onPointerDown={(event) => event.stopPropagation()}
              /**
               * stopPropagation - Auto-generated summary; refine if additional context is needed.
               */
              /**
               * stopPropagation - Auto-generated documentation stub.
               */
              onPointerUp={(event) => event.stopPropagation()}
              /**
               * stopPropagation - Auto-generated summary; refine if additional context is needed.
               */
              /**
               * stopPropagation - Auto-generated documentation stub.
               */
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
                /**
                 * rgba - Auto-generated summary; refine if additional context is needed.
                 *
                 * @param {*} 0 - Parameter derived from the static analyzer.
                 * @param {*} 0 - Parameter derived from the static analyzer.
                 * @param {*} 0 - Parameter derived from the static analyzer.
                 * @param {*} 0.16 - Parameter derived from the static analyzer.
                 *
                 * @returns {0,0,0,0.16} Refer to the implementation for the precise returned value.
                 */
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
                  /**
                   * setIsLayerPanelOpen - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {false} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * setIsLayerPanelOpen - Auto-generated documentation stub.
                   *
                   * @returns {false} Result produced by setIsLayerPanelOpen.
                   */
                  onClick={() => setIsLayerPanelOpen(false)}
                  /**
                   * stopPropagation - Auto-generated summary; refine if additional context is needed.
                   */
                  /**
                   * stopPropagation - Auto-generated documentation stub.
                   */
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
                  /**
                   * addLayer - Auto-generated summary; refine if additional context is needed.
                   */
                  /**
                   * addLayer - Auto-generated documentation stub.
                   */
                  layerControls.addLayer();
                }}
                /**
                 * stopPropagation - Auto-generated summary; refine if additional context is needed.
                 */
                /**
                 * stopPropagation - Auto-generated documentation stub.
                 */
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
                  /**
                   * map - Auto-generated summary; refine if additional context is needed.
                   *
                   * @param {*} (layer - Parameter derived from the static analyzer.
                   * @param {*} index - Parameter derived from the static analyzer.
                   */
                  /**
                   * map - Auto-generated documentation stub.
                   *
                   * @param {*} (layer - Parameter forwarded to map.
                   * @param {*} index - Parameter forwarded to map.
                   */
                  layerControls.layers.map((layer, index) => {
                    /**
                     * has - Auto-generated summary; refine if additional context is needed.
                     *
                     * @returns {layer.id} Refer to the implementation for the precise returned value.
                     */
                    /**
                     * has - Auto-generated documentation stub.
                     *
                     * @returns {layer.id} Result produced by has.
                     */
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
                      /**
                       * rgba - Auto-generated summary; refine if additional context is needed.
                       *
                       * @param {*} 74 - Parameter derived from the static analyzer.
                       * @param {*} 144 - Parameter derived from the static analyzer.
                       * @param {*} 226 - Parameter derived from the static analyzer.
                       * @param {*} 0.25 - Parameter derived from the static analyzer.
                       *
                       * @returns {74,144,226,0.25} Refer to the implementation for the precise returned value.
                       */
                      boxShadow: isPrimary ? '0 0 0 2px rgba(74,144,226,0.25)' : undefined,
                    };

                    /**
                     * if - Auto-generated summary; refine if additional context is needed.
                     */
                    /**
                     * if - Auto-generated documentation stub.
                     */
                    if (dropPosition === 'above') {
                      containerStyle.boxShadow = '0 -4px 0 0 #4a90e2';
                    /**
                     * if - Auto-generated summary; refine if additional context is needed.
                     */
                    /**
                     * if - Auto-generated documentation stub.
                     */
                    } else if (dropPosition === 'below') {
                      containerStyle.boxShadow = '0 4px 0 0 #4a90e2';
                    }

                    return (
                      <div
                        key={layer.id}
                        style={containerStyle}
                        draggable
                        onDragStart={(event: KonvaEventObject<DragEvent>) => {
                          /**
                           * stopPropagation - Auto-generated summary; refine if additional context is needed.
                           */
                          /**
                           * stopPropagation - Auto-generated documentation stub.
                           */
                          event.stopPropagation();
                          /**
                           * setDraggingLayerId - Auto-generated summary; refine if additional context is needed.
                           *
                           * @returns {layer.id} Refer to the implementation for the precise returned value.
                           */
                          /**
                           * setDraggingLayerId - Auto-generated documentation stub.
                           *
                           * @returns {layer.id} Result produced by setDraggingLayerId.
                           */
                          setDraggingLayerId(layer.id);
                          /**
                           * setDragOverLayer - Auto-generated summary; refine if additional context is needed.
                           *
                           * @returns {null} Refer to the implementation for the precise returned value.
                           */
                          /**
                           * setDragOverLayer - Auto-generated documentation stub.
                           *
                           * @returns {null} Result produced by setDragOverLayer.
                           */
                          setDragOverLayer(null);
                          /**
                           * if - Auto-generated summary; refine if additional context is needed.
                           *
                           * @returns {event.dataTransfer} Refer to the implementation for the precise returned value.
                           */
                          /**
                           * if - Auto-generated documentation stub.
                           *
                           * @returns {event.dataTransfer} Result produced by if.
                           */
                          if (event.dataTransfer) {
                            event.dataTransfer.effectAllowed = 'move';
                            /**
                             * setData - Auto-generated summary; refine if additional context is needed.
                             *
                             * @param {*} 'text/plain' - Parameter derived from the static analyzer.
                             * @param {*} layer.id - Parameter derived from the static analyzer.
                             *
                             * @returns {'text/plain', layer.id} Refer to the implementation for the precise returned value.
                             */
                            /**
                             * setData - Auto-generated documentation stub.
                             *
                             * @param {*} 'text/plain' - Parameter forwarded to setData.
                             * @param {*} layer.id - Parameter forwarded to setData.
                             *
                             * @returns {'text/plain', layer.id} Result produced by setData.
                             */
                            event.dataTransfer.setData('text/plain', layer.id);
                          }
                        }}
                        onDragEnd={(event: KonvaEventObject<DragEvent>) => {
                          /**
                           * stopPropagation - Auto-generated summary; refine if additional context is needed.
                           */
                          /**
                           * stopPropagation - Auto-generated documentation stub.
                           */
                          event.stopPropagation();
                          /**
                           * setDraggingLayerId - Auto-generated summary; refine if additional context is needed.
                           *
                           * @returns {null} Refer to the implementation for the precise returned value.
                           */
                          /**
                           * setDraggingLayerId - Auto-generated documentation stub.
                           *
                           * @returns {null} Result produced by setDraggingLayerId.
                           */
                          setDraggingLayerId(null);
                          /**
                           * setDragOverLayer - Auto-generated summary; refine if additional context is needed.
                           *
                           * @returns {null} Refer to the implementation for the precise returned value.
                           */
                          /**
                           * setDragOverLayer - Auto-generated documentation stub.
                           *
                           * @returns {null} Result produced by setDragOverLayer.
                           */
                          setDragOverLayer(null);
                          /**
                           * ensureAllVisible - Auto-generated summary; refine if additional context is needed.
                           */
                          /**
                           * ensureAllVisible - Auto-generated documentation stub.
                           */
                          layerControls.ensureAllVisible();
                        }}
                        onDragOver={(event) => {
                          /**
                           * preventDefault - Auto-generated summary; refine if additional context is needed.
                           */
                          /**
                           * preventDefault - Auto-generated documentation stub.
                           */
                          event.preventDefault();
                          /**
                           * stopPropagation - Auto-generated summary; refine if additional context is needed.
                           */
                          /**
                           * stopPropagation - Auto-generated documentation stub.
                           */
                          event.stopPropagation();
                          /**
                           * if - Auto-generated summary; refine if additional context is needed.
                           */
                          /**
                           * if - Auto-generated documentation stub.
                           */
                          if (!draggingLayerId || draggingLayerId === layer.id) {
                            return;
                          }
                          /**
                           * if - Auto-generated summary; refine if additional context is needed.
                           *
                           * @returns {event.dataTransfer} Refer to the implementation for the precise returned value.
                           */
                          /**
                           * if - Auto-generated documentation stub.
                           *
                           * @returns {event.dataTransfer} Result produced by if.
                           */
                          if (event.dataTransfer) {
                            event.dataTransfer.dropEffect = 'move';
                          }
                          /**
                           * resolveDropPosition - Auto-generated summary; refine if additional context is needed.
                           *
                           * @returns {event} Refer to the implementation for the precise returned value.
                           */
                          /**
                           * resolveDropPosition - Auto-generated documentation stub.
                           *
                           * @returns {event} Result produced by resolveDropPosition.
                           */
                          const position = resolveDropPosition(event);
                          /**
                           * setDragOverLayer - Auto-generated summary; refine if additional context is needed.
                           */
                          /**
                           * setDragOverLayer - Auto-generated documentation stub.
                           */
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
                          /**
                           * preventDefault - Auto-generated summary; refine if additional context is needed.
                           */
                          /**
                           * preventDefault - Auto-generated documentation stub.
                           */
                          event.preventDefault();
                          /**
                           * stopPropagation - Auto-generated summary; refine if additional context is needed.
                           */
                          /**
                           * stopPropagation - Auto-generated documentation stub.
                           */
                          event.stopPropagation();
                          const sourceId =
                            /**
                             * getData - Auto-generated summary; refine if additional context is needed.
                             *
                             * @returns {'text/plain'} Refer to the implementation for the precise returned value.
                             */
                            draggingLayerId || event.dataTransfer?.getData('text/plain');
                          /**
                           * if - Auto-generated summary; refine if additional context is needed.
                           */
                          /**
                           * if - Auto-generated documentation stub.
                           */
                          if (!sourceId || sourceId === layer.id) {
                            /**
                             * setDragOverLayer - Auto-generated summary; refine if additional context is needed.
                             *
                             * @returns {null} Refer to the implementation for the precise returned value.
                             */
                            /**
                             * setDragOverLayer - Auto-generated documentation stub.
                             *
                             * @returns {null} Result produced by setDragOverLayer.
                             */
                            setDragOverLayer(null);
                            /**
                             * setDraggingLayerId - Auto-generated summary; refine if additional context is needed.
                             *
                             * @returns {null} Refer to the implementation for the precise returned value.
                             */
                            /**
                             * setDraggingLayerId - Auto-generated documentation stub.
                             *
                             * @returns {null} Result produced by setDraggingLayerId.
                             */
                            setDraggingLayerId(null);
                            return;
                          }
                          /**
                           * resolveDropPosition - Auto-generated summary; refine if additional context is needed.
                           *
                           * @returns {event} Refer to the implementation for the precise returned value.
                           */
                          /**
                           * resolveDropPosition - Auto-generated documentation stub.
                           *
                           * @returns {event} Result produced by resolveDropPosition.
                           */
                          const position = resolveDropPosition(event);
                          /**
                           * reorderLayer - Auto-generated summary; refine if additional context is needed.
                           *
                           * @param {*} sourceId - Parameter derived from the static analyzer.
                           * @param {*} layer.id - Parameter derived from the static analyzer.
                           * @param {*} position - Parameter derived from the static analyzer.
                           *
                           * @returns {sourceId, layer.id, position} Refer to the implementation for the precise returned value.
                           */
                          /**
                           * reorderLayer - Auto-generated documentation stub.
                           *
                           * @param {*} sourceId - Parameter forwarded to reorderLayer.
                           * @param {*} layer.id - Parameter forwarded to reorderLayer.
                           * @param {*} position - Parameter forwarded to reorderLayer.
                           *
                           * @returns {sourceId, layer.id, position} Result produced by reorderLayer.
                           */
                          layerControls.reorderLayer(sourceId, layer.id, position);
                          /**
                           * setDragOverLayer - Auto-generated summary; refine if additional context is needed.
                           *
                           * @returns {null} Refer to the implementation for the precise returned value.
                           */
                          /**
                           * setDragOverLayer - Auto-generated documentation stub.
                           *
                           * @returns {null} Result produced by setDragOverLayer.
                           */
                          setDragOverLayer(null);
                          /**
                           * setDraggingLayerId - Auto-generated summary; refine if additional context is needed.
                           *
                           * @returns {null} Refer to the implementation for the precise returned value.
                           */
                          /**
                           * setDraggingLayerId - Auto-generated documentation stub.
                           *
                           * @returns {null} Result produced by setDraggingLayerId.
                           */
                          setDraggingLayerId(null);
                          /**
                           * ensureAllVisible - Auto-generated summary; refine if additional context is needed.
                           */
                          /**
                           * ensureAllVisible - Auto-generated documentation stub.
                           */
                          layerControls.ensureAllVisible();
                        }}
                        onDragLeave={(event) => {
                          /**
                           * stopPropagation - Auto-generated summary; refine if additional context is needed.
                           */
                          /**
                           * stopPropagation - Auto-generated documentation stub.
                           */
                          event.stopPropagation();
                          if (
                            !event.currentTarget.contains(
                              event.relatedTarget as Node | null
                            )
                          ) {
                            /**
                             * setDragOverLayer - Auto-generated summary; refine if additional context is needed.
                             */
                            /**
                             * setDragOverLayer - Auto-generated documentation stub.
                             */
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
                            /**
                             * stopPropagation - Auto-generated summary; refine if additional context is needed.
                             */
                            /**
                             * stopPropagation - Auto-generated documentation stub.
                             */
                            onPointerDown={(event) => event.stopPropagation()}
                            /**
                             * toggleVisibility - Auto-generated summary; refine if additional context is needed.
                             *
                             * @returns {layer.id} Refer to the implementation for the precise returned value.
                             */
                            /**
                             * toggleVisibility - Auto-generated documentation stub.
                             *
                             * @returns {layer.id} Result produced by toggleVisibility.
                             */
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
                            /**
                             * stopPropagation - Auto-generated summary; refine if additional context is needed.
                             */
                            /**
                             * stopPropagation - Auto-generated documentation stub.
                             */
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                              // Multiselect disabled: always replace the current selection
                              // when clicking a layer in the layer panel. Previously the
                              // code respected shift/meta keys to support multi-select;
                              // that behavior is intentionally disabled.
                              /**
                               * selectLayer - Auto-generated summary; refine if additional context is needed.
                               *
                               * @param {*} layer.id - Parameter derived from the static analyzer.
                               * @param {*} { mode - Parameter derived from the static analyzer.
                               *
                               * @returns {layer.id, { mode: 'replace' }} Refer to the implementation for the precise returned value.
                               */
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
                            /**
                             * stopPropagation - Auto-generated summary; refine if additional context is needed.
                             */
                            /**
                             * stopPropagation - Auto-generated documentation stub.
                             */
                            onPointerDown={(event) => event.stopPropagation()}
                            /**
                             * handleCopyLayer - Auto-generated summary; refine if additional context is needed.
                             *
                             * @returns {layer.id} Refer to the implementation for the precise returned value.
                             */
                            /**
                             * handleCopyLayer - Auto-generated documentation stub.
                             *
                             * @returns {layer.id} Result produced by handleCopyLayer.
                             */
                            onClick={() => handleCopyLayer(layer.id)}
                            title="Copy layer details"
                            aria-label="Copy layer details"
                            /**
                             * getActionButtonStyle - Auto-generated summary; refine if additional context is needed.
                             */
                            /**
                             * getActionButtonStyle - Auto-generated documentation stub.
                             */
                            style={getActionButtonStyle()}
                          >
                            ⧉
                          </button>
                          <button
                            type="button"
                            /**
                             * stopPropagation - Auto-generated summary; refine if additional context is needed.
                             */
                            /**
                             * stopPropagation - Auto-generated documentation stub.
                             */
                            onPointerDown={(event) => event.stopPropagation()}
                            /**
                             * duplicateLayer - Auto-generated summary; refine if additional context is needed.
                             *
                             * @returns {layer.id} Refer to the implementation for the precise returned value.
                             */
                            /**
                             * duplicateLayer - Auto-generated documentation stub.
                             *
                             * @returns {layer.id} Result produced by duplicateLayer.
                             */
                            onClick={() => layerControls.duplicateLayer(layer.id)}
                            title="Duplicate layer"
                            aria-label="Duplicate layer"
                            /**
                             * getActionButtonStyle - Auto-generated summary; refine if additional context is needed.
                             */
                            /**
                             * getActionButtonStyle - Auto-generated documentation stub.
                             */
                            style={getActionButtonStyle()}
                          >
                            ⧺
                          </button>
                          <button
                            type="button"
                            /**
                             * stopPropagation - Auto-generated summary; refine if additional context is needed.
                             */
                            /**
                             * stopPropagation - Auto-generated documentation stub.
                             */
                            onPointerDown={(event) => event.stopPropagation()}
                            /**
                             * moveLayer - Auto-generated summary; refine if additional context is needed.
                             *
                             * @param {*} layer.id - Parameter derived from the static analyzer.
                             * @param {*} 'up' - Parameter derived from the static analyzer.
                             *
                             * @returns {layer.id, 'up'} Refer to the implementation for the precise returned value.
                             */
                            /**
                             * moveLayer - Auto-generated documentation stub.
                             *
                             * @param {*} layer.id - Parameter forwarded to moveLayer.
                             * @param {*} 'up' - Parameter forwarded to moveLayer.
                             *
                             * @returns {layer.id, 'up'} Result produced by moveLayer.
                             */
                            onClick={() => layerControls.moveLayer(layer.id, 'up')}
                            title="Move layer up"
                            aria-label="Move layer up"
                            /**
                             * getActionButtonStyle - Auto-generated summary; refine if additional context is needed.
                             *
                             * @returns {isTop} Refer to the implementation for the precise returned value.
                             */
                            /**
                             * getActionButtonStyle - Auto-generated documentation stub.
                             *
                             * @returns {isTop} Result produced by getActionButtonStyle.
                             */
                            style={getActionButtonStyle(isTop)}
                            disabled={isTop}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            /**
                             * stopPropagation - Auto-generated summary; refine if additional context is needed.
                             */
                            /**
                             * stopPropagation - Auto-generated documentation stub.
                             */
                            onPointerDown={(event) => event.stopPropagation()}
                            /**
                             * moveLayer - Auto-generated summary; refine if additional context is needed.
                             *
                             * @param {*} layer.id - Parameter derived from the static analyzer.
                             * @param {*} 'down' - Parameter derived from the static analyzer.
                             *
                             * @returns {layer.id, 'down'} Refer to the implementation for the precise returned value.
                             */
                            /**
                             * moveLayer - Auto-generated documentation stub.
                             *
                             * @param {*} layer.id - Parameter forwarded to moveLayer.
                             * @param {*} 'down' - Parameter forwarded to moveLayer.
                             *
                             * @returns {layer.id, 'down'} Result produced by moveLayer.
                             */
                            onClick={() => layerControls.moveLayer(layer.id, 'down')}
                            title="Move layer down"
                            aria-label="Move layer down"
                            /**
                             * getActionButtonStyle - Auto-generated summary; refine if additional context is needed.
                             *
                             * @returns {isBottom} Refer to the implementation for the precise returned value.
                             */
                            /**
                             * getActionButtonStyle - Auto-generated documentation stub.
                             *
                             * @returns {isBottom} Result produced by getActionButtonStyle.
                             */
                            style={getActionButtonStyle(isBottom)}
                            disabled={isBottom}
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            /**
                             * stopPropagation - Auto-generated summary; refine if additional context is needed.
                             */
                            /**
                             * stopPropagation - Auto-generated documentation stub.
                             */
                            onPointerDown={(event) => event.stopPropagation()}
                            /**
                             * moveLayer - Auto-generated summary; refine if additional context is needed.
                             *
                             * @param {*} layer.id - Parameter derived from the static analyzer.
                             * @param {*} 'top' - Parameter derived from the static analyzer.
                             *
                             * @returns {layer.id, 'top'} Refer to the implementation for the precise returned value.
                             */
                            /**
                             * moveLayer - Auto-generated documentation stub.
                             *
                             * @param {*} layer.id - Parameter forwarded to moveLayer.
                             * @param {*} 'top' - Parameter forwarded to moveLayer.
                             *
                             * @returns {layer.id, 'top'} Result produced by moveLayer.
                             */
                            onClick={() => layerControls.moveLayer(layer.id, 'top')}
                            title="Send layer to top"
                            aria-label="Send layer to top"
                            /**
                             * getActionButtonStyle - Auto-generated summary; refine if additional context is needed.
                             *
                             * @returns {isTop} Refer to the implementation for the precise returned value.
                             */
                            /**
                             * getActionButtonStyle - Auto-generated documentation stub.
                             *
                             * @returns {isTop} Result produced by getActionButtonStyle.
                             */
                            style={getActionButtonStyle(isTop)}
                            disabled={isTop}
                          >
                            ⤒
                          </button>
                          <button
                            type="button"
                            /**
                             * stopPropagation - Auto-generated summary; refine if additional context is needed.
                             */
                            /**
                             * stopPropagation - Auto-generated documentation stub.
                             */
                            onPointerDown={(event) => event.stopPropagation()}
                            /**
                             * moveLayer - Auto-generated summary; refine if additional context is needed.
                             *
                             * @param {*} layer.id - Parameter derived from the static analyzer.
                             * @param {*} 'bottom' - Parameter derived from the static analyzer.
                             *
                             * @returns {layer.id, 'bottom'} Refer to the implementation for the precise returned value.
                             */
                            /**
                             * moveLayer - Auto-generated documentation stub.
                             *
                             * @param {*} layer.id - Parameter forwarded to moveLayer.
                             * @param {*} 'bottom' - Parameter forwarded to moveLayer.
                             *
                             * @returns {layer.id, 'bottom'} Result produced by moveLayer.
                             */
                            onClick={() => layerControls.moveLayer(layer.id, 'bottom')}
                            title="Send layer to bottom"
                            aria-label="Send layer to bottom"
                            /**
                             * getActionButtonStyle - Auto-generated summary; refine if additional context is needed.
                             *
                             * @returns {isBottom} Refer to the implementation for the precise returned value.
                             */
                            /**
                             * getActionButtonStyle - Auto-generated documentation stub.
                             *
                             * @returns {isBottom} Result produced by getActionButtonStyle.
                             */
                            style={getActionButtonStyle(isBottom)}
                            disabled={isBottom}
                          >
                            ⤓
                          </button>
                          <button
                            type="button"
                            /**
                             * stopPropagation - Auto-generated summary; refine if additional context is needed.
                             */
                            /**
                             * stopPropagation - Auto-generated documentation stub.
                             */
                            onPointerDown={(event) => event.stopPropagation()}
                            /**
                             * removeLayer - Auto-generated summary; refine if additional context is needed.
                             *
                             * @returns {layer.id} Refer to the implementation for the precise returned value.
                             */
                            /**
                             * removeLayer - Auto-generated documentation stub.
                             *
                             * @returns {layer.id} Result produced by removeLayer.
                             */
                            onClick={() => layerControls.removeLayer(layer.id)}
                            title="Remove layer"
                            aria-label="Remove layer"
                            /**
                             * getActionButtonStyle - Auto-generated summary; refine if additional context is needed.
                             */
                            /**
                             * getActionButtonStyle - Auto-generated documentation stub.
                             */
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
                      /**
                       * if - Auto-generated summary; refine if additional context is needed.
                       *
                       * @returns {!draggingLayerId || !bottomLayerId} Refer to the implementation for the precise returned value.
                       */
                      /**
                       * if - Auto-generated documentation stub.
                       *
                       * @returns {!draggingLayerId || !bottomLayerId} Result produced by if.
                       */
                      if (!draggingLayerId || !bottomLayerId) return;
                      /**
                       * preventDefault - Auto-generated summary; refine if additional context is needed.
                       */
                      /**
                       * preventDefault - Auto-generated documentation stub.
                       */
                      event.preventDefault();
                      /**
                       * stopPropagation - Auto-generated summary; refine if additional context is needed.
                       */
                      /**
                       * stopPropagation - Auto-generated documentation stub.
                       */
                      event.stopPropagation();
                      /**
                       * if - Auto-generated summary; refine if additional context is needed.
                       *
                       * @returns {event.dataTransfer} Refer to the implementation for the precise returned value.
                       */
                      /**
                       * if - Auto-generated documentation stub.
                       *
                       * @returns {event.dataTransfer} Result produced by if.
                       */
                      if (event.dataTransfer) {
                        event.dataTransfer.dropEffect = 'move';
                      }
                      /**
                       * setDragOverLayer - Auto-generated summary; refine if additional context is needed.
                       *
                       * @param {*} { id - Parameter derived from the static analyzer.
                       * @param {*} position - Parameter derived from the static analyzer.
                       *
                       * @returns {{ id: bottomLayerId, position: 'below' }} Refer to the implementation for the precise returned value.
                       */
                      /**
                       * setDragOverLayer - Auto-generated documentation stub.
                       *
                       * @param {*} { id - Parameter forwarded to setDragOverLayer.
                       * @param {*} position - Parameter forwarded to setDragOverLayer.
                       *
                       * @returns {{ id: bottomLayerId, position: 'below' }} Result produced by setDragOverLayer.
                       */
                      setDragOverLayer({ id: bottomLayerId, position: 'below' });
                    }}
                    onDrop={(event) => {
                      /**
                       * if - Auto-generated summary; refine if additional context is needed.
                       *
                       * @returns {!draggingLayerId || !bottomLayerId} Refer to the implementation for the precise returned value.
                       */
                      /**
                       * if - Auto-generated documentation stub.
                       *
                       * @returns {!draggingLayerId || !bottomLayerId} Result produced by if.
                       */
                      if (!draggingLayerId || !bottomLayerId) return;
                      /**
                       * preventDefault - Auto-generated summary; refine if additional context is needed.
                       */
                      /**
                       * preventDefault - Auto-generated documentation stub.
                       */
                      event.preventDefault();
                      /**
                       * stopPropagation - Auto-generated summary; refine if additional context is needed.
                       */
                      /**
                       * stopPropagation - Auto-generated documentation stub.
                       */
                      event.stopPropagation();
                      /**
                       * if - Auto-generated summary; refine if additional context is needed.
                       */
                      /**
                       * if - Auto-generated documentation stub.
                       */
                      if (draggingLayerId !== bottomLayerId) {
                        /**
                         * reorderLayer - Auto-generated summary; refine if additional context is needed.
                         *
                         * @param {*} draggingLayerId - Parameter derived from the static analyzer.
                         * @param {*} bottomLayerId - Parameter derived from the static analyzer.
                         * @param {*} 'below' - Parameter derived from the static analyzer.
                         *
                         * @returns {draggingLayerId, bottomLayerId, 'below'} Refer to the implementation for the precise returned value.
                         */
                        /**
                         * reorderLayer - Auto-generated documentation stub.
                         *
                         * @param {*} draggingLayerId - Parameter forwarded to reorderLayer.
                         * @param {*} bottomLayerId - Parameter forwarded to reorderLayer.
                         * @param {*} 'below' - Parameter forwarded to reorderLayer.
                         *
                         * @returns {draggingLayerId, bottomLayerId, 'below'} Result produced by reorderLayer.
                         */
                        layerControls.reorderLayer(draggingLayerId, bottomLayerId, 'below');
                      }
                      /**
                       * setDragOverLayer - Auto-generated summary; refine if additional context is needed.
                       *
                       * @returns {null} Refer to the implementation for the precise returned value.
                       */
                      /**
                       * setDragOverLayer - Auto-generated documentation stub.
                       *
                       * @returns {null} Result produced by setDragOverLayer.
                       */
                      setDragOverLayer(null);
                      /**
                       * setDraggingLayerId - Auto-generated summary; refine if additional context is needed.
                       *
                       * @returns {null} Refer to the implementation for the precise returned value.
                       */
                      /**
                       * setDraggingLayerId - Auto-generated documentation stub.
                       *
                       * @returns {null} Result produced by setDraggingLayerId.
                       */
                      setDraggingLayerId(null);
                      /**
                       * ensureAllVisible - Auto-generated summary; refine if additional context is needed.
                       */
                      /**
                       * ensureAllVisible - Auto-generated documentation stub.
                       */
                      layerControls.ensureAllVisible();
                    }}
                    onDragLeave={(event) => {
                      if (
                        !event.currentTarget.contains(
                          event.relatedTarget as Node | null
                        )
                      ) {
                        /**
                         * setDragOverLayer - Auto-generated summary; refine if additional context is needed.
                         */
                        /**
                         * setDragOverLayer - Auto-generated documentation stub.
                         */
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
        width={containerDimensions.width}
        height={containerDimensions.height}
        style={{
          cursor: baseCursor,
        }}
      >
        {/* Background Layer - Full container */}
        <Layer listening={false}>
          <Rect
            x={0}
            y={0}
            width={containerDimensions.width / safeScale}
            height={containerDimensions.height / safeScale}
            fill={containerBackground}
          />
        </Layer>

        {/* Stage Mimic Layer - The visible canvas area */}
        <Layer listening={false}>
          <Rect
            x={stageViewportOffsetX}
            y={stageViewportOffsetY}
            width={width}
            height={height}
            fill={backgroundColor}
            shadowColor="rgba(0,0,0,0.2)"
            shadowBlur={8}
            shadowOffsetY={2}
          />
        </Layer>

        {/* Content Layers - Positioned relative to stage mimic */}
        {renderableLayers && renderableLayers.length > 0 ? (
          /**
           * map - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * map - Auto-generated documentation stub.
           */
          renderableLayers.map((layer) => {
            /**
             * has - Auto-generated summary; refine if additional context is needed.
             *
             * @returns {layer.id} Refer to the implementation for the precise returned value.
             */
            /**
             * has - Auto-generated documentation stub.
             *
             * @returns {layer.id} Result produced by has.
             */
            const layerIsSelected = selectedLayerSet.has(layer.id);

            return (
              <Layer
                ref={(node) => {
                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {node} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * if - Auto-generated documentation stub.
                   *
                   * @returns {node} Result produced by if.
                   */
                  if (node) {
                    /**
                     * set - Auto-generated summary; refine if additional context is needed.
                     *
                     * @param {*} layer.id - Parameter derived from the static analyzer.
                     * @param {*} node - Parameter derived from the static analyzer.
                     *
                     * @returns {layer.id, node} Refer to the implementation for the precise returned value.
                     */
                    /**
                     * set - Auto-generated documentation stub.
                     *
                     * @param {*} layer.id - Parameter forwarded to set.
                     * @param {*} node - Parameter forwarded to set.
                     *
                     * @returns {layer.id, node} Result produced by set.
                     */
                    layerNodeRefs.current.set(layer.id, node);
                    /**
                     * if - Auto-generated summary; refine if additional context is needed.
                     *
                     * @returns {selectModeActive && layerIsSelected} Refer to the implementation for the precise returned value.
                     */
                    /**
                     * if - Auto-generated documentation stub.
                     *
                     * @returns {selectModeActive && layerIsSelected} Result produced by if.
                     */
                    if (selectModeActive && layerIsSelected) {
                      /**
                       * updateBoundsFromLayerIds - Auto-generated summary; refine if additional context is needed.
                       *
                       * @returns {pendingSelectionRef.current ?? selectedLayerIds} Refer to the implementation for the precise returned value.
                       */
                      /**
                       * updateBoundsFromLayerIds - Auto-generated documentation stub.
                       *
                       * @returns {pendingSelectionRef.current ?? selectedLayerIds} Result produced by updateBoundsFromLayerIds.
                       */
                      updateBoundsFromLayerIds(pendingSelectionRef.current ?? selectedLayerIds);
                    }
                  } else {
                    /**
                     * delete - Auto-generated summary; refine if additional context is needed.
                     *
                     * @returns {layer.id} Refer to the implementation for the precise returned value.
                     */
                    /**
                     * delete - Auto-generated documentation stub.
                     *
                     * @returns {layer.id} Result produced by delete.
                     */
                    layerNodeRefs.current.delete(layer.id);
                  }
                  /**
                   * syncTransformerToSelection - Auto-generated summary; refine if additional context is needed.
                   */
                  syncTransformerToSelection();
                }}
                key={layer.id}
                id={`layer-${layer.id}`}
                visible={layer.visible}
                x={stageViewportOffsetX + layer.position.x}
                y={stageViewportOffsetY + layer.position.y}
                rotation={layer.rotation ?? 0}
                scaleX={layer.scale?.x ?? 1}
                scaleY={layer.scale?.y ?? 1}
                /**
                 * Boolean - Auto-generated summary; refine if additional context is needed.
                 *
                 * @returns {selectModeActive} Refer to the implementation for the precise returned value.
                 */
                /**
                 * Boolean - Auto-generated documentation stub.
                 *
                 * @returns {selectModeActive} Result produced by Boolean.
                 */
                draggable={Boolean(selectModeActive)}
                onClick={(event: KonvaEventObject<MouseEvent>) => {
                  /**
                   * log - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {'[EVENT] onClick'} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * log - Auto-generated documentation stub.
                   *
                   * @returns {'[EVENT] onClick'} Result produced by log.
                   */
                  console.log('[EVENT] onClick');
                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {!selectModeActive || !layerControls} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * if - Auto-generated documentation stub.
                   *
                   * @returns {!selectModeActive || !layerControls} Result produced by if.
                   */
                  if (!selectModeActive || !layerControls) {
                    return;
                  }

                  event.cancelBubble = true;

                  // Multiselect disabled for canvas selection: always replace
                  // the selection when clicking a layer on the stage.
                  /**
                   * selectLayer - Auto-generated summary; refine if additional context is needed.
                   *
                   * @param {*} layer.id - Parameter derived from the static analyzer.
                   * @param {*} { mode - Parameter derived from the static analyzer.
                   *
                   * @returns {layer.id, { mode: 'replace' }} Refer to the implementation for the precise returned value.
                   */
                  pendingSelectionRef.current = layerControls.selectLayer(layer.id, { mode: 'replace' });
                }}
                onTap={(event: KonvaEventObject<TouchEvent>) => {
                  /**
                   * log - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {'[EVENT] onTap'} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * log - Auto-generated documentation stub.
                   *
                   * @returns {'[EVENT] onTap'} Result produced by log.
                   */
                  console.log('[EVENT] onTap');
                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {!selectModeActive || !layerControls} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * if - Auto-generated documentation stub.
                   *
                   * @returns {!selectModeActive || !layerControls} Result produced by if.
                   */
                  if (!selectModeActive || !layerControls) {
                    return;
                  }

                  event.cancelBubble = true;
                  /**
                   * selectLayer - Auto-generated summary; refine if additional context is needed.
                   *
                   * @param {*} layer.id - Parameter derived from the static analyzer.
                   * @param {*} { mode - Parameter derived from the static analyzer.
                   *
                   * @returns {layer.id, { mode: 'replace' }} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * selectLayer - Auto-generated documentation stub.
                   *
                   * @param {*} layer.id - Parameter forwarded to selectLayer.
                   * @param {*} { mode - Parameter forwarded to selectLayer.
                   *
                   * @returns {layer.id, { mode: 'replace' }} Result produced by selectLayer.
                   */
                  pendingSelectionRef.current = layerControls.selectLayer(layer.id, { mode: 'replace' });
                }}
                onPointerDown={(event: KonvaEventObject<PointerEvent>) => {
                  /**
                   * log - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {'[EVENT] onPointerDown'} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * log - Auto-generated documentation stub.
                   *
                   * @returns {'[EVENT] onPointerDown'} Result produced by log.
                   */
                  console.log('[EVENT] onPointerDown');
                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {!selectModeActive || !layerControls} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * if - Auto-generated documentation stub.
                   *
                   * @returns {!selectModeActive || !layerControls} Result produced by if.
                   */
                  if (!selectModeActive || !layerControls) {
                    return;
                  }

                  // Multiselect disabled for pointer down selection: always
                  // replace selection on pointer down.
                  /**
                   * selectLayer - Auto-generated summary; refine if additional context is needed.
                   *
                   * @param {*} layer.id - Parameter derived from the static analyzer.
                   * @param {*} { mode - Parameter derived from the static analyzer.
                   *
                   * @returns {layer.id, { mode: 'replace' }} Refer to the implementation for the precise returned value.
                   */
                  pendingSelectionRef.current = layerControls.selectLayer(layer.id, { mode: 'replace' });

                  // Mark that user is interacting to show transformer immediately
                  /**
                   * setIsInteractingWithSelection - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {true} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * setIsInteractingWithSelection - Auto-generated documentation stub.
                   *
                   * @returns {true} Result produced by setIsInteractingWithSelection.
                   */
                  setIsInteractingWithSelection(true);

                  // Update bounds immediately so they're ready if user starts dragging
                  /**
                   * updateBoundsFromLayerIds - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {pendingSelectionRef.current} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * updateBoundsFromLayerIds - Auto-generated documentation stub.
                   *
                   * @returns {pendingSelectionRef.current} Result produced by updateBoundsFromLayerIds.
                   */
                  updateBoundsFromLayerIds(pendingSelectionRef.current);

                  /**
                   * getStage - Auto-generated summary; refine if additional context is needed.
                   */
                  const stage = event.target.getStage();
                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {stage} Refer to the implementation for the precise returned value.
                   */
                  if (stage) {
                    /**
                     * container - Auto-generated summary; refine if additional context is needed.
                     */
                    /**
                     * container - Auto-generated documentation stub.
                     */
                    stage.container().style.cursor = 'pointer';
                  }

                  event.cancelBubble = true;
                }}
                onPointerEnter={(event: KonvaEventObject<PointerEvent>) => {
                  /**
                   * log - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {'[EVENT] onPointerEnter'} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * log - Auto-generated documentation stub.
                   *
                   * @returns {'[EVENT] onPointerEnter'} Result produced by log.
                   */
                  console.log('[EVENT] onPointerEnter');
                  /**
                   * getStage - Auto-generated summary; refine if additional context is needed.
                   */
                  /**
                   * getStage - Auto-generated documentation stub.
                   */
                  const stage = event.target.getStage();
                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {!stage} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * if - Auto-generated documentation stub.
                   *
                   * @returns {!stage} Result produced by if.
                   */
                  if (!stage) return;
                  /**
                   * container - Auto-generated summary; refine if additional context is needed.
                   */
                  /**
                   * container - Auto-generated documentation stub.
                   */
                  stage.container().style.cursor = selectModeActive ? 'pointer' : baseCursor;
                }}
                onPointerLeave={(event: KonvaEventObject<PointerEvent>) => {
                  /**
                   * log - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {'[EVENT] onPointerLeave'} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * log - Auto-generated documentation stub.
                   *
                   * @returns {'[EVENT] onPointerLeave'} Result produced by log.
                   */
                  console.log('[EVENT] onPointerLeave');
                  /**
                   * getStage - Auto-generated summary; refine if additional context is needed.
                   */
                  /**
                   * getStage - Auto-generated documentation stub.
                   */
                  const stage = event.target.getStage();
                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {!stage} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * if - Auto-generated documentation stub.
                   *
                   * @returns {!stage} Result produced by if.
                   */
                  if (!stage) return;
                  /**
                   * container - Auto-generated summary; refine if additional context is needed.
                   */
                  /**
                   * container - Auto-generated documentation stub.
                   */
                  stage.container().style.cursor = baseCursor;
                }}
                onPointerUp={(event: KonvaEventObject<PointerEvent>) => {
                  /**
                   * log - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {'[EVENT] onPointerUp'} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * log - Auto-generated documentation stub.
                   *
                   * @returns {'[EVENT] onPointerUp'} Result produced by log.
                   */
                  console.log('[EVENT] onPointerUp');
                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {!selectModeActive || !layerControls} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * if - Auto-generated documentation stub.
                   *
                   * @returns {!selectModeActive || !layerControls} Result produced by if.
                   */
                  if (!selectModeActive || !layerControls) {
                    return;
                  }

                  /**
                   * setIsInteractingWithSelection - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {false} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * setIsInteractingWithSelection - Auto-generated documentation stub.
                   *
                   * @returns {false} Result produced by setIsInteractingWithSelection.
                   */
                  setIsInteractingWithSelection(false);

                  /**
                   * updateBoundsFromLayerIds - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {pendingSelectionRef.current ?? layerControls.selectedLayerIds} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * updateBoundsFromLayerIds - Auto-generated documentation stub.
                   *
                   * @returns {pendingSelectionRef.current ?? layerControls.selectedLayerIds} Result produced by updateBoundsFromLayerIds.
                   */
                  updateBoundsFromLayerIds(pendingSelectionRef.current ?? layerControls.selectedLayerIds);
                  /**
                   * getStage - Auto-generated summary; refine if additional context is needed.
                   */
                  const stage = event.target.getStage();
                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {stage} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * if - Auto-generated documentation stub.
                   *
                   * @returns {stage} Result produced by if.
                   */
                  if (stage) {
                    /**
                     * container - Auto-generated summary; refine if additional context is needed.
                     */
                    /**
                     * container - Auto-generated documentation stub.
                     */
                    stage.container().style.cursor = 'pointer';
                  }
                }}
                onDragStart={(event: KonvaEventObject<DragEvent>) => {
                  /**
                   * log - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {'[EVENT] onDragStart'} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * log - Auto-generated documentation stub.
                   *
                   * @returns {'[EVENT] onDragStart'} Result produced by log.
                   */
                  console.log('[EVENT] onDragStart');
                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {!selectModeActive || !layerControls} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * if - Auto-generated documentation stub.
                   *
                   * @returns {!selectModeActive || !layerControls} Result produced by if.
                   */
                  if (!selectModeActive || !layerControls) return;

                  event.cancelBubble = true;

                  const activeSelection = pendingSelectionRef.current ?? layerControls.selectedLayerIds;
                  /**
                   * includes - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {layer.id} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * includes - Auto-generated documentation stub.
                   *
                   * @returns {layer.id} Result produced by includes.
                   */
                  const selection = activeSelection.includes(layer.id) ? activeSelection : [layer.id];

                  const initialPositions = new Map<string, PanOffset>();
                  /**
                   * forEach - Auto-generated summary; refine if additional context is needed.
                   */
                  /**
                   * forEach - Auto-generated documentation stub.
                   */
                  selection.forEach((id) => {
                    /**
                     * find - Auto-generated summary; refine if additional context is needed.
                     */
                    /**
                     * find - Auto-generated documentation stub.
                     */
                    const descriptor = layerControls.layers.find((entry) => entry.id === id);
                    /**
                     * if - Auto-generated summary; refine if additional context is needed.
                     *
                     * @returns {descriptor} Refer to the implementation for the precise returned value.
                     */
                    /**
                     * if - Auto-generated documentation stub.
                     *
                     * @returns {descriptor} Result produced by if.
                     */
                    if (descriptor) {
                      /**
                       * set - Auto-generated summary; refine if additional context is needed.
                       *
                       * @param {*} id - Parameter derived from the static analyzer.
                       * @param {*} { ...descriptor.position } - Parameter derived from the static analyzer.
                       *
                       * @returns {id, { ...descriptor.position }} Refer to the implementation for the precise returned value.
                       */
                      /**
                       * set - Auto-generated documentation stub.
                       *
                       * @param {*} id - Parameter forwarded to set.
                       * @param {*} { ...descriptor.position } - Parameter forwarded to set.
                       *
                       * @returns {id, { ...descriptor.position }} Result produced by set.
                       */
                      initialPositions.set(id, { ...descriptor.position });
                    }
                  });

                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   */
                  /**
                   * if - Auto-generated documentation stub.
                   */
                  if (!initialPositions.has(layer.id)) {
                    /**
                     * set - Auto-generated summary; refine if additional context is needed.
                     *
                     * @param {*} layer.id - Parameter derived from the static analyzer.
                     * @param {*} { ...layer.position } - Parameter derived from the static analyzer.
                     *
                     * @returns {layer.id, { ...layer.position }} Refer to the implementation for the precise returned value.
                     */
                    /**
                     * set - Auto-generated documentation stub.
                     *
                     * @param {*} layer.id - Parameter forwarded to set.
                     * @param {*} { ...layer.position } - Parameter forwarded to set.
                     *
                     * @returns {layer.id, { ...layer.position }} Result produced by set.
                     */
                    initialPositions.set(layer.id, { ...layer.position });
                  }

                  selectionDragStateRef.current = {
                    anchorLayerId: layer.id,
                    initialPositions,
                  };

                  // Update bounding box at the start of drag to make it immediately visible
                  /**
                   * updateBoundsFromLayerIds - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {selection} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * updateBoundsFromLayerIds - Auto-generated documentation stub.
                   *
                   * @returns {selection} Result produced by updateBoundsFromLayerIds.
                   */
                  updateBoundsFromLayerIds(selection);

                  /**
                   * getStage - Auto-generated summary; refine if additional context is needed.
                   */
                  const stage = event.target.getStage();
                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {stage} Refer to the implementation for the precise returned value.
                   */
                  if (stage) {
                    /**
                     * container - Auto-generated summary; refine if additional context is needed.
                     */
                    /**
                     * container - Auto-generated documentation stub.
                     */
                    stage.container().style.cursor = 'grabbing';
                  }
                }}
                onDragMove={(event: KonvaEventObject<DragEvent>) => {
                  /**
                   * log - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {'[EVENT] onDragMove'} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * log - Auto-generated documentation stub.
                   *
                   * @returns {'[EVENT] onDragMove'} Result produced by log.
                   */
                  console.log('[EVENT] onDragMove');
                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {!selectModeActive || !layerControls} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * if - Auto-generated documentation stub.
                   *
                   * @returns {!selectModeActive || !layerControls} Result produced by if.
                   */
                  if (!selectModeActive || !layerControls) return;

                  const dragState = selectionDragStateRef.current;
                  const activeSelection = pendingSelectionRef.current ?? layerControls.selectedLayerIds;

                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {!dragState} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * if - Auto-generated documentation stub.
                   *
                   * @returns {!dragState} Result produced by if.
                   */
                  if (!dragState) {
                    /**
                     * updateBoundsFromLayerIds - Auto-generated summary; refine if additional context is needed.
                     *
                     * @returns {activeSelection} Refer to the implementation for the precise returned value.
                     */
                    /**
                     * updateBoundsFromLayerIds - Auto-generated documentation stub.
                     *
                     * @returns {activeSelection} Result produced by updateBoundsFromLayerIds.
                     */
                    updateBoundsFromLayerIds(activeSelection);
                    /**
                     * getStage - Auto-generated summary; refine if additional context is needed.
                     */
                    /**
                     * getStage - Auto-generated documentation stub.
                     */
                    event.target.getStage()?.batchDraw();
                    return;
                  }

                  /**
                   * get - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {layer.id} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * get - Auto-generated documentation stub.
                   *
                   * @returns {layer.id} Result produced by get.
                   */
                  const anchorInitial = dragState.initialPositions.get(layer.id);
                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {!anchorInitial} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * if - Auto-generated documentation stub.
                   *
                   * @returns {!anchorInitial} Result produced by if.
                   */
                  if (!anchorInitial) {
                    return;
                  }

                  /**
                   * position - Auto-generated summary; refine if additional context is needed.
                   */
                  /**
                   * position - Auto-generated documentation stub.
                   */
                  const currentPosition = event.target.position();
                  const deltaX = currentPosition.x - anchorInitial.x;
                  const deltaY = currentPosition.y - anchorInitial.y;

                  /**
                   * forEach - Auto-generated summary; refine if additional context is needed.
                   */
                  activeSelection.forEach((id) => {
                    /**
                     * if - Auto-generated summary; refine if additional context is needed.
                     */
                    /**
                     * if - Auto-generated documentation stub.
                     */
                    if (id === layer.id) {
                      return;
                    }
                    /**
                     * get - Auto-generated summary; refine if additional context is needed.
                     *
                     * @returns {id} Refer to the implementation for the precise returned value.
                     */
                    /**
                     * get - Auto-generated documentation stub.
                     *
                     * @returns {id} Result produced by get.
                     */
                    const original = dragState.initialPositions.get(id);
                    /**
                     * get - Auto-generated summary; refine if additional context is needed.
                     *
                     * @returns {id} Refer to the implementation for the precise returned value.
                     */
                    /**
                     * get - Auto-generated documentation stub.
                     *
                     * @returns {id} Result produced by get.
                     */
                    const node = layerNodeRefs.current.get(id);
                    /**
                     * if - Auto-generated summary; refine if additional context is needed.
                     *
                     * @returns {!original || !node} Refer to the implementation for the precise returned value.
                     */
                    /**
                     * if - Auto-generated documentation stub.
                     *
                     * @returns {!original || !node} Result produced by if.
                     */
                    if (!original || !node) {
                      return;
                    }
                    node.position({
                      x: original.x + deltaX,
                      y: original.y + deltaY,
                    });
                  });

                  /**
                   * updateBoundsFromLayerIds - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {activeSelection} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * updateBoundsFromLayerIds - Auto-generated documentation stub.
                   *
                   * @returns {activeSelection} Result produced by updateBoundsFromLayerIds.
                   */
                  updateBoundsFromLayerIds(activeSelection);
                  /**
                   * getStage - Auto-generated summary; refine if additional context is needed.
                   */
                  event.target.getStage()?.batchDraw();
                }}
                onDragEnd={(event: KonvaEventObject<DragEvent>) => {
                  /**
                   * log - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {'[EVENT] onDragEnd'} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * log - Auto-generated documentation stub.
                   *
                   * @returns {'[EVENT] onDragEnd'} Result produced by log.
                   */
                  console.log('[EVENT] onDragEnd');
                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {!selectModeActive || !layerControls} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * if - Auto-generated documentation stub.
                   *
                   * @returns {!selectModeActive || !layerControls} Result produced by if.
                   */
                  if (!selectModeActive || !layerControls) return;

                  /**
                   * setIsInteractingWithSelection - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {false} Refer to the implementation for the precise returned value.
                   */
                  /**
                   * setIsInteractingWithSelection - Auto-generated documentation stub.
                   *
                   * @returns {false} Result produced by setIsInteractingWithSelection.
                   */
                  setIsInteractingWithSelection(false);

                  const dragState = selectionDragStateRef.current;
                  selectionDragStateRef.current = null;

                  /**
                   * slice - Auto-generated summary; refine if additional context is needed.
                   */
                  /**
                   * slice - Auto-generated documentation stub.
                   */
                  const activeSelection = (pendingSelectionRef.current ?? layerControls.selectedLayerIds).slice();
                  pendingSelectionRef.current = null;

                  const idsToUpdate = dragState?.initialPositions ? activeSelection : [layer.id];

                  /**
                   * forEach - Auto-generated summary; refine if additional context is needed.
                   */
                  /**
                   * forEach - Auto-generated documentation stub.
                   */
                  idsToUpdate.forEach((id) => {
                    /**
                     * get - Auto-generated summary; refine if additional context is needed.
                     *
                     * @returns {id} Refer to the implementation for the precise returned value.
                     */
                    const node = id === layer.id ? event.target : layerNodeRefs.current.get(id);
                    /**
                     * if - Auto-generated summary; refine if additional context is needed.
                     *
                     * @returns {!node} Refer to the implementation for the precise returned value.
                     */
                    /**
                     * if - Auto-generated documentation stub.
                     *
                     * @returns {!node} Result produced by if.
                     */
                    if (!node) {
                      return;
                    }
                    /**
                     * position - Auto-generated summary; refine if additional context is needed.
                     */
                    /**
                     * position - Auto-generated documentation stub.
                     */
                    const position = node.position();
                    layerControls.updateLayerPosition(id, {
                      x: position.x,
                      y: position.y,
                    });
                  });

                  /**
                   * ensureAllVisible - Auto-generated summary; refine if additional context is needed.
                   */
                  /**
                   * ensureAllVisible - Auto-generated documentation stub.
                   */
                  layerControls.ensureAllVisible();
                  /**
                   * updateBoundsFromLayerIds - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {layerControls.selectedLayerIds} Refer to the implementation for the precise returned value.
                   */
                  updateBoundsFromLayerIds(layerControls.selectedLayerIds);

                  /**
                   * getStage - Auto-generated summary; refine if additional context is needed.
                   */
                  const stage = event.target.getStage();
                  /**
                   * if - Auto-generated summary; refine if additional context is needed.
                   *
                   * @returns {stage} Refer to the implementation for the precise returned value.
                   */
                  if (stage) {
                    /**
                     * container - Auto-generated summary; refine if additional context is needed.
                     */
                    /**
                     * container - Auto-generated documentation stub.
                     */
                    stage.container().style.cursor = 'pointer';
                  }
                  /**
                   * getStage - Auto-generated summary; refine if additional context is needed.
                   */
                  /**
                   * getStage - Auto-generated documentation stub.
                   */
                  event.target.getStage()?.batchDraw();
                }}
              >
                /**
                 * render - Auto-generated summary; refine if additional context is needed.
                 */
                /**
                 * render - Auto-generated documentation stub.
                 */
                {layer.render()}
              </Layer>
            );
          })
        ) : (
          <Layer>
            {children}
          </Layer>
        )}
        
        {/* Selection & Transform Layer */}
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
              visible={Boolean(
                (isInteractingWithSelection || (selectedLayerBounds && selectedLayerBounds.width > 0 && selectedLayerBounds.height > 0)) &&
                selectedLayerIds.length > 0
              )}
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
            
            {/* Konva-based Selection Box (replaces HTML overlay) */}
            {overlaySelectionBox && (() => {
              console.log('[DEBUG RENDER] KonvaSelectionBox rendering with box:', overlaySelectionBox);
              console.log('[DEBUG RENDER] selectionProxyRef.current:', selectionProxyRef.current);
              if (selectionProxyRef.current) {
                console.log('[DEBUG RENDER] selectionProxy absoluteTransform:', selectionProxyRef.current.getAbsoluteTransform().m);
                console.log('[DEBUG RENDER] selectionProxy position:', selectionProxyRef.current.position());
                console.log('[DEBUG RENDER] selectionProxy size:', {
                  width: selectionProxyRef.current.width(),
                  height: selectionProxyRef.current.height()
                });
                console.log('[DEBUG RENDER] selectionProxy visible:', selectionProxyRef.current.visible());
                console.log('[DEBUG RENDER] selectionProxy opacity:', selectionProxyRef.current.opacity());
              }
              return (
                <KonvaSelectionBox
                  box={overlaySelectionBox}
                  onPointerDown={handleOverlayPointerDown}
                  onPointerMove={handleOverlayPointerMove}
                  onPointerUp={handleOverlayPointerUp}
                  onResizePointerDown={handleOverlayResizePointerDown}
                  onRotatePointerDown={handleOverlayRotatePointerDown}
                />
              );
            })()}
          </Layer>
        )}
      </Stage>
    </div>
  );
};
