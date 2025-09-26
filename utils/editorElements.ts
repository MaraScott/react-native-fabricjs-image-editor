import type {
  CircleElement,
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
  TriangleElement,
} from '../types/editor';
import { createEditorId } from './ids';

type BaseElementInit = Pick<EditorElement, 'name' | 'x' | 'y' | 'rotation' | 'opacity' | 'metadata'>;

type ElementSpecific<T extends EditorElement> = Omit<T, keyof EditorElement>;

export function createBaseElement(type: EditorElement['type'], init: BaseElementInit) {
  return {
    id: createEditorId(type),
    type,
    draggable: true,
    visible: true,
    locked: false,
    layerId: null,
    ...init,
  } as EditorElement;
}

function mergeElementProps<T extends object>(defaults: T, overrides: Partial<EditorElement>) {
  const result: Record<string, unknown> = { ...defaults };
  (Object.keys(defaults) as (keyof T)[]).forEach((key) => {
    const value = (overrides as Record<string, unknown>)[key as string];
    if (value === undefined) return;
    result[key as string] = Array.isArray(value) ? [...value] : value;
  });
  return result as T;
}

function createBaseWithOverrides<T extends EditorElement>(
  type: T['type'],
  defaults: BaseElementInit,
  overrides: Partial<T>,
) {
  return createBaseElement(type, {
    name: overrides.name ?? defaults.name,
    x: overrides.x ?? defaults.x,
    y: overrides.y ?? defaults.y,
    rotation: overrides.rotation ?? defaults.rotation,
    opacity: overrides.opacity ?? defaults.opacity,
    metadata: overrides.metadata ?? defaults.metadata ?? null,
  });
}

export function createLayerDefinition(name: string): EditorLayer {
  return {
    id: createEditorId('layer'),
    name,
    visible: true,
    locked: false,
  } satisfies EditorLayer;
}

export function assignElementsToLayer<T extends EditorElement>(elements: T[], layerId: string): T[] {
  return elements.map((element) => ({ ...element, layerId }));
}

export function getNextLayerName(layers: EditorLayer[]): string {
  const existing = new Set(layers.map((layer) => layer.name));
  let index = layers.length + 1;
  let candidate = `Layer ${index}`;
  while (existing.has(candidate)) {
    index += 1;
    candidate = `Layer ${index}`;
  }
  return candidate;
}

