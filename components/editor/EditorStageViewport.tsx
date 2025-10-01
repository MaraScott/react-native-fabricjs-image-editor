import type { ChangeEvent, CSSProperties, RefObject } from 'react';
import { Layer, Rect as RectShape, Stage } from 'react-konva';
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
import type {
    EditorElement,
    EditorLayer,
    EditorOptions,
    GuideElement,
    ImageElement,
} from '../../types/editor';
import type { KonvaEventObject, StageType } from '../../types/konva';
import type { DragBoundFactory, SelectionRect, Tool } from './types';

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
    onSelectElement: (id: string) => void;
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
                                            onSelect={() => onSelectElement(guide.id)}
                                            onChange={(attributes) => onUpdateElement(guide.id, attributes)}
                                            zIndex={guideIndex}
                                        />
                                    ))}
                                {contentElements.map((element, elementIndex) => {
                                    const zIndex = guides.length + elementIndex;
                                    const layer = element.layerId ? layerMap.get(element.layerId) ?? null : null;
                                    const isLayerLocked = layer?.locked ?? false;
                                    const isSelected = selectedIds.includes(element.id);
                                    const selectionEnabled = activeTool === 'select' && !isLayerLocked;
                                    const dragBound = dragBoundFactory(element);

                                    switch (element.type) {
                                        case 'rect':
                                            return (
                                                <RectNode
                                                    key={element.id}
                                                    shape={element}
                                                    isSelected={isSelected}
                                                    selectionEnabled={selectionEnabled}
                                                    onSelect={() => onSelectElement(element.id)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
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
                                                    onSelect={() => onSelectElement(element.id)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
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
                                                    onSelect={() => onSelectElement(element.id)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
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
                                                    onSelect={() => onSelectElement(element.id)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
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
                                                    onSelect={() => onSelectElement(element.id)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
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
                                                    onSelect={() => onSelectElement(element.id)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
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
                                                    onSelect={() => onSelectElement(element.id)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
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
                                                    onSelect={() => onSelectElement(element.id)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
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
                                                    onSelect={() => onSelectElement(element.id)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
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
                                                    onSelect={() => onSelectElement(element.id)}
                                                    onChange={(attributes) => onUpdateElement(element.id, attributes)}
                                                    dragBoundFunc={dragBound}
                                                    zIndex={zIndex}
                                                />
                                            );
                                        default:
                                            return null;
                                    }
                                })}
                            </Layer>
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
                                            <Heading tag="h2">{activeTool === 'draw' ? 'Draw settings' : 'Selection'}</Heading>
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
                                            ) : (
                                                <Paragraph paddingTop="$3" fontSize={12} color="rgba(226, 232, 240, 0.65)">
                                                    Select an element on the canvas to view its properties.
                                                </Paragraph>
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
