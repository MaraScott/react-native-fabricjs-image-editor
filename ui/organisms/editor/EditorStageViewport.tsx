import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { Layer, Rect as RectShape, Stage, Transformer as TransformerShape } from 'react-konva';
import { Stack, XStack } from 'tamagui';

import {
    CircleNode,
    EllipseNode,
    FrameNode,
    GuideNode,
    ImageNode,
    LineNode,
    PathNode,
    PencilNode,
    RectNode,
    TextNode,
    TriangleNode,
} from '@atoms/konva/nodes';
import { clampBoundingBoxToStage } from '@atoms/konva/nodes/common';
import {
    ToolSettingsPopover,
    CanvasSettingsPopover,
    LayersPopover,
    ZoomControlPopover,
} from '@templates';
import type {
    EditorElement,
    EditorLayer,
    EditorOptions,
    GuideElement,
    ImageElement,
} from '@types/editor';
import type { KonvaEventObject, StageType, Vector2d } from '@types/konva';
import type { DragBoundFactory, SelectionRect, Tool } from '@organisms/editor/types';

interface LayerSelectionInfo {
    layerId: string;
    elementIds: string[];
    locked: boolean;
    bounds: { x: number; y: number; width: number; height: number; rotation: number };
}

export interface CropState {
    elementId: string;
    originalImage: ImageElement;
    cropArea: { x: number; y: number; width: number; height: number };
}