export function orderElementsByLayer(elements: EditorElement[], layers: EditorLayer[]): EditorElement[] {
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
      const existingBucket = buckets.get(element.layerId) ?? [];
      existingBucket.push(element);
      buckets.set(element.layerId, existingBucket);
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

export function createRect(options: EditorOptions, overrides: Partial<RectElement> = {}): RectElement {
  const base = createBaseWithOverrides<RectElement>(
    'rect',
    {
      name: 'Rectangle',
      x: options.width / 2 - 120,
      y: options.height / 2 - 80,
      rotation: 0,
      opacity: 1,
      metadata: null,
    },
    overrides,
  );

  const props = mergeElementProps<ElementSpecific<RectElement>>(
    {
      width: 240,
      height: 160,
      cornerRadius: 16,
      fill: '#38bdf8',
      stroke: '#0f172a',
      strokeWidth: 4,
    },
    overrides,
  );

  return {
    ...base,
    type: 'rect',
    ...props,
  } satisfies RectElement;
}

export function createFrame(options: EditorOptions, overrides: Partial<FrameElement> = {}): FrameElement {
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

export function createCircle(options: EditorOptions, overrides: Partial<CircleElement> = {}): CircleElement {
  const base = createBaseWithOverrides<CircleElement>(
    'circle',
    {
      name: 'Circle',
      x: options.width / 2,
      y: options.height / 2,
      rotation: 0,
      opacity: 1,
      metadata: null,
    },
    overrides,
  );

  const props = mergeElementProps<ElementSpecific<CircleElement>>(
    {
      radius: 120,
      fill: '#a855f7',
      stroke: '#0f172a',
      strokeWidth: 4,
    },
    overrides,
  );

  return {
    ...base,
    type: 'circle',
    ...props,
  } satisfies CircleElement;
}

export function createEllipse(options: EditorOptions, overrides: Partial<EllipseElement> = {}): EllipseElement {
  const base = createBaseWithOverrides<EllipseElement>(
    'ellipse',
    {
      name: 'Ellipse',
      x: options.width / 2,
      y: options.height / 2,
      rotation: 0,
      opacity: 1,
      metadata: null,
    },
    overrides,
  );

  const props = mergeElementProps<ElementSpecific<EllipseElement>>(
    {
      radiusX: 180,
      radiusY: 120,
      fill: '#22d3ee',
      stroke: '#0f172a',
      strokeWidth: 4,
    },
    overrides,
  );

  return {
    ...base,
    type: 'ellipse',
    ...props,
  } satisfies EllipseElement;
}

export function createTriangle(options: EditorOptions, overrides: Partial<TriangleElement> = {}): TriangleElement {
  const base = createBaseWithOverrides<TriangleElement>(
    'triangle',
    {
      name: 'Triangle',
      x: options.width / 2 - 120,
      y: options.height / 2 - 120,
      rotation: 0,
      opacity: 1,
      metadata: null,
    },
    overrides,
  );

  const props = mergeElementProps<ElementSpecific<TriangleElement>>(
    {
      width: 240,
      height: 240,
      fill: '#f97316',
      stroke: '#0f172a',
      strokeWidth: 4,
    },
    overrides,
  );

  return {
    ...base,
    type: 'triangle',
    ...props,
  } satisfies TriangleElement;
}

export function createLine(options: EditorOptions, overrides: Partial<LineElement> = {}): LineElement {
  const base = createBaseWithOverrides<LineElement>(
    'line',
    {
      name: 'Line',
      x: options.width / 2 - 160,
      y: options.height / 2,
      rotation: 0,
      opacity: 1,
      metadata: null,
    },
    overrides,
  );

  const props = mergeElementProps<ElementSpecific<LineElement>>(
    {
      points: [0, 0, 320, 0],
      stroke: '#0f172a',
      strokeWidth: 6,
      dash: undefined,
      tension: undefined,
      pointerLength: undefined,
      pointerWidth: undefined,
      closed: false,
      fill: undefined,
    },
    overrides,
  );

  return {
    ...base,
    type: 'line',
    ...props,
  } satisfies LineElement;
}

export function createPathElement(options: EditorOptions, overrides: Partial<PathElement> = {}): PathElement {
  const base = createBaseWithOverrides<PathElement>(
    'path',
    {
      name: 'Path',
      x: options.width / 2 - 200,
      y: options.height / 2 - 100,
      rotation: 0,
      opacity: 1,
      metadata: null,
    },
    overrides,
  );

  const props = mergeElementProps<ElementSpecific<PathElement>>(
    {
      points: [0, 0, 120, 40, 200, 120],
      stroke: '#1e3a8a',
      strokeWidth: 5,
      tension: 0.4,
      closed: false,
      fill: undefined,
    },
    overrides,
  );

  return {
    ...base,
    type: 'path',
    ...props,
  } satisfies PathElement;
}

export function createText(options: EditorOptions, overrides: Partial<TextElement> = {}): TextElement {
  const base = createBaseWithOverrides<TextElement>(
    'text',
    {
      name: 'Text',
      x: options.width / 2 - 200,
      y: options.height / 2 - 40,
      rotation: 0,
      opacity: 1,
      metadata: null,
    },
    overrides,
  );

  const props = mergeElementProps<ElementSpecific<TextElement>>(
    {
      text: 'Edit me!',
      fontSize: 48,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontStyle: 'normal',
      fontWeight: 'bold',
      fill: '#f8fafc',
      width: 400,
      align: 'center',
      lineHeight: 1.2,
      letterSpacing: 0,
      stroke: 'transparent',
      strokeWidth: 0,
      backgroundColor: 'transparent',
      padding: 0,
    },
    overrides,
  );

  return {
    ...base,
    type: 'text',
    ...props,
  } satisfies TextElement;
}

export function createImage(options: EditorOptions, src: string, overrides: Partial<ImageElement> = {}): ImageElement {
  const base = createBaseWithOverrides<ImageElement>(
    'image',
    {
      name: 'Image',
      x: options.width / 2 - 160,
      y: options.height / 2 - 120,
      rotation: 0,
      opacity: 1,
      metadata: null,
    },
    overrides,
  );

  const props = mergeElementProps<ElementSpecific<ImageElement>>(
    {
      src,
      width: 320,
      height: 240,
      cornerRadius: 0,
      keepRatio: true,
    },
    overrides,
  );

  return {
    ...base,
    type: 'image',
    ...props,
  } satisfies ImageElement;
}

export function createGuide(options: EditorOptions, orientation: GuideElement['orientation']): GuideElement {
  const base = createBaseWithOverrides<GuideElement>(
    'guide',
    {
      name: orientation === 'horizontal' ? 'Horizontal guide' : 'Vertical guide',
      x: orientation === 'vertical' ? options.width / 2 : 0,
      y: orientation === 'horizontal' ? options.height / 2 : 0,
      rotation: 0,
      opacity: 1,
      metadata: { isGuide: true, excludeFromExport: true },
    },
    {},
  );

  const props = mergeElementProps<ElementSpecific<GuideElement>>(
    {
      orientation,
      length: orientation === 'horizontal' ? options.width : options.height,
      stroke: 'rgba(56, 189, 248, 0.8)',
      strokeWidth: 1,
    },
    {},
  );

  return {
    ...base,
    type: 'guide',
    ...props,
  } satisfies GuideElement;
}

export function cloneElement(element: EditorElement): EditorElement {
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
      return { ...base, type: 'circle', radius: element.radius } satisfies CircleElement;
    case 'ellipse':
      return { ...base, type: 'ellipse', radiusX: element.radiusX, radiusY: element.radiusY } satisfies EllipseElement;
    case 'triangle':
      return { ...base, type: 'triangle', width: element.width, height: element.height } satisfies TriangleElement;
    case 'line':
      return {
        ...base,
        type: 'line',
        points: [...element.points],
        dash: element.dash ? [...element.dash] : undefined,
      } satisfies LineElement;
    case 'path':
      return { ...base, type: 'path', points: [...element.points], closed: element.closed } satisfies PathElement;
    case 'pencil':
      return { ...base, type: 'pencil', points: [...element.points] } satisfies PencilElement;
    case 'text':
      return { ...base, type: 'text', text: element.text } satisfies TextElement;
    case 'image':
      return { ...base, type: 'image', width: element.width, height: element.height } satisfies ImageElement;
    case 'guide':
      return { ...element, id: createEditorId('guide'), layerId: null } satisfies GuideElement;
    default:
      return base;
  }
}
