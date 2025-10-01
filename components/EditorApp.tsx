import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type CSSProperties,
} from 'react';
import { Layer, Rect as RectShape, Stage } from 'react-konva';
import { Button, Heading, Image, Input, Label, Separator, Slider, Stack, Text, XStack, YStack, ZStack, useWindowDimensions, Theme, Popover, Paragraph, Switch } from 'tamagui';
import { MaterialCommunityIcons } from './icons/MaterialCommunityIcons';
// import { CiZoomIn } from "react-icons/ci";
import type { KonvaEventObject, StageType, Vector2d } from '../types/konva';
import LayersPanel from './LayersPanel';
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
    PencilElement,
    RectElement,
    TextElement,
} from '../types/editor';
import {
    assignElementsToLayer,
    cloneElement,
    createBaseElement,
    createCircle,
    createFrame,
    createImage,
    createLayerDefinition,
    createRect,
    createText,
    getNextLayerName,
    orderElementsByLayer,
} from '../utils/editorElements';
import { createEmptyDesign, parseDesign, stringifyDesign } from '../utils/design';

import {
    SidebarContainer,
    SidebarPanel,
    SidebarScroll,
    SidebarToggle,
    SidebarToggleLabel,
    SidebarContent,
} from '../../../../theme/ui/styles'

type Tool = 'select' | 'draw';

type DrawingState = {
    id: string;
    origin: { x: number; y: number };
};

type TemplateDefinition = {
    id: string;
    name: string;
    description: string;
    apply: () => { design: EditorDocument; options?: Partial<EditorOptions> };
};

type DragBoundFactory = (element: EditorElement) => ((position: Vector2d) => Vector2d) | undefined;

const SNAP_THRESHOLD = 12;
const STORAGE_KEY = 'konva-image-editor-design';

const DEFAULT_DRAW = { color: '#2563eb', width: 5 };
const TOOLBAR_ICON_SIZE = 12;
const MAX_ZOOM = 8;
const DOUBLE_TAP_ZOOM = 2;
const WHEEL_ZOOM_SENSITIVITY = 0.0015;
const PAN_INERTIA_FRICTION = 0.9;
const PAN_MIN_VELOCITY = 0.01;
const WORKSPACE_COLOR = '#2b2b2b';
const MIN_ZOOM_FALLBACK = 0.05;
const KEYBOARD_ZOOM_FACTOR = 1.1;
const ZOOM_PERCENT_MIN = -100;
const ZOOM_PERCENT_MAX = 100;
const ZOOM_EXP_BASE = 2;
const MIN_SELECTION_SIZE = 2;

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

interface ElementBounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
    centerX: number;
    centerY: number;
}

interface SelectionRect {
    x: number;
    y: number;
    width: number;
    height: number;
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
        case 'line':
        case 'path':
        case 'pencil': {
            const { points } = element;
            if (!points || points.length < 2) {
                return {
                    left: position.x,
                    right: position.x,
                    top: position.y,
                    bottom: position.y,
                    centerX: position.x,
                    centerY: position.y,
                };
            }
            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;
            for (let index = 0; index < points.length; index += 2) {
                const px = points[index] ?? 0;
                const py = points[index + 1] ?? 0;
                if (px < minX) minX = px;
                if (px > maxX) maxX = px;
                if (py < minY) minY = py;
                if (py > maxY) maxY = py;
            }
            if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) {
                return null;
            }
            return {
                left: position.x + minX,
                right: position.x + maxX,
                top: position.y + minY,
                bottom: position.y + maxY,
                centerX: position.x + (minX + maxX) / 2,
                centerY: position.y + (minY + maxY) / 2,
            };
        }
        default:
            return null;
    }
}

function normalizeSelectionRect(start: Vector2d, end: Vector2d): SelectionRect {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    return {
        x,
        y,
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
    };
}

type RasterizedLayerMetadata = {
    kind: 'rasterized-layer';
    layerId: string;
    sourceElements: EditorElement[];
    bounds: { left: number; top: number; width: number; height: number };
};

type RasterBounds = {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
};

const RASTERIZABLE_TYPES: Set<EditorElement['type']> = new Set([
    'rect',
    'frame',
    'circle',
    'ellipse',
    'triangle',
    'line',
    'path',
    'pencil',
    'image',
]);

function isRasterizedLayer(element: EditorElement): element is ImageElement & { metadata: RasterizedLayerMetadata } {
    if (element.type !== 'image') {
        return false;
    }
    const metadata = element.metadata as RasterizedLayerMetadata | null;
    return Boolean(metadata && metadata.kind === 'rasterized-layer' && metadata.layerId);
}

function cloneElementForRaster(element: EditorElement): EditorElement {
    const clone = JSON.parse(JSON.stringify(element)) as EditorElement;
    if (clone.type === 'image' && clone.metadata) {
        const meta = clone.metadata as { kind?: string };
        if (meta.kind === 'rasterized-layer') {
            clone.metadata = null;
        }
    }
    return clone;
}

function calculateCombinedBounds(elements: EditorElement[]): RasterBounds | null {
    let aggregate: RasterBounds | null = null;
    elements.forEach((element) => {
        if (!element.visible) return;
        const bounds = getElementBounds(element, { x: element.x, y: element.y });
        if (!bounds) return;
        if (!aggregate) {
            aggregate = {
                left: bounds.left,
                right: bounds.right,
                top: bounds.top,
                bottom: bounds.bottom,
                width: bounds.right - bounds.left,
                height: bounds.bottom - bounds.top,
            } satisfies RasterBounds;
            return;
        }
        aggregate.left = Math.min(aggregate.left, bounds.left);
        aggregate.right = Math.max(aggregate.right, bounds.right);
        aggregate.top = Math.min(aggregate.top, bounds.top);
        aggregate.bottom = Math.max(aggregate.bottom, bounds.bottom);
        aggregate.width = aggregate.right - aggregate.left;
        aggregate.height = aggregate.bottom - aggregate.top;
    });
    if (!aggregate) {
        return null;
    }
    const width = Math.max(1, aggregate.width);
    const height = Math.max(1, aggregate.height);
    return { ...aggregate, width, height } satisfies RasterBounds;
}

function encodeSvgData(svg: string): string {
    const normalized = svg.replace(/\s+/g, ' ').trim();
    if (typeof btoa === 'function') {
        const utf8 = encodeURIComponent(normalized).replace(/%([0-9A-F]{2})/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16)),
        );
        return btoa(utf8);
    }
    const bufferCtor = typeof globalThis !== 'undefined' ? (globalThis as any).Buffer : undefined;
    if (bufferCtor) {
        return bufferCtor.from(normalized, 'utf-8').toString('base64');
    }
    throw new Error('Unable to encode SVG data for rasterized layer');
}

