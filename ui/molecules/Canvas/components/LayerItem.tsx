/**
 * Atomic Design - Molecule: LayerItem
 * Represents a single layer with visibility toggle, selection, and action buttons
 */

import type { CSSProperties, DragEvent } from 'react';
import { IconButton } from '@atoms/Canvas';
import type { LayerDescriptor, LayerControlHandlers } from '../types/canvas.types';

export interface LayerItemProps {
  layer: LayerDescriptor;
  layerControls: LayerControlHandlers;
  isSelected: boolean;
  isPrimary: boolean;
  isTop: boolean;
  isBottom: boolean;
  isDragging: boolean;
  dropPosition: 'above' | 'below' | null;
  onSelect: () => void;
  onCopy: () => void;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
}

export const LayerItem = ({
  layer,
  layerControls,
  isSelected,
  isPrimary,
  isTop,
  isBottom,
  isDragging,
  dropPosition,
  onSelect,
  onCopy,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragLeave,
}: LayerItemProps) => {
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
      style={containerStyle}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
    >
      {/* Header with visibility and name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <IconButton
          icon={layer.visible ? '👁' : '🙈'}
          size="small"
          variant="secondary"
          title={layer.visible ? 'Hide layer' : 'Show layer'}
          aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => layerControls.toggleVisibility(layer.id)}
        />

        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onSelect}
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

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.35rem',
        }}
      >
        <IconButton
          icon="⧉"
          size="small"
          title="Copy layer details"
          aria-label="Copy layer details"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onCopy}
        />
        <IconButton
          icon="⧺"
          size="small"
          title="Duplicate layer"
          aria-label="Duplicate layer"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => layerControls.duplicateLayer(layer.id)}
        />
        <IconButton
          icon="▲"
          size="small"
          title="Move layer up"
          aria-label="Move layer up"
          disabled={isTop}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => layerControls.moveLayer(layer.id, 'up')}
        />
        <IconButton
          icon="▼"
          size="small"
          title="Move layer down"
          aria-label="Move layer down"
          disabled={isBottom}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => layerControls.moveLayer(layer.id, 'down')}
        />
        <IconButton
          icon="⤒"
          size="small"
          title="Send layer to top"
          aria-label="Send layer to top"
          disabled={isTop}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => layerControls.moveLayer(layer.id, 'top')}
        />
        <IconButton
          icon="⤓"
          size="small"
          title="Send layer to bottom"
          aria-label="Send layer to bottom"
          disabled={isBottom}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => layerControls.moveLayer(layer.id, 'bottom')}
        />
        <IconButton
          icon="🗑"
          size="small"
          variant="danger"
          title="Remove layer"
          aria-label="Remove layer"
          disabled={layerControls.layers.length <= 1}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => layerControls.removeLayer(layer.id)}
        />
      </div>
    </div>
  );
};
