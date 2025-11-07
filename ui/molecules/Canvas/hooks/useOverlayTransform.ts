import { useState, useRef, useCallback, useEffect } from 'react';
import type Konva from 'konva';
import type { Bounds, LayerControlHandlers } from '../types/canvas.types';

interface UseOverlayTransformProps {
  overlaySelectionBox: { x: number; y: number; width: number; height: number; rotation?: number } | null;
  selectModeActive: boolean;
  layerControls?: LayerControlHandlers;
  layerNodeRefs: React.MutableRefObject<Map<string, Konva.Layer>>;
  scale: number;
  stageRef: React.RefObject<Konva.Stage>;
  captureSelectionTransformState: () => void;
  updateBoundsFromLayerIds: (layerIds: string[] | null | undefined, attempt?: number) => void;
  scheduleBoundsRefresh: () => void;
  isSelectionTransformingRef: React.MutableRefObject<boolean>;
  selectionTransformStateRef: React.MutableRefObject<any>;
  selectionProxyRotationRef: React.MutableRefObject<number>;
}

interface UseOverlayTransformResult {
  handleOverlayPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  handleOverlayPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  handleOverlayPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  handleOverlayRotatePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  handleOverlayRotatePointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  handleOverlayRotatePointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  overlaySelectionBox: { x: number; y: number; width: number; height: number; rotation?: number } | null;
  setOverlaySelectionBox: (value: any) => void;
}

