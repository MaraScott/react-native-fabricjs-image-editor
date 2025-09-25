import type {
  EditorDesign,
  EditorDocument,
  EditorElement,
  EditorElementType,
  EditorLayer,
  GuideElement,
  ImageElement,
  LineElement,
  PathElement,
  PencilElement,
  RectElement,
  TextElement,
  TriangleElement,
} from '../types/editor';
import { createEditorId } from './ids';

function ensureId(type: EditorElementType, id?: string): string {
  if (typeof id === 'string' && id.trim().length > 0) {
    return id;
  }
  return `${type}-${Math.random().toString(36).slice(2, 10)}`;
}

function createLayer(name: string, id?: string): EditorLayer {
  return {
    id: typeof id === 'string' && id.trim().length > 0 ? id : createEditorId('layer'),
    name: name.trim().length > 0 ? name : 'Layer',
    visible: true,
    locked: false,
  } satisfies EditorLayer;
}

function normaliseLayer(layer: any, index: number): EditorLayer {
  if (!layer || typeof layer !== 'object') {
    return createLayer(`Layer ${index + 1}`);
  }

  const id = typeof layer.id === 'string' && layer.id.trim().length > 0 ? layer.id : createEditorId('layer');
  const name = typeof layer.name === 'string' && layer.name.trim().length > 0 ? layer.name : `Layer ${index + 1}`;

  return {
    id,
    name,
    visible: typeof layer.visible === 'boolean' ? layer.visible : true,
    locked: typeof layer.locked === 'boolean' ? layer.locked : false,
  } satisfies EditorLayer;
}

