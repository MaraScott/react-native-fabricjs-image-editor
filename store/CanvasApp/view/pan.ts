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

export const panReducer = createReducer(initialState, (builder) => {
    builder
        .addCase('view/pan/activate', (state) => {
            state.active = true;
        })
        .addCase('view/pan/deactivate', (state) => {
            state.active = false;
        })
        .addCase('view/pan/setOffset', (state, action: PayloadAction<{ x: number; y: number }>) => {
            state.offset = action.payload;
        })
        .addCase('view/pan/updateOffset', (state, action: PayloadAction<{ dx: number; dy: number }>) => {
            state.offset.x += action.payload.dx;
            state.offset.y += action.payload.dy;
        })
        .addCase('view/pan/resetOffset', (state) => {
            state.offset = { x: 0, y: 0 };
        })
        .addCase('view/pan/startPanning', (state) => {
            state.isPanning = true;
        })
        .addCase('view/pan/stopPanning', (state) => {
            state.isPanning = false;
        })
        .addCase('view/pan/setSpacePressedMode', (state, action: PayloadAction<boolean>) => {
            state.spacePressedMode = action.payload;
        });
});

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
