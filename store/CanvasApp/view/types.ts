/**
 * Types for tool state management
 */

export type ToolName = 'select' | 'pan' | 'draw' | 'rubber' | 'crop';

export interface ToolReadyState {
    player: boolean;
    videos: boolean;
    audios: boolean;
    medias: boolean;
    advanced: boolean;
    settings: boolean;
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
}

export interface PanToolState {
    active: boolean;
    offset: {
        x: number;
        y: number;
    };
    isPanning: boolean;
    spacePressedMode: boolean;
}

export interface DrawToolState {
    active: boolean;
    brushSize: number;
    brushColor: string;
    brushOpacity: number;
    isDrawing: boolean;
    currentPath: string | null;
}

export interface RubberToolState {
    active: boolean;
    eraserSize: number;
    isErasing: boolean;
}

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

export interface ViewState {
    activeTool: ToolName;
    ready: ToolReadyState;
    select: SelectToolState;
    pan: PanToolState;
    draw: DrawToolState;
    rubber: RubberToolState;
    crop: CropToolState;
}
