import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Layer, Stage } from 'react-konva';
import { Button, Heading, Image, Input, Label, Paragraph, Separator, Stack, Text, XStack, YStack } from 'tamagui';
import { MaterialCommunityIcons } from './icons/MaterialCommunityIcons';
import type { KonvaEventObject, StageType, Vector2d } from '../types/konva';
import LayersPanel from './LayersPanel';
import PropertiesPanel from './PropertiesPanel';
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
} from './KonvaNodes';
import { useHistory } from '../hooks/useHistory';
import type {
    EditorDocument,
    EditorElement,
    EditorLayer,
    EditorOptions,
    FrameElement,
    GuideElement,
    ImageElement,
    LineElement,
    PathElement,
    PencilElement,
    RectElement,
    TextElement,
} from '../types/editor';
import { createEmptyDesign, parseDesign, stringifyDesign } from '../utils/design';
import { createEditorId } from '../utils/ids';

type Tool = 'select' | 'draw' | 'path';

type DrawingState = {
    id: string;
    type: 'pencil' | 'path';
    origin: { x: number; y: number };
};

type TemplateDefinition = {
    id: string;
    name: string;
    description: string;
    apply: () => { design: EditorDocument; options?: Partial<EditorOptions> };
};

type DragBoundFactory = (element: EditorElement) => ((position: Vector2d) => Vector2d) | undefined;

type BaseElementInit = Pick<EditorElement, 'name' | 'x' | 'y' | 'rotation' | 'opacity' | 'metadata'>;

const SNAP_THRESHOLD = 12;
const STORAGE_KEY = 'konva-image-editor-design';

const DEFAULT_DRAW = { color: '#2563eb', width: 5 };
const DEFAULT_PATH = { color: '#0f172a', width: 3 };
const TOOLBAR_ICON_SIZE = 20;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.05;

const DEFAULT_IMAGES: { id: string; name: string; src: string }[] = [
    {
        id: 'mountains',
        name: 'Mountain view',
        src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60',
    },
    {
        id: 'workspace',
        name: 'Workspace',
        src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=60',
    },
    {
        id: 'city',
        name: 'City skyline',
        src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=60',
    },
];

function createBaseElement(type: EditorElement['type'], init: BaseElementInit): BaseElementInit & {
    id: string;
    type: EditorElement['type'];
    draggable: boolean;
    visible: boolean;
    locked: boolean;
    layerId: null;
} {
    return {
        id: createEditorId(type),
        type,
        draggable: true,
        visible: true,
        locked: false,
        layerId: null,
        ...init,
    };
}

function createLayerDefinition(name: string): EditorLayer {
    return {
        id: createEditorId('layer'),
        name,
        visible: true,
        locked: false,
    } satisfies EditorLayer;
}

function assignElementsToLayer<T extends EditorElement>(elements: T[], layerId: string): T[] {
    return elements.map((element) => ({ ...element, layerId }));
}

function getNextLayerName(layers: EditorLayer[]): string {
    const existing = new Set(layers.map((layer) => layer.name));
    let index = layers.length + 1;
    let candidate = `Layer ${index}`;
    while (existing.has(candidate)) {
        index += 1;
        candidate = `Layer ${index}`;
    }
    return candidate;
}

function orderElementsByLayer(elements: EditorElement[], layers: EditorLayer[]): EditorElement[] {
    if (layers.length === 0) {
        return elements;
    }

    const layerIds = new Set(layers.map((layer) => layer.id));
    const guides: EditorElement[] = [];
    const buckets = new Map<string, EditorElement[]>();
    const unassigned: EditorElement[] = [];

    elements.forEach((element) => {
        if (element.type === 'guide') {
            guides.push(element);
            return;
        }

        if (element.layerId && layerIds.has(element.layerId)) {
            const existing = buckets.get(element.layerId) ?? [];
            existing.push(element);
            buckets.set(element.layerId, existing);
            return;
        }

        unassigned.push(element);
    });

    const ordered: EditorElement[] = [...guides];
    layers.forEach((layer) => {
        const entries = buckets.get(layer.id);
        if (entries && entries.length > 0) {
            ordered.push(...entries);
        }
    });
    if (unassigned.length > 0) {
        ordered.push(...unassigned);
    }

    return ordered;
}

function createRect(options: EditorOptions, overrides: Partial<RectElement> = {}): RectElement {
    const base = createBaseElement('rect', {
        name: overrides.name ?? 'Rectangle',
        x: overrides.x ?? options.width / 2 - 120,
        y: overrides.y ?? options.height / 2 - 80,
        rotation: overrides.rotation ?? 0,
        opacity: overrides.opacity ?? 1,
        metadata: overrides.metadata ?? null,
    });
    return {
        ...base,
        type: 'rect',
        width: overrides.width ?? 240,
        height: overrides.height ?? 160,
        fill: overrides.fill ?? '#38bdf8',
        stroke: overrides.stroke ?? '#0f172a',
        strokeWidth: overrides.strokeWidth ?? 4,
        cornerRadius: overrides.cornerRadius ?? 16,
    } satisfies RectElement;
}

function createFrame(options: EditorOptions, overrides: Partial<FrameElement> = {}): FrameElement {
    const rect = createRect(options, {
        ...overrides,
        name: overrides.name ?? 'Frame',
        fill: 'transparent',
        strokeWidth: overrides.strokeWidth ?? 10,
        stroke: overrides.stroke ?? '#f8fafc',
        cornerRadius: overrides.cornerRadius ?? 0,
    });
    return { ...rect, type: 'frame' } satisfies FrameElement;
}

function createCircle(options: EditorOptions, overrides: Partial<EditorElement> = {}) {
    const base = createBaseElement('circle', {
        name: overrides.name ?? 'Circle',
        x: overrides.x ?? options.width / 2,
        y: overrides.y ?? options.height / 2,
        rotation: overrides.rotation ?? 0,
        opacity: overrides.opacity ?? 1,
        metadata: overrides.metadata ?? null,
    });
    return {
        ...base,
        type: 'circle',
        radius: 'radius' in overrides && typeof overrides.radius === 'number' ? overrides.radius : 120,
        fill: 'fill' in overrides && typeof overrides.fill === 'string' ? overrides.fill : '#a855f7',
        stroke: 'stroke' in overrides && typeof overrides.stroke === 'string' ? overrides.stroke : '#0f172a',
        strokeWidth:
            'strokeWidth' in overrides && typeof overrides.strokeWidth === 'number' ? overrides.strokeWidth : 4,
    };
}

function createEllipse(options: EditorOptions, overrides: Partial<EditorElement> = {}) {
    const base = createBaseElement('ellipse', {
        name: overrides.name ?? 'Ellipse',
        x: overrides.x ?? options.width / 2,
        y: overrides.y ?? options.height / 2,
        rotation: overrides.rotation ?? 0,
        opacity: overrides.opacity ?? 1,
        metadata: overrides.metadata ?? null,
    });
    return {
        ...base,
        type: 'ellipse',
        radiusX: 'radiusX' in overrides && typeof overrides.radiusX === 'number' ? overrides.radiusX : 180,
        radiusY: 'radiusY' in overrides && typeof overrides.radiusY === 'number' ? overrides.radiusY : 120,
        fill: 'fill' in overrides && typeof overrides.fill === 'string' ? overrides.fill : '#22d3ee',
        stroke: 'stroke' in overrides && typeof overrides.stroke === 'string' ? overrides.stroke : '#0f172a',
        strokeWidth:
            'strokeWidth' in overrides && typeof overrides.strokeWidth === 'number' ? overrides.strokeWidth : 4,
    };
}

function createTriangle(options: EditorOptions, overrides: Partial<EditorElement> = {}) {
    const base = createBaseElement('triangle', {
        name: overrides.name ?? 'Triangle',
        x: overrides.x ?? options.width / 2 - 120,
        y: overrides.y ?? options.height / 2 - 120,
        rotation: overrides.rotation ?? 0,
        opacity: overrides.opacity ?? 1,
        metadata: overrides.metadata ?? null,
    });
    return {
        ...base,
        type: 'triangle',
        width: 'width' in overrides && typeof overrides.width === 'number' ? overrides.width : 240,
        height: 'height' in overrides && typeof overrides.height === 'number' ? overrides.height : 240,
        fill: 'fill' in overrides && typeof overrides.fill === 'string' ? overrides.fill : '#f97316',
        stroke: 'stroke' in overrides && typeof overrides.stroke === 'string' ? overrides.stroke : '#0f172a',
        strokeWidth:
            'strokeWidth' in overrides && typeof overrides.strokeWidth === 'number' ? overrides.strokeWidth : 4,
    };
}

