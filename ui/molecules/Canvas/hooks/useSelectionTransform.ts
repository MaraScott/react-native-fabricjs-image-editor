import {
  useCallback,
  useEffect,
  useRef,
  useState,
  RefObject,
} from "react";
import Konva from "konva";
import { useDispatch, useSelector } from "react-redux";
import { selectActions } from "@store/CanvasApp/view/select";
import { selectSelectionTransform } from "@store/CanvasApp/view/selectors";
import { textActions } from "@store/CanvasApp/view/text";
import { useSelectionBounds } from "./useSelectionBounds";
import { useRotation } from "./useRotation";

import type { RootState } from "@store/CanvasApp";
import type {
  SelectionTransformSnapshot,
  SelectionNodeSnapshot,
  Bounds,
} from "../types/canvas.types";
import type {
  LayerStroke,
  LayerTextItem,
} from "@molecules/Layer/Layer.types";

type LayerControls = {
  layers: Array<{
    id: string;
    bounds?: Bounds;
    position?: { x: number; y: number };
    rotation?: number;
    scale?: { x: number; y: number };
    opacity?: number;
    texts?: LayerTextItem[];
    strokes?: LayerStroke[];
  }>;
  updateLayerTexts?: (layerId: string, texts: LayerTextItem[]) => void;
  updateLayerTransform?: (
    id: string,
    payload: {
      position?: { x: number; y: number };
      rotation?: number;
      scale?: { x: number; y: number };
    }
  ) => void;
  updateLayerPosition?: (id: string, pos: { x: number; y: number }) => void;
  updateLayerRotation?: (id: string, rotation: number) => void;
  updateLayerScale?: (
    id: string,
    scale: { x: number; y: number }
  ) => void;
};

interface UseSelectionTransformParams {
  selectModeActive: boolean;
  layerControls: LayerControls | null | undefined;
  stageRef: RefObject<Konva.Stage>;
  layerNodeRefs: RefObject<Map<string, Konva.Node>>;
  pendingSelectionRef: RefObject<string[] | null>;
  transformAnimationFrameRef: RefObject<number | null>;
  stageViewportOffsetX: number;
  stageViewportOffsetY: number;
  safeScale: number;
  selectedLayerIds: string[];
  layersRevision: number;
  activeTextEdit: any; // from useTextEditing
  finishTextEdit: () => void;
}

interface UseSelectionTransformResult {
  selectedLayerBounds: Bounds | null;
  setSelectedLayerBounds: React.Dispatch<
    React.SetStateAction<Bounds | null>
  >;
  selectionLayerRef: RefObject<Konva.Layer | null>;
  selectionTransformerRef: RefObject<Konva.Transformer | null>;
  selectionTransform: SelectionTransformSnapshot | null;
  sharedSelectionRect: SelectionTransformSnapshot | null;
  isSelectionTransformingRef: RefObject<boolean>;
  captureSelectionTransformState: () => void;
  applySelectionTransformDelta: () => void;
  commitSelectedLayerNodeTransforms: () => void;
  scheduleBoundsRefresh: () => void;
  initializeSelectionTransform: (bounds: Bounds | null) => void;
  markSelectionTransforming: (flag: boolean) => void;
  updateBoundsFromLayerIds: (ids: string[]) => void;
  refreshBoundsFromSelection: () => void;
  resolveEffectiveLayerTransform: (layer: any) => {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    boundsX: number;
    boundsY: number;
  };
}

