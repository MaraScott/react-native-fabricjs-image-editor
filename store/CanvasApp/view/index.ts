/**
 * View Reducer - Combines all tool-specific reducers
 * Central state management for all canvas tools
 */

import { createReducer, type PayloadAction } from '@reduxjs/toolkit';
import type { ViewState, ToolName, ToolReadyState } from './types';
import { selectReducer, selectActions } from './select';
import { panReducer, panActions } from './pan';
import { drawReducer, drawActions } from './draw';
import { rubberReducer, rubberActions } from './rubber';
import { cropReducer, cropActions } from './crop';

const initialState: ViewState = {
    activeTool: 'select',
    ready: {
        player: false,
        videos: false,
        audios: false,
        medias: false,
        advanced: false,
        settings: false,
    },
    select: {
        active: true,
        selectedIds: [],
        selectionRect: null,
    },
    pan: {
        active: false,
        offset: { x: 0, y: 0 },
        isPanning: false,
        spacePressedMode: false,
    },
    draw: {
        active: false,
        brushSize: 5,
        brushColor: '#000000',
        brushOpacity: 1,
        isDrawing: false,
        currentPath: null,
    },
    rubber: {
        active: false,
        eraserSize: 20,
        isErasing: false,
    },
    crop: {
        active: false,
        targetElementId: null,
        cropArea: null,
    },
};

/**
 * Main view reducer that combines all tool reducers
 */