function createLine(options: EditorOptions, overrides: Partial<LineElement> = {}): LineElement {
    const base = createBaseElement('line', {
        name: overrides.name ?? 'Line',
        x: overrides.x ?? options.width / 2 - 160,
        y: overrides.y ?? options.height / 2,
        rotation: overrides.rotation ?? 0,
        opacity: overrides.opacity ?? 1,
        metadata: overrides.metadata ?? null,
    });
    return {
        ...base,
        type: 'line',
        points: overrides.points ? [...overrides.points] : [0, 0, 320, 0],
        stroke: overrides.stroke ?? '#0f172a',
        strokeWidth: overrides.strokeWidth ?? 6,
        dash: overrides.dash ? [...overrides.dash] : undefined,
        tension: overrides.tension,
        closed: overrides.closed ?? false,
        fill: overrides.fill,
    } satisfies LineElement;
}

function createPathElement(options: EditorOptions, overrides: Partial<PathElement> = {}): PathElement {
    const base = createBaseElement('path', {
        name: overrides.name ?? 'Path',
        x: overrides.x ?? options.width / 2 - 200,
        y: overrides.y ?? options.height / 2 - 100,
        rotation: overrides.rotation ?? 0,
        opacity: overrides.opacity ?? 1,
        metadata: overrides.metadata ?? null,
    });
    return {
        ...base,
        type: 'path',
        points: overrides.points ? [...overrides.points] : [0, 0, 120, 40, 200, 120],
        stroke: overrides.stroke ?? '#1e3a8a',
        strokeWidth: overrides.strokeWidth ?? 5,
        tension: overrides.tension ?? 0.4,
        closed: overrides.closed ?? false,
        fill: overrides.fill,
    } satisfies PathElement;
}

function createText(options: EditorOptions, overrides: Partial<TextElement> = {}): TextElement {
    const base = createBaseElement('text', {
        name: overrides.name ?? 'Text',
        x: overrides.x ?? options.width / 2 - 200,
        y: overrides.y ?? options.height / 2 - 40,
        rotation: overrides.rotation ?? 0,
        opacity: overrides.opacity ?? 1,
        metadata: overrides.metadata ?? null,
    });
    return {
        ...base,
        type: 'text',
        text: overrides.text ?? 'Edit me!',
        fontSize: overrides.fontSize ?? 48,
        fontFamily:
            overrides.fontFamily ?? 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontStyle: overrides.fontStyle ?? 'normal',
        fontWeight: overrides.fontWeight ?? 'bold',
        fill: overrides.fill ?? '#f8fafc',
        width: overrides.width ?? 400,
        align: overrides.align ?? 'center',
        lineHeight: overrides.lineHeight ?? 1.2,
        letterSpacing: overrides.letterSpacing ?? 0,
        stroke: overrides.stroke ?? 'transparent',
        strokeWidth: overrides.strokeWidth ?? 0,
        backgroundColor: overrides.backgroundColor ?? 'transparent',
        padding: overrides.padding ?? 0,
    } satisfies TextElement;
}

function createImage(options: EditorOptions, src: string, overrides: Partial<ImageElement> = {}): ImageElement {
    const base = createBaseElement('image', {
        name: overrides.name ?? 'Image',
        x: overrides.x ?? options.width / 2 - 160,
        y: overrides.y ?? options.height / 2 - 120,
        rotation: overrides.rotation ?? 0,
        opacity: overrides.opacity ?? 1,
        metadata: overrides.metadata ?? null,
    });
    return {
        ...base,
        type: 'image',
        src,
        width: overrides.width ?? 320,
        height: overrides.height ?? 240,
        cornerRadius: overrides.cornerRadius ?? 0,
        keepRatio: overrides.keepRatio ?? true,
    } satisfies ImageElement;
}

function createGuide(options: EditorOptions, orientation: GuideElement['orientation']): GuideElement {
    const base = createBaseElement('guide', {
        name: orientation === 'horizontal' ? 'Horizontal guide' : 'Vertical guide',
        x: orientation === 'vertical' ? options.width / 2 : 0,
        y: orientation === 'horizontal' ? options.height / 2 : 0,
        rotation: 0,
        opacity: 1,
        metadata: { isGuide: true, excludeFromExport: true },
    });
    return {
        ...base,
        type: 'guide',
        orientation,
        length: orientation === 'horizontal' ? options.width : options.height,
        stroke: 'rgba(56, 189, 248, 0.8)',
        strokeWidth: 1,
    } satisfies GuideElement;
}

function cloneElement(element: EditorElement): EditorElement {
    const base = {
        ...element,
        id: createEditorId(element.type),
        name: `${element.name} copy`,
        x: element.x + 24,
        y: element.y + 24,
        metadata: element.metadata ? { ...element.metadata } : null,
        locked: false,
        layerId: element.layerId ?? null,
    } as EditorElement;

    switch (element.type) {
        case 'rect':
        case 'frame':
            return { ...base, type: element.type, width: element.width, height: element.height } as RectElement | FrameElement;
        case 'circle':
            return { ...base, type: 'circle', radius: element.radius };
        case 'ellipse':
            return { ...base, type: 'ellipse', radiusX: element.radiusX, radiusY: element.radiusY };
        case 'triangle':
            return { ...base, type: 'triangle', width: element.width, height: element.height };
        case 'line':
            return { ...base, type: 'line', points: [...element.points], dash: element.dash ? [...element.dash] : undefined };
        case 'path':
            return { ...base, type: 'path', points: [...element.points], closed: element.closed };
        case 'pencil':
            return { ...base, type: 'pencil', points: [...element.points] };
        case 'text':
            return { ...base, type: 'text', text: element.text };
        case 'image':
            return { ...base, type: 'image', width: element.width, height: element.height };
        case 'guide':
            return { ...element, id: createEditorId('guide'), layerId: null };
        default:
            return base;
    }
}

interface ElementBounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
    centerX: number;
    centerY: number;
}

function getElementBounds(element: EditorElement, position: Vector2d): ElementBounds | null {
    switch (element.type) {
        case 'rect':
        case 'frame':
            return {
                left: position.x,
                right: position.x + element.width,
                top: position.y,
                bottom: position.y + element.height,
                centerX: position.x + element.width / 2,
                centerY: position.y + element.height / 2,
            };
        case 'triangle':
            return {
                left: position.x,
                right: position.x + element.width,
                top: position.y,
                bottom: position.y + element.height,
                centerX: position.x + element.width / 2,
                centerY: position.y + element.height / 2,
            };
        case 'circle':
            return {
                left: position.x - element.radius,
                right: position.x + element.radius,
                top: position.y - element.radius,
                bottom: position.y + element.radius,
                centerX: position.x,
                centerY: position.y,
            };
        case 'ellipse':
            return {
                left: position.x - element.radiusX,
                right: position.x + element.radiusX,
                top: position.y - element.radiusY,
                bottom: position.y + element.radiusY,
                centerX: position.x,
                centerY: position.y,
            };
        case 'image':
            return {
                left: position.x,
                right: position.x + element.width,
                top: position.y,
                bottom: position.y + element.height,
                centerX: position.x + element.width / 2,
                centerY: position.y + element.height / 2,
            };
        case 'text':
            return {
                left: position.x,
                right: position.x + element.width,
                top: position.y,
                bottom: position.y + element.fontSize,
                centerX: position.x + element.width / 2,
                centerY: position.y + element.fontSize / 2,
            };
        default:
            return null;
    }
}

function createDragBound(options: EditorOptions, guides: GuideElement[]): DragBoundFactory {
    if (!options.snapToGrid && (!options.snapToGuides || guides.length === 0)) {
        return () => undefined;
    }

    const verticalGuides = guides.filter((guide) => guide.orientation === 'vertical').map((guide) => guide.x);
    const horizontalGuides = guides.filter((guide) => guide.orientation === 'horizontal').map((guide) => guide.y);

    return (element: EditorElement) => {
        if (element.type === 'guide') return undefined;

        return (position: Vector2d) => {
            let { x, y } = position;

            if (options.snapToGrid) {
                const grid = Math.max(2, options.gridSize);
                x = Math.round(x / grid) * grid;
                y = Math.round(y / grid) * grid;
            }

            if (options.snapToGuides && (verticalGuides.length > 0 || horizontalGuides.length > 0)) {
                const bounds = getElementBounds(element, { x, y });
                if (bounds) {
                    if (verticalGuides.length > 0) {
                        const verticalCandidates = [
                            {
                                value: bounds.left,
                                apply: (target: number) => {
                                    x += target - bounds.left;
                                },
                            },
                            {
                                value: bounds.centerX,
                                apply: (target: number) => {
                                    x += target - bounds.centerX;
                                },
                            },
                            {
                                value: bounds.right,
                                apply: (target: number) => {
                                    x += target - bounds.right;
                                },
                            },
                        ];
                        let bestX: { diff: number; apply: (target: number) => void; target: number } | null = null;
                        verticalCandidates.forEach((candidate) => {
                            verticalGuides.forEach((guide) => {
                                const diff = Math.abs(candidate.value - guide);
                                if (diff <= SNAP_THRESHOLD && (!bestX || diff < bestX.diff)) {
                                    bestX = { diff, apply: candidate.apply, target: guide };
                                }
                            });
                        });
                        if (bestX) {
                            bestX.apply(bestX.target);
                        }
                    }

                    if (horizontalGuides.length > 0) {
                        const horizontalCandidates = [
                            {
                                value: bounds.top,
                                apply: (target: number) => {
                                    y += target - bounds.top;
                                },
                            },
                            {
                                value: bounds.centerY,
                                apply: (target: number) => {
                                    y += target - bounds.centerY;
                                },
                            },
                            {
                                value: bounds.bottom,
                                apply: (target: number) => {
                                    y += target - bounds.bottom;
                                },
                            },
                        ];
                        let bestY: { diff: number; apply: (target: number) => void; target: number } | null = null;
                        horizontalCandidates.forEach((candidate) => {
                            horizontalGuides.forEach((guide) => {
                                const diff = Math.abs(candidate.value - guide);
                                if (diff <= SNAP_THRESHOLD && (!bestY || diff < bestY.diff)) {
                                    bestY = { diff, apply: candidate.apply, target: guide };
                                }
                            });
                        });
                        if (bestY) {
                            bestY.apply(bestY.target);
                        }
                    }
                }
            }

            return { x, y };
        };
    };
}

