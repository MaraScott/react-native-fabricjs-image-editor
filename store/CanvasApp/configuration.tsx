import { createReducer } from '@reduxjs/toolkit'

const initialState = { 
    logo: '',
    poster: '',
	translations: {}
}

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
});

export {configurationReducer as configuration };