function escapeSvgAttr(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function serializeLinePoints(points: number[], offsetX: number, offsetY: number): string {
    const pairs: string[] = [];
    for (let index = 0; index < points.length; index += 2) {
        const x = points[index] ?? 0;
        const y = points[index + 1] ?? 0;
        pairs.push(`${offsetX + x},${offsetY + y}`);
    }
    return pairs.join(' ');
}

function serializeElementToSvg(element: EditorElement, offsetX: number, offsetY: number): string | null {
    if (!element.visible) {
        return null;
    }
    const bounds = getElementBounds(element, { x: element.x, y: element.y });
    if (!bounds) {
        return null;
    }
    const originX = bounds.centerX - offsetX;
    const originY = bounds.centerY - offsetY;
    const rotation = element.rotation ?? 0;
    const groupStart = rotation
        ? `<g transform="rotate(${rotation} ${originX} ${originY})" opacity="${element.opacity}">`
        : `<g opacity="${element.opacity}">`;
    const groupEnd = '</g>';

    switch (element.type) {
        case 'rect':
        case 'frame': {
            const rect = element;
            const x = rect.x - offsetX;
            const y = rect.y - offsetY;
            const corner = rect.cornerRadius ?? 0;
            return (
                groupStart +
                `<rect x="${x}" y="${y}" width="${rect.width}" height="${rect.height}" rx="${corner}" ry="${corner}" fill="${rect.fill}" stroke="${rect.stroke}" stroke-width="${rect.strokeWidth}" />` +
                groupEnd
            );
        }
        case 'circle': {
            const circle = element;
            const cx = circle.x - offsetX;
            const cy = circle.y - offsetY;
            return (
                groupStart +
                `<circle cx="${cx}" cy="${cy}" r="${circle.radius}" fill="${circle.fill}" stroke="${circle.stroke}" stroke-width="${circle.strokeWidth}" />` +
                groupEnd
            );
        }
        case 'ellipse': {
            const ellipse = element;
            const cx = ellipse.x - offsetX;
            const cy = ellipse.y - offsetY;
            return (
                groupStart +
                `<ellipse cx="${cx}" cy="${cy}" rx="${ellipse.radiusX}" ry="${ellipse.radiusY}" fill="${ellipse.fill}" stroke="${ellipse.stroke}" stroke-width="${ellipse.strokeWidth}" />` +
                groupEnd
            );
        }
        case 'triangle': {
            const triangle = element;
            const x = triangle.x - offsetX;
            const y = triangle.y - offsetY;
            const points = [
                `${x + triangle.width / 2},${y}`,
                `${x + triangle.width},${y + triangle.height}`,
                `${x},${y + triangle.height}`,
            ].join(' ');
            return (
                groupStart +
                `<polygon points="${points}" fill="${triangle.fill}" stroke="${triangle.stroke}" stroke-width="${triangle.strokeWidth}" />` +
                groupEnd
            );
        }
        case 'line': {
            const line = element;
            const x = line.x - offsetX;
            const y = line.y - offsetY;
            const points = serializeLinePoints(line.points, x, y);
            const dash = line.dash && line.dash.length > 0 ? ` stroke-dasharray="${line.dash.join(' ')}"` : '';
            const fill = line.closed ? line.fill ?? line.stroke : 'none';
            return (
                groupStart +
                `<polyline points="${points}" fill="${fill}" stroke="${line.stroke}" stroke-width="${line.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${dash} />` +
                groupEnd
            );
        }
        case 'path': {
            const path = element;
            const x = path.x - offsetX;
            const y = path.y - offsetY;
            const points = serializeLinePoints(path.points, x, y);
            const fill = path.closed ? path.fill ?? path.stroke : 'none';
            return (
                groupStart +
                `<polyline points="${points}" fill="${fill}" stroke="${path.stroke}" stroke-width="${path.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />` +
                groupEnd
            );
        }
        case 'pencil': {
            const pencil = element;
            const x = pencil.x - offsetX;
            const y = pencil.y - offsetY;
            const points = serializeLinePoints(pencil.points, x, y);
            return (
                groupStart +
                `<polyline points="${points}" fill="none" stroke="${pencil.stroke}" stroke-width="${pencil.strokeWidth}" stroke-linecap="${pencil.lineCap}" stroke-linejoin="${pencil.lineJoin}" />` +
                groupEnd
            );
        }
        case 'image': {
            const image = element;
            const x = image.x - offsetX;
            const y = image.y - offsetY;
            const href = escapeSvgAttr(image.src);
            return (
                groupStart +
                `<image href="${href}" x="${x}" y="${y}" width="${image.width}" height="${image.height}" preserveAspectRatio="none" />` +
                groupEnd
            );
        }
        default:
            return null;
    }
}

function createSvgForElements(elements: EditorElement[], bounds: RasterBounds): string {
    const content = elements
        .map((element) => serializeElementToSvg(element, bounds.left, bounds.top))
        .filter((value): value is string => Boolean(value))
        .join('');
    return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="0 0 ${bounds.width} ${bounds.height}">${content}</svg>`;
}

// React Native friendly shims to emulate Fabric.js grouping and rasterization behaviour.
class FabricImageAdapter {
    private readonly src: string;

    constructor(svgDataUrl: string) {
        this.src = svgDataUrl;
    }

    toDataURL() {
        return this.src;
    }

    getSrc() {
        return this.src;
    }

    toCanvasElement() {
        return this.src;
    }
}

class FabricGroupAdapter {
    private readonly elements: EditorElement[];
    private readonly bounds: RasterBounds;

    constructor(elements: EditorElement[], bounds: RasterBounds) {
        this.elements = elements;
        this.bounds = bounds;
    }

    cloneAsImage() {
        const svg = createSvgForElements(this.elements, this.bounds);
        const encoded = encodeSvgData(svg);
        return new FabricImageAdapter(`data:image/svg+xml;base64,${encoded}`);
    }
}

function mergeLayerIntoRaster(
    elements: EditorElement[],
    layerId: string,
): { elements: EditorElement[]; rasterElementId: string | null } {
    const layerCandidates = elements.filter(
        (element) => element.layerId === layerId && RASTERIZABLE_TYPES.has(element.type),
    );

    if (layerCandidates.length <= 1) {
        return { elements, rasterElementId: layerCandidates[0]?.id ?? null };
    }

    const sourceElements: EditorElement[] = layerCandidates.flatMap((element) => {
        if (isRasterizedLayer(element)) {
            return (element.metadata.sourceElements ?? []).map((item) => {
                const clone = cloneElementForRaster(item);
                clone.layerId = layerId;
                return clone;
            });
        }
        const clone = cloneElementForRaster(element);
        clone.layerId = layerId;
        return [clone];
    });

    const bounds = calculateCombinedBounds(sourceElements);
    if (!bounds) {
        return { elements, rasterElementId: null };
    }

    const group = new FabricGroupAdapter(sourceElements, bounds);
    const fabricImage = group.cloneAsImage();
    const src =
        (typeof fabricImage.toDataURL === 'function' && fabricImage.toDataURL()) ||
        (typeof (fabricImage as any).getSrc === 'function' && (fabricImage as any).getSrc()) ||
        '';

    const rasterMetadata: RasterizedLayerMetadata = {
        kind: 'rasterized-layer',
        layerId,
        sourceElements: sourceElements.map((item) => cloneElementForRaster(item)),
        bounds: { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height },
    };

    const base = createBaseElement('image', {
        name: 'Rasterized layer',
        x: bounds.left,
        y: bounds.top,
        rotation: 0,
        opacity: 1,
        metadata: rasterMetadata as unknown as Record<string, unknown>,
    });

    const referenceElement = layerCandidates[0];
    const isLocked = layerCandidates.some((candidate) => candidate.locked);
    const isVisible = layerCandidates.every((candidate) => candidate.visible);

    const imageElement: ImageElement = {
        ...(base as ImageElement),
        type: 'image',
        layerId,
        src,
        width: bounds.width,
        height: bounds.height,
        cornerRadius: 0,
        keepRatio: true,
        locked: isLocked,
        visible: isVisible,
        draggable: !isLocked && referenceElement.draggable,
    } satisfies ImageElement;

    const filteredElements = elements.filter((element) => {
        if (element.layerId !== layerId) return true;
        if (!RASTERIZABLE_TYPES.has(element.type)) return true;
        return false;
    });

    return {
        elements: [...filteredElements, imageElement],
        rasterElementId: imageElement.id,
    };
}

function isElementInsideSelection(element: EditorElement, rect: SelectionRect): boolean {
    const bounds = getElementBounds(element, { x: element.x, y: element.y });
    if (!bounds) {
        return false;
    }
    const withinHorizontal = bounds.left >= rect.x && bounds.right <= rect.x + rect.width;
    const withinVertical = bounds.top >= rect.y && bounds.bottom <= rect.y + rect.height;
    return withinHorizontal && withinVertical;
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

function clampZoom(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) {
        return min;
    }
    return Math.min(max, Math.max(min, value));
}

function scaleToPercent(scale: number, referenceScale: number): number {
    if (!Number.isFinite(scale) || !Number.isFinite(referenceScale) || referenceScale <= 0) {
        return 0;
    }
    const ratio = scale / referenceScale;
    if (ratio <= 0) {
        return ZOOM_PERCENT_MIN;
    }
    const percent = Math.log(ratio) / Math.log(ZOOM_EXP_BASE);
    if (!Number.isFinite(percent)) {
        return 0;
    }
    const scaled = percent * 100;
    return Math.max(ZOOM_PERCENT_MIN, Math.min(ZOOM_PERCENT_MAX, scaled));
}

function percentToScale(percent: number, referenceScale: number): number {
    if (!Number.isFinite(referenceScale) || referenceScale <= 0) {
        return MIN_ZOOM_FALLBACK;
    }
    if (!Number.isFinite(percent)) {
        return referenceScale;
    }
    const clampedPercent = Math.max(ZOOM_PERCENT_MIN, Math.min(ZOOM_PERCENT_MAX, percent));
    return referenceScale * Math.pow(ZOOM_EXP_BASE, clampedPercent / 100);
}

function computeFitScale(stageWidth: number, stageHeight: number, viewportWidth: number, viewportHeight: number): number {
    if (stageWidth === 0 || stageHeight === 0 || viewportWidth === 0 || viewportHeight === 0) {
        return 1;
    }
    return Math.min(viewportWidth / stageWidth, viewportHeight / stageHeight);
}

function clampStagePosition(
    position: { x: number; y: number },
    scale: number,
    stageSize: { width: number; height: number },
    viewportSize: { width: number; height: number },
): { x: number; y: number } {
    if (viewportSize.width <= 0 || viewportSize.height <= 0) {
        return position;
    }

    const scaledWidth = stageSize.width * scale;
    const scaledHeight = stageSize.height * scale;

    let minX: number;
    let maxX: number;
    if (scaledWidth <= viewportSize.width) {
        minX = 0;
        maxX = viewportSize.width - scaledWidth;
    } else {
        minX = viewportSize.width - scaledWidth;
        maxX = 0;
    }

    let minY: number;
    let maxY: number;
    if (scaledHeight <= viewportSize.height) {
        minY = 0;
        maxY = viewportSize.height - scaledHeight;
    } else {
        minY = viewportSize.height - scaledHeight;
        maxY = 0;
    }

    return {
        x: Math.min(maxX, Math.max(minX, position.x)),
        y: Math.min(maxY, Math.max(minY, position.y)),
    };
}

function getStagePointer(stage: StageType): Vector2d | null {
    const pointer = stage.getPointerPosition();
    if (!pointer) {
        return null;
    }
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const point = transform.point(pointer);
    const width = stage.width();
    const height = stage.height();
    return {
        x: Math.min(Math.max(point.x, 0), width),
        y: Math.min(Math.max(point.y, 0), height),
    };
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
    const [toolSettingsOpen, setToolSettingsOpen] = useState(false);
    const drawingStateRef = useRef<DrawingState | null>(null);
    const selectionOriginRef = useRef<Vector2d | null>(null);
    const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
    const [clipboard, setClipboard] = useState<EditorElement[] | null>(null);
    const [drawSettings, setDrawSettings] = useState(DEFAULT_DRAW);
    const [stagePosition, setStagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const stagePositionRef = useRef(stagePosition);
    const [workspaceSize, setWorkspaceSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const workspaceSizeRef = useRef(workspaceSize);
    const [fitScale, setFitScale] = useState(1);
    const fitScaleRef = useRef(fitScale);
    const [zoomBounds, setZoomBounds] = useState<{ min: number; max: number }>({ min: 1, max: MAX_ZOOM });
    const zoomBoundsRef = useRef(zoomBounds);
    const zoomRef = useRef(options.zoom);
    const panStateRef = useRef<{
        startPointer: Vector2d;
        startPosition: { x: number; y: number };
    } | null>(null);
    const panVelocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
    const lastPanTimestampRef = useRef<number | null>(null);
    const inertiaHandleRef = useRef<number | null>(null);
    const spacePressedRef = useRef(false);
    const stageHoverRef = useRef(false);
    const previousCursorRef = useRef<{ inline: string; hadInline: boolean } | null>(null);
    const [isPanMode, setIsPanMode] = useState(false);
    const [isPanning, setIsPanning] = useState(false);

    const { width } = useWindowDimensions();
    // const { width } = Dimensions.get('window')
    const isSmall = width < 600;
    const mainLayoutWidth = isSmall ? width - 30 : width - 90
    const collapsedWidth = isSmall ? 30 : 10
    const sidebarWidth = isSmall ? width - 30 : 90
    // const sidebarImageSize = isSmall ? 120 : 80
    const [leftOpen, setLeftOpen] = useState(false);

    const stageWidth = Math.round(options.width);
    const stageHeight = Math.round(options.height);
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    const sliderBounds = useMemo(
        () => ({
            min: ZOOM_PERCENT_MIN,
            max: ZOOM_PERCENT_MAX,
        }),
        [],
    );
    const sliderStep = useMemo(() => {
        const range = sliderBounds.max - sliderBounds.min;
        if (!Number.isFinite(range) || range <= 0) {
            return 1;
        }
        return Math.max(1, range / 200);
    }, [sliderBounds.max, sliderBounds.min]);
    const sliderValue = useMemo(() => {
        const value = Number.isFinite(options.zoom) ? options.zoom : zoomBounds.min;
        const clamped = clampZoom(value, zoomBounds.min, zoomBounds.max);
        return [scaleToPercent(clamped, fitScaleRef.current)];
    }, [options.zoom, zoomBounds.max, zoomBounds.min]);
    const zoomPercentage = useMemo(
        () => Math.round(scaleToPercent(options.zoom, fitScale)),
        [fitScale, options.zoom],
    );

    const stopInertia = useCallback(() => {
        if (inertiaHandleRef.current !== null) {
            cancelAnimationFrame(inertiaHandleRef.current);
            inertiaHandleRef.current = null;
        }
    }, []);

    const updateSelectionRect = useCallback((rect: SelectionRect | null) => {
        setSelectionRect(rect);
    }, []);

    useEffect(() => {
        if (activeTool !== 'select') {
            selectionOriginRef.current = null;
            updateSelectionRect(null);
        }
    }, [activeTool, updateSelectionRect]);

    useEffect(() => {
        if (activeTool === 'draw') {
            setToolSettingsOpen(true);
        } else {
            setToolSettingsOpen(false);
        }
    }, [activeTool]);

    const startPanInertia = useCallback(
        (velocity: { vx: number; vy: number }) => {
            let { vx, vy } = velocity;
            if (Math.abs(vx) < PAN_MIN_VELOCITY && Math.abs(vy) < PAN_MIN_VELOCITY) {
                return;
            }

            stopInertia();

            let lastTime: number | null = null;

            const step = (time: number) => {
                if (lastTime === null) {
                    lastTime = time;
                }
                const delta = time - lastTime;
                lastTime = time;

                const decay = Math.pow(PAN_INERTIA_FRICTION, delta / 16.67);
                vx *= decay;
                vy *= decay;

                if (Math.abs(vx) < PAN_MIN_VELOCITY && Math.abs(vy) < PAN_MIN_VELOCITY) {
                    stopInertia();
                    return;
                }

                const nextPosition = clampStagePosition(
                    {
                        x: stagePositionRef.current.x + vx * delta,
                        y: stagePositionRef.current.y + vy * delta,
                    },
                    zoomRef.current,
                    { width: stageWidth, height: stageHeight },
                    workspaceSizeRef.current,
                );

                if (
                    nextPosition.x === stagePositionRef.current.x &&
                    nextPosition.y === stagePositionRef.current.y
                ) {
                    stopInertia();
                    return;
                }

                setStagePosition(nextPosition);
                inertiaHandleRef.current = requestAnimationFrame(step);
            };

            inertiaHandleRef.current = requestAnimationFrame(step);
        },
        [setStagePosition, stageHeight, stageWidth, stopInertia],
    );

    useEffect(() => () => stopInertia(), [stopInertia]);

    useEffect(() => {
        workspaceSizeRef.current = workspaceSize;
    }, [workspaceSize]);

    useEffect(() => {
        zoomBoundsRef.current = zoomBounds;
    }, [zoomBounds]);

    useEffect(() => {
        fitScaleRef.current = fitScale;
    }, [fitScale]);

    useEffect(() => {
        zoomRef.current = options.zoom;
    }, [options.zoom]);

    useLayoutEffect(() => {
        const element = editorCanvasRef.current;
        if (!element) {
            return;
        }

        const parseSpacingValue = (value: string | null | undefined) => {
            if (!value) {
                return 0;
            }
            const parsed = Number.parseFloat(value);
            return Number.isFinite(parsed) ? parsed : 0;
        };

        let frame: number | null = null;

        const measure = () => {
            frame = null;

            const rect = element.getBoundingClientRect();
            const style = typeof window !== 'undefined' ? window.getComputedStyle(element) : null;
            const paddingX = style
                ? parseSpacingValue(style.paddingLeft) + parseSpacingValue(style.paddingRight)
                : 0;
            const paddingY = style
                ? parseSpacingValue(style.paddingTop) + parseSpacingValue(style.paddingBottom)
                : 0;
            const borderX = style
                ? parseSpacingValue(style.borderLeftWidth) + parseSpacingValue(style.borderRightWidth)
                : 0;
            const borderY = style
                ? parseSpacingValue(style.borderTopWidth) + parseSpacingValue(style.borderBottomWidth)
                : 0;
            const marginLeft = style ? parseSpacingValue(style.marginLeft) : 0;
            const marginRight = style ? parseSpacingValue(style.marginRight) : 0;
            const marginTop = style ? parseSpacingValue(style.marginTop) : 0;
            const marginBottom = style ? parseSpacingValue(style.marginBottom) : 0;

            const measuredWidth = Math.max(0, rect.width - paddingX);
            const measuredHeight = Math.max(0, rect.height - paddingY);

            let availableWidth = measuredWidth;
            let availableHeight = measuredHeight;

            if (typeof window !== 'undefined') {
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                const offsetLeft = Math.max(0, rect.left - marginLeft);
                const offsetRight = Math.max(0, viewportWidth - rect.right - marginRight);
                const offsetTop = Math.max(0, rect.top - marginTop);
                const offsetBottom = Math.max(0, viewportHeight - rect.bottom - marginBottom);

                const totalHorizontalChrome = paddingX + borderX;
                const totalVerticalChrome = paddingY + borderY;

                availableWidth = Math.max(0, viewportWidth - offsetLeft - offsetRight - totalHorizontalChrome);
                availableHeight = Math.max(0, viewportHeight - offsetTop - offsetBottom - totalVerticalChrome);

                const minHeight = Math.max(0, Math.round(viewportHeight - offsetTop - offsetBottom));
                element.style.minHeight = `${minHeight}px`;
            }

            const nextSize = {
                width: Math.max(0, Math.round(availableWidth || measuredWidth)),
                height: Math.max(0, Math.round(availableHeight || measuredHeight)),
            };

            setWorkspaceSize((current) =>
                current.width === nextSize.width && current.height === nextSize.height ? current : nextSize,
            );
        };

        const scheduleMeasure = () => {
            if (frame !== null) {
                cancelAnimationFrame(frame);
            }
            frame = requestAnimationFrame(measure);
        };

        measure();

        let observer: ResizeObserver | null = null;
        const hasWindow = typeof window !== 'undefined';

        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(() => scheduleMeasure());
            observer.observe(element);
        }

        if (hasWindow) {
            window.addEventListener('resize', scheduleMeasure);
            window.addEventListener('scroll', scheduleMeasure, true);
        }

        return () => {
            if (hasWindow) {
                window.removeEventListener('resize', scheduleMeasure);
                window.removeEventListener('scroll', scheduleMeasure, true);
            }

            if (observer) {
                observer.disconnect();
            }

            if (frame !== null) {
                cancelAnimationFrame(frame);
            }

            element.style.removeProperty('min-height');
        };
    }, [editorCanvasRef]);

    const restoreStageCursor = useCallback(() => {
        const stage = stageRef.current;
        const container = typeof stage?.container === 'function' ? stage.container() : null;
        if (!container) {
            return;
        }

        if (previousCursorRef.current) {
            const { inline, hadInline } = previousCursorRef.current;
            if (hadInline) {
                container.style.cursor = inline;
            } else {
                container.style.removeProperty('cursor');
            }
        } else {
            container.style.removeProperty('cursor');
        }

        previousCursorRef.current = null;
    }, []);

    useEffect(() => {
        const stage = stageRef.current;
        const container = typeof stage?.container === 'function' ? stage.container() : null;
        if (!container) {
            return;
        }

        if (isPanMode || isPanning) {
            if (!previousCursorRef.current) {
                const inline = container.style.cursor;
                previousCursorRef.current = {
                    inline,
                    hadInline: inline.length > 0,
                };
            }
            container.style.cursor = isPanning ? 'grabbing' : 'grab';
            return;
        }

        restoreStageCursor();
    }, [isPanMode, isPanning, restoreStageCursor]);

    useEffect(() => {
        const viewportWidth = workspaceSize.width;
        const viewportHeight = workspaceSize.height;
        if (viewportWidth <= 0 || viewportHeight <= 0) {
            return;
        }

        const fitScaleRaw = computeFitScale(stageWidth, stageHeight, viewportWidth, viewportHeight);
        const nextFit = clampZoom(Math.max(fitScaleRaw, MIN_ZOOM_FALLBACK), MIN_ZOOM_FALLBACK, MAX_ZOOM);
        const previousFit = fitScaleRef.current;
        fitScaleRef.current = nextFit;
        setFitScale((current) => (Math.abs(current - nextFit) < 0.0001 ? current : nextFit));

        const minScale = Math.max(MIN_ZOOM_FALLBACK, nextFit * Math.pow(ZOOM_EXP_BASE, ZOOM_PERCENT_MIN / 100));
        const maxScale = Math.max(minScale, nextFit * Math.pow(ZOOM_EXP_BASE, ZOOM_PERCENT_MAX / 100));

        setZoomBounds((current) =>
            current.min === minScale && current.max === maxScale ? current : { min: minScale, max: maxScale },
        );

        const currentZoom = zoomRef.current;
        const shouldSnapToFit =
            !Number.isFinite(currentZoom) || Math.abs(currentZoom - previousFit) < 0.0001;
        const clampedZoom = shouldSnapToFit
            ? nextFit
            : clampZoom(currentZoom, minScale, maxScale);
        if (clampedZoom !== currentZoom || shouldSnapToFit) {
            zoomRef.current = clampedZoom;
            setOptions((current) => (current.zoom === clampedZoom ? current : { ...current, zoom: clampedZoom }));
        }

        const scaledWidth = stageWidth * clampedZoom;
        const scaledHeight = stageHeight * clampedZoom;
        const preferredPosition = clampStagePosition(
            {
                x: Math.max(0, (viewportWidth - scaledWidth) / 2),
                y: Math.max(0, (viewportHeight - scaledHeight) / 2),
            },
            clampedZoom,
            { width: stageWidth, height: stageHeight },
            { width: viewportWidth, height: viewportHeight },
        );
        const clampedPosition = clampStagePosition(
            stagePositionRef.current,
            clampedZoom,
            { width: stageWidth, height: stageHeight },
            { width: viewportWidth, height: viewportHeight },
        );
        const nextPosition = shouldSnapToFit ? preferredPosition : clampedPosition;

        if (nextPosition.x !== stagePositionRef.current.x || nextPosition.y !== stagePositionRef.current.y) {
            setStagePosition(nextPosition);
        }
    }, [setOptions, stageHeight, stageWidth, workspaceSize.height, workspaceSize.width]);

    useEffect(() => {
        if (layers.length === 0) {
            return;
        }

        if (!activeLayerId || !layers.some((layer) => layer.id === activeLayerId)) {
            setActiveLayerId(layers[layers.length - 1].id);
        }
    }, [layers, activeLayerId]);

    useEffect(() => {
        const stage = stageRef.current;
        const container = typeof stage?.container === 'function' ? stage.container() : null;
        if (!container) {
            return;
        }

        const previousTouchAction = container.style.touchAction;
        container.style.touchAction = 'none';

        return () => {
            container.style.touchAction = previousTouchAction;
        };
    }, []);

    useEffect(() => {
        stagePositionRef.current = stagePosition;
        const stage = stageRef.current;
        if (stage) {
            stage.position(stagePosition);
            stage.batchDraw();
        }
    }, [stagePosition]);

    useEffect(() => {
        const stage = stageRef.current;
        if (stage) {
            stage.scale({ x: options.zoom, y: options.zoom });
            stage.batchDraw();
        }
    }, [options.zoom]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const handlePointerRelease = () => {
            if (drawingStateRef.current) {
                drawingStateRef.current = null;
            }
        };

        window.addEventListener('mouseup', handlePointerRelease);
        window.addEventListener('touchend', handlePointerRelease);
        window.addEventListener('touchcancel', handlePointerRelease);

        return () => {
            window.removeEventListener('mouseup', handlePointerRelease);
            window.removeEventListener('touchend', handlePointerRelease);
            window.removeEventListener('touchcancel', handlePointerRelease);
        };
    }, []);

    useEffect(() => {
        const isSpaceEvent = (event: KeyboardEvent) => {
            if (event.code === 'Space') {
                return true;
            }
            if (event.key === ' ' || event.key === 'Spacebar') {
                return true;
            }
            return false;
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isSpaceEvent(event)) {
                return;
            }

            if (!spacePressedRef.current) {
                spacePressedRef.current = true;
            }

            if (stageHoverRef.current) {
                event.preventDefault();
                setIsPanMode(true);
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (!isSpaceEvent(event)) {
                return;
            }

            spacePressedRef.current = false;
            setIsPanMode(false);

            if (panStateRef.current) {
                panStateRef.current = null;
                setIsPanning(false);
            }

            restoreStageCursor();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [restoreStageCursor]);

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

                let workingElements = [...current.elements, assigned!];
                if (targetLayerId) {
                    const mergeResult = mergeLayerIntoRaster(workingElements, targetLayerId);
                    workingElements = mergeResult.elements;
                    if (mergeResult.rasterElementId) {
                        const replacement = workingElements.find((candidate) => candidate.id === mergeResult.rasterElementId);
                        if (replacement) {
                            assigned = replacement;
                        }
                    }
                }

                const updatedElements = orderElementsByLayer(workingElements, nextLayers);
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

    const handleAddDraw = useCallback(() => {
        setActiveTool('draw');
    }, []);

    const handleAddText = useCallback(() => {
        addElement(createText(options));
    }, [addElement, options]);

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

    const handleStageMouseEnter = useCallback(() => {
        stageHoverRef.current = true;
        if (spacePressedRef.current) {
            setIsPanMode(true);
        }
    }, [setIsPanMode]);

    const handleStageMouseLeave = useCallback(() => {
        stageHoverRef.current = false;
        if (panStateRef.current) {
            panStateRef.current = null;
            setIsPanning(false);
        }
        setIsPanMode(false);
        restoreStageCursor();
    }, [restoreStageCursor, setIsPanMode, setIsPanning]);

    const handleStagePointerDown = useCallback(
        (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
            const stage = event.target.getStage();
            if (!stage) return;

            if (isPanMode) {
                event.evt.preventDefault();
                stopInertia();
                const pointerPosition = stage.getPointerPosition();
                if (!pointerPosition) return;
                const startPosition = stagePositionRef.current;
                panStateRef.current = {
                    startPointer: { x: pointerPosition.x, y: pointerPosition.y },
                    startPosition: { x: startPosition.x, y: startPosition.y },
                };
                panVelocityRef.current = { vx: 0, vy: 0 };
                lastPanTimestampRef.current = performance.now();
                setIsPanning(true);
                return;
            }

            const pointer = getStagePointer(stage);
            if (!pointer) return;

            if (activeTool === 'draw') {
                const element: PencilElement = {
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
                };
                drawingStateRef.current = {
                    id: element.id,
                    origin: { x: pointer.x, y: pointer.y },
                };
                addElement(element);
                setToolSettingsOpen(false);
                return;
            }

            selectionOriginRef.current = null;
            updateSelectionRect(null);

            if (event.target === stage) {
                setSelectedIds([]);
                if (activeTool === 'select') {
                    selectionOriginRef.current = pointer;
                    updateSelectionRect({ x: pointer.x, y: pointer.y, width: 0, height: 0 });
                } else {
                    setActiveTool('select');
                }
            }
        },
        [activeTool, addElement, drawSettings, isPanMode, setActiveTool, setSelectedIds, stopInertia, updateSelectionRect, setToolSettingsOpen],
    );

    const handleStagePointerMove = useCallback(
        (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
            const stage = event.target.getStage();
            if (!stage) return;

            if (panStateRef.current) {
                const pointerPosition = stage.getPointerPosition();
                if (!pointerPosition) return;
                const { startPointer, startPosition } = panStateRef.current;
                const deltaX = pointerPosition.x - startPointer.x;
                const deltaY = pointerPosition.y - startPointer.y;
                const targetPosition = {
                    x: startPosition.x + deltaX,
                    y: startPosition.y + deltaY,
                };
                const clamped = clampStagePosition(
                    targetPosition,
                    zoomRef.current,
                    { width: stageWidth, height: stageHeight },
                    workspaceSizeRef.current,
                );
                const previous = stagePositionRef.current;
                const now = performance.now();
                const last = lastPanTimestampRef.current;
                if (last !== null && now > last) {
                    const dt = now - last;
                    panVelocityRef.current = {
                        vx: (clamped.x - previous.x) / dt,
                        vy: (clamped.y - previous.y) / dt,
                    };
                }
                lastPanTimestampRef.current = now;
                setStagePosition(clamped);
                return;
            }

            if (selectionOriginRef.current && activeTool === 'select') {
                const pointer = getStagePointer(stage);
                if (!pointer) return;
                updateSelectionRect(normalizeSelectionRect(selectionOriginRef.current, pointer));
                return;
            }

            const drawingState = drawingStateRef.current;
            if (!drawingState) return;
            const pointer = getStagePointer(stage);
            if (!pointer) return;

            updateElements((current) =>
                current.map((element) => {
                    if (element.id !== drawingState.id) {
                        return element;
                    }
                    const dx = pointer.x - drawingState.origin.x;
                    const dy = pointer.y - drawingState.origin.y;
                    const pencil = element as PencilElement;
                    return { ...pencil, points: [...pencil.points, dx, dy] };
                }),
            );
        },
        [activeTool, setStagePosition, stageHeight, stageWidth, updateElements, updateSelectionRect],
    );

    const handleStagePointerUp = useCallback(
        (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
            if (panStateRef.current) {
                panStateRef.current = null;
                setIsPanning(false);
                const velocity = panVelocityRef.current;
                panVelocityRef.current = { vx: 0, vy: 0 };
                lastPanTimestampRef.current = null;
                startPanInertia(velocity);
                return;
            }

            const stage = event.target.getStage();

            if (selectionOriginRef.current && activeTool === 'select' && stage) {
                const pointer = getStagePointer(stage);
                if (pointer) {
                    const rect = normalizeSelectionRect(selectionOriginRef.current, pointer);
                    if (rect.width >= MIN_SELECTION_SIZE && rect.height >= MIN_SELECTION_SIZE) {
                        const selected = contentElements.filter((element) => {
                            if (!element.visible || element.locked) {
                                return false;
                            }
                            if (activeLayerId && element.layerId !== activeLayerId) {
                                return false;
                            }
                            if (element.layerId) {
                                const layer = layerMap.get(element.layerId);
                                if (layer?.locked) {
                                    return false;
                                }
                            }
                            return isElementInsideSelection(element, rect);
                        });
                        setSelectedIds(selected.map((element) => element.id));
                    }
                }
            }

            selectionOriginRef.current = null;
            updateSelectionRect(null);

            if (!drawingStateRef.current) return;
            drawingStateRef.current = null;
        },
        [activeLayerId, activeTool, contentElements, layerMap, setIsPanning, setSelectedIds, startPanInertia, updateSelectionRect],
    );

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
        (value: number | ((current: number) => number), anchor: { clientX: number; clientY: number } | null = null) => {
            stopInertia();
            const stage = stageRef.current;
            const container = typeof stage?.container === 'function' ? stage.container() : null;
            const containerBounds = container?.getBoundingClientRect() ?? null;

            const currentZoom = zoomRef.current;
            const resolved = typeof value === 'function' ? value(currentZoom) : value;
            const clamped = clampZoom(resolved, zoomBoundsRef.current.min, zoomBoundsRef.current.max);

            if (clamped === currentZoom) {
                return;
            }

            zoomRef.current = clamped;
            setOptions((current) => (current.zoom === clamped ? current : { ...current, zoom: clamped }));

            if (stage) {
                stage.scale({ x: clamped, y: clamped });
            }

            const currentPosition = stagePositionRef.current;
            let nextPosition = currentPosition;

            if (anchor && containerBounds && currentZoom > 0) {
                const offsetX = anchor.clientX - containerBounds.left;
                const offsetY = anchor.clientY - containerBounds.top;
                const anchorStageX = (offsetX - currentPosition.x) / currentZoom;
                const anchorStageY = (offsetY - currentPosition.y) / currentZoom;
                nextPosition = {
                    x: offsetX - anchorStageX * clamped,
                    y: offsetY - anchorStageY * clamped,
                };
            }

            nextPosition = clampStagePosition(
                nextPosition,
                clamped,
                { width: stageWidth, height: stageHeight },
                workspaceSizeRef.current,
            );

            if (stage) {
                stage.position(nextPosition);
                stage.batchDraw();
            }

            if (nextPosition.x !== currentPosition.x || nextPosition.y !== currentPosition.y) {
                setStagePosition(nextPosition);
            }
        },
        [setOptions, setStagePosition, stageHeight, stageWidth, stopInertia],
    );

    const handleZoomOut = useCallback(() => {
        applyZoom((current) => current / KEYBOARD_ZOOM_FACTOR);
    }, [applyZoom]);

    const handleZoomIn = useCallback(() => {
        applyZoom((current) => current * KEYBOARD_ZOOM_FACTOR);
    }, [applyZoom]);

    const handleSliderChange = useCallback(
        (values: number[]) => {
            const [next] = values;
            if (typeof next !== 'number' || Number.isNaN(next)) {
                return;
            }
            applyZoom(percentToScale(next, fitScaleRef.current));
        },
        [applyZoom],
    );

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
            event.preventDefault();
            const deltaY = event.deltaY;
            if (deltaY === 0) {
                return;
            }
            const zoomFactor = Math.exp(-deltaY * WHEEL_ZOOM_SENSITIVITY);
            const target = clampZoom(
                zoomRef.current * zoomFactor,
                zoomBoundsRef.current.min,
                zoomBoundsRef.current.max,
            );
            applyZoom(target, { clientX: event.clientX, clientY: event.clientY });
        };

        let pinchState: { distance: number; zoom: number } | null = null;
        let lastTapTime = 0;

        const getTouchDistance = (touchA: Touch, touchB: Touch) => {
            const dx = touchA.clientX - touchB.clientX;
            const dy = touchA.clientY - touchB.clientY;
            return Math.hypot(dx, dy);
        };

        const getTouchCenter = (touchA: Touch, touchB: Touch) => ({
            clientX: (touchA.clientX + touchB.clientX) / 2,
            clientY: (touchA.clientY + touchB.clientY) / 2,
        });

        const handleTouchStart = (event: TouchEvent) => {
            if (event.touches.length === 2) {
                event.preventDefault();
                const [touchA, touchB] = [event.touches[0], event.touches[1]];
                pinchState = {
                    distance: getTouchDistance(touchA, touchB),
                    zoom: zoomRef.current,
                };
            }
        };

        const handleTouchMove = (event: TouchEvent) => {
            if (event.touches.length === 2 && pinchState) {
                event.preventDefault();
                const [touchA, touchB] = [event.touches[0], event.touches[1]];
                const distance = getTouchDistance(touchA, touchB);
                if (pinchState.distance === 0) {
                    return;
                }
                const ratio = distance / pinchState.distance;
                const target = clampZoom(
                    pinchState.zoom * ratio,
                    zoomBoundsRef.current.min,
                    zoomBoundsRef.current.max,
                );
                const center = getTouchCenter(touchA, touchB);
                applyZoom(target, center);
            }
        };

        const handleTouchEnd = (event: TouchEvent) => {
            if (event.touches.length < 2) {
                pinchState = null;
            }

            if (event.touches.length > 0) {
                return;
            }

            if (event.changedTouches.length === 1) {
                const now = performance.now();
                const touch = event.changedTouches[0];
                if (now - lastTapTime < 300) {
                    event.preventDefault();
                    const minZoom = zoomBoundsRef.current.min;
                    const maxZoom = zoomBoundsRef.current.max;
                    const target =
                        zoomRef.current < DOUBLE_TAP_ZOOM
                            ? Math.min(DOUBLE_TAP_ZOOM, maxZoom)
                            : minZoom;
                    applyZoom(target, { clientX: touch.clientX, clientY: touch.clientY });
                }
                lastTapTime = now;
            }
        };

        const handleTouchCancel = () => {
            pinchState = null;
        };

        const handleDoubleClick = (event: MouseEvent) => {
            event.preventDefault();
            const minZoom = zoomBoundsRef.current.min;
            const maxZoom = zoomBoundsRef.current.max;
            const target =
                zoomRef.current < DOUBLE_TAP_ZOOM ? Math.min(DOUBLE_TAP_ZOOM, maxZoom) : minZoom;
            applyZoom(target, { clientX: event.clientX, clientY: event.clientY });
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);
        container.addEventListener('touchcancel', handleTouchCancel);
        container.addEventListener('dblclick', handleDoubleClick);

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('touchcancel', handleTouchCancel);
            container.removeEventListener('dblclick', handleDoubleClick);
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

    const rulerStep = Math.max(1, 32 * options.zoom);
    const gridBackground = useMemo(() => {
        if (!options.showGrid) {
            return {
                backgroundColor: options.backgroundColor,
            } as const;
        }
        const baseGrid = Math.max(1, options.gridSize);
        return {
            backgroundColor: options.backgroundColor,
            backgroundImage:
                'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: `${baseGrid}px ${baseGrid}px`,
        } as const;
    }, [options.backgroundColor, options.gridSize, options.showGrid]);
    const stageCursor = isPanning ? 'grabbing' : isPanMode ? 'grab' : undefined;
    const rulerPadding = options.showRulers ? 24 : 0;
    const stageWrapperStyle = useMemo((): CSSProperties => {
        const viewportWidth = workspaceSize.width > 0 ? workspaceSize.width : stageWidth;
        const viewportHeight = workspaceSize.height > 0 ? workspaceSize.height : stageHeight;
        const width = options.showRulers ? viewportWidth + rulerPadding : viewportWidth;
        const height = options.showRulers ? viewportHeight + rulerPadding : viewportHeight;
        return {
            width,
            height,
        } as CSSProperties;
    }, [options.showRulers, rulerPadding, stageHeight, stageWidth, workspaceSize.height, workspaceSize.width]);
    const stageCanvasStyle = useMemo(() => {
        const viewportWidth = workspaceSize.width > 0 ? workspaceSize.width : stageWidth;
        const viewportHeight = workspaceSize.height > 0 ? workspaceSize.height : stageHeight;
        const baseStyle: CSSProperties = {
            width: viewportWidth,
            height: viewportHeight,
            backgroundColor: WORKSPACE_COLOR,
            overflow: 'hidden',
        };
        if (stageCursor) {
            baseStyle.cursor = stageCursor;
        }
        return baseStyle;
    }, [stageCursor, stageHeight, stageWidth, workspaceSize.height, workspaceSize.width]);
    const stageBackgroundStyle = useMemo(() => {
        return {
            position: 'absolute' as const,
            top: 0,
            left: 0,
            width: stageWidth,
            height: stageHeight,
            transformOrigin: 'top left',
            transform: `translate(${stagePosition.x}px, ${stagePosition.y}px) scale(${options.zoom})`,
            pointerEvents: 'none' as const,
            borderRadius: 8,
            ...gridBackground,
        };
    }, [gridBackground, options.zoom, stageHeight, stagePosition.x, stagePosition.y, stageWidth]);

    const activeToolLabel = useMemo(() => (activeTool === 'draw' ? 'Draw' : 'Select'), [activeTool]);

    const XYStack = ({ isSmall, ...props }) => {
        const XYStack = isSmall ? YStack : XStack
        return <XYStack {...props} />
    }

    const EditorTools = () => (
        <XYStack isSmall={isSmall} className="toolbar-group">
            <Button type="button" onPress={undo} disabled={!canUndo} aria-label="Undo" title="Undo">
                <MaterialCommunityIcons key="undo" name="undo" size={TOOLBAR_ICON_SIZE} />
            </Button>
            <Button type="button" onPress={redo} disabled={!canRedo} aria-label="Redo" title="Redo">
                <MaterialCommunityIcons key="redo" name="redo" size={TOOLBAR_ICON_SIZE} />
            </Button>
            <Button
                type="button"
                onPress={handleCopy}
                disabled={selectedIds.length === 0}
                aria-label="Copy"
                title="Copy"
            >
                <MaterialCommunityIcons key="content-copy" name="content-copy" size={TOOLBAR_ICON_SIZE} />
            </Button>
            <Button
                type="button"
                onPress={handlePaste}
                disabled={!clipboard || clipboard.length === 0}
                aria-label="Paste"
                title="Paste"
            >
                <MaterialCommunityIcons key="content-paste" name="content-paste" size={TOOLBAR_ICON_SIZE} />
            </Button>
            <Button
                type="button"
                onPress={handleDuplicate}
                disabled={selectedIds.length === 0}
                aria-label="Duplicate"
                title="Duplicate"
            >
                <MaterialCommunityIcons key="content-duplicate" name="content-duplicate" size={TOOLBAR_ICON_SIZE} />
            </Button>
            <Button
                type="button"
                onPress={removeSelected}
                disabled={selectedIds.length === 0}
                aria-label="Delete"
                title="Delete"
            >
                <MaterialCommunityIcons key="trash-can-outline" name="trash-can-outline" size={TOOLBAR_ICON_SIZE} />
            </Button>
            <Button type="button" onPress={handleClear} aria-label="Clear canvas" title="Clear canvas">
                <MaterialCommunityIcons key="eraser-variant" name="eraser-variant" size={TOOLBAR_ICON_SIZE} />
            </Button>
        </XYStack>
    )

    const EditorSave = () => (
        <XYStack isSmall={isSmall} className="toolbar-group">
            <Button type="button" onPress={handleSave} aria-label="Save" title="Save">
                <MaterialCommunityIcons key="content-save-outline" name="content-save-outline" size={TOOLBAR_ICON_SIZE} />
            </Button>
            <Button type="button" onPress={handleLoadFromBrowser} aria-label="Load" title="Load">
                <MaterialCommunityIcons key="folder-open-outline" name="folder-open-outline" size={TOOLBAR_ICON_SIZE} />
            </Button>
            <Button type="button" onPress={() => handleExport('png')} aria-label="Export PNG" title="Export PNG">
                <MaterialCommunityIcons key="file-image" name="file-image" size={TOOLBAR_ICON_SIZE} />
            </Button>
            <Button type="button" onPress={() => handleExport('jpeg')} aria-label="Export JPEG" title="Export JPEG">
                <MaterialCommunityIcons key="file-jpg-box" name="file-jpg-box" size={TOOLBAR_ICON_SIZE} />
            </Button>
            <Button type="button" onPress={() => handleExport('svg')} aria-label="Export SVG" title="Export SVG">
                <MaterialCommunityIcons key="svg" name="svg" size={TOOLBAR_ICON_SIZE} />
            </Button>
            <Button type="button" onPress={() => handleExport('json')} aria-label="Export JSON" title="Export JSON">
                <MaterialCommunityIcons key="code-json" name="code-json" size={TOOLBAR_ICON_SIZE} />
            </Button>
        </XYStack>
    )

    const displayWidth = Math.round(options.width)
    const displayHeight = Math.round(options.height)

    return (
        <YStack>
            <Theme name="emerald">
                <SidebarContainer left={0}>
                    {leftOpen ? (
                        <SidebarPanel width={sidebarWidth} padding="0">
                            <SidebarScroll>
                                <SidebarContent>
                                    <YStack className="editor-header">
                                        <EditorTools />
                                        <EditorSave />
                                    </YStack>
                                </SidebarContent>
                            </SidebarScroll>
                        </SidebarPanel>
                    ) : null}
                    {isSmall ? (
                        <SidebarToggle
                            onPress={() => setLeftOpen((prev) => !prev)}
                            width={collapsedWidth}
                            backgroundColor="$backgroundHover"
                        >
                            <SidebarToggleLabel color="$color10">{leftOpen ? '◀' : '▶'}</SidebarToggleLabel>
                        </SidebarToggle>
                    ) : null}
                </SidebarContainer>
            </Theme>
            <YStack className="editor-shell">
                <XStack className="editor-header" zIndex={1} overflow={'visible'}>
                    <XStack className="logo">
                        <Image
                            src="https://raw.githubusercontent.com/Everduin94/react-native-vector-icons/master/assets/images/TinyArtist.png"
                            alt="TinyArtist logo"
                            width="40"
                            height="40"
                        />
                        <Text>TinyArtist Editor</Text>
                    </XStack>
                    {!isSmall && (
                        <XStack>
                            <EditorTools />
                            <EditorSave />
                        </XStack>
                    )}


                </XStack>
                <XStack width={mainLayoutWidth} className="editor-shell-layout" zIndex={0} >
                    <YStack className="editor-toolbar">
                        <YStack className="toolbar-group">
                            <Button
                                type="button"
                                className={activeTool === 'select' ? 'active' : ''}
                                onPress={() => setActiveTool('select')}
                                aria-label="Select"
                                title="Select"
                            >
                                <MaterialCommunityIcons key="cursor-default" name="cursor-default" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button
                                type="button"
                                className={activeTool === 'draw' ? 'active' : ''}
                                onPress={handleAddDraw}
                                aria-label="Draw"
                                title="Draw"
                            >
                                <MaterialCommunityIcons key="pencil-outline" name="pencil-outline" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                        </YStack>
                        <Text className="active-tool-status" aria-live="polite">
                            Active tool: {activeToolLabel}
                        </Text>
                        <YStack className="toolbar-group">
                            <Button type="button" onPress={handleAddText} aria-label="Add text" title="Add text">
                                <MaterialCommunityIcons key="format-text" name="format-text" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                            <Button type="button" onPress={handleRequestImage} aria-label="Add image" title="Add image">
                                <MaterialCommunityIcons key="image-outline" name="image-outline" size={TOOLBAR_ICON_SIZE} />
                            </Button>
                        </YStack>
                    </YStack>

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
                                        onMouseEnter={handleStageMouseEnter}
                                        onMouseLeave={handleStageMouseLeave}
                                        onMouseDown={handleStagePointerDown}
                                        onTouchStart={handleStagePointerDown}
                                        onMouseMove={handleStagePointerMove}
                                        onTouchMove={handleStagePointerMove}
                                        onMouseUp={handleStagePointerUp}
                                        onTouchEnd={handleStagePointerUp}
                                        onTouchCancel={handleStagePointerUp}
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
                                        <Popover placement="bottom-start" open={toolSettingsOpen} onOpenChange={setToolSettingsOpen}>
                                            <Popover.Trigger position={`absolute`} top={0} left={0}>
                                                <Button type="button" aria-label="tool" title="tool">
                                                    <MaterialCommunityIcons key="tool" name="tool" size={TOOLBAR_ICON_SIZE * 1.5} />
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
                                                                            setDrawSettings((current) => ({
                                                                                ...current,
                                                                                color: event.target.value,
                                                                            }))
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
                                                                            setDrawSettings((current) => ({
                                                                                ...current,
                                                                                width,
                                                                            }));
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
                                            <Popover.Trigger position={`absolute`} top={0} right={0}>
                                                <Button type="button" aria-label="cog" title="cog">
                                                    <MaterialCommunityIcons key="cog" name="cog" size={TOOLBAR_ICON_SIZE * 1.5} />
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
                                                                <Label>
                                                                    Width
                                                                </Label>
                                                                <Input
                                                                    size="$2"
                                                                    min={100}
                                                                    value={displayWidth}
                                                                    onChange={(event) => setOptions((current) => {
                                                                        const value = Number(event.target.value)
                                                                        return {
                                                                            ...current,
                                                                            width: Number.isFinite(value) ? Math.max(100, value) : current.width,
                                                                        }
                                                                    })}
                                                                    disabled={options.canvasSizeLocked || !options.fixedCanvas}
                                                                />
                                                            </XStack>
                                                            <XStack gap="$2">
                                                                <Label>
                                                                    Height
                                                                </Label>
                                                                <Input
                                                                    size="$2"
                                                                    min={100}
                                                                    value={displayHeight}
                                                                    onChange={(event) =>
                                                                        setOptions((current) => {
                                                                            const value = Number(event.target.value)
                                                                            return {
                                                                                ...current,
                                                                                height: Number.isFinite(value) ? Math.max(100, value) : current.height,
                                                                            }
                                                                        })
                                                                    }
                                                                    disabled={options.canvasSizeLocked || !options.fixedCanvas}
                                                                />
                                                            </XStack>
                                                            <XStack gap="$2">
                                                                <Label className="full-width">
                                                                    Background
                                                                </Label>
                                                                <Input
                                                                    size="$2"
                                                                    value={options.backgroundColor}
                                                                    onChange={(event) =>
                                                                        setOptions((current) => ({ ...current, backgroundColor: event.target.value }))
                                                                    }
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
                                            <Popover.Trigger position={`absolute`} bottom={0} left={0}>
                                                <Button type="button" aria-label="Layers" title="Layers">
                                                    <MaterialCommunityIcons key="layers" name="layers" size={TOOLBAR_ICON_SIZE * 1.5} />
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
                                                        onSelectLayer={handleSelectLayer}
                                                        onToggleVisibility={handleToggleVisibility}
                                                        onToggleLock={handleToggleLock}
                                                        onRemoveLayer={handleRemoveLayer}
                                                        onMoveLayer={handleLayerMove}
                                                        onAddLayer={handleAddLayer}
                                                    />


                                                </YStack>
                                            </Popover.Content>
                                        </Popover>
                                    </Stack>
                                    {isBrowser ? (
                                        <Stack position="absolute" bottom={5} right={5} zIndex={2}>
                                            <Popover placement="top-end">
                                                <Popover.Trigger position={`absolute`} bottom={0} right={0}>
                                                    <Button type="button" aria-label="Zoom" title="Zoom">
                                                        <MaterialCommunityIcons key="zoom" name="zoom" size={TOOLBAR_ICON_SIZE * 1.5} />
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
                                                            onPress={handleZoomIn}
                                                            aria-label="Zoom in"
                                                            title="Zoom in"
                                                            size="$2"
                                                        >
                                                            <MaterialCommunityIcons
                                                                key="plus"
                                                                name="plus"
                                                                size={TOOLBAR_ICON_SIZE - 4}
                                                            />
                                                        </Button>
                                                        <Slider
                                                            value={sliderValue}
                                                            min={sliderBounds.min}
                                                            max={sliderBounds.max}
                                                            step={sliderStep}
                                                            orientation="vertical"
                                                            height={200}
                                                            onValueChange={handleSliderChange}
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
                                                            onPress={handleZoomOut}
                                                            aria-label="Zoom out"
                                                            title="Zoom out"
                                                            size="$2"
                                                        >
                                                            <MaterialCommunityIcons
                                                                key="minus"
                                                                name="minus"
                                                                size={TOOLBAR_ICON_SIZE - 4}
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
                </XStack>

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

