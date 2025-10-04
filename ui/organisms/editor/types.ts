import type { EditorElement } from '@types/editor';
import type { Vector2d } from '@types/konva';

export type Tool = 'select' | 'pan' | 'draw' | 'rubber' | 'crop';

export interface SelectionRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type DragBoundFactory = (
    element: EditorElement,
) => ((position: Vector2d) => Vector2d) | undefined;
