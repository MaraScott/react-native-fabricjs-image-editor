import { configureStore } from '@reduxjs/toolkit';
import thunk from 'redux-thunk';

import { configuration as settings } from './configuration';
import { view } from './view';

export const CanvasApp = configureStore({ 
    reducer: {
        settings,
        view,
    },
    middleware: [thunk]
});

// Export types for TypeScript usage
export type RootState = ReturnType<typeof CanvasApp.getState>;
export type AppDispatch = typeof CanvasApp.dispatch;