function createDefaultTemplates(options: EditorOptions): TemplateDefinition[] {
    return [
        {
            id: 'hero-banner',
            name: 'Hero banner',
            description: 'A bold hero layout with accent circle and button.',
            apply: () => {
                const background = createRect(options, {
                    name: 'Hero block',
                    width: options.width * 0.7,
                    height: options.height * 0.7,
                    x: options.width * 0.15,
                    y: options.height * 0.15,
                    fill: '#0f172a',
                    stroke: '#1d4ed8',
                    strokeWidth: 6,
                    cornerRadius: 32,
                });
                const circle = createCircle(options, {
                    name: 'Accent circle',
                    x: options.width * 0.75,
                    y: options.height * 0.3,
                    radius: options.height * 0.25,
                    fill: '#2563eb',
                    stroke: '#93c5fd',
                    strokeWidth: 12,
                });
                const heading = createText(options, {
                    name: 'Heading',
                    text: 'Create something amazing',
                    fontSize: 64,
                    width: options.width * 0.6,
                    x: options.width * 0.2,
                    y: options.height * 0.25,
                    align: 'left',
                    fill: '#f8fafc',
                    fontWeight: 'bold',
                    stroke: 'transparent',
                });
                const subheading = createText(options, {
                    name: 'Subheading',
                    text: 'Craft beautiful stories with the power of React + Konva.',
                    fontSize: 28,
                    width: options.width * 0.5,
                    x: options.width * 0.2,
                    y: options.height * 0.4,
                    align: 'left',
                    fill: '#cbd5f5',
                    fontWeight: 'normal',
                });
                const button = createRect(options, {
                    name: 'Primary button',
                    x: options.width * 0.2,
                    y: options.height * 0.55,
                    width: 220,
                    height: 64,
                    cornerRadius: 32,
                    fill: '#f97316',
                    stroke: '#fb923c',
                    strokeWidth: 0,
                });
                const buttonText = createText(options, {
                    name: 'Button text',
                    text: 'Get started',
                    fontSize: 28,
                    width: 220,
                    x: button.x,
                    y: button.y + 14,
                    fill: '#0f172a',
                });

                const layer = createLayerDefinition('Layer 1');
                const assigned = assignElementsToLayer(
                    [background, circle, heading, subheading, button, buttonText],
                    layer.id,
                );

                return {
                    design: {
                        elements: assigned,
                        layers: [layer],
                        metadata: null,
                    },
                    options: {
                        backgroundColor: '#020617',
                        showGrid: false,
                    },
                };
            },
        },
        {
            id: 'quote-card',
            name: 'Quote card',
            description: 'Centered quote with framed border.',
            apply: () => {
                const frame = createFrame(options, {
                    width: options.width * 0.8,
                    height: options.height * 0.6,
                    x: options.width * 0.1,
                    y: options.height * 0.2,
                    stroke: '#f97316',
                    strokeWidth: 12,
                });
                const quote = createText(options, {
                    text: '“Design is the silent ambassador of your brand.”',
                    fontSize: 48,
                    width: options.width * 0.7,
                    x: options.width * 0.15,
                    y: options.height * 0.3,
                    align: 'center',
                    fill: '#f8fafc',
                    stroke: 'transparent',
                });
                const author = createText(options, {
                    text: '— Paul Rand',
                    fontSize: 28,
                    width: options.width * 0.7,
                    x: options.width * 0.15,
                    y: options.height * 0.45,
                    align: 'center',
                    fill: '#cbd5f5',
                });
                const accent = createCircle(options, {
                    name: 'Accent dot',
                    radius: 24,
                    fill: '#38bdf8',
                    stroke: 'transparent',
                    x: frame.x + frame.width - 40,
                    y: frame.y + 40,
                });

                const layer = createLayerDefinition('Layer 1');
                const assigned = assignElementsToLayer([frame, quote, author, accent], layer.id);

                return {
                    design: {
                        elements: assigned,
                        layers: [layer],
                        metadata: null,
                    },
                    options: {
                        backgroundColor: '#0f172a',
                        showGrid: false,
                    },
                };
            },
        },
        {
            id: 'photo-card',
            name: 'Photo focus',
            description: 'Photo with caption and callout rectangle.',
            apply: () => {
                const frame = createFrame(options, {
                    width: options.width * 0.6,
                    height: options.height * 0.6,
                    x: options.width * 0.3,
                    y: options.height * 0.2,
                    stroke: '#38bdf8',
                    strokeWidth: 8,
                });
                const caption = createText(options, {
                    text: 'Exploring the vibrant streets of Tokyo at night.',
                    fontSize: 28,
                    width: options.width * 0.6,
                    x: options.width * 0.32,
                    y: frame.y + frame.height + 16,
                    align: 'left',
                    fill: '#f8fafc',
                });
                const callout = createRect(options, {
                    name: 'Callout',
                    x: options.width * 0.05,
                    y: options.height * 0.25,
                    width: options.width * 0.22,
                    height: options.height * 0.5,
                    fill: '#1e293b',
                    stroke: '#38bdf8',
                    strokeWidth: 2,
                    cornerRadius: 18,
                });
                const calloutText = createText(options, {
                    text: 'Travel Journal\nVolume 05',
                    fontSize: 34,
                    width: callout.width,
                    x: callout.x,
                    y: callout.y + 32,
                    align: 'center',
                    fill: '#38bdf8',
                });

                const layer = createLayerDefinition('Layer 1');
                const assigned = assignElementsToLayer([frame, caption, callout, calloutText], layer.id);

                return {
                    design: {
                        elements: assigned,
                        layers: [layer],
                        metadata: null,
                    },
                    options: {
                        backgroundColor: '#020617',
                        showGrid: false,
                    },
                };
            },
        },
    ];
}

function createDefaultFrames(options: EditorOptions): FrameElement[] {
    return [
        createFrame(options, {
            name: 'Simple frame',
            width: options.width - 80,
            height: options.height - 80,
            x: 40,
            y: 40,
            stroke: '#f8fafc',
            strokeWidth: 12,
            cornerRadius: 24,
        }),
        createFrame(options, {
            name: 'Poster border',
            width: options.width - 120,
            height: options.height - 120,
            x: 60,
            y: 60,
            stroke: '#38bdf8',
            strokeWidth: 18,
            cornerRadius: 0,
        }),
    ];
}

const DEFAULT_OPTIONS: EditorOptions = {
    width: 960,
    height: 540,
    backgroundColor: '#0f172a',
    showGrid: true,
    gridSize: 32,
    snapToGrid: true,
    snapToGuides: true,
    showGuides: true,
    showRulers: false,
    zoom: 1,
    fixedCanvas: false,
    canvasSizeLocked: false,
};

function clampZoom(value: number): number {
    if (!Number.isFinite(value)) {
        return ZOOM_MIN;
    }
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

function getStagePointer(stage: StageType): Vector2d | null {
    const pointer = stage.getPointerPosition();
    if (!pointer) {
        return null;
    }
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point(pointer);
}

function getInitialOptions(options?: Partial<EditorOptions>): EditorOptions {
    return { ...DEFAULT_OPTIONS, ...(options ?? {}) };
}

interface BridgeMessage {
    type: string;
    payload?: any;
}

function parseBridgeMessage(raw: unknown): BridgeMessage | null {
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.type === 'string') {
                return parsed as BridgeMessage;
            }
        } catch (error) {
            console.warn('[Editor] Unable to parse message', error);
        }
        return null;
    }

    if (raw && typeof raw === 'object' && typeof (raw as any).type === 'string') {
        return raw as BridgeMessage;
    }

    return null;
}

