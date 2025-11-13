/**
 * Draw Tool State Management
 * Handles drawing mode, brush settings, and current drawing path
 */

import { createReducer, type PayloadAction } from '@reduxjs/toolkit';
import type { DrawToolState } from './types';

const initialState: DrawToolState = {
    active: false,
    brushSize: 5,
    brushColor: '#000000',
    brushOpacity: 1,
    isDrawing: false,
    currentPath: null,
};

/**
 * Reducer that drives the draw tool. It keeps track of whether the tool is
 * active, what brush settings are in use, and the transient path being drawn.
 */
/**
 * createReducer - Auto-generated documentation stub.
 *
 * @param {*} initialState - Parameter forwarded to createReducer.
 * @param {*} (builder - Parameter forwarded to createReducer.
 */
export const drawReducer = createReducer(initialState, (builder) => {
    builder
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/activate' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/draw/activate', (state) => {
            state.active = true;
        })
        .addCase('view/draw/deactivate', (state) => {
            state.active = false;
            state.isDrawing = false;
            state.currentPath = null;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/setBrushSize' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/draw/setBrushSize', (state, action: PayloadAction<number>) => {
            /**
             * max - Auto-generated documentation stub.
             *
             * @param {*} 1 - Parameter forwarded to max.
             * @param {*} Math.min(100 - Parameter forwarded to max.
             * @param {*} action.payload - Parameter forwarded to max.
             */
            state.brushSize = Math.max(1, Math.min(100, action.payload));
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/setBrushColor' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/draw/setBrushColor', (state, action: PayloadAction<string>) => {
            state.brushColor = action.payload;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/setBrushOpacity' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/draw/setBrushOpacity', (state, action: PayloadAction<number>) => {
            /**
             * max - Auto-generated documentation stub.
             *
             * @param {*} 0 - Parameter forwarded to max.
             * @param {*} Math.min(1 - Parameter forwarded to max.
             * @param {*} action.payload - Parameter forwarded to max.
             */
            state.brushOpacity = Math.max(0, Math.min(1, action.payload));
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/startDrawing' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/draw/startDrawing', (state, action: PayloadAction<string>) => {
            state.isDrawing = true;
            state.currentPath = action.payload;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/updatePath' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/draw/updatePath', (state, action: PayloadAction<string>) => {
            state.currentPath = action.payload;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/finishDrawing' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/draw/finishDrawing', (state) => {
            state.isDrawing = false;
            state.currentPath = null;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/draw/cancelDrawing' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/draw/cancelDrawing', (state) => {
            state.isDrawing = false;
            state.currentPath = null;
        });
});

/**
 * Action creators exposed so UI components can tweak brush settings without
 * hard-coding action strings.
 */
export const drawActions = {
    activate: () => ({ type: 'view/draw/activate' as const }),
    deactivate: () => ({ type: 'view/draw/deactivate' as const }),
    setBrushSize: (size: number) => ({ type: 'view/draw/setBrushSize' as const, payload: size }),
    setBrushColor: (color: string) => ({ type: 'view/draw/setBrushColor' as const, payload: color }),
    setBrushOpacity: (opacity: number) => ({ type: 'view/draw/setBrushOpacity' as const, payload: opacity }),
    startDrawing: (pathId: string) => ({ type: 'view/draw/startDrawing' as const, payload: pathId }),
    updatePath: (pathData: string) => ({ type: 'view/draw/updatePath' as const, payload: pathData }),
    finishDrawing: () => ({ type: 'view/draw/finishDrawing' as const }),
    cancelDrawing: () => ({ type: 'view/draw/cancelDrawing' as const }),
};
