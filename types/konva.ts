export type Vector2d = { x: number; y: number };

export type KonvaEventObject<T extends Event = Event> = {
  target: {
    x: () => number;
    y: () => number;
    width?: () => number;
    height?: () => number;
    radius?: () => number;
    rotation?: () => number;
    scaleX: () => number;
    scaleY: () => number;
    points?: () => number[];
    getLayer?: () => { batchDraw: () => void } | null;
    scale?: (scale: { x: number; y: number }) => void;
    tension?: () => number;
    bezier?: () => boolean;
  } & Record<string, any>;
  evt: T;
};

export type StageType = {
  width: () => number;
  height: () => number;
  scale: () => { x: number; y: number };
  absoluteToRelative: (point: Vector2d) => Vector2d;
  container: () => HTMLDivElement;
  x: () => number;
  y: () => number;
  batchDraw: () => void;
};

export type KonvaNode = {
  x: () => number;
  y: () => number;
  rotation?: () => number;
  scaleX: () => number;
  scaleY: () => number;
  width?: () => number;
  height?: () => number;
  radius?: () => number;
  scale: (scale: { x: number; y: number }) => void;
  points?: () => number[];
  tension?: () => number;
  bezier?: () => boolean;
  getLayer?: () => { batchDraw: () => void } | null;
};
