/**
 * Pan Tool State Management
 * Handles pan mode, pan offset, and panning state
 */

import { createReducer, type PayloadAction } from '@reduxjs/toolkit';
import type { PanToolState } from './types';

const initialState: PanToolState = {
    active: false,
    offset: { x: 0, y: 0 },
    isPanning: false,
    spacePressedMode: false,
};

/**
 * Reducer that encapsulates all pan-related state such as offsets and whether
 * the user is currently panning.
 */
/**
 * createReducer - Auto-generated documentation stub.
 *
 * @param {*} initialState - Parameter forwarded to createReducer.
 * @param {*} (builder - Parameter forwarded to createReducer.
 */
export const panReducer = createReducer(initialState, (builder) => {
    builder
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/pan/activate' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/pan/activate', (state) => {
            state.active = true;
        })
        .addCase('view/pan/deactivate', (state) => {
            state.active = false;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/pan/setOffset' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/pan/setOffset', (state, action: PayloadAction<{ x: number; y: number }>) => {
            state.offset = action.payload;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/pan/updateOffset' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/pan/updateOffset', (state, action: PayloadAction<{ dx: number; dy: number }>) => {
            state.offset.x += action.payload.dx;
            state.offset.y += action.payload.dy;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/pan/resetOffset' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/pan/resetOffset', (state) => {
            state.offset = { x: 0, y: 0 };
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/pan/startPanning' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/pan/startPanning', (state) => {
            state.isPanning = true;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/pan/stopPanning' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/pan/stopPanning', (state) => {
            state.isPanning = false;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/pan/setSpacePressedMode' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/pan/setSpacePressedMode', (state, action: PayloadAction<boolean>) => {
            state.spacePressedMode = action.payload;
        });
});

/**
 * Exposed action creators so UI components do not need to know the string
 * action names used by the reducer.
 */
export const panActions = {
    activate: () => ({ type: 'view/pan/activate' as const }),
    deactivate: () => ({ type: 'view/pan/deactivate' as const }),
    setOffset: (offset: { x: number; y: number }) => ({ type: 'view/pan/setOffset' as const, payload: offset }),
    updateOffset: (delta: { dx: number; dy: number }) => ({ type: 'view/pan/updateOffset' as const, payload: delta }),
    resetOffset: () => ({ type: 'view/pan/resetOffset' as const }),
    startPanning: () => ({ type: 'view/pan/startPanning' as const }),
    stopPanning: () => ({ type: 'view/pan/stopPanning' as const }),
    setSpacePressedMode: (enabled: boolean) => ({ type: 'view/pan/setSpacePressedMode' as const, payload: enabled }),
};
