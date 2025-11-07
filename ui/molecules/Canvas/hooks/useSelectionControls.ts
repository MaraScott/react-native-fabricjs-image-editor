import { useCallback, useState, useRef, useEffect } from 'react';
import type Konva from 'konva';
import type {
  Bounds,
  SelectionDragState,
  SelectionNodeSnapshot,
  SelectionTransformSnapshot,
  LayerControlHandlers,
} from '../types/canvas.types';
import { computeNodeBounds, areBoundsEqual } from '../utils';

const BOUNDS_RETRY_LIMIT = 4;

interface UseSelectionControlsProps {
  selectModeActive: boolean;
  layerControls?: LayerControlHandlers;
  stageRef: React.RefObject<Konva.Stage>;
  layerNodeRefs: React.MutableRefObject<Map<string, Konva.Layer>>;
  layersRevision?: number;
  scale: number;
}

interface UseSelectionControlsResult {
  selectedLayerBounds: Bounds | null;
  selectionTransformerRef: React.RefObject<Konva.Transformer>;
  selectionProxyRef: React.RefObject<Konva.Rect>;
  selectionTransformStateRef: React.MutableRefObject<SelectionTransformSnapshot | null>;
  selectionProxyRotationRef: React.MutableRefObject<number>;
  isSelectionTransformingRef: React.MutableRefObject<boolean>;
  transformAnimationFrameRef: React.MutableRefObject<number | null>;
  pendingSelectionRef: React.MutableRefObject<string[] | null>;
  updateBoundsFromLayerIds: (layerIds: string[] | null | undefined, attempt?: number) => void;
  refreshBoundsFromSelection: () => void;
  scheduleBoundsRefresh: () => void;
  captureSelectionTransformState: () => void;
  applySelectionTransformDelta: () => void;
  finalizeSelectionTransform: () => void;
  finalizeSelectionTransformWithRotation: () => void;
  handleTransformerTransformStart: () => void;
  handleTransformerTransform: () => void;
  handleTransformerTransformEnd: () => void;
  handleSelectionProxyDragStart: () => void;
  handleSelectionProxyDragMove: () => void;
  handleSelectionProxyDragEnd: () => void;
  clearSelection: () => void;
  syncTransformerToSelection: () => void;
}

export const useSelectionControls = ({
  selectModeActive,
  layerControls,
  stageRef,
  layerNodeRefs,
  layersRevision = 0,
  scale,
}: UseSelectionControlsProps): UseSelectionControlsResult => {
  const [selectedLayerBounds, setSelectedLayerBounds] = useState<Bounds | null>(null);
  const selectionTransformerRef = useRef<Konva.Transformer>(null);
  const selectionProxyRef = useRef<Konva.Rect>(null);
  const selectionTransformStateRef = useRef<SelectionTransformSnapshot | null>(null);
  const selectionProxyRotationRef = useRef<number>(0);
  const isSelectionTransformingRef = useRef(false);
  const transformAnimationFrameRef = useRef<number | null>(null);
  const pendingSelectionRef = useRef<string[] | null>(null);

  const selectedLayerIds = layerControls?.selectedLayerIds ?? [];
  const primaryLayerId = layerControls?.primaryLayerId ?? null;

  useEffect(() => {
    return () => {
      if (transformAnimationFrameRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(transformAnimationFrameRef.current);
      }
    };
  }, []);

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
    [selectModeActive, stageRef, layerNodeRefs]
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
  }, [selectedLayerIds, layerNodeRefs]);

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
  }, [layerControls, scheduleBoundsRefresh, selectedLayerIds, layerNodeRefs]);

  const finalizeSelectionTransformWithRotation = useCallback(() => {
    const proxy = selectionProxyRef.current;
    if (proxy) {
      selectionProxyRotationRef.current = proxy.rotation() ?? selectionProxyRotationRef.current;
    }
    finalizeSelectionTransform();
  }, [finalizeSelectionTransform]);

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
  }, [captureSelectionTransformState, selectModeActive, stageRef]);

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
  }, [applySelectionTransformDelta, finalizeSelectionTransformWithRotation, selectModeActive, stageRef]);

  const clearSelection = useCallback(() => {
    if (layerControls && typeof layerControls.clearSelection === 'function') {
      layerControls.clearSelection();
    } else {
      pendingSelectionRef.current = null;
      setSelectedLayerBounds(null);
    }
  }, [layerControls]);

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
      const bboxW = Math.max(selectedLayerBounds.width, minimumSize);
      const bboxH = Math.max(selectedLayerBounds.height, minimumSize);
      const centerX = selectedLayerBounds.x + selectedLayerBounds.width / 2;
      const centerY = selectedLayerBounds.y + selectedLayerBounds.height / 2;

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

      const a = Math.abs(Math.cos(rotationRad));
      const b = Math.abs(Math.sin(rotationRad));

      let localW = bboxW;
      let localH = bboxH;
      const denom = a * a - b * b;

      if (Math.abs(denom) < 1e-6) {
        const maxSide = Math.max(bboxW, bboxH);
        localW = maxSide;
        localH = maxSide;
      } else {
        localW = (a * bboxW - b * bboxH) / denom;
        localH = (-b * bboxW + a * bboxH) / denom;

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
  }, [selectModeActive, selectedLayerBounds, layerControls]);

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

  return {
    selectedLayerBounds,
    selectionTransformerRef,
    selectionProxyRef,
    selectionTransformStateRef,
    selectionProxyRotationRef,
    isSelectionTransformingRef,
    transformAnimationFrameRef,
    pendingSelectionRef,
    updateBoundsFromLayerIds,
    refreshBoundsFromSelection,
    scheduleBoundsRefresh,
    captureSelectionTransformState,
    applySelectionTransformDelta,
    finalizeSelectionTransform,
    finalizeSelectionTransformWithRotation,
    handleTransformerTransformStart,
    handleTransformerTransform,
    handleTransformerTransformEnd,
    handleSelectionProxyDragStart,
    handleSelectionProxyDragMove,
    handleSelectionProxyDragEnd,
    clearSelection,
    syncTransformerToSelection,
  };
};
