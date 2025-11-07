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

export const selectReducer = createReducer(initialState, (builder) => {
    builder
        .addCase('view/select/activate', (state) => {
            state.active = true;
        })
        .addCase('view/select/deactivate', (state) => {
            state.active = false;
        })
        .addCase('view/select/setSelectedIds', (state, action: PayloadAction<string[]>) => {
            state.selectedIds = action.payload;
        })
        .addCase('view/select/addSelectedId', (state, action: PayloadAction<string>) => {
            if (!state.selectedIds.includes(action.payload)) {
                state.selectedIds.push(action.payload);
            }
        })
        .addCase('view/select/removeSelectedId', (state, action: PayloadAction<string>) => {
            state.selectedIds = state.selectedIds.filter(id => id !== action.payload);
        })
        .addCase('view/select/clearSelection', (state) => {
            state.selectedIds = [];
            state.selectionRect = null;
        })
        .addCase('view/select/setSelectionRect', (state, action: PayloadAction<{ x: number; y: number; width: number; height: number } | null>) => {
            state.selectionRect = action.payload;
        });
});

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
