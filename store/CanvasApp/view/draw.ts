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

export const drawReducer = createReducer(initialState, (builder) => {
    builder
        .addCase('view/draw/activate', (state) => {
            state.active = true;
        })
        .addCase('view/draw/deactivate', (state) => {
            state.active = false;
            state.isDrawing = false;
            state.currentPath = null;
        })
        .addCase('view/draw/setBrushSize', (state, action: PayloadAction<number>) => {
            state.brushSize = Math.max(1, Math.min(100, action.payload));
        })
        .addCase('view/draw/setBrushColor', (state, action: PayloadAction<string>) => {
            state.brushColor = action.payload;
        })
        .addCase('view/draw/setBrushOpacity', (state, action: PayloadAction<number>) => {
            state.brushOpacity = Math.max(0, Math.min(1, action.payload));
        })
        .addCase('view/draw/startDrawing', (state, action: PayloadAction<string>) => {
            state.isDrawing = true;
            state.currentPath = action.payload;
        })
        .addCase('view/draw/updatePath', (state, action: PayloadAction<string>) => {
            state.currentPath = action.payload;
        })
        .addCase('view/draw/finishDrawing', (state) => {
            state.isDrawing = false;
            state.currentPath = null;
        })
        .addCase('view/draw/cancelDrawing', (state) => {
            state.isDrawing = false;
            state.currentPath = null;
        });
});

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
