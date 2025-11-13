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

/**
 * Reducer for the crop tool that follows a similar pattern to the other
 * tool-specific reducers. It keeps track of whether cropping is active,
 * which element is targeted, and the current crop rectangle.
 */
/**
 * createReducer - Auto-generated documentation stub.
 *
 * @param {*} initialState - Parameter forwarded to createReducer.
 * @param {*} (builder - Parameter forwarded to createReducer.
 */
export const cropReducer = createReducer(initialState, (builder) => {
    builder
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/crop/activate' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/crop/activate', (state) => {
            state.active = true;
        })
        .addCase('view/crop/deactivate', (state) => {
            state.active = false;
            state.targetElementId = null;
            state.cropArea = null;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/crop/setTargetElement' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/crop/setTargetElement', (state, action: PayloadAction<string>) => {
            state.targetElementId = action.payload;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/crop/setCropArea' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/crop/setCropArea', (state, action: PayloadAction<{ x: number; y: number; width: number; height: number } | null>) => {
            state.cropArea = action.payload;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/crop/updateCropArea' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/crop/updateCropArea', (state, action: PayloadAction<Partial<{ x: number; y: number; width: number; height: number }>>) => {
            /**
             * if - Auto-generated documentation stub.
             *
             * @returns {state.cropArea} Result produced by if.
             */
            if (state.cropArea) {
                state.cropArea = { ...state.cropArea, ...action.payload };
            }
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/crop/resetCrop' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/crop/resetCrop', (state) => {
            state.targetElementId = null;
            state.cropArea = null;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/crop/applyCrop' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/crop/applyCrop', (state) => {
            // Crop will be applied by the component, just reset the state
            state.targetElementId = null;
            state.cropArea = null;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/crop/cancelCrop' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/crop/cancelCrop', (state) => {
            state.targetElementId = null;
            state.cropArea = null;
        });
});

/**
 * Corresponding action creators for the crop reducer.
 */
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