export interface EditorStageViewportProps {
    stageRef: RefObject<StageType | null>;
    editorCanvasRef: RefObject<HTMLDivElement | null>;
    stageWrapperStyle: CSSProperties;
    stageCanvasStyle: CSSProperties;
    stageBackgroundStyle: CSSProperties;
    stageWidth: number;
    stageHeight: number;
    stagePosition: { x: number; y: number };
    options: Pick<
        EditorOptions,
        'showRulers' | 'showGuides' | 'zoom' | 'backgroundColor' | 'canvasSizeLocked' | 'fixedCanvas'
    >;
    guides: GuideElement[];
    contentElements: EditorElement[];
    selectedIds: string[];
    activeTool: Tool;
    layerMap: Map<string, EditorLayer>;
    dragBoundFactory: DragBoundFactory;
    layerSelection: LayerSelectionInfo | null;
    cropState: CropState | null;
    onMoveLayerSelection: (delta: Vector2d) => void;
    onLayerSelectionTransformStart: () => void;
    onLayerSelectionTransform: (bounds: { x: number; y: number; width: number; height: number; rotation: number }) => void;
    onLayerSelectionTransformEnd: () => void;
    onCropStart: (elementId: string) => void;
    onCropUpdate: (cropArea: { x: number; y: number; width: number; height: number }) => void;
    onCropApply: () => void;
    onCropCancel: () => void;
    onSelectElement: (id: string, mode?: 'layer' | 'single' | 'toggle') => void;
    onUpdateElement: (id: string, attributes: Partial<EditorElement>) => void;
    onStageMouseEnter: (event: KonvaEventObject<MouseEvent>) => void;
    onStageMouseLeave: (event: KonvaEventObject<MouseEvent>) => void;
    onStagePointerDown: (event: KonvaEventObject<MouseEvent | TouchEvent>) => void;
    onStagePointerMove: (event: KonvaEventObject<MouseEvent | TouchEvent>) => void;
    onStagePointerUp: (event: KonvaEventObject<MouseEvent | TouchEvent>) => void;
    selectionRect: SelectionRect | null;
    toolSettingsOpen: boolean;
    onToolSettingsOpenChange: (open: boolean) => void;
    drawSettings: { color: string; width: number };
    onDrawSettingsChange: (updates: Partial<{ color: string; width: number }>) => void;
    layers: EditorLayer[];
    activeLayerId: string | null;
    onSelectLayer: (layerId: string) => void;
    onToggleVisibility: (layerId: string) => void;
    onToggleLock: (layerId: string) => void;
    onRemoveLayer: (layerId: string) => void;
    onMoveLayer: (layerId: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
    onAddLayer: () => void;
    displayWidth: number;
    displayHeight: number;
    canvasSizeLocked: boolean;
    fixedCanvas: boolean;
    onCanvasWidthChange: (value: number) => void;
    onCanvasHeightChange: (value: number) => void;
    onCanvasBackgroundChange: (value: string) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    sliderValue: number[];
    sliderBounds: { min: number; max: number };
    sliderStep: number;
    onSliderChange: (values: number[]) => void;
    zoomPercentage: number;
    isBrowser: boolean;
    rulerStep: number;
    iconSize: number;
}

export default function EditorStageViewport({
    stageRef,
    editorCanvasRef,
    stageWrapperStyle,
    stageCanvasStyle,
    stageBackgroundStyle,
    stageWidth,
    stageHeight,
    stagePosition,
    options,
    guides,
    contentElements,
    selectedIds,
    activeTool,
    layerMap,
    dragBoundFactory,
    layerSelection,
    cropState,
    onMoveLayerSelection,
    onLayerSelectionTransformStart,
    onLayerSelectionTransform,
    onLayerSelectionTransformEnd,
    onCropStart,
    onCropUpdate,
    onCropApply,
    onCropCancel,
    onSelectElement,
    onUpdateElement,
    onStageMouseEnter,
    onStageMouseLeave,
    onStagePointerDown,
    onStagePointerMove,
    onStagePointerUp,
    selectionRect,
    toolSettingsOpen,
    onToolSettingsOpenChange,
    drawSettings,
    onDrawSettingsChange,
    layers,
    activeLayerId,
    onSelectLayer,
    onToggleVisibility,
    onToggleLock,
    onRemoveLayer,
    onMoveLayer,
    onAddLayer,
    displayWidth,
    displayHeight,
    canvasSizeLocked,
    fixedCanvas,
    onCanvasWidthChange,
    onCanvasHeightChange,
    onCanvasBackgroundChange,
    onZoomIn,
    onZoomOut,
    sliderValue,
    sliderBounds,
    sliderStep,
    onSliderChange,
    zoomPercentage,
    isBrowser,
    rulerStep,
    iconSize,
}: EditorStageViewportProps) {
    const iconLarge = iconSize * 1.5;
    const canvasSizeDisabled = canvasSizeLocked || !fixedCanvas;
    const stageSize = { width: stageWidth, height: stageHeight };
    const layerSelectionRectRef = useRef<any>(null);
    const layerSelectionTransformerRef = useRef<any>(null);
    const layerSelectionDragOrigin = useRef<Vector2d | null>(null);
    const layerSelectionActive = !!layerSelection;
    const layerSelectionInteractive = !!(layerSelection && !layerSelection.locked);
    const cropRectRef = useRef<any>(null);
    const cropTransformerRef = useRef<any>(null);

    const commitLayerSelectionBounds = (node: any) => {
        const width = Math.max(1, node.width() * node.scaleX());
        const height = Math.max(1, node.height() * node.scaleY());
        const rotation = node.rotation();
        const clamped = clampBoundingBoxToStage(
            { x: node.x(), y: node.y(), width, height },
            stageSize,
            4,
            4,
        );
        node.width(clamped.width);
        node.height(clamped.height);
        node.position({ x: clamped.x, y: clamped.y });
        node.rotation(rotation);
        node.scaleX(1);
        node.scaleY(1);
        node.getLayer()?.batchDraw();
        return { ...clamped, rotation };
    };

    useEffect(() => {
        const transformer = layerSelectionTransformerRef.current;
        const rect = layerSelectionRectRef.current;
        if (!transformer) {
            return;
        }
        if (!layerSelectionInteractive || !rect) {
            transformer.nodes([]);
            transformer.getLayer()?.batchDraw();
            return;
        }
        transformer.nodes([rect]);
        transformer.getLayer()?.batchDraw();
    }, [layerSelectionInteractive, layerSelection?.bounds.x, layerSelection?.bounds.y, layerSelection?.bounds.width, layerSelection?.bounds.height, layerSelection?.bounds.rotation]);

    useEffect(() => {
        const transformer = cropTransformerRef.current;
        const rect = cropRectRef.current;
        if (!transformer) {
            return;
        }
        if (!cropState || !rect) {
            transformer.nodes([]);
            transformer.getLayer()?.batchDraw();
            return;
        }
        transformer.nodes([rect]);
        transformer.getLayer()?.batchDraw();
    }, [cropState]);

    const handleLayerSelectionDragStart = (event: KonvaEventObject<DragEvent>) => {
        if (!layerSelectionInteractive) return;
        const node = event.target;
        const bounds = commitLayerSelectionBounds(node);
        layerSelectionDragOrigin.current = { x: bounds.x, y: bounds.y };
        event.cancelBubble = true;
    };

    const handleLayerSelectionDragMove = (event: KonvaEventObject<DragEvent>) => {
        if (!layerSelectionInteractive) return;
        const node = event.target;
        const width = Math.max(1, node.width());
        const height = Math.max(1, node.height());
        const clampedPosition = clampBoundingBoxToStage(
            { x: node.x(), y: node.y(), width, height },
            stageSize,
            4,
            4,
        );
        node.position({ x: clampedPosition.x, y: clampedPosition.y });
        const previous = layerSelectionDragOrigin.current ?? { x: clampedPosition.x, y: clampedPosition.y };
        const delta = {
            x: clampedPosition.x - previous.x,
            y: clampedPosition.y - previous.y,
        };
        if (delta.x !== 0 || delta.y !== 0) {
            onMoveLayerSelection(delta);
            layerSelectionDragOrigin.current = { x: clampedPosition.x, y: clampedPosition.y };
        }
        event.cancelBubble = true;
    };

    const handleLayerSelectionDragEnd = (event: KonvaEventObject<DragEvent>) => {
        if (!layerSelectionInteractive) return;
        layerSelectionDragOrigin.current = null;
        event.cancelBubble = true;
    };

    const handleElementSelect = (
        id: string,
        event: KonvaEventObject<MouseEvent | TouchEvent>,
        options?: { forceSingle?: boolean },
    ) => {
        // If in crop mode and clicking an image, start cropping
        if (activeTool === 'crop') {
            const element = contentElements.find((el) => el.id === id);
            if (element && element.type === 'image') {
                onCropStart(id);
                event.cancelBubble = true;
                return;
            }
        }

        if (options?.forceSingle) {
            onSelectElement(id, 'single');
            event.cancelBubble = true;
            return;
        }

        const nativeEvent = event?.evt ?? null;
        if (nativeEvent) {
            if (nativeEvent.metaKey || nativeEvent.ctrlKey || nativeEvent.altKey) {
                onSelectElement(id, 'single');
            } else if (nativeEvent.shiftKey) {
                onSelectElement(id, 'toggle');
            } else {
                onSelectElement(id, 'layer');
            }
        } else {
            onSelectElement(id, 'layer');
        }
        event.cancelBubble = true;
    };

    return (
        <XStack className="editor-layout">
            <XStack ref={editorCanvasRef} className="editor-canvas">
                <XStack className={`stage-wrapper ${options.showRulers ? 'with-rulers' : ''}`} style={stageWrapperStyle}>
                    {options.showRulers && (
                        <Stack
                            className="stage-ruler stage-ruler-horizontal"
                            style={{ width: stageWidth, backgroundSize: `${rulerStep}px 100%` }}
                        />
                    )}
                    {options.showRulers && (
                        <Stack
                            className="stage-ruler stage-ruler-vertical"
                            style={{ height: stageHeight, backgroundSize: `100% ${rulerStep}px` }}
                        />
                    )}
                    <XStack className="stage-canvas" style={stageCanvasStyle} position="relative">
                        <Stack aria-hidden className="stage-surface" style={stageBackgroundStyle} />
                        <Stage
                            ref={stageRef}
                            width={stageWidth}
                            height={stageHeight}
                            x={stagePosition.x}
                            y={stagePosition.y}
                            scaleX={options.zoom}
                            scaleY={options.zoom}
                            onMouseEnter={onStageMouseEnter}
                            onMouseLeave={onStageMouseLeave}
                            onMouseDown={onStagePointerDown}
                            onTouchStart={onStagePointerDown}
                            onMouseMove={onStagePointerMove}
                            onTouchMove={onStagePointerMove}
                            onMouseUp={onStagePointerUp}
                            onTouchEnd={onStagePointerUp}
                            onTouchCancel={onStagePointerUp}
                        >
                            <Layer>
                                {options.showGuides &&
                                    guides.map((guide, guideIndex) => (
                                        <GuideNode
                                            key={guide.id}
                                            shape={guide}
                                            isSelected={selectedIds.includes(guide.id)}
                                            selectionEnabled={activeTool === 'select' || activeTool === 'crop'}
                                            onSelect={(event) => handleElementSelect(guide.id, event, { forceSingle: true })}
                                            onChange={(attributes) => onUpdateElement(guide.id, attributes)}
                                            zIndex={guideIndex}
                                            stageSize={stageSize}
                                        />
                                    ))}
                                {contentElements.map((element, elementIndex) => {
                                    const zIndex = guides.length + elementIndex;
                                    const layer = element.layerId ? layerMap.get(element.layerId) ?? null : null;
                                    const isLayerLocked = layer?.locked ?? false;
                                    const isSelected = selectedIds.includes(element.id);
                                    const isPartOfLayerSelection =
                                        layerSelectionActive && (layerSelection?.elementIds.includes(element.id) ?? false);
                                    const multiSelectionActive = (layerSelection?.elementIds.length ?? 0) > 1;
                                    const selectionEnabled =
                                        (activeTool === 'select' || activeTool === 'crop') &&
                                        !isLayerLocked &&
                                        (!multiSelectionActive || !isPartOfLayerSelection);
                                    const dragBound = dragBoundFactory(element);

                                    switch (element.type) {
                                        case 'rect':
                                            return (
                                                <RectNode
                                                    key={element.id}
                                                    shape={element}
                                                    isSelected={isSelected}
                                                    selectionEnabled={selectionEnabled}
                                                    onSelect={(event) => handleElementSelect(element.id, event)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
                                                    stageSize={stageSize}
                                                    zIndex={zIndex}
                                                />
                                            );
                                        case 'frame':
                                            return (
                                                <FrameNode
                                                    key={element.id}
                                                    shape={element}
                                                    isSelected={isSelected}
                                                    selectionEnabled={selectionEnabled}
                                                    onSelect={(event) => handleElementSelect(element.id, event)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
                                                    stageSize={stageSize}
                                                    zIndex={zIndex}
                                                />
                                            );
                                        case 'circle':
                                            return (
                                                <CircleNode
                                                    key={element.id}
                                                    shape={element}
                                                    isSelected={isSelected}
                                                    selectionEnabled={selectionEnabled}
                                                    onSelect={(event) => handleElementSelect(element.id, event)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
                                                    stageSize={stageSize}
                                                    zIndex={zIndex}
                                                />
                                            );
                                        case 'ellipse':
                                            return (
                                                <EllipseNode
                                                    key={element.id}
                                                    shape={element}
                                                    isSelected={isSelected}
                                                    selectionEnabled={selectionEnabled}
                                                    onSelect={(event) => handleElementSelect(element.id, event)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
                                                    stageSize={stageSize}
                                                    zIndex={zIndex}
                                                />
                                            );
                                        case 'triangle':
                                            return (
                                                <TriangleNode
                                                    key={element.id}
                                                    shape={element}
                                                    isSelected={isSelected}
                                                    selectionEnabled={selectionEnabled}
                                                    onSelect={(event) => handleElementSelect(element.id, event)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
                                                    stageSize={stageSize}
                                                    zIndex={zIndex}
                                                />
                                            );
                                        case 'line':
                                            return (
                                                <LineNode
                                                    key={element.id}
                                                    shape={element}
                                                    isSelected={isSelected}
                                                    selectionEnabled={selectionEnabled}
                                                    onSelect={(event) => handleElementSelect(element.id, event)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
                                                    stageSize={stageSize}
                                                    zIndex={zIndex}
                                                />
                                            );
                                        case 'path':
                                            return (
                                                <PathNode
                                                    key={element.id}
                                                    shape={element}
                                                    isSelected={isSelected}
                                                    selectionEnabled={selectionEnabled}
                                                    onSelect={(event) => handleElementSelect(element.id, event)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
                                                    stageSize={stageSize}
                                                    zIndex={zIndex}
                                                />
                                            );
                                        case 'pencil':
                                            return (
                                                <PencilNode
                                                    key={element.id}
                                                    shape={element}
                                                    isSelected={isSelected}
                                                    selectionEnabled={selectionEnabled}
                                                    onSelect={(event) => handleElementSelect(element.id, event)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
                                                    stageSize={stageSize}
                                                    zIndex={zIndex}
                                                />
                                            );
                                        case 'text':
                                            return (
                                                <TextNode
                                                    key={element.id}
                                                    shape={element}
                                                    isSelected={isSelected}
                                                    selectionEnabled={selectionEnabled}
                                                    onSelect={(event) => handleElementSelect(element.id, event)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
                                                    stageSize={stageSize}
                                                    zIndex={zIndex}
                                                />
                                            );
                                        case 'image':
                                            return (
                                                <ImageNode
                                                    key={element.id}
                                                    shape={element as ImageElement}
                                                    isSelected={isSelected}
                                                    selectionEnabled={selectionEnabled}
                                                    onSelect={(event) => handleElementSelect(element.id, event)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
                                                    stageSize={stageSize}
                                                    zIndex={zIndex}
                                                />
                                            );
                                        default:
                                            return null;
                                    }
                                })}
                            </Layer>
                            {layerSelectionActive && activeTool === 'select' ? (
                                <Layer>
                                    <RectShape
                                        ref={layerSelectionRectRef}
                                        x={layerSelection?.bounds.x ?? 0}
                                        y={layerSelection?.bounds.y ?? 0}
                                        width={layerSelection?.bounds.width ?? 0}
                                        height={layerSelection?.bounds.height ?? 0}
                                        rotation={layerSelection?.bounds.rotation ?? 0}
                                        stroke="#38bdf8"
                                        dash={[6, 4]}
                                        strokeWidth={1}
                                        fill="rgba(56, 189, 248, 0.08)"
                                        listening={layerSelectionInteractive}
                                        draggable={layerSelectionInteractive}
                                        hitStrokeWidth={12}
                                        perfectDrawEnabled={false}
                                        onMouseDown={(event) => {
                                            event.cancelBubble = true;
                                        }}
                                        onClick={(event) => {
                                            event.cancelBubble = true;
                                        }}
                                        onTap={(event) => {
                                            event.cancelBubble = true;
                                        }}
                                        onDragStart={handleLayerSelectionDragStart}
                                        onDragMove={handleLayerSelectionDragMove}
                                        onDragEnd={handleLayerSelectionDragEnd}
                                        onTransformStart={(event) => {
                                            if (!layerSelectionInteractive) return;
                                            event.cancelBubble = true;
                                            layerSelectionDragOrigin.current = null;
                                            onLayerSelectionTransformStart();
                                        }}
                                        onTransform={(event) => {
                                            if (!layerSelectionInteractive) return;
                                            event.cancelBubble = true;
                                            const node = layerSelectionRectRef.current;
                                            if (!node) return;
                                            const bounds = commitLayerSelectionBounds(node);
                                            onLayerSelectionTransform(bounds);
                                        }}
                                        onTransformEnd={(event) => {
                                            if (!layerSelectionInteractive) return;
                                            event.cancelBubble = true;
                                            const node = layerSelectionRectRef.current;
                                            if (node) {
                                                const bounds = commitLayerSelectionBounds(node);
                                                onLayerSelectionTransform(bounds);
                                            }
                                            onLayerSelectionTransformEnd();
                                        }}
                                    />
                                    {layerSelectionInteractive ? (
                                        <TransformerShape
                                            ref={layerSelectionTransformerRef}
                                            rotateEnabled={true}
                                            enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']}
                                            boundBoxFunc={(oldBox, newBox) => {
                                                const minSize = 8;
                                                const clampedWidth = Math.max(minSize, newBox.width);
                                                const clampedHeight = Math.max(minSize, newBox.height);
                                                return {
                                                    ...newBox,
                                                    width: clampedWidth,
                                                    height: clampedHeight,
                                                };
                                            }}
                                        />
                                    ) : null}
                                </Layer>
                            ) : null}
                            {selectionRect && selectionRect.width > 0 && selectionRect.height > 0 ? (
                                <Layer listening={false}>
                                    <RectShape
                                        x={selectionRect.x}
                                        y={selectionRect.y}
                                        width={selectionRect.width}
                                        height={selectionRect.height}
                                        stroke="#38bdf8"
                                        dash={[4, 4]}
                                        strokeWidth={1}
                                        fill="rgba(56, 189, 248, 0.12)"
                                    />
                                </Layer>
                            ) : null}
                            {cropState && cropState.originalImage ? (
                                <Layer>
                                    <RectShape
                                        ref={cropRectRef}
                                        x={cropState.originalImage.x + cropState.cropArea.x}
                                        y={cropState.originalImage.y + cropState.cropArea.y}
                                        width={cropState.cropArea.width}
                                        height={cropState.cropArea.height}
                                        stroke="#ff9800"
                                        strokeWidth={2}
                                        dash={[8, 4]}
                                        fill="rgba(255, 152, 0, 0.1)"
                                        draggable={true}
                                        onTransformEnd={() => {
                                            const node = cropRectRef.current;
                                            if (!node) return;
                                            const scaleX = node.scaleX();
                                            const scaleY = node.scaleY();
                                            node.scaleX(1);
                                            node.scaleY(1);
                                            const width = Math.max(10, node.width() * scaleX);
                                            const height = Math.max(10, node.height() * scaleY);
                                            const x = node.x() - cropState.originalImage.x;
                                            const y = node.y() - cropState.originalImage.y;
                                            node.width(width);
                                            node.height(height);
                                            onCropUpdate({ x, y, width, height });
                                        }}
                                        onDragEnd={() => {
                                            const node = cropRectRef.current;
                                            if (!node) return;
                                            const x = node.x() - cropState.originalImage.x;
                                            const y = node.y() - cropState.originalImage.y;
                                            onCropUpdate({
                                                x,
                                                y,
                                                width: node.width(),
                                                height: node.height(),
                                            });
                                        }}
                                    />
                                    <TransformerShape
                                        ref={cropTransformerRef}
                                        rotateEnabled={false}
                                        enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                                        boundBoxFunc={(oldBox, newBox) => {
                                            const minSize = 10;
                                            return {
                                                ...newBox,
                                                width: Math.max(minSize, newBox.width),
                                                height: Math.max(minSize, newBox.height),
                                            };
                                        }}
                                    />
                                </Layer>
                            ) : null}
                        </Stage>
                        <Stack position="absolute" top={5} left={5} zIndex={2}>
                            <ToolSettingsPopover
                                activeTool={activeTool}
                                toolSettingsOpen={toolSettingsOpen}
                                onToolSettingsOpenChange={onToolSettingsOpenChange}
                                drawSettings={drawSettings}
                                onDrawSettingsChange={onDrawSettingsChange}
                                cropState={cropState}
                                onCropApply={onCropApply}
                                onCropCancel={onCropCancel}
                                layerSelectionInteractive={layerSelectionInteractive}
                                layerSelectionRectRef={layerSelectionRectRef}
                                onLayerSelectionTransformStart={onLayerSelectionTransformStart}
                                onLayerSelectionTransform={onLayerSelectionTransform}
                                onLayerSelectionTransformEnd={onLayerSelectionTransformEnd}
                                commitLayerSelectionBounds={commitLayerSelectionBounds}
                                iconLarge={iconLarge}
                            />
                        </Stack>
                        <Stack position="absolute" top={5} right={5} zIndex={2}>
                            <CanvasSettingsPopover
                                displayWidth={displayWidth}
                                displayHeight={displayHeight}
                                backgroundColor={options.backgroundColor}
                                canvasSizeDisabled={canvasSizeDisabled}
                                onCanvasWidthChange={onCanvasWidthChange}
                                onCanvasHeightChange={onCanvasHeightChange}
                                onCanvasBackgroundChange={onCanvasBackgroundChange}
                                iconLarge={iconLarge}
                            />
                        </Stack>
                        <Stack position="absolute" bottom={5} left={5} zIndex={2}>
                            <LayersPopover
                                layers={layers}
                                contentElements={contentElements}
                                activeLayerId={activeLayerId}
                                selectedIds={selectedIds}
                                onSelectLayer={onSelectLayer}
                                onToggleVisibility={onToggleVisibility}
                                onToggleLock={onToggleLock}
                                onRemoveLayer={onRemoveLayer}
                                onMoveLayer={onMoveLayer}
                                onAddLayer={onAddLayer}
                                iconLarge={iconLarge}
                            />
                        </Stack>
                        {isBrowser ? (
                            <Stack position="absolute" bottom={5} right={5} zIndex={2}>
                                <ZoomControlPopover
                                    zoomPercentage={zoomPercentage}
                                    sliderValue={sliderValue}
                                    sliderBounds={sliderBounds}
                                    sliderStep={sliderStep}
                                    onZoomIn={onZoomIn}
                                    onZoomOut={onZoomOut}
                                    onSliderChange={onSliderChange}
                                    iconSize={iconSize}
                                    iconLarge={iconLarge}
                                />
                            </Stack>
                        ) : null}
                    </XStack>
                </XStack>
            </XStack>
        </XStack>
    );
}
