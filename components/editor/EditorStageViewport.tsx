import { useEffect, useRef, type ChangeEvent, type CSSProperties, type RefObject } from 'react';
import { Layer, Rect as RectShape, Stage, Transformer as TransformerShape } from 'react-konva';
import {
    Button,
    Heading,
    Input,
    Label,
    Paragraph,
    Popover,
    Slider,
    Stack,
    Text,
    XStack,
    YStack,
} from 'tamagui';

import LayersPanel from '../LayersPanel';
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
} from '../KonvaNodes';
import { MaterialCommunityIcons } from '../icons/MaterialCommunityIcons';
import { clampBoundingBoxToStage } from '../KonvaNodes/common';
import type {
    EditorElement,
    EditorLayer,
    EditorOptions,
    GuideElement,
    ImageElement,
} from '../../types/editor';
import type { KonvaEventObject, StageType, Vector2d } from '../../types/konva';
import type { DragBoundFactory, SelectionRect, Tool } from './types';

interface LayerSelectionInfo {
    layerId: string;
    elementIds: string[];
    locked: boolean;
    bounds: { x: number; y: number; width: number; height: number };
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
    onMoveLayerSelection: (delta: Vector2d) => void;
    onLayerSelectionTransformStart: () => void;
    onLayerSelectionTransform: (bounds: { x: number; y: number; width: number; height: number }) => void;
    onLayerSelectionTransformEnd: () => void;
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
    onMoveLayerSelection,
    onLayerSelectionTransformStart,
    onLayerSelectionTransform,
    onLayerSelectionTransformEnd,
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

