export type EditorElementType = 'rect' | 'circle' | 'text' | 'image';

interface BaseElement {
  id: string;
  type: EditorElementType;
  name: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  draggable?: boolean;
}

export interface RectElement extends BaseElement {
  type: 'rect';
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  width: number;
  align: 'left' | 'center' | 'right';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  width: number;
  height: number;
}

export type EditorElement = RectElement | CircleElement | TextElement | ImageElement;

export interface EditorDesign {
  elements: EditorElement[];
  metadata?: Record<string, unknown> | null;
}

export interface EditorOptions {
  width: number;
  height: number;
  backgroundColor: string;
  showGrid: boolean;
}

export interface EditorBootstrapConfig {
  initialDesign?: string | EditorDesign | null;
  options?: Partial<EditorOptions>;
}
