/**
 * Types for tool state management
 */

export type ToolName = 'select' | 'pan' | 'draw' | 'rubber' | 'text' | 'crop' | 'paint';

export interface ToolReadyState {
    player: boolean;
    videos: boolean;
    audios: boolean;
    medias: boolean;
    advanced: boolean;
    settings: boolean;
}

/**
 * SelectToolState interface - Auto-generated interface summary; customize as needed.
 */
/**
 * SelectToolState interface - Generated documentation block.
 */
export interface SelectionTransform {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
}

export interface SelectToolState {
    active: boolean;
    selectedIds: string[];
    selectionRect: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    selectionTransform: SelectionTransform | null;
}

/**
 * PanToolState interface - Auto-generated interface summary; customize as needed.
 */
/**
 * PanToolState interface - Generated documentation block.
 */
export interface PanToolState {
    active: boolean;
    offset: {
        x: number;
        y: number;
    };
    isPanning: boolean;
    spacePressedMode: boolean;
}

/**
 * DrawToolState interface - Auto-generated interface summary; customize as needed.
 */
/**
 * DrawToolState interface - Generated documentation block.
 */
export interface DrawToolState {
    active: boolean;
    brushSize: number;
    brushColor: string;
    brushOpacity: number;
    brushHardness: number;
    isDrawing: boolean;
    currentPath: string | null;
}

/**
 * RubberToolState interface - Auto-generated interface summary; customize as needed.
 */
/**
 * RubberToolState interface - Generated documentation block.
 */
export interface RubberToolState {
    active: boolean;
    eraserSize: number;
    isErasing: boolean;
}

export interface PaintToolState {
    active: boolean;
    color: string;
}

export interface TextToolState {
    active: boolean;
    text: string;
    fontSize: number;
    color: string;
    fontFamily: string;
    fontStyle: 'normal' | 'italic';
    fontWeight: string;
}

/**
 * CropToolState interface - Auto-generated interface summary; customize as needed.
 */
/**
 * CropToolState interface - Generated documentation block.
 */
export interface CropToolState {
    active: boolean;
    targetElementId: string | null;
    cropArea: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
}

/**
 * ViewState interface - Auto-generated interface summary; customize as needed.
 */
/**
 * ViewState interface - Generated documentation block.
 */
export interface ViewState {
    activeTool: ToolName;
    ready: ToolReadyState;
    select: SelectToolState;
    pan: PanToolState;
    draw: DrawToolState;
    rubber: RubberToolState;
    paint: PaintToolState;
    text: TextToolState;
    crop: CropToolState;
}
