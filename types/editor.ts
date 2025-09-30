export type EditorElementType =
  | 'rect'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'line'
  | 'path'
  | 'pencil'
  | 'text'
  | 'image'
  | 'guide'
  | 'frame';

export interface BaseElement {
  id: string;
  type: EditorElementType;
  name: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  draggable: boolean;
  visible: boolean;
  locked: boolean;
  layerId?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface FillableElement extends BaseElement {
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface RectElement extends FillableElement {
  type: 'rect';
  width: number;
  height: number;
  cornerRadius: number;
}

export interface FrameElement extends RectElement {
  type: 'frame';
}

export interface CircleElement extends FillableElement {
  type: 'circle';
  radius: number;
}

export interface EllipseElement extends FillableElement {
  type: 'ellipse';
  radiusX: number;
  radiusY: number;
}

export interface TriangleElement extends FillableElement {
  type: 'triangle';
  width: number;
  height: number;
}

export interface LineElement extends BaseElement {
  type: 'line';
  points: number[];
  stroke: string;
  strokeWidth: number;
  dash?: number[];
  tension?: number;
  pointerLength?: number;
  pointerWidth?: number;
  closed?: boolean;
  fill?: string;
}

export interface PathElement extends BaseElement {
  type: 'path';
  points: number[];
  stroke: string;
  strokeWidth: number;
  tension: number;
  closed: boolean;
  fill?: string;
}

export interface PencilStroke {
  id: string;
  points: number[];
}

export interface PencilElement extends BaseElement {
  type: 'pencil';
  points: number[];
  strokes: PencilStroke[];
  stroke: string;
  strokeWidth: number;
  lineCap: 'round' | 'butt' | 'square';
  lineJoin: 'round' | 'miter' | 'bevel';
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: 'normal' | 'italic';
  fontWeight: 'normal' | 'bold';
  fill: string;
  width: number;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  stroke: string;
  strokeWidth: number;
  backgroundColor: string;
  padding: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  width: number;
  height: number;
  cornerRadius: number;
  keepRatio: boolean;
}

export interface GuideElement extends BaseElement {
  type: 'guide';
  orientation: 'horizontal' | 'vertical';
  length: number;
  stroke: string;
  strokeWidth: number;
}

export type EditorElement =
  | RectElement
  | FrameElement
  | CircleElement
  | EllipseElement
  | TriangleElement
  | LineElement
  | PathElement
  | PencilElement
  | TextElement
  | ImageElement
  | GuideElement;

export interface EditorLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

export interface EditorDocument {
  elements: EditorElement[];
  layers: EditorLayer[];
  metadata?: Record<string, unknown> | null;
}

export interface EditorDesign extends EditorDocument {
  options?: Partial<EditorOptions> | null;
}

export interface EditorOptions {
  width: number;
  height: number;
  backgroundColor: string;
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  snapToGuides: boolean;
  showGuides: boolean;
  showRulers: boolean;
  zoom: number;
  fixedCanvas: boolean;
  canvasSizeLocked: boolean;
}

export interface EditorBootstrapConfig {
  initialDesign?: string | EditorDesign | null;
  options?: Partial<EditorOptions>;
}