export function useSelectionTransform({
  selectModeActive,
  layerControls,
  stageRef,
  layerNodeRefs,
  pendingSelectionRef,
  transformAnimationFrameRef,
  stageViewportOffsetX,
  stageViewportOffsetY,
  safeScale,
  selectedLayerIds,
  layersRevision,
  activeTextEdit,
  finishTextEdit,
}: UseSelectionTransformParams): UseSelectionTransformResult {
  const dispatch = useDispatch();

  const selectionLayerRef = useRef<Konva.Layer | null>(null);
  const selectionTransformerRef = useRef<Konva.Transformer | null>(null);
  const selectionTransformStateRef =
    useRef<SelectionTransformSnapshot | null>(null);
  const isSelectionTransformingRef = useRef(false);

  const [selectedLayerBounds, setSelectedLayerBounds] =
    useState<Bounds | null>(null);

  const selectionTransform = useSelector(selectSelectionTransform);
  const sharedSelectionRect = selectionTransform ?? null;

  const selectedLayerSet = new Set(selectedLayerIds);

  const {
    updateBoundsFromLayerIds: _updateBoundsFromLayerIds,
    refreshBoundsFromSelection: _refreshBoundsFromSelection,
    scheduleBoundsRefresh,
    resolveSelectionRotation,
  } = useSelectionBounds({
    selectModeActive,
    layerControls,
    stageRef,
    layerNodeRefs,
    pendingSelectionRef,
    transformAnimationFrameRef,
    setSelectedLayerBounds,
  });

  const { selectionProxyRotationRef } = useRotation(
    resolveSelectionRotation
  );

  const updateBoundsFromLayerIds = (ids: string[]) => {
    return _updateBoundsFromLayerIds(ids);
  };

  const refreshBoundsFromSelection = () => {
    return _refreshBoundsFromSelection();
  };

  // Ensure selectionTransform is initialized/cleared when selection changes
  useEffect(() => {
    if (selectedLayerIds.length > 0 && !selectionTransform) {
      if (selectedLayerBounds) {
        const { x, y, width, height } = selectedLayerBounds;
        dispatch(
          selectActions.setSelectionTransform({
            x,
            y,
            width,
            height,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
          })
        );
      }
    }
    if (selectedLayerIds.length === 0 && selectionTransform) {
      dispatch(selectActions.setSelectionTransform(null));
    }
  }, [
    selectedLayerIds,
    selectedLayerBounds,
    selectionTransform,
    dispatch,
  ]);

  // Selection bounds refresh
  useEffect(() => {
    if (!selectModeActive) {
      setSelectedLayerBounds(null);
      return;
    }
    refreshBoundsFromSelection();
  }, [
    selectModeActive,
    layersRevision,
    safeScale,
    JSON.stringify(selectedLayerIds),
  ]);

  // Keep transformer in sync with selection
  const syncTransformerToSelection = useCallback(() => {
    const transformer = selectionTransformerRef.current;

    if (!transformer) return;

    if (!selectModeActive || !selectedLayerBounds) {
      transformer.nodes([]);
      transformer.visible(false);
      return;
    }

    const nodes = selectedLayerIds
      .map((id) => layerNodeRefs.current?.get(id) ?? null)
      .filter((n): n is Konva.Node => Boolean(n));

    if (nodes.length === 0) {
      transformer.nodes([]);
      transformer.visible(false);
      return;
    }

    transformer.nodes(nodes);
    transformer.rotation(resolveSelectionRotation());
    transformer.centeredScaling(false);
    transformer.visible(true);
    transformer.forceUpdate();
  }, [
    selectModeActive,
    selectedLayerBounds,
    selectedLayerIds,
    layerNodeRefs,
    resolveSelectionRotation,
  ]);

  // Sync transformer & rotation
  useEffect(() => {
    syncTransformerToSelection();
    if (!selectModeActive || isSelectionTransformingRef.current) return;
    const nextRotation = resolveSelectionRotation();
    const normalizedRotation = Number.isFinite(nextRotation)
      ? nextRotation
      : 0;
    if (selectionProxyRotationRef.current !== normalizedRotation) {
      selectionProxyRotationRef.current = normalizedRotation;
      syncTransformerToSelection();
    }
  }, [
    layersRevision,
    syncTransformerToSelection,
    resolveSelectionRotation,
    selectModeActive,
    selectionProxyRotationRef,
  ]);

  // Pending selection + reset transform state when selection changes
  useEffect(() => {
    if (pendingSelectionRef.current) {
      const pending = pendingSelectionRef.current;
      if (pending.length === selectedLayerIds.length) {
        const matches = pending.every(
          (id, index) => id === selectedLayerIds[index]
        );
        if (matches) {
          pendingSelectionRef.current = null;
        }
      }
    }
    selectionTransformStateRef.current = null;
  }, [selectedLayerIds, pendingSelectionRef]);

  // Capture node state at transform start
  const captureSelectionTransformState = useCallback(() => {
    if (!layerControls) {
      selectionTransformStateRef.current = null;
      return;
    }

    const nodeSnapshots = selectedLayerIds
      .map((layerId) => {
        const node = layerNodeRefs.current?.get(layerId);
        const layer = layerControls.layers.find((l) => l.id === layerId);
        if (!node || !layer) return null;
        return {
          id: layerId,
          node,
          initialScaleX: node.scaleX() || 1,
          initialScaleY: node.scaleY() || 1,
          texts: layer.texts ? layer.texts.map((t) => ({ ...t })) : [],
        };
      })
      .filter(
        (
          snapshot
        ): snapshot is SelectionNodeSnapshot & {
          initialScaleX: number;
          initialScaleY: number;
          texts: LayerTextItem[];
        } => Boolean(snapshot)
      );

    if (nodeSnapshots.length === 0) {
      selectionTransformStateRef.current = null;
      return;
    }

    selectionTransformStateRef.current = {
      nodes: nodeSnapshots,
    } as any;
  }, [layerControls, layerNodeRefs, selectedLayerIds]);

  // Apply transform delta (scale text, reset node scale, etc.)
  const applySelectionTransformDelta = useCallback(() => {
    const snapshot = selectionTransformStateRef.current as {
      nodes?: Array<{
        id: string;
        node: Konva.Node;
        initialScaleX: number;
        initialScaleY: number;
        texts: LayerTextItem[];
      }>;
    } | null;

    if (!snapshot?.nodes || !layerControls) return;

    let lastFontSize: number | null = null;

    snapshot.nodes.forEach((snap) => {
      const currentScaleX = snap.node.scaleX() || 1;
      const currentScaleY = snap.node.scaleY() || 1;
      const relScaleX = currentScaleX / (snap.initialScaleX || 1);
      const relScaleY = currentScaleY / (snap.initialScaleY || 1);
      const avgScale =
        (Math.abs(relScaleX) + Math.abs(relScaleY)) / 2 || 1;

      if (snap.texts.length > 0) {
        const nextTexts = snap.texts.map((text) => ({
          ...text,
          x: text.x ?? 0,
          y: text.y ?? 0,
          fontSize: (text.fontSize ?? 32) * avgScale,
        }));
        layerControls.updateLayerTexts?.(snap.id, nextTexts);
        lastFontSize = nextTexts[0]?.fontSize ?? lastFontSize;

        snap.node.scale({ x: 1, y: 1 });
        snap.initialScaleX = 1;
        snap.initialScaleY = 1;
        snap.texts = nextTexts;
      }
    });

    if (lastFontSize !== null) {
      dispatch(textActions.setFontSize(lastFontSize));
    }
  }, [layerControls, dispatch]);

  // Commit selection transform back to layer state
  const commitSelectedLayerNodeTransforms = useCallback(() => {
    if (activeTextEdit) {
      finishTextEdit();
      return;
    }
    if (!layerControls) return;

    layerNodeRefs.current?.forEach((node, id) => {
      if (!node) return;
      const pos = (node as any).position();
      const rot = (node as any).rotation();
      let scaleX = (node as any).scaleX();
      let scaleY = (node as any).scaleY();

      let adjustedX = pos.x - stageViewportOffsetX;
      let adjustedY = pos.y - stageViewportOffsetY;

      const layerData = layerControls.layers.find((l) => l.id === id);
      const texts = layerData?.texts ?? [];
      const scaleChanged =
        Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001;

      if (texts.length > 0 && scaleChanged) {
        scaleX = 1;
        scaleY = 1;
        const layerPosX = layerData?.position?.x ?? 0;
        const layerPosY = layerData?.position?.y ?? 0;
        node.position({
          x: layerPosX + stageViewportOffsetX,
          y: layerPosY + stageViewportOffsetY,
        });
        node.scale({ x: 1, y: 1 });
        adjustedX = layerPosX;
        adjustedY = layerPosY;
      }

      if (typeof layerControls.updateLayerTransform === "function") {
        layerControls.updateLayerTransform(id, {
          position: { x: adjustedX, y: adjustedY },
          rotation: rot,
          scale: { x: scaleX, y: scaleY },
        });
      } else {
        if (typeof layerControls.updateLayerPosition === "function") {
          layerControls.updateLayerPosition(id, {
            x: adjustedX,
            y: adjustedY,
          });
        }
        if (typeof layerControls.updateLayerRotation === "function") {
          layerControls.updateLayerRotation(id, rot);
        }
        if (typeof layerControls.updateLayerScale === "function") {
          layerControls.updateLayerScale(id, {
            x: scaleX,
            y: scaleY,
          });
        }
      }
    });
  }, [
    activeTextEdit,
    finishTextEdit,
    layerControls,
    layerNodeRefs,
    stageViewportOffsetX,
    stageViewportOffsetY,
  ]);

  const initializeSelectionTransform = useCallback(
    (bounds: Bounds | null) => {
      if (!bounds) return;
      const { x, y, width, height } = bounds;
      dispatch(
        selectActions.setSelectionTransform({
          x,
          y,
          width,
          height,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        })
      );
    },
    [dispatch]
  );

  const markSelectionTransforming = useCallback((flag: boolean) => {
    isSelectionTransformingRef.current = flag;
  }, []);

  // Transform used by drawing / paint / eraser to map stage coords to layer coords
  const resolveEffectiveLayerTransform = (layer: any) => {
    const isSelected = selectedLayerSet.has(layer.id);
    if (isSelected && isSelectionTransformingRef.current && sharedSelectionRect) {
      return {
        x: sharedSelectionRect.x ?? 0,
        y: sharedSelectionRect.y ?? 0,
        rotation: sharedSelectionRect.rotation ?? 0,
        scaleX: sharedSelectionRect.scaleX ?? 1,
        scaleY: sharedSelectionRect.scaleY ?? 1,
        boundsX: sharedSelectionRect.x ?? 0,
        boundsY: sharedSelectionRect.y ?? 0,
      };
    }

    return {
      x: layer.bounds ? layer.bounds.x : layer.position?.x ?? 0,
      y: layer.bounds ? layer.bounds.y : layer.position?.y ?? 0,
      rotation: layer.rotation ?? 0,
      scaleX: layer.scale?.x ?? 1,
      scaleY: layer.scale?.y ?? 1,
      boundsX: layer.bounds ? layer.bounds.x : layer.position?.x ?? 0,
      boundsY: layer.bounds ? layer.bounds.y : layer.position?.y ?? 0,
    };
  };

  return {
    selectedLayerBounds,
    setSelectedLayerBounds,
    selectionLayerRef,
    selectionTransformerRef,
    selectionTransform,
    sharedSelectionRect,
    isSelectionTransformingRef,
    captureSelectionTransformState,
    applySelectionTransformDelta,
    commitSelectedLayerNodeTransforms,
    scheduleBoundsRefresh,
    initializeSelectionTransform,
    markSelectionTransforming,
    updateBoundsFromLayerIds,
    refreshBoundsFromSelection,
    resolveEffectiveLayerTransform,
  };
}
