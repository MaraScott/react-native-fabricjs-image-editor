/**
 * Atomic Design - Organism: LayerPanel
 * Complete layer management panel composed of atoms and molecules
 */

import { LayerToggleButton, FeedbackMessage, IconButton } from '@atoms/Canvas';
import { LayerList } from './LayerList';
import type { LayerControlHandlers } from '../types/canvas.types';
import type { DragEvent } from 'react';

interface LayerPanelProps {
  layerControls: LayerControlHandlers;
  layerPanelRef: React.RefObject<HTMLDivElement>;
  layerButtonRef: React.RefObject<HTMLButtonElement>;
  isLayerPanelOpen: boolean;
  setIsLayerPanelOpen: (value: boolean) => void;
  copyFeedback: string | null;
  draggingLayerId: string | null;
  setDraggingLayerId: (value: string | null) => void;
  dragOverLayer: { id: string; position: 'above' | 'below' } | null;
  setDragOverLayer: (value: { id: string; position: 'above' | 'below' } | null | ((prev: { id: string; position: 'above' | 'below' } | null) => { id: string; position: 'above' | 'below' } | null)) => void;
  selectedLayerIds: string[];
  primaryLayerId: string | null;
  handleCopyLayer: (layerId: string) => Promise<void>;
  resolveDropPosition: (event: DragEvent<HTMLDivElement>) => 'above' | 'below';
  pendingSelectionRef: React.MutableRefObject<string[] | null>;
}

export const LayerPanel = ({
  layerControls,
  layerPanelRef,
  layerButtonRef,
  isLayerPanelOpen,
  setIsLayerPanelOpen,
  copyFeedback,
  draggingLayerId,
  setDraggingLayerId,
  dragOverLayer,
  setDragOverLayer,
  selectedLayerIds,
  primaryLayerId,
  handleCopyLayer,
  resolveDropPosition,
  pendingSelectionRef,
}: LayerPanelProps) => {
  return (
    <>
      <LayerToggleButton
        isOpen={isLayerPanelOpen}
        onClick={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
        onPointerDown={(event) => event.stopPropagation()}
        buttonRef={layerButtonRef}
      />

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
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Layers</span>

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

          {/* Add Layer Button */}
          <IconButton
            icon="+ Add Layer"
            variant="primary"
            size="medium"
            onClick={() => layerControls.addLayer()}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label="Add new layer"
          />

          {/* Copy Feedback */}
          {copyFeedback && <FeedbackMessage message={copyFeedback} variant="success" />}

          {/* Layer List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              overflowY: 'auto',
              paddingRight: '0.25rem',
            }}
          >
            <LayerList
              layerControls={layerControls}
              selectedLayerIds={selectedLayerIds}
              primaryLayerId={primaryLayerId}
              draggingLayerId={draggingLayerId}
              setDraggingLayerId={setDraggingLayerId}
              dragOverLayer={dragOverLayer}
              setDragOverLayer={setDragOverLayer}
              handleCopyLayer={handleCopyLayer}
              resolveDropPosition={resolveDropPosition}
              pendingSelectionRef={pendingSelectionRef}
            />
          </div>
        </div>
      )}
    </>
  );
};
