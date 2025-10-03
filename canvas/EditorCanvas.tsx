import type { CSSProperties, RefObject } from 'react';
import { Layer, Rect as RectShape, Stage, Transformer as TransformerShape } from 'react-konva';
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
} from '../components/KonvaNodes';
import type {
    EditorElement,
    EditorLayer,
    EditorOptions,
    GuideElement,
} from '../types/editor';
import type { KonvaEventObject, StageType, Vector2d } from '../types/konva';
import type { DragBoundFactory, SelectionRect } from '../components/editor/types';

export interface LayerSelectionInfo {
    layerId: string;
    elementIds: string[];
    locked: boolean;
    bounds: { x: number; y: number; width: number; height: number; rotation: number };
}

export interface EditorCanvasProps {
    stageRef: RefObject<StageType | null>;
    stageWrapperStyle: CSSProperties;
    stageCanvasStyle: CSSProperties;
    stageBackgroundStyle: CSSProperties;
    stageWidth: number;
    stageHeight: number;
    stagePosition: Vector2d;
    options: Pick<EditorOptions, 'showGuides' | 'zoom' | 'backgroundColor'>;
    guides: GuideElement[];
    contentElements: EditorElement[];
    selectedIds: string[];
    layerMap: Map<string, EditorLayer>;
    dragBoundFactory: DragBoundFactory;
    layerSelection: LayerSelectionInfo | null;
    onSelectElement: (id: string, mode?: 'layer' | 'single' | 'toggle') => void;
    onUpdateElement: (id: string, attributes: Partial<EditorElement>) => void;
    onStagePointerDown: (event: KonvaEventObject<MouseEvent | TouchEvent>) => void;
    onStagePointerMove: (event: KonvaEventObject<MouseEvent | TouchEvent>) => void;
    onStagePointerUp: (event: KonvaEventObject<MouseEvent | TouchEvent>) => void;
    onStageMouseEnter: (event: KonvaEventObject<MouseEvent>) => void;
    onStageMouseLeave: (event: KonvaEventObject<MouseEvent>) => void;
    selectionRect: SelectionRect | null;
    onMoveLayerSelection: (delta: Vector2d) => void;
    onLayerSelectionTransformStart: () => void;
    onLayerSelectionTransform: (bounds: { x: number; y: number; width: number; height: number; rotation: number }) => void;
    onLayerSelectionTransformEnd: () => void;
}

export function EditorCanvas({
    stageRef,
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
    layerMap,
    dragBoundFactory,
    layerSelection,
    onSelectElement,
    onUpdateElement,
    onStagePointerDown,
    onStagePointerMove,
    onStagePointerUp,
    onStageMouseEnter,
    onStageMouseLeave,
    selectionRect,
    onMoveLayerSelection,
    onLayerSelectionTransformStart,
    onLayerSelectionTransform,
    onLayerSelectionTransformEnd,
}: EditorCanvasProps) {
    const renderElement = (element: EditorElement) => {
        const commonProps = {
            element,
            key: element.id,
            isSelected: selectedIds.includes(element.id),
            onSelect: () => onSelectElement(element.id, 'single'),
            onUpdate: (attrs: Partial<EditorElement>) => onUpdateElement(element.id, attrs),
            dragBoundFunc: dragBoundFactory(element),
        };

        switch (element.type) {
            case 'rect':
                return <RectNode {...commonProps} />;
            case 'circle':
                return <CircleNode {...commonProps} />;
            case 'ellipse':
                return <EllipseNode {...commonProps} />;
            case 'line':
                return <LineNode {...commonProps} />;
            case 'text':
                return <TextNode {...commonProps} />;
            case 'image':
                return <ImageNode {...commonProps} />;
            case 'pencil':
                return <PencilNode {...commonProps} />;
            case 'triangle':
                return <TriangleNode {...commonProps} />;
            case 'path':
                return <PathNode {...commonProps} />;
            case 'frame':
                return <FrameNode {...commonProps} />;
            default:
                return null;
        }
    };

    return (
        <div style={stageWrapperStyle}>
            <div style={stageCanvasStyle}>
                <div style={stageBackgroundStyle} />
                <Stage
                    ref={stageRef}
                    width={stageWidth}
                    height={stageHeight}
                    scaleX={options.zoom}
                    scaleY={options.zoom}
                    x={stagePosition.x}
                    y={stagePosition.y}
                    onMouseDown={onStagePointerDown}
                    onMouseMove={onStagePointerMove}
                    onMouseUp={onStagePointerUp}
                    onTouchStart={onStagePointerDown}
                    onTouchMove={onStagePointerMove}
                    onTouchEnd={onStagePointerUp}
                    onMouseEnter={onStageMouseEnter}
                    onMouseLeave={onStageMouseLeave}
                    style={{ display: 'block' }}
                >
                    <Layer>
                        <RectShape
                            x={0}
                            y={0}
                            width={stageWidth}
                            height={stageHeight}
                            fill={options.backgroundColor}
                            listening={false}
                        />
                    </Layer>

                    {options.showGuides && guides.length > 0 && (
                        <Layer listening={false}>
                            {guides.map((guide) => (
                                <GuideNode
                                    key={guide.id}
                                    element={guide}
                                    stageWidth={stageWidth}
                                    stageHeight={stageHeight}
                                />
                            ))}
                        </Layer>
                    )}

                    <Layer>
                        {contentElements.map(renderElement)}

                        {selectionRect && (
                            <RectShape
                                x={selectionRect.x}
                                y={selectionRect.y}
                                width={selectionRect.width}
                                height={selectionRect.height}
                                stroke="#2563eb"
                                strokeWidth={1}
                                dash={[4, 4]}
                                listening={false}
                            />
                        )}

                        {layerSelection && !layerSelection.locked && (
                            <TransformerShape
                                nodes={[]}
                                rotateEnabled={true}
                                enabledAnchors={[
                                    'top-left',
                                    'top-right',
                                    'bottom-left',
                                    'bottom-right',
                                    'top-center',
                                    'middle-left',
                                    'middle-right',
                                    'bottom-center',
                                ]}
                                boundBoxFunc={(oldBox, newBox) => {
                                    if (newBox.width < 5 || newBox.height < 5) {
                                        return oldBox;
                                    }
                                    return newBox;
                                }}
                            />
                        )}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
}
