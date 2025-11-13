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
/**
 * createReducer - Auto-generated documentation stub.
 *
 * @param {*} initialState - Parameter forwarded to createReducer.
 * @param {*} (builder - Parameter forwarded to createReducer.
 */
export const viewReducer = createReducer(initialState, (builder) => {
    // Active tool management
    builder
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/setActiveTool' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
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
            /**
             * switch - Auto-generated documentation stub.
             *
             * @returns {action.payload} Result produced by switch.
             */
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
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/setToolReady' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/setToolReady', (state, action: PayloadAction<{ tool: keyof ToolReadyState; ready: boolean }>) => {
            state.ready[action.payload.tool] = action.payload.ready;
        })
        
        // Legacy support for old action types
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/pan' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/pan', (state) => {
            state.activeTool = 'pan';
            state.pan.active = true;
            state.select.active = false;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/select' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/select', (state) => {
            state.activeTool = 'select';
            state.select.active = true;
            state.pan.active = false;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/tool' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/tool', (state, action: PayloadAction<keyof ToolReadyState>) => {
            state.ready[action.payload] = true;
        });
    
    // Delegate to individual tool reducers
    // Select tool actions
    builder
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/select/activate' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/select/activate', (state, action) => {
            /**
             * selectReducer - Auto-generated documentation stub.
             *
             * @param {*} state.select - Parameter forwarded to selectReducer.
             * @param {*} action - Parameter forwarded to selectReducer.
             *
             * @returns {state.select, action} Result produced by selectReducer.
             */
            selectReducer(state.select, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/select/deactivate' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/select/deactivate', (state, action) => {
            /**
             * selectReducer - Auto-generated documentation stub.
             *
             * @param {*} state.select - Parameter forwarded to selectReducer.
             * @param {*} action - Parameter forwarded to selectReducer.
             *
             * @returns {state.select, action} Result produced by selectReducer.
             */
            selectReducer(state.select, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/select/setSelectedIds' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/select/setSelectedIds', (state, action) => {
            /**
             * selectReducer - Auto-generated documentation stub.
             *
             * @param {*} state.select - Parameter forwarded to selectReducer.
             * @param {*} action - Parameter forwarded to selectReducer.
             *
             * @returns {state.select, action} Result produced by selectReducer.
             */
            selectReducer(state.select, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/select/addSelectedId' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/select/addSelectedId', (state, action) => {
            /**
             * selectReducer - Auto-generated documentation stub.
             *
             * @param {*} state.select - Parameter forwarded to selectReducer.
             * @param {*} action - Parameter forwarded to selectReducer.
             *
             * @returns {state.select, action} Result produced by selectReducer.
             */
            selectReducer(state.select, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/select/removeSelectedId' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/select/removeSelectedId', (state, action) => {
            /**
             * selectReducer - Auto-generated documentation stub.
             *
             * @param {*} state.select - Parameter forwarded to selectReducer.
             * @param {*} action - Parameter forwarded to selectReducer.
             *
             * @returns {state.select, action} Result produced by selectReducer.
             */
            selectReducer(state.select, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/select/clearSelection' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/select/clearSelection', (state, action) => {
            /**
             * selectReducer - Auto-generated documentation stub.
             *
             * @param {*} state.select - Parameter forwarded to selectReducer.
             * @param {*} action - Parameter forwarded to selectReducer.
             *
             * @returns {state.select, action} Result produced by selectReducer.
             */
            selectReducer(state.select, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/select/setSelectionRect' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/select/setSelectionRect', (state, action) => {
            /**
             * selectReducer - Auto-generated documentation stub.
             *
             * @param {*} state.select - Parameter forwarded to selectReducer.
             * @param {*} action - Parameter forwarded to selectReducer.
             *
             * @returns {state.select, action} Result produced by selectReducer.
             */
            selectReducer(state.select, action);
        });
    
    // Pan tool actions
    builder
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/pan/activate' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/pan/activate', (state, action) => {
            /**
             * panReducer - Auto-generated documentation stub.
             *
             * @param {*} state.pan - Parameter forwarded to panReducer.
             * @param {*} action - Parameter forwarded to panReducer.
             *
             * @returns {state.pan, action} Result produced by panReducer.
             */
            panReducer(state.pan, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/pan/deactivate' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/pan/deactivate', (state, action) => {
            /**
             * panReducer - Auto-generated documentation stub.
             *
             * @param {*} state.pan - Parameter forwarded to panReducer.
             * @param {*} action - Parameter forwarded to panReducer.
             *
             * @returns {state.pan, action} Result produced by panReducer.
             */
            panReducer(state.pan, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/pan/setOffset' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/pan/setOffset', (state, action) => {
            /**
             * panReducer - Auto-generated documentation stub.
             *
             * @param {*} state.pan - Parameter forwarded to panReducer.
             * @param {*} action - Parameter forwarded to panReducer.
             *
             * @returns {state.pan, action} Result produced by panReducer.
             */
            panReducer(state.pan, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/pan/updateOffset' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/pan/updateOffset', (state, action) => {
            /**
             * panReducer - Auto-generated documentation stub.
             *
             * @param {*} state.pan - Parameter forwarded to panReducer.
             * @param {*} action - Parameter forwarded to panReducer.
             *
             * @returns {state.pan, action} Result produced by panReducer.
             */
            panReducer(state.pan, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/pan/resetOffset' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/pan/resetOffset', (state, action) => {
            /**
             * panReducer - Auto-generated documentation stub.
             *
             * @param {*} state.pan - Parameter forwarded to panReducer.
             * @param {*} action - Parameter forwarded to panReducer.
             *
             * @returns {state.pan, action} Result produced by panReducer.
             */
            panReducer(state.pan, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/pan/startPanning' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/pan/startPanning', (state, action) => {
            /**
             * panReducer - Auto-generated documentation stub.
             *
             * @param {*} state.pan - Parameter forwarded to panReducer.
             * @param {*} action - Parameter forwarded to panReducer.
             *
             * @returns {state.pan, action} Result produced by panReducer.
             */
            panReducer(state.pan, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/pan/stopPanning' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/pan/stopPanning', (state, action) => {
            /**
             * panReducer - Auto-generated documentation stub.
             *
             * @param {*} state.pan - Parameter forwarded to panReducer.
             * @param {*} action - Parameter forwarded to panReducer.
             *
             * @returns {state.pan, action} Result produced by panReducer.
             */
            panReducer(state.pan, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/pan/setSpacePressedMode' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/pan/setSpacePressedMode', (state, action) => {
            /**
             * panReducer - Auto-generated documentation stub.
             *
             * @param {*} state.pan - Parameter forwarded to panReducer.
             * @param {*} action - Parameter forwarded to panReducer.
             *
             * @returns {state.pan, action} Result produced by panReducer.
             */
            panReducer(state.pan, action);
        });
    
    // Draw tool actions
    builder
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/activate' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/draw/activate', (state, action) => {
            /**
             * drawReducer - Auto-generated documentation stub.
             *
             * @param {*} state.draw - Parameter forwarded to drawReducer.
             * @param {*} action - Parameter forwarded to drawReducer.
             *
             * @returns {state.draw, action} Result produced by drawReducer.
             */
            drawReducer(state.draw, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/deactivate' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/draw/deactivate', (state, action) => {
            /**
             * drawReducer - Auto-generated documentation stub.
             *
             * @param {*} state.draw - Parameter forwarded to drawReducer.
             * @param {*} action - Parameter forwarded to drawReducer.
             *
             * @returns {state.draw, action} Result produced by drawReducer.
             */
            drawReducer(state.draw, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/setBrushSize' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/draw/setBrushSize', (state, action) => {
            /**
             * drawReducer - Auto-generated documentation stub.
             *
             * @param {*} state.draw - Parameter forwarded to drawReducer.
             * @param {*} action - Parameter forwarded to drawReducer.
             *
             * @returns {state.draw, action} Result produced by drawReducer.
             */
            drawReducer(state.draw, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/setBrushColor' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/draw/setBrushColor', (state, action) => {
            /**
             * drawReducer - Auto-generated documentation stub.
             *
             * @param {*} state.draw - Parameter forwarded to drawReducer.
             * @param {*} action - Parameter forwarded to drawReducer.
             *
             * @returns {state.draw, action} Result produced by drawReducer.
             */
            drawReducer(state.draw, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/setBrushOpacity' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/draw/setBrushOpacity', (state, action) => {
            /**
             * drawReducer - Auto-generated documentation stub.
             *
             * @param {*} state.draw - Parameter forwarded to drawReducer.
             * @param {*} action - Parameter forwarded to drawReducer.
             *
             * @returns {state.draw, action} Result produced by drawReducer.
             */
            drawReducer(state.draw, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/startDrawing' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/draw/startDrawing', (state, action) => {
            /**
             * drawReducer - Auto-generated documentation stub.
             *
             * @param {*} state.draw - Parameter forwarded to drawReducer.
             * @param {*} action - Parameter forwarded to drawReducer.
             *
             * @returns {state.draw, action} Result produced by drawReducer.
             */
            drawReducer(state.draw, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/updatePath' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/draw/updatePath', (state, action) => {
            /**
             * drawReducer - Auto-generated documentation stub.
             *
             * @param {*} state.draw - Parameter forwarded to drawReducer.
             * @param {*} action - Parameter forwarded to drawReducer.
             *
             * @returns {state.draw, action} Result produced by drawReducer.
             */
            drawReducer(state.draw, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/finishDrawing' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/draw/finishDrawing', (state, action) => {
            /**
             * drawReducer - Auto-generated documentation stub.
             *
             * @param {*} state.draw - Parameter forwarded to drawReducer.
             * @param {*} action - Parameter forwarded to drawReducer.
             *
             * @returns {state.draw, action} Result produced by drawReducer.
             */
            drawReducer(state.draw, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/cancelDrawing' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/draw/cancelDrawing', (state, action) => {
            /**
             * drawReducer - Auto-generated documentation stub.
             *
             * @param {*} state.draw - Parameter forwarded to drawReducer.
             * @param {*} action - Parameter forwarded to drawReducer.
             *
             * @returns {state.draw, action} Result produced by drawReducer.
             */
            drawReducer(state.draw, action);
        });
    
    // Rubber tool actions
    builder
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/rubber/activate' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/rubber/activate', (state, action) => {
            /**
             * rubberReducer - Auto-generated documentation stub.
             *
             * @param {*} state.rubber - Parameter forwarded to rubberReducer.
             * @param {*} action - Parameter forwarded to rubberReducer.
             *
             * @returns {state.rubber, action} Result produced by rubberReducer.
             */
            rubberReducer(state.rubber, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/rubber/deactivate' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/rubber/deactivate', (state, action) => {
            /**
             * rubberReducer - Auto-generated documentation stub.
             *
             * @param {*} state.rubber - Parameter forwarded to rubberReducer.
             * @param {*} action - Parameter forwarded to rubberReducer.
             *
             * @returns {state.rubber, action} Result produced by rubberReducer.
             */
            rubberReducer(state.rubber, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/rubber/setEraserSize' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/rubber/setEraserSize', (state, action) => {
            /**
             * rubberReducer - Auto-generated documentation stub.
             *
             * @param {*} state.rubber - Parameter forwarded to rubberReducer.
             * @param {*} action - Parameter forwarded to rubberReducer.
             *
             * @returns {state.rubber, action} Result produced by rubberReducer.
             */
            rubberReducer(state.rubber, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/rubber/startErasing' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/rubber/startErasing', (state, action) => {
            /**
             * rubberReducer - Auto-generated documentation stub.
             *
             * @param {*} state.rubber - Parameter forwarded to rubberReducer.
             * @param {*} action - Parameter forwarded to rubberReducer.
             *
             * @returns {state.rubber, action} Result produced by rubberReducer.
             */
            rubberReducer(state.rubber, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/rubber/stopErasing' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/rubber/stopErasing', (state, action) => {
            /**
             * rubberReducer - Auto-generated documentation stub.
             *
             * @param {*} state.rubber - Parameter forwarded to rubberReducer.
             * @param {*} action - Parameter forwarded to rubberReducer.
             *
             * @returns {state.rubber, action} Result produced by rubberReducer.
             */
            rubberReducer(state.rubber, action);
        });
    
    // Crop tool actions
    builder
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/crop/activate' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/crop/activate', (state, action) => {
            /**
             * cropReducer - Auto-generated documentation stub.
             *
             * @param {*} state.crop - Parameter forwarded to cropReducer.
             * @param {*} action - Parameter forwarded to cropReducer.
             *
             * @returns {state.crop, action} Result produced by cropReducer.
             */
            cropReducer(state.crop, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/crop/deactivate' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/crop/deactivate', (state, action) => {
            /**
             * cropReducer - Auto-generated documentation stub.
             *
             * @param {*} state.crop - Parameter forwarded to cropReducer.
             * @param {*} action - Parameter forwarded to cropReducer.
             *
             * @returns {state.crop, action} Result produced by cropReducer.
             */
            cropReducer(state.crop, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/crop/setTargetElement' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/crop/setTargetElement', (state, action) => {
            /**
             * cropReducer - Auto-generated documentation stub.
             *
             * @param {*} state.crop - Parameter forwarded to cropReducer.
             * @param {*} action - Parameter forwarded to cropReducer.
             *
             * @returns {state.crop, action} Result produced by cropReducer.
             */
            cropReducer(state.crop, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/crop/setCropArea' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/crop/setCropArea', (state, action) => {
            /**
             * cropReducer - Auto-generated documentation stub.
             *
             * @param {*} state.crop - Parameter forwarded to cropReducer.
             * @param {*} action - Parameter forwarded to cropReducer.
             *
             * @returns {state.crop, action} Result produced by cropReducer.
             */
            cropReducer(state.crop, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/crop/updateCropArea' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/crop/updateCropArea', (state, action) => {
            /**
             * cropReducer - Auto-generated documentation stub.
             *
             * @param {*} state.crop - Parameter forwarded to cropReducer.
             * @param {*} action - Parameter forwarded to cropReducer.
             *
             * @returns {state.crop, action} Result produced by cropReducer.
             */
            cropReducer(state.crop, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/crop/resetCrop' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/crop/resetCrop', (state, action) => {
            /**
             * cropReducer - Auto-generated documentation stub.
             *
             * @param {*} state.crop - Parameter forwarded to cropReducer.
             * @param {*} action - Parameter forwarded to cropReducer.
             *
             * @returns {state.crop, action} Result produced by cropReducer.
             */
            cropReducer(state.crop, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/crop/applyCrop' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/crop/applyCrop', (state, action) => {
            /**
             * cropReducer - Auto-generated documentation stub.
             *
             * @param {*} state.crop - Parameter forwarded to cropReducer.
             * @param {*} action - Parameter forwarded to cropReducer.
             *
             * @returns {state.crop, action} Result produced by cropReducer.
             */
            cropReducer(state.crop, action);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/crop/cancelCrop' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/crop/cancelCrop', (state, action) => {
            /**
             * cropReducer - Auto-generated documentation stub.
             *
             * @param {*} state.crop - Parameter forwarded to cropReducer.
             * @param {*} action - Parameter forwarded to cropReducer.
             *
             * @returns {state.crop, action} Result produced by cropReducer.
             */
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

// Export selectors
export * from './selectors';

// Export types
export type { ViewState, ToolName, ToolReadyState };
