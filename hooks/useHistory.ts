import { useCallback, useReducer } from 'react';

type HistoryState<T> = {
  past: T[];
  present: T;
  future: T[];
};

type HistoryUpdater<T> = T | ((previous: T) => T);

type HistoryAction<T> =
  | { type: 'set'; payload: HistoryUpdater<T>; overwrite?: boolean }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; payload: T };

function historyReducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  switch (action.type) {
    case 'set': {
      const nextValue =
        typeof action.payload === 'function'
          ? (action.payload as (previous: T) => T)(state.present)
          : action.payload;

      if (action.overwrite) {
        return {
          past: [],
          present: nextValue,
          future: [],
        };
      }

      if (Object.is(state.present, nextValue)) {
        return state;
      }

      return {
        past: [...state.past, state.present],
        present: nextValue,
        future: [],
      };
    }
    case 'undo': {
      if (state.past.length === 0) {
        return state;
      }
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case 'redo': {
      if (state.future.length === 0) {
        return state;
      }
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    }
    case 'reset': {
      return {
        past: [],
        present: action.payload,
        future: [],
      };
    }
    default:
      return state;
  }
}

export function useHistory<T>(initialState: T) {
  const [state, dispatch] = useReducer(historyReducer<T>, {
    past: [],
    present: initialState,
    future: [],
  });

  const set = useCallback(
    (value: HistoryUpdater<T>, overwrite = false) => {
      dispatch({ type: 'set', payload: value, overwrite });
    },
    [dispatch],
  );

  const reset = useCallback(
    (value: T) => {
      dispatch({ type: 'reset', payload: value });
    },
    [dispatch],
  );

  const undo = useCallback(() => {
    dispatch({ type: 'undo' });
  }, [dispatch]);

  const redo = useCallback(() => {
    dispatch({ type: 'redo' });
  }, [dispatch]);

  return {
    value: state.present,
    set,
    reset,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
