import { createReducer, type PayloadAction } from '@reduxjs/toolkit';
import type { ZoomState } from './types';

export const ZOOM_MIN = -100;
export const ZOOM_MAX = 200;
export const ZOOM_DEFAULT_STEP = 10;

export const clampZoomLevel = (value: number, min: number = ZOOM_MIN, max: number = ZOOM_MAX) => {
    return Math.max(min, Math.min(max, value));
};

const initialState: ZoomState = {
    level: 0,
    min: ZOOM_MIN,
    max: ZOOM_MAX,
};

export const zoomReducer = createReducer(initialState, (builder) => {
    builder
        .addCase('view/zoom/setLevel', (state, action: PayloadAction<number>) => {
            state.level = clampZoomLevel(action.payload, state.min, state.max);
        })
        .addCase('view/zoom/zoomIn', (state, action: PayloadAction<number | undefined>) => {
            const step = action.payload ?? ZOOM_DEFAULT_STEP;
            state.level = clampZoomLevel(state.level + step, state.min, state.max);
        })
        .addCase('view/zoom/zoomOut', (state, action: PayloadAction<number | undefined>) => {
            const step = action.payload ?? ZOOM_DEFAULT_STEP;
            state.level = clampZoomLevel(state.level - step, state.min, state.max);
        })
        .addCase('view/zoom/reset', (state) => {
            state.level = 0;
        });
});

export const zoomActions = {
    setLevel: (level: number) => ({ type: 'view/zoom/setLevel' as const, payload: level }),
    zoomIn: (step?: number) => ({ type: 'view/zoom/zoomIn' as const, payload: step }),
    zoomOut: (step?: number) => ({ type: 'view/zoom/zoomOut' as const, payload: step }),
    reset: () => ({ type: 'view/zoom/reset' as const }),
};
