/**
 * Select Tool State Management
 * Handles selection mode, selected elements, and selection rectangle
 */

import { createReducer, type PayloadAction } from '@reduxjs/toolkit';
import type { SelectToolState } from './types';

const initialState: SelectToolState = {
    active: false,
    selectedIds: [],
    selectionRect: null,
};

/**
 * Reducer powering the select tool. It tracks whether the marquee is active,
 * which ids are part of the selection, and the current selection rectangle.
 */
/**
 * createReducer - Auto-generated documentation stub.
 *
 * @param {*} initialState - Parameter forwarded to createReducer.
 * @param {*} (builder - Parameter forwarded to createReducer.
 */
export const selectReducer = createReducer(initialState, (builder) => {
    builder
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/select/activate' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/select/activate', (state) => {
            state.active = true;
        })
        .addCase('view/select/deactivate', (state) => {
            state.active = false;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/select/setSelectedIds' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/select/setSelectedIds', (state, action: PayloadAction<string[]>) => {
            state.selectedIds = action.payload;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/select/addSelectedId' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/select/addSelectedId', (state, action: PayloadAction<string>) => {
            /**
             * if - Auto-generated documentation stub.
             */
            if (!state.selectedIds.includes(action.payload)) {
                /**
                 * push - Auto-generated documentation stub.
                 *
                 * @returns {action.payload} Result produced by push.
                 */
                state.selectedIds.push(action.payload);
            }
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/select/removeSelectedId' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/select/removeSelectedId', (state, action: PayloadAction<string>) => {
            /**
             * filter - Auto-generated documentation stub.
             */
            state.selectedIds = state.selectedIds.filter(id => id !== action.payload);
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/select/clearSelection' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         */
        .addCase('view/select/clearSelection', (state) => {
            state.selectedIds = [];
            state.selectionRect = null;
        })
        /**
         * addCase - Auto-generated documentation stub.
         *
         * @param {*} 'view/select/setSelectionRect' - Parameter forwarded to addCase.
         * @param {*} (state - Parameter forwarded to addCase.
         * @param {*} action - Parameter forwarded to addCase.
         */
        .addCase('view/select/setSelectionRect', (state, action: PayloadAction<{ x: number; y: number; width: number; height: number } | null>) => {
            state.selectionRect = action.payload;
        });
});

/**
 * Convenience action creators that keep action type strings in one place.
 */
export const selectActions = {
    activate: () => ({ type: 'view/select/activate' as const }),
    deactivate: () => ({ type: 'view/select/deactivate' as const }),
    setSelectedIds: (ids: string[]) => ({ type: 'view/select/setSelectedIds' as const, payload: ids }),
    addSelectedId: (id: string) => ({ type: 'view/select/addSelectedId' as const, payload: id }),
    removeSelectedId: (id: string) => ({ type: 'view/select/removeSelectedId' as const, payload: id }),
    clearSelection: () => ({ type: 'view/select/clearSelection' as const }),
    setSelectionRect: (rect: { x: number; y: number; width: number; height: number } | null) => ({ 
        type: 'view/select/setSelectionRect' as const, 
        payload: rect 
    }),
};
