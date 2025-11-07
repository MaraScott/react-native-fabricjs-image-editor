/**
 * Crop Tool State Management
 * Handles crop mode, target element, and crop area
 */

import { createReducer, type PayloadAction } from '@reduxjs/toolkit';
import type { CropToolState } from './types';

const initialState: CropToolState = {
    active: false,
    targetElementId: null,
    cropArea: null,
};

export const cropReducer = createReducer(initialState, (builder) => {
    builder
        .addCase('view/crop/activate', (state) => {
            state.active = true;
        })
        .addCase('view/crop/deactivate', (state) => {
            state.active = false;
            state.targetElementId = null;
            state.cropArea = null;
        })
        .addCase('view/crop/setTargetElement', (state, action: PayloadAction<string>) => {
            state.targetElementId = action.payload;
        })
        .addCase('view/crop/setCropArea', (state, action: PayloadAction<{ x: number; y: number; width: number; height: number } | null>) => {
            state.cropArea = action.payload;
        })
        .addCase('view/crop/updateCropArea', (state, action: PayloadAction<Partial<{ x: number; y: number; width: number; height: number }>>) => {
            if (state.cropArea) {
                state.cropArea = { ...state.cropArea, ...action.payload };
            }
        })
        .addCase('view/crop/resetCrop', (state) => {
            state.targetElementId = null;
            state.cropArea = null;
        })
        .addCase('view/crop/applyCrop', (state) => {
            // Crop will be applied by the component, just reset the state
            state.targetElementId = null;
            state.cropArea = null;
        })
        .addCase('view/crop/cancelCrop', (state) => {
            state.targetElementId = null;
            state.cropArea = null;
        });
});

export const cropActions = {
    activate: () => ({ type: 'view/crop/activate' as const }),
    deactivate: () => ({ type: 'view/crop/deactivate' as const }),
    setTargetElement: (elementId: string) => ({ type: 'view/crop/setTargetElement' as const, payload: elementId }),
    setCropArea: (area: { x: number; y: number; width: number; height: number } | null) => ({ 
        type: 'view/crop/setCropArea' as const, 
        payload: area 
    }),
    updateCropArea: (updates: Partial<{ x: number; y: number; width: number; height: number }>) => ({
        type: 'view/crop/updateCropArea' as const,
        payload: updates,
    }),
    resetCrop: () => ({ type: 'view/crop/resetCrop' as const }),
    applyCrop: () => ({ type: 'view/crop/applyCrop' as const }),
    cancelCrop: () => ({ type: 'view/crop/cancelCrop' as const }),
};
