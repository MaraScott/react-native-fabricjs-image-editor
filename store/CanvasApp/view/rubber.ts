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

/**
 * Reducer for the eraser tool. Mirrors the other tool reducers so each mode
 * can be toggled independently.
 */
/**
 * createReducer - Auto-generated documentation stub.
 *
 * @param {*} initialState - Parameter forwarded to createReducer.
 * @param {*} (builder - Parameter forwarded to createReducer.
 */
export const rubberReducer = createReducer(initialState, (builder) => {
    builder
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/rubber/activate' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/rubber/activate', (state) => {
            state.active = true;
        })
        .addCase('view/rubber/deactivate', (state) => {
            state.active = false;
            state.isErasing = false;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/rubber/setEraserSize' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/rubber/setEraserSize', (state, action: PayloadAction<number>) => {
            /**
             * max - Auto-generated documentation stub.
             *
             * @param {*} 1 - Parameter forwarded to max.
             * @param {*} Math.min(200 - Parameter forwarded to max.
             * @param {*} action.payload - Parameter forwarded to max.
             */
            state.eraserSize = Math.max(1, Math.min(200, action.payload));
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/rubber/startErasing' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/rubber/startErasing', (state) => {
            state.isErasing = true;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/rubber/stopErasing' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/rubber/stopErasing', (state) => {
            state.isErasing = false;
        });
});

/**
 * Action creators for the eraser tool.
 */
export const rubberActions = {
    activate: () => ({ type: 'view/rubber/activate' as const }),
    deactivate: () => ({ type: 'view/rubber/deactivate' as const }),
    setEraserSize: (size: number) => ({ type: 'view/rubber/setEraserSize' as const, payload: size }),
    startErasing: () => ({ type: 'view/rubber/startErasing' as const }),
    stopErasing: () => ({ type: 'view/rubber/stopErasing' as const }),
};