    const commitLayerSelectionBounds = (node: any) => {
        const width = Math.max(1, node.width() * node.scaleX());
        const height = Math.max(1, node.height() * node.scaleY());
        const clamped = clampBoundingBoxToStage(
            { x: node.x(), y: node.y(), width, height },
            stageSize,
            4,
            4,
        );
        node.width(clamped.width);
        node.height(clamped.height);
        node.position({ x: clamped.x, y: clamped.y });
        node.scaleX(1);
        node.scaleY(1);
        node.getLayer()?.batchDraw();
        return clamped;
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
    }, [layerSelectionInteractive, layerSelection?.bounds.x, layerSelection?.bounds.y, layerSelection?.bounds.width, layerSelection?.bounds.height]);

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
        <Stack className="editor-layout">
            <XStack ref={editorCanvasRef} className="editor-canvas">
                <Stack className={`stage-wrapper ${options.showRulers ? 'with-rulers' : ''}`} style={stageWrapperStyle}>
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
                    <Stack className="stage-canvas" style={stageCanvasStyle} position="relative">
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
                                            selectionEnabled={activeTool === 'select'}
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
                                        activeTool === 'select' &&
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
                                            rotateEnabled={false}
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
                        </Stage>
                        <Stack position="absolute" top={5} left={5} zIndex={2}>
                            <Popover placement="bottom-start" open={toolSettingsOpen} onOpenChange={onToolSettingsOpenChange}>
                                <Popover.Trigger position="absolute" top={0} left={0}>
                                    <Button type="button" aria-label="tool" title="tool">
                                        <MaterialCommunityIcons key="tool" name="tool" size={iconLarge} />
                                    </Button>
                                </Popover.Trigger>
                                <Popover.Content top={0} left={0}>
                                    <Popover.Arrow />
                                    <YStack className="tool-stats editor-sidebar">
                                        <YStack tag="aside">
                                            <Heading tag="h2">
                                                {activeTool === 'draw'
                                                    ? 'Draw settings'
                                                    : activeTool === 'pan'
                                                        ? 'Pan mode'
                                                        : 'Selection'}
                                            </Heading>
                                            {activeTool === 'draw' ? (
                                                <YStack gap="$3" paddingTop="$3">
                                                    <XStack alignItems="center" gap="$3">
                                                        <Label htmlFor="draw-color" flex={1}>
                                                            Stroke color
                                                        </Label>
                                                        <input
                                                            id="draw-color"
                                                            type="color"
                                                            aria-label="Stroke color"
                                                            value={drawSettings.color}
                                                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                                onDrawSettingsChange({ color: event.target.value })
                                                            }
                                                            style={{
                                                                width: 44,
                                                                height: 44,
                                                                padding: 0,
                                                                border: 'none',
                                                                background: 'transparent',
                                                                cursor: 'pointer',
                                                            }}
                                                        />
                                                    </XStack>
                                                    <YStack gap="$2">
                                                        <XStack alignItems="center" justifyContent="space-between">
                                                            <Label htmlFor="draw-width">Stroke width</Label>
                                                            <Text fontSize={12} fontWeight="600">
                                                                {Math.round(drawSettings.width)} px
                                                            </Text>
                                                        </XStack>
                                                        <Slider
                                                            id="draw-width"
                                                            value={[drawSettings.width]}
                                                            min={1}
                                                            max={64}
                                                            step={1}
                                                            onValueChange={(value) => {
                                                                const width = value[0] ?? drawSettings.width;
                                                                onDrawSettingsChange({ width });
                                                            }}
                                                            aria-label="Stroke width"
                                                        >
                                                            <Slider.Track>
                                                                <Slider.TrackActive />
                                                            </Slider.Track>
                                                            <Slider.Thumb index={0} circular size="$2" />
                                                        </Slider>
                                                    </YStack>
                                                </YStack>
                                            ) : activeTool === 'pan' ? (
                                                <Paragraph paddingTop="$3" fontSize={12} color="rgba(226, 232, 240, 0.65)">
                                                    Drag anywhere on the canvas to scroll. Use a trackpad pinch, touch
                                                    gesture, or mouse wheel to zoom in and out.
                                                </Paragraph>
                                            ) : (
                                                <YStack gap="$3" paddingTop="$3">
                                                    <Paragraph fontSize={12} color="rgba(226, 232, 240, 0.65)">
                                                        Use the layer resize tool below to scale the active selection. Hold
                                                        Ctrl/Cmd/Alt to select a single element, Shift to toggle.
                                                    </Paragraph>
                                                    <Button
                                                        type="button"
                                                        disabled={!layerSelectionInteractive}
                                                        onPress={() => {
                                                            if (layerSelectionInteractive && layerSelectionRectRef.current) {
                                                                onLayerSelectionTransformStart();
                                                                const rect = layerSelectionRectRef.current;
                                                                const bounds = commitLayerSelectionBounds(rect);
                                                                onLayerSelectionTransform(bounds);
                                                                onLayerSelectionTransformEnd();
                                                            }
                                                        }}
                                                    >
                                                        {layerSelectionInteractive ? 'Resize selection' : 'Layer locked'}
                                                    </Button>
                                                </YStack>
                                            )}
                                        </YStack>
                                    </YStack>
                                </Popover.Content>
                            </Popover>
                        </Stack>
                        <Stack position="absolute" top={5} right={5} zIndex={2}>
                            <Popover placement="bottom-end">
                                <Popover.Trigger position="absolute" top={0} right={0}>
                                    <Button type="button" aria-label="cog" title="cog">
                                        <MaterialCommunityIcons key="cog" name="cog" size={iconLarge} />
                                    </Button>
                                </Popover.Trigger>
                                <Popover.Content top={0} right={0}>
                                    <Popover.Arrow />
                                    <YStack>
                                        <XStack>
                                            <Heading tag="h2">Canvas</Heading>
                                        </XStack>
                                        <XStack>
                                            <YStack className="canvas-stats">
                                                <XStack gap="$2">
                                                    <Label>Width</Label>
                                                    <Input
                                                        size="$2"
                                                        min={100}
                                                        value={displayWidth}
                                                        onChange={(event) => onCanvasWidthChange(Number(event.target.value))}
                                                        disabled={canvasSizeDisabled}
                                                    />
                                                </XStack>
                                                <XStack gap="$2">
                                                    <Label>Height</Label>
                                                    <Input
                                                        size="$2"
                                                        min={100}
                                                        value={displayHeight}
                                                        onChange={(event) => onCanvasHeightChange(Number(event.target.value))}
                                                        disabled={canvasSizeDisabled}
                                                    />
                                                </XStack>
                                                <XStack gap="$2">
                                                    <Label className="full-width">Background</Label>
                                                    <Input
                                                        size="$2"
                                                        value={options.backgroundColor}
                                                        onChange={(event) => onCanvasBackgroundChange(event.target.value)}
                                                    />
                                                </XStack>
                                            </YStack>
                                        </XStack>
                                    </YStack>
                                </Popover.Content>
                            </Popover>
                        </Stack>
                        <Stack position="absolute" bottom={5} left={5} zIndex={2}>
                            <Popover placement="top-start">
                                <Popover.Trigger position="absolute" bottom={0} left={0}>
                                    <Button type="button" aria-label="Layers" title="Layers">
                                        <MaterialCommunityIcons key="layers" name="layers" size={iconLarge} />
                                    </Button>
                                </Popover.Trigger>
                                <Popover.Content>
                                    <Popover.Arrow />
                                    <YStack>
                                        <Heading tag="h2">Layers</Heading>
                                        <Paragraph>{layers.length} layers</Paragraph>
                                        <LayersPanel
                                            layers={layers}
                                            elements={contentElements}
                                            activeLayerId={activeLayerId}
                                            selectedElementIds={selectedIds}
                                            onSelectLayer={onSelectLayer}
                                            onToggleVisibility={onToggleVisibility}
                                            onToggleLock={onToggleLock}
                                            onRemoveLayer={onRemoveLayer}
                                            onMoveLayer={onMoveLayer}
                                            onAddLayer={onAddLayer}
                                        />
                                    </YStack>
                                </Popover.Content>
                            </Popover>
                        </Stack>
                        {isBrowser ? (
                            <Stack position="absolute" bottom={5} right={5} zIndex={2}>
                                <Popover placement="top-end">
                                    <Popover.Trigger position="absolute" bottom={0} right={0}>
                                        <Button type="button" aria-label="Zoom" title="Zoom">
                                            <MaterialCommunityIcons key="zoom" name="zoom" size={iconLarge} />
                                        </Button>
                                    </Popover.Trigger>
                                    <Popover.Content>
                                        <Popover.Arrow />
                                        <YStack
                                            gap="$2"
                                            padding="$3"
                                            alignItems="center"
                                            borderRadius={12}
                                            borderWidth={1}
                                            borderColor="rgba(148, 163, 184, 0.35)"
                                            backgroundColor="rgba(15, 23, 42, 0.8)"
                                            className="stage-zoom-bar"
                                        >
                                            <Text fontSize={12} fontWeight="600" aria-live="polite">
                                                {zoomPercentage}%
                                            </Text>
                                            <Button
                                                type="button"
                                                onPress={onZoomIn}
                                                aria-label="Zoom in"
                                                title="Zoom in"
                                                size="$2"
                                            >
                                                <MaterialCommunityIcons
                                                    key="plus"
                                                    name="plus"
                                                    size={iconSize - 4}
                                                />
                                            </Button>
                                            <Slider
                                                value={sliderValue}
                                                min={sliderBounds.min}
                                                max={sliderBounds.max}
                                                step={sliderStep}
                                                orientation="vertical"
                                                height={200}
                                                onValueChange={onSliderChange}
                                                aria-label="Zoom level"
                                                width={36}
                                            >
                                                <Slider.Track>
                                                    <Slider.TrackActive />
                                                </Slider.Track>
                                                <Slider.Thumb index={0} circular size="$2" />
                                            </Slider>
                                            <Button
                                                type="button"
                                                onPress={onZoomOut}
                                                aria-label="Zoom out"
                                                title="Zoom out"
                                                size="$2"
                                            >
                                                <MaterialCommunityIcons
                                                    key="minus"
                                                    name="minus"
                                                    size={iconSize - 4}
                                                />
                                            </Button>
                                        </YStack>
                                    </Popover.Content>
                                </Popover>
                            </Stack>
                        ) : null}
                    </Stack>
                </Stack>
            </XStack>
        </Stack>
    );
}
