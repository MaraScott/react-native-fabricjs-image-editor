import { createReducer } from '@reduxjs/toolkit'

const initialState = { 
    logo: '',
    poster: '',
	translations: {}
}

const configurationReducer = createReducer(initialState, (builder) => {
    builder
      .addCase('configuration/translations', (state, action) => {
        state.translations = action.payload;
      })
});

export {configurationReducer as configuration };