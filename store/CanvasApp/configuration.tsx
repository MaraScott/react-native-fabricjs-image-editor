import { createReducer } from '@reduxjs/toolkit';
import type { Language } from '@i18n';
import { resolveLanguage } from '@i18n';

export interface BootstrapConfiguration {
    width: number;
    height: number;
    backgroundColor: string;
    theme: 'kid' | 'adult';
    i18n: Language;
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
        const payload = { ...action.payload } as Partial<BootstrapConfiguration> & { i18n?: string | Language };
        if (typeof payload.i18n !== 'undefined') {
            payload.i18n = resolveLanguage(payload.i18n);
        }
        state.bootstrap = {
            ...state.bootstrap,
            ...payload,
        };
      });
});

export { configurationReducer as configuration };
