import { createReducer } from 'reduxToolkit'

const initialState = { 
    active: "select",
    ready: {
        player: false,
        videos: false,
        audios: false,
        medias: false,
        advanced: false,
        settings: false,
    },
}

const viewReducer = createReducer(initialState, (builder) => {
    builder
      .addCase('view/pan', (state, action) => {
        state.active = "pan";
      })
      .addCase('view/select', (state, action) => {
        state.active = "select";
      })
      .addCase('view/tool', (state, action) => {
        state.ready[action.payload] = true;
      })
});

export { viewReducer as view };