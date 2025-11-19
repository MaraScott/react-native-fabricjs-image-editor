import { Layer as KonvaLayer } from '@atoms/Canvas';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { ReactNode } from 'react';
import type { DragEvent } from 'react';
import { useSimpleCanvasStore } from '@store/SimpleCanvas';

interface LayerProps {
  id: string;
  layerId: string;
  visible: boolean;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  draggable: boolean;
  selectModeActive: boolean;
  isSelected: boolean;
  stageViewportOffsetX: number;
  stageViewportOffsetY: number;
  baseCursor: string;
  children: ReactNode;
  
  // Refs and state setters
  layerNodeRefs: React.MutableRefObject<Map<string, Konva.Layer>>;
  pendingSelectionRef: React.MutableRefObject<string[] | null>;
  selectionDragStateRef: React.MutableRefObject<any>;
  
  // Callbacks
  onRefChange: (node: Konva.Layer | null) => void;
  updateBoundsFromLayerIds: (ids: string[]) => void;
  syncTransformerToSelection: () => void;
  setIsInteractingWithSelection: (value: boolean) => void;
}

export const Layer = ({
  id,
  layerId,
  visible,
  x,
  y,
  rotation,
  scaleX,
  scaleY,
  draggable,
  selectModeActive,
  isSelected,
  stageViewportOffsetX,
  stageViewportOffsetY,
  baseCursor,
  children,
  layerNodeRefs,
  pendingSelectionRef,
  selectionDragStateRef,
  onRefChange,
  updateBoundsFromLayerIds,
  syncTransformerToSelection,
  setIsInteractingWithSelection,
}: LayerProps) => {
  const layerControls = useSimpleCanvasStore((state) => state.layerControls);
  if (!layerControls) {
    return null;
  }
  return (
    <KonvaLayer
      ref={(node) => {
        if (node) {
          layerNodeRefs.current.set(layerId, node);
          if (selectModeActive && isSelected) {
            updateBoundsFromLayerIds(pendingSelectionRef.current ?? [layerId]);
          }
        } else {
          layerNodeRefs.current.delete(layerId);
        }
        syncTransformerToSelection();
        if (onRefChange) {
          onRefChange(node);
        }
      }}
      id={id}
      visible={visible}
      x={x}
      y={y}
      rotation={rotation}
      scaleX={scaleX}
      scaleY={scaleY}
      draggable={draggable}
      onClick={(event: KonvaEventObject<MouseEvent>) => {
        if (!selectModeActive || !layerControls) {
          return;
        }

        event.cancelBubble = true;
        pendingSelectionRef.current = layerControls.selectLayer(layerId, { mode: 'replace' });
      }}
      onTap={(event: KonvaEventObject<TouchEvent>) => {
        if (!selectModeActive || !layerControls) {
          return;
        }

        event.cancelBubble = true;
        pendingSelectionRef.current = layerControls.selectLayer(layerId, { mode: 'replace' });
      }}
      onPointerDown={(event: KonvaEventObject<PointerEvent>) => {
        if (!selectModeActive || !layerControls) {
          return;
        }

        pendingSelectionRef.current = layerControls.selectLayer(layerId, { mode: 'replace' });
        setIsInteractingWithSelection(true);
        updateBoundsFromLayerIds(pendingSelectionRef.current);

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

        setIsInteractingWithSelection(false);
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
        const selection = activeSelection.includes(layerId) ? activeSelection : [layerId];

        const initialPositions = new Map<string, { x: number; y: number }>();
        selection.forEach((id: string) => {
          const descriptor = layerControls.layers.find((entry: any) => entry.id === id);
          if (descriptor) {
            initialPositions.set(id, { ...descriptor.position });
          }
        });

        if (!initialPositions.has(layerId)) {
          const layerDescriptor = layerControls.layers.find((entry: any) => entry.id === layerId);
          if (layerDescriptor) {
            initialPositions.set(layerId, { ...layerDescriptor.position });
          }
        }

        selectionDragStateRef.current = {
          anchorLayerId: layerId,
          initialPositions,
        };

        updateBoundsFromLayerIds(selection);

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

        const anchorInitial = dragState.initialPositions.get(layerId);
        if (!anchorInitial) {
          return;
        }

        const currentPosition = event.target.position();
        const deltaX = currentPosition.x - anchorInitial.x;
        const deltaY = currentPosition.y - anchorInitial.y;

        activeSelection.forEach((id: string) => {
          if (id === layerId) {
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

        setIsInteractingWithSelection(false);

        const dragState = selectionDragStateRef.current;
        selectionDragStateRef.current = null;

        const activeSelection = (pendingSelectionRef.current ?? layerControls.selectedLayerIds).slice();
        pendingSelectionRef.current = null;

        const idsToUpdate = dragState?.initialPositions ? activeSelection : [layerId];

        idsToUpdate.forEach((id: string) => {
          const node = id === layerId ? event.target : layerNodeRefs.current.get(id);
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
      {children}
    </KonvaLayer>
  );
};
