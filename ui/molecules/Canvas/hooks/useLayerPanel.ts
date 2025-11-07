import { useState, useRef, useEffect, useCallback } from 'react';
import type { DragEvent } from 'react';
import type { LayerControlHandlers } from '../types/canvas.types';

interface UseLayerPanelProps {
  layerControls?: LayerControlHandlers;
}

interface UseLayerPanelResult {
  isLayerPanelOpen: boolean;
  setIsLayerPanelOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  copyFeedback: string | null;
  setCopyFeedback: (value: string | null) => void;
  draggingLayerId: string | null;
  setDraggingLayerId: (value: string | null) => void;
  dragOverLayer: { id: string; position: 'above' | 'below' } | null;
  setDragOverLayer: (value: { id: string; position: 'above' | 'below' } | null) => void;
  layerButtonRef: React.RefObject<HTMLButtonElement>;
  layerPanelRef: React.RefObject<HTMLDivElement>;
  handleCopyLayer: (layerId: string) => Promise<void>;
  resolveDropPosition: (event: DragEvent<HTMLDivElement>) => 'above' | 'below';
}

export const useLayerPanel = ({
  layerControls,
}: UseLayerPanelProps): UseLayerPanelResult => {
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [dragOverLayer, setDragOverLayer] = useState<{
    id: string;
    position: 'above' | 'below';
  } | null>(null);
  const layerButtonRef = useRef<HTMLButtonElement | null>(null);
  const layerPanelRef = useRef<HTMLDivElement | null>(null);

  // Auto-dismiss feedback after 2 seconds
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

  // Close panel on outside clicks
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

  // Close panel if layerControls become unavailable
  useEffect(() => {
    if (!layerControls && isLayerPanelOpen) {
      setIsLayerPanelOpen(false);
    }
  }, [layerControls, isLayerPanelOpen]);

  // Reset drag states when panel closes
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

  const resolveDropPosition = useCallback((event: DragEvent<HTMLDivElement>): 'above' | 'below' => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - bounds.top;
    return offsetY < bounds.height / 2 ? 'above' : 'below';
  }, []);

  return {
    isLayerPanelOpen,
    setIsLayerPanelOpen,
    copyFeedback,
    setCopyFeedback,
    draggingLayerId,
    setDraggingLayerId,
    dragOverLayer,
    setDragOverLayer,
    layerButtonRef,
    layerPanelRef,
    handleCopyLayer,
    resolveDropPosition,
  };
};
