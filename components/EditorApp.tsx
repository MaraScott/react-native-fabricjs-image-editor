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
import { Button, Image, Text, XStack, YStack, useWindowDimensions, Theme } from 'tamagui';
// import { CiZoomIn } from "react-icons/ci";
import type { KonvaEventObject, StageType, Vector2d } from '../types/konva';
import { useHistory } from '../hooks/useHistory';
import type {
    EditorDocument,
    EditorElement,
    EditorLayer,
    EditorOptions,
    EditorTheme,
    CircleElement,
    EllipseElement,
    FrameElement,
    GuideElement,
    ImageElement,
    LineElement,
    PathElement,
    PencilElement,
    RectElement,
    TextElement,
    TriangleElement,
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
import { applyThemeToBody, persistTheme, resolveInitialTheme } from '../utils/theme';

import EditorStageViewport from './editor/EditorStageViewport';
import PrimaryToolbar from './editor/PrimaryToolbar';
import ThemeSwitcher from './editor/ThemeSwitcher';
import { ExportActions, HistoryActions } from './editor/ToolbarActions';
import type { DragBoundFactory, SelectionRect, Tool } from './editor/types';

import {
    SidebarContainer,
    SidebarPanel,
    SidebarScroll,
    SidebarToggle,
    SidebarToggleLabel,
    SidebarContent,
} from '../../../../theme/ui/styles'

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

interface TinyArtistMediaSize {
    url: string;
    width?: number;
    height?: number;
}

interface TinyArtistMediaItem {
    id: number;
    title?: string;
    file?: string;
    sizes?: Record<string, TinyArtistMediaSize>;
}

interface WordPressConfig {
    restUrl: string;
    nonce: string;
    username?: string;
    userMedia?: TinyArtistMediaItem[];
}

type PartialWordPressConfig = Partial<WordPressConfig> & {
    restUrl?: string;
    nonce?: string;
    userMedia?: TinyArtistMediaItem[];
};

interface NormalizedMediaItem {
    id: number;
    title: string;
    url: string;
    previewUrl: string;
    width?: number;
    height?: number;
    sizes: Record<string, TinyArtistMediaSize>;
}

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

function normalizeRestUrl(restUrl?: string | null): string {
    if (!restUrl) {
        return '';
    }
    return restUrl.endsWith('/') ? restUrl : `${restUrl}/`;
}

function sanitizeFileName(value: string | null | undefined, fallbackBase: string): string {
    const raw = (value ?? '').trim();
    const cleaned = raw
        .replace(/[^a-z0-9._-]+/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    const base = cleaned || fallbackBase;
    const lower = base.toLowerCase();
    return lower.endsWith('.png') ? lower : `${lower}.png`;
}

function extractWpConfig(source: any): PartialWordPressConfig | null {
    if (!source || typeof source !== 'object') {
        return null;
    }

    const restUrl: string | undefined =
        source.restUrl || source.rest_url || source.root || source.apiRoot;
    const nonce: string | undefined =
        source.nonce || source.wpApiNonce || source.wp_rest?.nonce || source.apiNonce;
    const username: string | undefined =
        source.username || source.current_user || source.currentUser || source.user_login;
    const userMedia: TinyArtistMediaItem[] | undefined = Array.isArray(source.user_media)
        ? source.user_media
        : undefined;

    if (!restUrl || !nonce) {
        return null;
    }

    return {
        restUrl: normalizeRestUrl(restUrl),
        nonce,
        username,
        userMedia,
    } satisfies PartialWordPressConfig;
}

function mergeWpConfig(base: WordPressConfig | null, incoming: PartialWordPressConfig | null): WordPressConfig | null {
    if (!incoming) {
        return base;
    }

    const restUrl = incoming.restUrl ? normalizeRestUrl(incoming.restUrl) : base?.restUrl;
    const nonce = incoming.nonce ?? base?.nonce;

    if (!restUrl || !nonce) {
        return base;
    }

    const username = incoming.username ?? base?.username;
    const userMedia = incoming.userMedia ?? base?.userMedia;

    if (
        base &&
        base.restUrl === restUrl &&
        base.nonce === nonce &&
        base.username === username &&
        base.userMedia === userMedia
    ) {
        return base;
    }

    return {
        restUrl,
        nonce,
        username,
        userMedia,
    };
}

function mapUserMediaToOptions(list?: TinyArtistMediaItem[] | null): NormalizedMediaItem[] {
    if (!Array.isArray(list) || list.length === 0) {
        return [];
    }

    return list
        .map((item) => {
            if (!item) {
                return null;
            }

            const sizes = item.sizes ?? {};
            const full = sizes.full ?? Object.values(sizes)[0];
            const url = full?.url;
            if (!url) {
                return null;
            }
            const preview = sizes.thumbnail?.url ?? sizes.medium?.url ?? url;
            const title = item.title || item.file || `Media ${item.id}`;

            return {
                id: typeof item.id === 'number' ? item.id : Number(item.id) || Date.now(),
                title,
                url,
                previewUrl: preview,
                width: full?.width,
                height: full?.height,
                sizes,
            } satisfies NormalizedMediaItem;
        })
        .filter((item): item is NormalizedMediaItem => Boolean(item));
}

function resolveInitialWpConfig(): WordPressConfig | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const sources: any[] = [];
    const selfAny = window as any;

    if (selfAny.TA_VAR) {
        sources.push(selfAny.TA_VAR);
    }
    if (selfAny.wpApiSettings) {
        sources.push(selfAny.wpApiSettings);
    }

    try {
        if (window.parent && window.parent !== window) {
            const parentAny = window.parent as any;
            if (parentAny.TA_VAR) {
                sources.push(parentAny.TA_VAR);
            }
            if (parentAny.wpApiSettings) {
                sources.push(parentAny.wpApiSettings);
            }
        }
    } catch (error) {
        // Accessing window.parent can throw when cross-origin. Ignore.
    }

    for (const source of sources) {
        const config = extractWpConfig(source);
        if (config) {
            return mergeWpConfig(null, config);
        }
    }

    return null;
}

function createTimestampSlug(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
}

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

function isElementInsideSelection(element: EditorElement, rect: SelectionRect): boolean {
    const bounds = getElementBounds(element, { x: element.x, y: element.y });
    if (!bounds) {
        return false;
    }
    const withinHorizontal = bounds.left >= rect.x && bounds.right <= rect.x + rect.width;
    const withinVertical = bounds.top >= rect.y && bounds.bottom <= rect.y + rect.height;
    return withinHorizontal && withinVertical;
}

function clampElementPositionToStage(
    element: EditorElement,
    position: Vector2d,
    stageSize: { width: number; height: number },
): Vector2d {
    const bounds = getElementBounds(element, position);
    if (!bounds) {
        return position;
    }

    const stageWidth = Number.isFinite(stageSize.width) ? Math.max(0, stageSize.width) : 0;
    const stageHeight = Number.isFinite(stageSize.height) ? Math.max(0, stageSize.height) : 0;

    const leftOffset = bounds.left - position.x;
    const rightOffset = bounds.right - position.x;
    const topOffset = bounds.top - position.y;
    const bottomOffset = bounds.bottom - position.y;

    const minX = -leftOffset;
    const maxX = stageWidth - rightOffset;
    const minY = -topOffset;
    const maxY = stageHeight - bottomOffset;

    let x = position.x;
    let y = position.y;

    if (Number.isFinite(minX) && Number.isFinite(maxX)) {
        if (minX <= maxX) {
            x = Math.min(maxX, Math.max(minX, x));
        } else {
            x = (minX + maxX) / 2;
        }
    } else if (Number.isFinite(minX)) {
        x = Math.max(minX, x);
    } else if (Number.isFinite(maxX)) {
        x = Math.min(maxX, x);
    }

    if (Number.isFinite(minY) && Number.isFinite(maxY)) {
        if (minY <= maxY) {
            y = Math.min(maxY, Math.max(minY, y));
        } else {
            y = (minY + maxY) / 2;
        }
    } else if (Number.isFinite(minY)) {
        y = Math.max(minY, y);
    } else if (Number.isFinite(maxY)) {
        y = Math.min(maxY, y);
    }

    return { x, y };
}

interface LayerElementSnapshot {
    offsetX: number;
    offsetY: number;
    rotation?: number;
    width?: number;
    height?: number;
    radius?: number;
    radiusX?: number;
    radiusY?: number;
    cornerRadius?: number;
    strokeWidth?: number;
    fontSize?: number;
    letterSpacing?: number;
    padding?: number;
    lineHeight?: number;
    pointerLength?: number;
    pointerWidth?: number;
    points?: number[];
}

function createLayerElementSnapshot(element: EditorElement, bounds: { x: number; y: number }): LayerElementSnapshot | null {
    const offsetX = element.x - bounds.x;
    const offsetY = element.y - bounds.y;
    const rotation = element.rotation;

    switch (element.type) {
        case 'rect':
        case 'frame':
        case 'triangle':
            return {
                offsetX,
                offsetY,
                rotation,
                width: element.width,
                height: element.height,
                cornerRadius: 'cornerRadius' in element ? element.cornerRadius : undefined,
                strokeWidth: element.strokeWidth,
            };
        case 'image':
            return {
                offsetX,
                offsetY,
                rotation,
                width: element.width,
                height: element.height,
                cornerRadius: element.cornerRadius,
            };
        case 'circle':
            return {
                offsetX,
                offsetY,
                rotation,
                radius: element.radius,
                strokeWidth: element.strokeWidth,
            };
        case 'ellipse':
            return {
                offsetX,
                offsetY,
                rotation,
                radiusX: element.radiusX,
                radiusY: element.radiusY,
                strokeWidth: element.strokeWidth,
            };
        case 'text':
            return {
                offsetX,
                offsetY,
                rotation,
                width: element.width,
                fontSize: element.fontSize,
                padding: element.padding,
                strokeWidth: element.strokeWidth,
                letterSpacing: element.letterSpacing,
                lineHeight: element.lineHeight,
            };
        case 'line':
            return {
                offsetX,
                offsetY,
                rotation,
                points: [...element.points],
                strokeWidth: element.strokeWidth,
                pointerLength: element.pointerLength,
                pointerWidth: element.pointerWidth,
            };
        case 'path':
        case 'pencil':
            return {
                offsetX,
                offsetY,
                rotation,
                points: [...element.points],
                strokeWidth: element.strokeWidth,
            };
        default:
            return {
                offsetX,
                offsetY,
                rotation,
            };
    }
}

function createDragBound(options: EditorOptions, guides: GuideElement[]): DragBoundFactory {
    const stageSize = { width: Math.max(0, options.width), height: Math.max(0, options.height) };
    const snapToGrid = options.snapToGrid && options.gridSize > 0;
    const snapToGuides = options.snapToGuides && guides.length > 0;

    const verticalGuides = snapToGuides
        ? guides.filter((guide) => guide.orientation === 'vertical').map((guide) => guide.x)
        : [];
    const horizontalGuides = snapToGuides
        ? guides.filter((guide) => guide.orientation === 'horizontal').map((guide) => guide.y)
        : [];

    return (element: EditorElement) => {
        return (position: Vector2d) => {
            let { x, y } = position;

            if (snapToGrid) {
                const grid = Math.max(2, options.gridSize);
                x = Math.round(x / grid) * grid;
                y = Math.round(y / grid) * grid;
            }

            if (snapToGuides && (verticalGuides.length > 0 || horizontalGuides.length > 0)) {
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

            return clampElementPositionToStage(element, { x, y }, stageSize);
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
    initialTheme?: EditorTheme;
}

export default function EditorApp({ initialDesign, initialOptions, initialTheme }: EditorAppProps) {
    const [options, setOptions] = useState<EditorOptions>(getInitialOptions(initialOptions));
    const [editorTheme, setEditorTheme] = useState<EditorTheme>(
        () => initialTheme ?? resolveInitialTheme(),
    );
    const stageRef = useRef<StageType | null>(null);
    const editorCanvasRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const initialWpConfig = useMemo(() => resolveInitialWpConfig(), []);
    const [wpConfig, setWpConfig] = useState<WordPressConfig | null>(initialWpConfig);
    const [wpMedia, setWpMedia] = useState<NormalizedMediaItem[]>(() =>
        mapUserMediaToOptions(initialWpConfig?.userMedia),
    );
    const [isMediaPickerOpen, setMediaPickerOpen] = useState(false);
    const [isMediaLoading, setMediaLoading] = useState(false);
    const [mediaError, setMediaError] = useState<string | null>(null);
    const [isSavingToWp, setIsSavingToWp] = useState(false);
    const [desiredFileName, setDesiredFileName] = useState<string | null>(null);
    const hasWpCredentials = Boolean(wpConfig?.restUrl && wpConfig?.nonce);

    useEffect(() => {
        const cleanup = applyThemeToBody(editorTheme);
        persistTheme(editorTheme);
        return cleanup;
    }, [editorTheme]);

    const handleThemeChange = useCallback((nextTheme: EditorTheme) => {
        setEditorTheme(nextTheme);
    }, []);

    const applyWpConfig = useCallback((incoming: PartialWordPressConfig | null | undefined) => {
        if (!incoming) {
            return;
        }
        setWpConfig((current) => {
            const next = mergeWpConfig(current, incoming);
            if (next && (next !== current || next.userMedia !== current?.userMedia)) {
                setWpMedia(mapUserMediaToOptions(next.userMedia));
            }
            return next;
        });
    }, []);

    const refreshUserMedia = useCallback(async () => {
        if (!wpConfig?.restUrl || !wpConfig.nonce) {
            return;
        }
        setMediaLoading(true);
        setMediaError(null);
        try {
            const response = await fetch(`${wpConfig.restUrl}marascott/v1/ta-var`, {
                headers: { 'X-WP-Nonce': wpConfig.nonce },
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            applyWpConfig({
                restUrl: data?.rest_url ?? wpConfig.restUrl,
                nonce: data?.nonce ?? wpConfig.nonce,
                username: data?.username ?? data?.current_user ?? wpConfig.username,
                userMedia: Array.isArray(data?.user_media) ? data.user_media : undefined,
            });
        } catch (error) {
            console.error('Failed to fetch WordPress media', error);
            setMediaError(error instanceof Error ? error.message : String(error));
        } finally {
            setMediaLoading(false);
        }
    }, [applyWpConfig, wpConfig]);

    const openMediaPicker = useCallback(() => {
        if (!hasWpCredentials) {
            fileInputRef.current?.click();
            return;
        }
        setMediaError(null);
        setMediaPickerOpen(true);
        if (wpMedia.length === 0 && !isMediaLoading) {
            void refreshUserMedia();
        }
    }, [hasWpCredentials, isMediaLoading, refreshUserMedia, wpMedia.length]);

    const closeMediaPicker = useCallback(() => {
        setMediaPickerOpen(false);
    }, []);

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
    const [cropState, setCropState] = useState<{
        elementId: string;
        originalImage: ImageElement;
        cropArea: { x: number; y: number; width: number; height: number };
    } | null>(null);
    const [drawSettings, setDrawSettings] = useState(DEFAULT_DRAW);
    const handleDrawSettingsChange = useCallback((updates: Partial<typeof DEFAULT_DRAW>) => {
        setDrawSettings((current) => ({ ...current, ...updates }));
    }, []);
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

        if (isPanMode || activeTool === 'pan' || isPanning) {
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
    }, [activeTool, isPanMode, isPanning, restoreStageCursor]);

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

    const selectedElements = useMemo(
        () => contentElements.filter((element) => selectedIds.includes(element.id)),
        [contentElements, selectedIds],
    );

    const layerMap = useMemo(() => {
        const map = new Map<string, EditorLayer>();
        layers.forEach((layer) => {
            map.set(layer.id, layer);
        });
        return map;
    }, [layers]);

    const layerSelection = useMemo(() => {
        if (selectedElements.length === 0) {
            return null;
        }

        const layerIds = new Set(
            selectedElements
                .map((element) => (element.layerId ? element.layerId : null))
                .filter((layerId): layerId is string => layerId !== null),
        );
        if (layerIds.size !== 1) {
            return null;
        }

        const [layerId] = Array.from(layerIds);
        const layer = layerMap.get(layerId) ?? null;
        if (!layer) {
            return null;
        }

        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        selectedElements.forEach((element) => {
            const bounds = getElementBounds(element, { x: element.x, y: element.y });
            if (!bounds) {
                return;
            }
            minX = Math.min(minX, bounds.left);
            minY = Math.min(minY, bounds.top);
            maxX = Math.max(maxX, bounds.right);
            maxY = Math.max(maxY, bounds.bottom);
        });

        if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
            return null;
        }

        return {
            layerId,
            elementIds: selectedElements.map((element) => element.id),
            locked: layer.locked,
            bounds: {
                x: minX,
                y: minY,
                width: Math.max(1, maxX - minX),
                height: Math.max(1, maxY - minY),
                rotation: 0,
            },
        } as const;
    }, [layerMap, selectedElements]);

    const layerSelectionTransformRef = useRef<{
        bounds: { x: number; y: number; width: number; height: number; rotation: number };
        elements: Map<string, LayerElementSnapshot>;
    } | null>(null);

    useEffect(() => {
        layerSelectionTransformRef.current = null;
    }, [layerSelection]);

    const templates = useMemo(() => createDefaultTemplates(options), [options.width, options.height, options.backgroundColor]);
    const frames = useMemo(() => createDefaultFrames(options), [options.width, options.height]);

    const { postMessage } = useBridge();

    useEffect(() => {
        postMessage('requestConfig');
    }, [postMessage]);

    const updateElements = useCallback(
        (updater: (elements: EditorElement[]) => EditorElement[]) => {
            setDesign((current) => {
                const nextLayers = current.layers.length > 0 ? current.layers : [createLayerDefinition('Layer 1')];
                const stageSize = { width: stageWidth, height: stageHeight };
                const updatedElements = updater(current.elements).map((element) => {
                    const { x, y } = clampElementPositionToStage(element, { x: element.x, y: element.y }, stageSize);
                    if (x !== element.x || y !== element.y) {
                        return { ...element, x, y };
                    }
                    return element;
                });
                return {
                    ...current,
                    layers: nextLayers,
                    elements: orderElementsByLayer(updatedElements, nextLayers),
                };
            });
        },
        [setDesign, stageHeight, stageWidth],
    );

    const handleMoveLayerSelection = useCallback(
        (delta: Vector2d) => {
            if (!layerSelection || layerSelection.locked) {
                return;
            }

            if (delta.x === 0 && delta.y === 0) {
                return;
            }

            const idSet = new Set(layerSelection.elementIds);
            updateElements((current) =>
                current.map((element) =>
                    idSet.has(element.id)
                        ? ({ ...element, x: element.x + delta.x, y: element.y + delta.y } as EditorElement)
                        : element,
                ),
            );
        },
        [layerSelection, updateElements],
    );

    const handleLayerSelectionTransformStart = useCallback(() => {
        if (!layerSelection || layerSelection.locked || layerSelection.elementIds.length <= 1) {
            layerSelectionTransformRef.current = null;
            return;
        }

        const originalBounds = layerSelection.bounds;
        const snapshot = new Map<string, LayerElementSnapshot>();
        const contentMap = new Map(contentElements.map((element) => [element.id, element]));
        layerSelection.elementIds.forEach((id) => {
            const element = contentMap.get(id);
            if (!element) return;
            const elementSnapshot = createLayerElementSnapshot(element, originalBounds);
            if (elementSnapshot) {
                snapshot.set(id, elementSnapshot);
            }
        });

        if (snapshot.size === 0) {
            layerSelectionTransformRef.current = null;
            return;
        }

        layerSelectionTransformRef.current = {
            bounds: { ...originalBounds },
            elements: snapshot,
        };
    }, [contentElements, layerSelection]);

    const handleLayerSelectionTransform = useCallback(
        (nextBounds: { x: number; y: number; width: number; height: number; rotation: number }) => {
            let state = layerSelectionTransformRef.current;
            if (!state) {
                handleLayerSelectionTransformStart();
                state = layerSelectionTransformRef.current;
                if (!state) {
                    return;
                }
            }

            const { bounds: original, elements: snapshots } = state;
            if (snapshots.size === 0) {
                return;
            }

            const scaleXRaw = original.width !== 0 ? nextBounds.width / original.width : 1;
            const scaleYRaw = original.height !== 0 ? nextBounds.height / original.height : 1;
            const scaleX = Number.isFinite(scaleXRaw) ? Math.max(0.01, scaleXRaw) : 1;
            const scaleY = Number.isFinite(scaleYRaw) ? Math.max(0.01, scaleYRaw) : 1;
            const averageScale = (scaleX + scaleY) / 2;

            // Calculate rotation delta
            const rotationDelta = nextBounds.rotation - (original.rotation ?? 0);

            updateElements((current) =>
                current.map((element) => {
                    const snapshot = snapshots.get(element.id);
                    if (!snapshot) {
                        return element;
                    }

                    const nextElement = { ...element } as EditorElement;

                    // Default position calculation
                    let elementScaleX = scaleX;
                    let elementScaleY = scaleY;

                    // For images with keepRatio, calculate the actual scale used
                    if (element.type === 'image') {
                        const image = element as ImageElement;
                        if (image.keepRatio) {
                            const ratioScale = Math.min(scaleX, scaleY);
                            elementScaleX = ratioScale;
                            elementScaleY = ratioScale;
                        }
                    }

                    nextElement.x = nextBounds.x + snapshot.offsetX * elementScaleX;
                    nextElement.y = nextBounds.y + snapshot.offsetY * elementScaleY;

                    switch (element.type) {
                        case 'rect':
                        case 'frame': {
                            const rect = nextElement as RectElement;
                            const baseWidth = snapshot.width ?? rect.width;
                            const baseHeight = snapshot.height ?? rect.height;
                            rect.width = Math.max(1, baseWidth * scaleX);
                            rect.height = Math.max(1, baseHeight * scaleY);
                            if (snapshot.cornerRadius !== undefined) {
                                rect.cornerRadius = Math.max(0, snapshot.cornerRadius * averageScale);
                            }
                            if (snapshot.strokeWidth !== undefined) {
                                rect.strokeWidth = Math.max(0, snapshot.strokeWidth * averageScale);
                            }
                            break;
                        }
                        case 'triangle': {
                            const triangle = nextElement as TriangleElement;
                            const baseWidth = snapshot.width ?? triangle.width;
                            const baseHeight = snapshot.height ?? triangle.height;
                            triangle.width = Math.max(1, baseWidth * scaleX);
                            triangle.height = Math.max(1, baseHeight * scaleY);
                            if (snapshot.strokeWidth !== undefined) {
                                triangle.strokeWidth = Math.max(0, snapshot.strokeWidth * averageScale);
                            }
                            break;
                        }
                        case 'image': {
                            const image = nextElement as ImageElement;
                            const baseWidth = snapshot.width ?? image.width;
                            const baseHeight = snapshot.height ?? image.height;
                            if (image.keepRatio) {
                                const ratioScale = Math.min(scaleX, scaleY);
                                image.width = Math.max(1, baseWidth * ratioScale);
                                image.height = Math.max(1, baseHeight * ratioScale);
                            } else {
                                image.width = Math.max(1, baseWidth * scaleX);
                                image.height = Math.max(1, baseHeight * scaleY);
                            }
                            if (snapshot.cornerRadius !== undefined) {
                                image.cornerRadius = Math.max(0, snapshot.cornerRadius * averageScale);
                            }
                            break;
                        }
                        case 'circle': {
                            const circle = nextElement as CircleElement;
                            if (snapshot.radius !== undefined) {
                                circle.radius = Math.max(1, snapshot.radius * averageScale);
                            }
                            if (snapshot.strokeWidth !== undefined) {
                                circle.strokeWidth = Math.max(0, snapshot.strokeWidth * averageScale);
                            }
                            break;
                        }
                        case 'ellipse': {
                            const ellipse = nextElement as EllipseElement;
                            if (snapshot.radiusX !== undefined) {
                                ellipse.radiusX = Math.max(1, snapshot.radiusX * scaleX);
                            }
                            if (snapshot.radiusY !== undefined) {
                                ellipse.radiusY = Math.max(1, snapshot.radiusY * scaleY);
                            }
                            if (snapshot.strokeWidth !== undefined) {
                                ellipse.strokeWidth = Math.max(0, snapshot.strokeWidth * averageScale);
                            }
                            break;
                        }
                        case 'text': {
                            const text = nextElement as TextElement;
                            const baseWidth = snapshot.width ?? text.width;
                            text.width = Math.max(1, baseWidth * scaleX);
                            if (snapshot.fontSize !== undefined) {
                                text.fontSize = Math.max(1, snapshot.fontSize * averageScale);
                            }
                            if (snapshot.padding !== undefined) {
                                text.padding = Math.max(0, snapshot.padding * averageScale);
                            }
                            if (snapshot.letterSpacing !== undefined) {
                                text.letterSpacing = snapshot.letterSpacing * averageScale;
                            }
                            if (snapshot.lineHeight !== undefined) {
                                text.lineHeight = snapshot.lineHeight * scaleY;
                            }
                            if (snapshot.strokeWidth !== undefined) {
                                text.strokeWidth = Math.max(0, snapshot.strokeWidth * averageScale);
                            }
                            break;
                        }
                        case 'line': {
                            const line = nextElement as LineElement;
                            if (snapshot.points) {
                                const scaledPoints = snapshot.points.map((value, index) =>
                                    index % 2 === 0 ? value * scaleX : value * scaleY,
                                );
                                line.points = scaledPoints;
                            }
                            if (snapshot.strokeWidth !== undefined) {
                                line.strokeWidth = Math.max(0, snapshot.strokeWidth * averageScale);
                            }
                            if (snapshot.pointerLength !== undefined) {
                                line.pointerLength = snapshot.pointerLength * averageScale;
                            }
                            if (snapshot.pointerWidth !== undefined) {
                                line.pointerWidth = snapshot.pointerWidth * averageScale;
                            }
                            break;
                        }
                        case 'path': {
                            const path = nextElement as PathElement;
                            if (snapshot.points) {
                                const scaledPoints = snapshot.points.map((value, index) =>
                                    index % 2 === 0 ? value * scaleX : value * scaleY,
                                );
                                path.points = scaledPoints;
                            }
                            if (snapshot.strokeWidth !== undefined) {
                                path.strokeWidth = Math.max(0, snapshot.strokeWidth * averageScale);
                            }
                            break;
                        }
                        case 'pencil': {
                            const pencil = nextElement as PencilElement;
                            if (snapshot.points) {
                                const scaledPoints = snapshot.points.map((value, index) =>
                                    index % 2 === 0 ? value * scaleX : value * scaleY,
                                );
                                pencil.points = scaledPoints;
                            }
                            if (snapshot.strokeWidth !== undefined) {
                                pencil.strokeWidth = Math.max(0, snapshot.strokeWidth * averageScale);
                            }
                            break;
                        }
                        default:
                            break;
                    }

                    // Apply rotation delta if rotation has changed
                    if (rotationDelta !== 0 && snapshot.rotation !== undefined) {
                        nextElement.rotation = snapshot.rotation + rotationDelta;
                    }

                    return nextElement;
                }),
            );
        },
        [handleLayerSelectionTransformStart, updateElements],
    );

    const handleLayerSelectionTransformEnd = useCallback(() => {
        layerSelectionTransformRef.current = null;
    }, []);

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

    const handleSelectTool = useCallback(
        (tool: Tool) => {
            setActiveTool(tool);
            if (tool !== 'select') {
                setSelectedIds([]);
            }
            if (tool !== 'draw') {
                setToolSettingsOpen(false);
            }
            if (tool !== 'crop') {
                setCropState(null);
            }
        },
        [setSelectedIds, setToolSettingsOpen],
    );

    const handleCropStart = useCallback(
        (elementId: string) => {
            const element = contentElements.find((el) => el.id === elementId);
            if (!element || element.type !== 'image') return;

            const imageElement = element as ImageElement;
            setCropState({
                elementId,
                originalImage: { ...imageElement },
                cropArea: {
                    x: 0,
                    y: 0,
                    width: imageElement.width,
                    height: imageElement.height,
                },
            });
        },
        [contentElements],
    );

    const handleCropUpdate = useCallback((cropArea: { x: number; y: number; width: number; height: number }) => {
        setCropState((current) => {
            if (!current) return null;
            return {
                ...current,
                cropArea,
            };
        });
    }, []);

    const handleCropApply = useCallback(() => {
        if (!cropState) return;

        const { elementId, cropArea, originalImage } = cropState;
        const element = contentElements.find((el) => el.id === elementId);
        if (!element || element.type !== 'image') return;

        const imageElement = element as ImageElement;

        // Create a canvas to crop the image
        const img = document.createElement('img');
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Calculate the scale factor between displayed size and actual image size
                const scaleX = img.naturalWidth / originalImage.width;
                const scaleY = img.naturalHeight / originalImage.height;

                // Calculate crop area in image coordinates
                const cropX = Math.max(0, cropArea.x * scaleX);
                const cropY = Math.max(0, cropArea.y * scaleY);
                const cropWidth = Math.min(img.naturalWidth - cropX, cropArea.width * scaleX);
                const cropHeight = Math.min(img.naturalHeight - cropY, cropArea.height * scaleY);

                // Set canvas size to cropped dimensions
                canvas.width = cropWidth;
                canvas.height = cropHeight;

                // Draw the cropped portion
                ctx.drawImage(
                    img,
                    cropX,
                    cropY,
                    cropWidth,
                    cropHeight,
                    0,
                    0,
                    cropWidth,
                    cropHeight
                );

                // Convert to data URL
                const croppedDataUrl = canvas.toDataURL('image/png');

                // Update the element with the cropped image
                updateElement(elementId, {
                    src: croppedDataUrl,
                    x: imageElement.x + cropArea.x,
                    y: imageElement.y + cropArea.y,
                    width: cropArea.width,
                    height: cropArea.height,
                });

                setCropState(null);
                setActiveTool('select');
            } catch (error) {
                console.error('Error cropping image:', error);
                // Fallback: just resize the image
                updateElement(elementId, {
                    x: imageElement.x + cropArea.x,
                    y: imageElement.y + cropArea.y,
                    width: cropArea.width,
                    height: cropArea.height,
                });
                setCropState(null);
                setActiveTool('select');
            }
        };

        img.onerror = () => {
            console.error('Error loading image for crop');
            // Fallback: just resize the image
            updateElement(elementId, {
                x: imageElement.x + cropArea.x,
                y: imageElement.y + cropArea.y,
                width: cropArea.width,
                height: cropArea.height,
            });
            setCropState(null);
            setActiveTool('select');
        };

        img.src = imageElement.src;
    }, [cropState, contentElements, updateElement]);

    const handleCropCancel = useCallback(() => {
        setCropState(null);
        setActiveTool('select');
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

    const handleSelectMedia = useCallback(
        (item: NormalizedMediaItem) => {
            if (!item || !item.url) {
                return;
            }
            handleAddImage(item.url, {
                width: item.width ?? options.width,
                height: item.height ?? options.height,
            });
            setMediaPickerOpen(false);
        },
        [handleAddImage, options.height, options.width],
    );

    const handleMediaRefresh = useCallback(() => {
        void refreshUserMedia();
    }, [refreshUserMedia]);

    const handleModalUploadFromDevice = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleRequestImage = useCallback(() => {
        if (window.ReactNativeWebView) {
            postMessage('requestImage', { options });
            return;
        }
        openMediaPicker();
    }, [openMediaPicker, options, postMessage]);

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
        setMediaPickerOpen(false);
    }, [handleAddImage]);

    const saveToWordPress = useCallback(async () => {
        if (isSavingToWp) {
            return;
        }
        if (!wpConfig?.restUrl || !wpConfig.nonce) {
            return;
        }
        const stage = stageRef.current;
        if (!stage) {
            return;
        }

        try {
            setIsSavingToWp(true);
            setMediaError(null);
            postMessage('log', { message: 'Uploading image to WordPress…' });

            const dataUrl = stage.toDataURL({ mimeType: 'image/png' });
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            const fallbackBase = `tinyartist-${createTimestampSlug()}`;
            const fileName = sanitizeFileName(desiredFileName, fallbackBase);

            const formData = new FormData();
            formData.append('file', blob, fileName);

            const uploadUrl = `${wpConfig.restUrl}marascott/v1/media-upload`;
            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'X-WP-Nonce': wpConfig.nonce },
                credentials: 'include',
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error(`HTTP ${uploadResponse.status}`);
            }

            const payload = await uploadResponse.json().catch(() => ({}));

            if (payload?.source_url) {
                const newItem: NormalizedMediaItem = {
                    id: typeof payload.id === 'number' ? payload.id : Number(payload.id) || Date.now(),
                    title: payload.title || fileName,
                    url: payload.source_url,
                    previewUrl: payload.source_url,
                    width: options.width,
                    height: options.height,
                    sizes: {},
                };
                setWpMedia((previous) => [newItem, ...previous]);
                postMessage('mediaUploaded', { id: newItem.id, sourceUrl: newItem.url, fileName });
            }

            await refreshUserMedia();
            postMessage('log', { message: 'Saved image to WordPress media library.' });
        } catch (error) {
            console.error('Upload to WordPress failed', error);
            setMediaError(error instanceof Error ? error.message : String(error));
            postMessage('error', {
                message: 'Unable to upload image to WordPress media library.',
                detail: error instanceof Error ? error.message : String(error),
            });
        } finally {
            setIsSavingToWp(false);
        }
    }, [desiredFileName, isSavingToWp, options.height, options.width, postMessage, refreshUserMedia, wpConfig]);

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

    const handleSelectElement = useCallback((id: string, mode: 'layer' | 'single' | 'toggle' = 'layer') => {
        const element = elements.find((item) => item.id === id) ?? null;
        if (!element) {
            return;
        }

        const elementLayerId = element.layerId ?? null;

        if (mode === 'single') {
            setSelectedIds([id]);
            if (elementLayerId) {
                setActiveLayerId(elementLayerId);
            }
            setActiveTool('select');
            return;
        }

        if (mode === 'toggle') {
            setSelectedIds((current) => {
                const exists = current.includes(id);
                if (exists) {
                    return current.filter((candidate) => candidate !== id);
                }
                return [...current, id];
            });
            if (elementLayerId) {
                setActiveLayerId(elementLayerId);
            }
            setActiveTool('select');
            return;
        }

        if (elementLayerId) {
            setActiveLayerId(elementLayerId);
            const layerElements = contentElements.filter(
                (candidate) =>
                    candidate.layerId === elementLayerId && candidate.visible && !candidate.locked,
            );
            const layerIds = layerElements.map((candidate) => candidate.id);
            setSelectedIds(layerIds.length > 0 ? layerIds : [id]);
        } else {
            setSelectedIds([id]);
        }

        setActiveTool('select');
    }, [contentElements, elements, setActiveLayerId, setActiveTool, setSelectedIds]);

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

            const panActive = isPanMode || activeTool === 'pan';

            if (panActive) {
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
                } else if (activeTool === 'draw') {
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
        void saveToWordPress();
    }, [design, postMessage, saveToWordPress]);

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

    const handleCanvasWidthChange = useCallback(
        (value: number) => {
            if (!Number.isFinite(value)) {
                return;
            }
            setOptions((current) => {
                const nextWidth = Math.max(100, value);
                if (nextWidth === current.width) {
                    return current;
                }
                return { ...current, width: nextWidth };
            });
        },
        [setOptions],
    );

    const handleCanvasHeightChange = useCallback(
        (value: number) => {
            if (!Number.isFinite(value)) {
                return;
            }
            setOptions((current) => {
                const nextHeight = Math.max(100, value);
                if (nextHeight === current.height) {
                    return current;
                }
                return { ...current, height: nextHeight };
            });
        },
        [setOptions],
    );

    const handleCanvasBackgroundChange = useCallback(
        (value: string) => {
            setOptions((current) =>
                current.backgroundColor === value ? current : { ...current, backgroundColor: value },
            );
        },
        [setOptions],
    );

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
                case 'config':
                case 'wpConfig':
                case 'taConfig': {
                    const payload = message.payload?.taConfig ?? message.payload ?? {};
                    applyWpConfig(payload as PartialWordPressConfig);
                    if (typeof payload?.fileName === 'string') {
                        setDesiredFileName(payload.fileName);
                    }
                    break;
                }
                case 'refreshUserMedia': {
                    refreshUserMedia();
                    break;
                }
                case 'setFileName':
                case 'setFilename': {
                    const payload = message.payload;
                    if (typeof payload === 'string') {
                        setDesiredFileName(payload);
                    } else if (payload && typeof payload.fileName === 'string') {
                        setDesiredFileName(payload.fileName);
                    }
                    break;
                }
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
    }, [applyWpConfig, design, handleAddImage, handleClear, handleExport, postMessage, redo, refreshUserMedia, resetDesign, undo]);

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
    const stageCursor = isPanning ? 'grabbing' : isPanMode || activeTool === 'pan' ? 'grab' : undefined;
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

    const displayWidth = Math.round(options.width)
    const displayHeight = Math.round(options.height)
    const hasSelection = selectedIds.length > 0
    const hasClipboard = Boolean(clipboard && clipboard.length > 0)
    const sidebarThemeName = editorTheme === 'kid' ? 'emerald' : 'sapphire'

    return (
        <YStack>
            <Theme name={sidebarThemeName} key={`theme-${sidebarThemeName}`}>
                <SidebarContainer left={0}>
                    {leftOpen ? (
                        <SidebarPanel width={sidebarWidth} padding="0">
                            <SidebarScroll>
                                <SidebarContent>
                                    <YStack className="editor-header">
                                        <HistoryActions
                                            isCompact
                                            canUndo={canUndo}
                                            canRedo={canRedo}
                                            hasSelection={hasSelection}
                                            hasClipboard={hasClipboard}
                                            onUndo={undo}
                                            onRedo={redo}
                                            onCopy={handleCopy}
                                            onPaste={handlePaste}
                                            onDuplicate={handleDuplicate}
                                            onRemoveSelected={removeSelected}
                                            onClear={handleClear}
                                            iconSize={TOOLBAR_ICON_SIZE}
                                        />
                                        <ExportActions
                                            isCompact
                                            onSave={handleSave}
                                            onLoad={handleLoadFromBrowser}
                                            onExport={handleExport}
                                            iconSize={TOOLBAR_ICON_SIZE}
                                        />
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
                    <ThemeSwitcher value={editorTheme} onChange={handleThemeChange} />
                    {!isSmall && (
                        <XStack>
                            <HistoryActions
                                isCompact={false}
                                canUndo={canUndo}
                                canRedo={canRedo}
                                hasSelection={hasSelection}
                                hasClipboard={hasClipboard}
                                onUndo={undo}
                                onRedo={redo}
                                onCopy={handleCopy}
                                onPaste={handlePaste}
                                onDuplicate={handleDuplicate}
                                onRemoveSelected={removeSelected}
                                onClear={handleClear}
                                iconSize={TOOLBAR_ICON_SIZE}
                            />
                            <ExportActions
                                isCompact={false}
                                onSave={handleSave}
                                onLoad={handleLoadFromBrowser}
                                onExport={handleExport}
                                iconSize={TOOLBAR_ICON_SIZE}
                            />
                        </XStack>
                    )}


                </XStack>
                <XStack width={mainLayoutWidth} className="editor-shell-layout" zIndex={0} >
                    <PrimaryToolbar
                        activeTool={activeTool}
                        onSelectTool={handleSelectTool}
                        onAddText={handleAddText}
                        onRequestImage={handleRequestImage}
                        iconSize={TOOLBAR_ICON_SIZE}
                    />

                    <EditorStageViewport
                        stageRef={stageRef}
                        editorCanvasRef={editorCanvasRef}
                        stageWrapperStyle={stageWrapperStyle}
                        stageCanvasStyle={stageCanvasStyle}
                        stageBackgroundStyle={stageBackgroundStyle}
                        stageWidth={stageWidth}
                        stageHeight={stageHeight}
                        stagePosition={stagePosition}
                        options={options}
                        guides={guides}
                        contentElements={contentElements}
                        selectedIds={selectedIds}
                        activeTool={activeTool}
                        layerMap={layerMap}
                        dragBoundFactory={dragBoundFactory}
                        layerSelection={layerSelection}
                        cropState={cropState}
                        onMoveLayerSelection={handleMoveLayerSelection}
                        onLayerSelectionTransformStart={handleLayerSelectionTransformStart}
                        onLayerSelectionTransform={handleLayerSelectionTransform}
                        onLayerSelectionTransformEnd={handleLayerSelectionTransformEnd}
                        onCropStart={handleCropStart}
                        onCropUpdate={handleCropUpdate}
                        onCropApply={handleCropApply}
                        onCropCancel={handleCropCancel}
                        onSelectElement={handleSelectElement}
                        onUpdateElement={updateElement}
                        onStageMouseEnter={handleStageMouseEnter}
                        onStageMouseLeave={handleStageMouseLeave}
                        onStagePointerDown={handleStagePointerDown}
                        onStagePointerMove={handleStagePointerMove}
                        onStagePointerUp={handleStagePointerUp}
                        selectionRect={selectionRect}
                        toolSettingsOpen={toolSettingsOpen}
                        onToolSettingsOpenChange={(open) => setToolSettingsOpen(open)}
                        drawSettings={drawSettings}
                        onDrawSettingsChange={handleDrawSettingsChange}
                        layers={layers}
                        activeLayerId={activeLayerId}
                        onSelectLayer={handleSelectLayer}
                        onToggleVisibility={handleToggleVisibility}
                        onToggleLock={handleToggleLock}
                        onRemoveLayer={handleRemoveLayer}
                        onMoveLayer={handleLayerMove}
                        onAddLayer={handleAddLayer}
                        displayWidth={displayWidth}
                        displayHeight={displayHeight}
                        canvasSizeLocked={options.canvasSizeLocked}
                        fixedCanvas={options.fixedCanvas}
                        onCanvasWidthChange={handleCanvasWidthChange}
                        onCanvasHeightChange={handleCanvasHeightChange}
                        onCanvasBackgroundChange={handleCanvasBackgroundChange}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        sliderValue={sliderValue}
                        sliderBounds={sliderBounds}
                        sliderStep={sliderStep}
                        onSliderChange={handleSliderChange}
                        zoomPercentage={zoomPercentage}
                        isBrowser={isBrowser}
                        rulerStep={rulerStep}
                        iconSize={TOOLBAR_ICON_SIZE}
                    />
                </XStack>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleUploadFile}
                />
                {isMediaPickerOpen ? (
                    <div className="ta-media-modal" role="presentation">
                        <div className="ta-media-modal__backdrop" onClick={closeMediaPicker} />
                        <div
                            className="ta-media-modal__panel"
                            role="dialog"
                            aria-modal="true"
                            aria-label="WordPress media library"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <XStack className="ta-media-modal__toolbar" alignItems="center" justifyContent="space-between">
                                <Text className="ta-media-modal__title">My Media</Text>
                                <XStack gap="$2">
                                    <Button
                                        size="$2"
                                        onPress={handleMediaRefresh}
                                        disabled={isMediaLoading}
                                    >
                                        Refresh
                                    </Button>
                                    <Button size="$2" onPress={handleModalUploadFromDevice}>
                                        Upload
                                    </Button>
                                    <Button size="$2" onPress={closeMediaPicker}>
                                        Close
                                    </Button>
                                </XStack>
                            </XStack>
                            {isSavingToWp ? (
                                <Text className="ta-media-modal__status">Saving image to WordPress…</Text>
                            ) : null}
                            {mediaError ? (
                                <Text className="ta-media-modal__error">{mediaError}</Text>
                            ) : null}
                            {isMediaLoading ? (
                                <Text className="ta-media-modal__status">Loading media…</Text>
                            ) : wpMedia.length === 0 ? (
                                <Text className="ta-media-modal__status">No images found in your library yet.</Text>
                            ) : (
                                <div className="ta-media-grid">
                                    {wpMedia.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className="ta-media-card"
                                            onClick={() => handleSelectMedia(item)}
                                        >
                                            <img src={item.previewUrl} alt={item.title} loading="lazy" />
                                            <span className="ta-media-card__title">{item.title}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </YStack>
        </YStack>
    );
}
