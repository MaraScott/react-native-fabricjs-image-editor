/**
 * Rubber (Eraser) Tool State Management
 * Handles eraser mode and eraser settings
 */

import { createReducer, type PayloadAction } from '@reduxjs/toolkit';
import type { RubberToolState } from './types';

const initialState: RubberToolState = {
    active: false,
    eraserSize: 20,
    isErasing: false,
};

export const rubberReducer = createReducer(initialState, (builder) => {
    builder
        .addCase('view/rubber/activate', (state) => {
            state.active = true;
        })
        .addCase('view/rubber/deactivate', (state) => {
            state.active = false;
            state.isErasing = false;
        })
        .addCase('view/rubber/setEraserSize', (state, action: PayloadAction<number>) => {
            state.eraserSize = Math.max(1, Math.min(200, action.payload));
        })
        .addCase('view/rubber/startErasing', (state) => {
            state.isErasing = true;
        })
        .addCase('view/rubber/stopErasing', (state) => {
            state.isErasing = false;
        });
});

export const rubberActions = {
    activate: () => ({ type: 'view/rubber/activate' as const }),
    deactivate: () => ({ type: 'view/rubber/deactivate' as const }),
    setEraserSize: (size: number) => ({ type: 'view/rubber/setEraserSize' as const, payload: size }),
    startErasing: () => ({ type: 'view/rubber/startErasing' as const }),
    stopErasing: () => ({ type: 'view/rubber/stopErasing' as const }),
};