function useBridge() {
    const postMessage = useCallback((type: string, payload?: unknown) => {
        const message = JSON.stringify({ type, payload });
        if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
            window.ReactNativeWebView.postMessage(message);
        }
        if (window.parent && window.parent !== window && typeof window.parent.postMessage === 'function') {
            window.parent.postMessage(message, '*');
        }
    }, []);

    return { postMessage };
}

function cloneDocument(document: EditorDocument): EditorDocument {
    const sourceLayers = document.layers && document.layers.length > 0 ? document.layers : [createLayerDefinition('Layer 1')];
    return {
        elements: document.elements.map((element) => cloneElement(element)),
        layers: sourceLayers.map((layer) => ({ ...layer })),
        metadata: document.metadata ? { ...document.metadata } : null,
    } satisfies EditorDocument;
}

interface EditorAppProps {
    initialDesign?: EditorDocument | null;
    initialOptions?: Partial<EditorOptions>;
}

export default function EditorApp({ initialDesign, initialOptions }: EditorAppProps) {
    const [options, setOptions] = useState<EditorOptions>(getInitialOptions(initialOptions));
    const stageRef = useRef<StageType | null>(null);
    const editorCanvasRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const initialDocument = useMemo(() => initialDesign ?? createEmptyDesign(), [initialDesign]);
    const { value: design, set: setDesign, reset: resetDesign, undo, redo, canUndo, canRedo } =
        useHistory<EditorDocument>(initialDocument);

    const elements = design.elements;
    const layers = design.layers;
    const orderedElements = useMemo(() => orderElementsByLayer(elements, layers), [elements, layers]);
    const guides = useMemo(
        () => orderedElements.filter((element) => element.type === 'guide') as GuideElement[],
        [orderedElements],
    );
    const contentElements = useMemo(
        () => orderedElements.filter((element) => element.type !== 'guide'),
        [orderedElements],
    );

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<Tool>('draw');
    const [drawingState, setDrawingState] = useState<DrawingState | null>(null);
    const [clipboard, setClipboard] = useState<EditorElement[] | null>(null);
    const [drawSettings, setDrawSettings] = useState(DEFAULT_DRAW);
    const [pathSettings, setPathSettings] = useState(DEFAULT_PATH);

    useLayoutEffect(() => {
        if (options.fixedCanvas) {
            return;
        }

        if (typeof window === 'undefined') {
            return;
        }

        const element = editorCanvasRef.current;
        if (!element) {
            return;
        }

        const measure = () => {
            const style = window.getComputedStyle(element);
            const paddingX = Number.parseFloat(style.paddingLeft || '0') + Number.parseFloat(style.paddingRight || '0');
            const paddingY = Number.parseFloat(style.paddingTop || '0') + Number.parseFloat(style.paddingBottom || '0');
            const nextWidth = Math.max(1, Math.round(element.clientWidth - paddingX));
            const nextHeight = Math.max(1, Math.round(element.clientHeight - paddingY));

            setOptions((current) => {
                if (current.fixedCanvas) {
                    return current;
                }

                const widthChanged = Math.abs(current.width - nextWidth) > 0.5;
                const heightChanged = Math.abs(current.height - nextHeight) > 0.5;

                if (!widthChanged && !heightChanged) {
                    return current;
                }

                return { ...current, width: nextWidth, height: nextHeight };
            });
        };

        let frame = 0;
        const scheduleMeasure = () => {
            if (frame) {
                window.cancelAnimationFrame(frame);
            }
            frame = window.requestAnimationFrame(measure);
        };

        measure();

        let observer: ResizeObserver | null = null;

        if ('ResizeObserver' in window) {
            observer = new ResizeObserver(scheduleMeasure);
            observer.observe(element);
        } else {
            window.addEventListener('resize', scheduleMeasure);
        }

        return () => {
            if (observer) {
                observer.disconnect();
            } else {
                window.removeEventListener('resize', scheduleMeasure);
            }

            if (frame) {
                window.cancelAnimationFrame(frame);
            }
        };
    }, [options.fixedCanvas, setOptions]);

    useEffect(() => {
        if (layers.length === 0) {
            return;
        }

        if (!activeLayerId || !layers.some((layer) => layer.id === activeLayerId)) {
            setActiveLayerId(layers[layers.length - 1].id);
        }
    }, [layers, activeLayerId]);

    useEffect(() => {
        if (layers.length === 0) {
            return;
        }

        const layerIds = new Set(layers.map((layer) => layer.id));
        const fallbackLayer = layers[layers.length - 1];
        if (!fallbackLayer) {
            return;
        }

        const requiresUpdate = elements.some(
            (element) => element.type !== 'guide' && (!element.layerId || !layerIds.has(element.layerId)),
        );

        if (!requiresUpdate) {
            return;
        }

        setDesign((current) => {
            const nextLayers = current.layers.length > 0 ? current.layers : layers;
            const fallback = nextLayers[nextLayers.length - 1];
            if (!fallback) {
                return current;
            }

            const validIds = new Set(nextLayers.map((layer) => layer.id));
            const updatedElements = current.elements.map((element) => {
                if (element.type === 'guide') {
                    return element.layerId === null ? element : { ...element, layerId: null };
                }
                if (element.layerId && validIds.has(element.layerId)) {
                    return element;
                }
                return { ...element, layerId: fallback.id };
            });

            return {
                ...current,
                layers: nextLayers,
                elements: orderElementsByLayer(updatedElements, nextLayers),
            };
        });
    }, [layers, elements, setDesign]);

    const dragBoundFactory = useMemo(() => createDragBound(options, guides), [options, guides]);

    const selectedElement = useMemo(
        () => contentElements.find((element) => selectedIds.includes(element.id)) ?? null,
        [contentElements, selectedIds],
    );

    const templates = useMemo(() => createDefaultTemplates(options), [options.width, options.height, options.backgroundColor]);
    const frames = useMemo(() => createDefaultFrames(options), [options.width, options.height]);

    const layerMap = useMemo(() => {
        const map = new Map<string, EditorLayer>();
        layers.forEach((layer) => {
            map.set(layer.id, layer);
        });
        return map;
    }, [layers]);

    const { postMessage } = useBridge();

    const updateElements = useCallback(
        (updater: (elements: EditorElement[]) => EditorElement[]) => {
            setDesign((current) => {
                const nextLayers = current.layers.length > 0 ? current.layers : [createLayerDefinition('Layer 1')];
                const updatedElements = updater(current.elements);
                return {
                    ...current,
                    layers: nextLayers,
                    elements: orderElementsByLayer(updatedElements, nextLayers),
                };
            });
        },
        [setDesign],
    );

    const updateLayers = useCallback(
        (updater: (layers: EditorLayer[]) => EditorLayer[]) => {
            setDesign((current) => {
                const baseLayers = current.layers.length > 0 ? current.layers : [createLayerDefinition('Layer 1')];
                const nextLayers = updater(baseLayers);
                return {
                    ...current,
                    layers: nextLayers,
                    elements: orderElementsByLayer(current.elements, nextLayers),
                };
            });
        },
        [setDesign],
    );

    const addElement = useCallback(
        (element: EditorElement) => {
            let assigned: EditorElement | null = null;
            let targetLayerId: string | null = null;

            setDesign((current) => {
                let nextLayers = current.layers;
                if (nextLayers.length === 0) {
                    nextLayers = [createLayerDefinition('Layer 1')];
                }

                if (element.type !== 'guide') {
                    const activeExists = activeLayerId && nextLayers.some((layer) => layer.id === activeLayerId);
                    targetLayerId = activeExists ? activeLayerId! : nextLayers[nextLayers.length - 1].id;
                }

                const layer = targetLayerId ? nextLayers.find((candidate) => candidate.id === targetLayerId) ?? null : null;
                assigned =
                    element.type === 'guide'
                        ? { ...element, layerId: null }
                        : {
                              ...element,
                              layerId: targetLayerId,
                              visible: layer ? element.visible && layer.visible : element.visible,
                              locked: layer ? element.locked || layer.locked : element.locked,
                          };

                const updatedElements = orderElementsByLayer([...current.elements, assigned!], nextLayers);
                return { ...current, layers: nextLayers, elements: updatedElements };
            });

            if (assigned) {
                setSelectedIds([assigned.id]);
            }
            if (targetLayerId && targetLayerId !== activeLayerId) {
                setActiveLayerId(targetLayerId);
            }
        },
        [activeLayerId, setDesign, setSelectedIds],
    );

    const updateElement = useCallback(
        (id: string, attributes: Partial<EditorElement>) => {
            updateElements((current) =>
                current.map((element) => (element.id === id ? ({ ...element, ...attributes } as EditorElement) : element)),
            );
        },
        [updateElements],
    );

    const removeSelected = useCallback(() => {
        if (selectedIds.length === 0) return;
        updateElements((current) => current.filter((element) => !selectedIds.includes(element.id)));
        setSelectedIds([]);
    }, [selectedIds, updateElements]);

    const handleAddRect = useCallback(() => {
        addElement(createRect(options));
    }, [addElement, options]);

    const handleAddCircle = useCallback(() => {
        addElement(createCircle(options));
    }, [addElement, options]);

    const handleAddEllipse = useCallback(() => {
        addElement(createEllipse(options));
    }, [addElement, options]);

    const handleAddTriangle = useCallback(() => {
        addElement(createTriangle(options));
    }, [addElement, options]);

    const handleAddLine = useCallback(() => {
        addElement(createLine(options));
    }, [addElement, options]);

    const handleAddPath = useCallback(() => {
        setActiveTool('path');
    }, []);

    const handleAddDraw = useCallback(() => {
        setActiveTool('draw');
    }, []);

    const handleAddText = useCallback(() => {
        addElement(createText(options));
    }, [addElement, options]);

    const handleAddGuide = useCallback(
        (orientation: GuideElement['orientation']) => {
            addElement(createGuide(options, orientation));
        },
        [addElement, options],
    );

    const handleAddFrame = useCallback(
        (frame: FrameElement) => {
            const clone = cloneElement(frame) as FrameElement;
            clone.x = frame.x;
            clone.y = frame.y;
            addElement(clone);
        },
        [addElement],
    );

    const handleApplyTemplate = useCallback(
        (template: TemplateDefinition) => {
            const result = template.apply();
            resetDesign(cloneDocument(result.design));
            setSelectedIds([]);
            if (result.options) {
                setOptions((current) => ({ ...current, ...result.options }));
            }
        },
        [resetDesign],
    );

    const handleAddImage = useCallback(
        (src: string, overrides?: Partial<ImageElement>) => {
            if (!src) return;
            const trimmed = src.trim();
            if (!trimmed) return;
            addElement(createImage(options, trimmed, overrides));
        },
        [addElement, options],
    );

    const handleRequestImage = useCallback(() => {
        if (window.ReactNativeWebView) {
            postMessage('requestImage', { options });
            return;
        }
        fileInputRef.current?.click();
    }, [options, postMessage]);

    const handleUploadFile = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : null;
            if (result) {
                handleAddImage(result);
            }
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    }, [handleAddImage]);

    const handleCopy = useCallback(() => {
        if (selectedIds.length === 0) return;
        const selected = elements.filter((element) => selectedIds.includes(element.id)).map((element) => cloneElement(element));
        setClipboard(selected);
    }, [elements, selectedIds]);

    const handlePaste = useCallback(() => {
        if (!clipboard || clipboard.length === 0) return;
        const clones = clipboard.map((element) => cloneElement(element));
        updateElements((current) => [...current, ...clones]);
        setSelectedIds(clones.map((element) => element.id));
    }, [clipboard, updateElements]);

    const handleDuplicate = useCallback(() => {
        if (selectedIds.length === 0) return;
        const clones = elements
            .filter((element) => selectedIds.includes(element.id))
            .map((element) => cloneElement(element));
        updateElements((current) => [...current, ...clones]);
        setSelectedIds(clones.map((element) => element.id));
    }, [elements, selectedIds, updateElements]);

    const handleClear = useCallback(() => {
        updateElements(() => []);
        setSelectedIds([]);
    }, [updateElements]);

    const handleAddLayer = useCallback(() => {
        const name = getNextLayerName(layers);
        const newLayer = createLayerDefinition(name);
        updateLayers((current) => [...current, newLayer]);
        setActiveLayerId(newLayer.id);
    }, [layers, updateLayers]);

    const handleRemoveLayer = useCallback(
        (layerId: string) => {
            if (layers.length <= 1) {
                return;
            }

            const removedIds = new Set(
                elements.filter((element) => element.layerId === layerId).map((element) => element.id),
            );
            setDesign((current) => {
                if (current.layers.length <= 1) {
                    return current;
                }
                const filteredLayers = current.layers.filter((layer) => layer.id !== layerId);
                const nextLayers = filteredLayers.length > 0 ? filteredLayers : [createLayerDefinition('Layer 1')];
                const filteredElements = current.elements.filter((element) => element.layerId !== layerId);
                return {
                    ...current,
                    layers: nextLayers,
                    elements: orderElementsByLayer(filteredElements, nextLayers),
                };
            });
            if (removedIds.size > 0) {
                setSelectedIds((current) => current.filter((id) => !removedIds.has(id)));
            }
            if (activeLayerId === layerId) {
                const remaining = layers.filter((layer) => layer.id !== layerId);
                setActiveLayerId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
            }
        },
        [activeLayerId, elements, layers, setDesign, setSelectedIds],
    );

    const handleSelectLayer = useCallback((layerId: string) => {
        setActiveLayerId(layerId);
    }, []);

    const handleLayerMove = useCallback(
        (layerId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
            setDesign((current) => {
                const index = current.layers.findIndex((layer) => layer.id === layerId);
                if (index === -1) {
                    return current;
                }
                const nextLayers = [...current.layers];
                let nextIndex = index;
                switch (direction) {
                    case 'up':
                        if (index < nextLayers.length - 1) {
                            [nextLayers[index], nextLayers[index + 1]] = [nextLayers[index + 1], nextLayers[index]];
                            nextIndex = index + 1;
                        }
                        break;
                    case 'down':
                        if (index > 0) {
                            [nextLayers[index], nextLayers[index - 1]] = [nextLayers[index - 1], nextLayers[index]];
                            nextIndex = index - 1;
                        }
                        break;
                    case 'top':
                        if (index < nextLayers.length - 1) {
                            const [layer] = nextLayers.splice(index, 1);
                            nextLayers.push(layer);
                            nextIndex = nextLayers.length - 1;
                        }
                        break;
                    case 'bottom':
                        if (index > 0) {
                            const [layer] = nextLayers.splice(index, 1);
                            nextLayers.unshift(layer);
                            nextIndex = 0;
                        }
                        break;
                    default:
                        break;
                }
                if (nextIndex === index) {
                    return current;
                }
                const ordered = orderElementsByLayer(current.elements, nextLayers);
                return { ...current, layers: nextLayers, elements: ordered };
            });
        },
        [setDesign],
    );

    const handleToggleVisibility = useCallback(
        (layerId: string) => {
            const layer = layers.find((item) => item.id === layerId);
            if (!layer) return;
            const nextVisible = !layer.visible;
            setDesign((current) => {
                const index = current.layers.findIndex((item) => item.id === layerId);
                if (index === -1) {
                    return current;
                }
                const nextLayers = [...current.layers];
                nextLayers[index] = { ...nextLayers[index], visible: nextVisible };
                const nextElements = current.elements.map((element) =>
                    element.layerId === layerId ? { ...element, visible: nextVisible } : element,
                );
                return {
                    ...current,
                    layers: nextLayers,
                    elements: orderElementsByLayer(nextElements, nextLayers),
                };
            });
            if (!nextVisible) {
                const idsToRemove = new Set(
                    elements.filter((element) => element.layerId === layerId).map((element) => element.id),
                );
                if (idsToRemove.size > 0) {
                    setSelectedIds((current) => current.filter((id) => !idsToRemove.has(id)));
                }
            }
        },
        [elements, layers, setDesign, setSelectedIds],
    );

    const handleToggleLock = useCallback(
        (layerId: string) => {
            const layer = layers.find((item) => item.id === layerId);
            if (!layer) return;
            const nextLocked = !layer.locked;
            setDesign((current) => {
                const index = current.layers.findIndex((item) => item.id === layerId);
                if (index === -1) {
                    return current;
                }
                const nextLayers = [...current.layers];
                nextLayers[index] = { ...nextLayers[index], locked: nextLocked };
                const nextElements = current.elements.map((element) =>
                    element.layerId === layerId ? { ...element, locked: nextLocked } : element,
                );
                return {
                    ...current,
                    layers: nextLayers,
                    elements: orderElementsByLayer(nextElements, nextLayers),
                };
            });
            if (nextLocked) {
                const idsToRemove = new Set(
                    elements.filter((element) => element.layerId === layerId).map((element) => element.id),
                );
                if (idsToRemove.size > 0) {
                    setSelectedIds((current) => current.filter((id) => !idsToRemove.has(id)));
                }
            }
        },
        [elements, layers, setDesign, setSelectedIds],
    );

    const handleSelectElement = useCallback(
        (id: string) => {
            const element = elements.find((item) => item.id === id) ?? null;
            if (element?.layerId) {
                setActiveLayerId(element.layerId);
            }
            setSelectedIds([id]);
            setActiveTool('select');
        },
        [elements, setActiveTool, setActiveLayerId, setSelectedIds],
    );

    const handleStagePointerDown = useCallback(
        (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
            const stage = event.target.getStage();
            if (!stage) return;
            const pointer = getStagePointer(stage);
            if (!pointer) return;

            if (activeTool === 'draw' || activeTool === 'path') {
                const type = activeTool === 'draw' ? 'pencil' : 'path';
                const element: PencilElement | PathElement =
                    type === 'pencil'
                        ? {
                            ...createBaseElement('pencil', {
                                name: 'Free draw',
                                x: pointer.x,
                                y: pointer.y,
                                rotation: 0,
                                opacity: 1,
                                metadata: null,
                            }),
                            type: 'pencil',
                            points: [0, 0],
                            stroke: drawSettings.color,
                            strokeWidth: drawSettings.width,
                            lineCap: 'round',
                            lineJoin: 'round',
                        }
                        : {
                            ...createBaseElement('path', {
                                name: 'Path',
                                x: pointer.x,
                                y: pointer.y,
                                rotation: 0,
                                opacity: 1,
                                metadata: null,
                            }),
                            type: 'path',
                            points: [0, 0],
                            stroke: pathSettings.color,
                            strokeWidth: pathSettings.width,
                            tension: 0,
                            closed: false,
                        };
                addElement(element);
                setDrawingState({ id: element.id, type, origin: { x: pointer.x, y: pointer.y } });
                return;
            }

            if (event.target === stage) {
                setSelectedIds([]);
                setActiveTool('select');
            }
        },
        [activeTool, addElement, drawSettings, pathSettings],
    );

    const handleStagePointerMove = useCallback(
        (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
            if (!drawingState) return;
            const stage = event.target.getStage();
            if (!stage) return;
            const pointer = getStagePointer(stage);
            if (!pointer) return;

            updateElements((current) =>
                current.map((element) => {
                    if (element.id !== drawingState.id) {
                        return element;
                    }
                    const dx = pointer.x - drawingState.origin.x;
                    const dy = pointer.y - drawingState.origin.y;
                    if (drawingState.type === 'pencil') {
                        const pencil = element as PencilElement;
                        return { ...pencil, points: [...pencil.points, dx, dy] };
                    }
                    const path = element as PathElement;
                    return { ...path, points: [...path.points, dx, dy] };
                }),
            );
        },
        [drawingState, updateElements],
    );

    const handleStagePointerUp = useCallback(() => {
        if (!drawingState) return;
        setDrawingState(null);
    }, [drawingState]);

    const handleSave = useCallback(() => {
        postMessage('save', { json: stringifyDesign(design) });
        try {
            window.localStorage.setItem(STORAGE_KEY, stringifyDesign(design));
        } catch (error) {
            console.warn('Unable to save design locally', error);
        }
    }, [design, postMessage]);

    const handleExport = useCallback(
        (format: 'png' | 'jpeg' | 'json' | 'svg') => {
            if (format === 'json') {
                postMessage('export', { format: 'json', json: stringifyDesign(design) });
                return;
            }
            const stage = stageRef.current;
            if (!stage) return;
            if (format === 'svg') {
                const svg = stage.toSVG();
                postMessage('export', { format: 'svg', svg });
                return;
            }
            const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
            const dataUrl = stage.toDataURL({ mimeType, quality: format === 'jpeg' ? 0.92 : undefined });
            postMessage('export', { format, dataUrl });
        },
        [design, postMessage],
    );

    const handleLoadFromBrowser = useCallback(() => {
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (!stored) return;
            const parsed = parseDesign(stored);
            if (parsed) {
                resetDesign(parsed);
                setSelectedIds([]);
            }
        } catch (error) {
            console.warn('Unable to load design from local storage', error);
        }
    }, [resetDesign]);

    const applyZoom = useCallback(
        (value: number | ((current: number) => number), anchor?: { clientX: number; clientY: number } | null) => {
            const stage = stageRef.current;
            const container = typeof stage?.container === 'function' ? stage.container() : null;
            const scrollParent = editorCanvasRef.current;
            let previousZoom: number | null = null;
            let nextZoom: number | null = null;

            setOptions((current) => {
                const resolved = typeof value === 'function' ? value(current.zoom) : value;
                const clamped = clampZoom(resolved);
                if (clamped === current.zoom) {
                    previousZoom = null;
                    nextZoom = null;
                    return current;
                }
                previousZoom = current.zoom;
                nextZoom = clamped;
                return { ...current, zoom: clamped };
            });

            if (
                anchor &&
                previousZoom !== null &&
                nextZoom !== null &&
                container &&
                scrollParent &&
                typeof scrollParent.scrollBy === 'function'
            ) {
                const bounds = container.getBoundingClientRect();
                const offsetX = anchor.clientX - bounds.left;
                const offsetY = anchor.clientY - bounds.top;
                const ratio = nextZoom / previousZoom;
                scrollParent.scrollBy(offsetX * (ratio - 1), offsetY * (ratio - 1));
            }
        },
        [setOptions],
    );

    const handleZoomChange = useCallback(
        (value: number) => {
            applyZoom(value);
        },
        [applyZoom],
    );

    const handleZoomOut = useCallback(() => {
        applyZoom((current) => current - ZOOM_STEP);
    }, [applyZoom]);

    const handleZoomIn = useCallback(() => {
        applyZoom((current) => current + ZOOM_STEP);
    }, [applyZoom]);

    useEffect(() => {
        postMessage('ready', { options });
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!initialDesign && stored) {
            const parsed = parseDesign(stored);
            if (parsed) {
                resetDesign(parsed);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handle = window.setTimeout(() => {
            postMessage('change', { json: stringifyDesign(design) });
        }, 250);
        return () => window.clearTimeout(handle);
    }, [design, postMessage]);

    useEffect(() => {
        postMessage('options', { options });
    }, [options, postMessage]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.target && (event.target as HTMLElement).tagName === 'INPUT') return;
            if (event.target && (event.target as HTMLElement).tagName === 'TEXTAREA') return;

            if ((event.ctrlKey || event.metaKey) && (event.key === '=' || event.key === '+' || event.key === 'Add')) {
                event.preventDefault();
                handleZoomIn();
                return;
            }

            if ((event.ctrlKey || event.metaKey) && (event.key === '-' || event.key === '_' || event.key === 'Subtract')) {
                event.preventDefault();
                handleZoomOut();
                return;
            }

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
                event.preventDefault();
                if (event.shiftKey) {
                    redo();
                } else {
                    undo();
                }
                return;
            }

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
                event.preventDefault();
                redo();
                return;
            }

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
                event.preventDefault();
                handleCopy();
                return;
            }

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
                event.preventDefault();
                handlePaste();
                return;
            }

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
                event.preventDefault();
                handleDuplicate();
                return;
            }

            if (event.key === 'Delete' || event.key === 'Backspace') {
                if (selectedIds.length > 0) {
                    event.preventDefault();
                    removeSelected();
                }
            }

            if (event.key === 'Escape') {
                setSelectedIds([]);
                setActiveTool('select');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleCopy, handleDuplicate, handlePaste, handleZoomIn, handleZoomOut, redo, removeSelected, selectedIds.length, undo]);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage || typeof stage.container !== 'function') {
            return;
        }
        const container = stage.container();
        if (!container) {
            return;
        }

        const handleWheel = (event: WheelEvent) => {
            if (!(event.ctrlKey || event.metaKey)) {
                return;
            }
            event.preventDefault();
            const delta = event.deltaY === 0 ? 0 : event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            if (delta === 0) {
                return;
            }
            applyZoom((current) => current + delta, { clientX: event.clientX, clientY: event.clientY });
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [applyZoom]);

    useEffect(() => {
        const listener = (event: MessageEvent) => {
            const message = parseBridgeMessage(event.data);
            if (!message) return;

            switch (message.type) {
                case 'setDesign':
                case 'loadDesign': {
                    const designValue = message.payload?.json ?? message.payload ?? null;
                    const parsed = parseDesign(designValue);
                    if (parsed) {
                        resetDesign(parsed);
                        setSelectedIds([]);
                    }
                    break;
                }
                case 'setOptions': {
                    const incoming = message.payload?.options ?? message.payload ?? {};
                    setOptions((current) => ({ ...current, ...incoming }));
                    break;
                }
                case 'addImage': {
                    const payload = message.payload ?? {};
                    const source =
                        typeof payload === 'string'
                            ? payload
                            : typeof payload?.src === 'string'
                                ? payload.src
                                : typeof payload?.url === 'string'
                                    ? payload.url
                                    : null;
                    if (source) {
                        const overrides: Partial<ImageElement> =
                            typeof payload === 'object' && payload !== null
                                ? {
                                    width: typeof payload.width === 'number' ? payload.width : undefined,
                                    height: typeof payload.height === 'number' ? payload.height : undefined,
                                    x: typeof payload.x === 'number' ? payload.x : undefined,
                                    y: typeof payload.y === 'number' ? payload.y : undefined,
                                    rotation: typeof payload.rotation === 'number' ? payload.rotation : undefined,
                                    opacity: typeof payload.opacity === 'number' ? payload.opacity : undefined,
                                    name: typeof payload.name === 'string' ? payload.name : undefined,
                                    draggable: typeof payload.draggable === 'boolean' ? payload.draggable : undefined,
                                }
                                : {};
                        handleAddImage(source, overrides);
                    }
                    break;
                }
                case 'undo':
                    undo();
                    break;
                case 'redo':
                    redo();
                    break;
                case 'clear':
                    handleClear();
                    break;
                case 'requestExport': {
                    const format = (message.payload?.format as 'png' | 'jpeg' | 'json' | 'svg') ?? 'png';
                    handleExport(format);
                    break;
                }
                case 'requestJSON':
                case 'requestCanvasJSON': {
                    postMessage('change', { json: stringifyDesign(design) });
                    break;
                }
                default:
                    break;
            }
        };

        window.addEventListener('message', listener);
        const globalDocument = typeof document !== 'undefined' ? document : null;
        if (globalDocument && typeof globalDocument.addEventListener === 'function') {
            globalDocument.addEventListener('message', listener as any);
        }
        return () => {
            window.removeEventListener('message', listener);
            if (globalDocument && typeof globalDocument.removeEventListener === 'function') {
                globalDocument.removeEventListener('message', listener as any);
            }
        };
    }, [design, handleAddImage, handleClear, handleExport, postMessage, redo, resetDesign, undo]);

    const stageWidth = Math.round(options.width);
    const stageHeight = Math.round(options.height);
    const rulerStep = Math.max(1, 32 * options.zoom);
    const gridBackground = useMemo(() => {
        if (!options.showGrid) {
            return {
                backgroundColor: options.backgroundColor,
            } as const;
        }
        const scaledGrid = Math.max(1, options.gridSize * options.zoom);
        return {
            backgroundColor: options.backgroundColor,
            backgroundImage:
                'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: `${scaledGrid}px ${scaledGrid}px`,
        } as const;
    }, [options.backgroundColor, options.gridSize, options.showGrid, options.zoom]);
    const zoomPercentage = useMemo(() => Math.round(options.zoom * 100), [options.zoom]);

    return (
        <YStack className="editor-root">
            <YStack className="editor-shell">
                <YStack className="editor-header">
                    <XStack className="logo">
                        <Image
                            src="https://raw.githubusercontent.com/Everduin94/react-native-vector-icons/master/assets/images/TinyArtist.png"
                            alt="TinyArtist logo"
                            width="40"
                            height="40"
                        />
                        <Text>TinyArtist Editor</Text>
                    </XStack>
                </YStack>
                <Stack className="editor-shell-layout">
                    <YStack className="editor-toolbar">
                        <XStack className="toolbar-group">
                            <Button
                                type="button"
                                className={activeTool === 'select' ? 'active' : ''}
                                onPress={() => setActiveTool('select')}
                                aria-label="Select"
                                title="Select"
                            >
                                <MaterialCommunityIcons name="cursor-default" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button
                                type="button"
                                className={activeTool === 'draw' ? 'active' : ''}
                                onPress={handleAddDraw}
                                aria-label="Draw"
                                title="Draw"
                            >
                                <MaterialCommunityIcons name="pencil-outline" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button
                                type="button"
                                className={activeTool === 'path' ? 'active' : ''}
                                onPress={handleAddPath}
                                aria-label="Path"
                                title="Path"
                            >
                                <MaterialCommunityIcons name="vector-polyline" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                        </XStack>
                        <XStack className="toolbar-group">
                            <Button type="button" onPress={handleAddRect} aria-label="Add rectangle" title="Add rectangle">
                                <MaterialCommunityIcons name="rectangle-outline" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button type="button" onPress={handleAddCircle} aria-label="Add circle" title="Add circle">
                                <MaterialCommunityIcons name="circle-outline" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button type="button" onPress={handleAddEllipse} aria-label="Add ellipse" title="Add ellipse">
                                <MaterialCommunityIcons name="ellipse-outline" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button type="button" onPress={handleAddTriangle} aria-label="Add triangle" title="Add triangle">
                                <MaterialCommunityIcons name="triangle-outline" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button type="button" onPress={handleAddLine} aria-label="Add line" title="Add line">
                                <MaterialCommunityIcons name="ray-start-end" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button type="button" onPress={handleAddText} aria-label="Add text" title="Add text">
                                <MaterialCommunityIcons name="format-text" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button type="button" onPress={handleRequestImage} aria-label="Add image" title="Add image">
                                <MaterialCommunityIcons name="image-outline" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button
                                type="button"
                                onPress={() => handleAddGuide('horizontal')}
                                aria-label="Add horizontal guide"
                                title="Add horizontal guide"
                            >
                                <MaterialCommunityIcons name="arrow-collapse-horizontal" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button
                                type="button"
                                onPress={() => handleAddGuide('vertical')}
                                aria-label="Add vertical guide"
                                title="Add vertical guide"
                            >
                                <MaterialCommunityIcons name="arrow-collapse-vertical" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                        </XStack>
                        <XStack className="toolbar-group">
                            <Button type="button" onPress={undo} disabled={!canUndo} aria-label="Undo" title="Undo">
                                <MaterialCommunityIcons name="undo" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button type="button" onPress={redo} disabled={!canRedo} aria-label="Redo" title="Redo">
                                <MaterialCommunityIcons name="redo" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button
                                type="button"
                                onPress={handleCopy}
                                disabled={selectedIds.length === 0}
                                aria-label="Copy"
                                title="Copy"
                            >
                                <MaterialCommunityIcons name="content-copy" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button
                                type="button"
                                onPress={handlePaste}
                                disabled={!clipboard || clipboard.length === 0}
                                aria-label="Paste"
                                title="Paste"
                            >
                                <MaterialCommunityIcons name="content-paste" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button
                                type="button"
                                onPress={handleDuplicate}
                                disabled={selectedIds.length === 0}
                                aria-label="Duplicate"
                                title="Duplicate"
                            >
                                <MaterialCommunityIcons name="content-duplicate" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button
                                type="button"
                                onPress={removeSelected}
                                disabled={selectedIds.length === 0}
                                aria-label="Delete"
                                title="Delete"
                            >
                                <MaterialCommunityIcons name="trash-can-outline" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button type="button" onPress={handleClear} aria-label="Clear canvas" title="Clear canvas">
                                <MaterialCommunityIcons name="eraser-variant" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                        </XStack>
                        <XStack className="toolbar-group">
                            <Button type="button" onPress={handleSave} aria-label="Save" title="Save">
                                <MaterialCommunityIcons name="content-save-outline" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button type="button" onPress={handleLoadFromBrowser} aria-label="Load" title="Load">
                                <MaterialCommunityIcons name="folder-open-outline" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button type="button" onPress={() => handleExport('png')} aria-label="Export PNG" title="Export PNG">
                                <MaterialCommunityIcons name="file-image" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button type="button" onPress={() => handleExport('jpeg')} aria-label="Export JPEG" title="Export JPEG">
                                <MaterialCommunityIcons name="file-jpg-box" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button type="button" onPress={() => handleExport('svg')} aria-label="Export SVG" title="Export SVG">
                                <MaterialCommunityIcons name="svg" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button type="button" onPress={() => handleExport('json')} aria-label="Export JSON" title="Export JSON">
                                <MaterialCommunityIcons name="code-json" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                        </XStack>
                    </YStack>

                    <Stack tag="aside" className="editor-sidebar">
                        <Heading tag="h2">Canvas</Heading>
                        <XStack className="canvas-stats">
                            <Text>
                                {options.width} × {options.height} px
                            </Text>
                            <Text>{layers.length} layers</Text>
                        </XStack>
                        <Separator marginVertical="$2" opacity={0.35} />
                        <YStack className="properties-grid">
                            <Label>
                                Width
                                <Input
                                    type="number"
                                    min={100}
                                    value={Math.round(options.width)}
                                    onChange={(event) =>
                                        setOptions((current) => {
                                            const value = Number(event.target.value);
                                            return { ...current, width: Number.isFinite(value) ? Math.max(100, value) : current.width };
                                        })
                                    }
                                    disabled={options.canvasSizeLocked || !options.fixedCanvas}
                                />
                            </Label>
                            <Label>
                                Height
                                <Input
                                    type="number"
                                    min={100}
                                    value={Math.round(options.height)}
                                    onChange={(event) =>
                                        setOptions((current) => {
                                            const value = Number(event.target.value);
                                            return { ...current, height: Number.isFinite(value) ? Math.max(100, value) : current.height };
                                        })
                                    }
                                    disabled={options.canvasSizeLocked || !options.fixedCanvas}
                                />
                            </Label>
                            <Label className="full-width">
                                Background
                                <Input
                                    type="color"
                                    value={options.backgroundColor}
                                    onChange={(event) => setOptions((current) => ({ ...current, backgroundColor: event.target.value }))}
                                />
                            </Label>
                            <Label>
                                Show grid
                                <Input
                                    type="checkbox"
                                    checked={options.showGrid}
                                    onChange={(event) => setOptions((current) => ({ ...current, showGrid: event.target.checked }))}
                                />
                            </Label>
                            <Label>
                                Grid size
                                <Input
                                    type="number"
                                    min={4}
                                    value={options.gridSize}
                                    onChange={(event) =>
                                        setOptions((current) => {
                                            const value = Number(event.target.value);
                                            return { ...current, gridSize: Number.isFinite(value) ? Math.max(4, value) : current.gridSize };
                                        })
                                    }
                                />
                            </Label>
                            <Label>
                                Snap to grid
                                <Input
                                    type="checkbox"
                                    checked={options.snapToGrid}
                                    onChange={(event) => setOptions((current) => ({ ...current, snapToGrid: event.target.checked }))}
                                />
                            </Label>
                            <Label>
                                Snap to guides
                                <Input
                                    type="checkbox"
                                    checked={options.snapToGuides}
                                    onChange={(event) => setOptions((current) => ({ ...current, snapToGuides: event.target.checked }))}
                                />
                            </Label>
                            <Label>
                                Show guides
                                <Input
                                    type="checkbox"
                                    checked={options.showGuides}
                                    onChange={(event) => setOptions((current) => ({ ...current, showGuides: event.target.checked }))}
                                />
                            </Label>
                            <Label>
                                Show rulers
                                <Input
                                    type="checkbox"
                                    checked={options.showRulers}
                                    onChange={(event) => setOptions((current) => ({ ...current, showRulers: event.target.checked }))}
                                />
                            </Label>
                            <Label className="full-width">
                                Zoom
                                <XStack className="zoom-control">
                                    <Button type="button" onPress={handleZoomOut} aria-label="Zoom out" title="Zoom out">
                                        <MaterialCommunityIcons name="minus" size={TOOLBAR_ICON_SIZE - 6} />
                                    </Button>
                                    <Input
                                        type="range"
                                        min={ZOOM_MIN}
                                        max={ZOOM_MAX}
                                        step={ZOOM_STEP}
                                        value={options.zoom}
                                        onChange={(event) => handleZoomChange(Number(event.target.value))}
                                        aria-label="Zoom level"
                                        className="zoom-slider"
                                    />
                                    <Text className="zoom-value" aria-live="polite">
                                        {zoomPercentage}%
                                    </Text>
                                    <Button type="button" onPress={handleZoomIn} aria-label="Zoom in" title="Zoom in">
                                        <MaterialCommunityIcons name="plus" size={TOOLBAR_ICON_SIZE - 6} />
                                    </Button>
                                </XStack>
                            </Label>
                        </YStack>

                        <Heading tag="h2">Draw tools</Heading>
                        <YStack className="properties-grid">
                            <Label>
                                Draw colour
                                <Input
                                    type="color"
                                    value={drawSettings.color}
                                    onChange={(event) => setDrawSettings((current) => ({ ...current, color: event.target.value }))}
                                />
                            </Label>
                            <Label>
                                Draw width
                                <Input
                                    type="number"
                                    min={1}
                                    value={drawSettings.width}
                                    onChange={(event) => {
                                        const value = Number(event.target.value);
                                        setDrawSettings((current) => ({ ...current, width: Number.isFinite(value) ? Math.max(1, value) : current.width }));
                                    }}
                                />
                            </Label>
                            <Label>
                                Path colour
                                <Input
                                    type="color"
                                    value={pathSettings.color}
                                    onChange={(event) => setPathSettings((current) => ({ ...current, color: event.target.value }))}
                                />
                            </Label>
                            <Label>
                                Path width
                                <Input
                                    type="number"
                                    min={1}
                                    value={pathSettings.width}
                                    onChange={(event) => {
                                        const value = Number(event.target.value);
                                        setPathSettings((current) => ({ ...current, width: Number.isFinite(value) ? Math.max(1, value) : current.width }));
                                    }}
                                />
                            </Label>
                        </YStack>

                        <Heading tag="h2">Layers</Heading>
                        <LayersPanel
                            layers={layers}
                            elements={contentElements}
                            activeLayerId={activeLayerId}
                            selectedElementIds={selectedIds}
                            onSelectLayer={handleSelectLayer}
                            onToggleVisibility={handleToggleVisibility}
                            onToggleLock={handleToggleLock}
                            onRemoveLayer={handleRemoveLayer}
                            onMoveLayer={handleLayerMove}
                            onAddLayer={handleAddLayer}
                        />

                        <Heading tag="h2">Selection</Heading>
                        {selectedElement ? (
                            <PropertiesPanel
                                element={selectedElement}
                                onChange={(attributes) => updateElement(selectedElement.id, attributes)}
                                onRemove={removeSelected}
                            />
                        ) : (
                            <Paragraph className="empty-selection">Select an element to edit its properties.</Paragraph>
                        )}
                    </Stack>

                    <YStack className="editor-layout">
                        <YStack ref={editorCanvasRef} className="editor-canvas">
                            <Stack className={`stage-wrapper ${options.showRulers ? 'with-rulers' : ''}`} style={{ width: stageWidth, height: stageHeight }}>
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
                                <Stack className="stage-canvas" style={{ width: stageWidth, height: stageHeight, ...gridBackground }}>
                                    <Stage
                                        ref={stageRef}
                                        width={stageWidth}
                                        height={stageHeight}
                                        scaleX={options.zoom}
                                        scaleY={options.zoom}
                                        onMouseDown={handleStagePointerDown}
                                        onTouchStart={handleStagePointerDown}
                                        onMouseMove={handleStagePointerMove}
                                        onTouchMove={handleStagePointerMove}
                                        onMouseUp={handleStagePointerUp}
                                        onTouchEnd={handleStagePointerUp}
                                    >
                                        <Layer>
                                            {options.showGuides &&
                                                guides.map((guide, guideIndex) => (
                                                    <GuideNode
                                                        key={guide.id}
                                                        shape={guide}
                                                        isSelected={selectedIds.includes(guide.id)}
                                                        selectionEnabled={activeTool === 'select'}
                                                        onSelect={() => handleSelectElement(guide.id)}
                                                        onChange={(attributes) => updateElement(guide.id, attributes)}
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
                                                                onSelect={() => handleSelectElement(element.id)}
                                                                onChange={(attributes) => updateElement(element.id, attributes)}
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
                                                                onSelect={() => handleSelectElement(element.id)}
                                                                onChange={(attributes) => updateElement(element.id, attributes)}
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
                                                                onSelect={() => handleSelectElement(element.id)}
                                                                onChange={(attributes) => updateElement(element.id, attributes)}
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
                                                                onSelect={() => handleSelectElement(element.id)}
                                                                onChange={(attributes) => updateElement(element.id, attributes)}
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
                                                                onSelect={() => handleSelectElement(element.id)}
                                                                onChange={(attributes) => updateElement(element.id, attributes)}
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
                                                                onSelect={() => handleSelectElement(element.id)}
                                                                onChange={(attributes) => updateElement(element.id, attributes)}
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
                                                                onSelect={() => handleSelectElement(element.id)}
                                                                onChange={(attributes) => updateElement(element.id, attributes)}
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
                                                                onSelect={() => handleSelectElement(element.id)}
                                                                onChange={(attributes) => updateElement(element.id, attributes)}
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
                                                                onSelect={() => handleSelectElement(element.id)}
                                                                onChange={(attributes) => updateElement(element.id, attributes)}
                                                                dragBoundFunc={dragBound}
                                                                zIndex={zIndex}
                                                            />
                                                        );
                                                    case 'image':
                                                        return (
                                                            <ImageNode
                                                                key={element.id}
                                                                shape={element}
                                                                isSelected={isSelected}
                                                                selectionEnabled={selectionEnabled}
                                                                onSelect={() => handleSelectElement(element.id)}
                                                                onChange={(attributes) => updateElement(element.id, attributes)}
                                                                dragBoundFunc={dragBound}
                                                                zIndex={zIndex}
                                                            />
                                                        );
                                                    default:
                                                        return null;
                                                }
                                            })}
                                        </Layer>
                                    </Stage>
                                </Stack>
                            </Stack>
                        </YStack>
                    </YStack>
                </Stack>

                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleUploadFile}
                />
            </YStack>
        </YStack>
    );
}

