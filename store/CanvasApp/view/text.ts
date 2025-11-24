/**
 * Text Tool State Management
 * Keeps track of default text styling used when placing new text nodes.
 */

import { createReducer, type PayloadAction } from '@reduxjs/toolkit';
import type { TextToolState } from './types';

const initialState: TextToolState = {
    active: false,
    text: 'New text',
    fontSize: 32,
    color: '#000000',
    fontFamily: 'Arial, sans-serif',
    fontStyle: 'normal',
    fontWeight: 'normal',
};

export const textReducer = createReducer(initialState, (builder) => {
    builder
        .addCase('view/text/activate', (state) => {
            state.active = true;
        })
        .addCase('view/text/deactivate', (state) => {
            state.active = false;
        })
        .addCase('view/text/setText', (state, action: PayloadAction<string>) => {
            state.text = action.payload;
        })
        .addCase('view/text/setFontSize', (state, action: PayloadAction<number>) => {
            state.fontSize = Math.max(8, Math.min(300, action.payload));
        })
        .addCase('view/text/setColor', (state, action: PayloadAction<string>) => {
            state.color = action.payload;
        })
        .addCase('view/text/setFontFamily', (state, action: PayloadAction<string>) => {
            state.fontFamily = action.payload;
        })
        .addCase('view/text/setFontStyle', (state, action: PayloadAction<'normal' | 'italic'>) => {
            state.fontStyle = action.payload;
        })
        .addCase('view/text/setFontWeight', (state, action: PayloadAction<string>) => {
            state.fontWeight = action.payload;
        });
});

export const textActions = {
    activate: () => ({ type: 'view/text/activate' as const }),
    deactivate: () => ({ type: 'view/text/deactivate' as const }),
    setText: (value: string) => ({ type: 'view/text/setText' as const, payload: value }),
    setFontSize: (size: number) => ({ type: 'view/text/setFontSize' as const, payload: size }),
    setColor: (color: string) => ({ type: 'view/text/setColor' as const, payload: color }),
    setFontFamily: (family: string) => ({ type: 'view/text/setFontFamily' as const, payload: family }),
    setFontStyle: (style: 'normal' | 'italic') => ({ type: 'view/text/setFontStyle' as const, payload: style }),
    setFontWeight: (weight: string) => ({ type: 'view/text/setFontWeight' as const, payload: weight }),
};
