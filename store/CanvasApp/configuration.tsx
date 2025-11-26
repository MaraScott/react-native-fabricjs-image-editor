import { createReducer } from '@reduxjs/toolkit';

export interface BootstrapConfiguration {
    width: number;
    height: number;
    backgroundColor: string;
    theme: 'kid' | 'adult';
    i18n: string;
    assets_path: string;
}

const defaultBootstrap: BootstrapConfiguration = {
    width: 1024,
    height: 1024,
    backgroundColor: '#cccccc33',
    theme: 'kid',
    i18n: 'fr',
    assets_path: './assets/public',
};

interface ConfigurationState {
    logo: string;
    poster: string;
    translations: Record<string, string>;
    bootstrap: BootstrapConfiguration;
}

const initialState: ConfigurationState = {
    logo: '',
    poster: '',
    translations: {},
    bootstrap: defaultBootstrap,
};

/**
 * Reducer responsible for storing editor level configuration such as the
 * translated copy rendered inside templates. It is intentionally lightweight
 * because most configuration is injected by the hosting environment.
 */
/**
 * createReducer - Auto-generated documentation stub.
 *
 * @param {*} initialState - Parameter forwarded to createReducer.
 * @param {*} (builder - Parameter forwarded to createReducer.
 */
const configurationReducer = createReducer(initialState, (builder) => {
    builder
      /**
       * addCase - Auto-generated documentation stub.
       *
       * @param {*} 'configuration/translations' - Parameter forwarded to addCase.
       * @param {*} (state - Parameter forwarded to addCase.
       * @param {*} action - Parameter forwarded to addCase.
       */
      .addCase('configuration/translations', (state, action) => {
        state.translations = action.payload;
      })
      /**
       * addCase - Store bootstrap initialization and partial updates.
       */
      .addCase('configuration/bootstrap', (state, action) => {
        state.bootstrap = {
            ...state.bootstrap,
            ...action.payload,
        };
      });
});

export { configurationReducer as configuration };