export const viewReducer = createReducer(initialState, (builder) => {
    // Active tool management
    builder
        .addCase('view/setActiveTool', (state, action: PayloadAction<ToolName>) => {
            // Deactivate all tools
            state.select.active = false;
            state.pan.active = false;
            state.draw.active = false;
            state.rubber.active = false;
            state.crop.active = false;
            
            // Set new active tool
            state.activeTool = action.payload;
            
            // Activate the selected tool
            switch (action.payload) {
                case 'select':
                    state.select.active = true;
                    break;
                case 'pan':
                    state.pan.active = true;
                    break;
                case 'draw':
                    state.draw.active = true;
                    break;
                case 'rubber':
                    state.rubber.active = true;
                    break;
                case 'crop':
                    state.crop.active = true;
                    break;
            }
        })
        .addCase('view/setToolReady', (state, action: PayloadAction<{ tool: keyof ToolReadyState; ready: boolean }>) => {
            state.ready[action.payload.tool] = action.payload.ready;
        })
        
        // Legacy support for old action types
        .addCase('view/pan', (state) => {
            state.activeTool = 'pan';
            state.pan.active = true;
            state.select.active = false;
        })
        .addCase('view/select', (state) => {
            state.activeTool = 'select';
            state.select.active = true;
            state.pan.active = false;
        })
        .addCase('view/tool', (state, action: PayloadAction<keyof ToolReadyState>) => {
            state.ready[action.payload] = true;
        });
    
    // Delegate to individual tool reducers
    // Select tool actions
    builder
        .addCase('view/select/activate', (state, action) => {
            selectReducer(state.select, action);
        })
        .addCase('view/select/deactivate', (state, action) => {
            selectReducer(state.select, action);
        })
        .addCase('view/select/setSelectedIds', (state, action) => {
            selectReducer(state.select, action);
        })
        .addCase('view/select/addSelectedId', (state, action) => {
            selectReducer(state.select, action);
        })
        .addCase('view/select/removeSelectedId', (state, action) => {
            selectReducer(state.select, action);
        })
        .addCase('view/select/clearSelection', (state, action) => {
            selectReducer(state.select, action);
        })
        .addCase('view/select/setSelectionRect', (state, action) => {
            selectReducer(state.select, action);
        });
    
    // Pan tool actions
    builder
        .addCase('view/pan/activate', (state, action) => {
            panReducer(state.pan, action);
        })
        .addCase('view/pan/deactivate', (state, action) => {
            panReducer(state.pan, action);
        })
        .addCase('view/pan/setOffset', (state, action) => {
            panReducer(state.pan, action);
        })
        .addCase('view/pan/updateOffset', (state, action) => {
            panReducer(state.pan, action);
        })
        .addCase('view/pan/resetOffset', (state, action) => {
            panReducer(state.pan, action);
        })
        .addCase('view/pan/startPanning', (state, action) => {
            panReducer(state.pan, action);
        })
        .addCase('view/pan/stopPanning', (state, action) => {
            panReducer(state.pan, action);
        })
        .addCase('view/pan/setSpacePressedMode', (state, action) => {
            panReducer(state.pan, action);
        });
    
    // Draw tool actions
    builder
        .addCase('view/draw/activate', (state, action) => {
            drawReducer(state.draw, action);
        })
        .addCase('view/draw/deactivate', (state, action) => {
            drawReducer(state.draw, action);
        })
        .addCase('view/draw/setBrushSize', (state, action) => {
            drawReducer(state.draw, action);
        })
        .addCase('view/draw/setBrushColor', (state, action) => {
            drawReducer(state.draw, action);
        })
        .addCase('view/draw/setBrushOpacity', (state, action) => {
            drawReducer(state.draw, action);
        })
        .addCase('view/draw/startDrawing', (state, action) => {
            drawReducer(state.draw, action);
        })
        .addCase('view/draw/updatePath', (state, action) => {
            drawReducer(state.draw, action);
        })
        .addCase('view/draw/finishDrawing', (state, action) => {
            drawReducer(state.draw, action);
        })
        .addCase('view/draw/cancelDrawing', (state, action) => {
            drawReducer(state.draw, action);
        });
    
    // Rubber tool actions
    builder
        .addCase('view/rubber/activate', (state, action) => {
            rubberReducer(state.rubber, action);
        })
        .addCase('view/rubber/deactivate', (state, action) => {
            rubberReducer(state.rubber, action);
        })
        .addCase('view/rubber/setEraserSize', (state, action) => {
            rubberReducer(state.rubber, action);
        })
        .addCase('view/rubber/startErasing', (state, action) => {
            rubberReducer(state.rubber, action);
        })
        .addCase('view/rubber/stopErasing', (state, action) => {
            rubberReducer(state.rubber, action);
        });
    
    // Crop tool actions
    builder
        .addCase('view/crop/activate', (state, action) => {
            cropReducer(state.crop, action);
        })
        .addCase('view/crop/deactivate', (state, action) => {
            cropReducer(state.crop, action);
        })
        .addCase('view/crop/setTargetElement', (state, action) => {
            cropReducer(state.crop, action);
        })
        .addCase('view/crop/setCropArea', (state, action) => {
            cropReducer(state.crop, action);
        })
        .addCase('view/crop/updateCropArea', (state, action) => {
            cropReducer(state.crop, action);
        })
        .addCase('view/crop/resetCrop', (state, action) => {
            cropReducer(state.crop, action);
        })
        .addCase('view/crop/applyCrop', (state, action) => {
            cropReducer(state.crop, action);
        })
        .addCase('view/crop/cancelCrop', (state, action) => {
            cropReducer(state.crop, action);
        });
});

// Export combined actions
export const viewActions = {
    setActiveTool: (tool: ToolName) => ({ type: 'view/setActiveTool' as const, payload: tool }),
    setToolReady: (tool: keyof ToolReadyState, ready: boolean) => ({ 
        type: 'view/setToolReady' as const, 
        payload: { tool, ready } 
    }),
    
    // Tool-specific actions
    select: selectActions,
    pan: panActions,
    draw: drawActions,
    rubber: rubberActions,
    crop: cropActions,
    
    // Legacy actions for backward compatibility
    legacyPan: () => ({ type: 'view/pan' as const }),
    legacySelect: () => ({ type: 'view/select' as const }),
    legacyTool: (tool: keyof ToolReadyState) => ({ type: 'view/tool' as const, payload: tool }),
};

// Export the reducer as 'view' for compatibility
export { viewReducer as view };

// Export types
export type { ViewState, ToolName, ToolReadyState };