export const useOverlayTransform = ({
  overlaySelectionBox: initialOverlaySelectionBox,
  selectModeActive,
  layerControls,
  layerNodeRefs,
  scale,
  stageRef,
  captureSelectionTransformState,
  updateBoundsFromLayerIds,
  scheduleBoundsRefresh,
  isSelectionTransformingRef,
  selectionTransformStateRef,
  selectionProxyRotationRef,
}: UseOverlayTransformProps): UseOverlayTransformResult => {
  const [overlaySelectionBox, setOverlaySelectionBox] = useState<
    { x: number; y: number; width: number; height: number; rotation?: number } | null
  >(initialOverlaySelectionBox);

  const overlayDragState = useRef<
    | null
    | {
        pointerId: number;
        startX: number;
        startY: number;
        initialPositions: Map<string, { x: number; y: number }>;
      }
  >(null);

  const overlayRotateState = useRef<
    | null
    | {
        pointerId: number;
        startAngle: number;
        startBoxRotation: number;
        initialRotations: Map<string, number>;
        center: { x: number; y: number };
      }
  >(null);

  // Sync with external prop changes
  useEffect(() => {
    setOverlaySelectionBox(initialOverlaySelectionBox);
  }, [initialOverlaySelectionBox]);

  const handleOverlayPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!overlaySelectionBox || !selectModeActive || !layerControls) return;

      event.preventDefault();
      event.stopPropagation();

      const pointerId = event.pointerId;
      try {
        (event.currentTarget as Element).setPointerCapture(pointerId);
      } catch {}

      const initialPositions = new Map<string, { x: number; y: number }>();
      const activeSelection = layerControls.selectedLayerIds;
      activeSelection.forEach((id) => {
        const node = layerNodeRefs.current.get(id);
        if (node) {
          const p = node.position();
          initialPositions.set(id, { x: p.x, y: p.y });
        } else {
          const desc = layerControls.layers.find((l) => l.id === id);
          if (desc) {
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

      captureSelectionTransformState();
      isSelectionTransformingRef.current = true;
      const stage = stageRef.current;
      if (stage) stage.container().style.cursor = 'grabbing';
    },
    [overlaySelectionBox, selectModeActive, layerControls, layerNodeRefs, captureSelectionTransformState, isSelectionTransformingRef, stageRef]
  );

  const handleOverlayPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = overlayDragState.current;
      if (!state || event.pointerId !== state.pointerId) return;

      event.preventDefault();
      event.stopPropagation();

      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;

      const dxStage = dx / Math.max(scale, 0.0001);
      const dyStage = dy / Math.max(scale, 0.0001);

      state.initialPositions.forEach((pos, id) => {
        const node = layerNodeRefs.current.get(id);
        if (!node) return;
        const newX = pos.x + dxStage;
        const newY = pos.y + dyStage;
        node.position({ x: newX, y: newY });
        if (typeof node.batchDraw === 'function') node.batchDraw();
        state.initialPositions.set(id, { x: newX, y: newY });
      });

      stageRef.current?.batchDraw();
      setOverlaySelectionBox((prev) => (prev ? { ...prev, x: prev.x + dx, y: prev.y + dy } : prev));
      overlayDragState.current = { ...state, startX: event.clientX, startY: event.clientY };

      try {
        const activeSelection = layerControls?.selectedLayerIds ?? Array.from(state.initialPositions.keys());
        updateBoundsFromLayerIds(activeSelection);
      } catch (e) {
        // ignore
      }
    },
    [scale, layerNodeRefs, stageRef, layerControls, updateBoundsFromLayerIds]
  );

  const handleOverlayPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = overlayDragState.current;
      if (!state || event.pointerId !== state.pointerId) return;

      event.preventDefault();
      event.stopPropagation();

      try {
        (event.currentTarget as Element).releasePointerCapture(state.pointerId);
      } catch {}

      const ids = Array.from(state.initialPositions.keys());
      ids.forEach((id) => {
        const node = layerNodeRefs.current.get(id);
        if (!node) return;
        const p = node.position();
        if (layerControls) {
          layerControls.updateLayerPosition(id, { x: p.x, y: p.y });
        }
      });

      overlayDragState.current = null;
      isSelectionTransformingRef.current = false;

      try {
        const activeSelection = layerControls?.selectedLayerIds ?? Array.from(state.initialPositions.keys());
        updateBoundsFromLayerIds(activeSelection);
      } catch {}

      selectionTransformStateRef.current = null;
      scheduleBoundsRefresh();
      const stage = stageRef.current;
      if (stage) stage.container().style.cursor = 'pointer';
    },
    [layerNodeRefs, layerControls, isSelectionTransformingRef, updateBoundsFromLayerIds, selectionTransformStateRef, scheduleBoundsRefresh, stageRef]
  );

  const handleOverlayRotatePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!overlaySelectionBox || !selectModeActive || !layerControls) return;

      event.preventDefault();
      event.stopPropagation();

      const pointerId = event.pointerId;
      try {
        (event.currentTarget as Element).setPointerCapture(pointerId);
      } catch {}

      const center = { x: overlaySelectionBox.x, y: overlaySelectionBox.y };
      const startAngleRad = Math.atan2(event.clientY - center.y, event.clientX - center.x);
      const startAngleDeg = (startAngleRad * 180) / Math.PI;

      const initialRotations = new Map<string, number>();
      const activeSelection = layerControls.selectedLayerIds;
      activeSelection.forEach((id) => {
        const node = layerNodeRefs.current.get(id);
        if (node) {
          initialRotations.set(id, node.rotation() ?? 0);
        } else {
          const desc = layerControls.layers.find((l) => l.id === id);
          initialRotations.set(id, desc?.rotation ?? 0);
        }
      });

      overlayRotateState.current = {
        pointerId,
        startAngle: startAngleDeg,
        startBoxRotation: overlaySelectionBox.rotation ?? 0,
        initialRotations,
        center,
      };

      captureSelectionTransformState();
      isSelectionTransformingRef.current = true;
    },
    [overlaySelectionBox, selectModeActive, layerControls, layerNodeRefs, captureSelectionTransformState, isSelectionTransformingRef]
  );

  const handleOverlayRotatePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = overlayRotateState.current;
      if (!state || event.pointerId !== state.pointerId) return;

      event.preventDefault();
      event.stopPropagation();

      const currentAngleRad = Math.atan2(event.clientY - state.center.y, event.clientX - state.center.x);
      const currentAngleDeg = (currentAngleRad * 180) / Math.PI;
      const delta = currentAngleDeg - state.startAngle;

      const newRotation = state.startBoxRotation + delta;

      state.initialRotations.forEach((initial, id) => {
        const node = layerNodeRefs.current.get(id);
        if (!node) return;
        node.rotation(initial + delta);
        if (typeof node.batchDraw === 'function') node.batchDraw();
      });

      selectionProxyRotationRef.current = newRotation;
      setOverlaySelectionBox((prev) => (prev ? { ...prev, rotation: newRotation } : prev));

      try {
        const activeSelection = layerControls?.selectedLayerIds ?? Array.from(state.initialRotations.keys());
        updateBoundsFromLayerIds(activeSelection);
      } catch (e) {
        // ignore
      }

      stageRef.current?.batchDraw();
    },
    [layerNodeRefs, selectionProxyRotationRef, layerControls, updateBoundsFromLayerIds, stageRef]
  );

  const handleOverlayRotatePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = overlayRotateState.current;
      if (!state || event.pointerId !== state.pointerId) return;

      event.preventDefault();
      event.stopPropagation();

      try {
        (event.currentTarget as Element).releasePointerCapture(state.pointerId);
      } catch {}

      const ids = Array.from(state.initialRotations.keys());
      ids.forEach((id) => {
        const node = layerNodeRefs.current.get(id);
        if (!node) return;
        const rotation = node.rotation();
        if (layerControls) {
          if (typeof layerControls.updateLayerTransform === 'function') {
            const position = node.position();
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            layerControls.updateLayerTransform(id, {
              position: { x: position.x, y: position.y },
              rotation,
              scale: { x: scaleX, y: scaleY },
            });
          } else {
            if (typeof layerControls.updateLayerRotation === 'function') {
              layerControls.updateLayerRotation(id, rotation);
            }
          }
        }
      });

      overlayRotateState.current = null;
      isSelectionTransformingRef.current = false;
      selectionTransformStateRef.current = null;
      scheduleBoundsRefresh();
    },
    [layerNodeRefs, layerControls, isSelectionTransformingRef, selectionTransformStateRef, scheduleBoundsRefresh]
  );

  return {
    handleOverlayPointerDown,
    handleOverlayPointerMove,
    handleOverlayPointerUp,
    handleOverlayRotatePointerDown,
    handleOverlayRotatePointerMove,
    handleOverlayRotatePointerUp,
    overlaySelectionBox,
    setOverlaySelectionBox,
  };
};
