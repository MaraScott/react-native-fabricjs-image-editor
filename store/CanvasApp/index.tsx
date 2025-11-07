import { configureStore } from '@reduxjs/toolkit';
import thunk from 'redux-thunk';

import { configuration as settings } from 'store/CanvasApp/configuration';
import { view } from 'store/CanvasApp/view';

export const CanvasApp = configureStore({ 
    reducer: {
        settings,
        view,
    },
    middleware: [thunk]
});