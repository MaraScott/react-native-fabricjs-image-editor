import { createReducer, type PayloadAction } from '@reduxjs/toolkit';
import type { PaintToolState } from './types';

const initialState: PaintToolState = {
    active: false,
    color: '#ffffff',
};

export const paintReducer = createReducer(initialState, (builder) => {
    builder
        .addCase('view/paint/activate', (state) => {
            state.active = true;
        })
        .addCase('view/paint/deactivate', (state) => {
            state.active = false;
        })
        .addCase('view/paint/setColor', (state, action: PayloadAction<string>) => {
            state.color = action.payload;
        });
});

export const paintActions = {
    activate: () => ({ type: 'view/paint/activate' as const }),
    deactivate: () => ({ type: 'view/paint/deactivate' as const }),
    setColor: (color: string) => ({ type: 'view/paint/setColor' as const, payload: color }),
};
