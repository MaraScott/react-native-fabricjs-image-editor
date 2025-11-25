/**
 * Atomic Design - Organism: CanvasContainer
 * Full-featured canvas container with state management, zoom controls, and layer panel
 */

import { useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { SimpleCanvas } from '@molecules/Canvas';
import type { LayerControlHandlers, InitialLayerDefinition } from '@molecules/Layer/Layer.types';
import { useLayerManagement } from '@molecules/Layer';
import {
    setSimpleCanvasLayerState,
    clearSimpleCanvasLayerControls,
} from '@store/SimpleCanvas';

export type { InitialLayerDefinition } from '@molecules/Layer/Layer.types';

/**
 * CanvasContainerProps interface - Auto-generated interface summary; customize as needed.
 */
/**
 * CanvasContainerProps interface - Generated documentation block.
 */
export interface CanvasContainerProps {
    key?: string;
    width?: number;
    height?: number;
    backgroundColor?: string;
    containerBackground?: string;
    zoom?: number;
    fitRequest?: number;
    children?: ReactNode;
    onStageReady?: (stage: Konva.Stage) => void;
    onZoomChange?: (zoom: number) => void;
    onHistoryChange?: (handlers: { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean; revision: number }) => void;
    panModeActive?: boolean;
    initialLayers?: InitialLayerDefinition[];
    selectModeActive?: boolean;
}

/**
 * CanvasContainer Organism - Main canvas component with full functionality
 * Manages canvas state, zoom, and high-level layer operations for the canvas
 */
export const CanvasContainer = ({
    width = 1024,
    height = 1024,
    backgroundColor = '#ffffff',
    containerBackground = '#cccccc',
    zoom = 0,
    fitRequest = 0,
    children,
    onStageReady,
    onZoomChange,
    onHistoryChange,
    panModeActive = false,
    initialLayers,
    selectModeActive = false,
}: CanvasContainerProps) => {
    const [, setStage] = useState<Konva.Stage | null>(null);

    // Prepare initial layers, including children as a layer if provided
    const preparedInitialLayers = useMemo<InitialLayerDefinition[] | undefined>(() => {
        if (initialLayers && initialLayers.length > 0) {
            return initialLayers;
        }

        if (children) {
            return [
                {
                    name: 'Layer 1',
                    position: { x: 0, y: 0 },
                    render: () => <>{children}</>,
                },
            ];
        }

        return undefined;
    }, [initialLayers, children]);

    // Use layer management hook
    const layerManagement = useLayerManagement({
        initialLayers: preparedInitialLayers,
    });

    // Destructure everything from layer management
    const {
        layers,
        selectedLayerIds,
        primaryLayerId,
        layersRevision,
        layerIndexMap,
        selectLayer,
        clearSelection,
        addLayer,
        removeLayer,
        duplicateLayer,
        copyLayer,
        moveLayer,
        toggleVisibility,
        reorderLayer,
        updateLayerPosition,
        updateLayerRotation,
        updateLayerScale,
        updateLayerTransform,
        updateLayerOpacity,
        updateLayerOpacityLive,
        updateLayerOpacityCommit,
        updateLayerStrokes,
        updateLayerTexts,
        addTextLayer,
        addTextToLayer,
        addImageLayer,
        rasterizeLayer,
        undo,
        redo,
        canUndo,
        canRedo,
    } = layerManagement;

    // Create layerControls object for SimpleCanvas
    const layerControls = useMemo<LayerControlHandlers>(() => ({
        layers,
        selectedLayerIds,
        primaryLayerId,
        layersRevision,
        selectLayer,
        clearSelection,
        addLayer,
        removeLayer,
        duplicateLayer,
        copyLayer,
        moveLayer,
        toggleVisibility,
        reorderLayer,
        updateLayerPosition,
        updateLayerScale,
        updateLayerRotation,
        updateLayerTransform,
        updateLayerOpacity,
        updateLayerOpacityLive,
        updateLayerOpacityCommit,
        updateLayerStrokes,
        updateLayerTexts,
        addTextLayer,
        addTextToLayer,
        addImageLayer,
        rasterizeLayer,
        undo,
        redo,
        canUndo,
        canRedo,
    }), [
        layers,
        selectedLayerIds,
        primaryLayerId,
        layersRevision,
        selectLayer,
        clearSelection,
        addLayer,
        removeLayer,
        duplicateLayer,
        copyLayer,
        moveLayer,
        toggleVisibility,
        reorderLayer,
        updateLayerPosition,
        updateLayerScale,
        updateLayerRotation,
        updateLayerTransform,
        updateLayerOpacity,
        updateLayerOpacityLive,
        updateLayerOpacityCommit,
        updateLayerStrokes,
        updateLayerTexts,
        addTextLayer,
        addTextToLayer,
        addImageLayer,
        rasterizeLayer,
        undo,
        redo,
        canUndo,
        canRedo,
    ]);

    useEffect(() => {
        setSimpleCanvasLayerState(layerControls, layers);
    }, [layerControls, layers]);

    useEffect(() => {
        if (onHistoryChange) {
            onHistoryChange({ undo, redo, canUndo, canRedo, revision: layersRevision });
        }
    }, [onHistoryChange, undo, redo, canUndo, canRedo, layersRevision]);

    useEffect(() => {
        return () => {
            clearSimpleCanvasLayerControls();
        };
    }, []);

    /**
     * handleStageReady - Auto-generated documentation stub.
     */
    const handleStageReady = (stageInstance: Konva.Stage) => {
        setStage(stageInstance);
        if (onStageReady) {
            onStageReady(stageInstance);
        }
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <SimpleCanvas
                stageWidth={width}
                stageHeight={height}
                backgroundColor={backgroundColor}
                containerBackground={containerBackground}
                zoom={zoom}
                fitRequest={fitRequest}
                onStageReady={handleStageReady}
                onZoomChange={onZoomChange}
                panModeActive={panModeActive}
                layersRevision={layersRevision}
                selectModeActive={selectModeActive}
            />
        </div>
    );
};
