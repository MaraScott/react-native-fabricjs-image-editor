/**
 * Atomic Design - Molecule: LayerList
 * Displays a scrollable list of layers with drag-and-drop reordering
 */

import type { DragEvent } from 'react';
import { LayerItem } from './LayerItem';
import type { LayerControlHandlers } from '../types/canvas.types';

export interface LayerListProps {
  layerControls: LayerControlHandlers;
  selectedLayerIds: string[];
  primaryLayerId: string | null;
  draggingLayerId: string | null;
  setDraggingLayerId: (id: string | null) => void;
  dragOverLayer: { id: string; position: 'above' | 'below' } | null;
  setDragOverLayer: (value: { id: string; position: 'above' | 'below' } | null | ((prev: { id: string; position: 'above' | 'below' } | null) => { id: string; position: 'above' | 'below' } | null)) => void;
  handleCopyLayer: (layerId: string) => void;
  resolveDropPosition: (event: DragEvent<HTMLDivElement>) => 'above' | 'below';
  pendingSelectionRef: React.MutableRefObject<string[] | null>;
}

export const LayerList = ({
  layerControls,
  selectedLayerIds,
  primaryLayerId,
  draggingLayerId,
  setDraggingLayerId,
  dragOverLayer,
  setDragOverLayer,
  handleCopyLayer,
  resolveDropPosition,
  pendingSelectionRef,
}: LayerListProps) => {
  const selectedLayerSet = new Set(selectedLayerIds);
  const bottomLayerId = layerControls.layers[layerControls.layers.length - 1]?.id ?? null;

  if (layerControls.layers.length === 0) {
    return (
      <div
        style={{
          fontSize: '0.8125rem',
          color: '#555555',
          padding: '0.5rem 0.25rem',
        }}
      >
        No layers yet. Add one to get started.
      </div>
    );
  }

  return (
    <>
      {layerControls.layers.map((layer, index) => {
        const isSelected = selectedLayerSet.has(layer.id);
        const isPrimary = primaryLayerId === layer.id;
        const isTop = index === 0;
        const isBottom = index === layerControls.layers.length - 1;
        const dropPosition =
          dragOverLayer?.id === layer.id ? dragOverLayer.position : null;
        const isDragging = draggingLayerId === layer.id;

        return (
          <LayerItem
            key={layer.id}
            layer={layer}
            layerControls={layerControls}
            isSelected={isSelected}
            isPrimary={isPrimary}
            isTop={isTop}
            isBottom={isBottom}
            isDragging={isDragging}
            dropPosition={dropPosition}
            onSelect={() => {
              pendingSelectionRef.current = layerControls.selectLayer(layer.id, {
                mode: 'replace',
              });
            }}
            onCopy={() => handleCopyLayer(layer.id)}
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
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setDragOverLayer((current) =>
                  current?.id === layer.id ? null : current
                );
              }
            }}
          />
        );
      })}

      {/* Drop zone at the end */}
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
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setDragOverLayer((current) =>
                current?.id === bottomLayerId ? null : current
              );
            }
          }}
          style={{
            height: draggingLayerId ? '12px' : '0px',
            backgroundColor:
              dragOverLayer?.id === bottomLayerId &&
              dragOverLayer?.position === 'below'
                ? '#e3f0ff'
                : 'transparent',
            transition: 'height 0.15s ease',
            pointerEvents: draggingLayerId ? 'auto' : 'none',
          }}
        />
      )}
    </>
  );
};