function ensureLayers(
  elements: EditorElement[],
  layersInput?: EditorLayer[] | null,
): { elements: EditorElement[]; layers: EditorLayer[] } {
  const layers = Array.isArray(layersInput) && layersInput.length > 0
    ? layersInput.map((layer, index) => normaliseLayer(layer, index))
    : [createLayer('Layer 1')];

  const validLayerIds = new Set(layers.map((layer) => layer.id));
  const fallbackLayerId = layers[layers.length - 1]?.id ?? null;

  const patchedElements = elements.map((element) => {
    if (element.type === 'guide') {
      if (element.layerId !== null) {
        return { ...element, layerId: null };
      }
      return element;
    }

    if (element.layerId && validLayerIds.has(element.layerId)) {
      return element;
    }

    if (fallbackLayerId) {
      return { ...element, layerId: fallbackLayerId };
    }

    return element;
  });

  return { elements: patchedElements, layers };
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampOpacity(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
}

function normaliseBase(element: Partial<EditorElement>, type: EditorElementType) {
  return {
    id: ensureId(type, element.id),
    type,
    name: typeof element.name === 'string' && element.name.trim().length > 0 ? element.name : type,
    x: toNumber(element.x, 0),
    y: toNumber(element.y, 0),
    rotation: toNumber(element.rotation, 0),
    opacity: clampOpacity(element.opacity, 1),
    draggable: typeof element.draggable === 'boolean' ? element.draggable : true,
    visible: typeof element.visible === 'boolean' ? element.visible : true,
    locked: typeof element.locked === 'boolean' ? element.locked : false,
    layerId:
      typeof element.layerId === 'string' && element.layerId.trim().length > 0
        ? element.layerId
        : null,
    metadata: element.metadata ?? null,
  };
}

function normaliseRect(element: any, type: 'rect' | 'frame'): RectElement {
  const base = normaliseBase(element, type);
  return {
    ...base,
    type,
    width: Math.max(1, toNumber(element.width, 160)),
    height: Math.max(1, toNumber(element.height, 120)),
    cornerRadius: Math.max(0, toNumber(element.cornerRadius, 0)),
    fill: typeof element.fill === 'string' ? element.fill : type === 'frame' ? 'transparent' : '#38bdf8',
    stroke: typeof element.stroke === 'string' ? element.stroke : '#0f172a',
    strokeWidth: Math.max(0, toNumber(element.strokeWidth, type === 'frame' ? 8 : 4)),
  };
}

function normaliseCircle(element: any): EditorElement {
  const base = normaliseBase(element, 'circle');
  return {
    ...base,
    type: 'circle',
    radius: Math.max(1, toNumber(element.radius, 80)),
    fill: typeof element.fill === 'string' ? element.fill : '#a855f7',
    stroke: typeof element.stroke === 'string' ? element.stroke : '#0f172a',
    strokeWidth: Math.max(0, toNumber(element.strokeWidth, 4)),
  } satisfies EditorElement;
}

function normaliseEllipse(element: any): EditorElement {
  const base = normaliseBase(element, 'ellipse');
  return {
    ...base,
    type: 'ellipse',
    radiusX: Math.max(1, toNumber(element.radiusX, 120)),
    radiusY: Math.max(1, toNumber(element.radiusY, 80)),
    fill: typeof element.fill === 'string' ? element.fill : '#22d3ee',
    stroke: typeof element.stroke === 'string' ? element.stroke : '#0f172a',
    strokeWidth: Math.max(0, toNumber(element.strokeWidth, 4)),
  } satisfies EditorElement;
}

function normaliseTriangle(element: any): TriangleElement {
  const base = normaliseBase(element, 'triangle');
  return {
    ...base,
    type: 'triangle',
    width: Math.max(1, toNumber(element.width, 160)),
    height: Math.max(1, toNumber(element.height, 140)),
    fill: typeof element.fill === 'string' ? element.fill : '#f97316',
    stroke: typeof element.stroke === 'string' ? element.stroke : '#0f172a',
    strokeWidth: Math.max(0, toNumber(element.strokeWidth, 4)),
  };
}

function normaliseText(element: any): TextElement {
  const base = normaliseBase(element, 'text');
  return {
    ...base,
    type: 'text',
    text: typeof element.text === 'string' ? element.text : 'Edit me!',
    fontSize: Math.max(1, toNumber(element.fontSize, 32)),
    fontFamily:
      typeof element.fontFamily === 'string'
        ? element.fontFamily
        : 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontStyle: element.fontStyle === 'italic' ? 'italic' : 'normal',
    fontWeight: element.fontWeight === 'bold' ? 'bold' : 'normal',
    fill: typeof element.fill === 'string' ? element.fill : '#0f172a',
    width: Math.max(16, toNumber(element.width, 300)),
    align: element.align === 'right' || element.align === 'center' ? element.align : 'center',
    lineHeight: Math.max(0.2, toNumber(element.lineHeight, 1.2)),
    letterSpacing: toNumber(element.letterSpacing, 0),
    stroke: typeof element.stroke === 'string' ? element.stroke : 'transparent',
    strokeWidth: Math.max(0, toNumber(element.strokeWidth, 0)),
    backgroundColor: typeof element.backgroundColor === 'string' ? element.backgroundColor : 'transparent',
    padding: Math.max(0, toNumber(element.padding, 0)),
  };
}

function normaliseImage(element: any): ImageElement {
  const base = normaliseBase(element, 'image');
  return {
    ...base,
    type: 'image',
    src: typeof element.src === 'string' ? element.src : '',
    width: Math.max(1, toNumber(element.width, 320)),
    height: Math.max(1, toNumber(element.height, 240)),
    cornerRadius: Math.max(0, toNumber(element.cornerRadius, 0)),
    keepRatio: typeof element.keepRatio === 'boolean' ? element.keepRatio : true,
  } satisfies ImageElement;
}

function normaliseLine(element: any): LineElement {
  const base = normaliseBase(element, 'line');
  const points = Array.isArray(element.points) ? [...element.points.map((value: unknown) => Number(value) || 0)] : [0, 0, 120, 0];
  return {
    ...base,
    type: 'line',
    points,
    stroke: typeof element.stroke === 'string' ? element.stroke : '#0f172a',
    strokeWidth: Math.max(1, toNumber(element.strokeWidth, 4)),
    dash: Array.isArray(element.dash) ? element.dash.map((value: unknown) => Math.max(0, Number(value) || 0)) : undefined,
    tension: Number.isFinite(Number(element.tension)) ? Number(element.tension) : undefined,
    pointerLength: Number.isFinite(Number(element.pointerLength)) ? Number(element.pointerLength) : undefined,
    pointerWidth: Number.isFinite(Number(element.pointerWidth)) ? Number(element.pointerWidth) : undefined,
    closed: Boolean(element.closed),
    fill: typeof element.fill === 'string' ? element.fill : undefined,
  };
}

function normalisePath(element: any): PathElement {
  const base = normaliseBase(element, 'path');
  const points = Array.isArray(element.points) ? [...element.points.map((value: unknown) => Number(value) || 0)] : [0, 0, 160, 40];
  return {
    ...base,
    type: 'path',
    points,
    stroke: typeof element.stroke === 'string' ? element.stroke : '#0f172a',
    strokeWidth: Math.max(1, toNumber(element.strokeWidth, 3)),
    tension: Number.isFinite(Number(element.tension)) ? Number(element.tension) : 0.5,
    closed: Boolean(element.closed),
    fill: typeof element.fill === 'string' ? element.fill : undefined,
  };
}

function normalisePencil(element: any): PencilElement {
  const base = normaliseBase(element, 'pencil');
  const points = Array.isArray(element.points) ? [...element.points.map((value: unknown) => Number(value) || 0)] : [0, 0];
  return {
    ...base,
    type: 'pencil',
    points: points.length > 1 ? points : [0, 0, 1, 1],
    stroke: typeof element.stroke === 'string' ? element.stroke : '#2563eb',
    strokeWidth: Math.max(1, toNumber(element.strokeWidth, 4)),
    lineCap: element.lineCap === 'butt' || element.lineCap === 'square' ? element.lineCap : 'round',
    lineJoin: element.lineJoin === 'miter' || element.lineJoin === 'bevel' ? element.lineJoin : 'round',
  };
}

function normaliseGuide(element: any): GuideElement {
  const base = normaliseBase(element, 'guide');
  const orientation = element.orientation === 'horizontal' ? 'horizontal' : 'vertical';
  const metadata = {
    ...(base.metadata ?? {}),
    isGuide: true,
    excludeFromExport: true,
  };

  return {
    ...base,
    type: 'guide',
    orientation,
    length: Math.max(0, toNumber(element.length, orientation === 'vertical' ? 1000 : 1000)),
    stroke: typeof element.stroke === 'string' ? element.stroke : 'rgba(56, 189, 248, 0.85)',
    strokeWidth: Math.max(1, toNumber(element.strokeWidth, 1)),
    metadata,
  } satisfies GuideElement;
}

function normaliseElement(element: any): EditorElement | null {
  if (!element || typeof element !== 'object') {
    return null;
  }

  switch (element.type) {
    case 'rect':
      return normaliseRect(element, 'rect');
    case 'frame':
      return normaliseRect(element, 'frame');
    case 'circle':
      return normaliseCircle(element);
    case 'ellipse':
      return normaliseEllipse(element);
    case 'triangle':
      return normaliseTriangle(element);
    case 'text':
      return normaliseText(element);
    case 'image':
      return normaliseImage(element);
    case 'line':
      return normaliseLine(element);
    case 'path':
      return normalisePath(element);
    case 'pencil':
      return normalisePencil(element);
    case 'guide':
      return normaliseGuide(element);
    default:
      if (typeof element.width === 'number' && typeof element.height === 'number') {
        return normaliseRect({ ...element, type: 'rect' }, 'rect');
      }
      return null;
  }
}

export function createEmptyDesign(): EditorDocument {
  const baseLayer = createLayer('Layer 1');
  return { elements: [], layers: [baseLayer], metadata: null };
}

export function serializeDesign(document: EditorDocument): EditorDesign {
  return {
    elements: document.elements.map((element) => ({ ...element })),
    layers: document.layers.map((layer) => ({ ...layer })),
    metadata: document.metadata ?? null,
  };
}

export function stringifyDesign(document: EditorDocument): string {
  return JSON.stringify(serializeDesign(document));
}

export function parseDesign(design: string | EditorDesign | null | undefined): EditorDocument | null {
  if (!design) {
    return null;
  }

  try {
    const raw = typeof design === 'string' ? JSON.parse(design) : design;
    if (Array.isArray(raw)) {
      const normalised = raw.map((element) => normaliseElement(element)).filter(Boolean) as EditorElement[];
      const { elements: withLayers, layers } = ensureLayers(normalised, null);
      return { elements: withLayers, layers, metadata: null };
    }
    if (typeof raw === 'object' && raw !== null && Array.isArray((raw as EditorDesign).elements)) {
      const incoming = raw as EditorDesign;
      const normalised = (incoming.elements ?? [])
        .map((element) => normaliseElement(element))
        .filter(Boolean) as EditorElement[];
      const { elements: withLayers, layers } = ensureLayers(normalised, incoming.layers ?? null);
      return {
        elements: withLayers,
        layers,
        metadata: incoming.metadata ?? null,
      } satisfies EditorDocument;
    }
  } catch (error) {
    console.warn('[Editor] Unable to parse design', error);
  }

  return null;
}
