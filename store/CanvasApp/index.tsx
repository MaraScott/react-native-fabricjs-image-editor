import { configureStore } from 'reduxToolkit';
import { combineReducers } from 'redux';
import thunk from 'reduxThunk';

import { configuration as settings } from 'store/CanvasApp/configuration';
import { view } from 'store/CanvasApp/view';

export const CanvasApp = configureStore({ 
    reducer: combineReducers({
        settings,
        view,
    }),
    middleware: [thunk]
});