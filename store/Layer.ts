import { useSyncExternalStore, type SetStateAction } from 'react';

export type LayerDropPosition = 'above' | 'below';

export interface DragOverLayer {
    id: string;
    position: LayerDropPosition;
}

interface LayerStoreState {
    draggingLayerId: string | null;
    dragOverLayer: DragOverLayer | null;
    copyFeedback: string | null;
}

interface LayerStoreActions {
    setDraggingLayerId: (action: SetStateAction<string | null>) => void;
    setDragOverLayer: (action: SetStateAction<DragOverLayer | null>) => void;
    setCopyFeedback: (action: SetStateAction<string | null>) => void;
    resetDragState: () => void;
    clearCopyFeedback: () => void;
}

export type LayerStoreSnapshot = LayerStoreState & LayerStoreActions;

type Listener = () => void;

const initialState: LayerStoreState = {
    draggingLayerId: null,
    dragOverLayer: null,
    copyFeedback: null,
};

const applyStateAction = <T>(action: SetStateAction<T>, current: T): T => {
    if (typeof action === 'function') {
        return (action as (value: T) => T)(current);
    }
    return action;
};

class LayerStore {
    private state: LayerStoreState = initialState;
    private listeners = new Set<Listener>();
    private snapshot: LayerStoreSnapshot;

    private readonly actions: LayerStoreActions = {
        setDraggingLayerId: (action) => this.updateField('draggingLayerId', action),
        setDragOverLayer: (action) => this.updateField('dragOverLayer', action),
        setCopyFeedback: (action) => this.updateField('copyFeedback', action),
        resetDragState: () => this.setState({ draggingLayerId: null, dragOverLayer: null }),
        clearCopyFeedback: () => this.setState({ copyFeedback: null }),
    };

    constructor() {
        this.snapshot = this.composeSnapshot();
    }

    private updateField<K extends keyof LayerStoreState>(key: K, action: SetStateAction<LayerStoreState[K]>) {
        const nextValue = applyStateAction(action, this.state[key]);
        if (Object.is(nextValue, this.state[key])) {
            return;
        }
        this.setState({ [key]: nextValue } as Pick<LayerStoreState, K>);
    }

    private setState(partial: Partial<LayerStoreState>) {
        const nextState = { ...this.state, ...partial };
        const changed = !Object.is(nextState.draggingLayerId, this.state.draggingLayerId)
            || !Object.is(nextState.dragOverLayer, this.state.dragOverLayer)
            || !Object.is(nextState.copyFeedback, this.state.copyFeedback);

        if (!changed) {
            return;
        }

        this.state = nextState;
        this.snapshot = this.composeSnapshot();
        this.emit();
    }

    private composeSnapshot(): LayerStoreSnapshot {
        return {
            ...this.state,
            ...this.actions,
        };
    }

    private emit() {
        this.listeners.forEach((listener) => listener());
    }

    subscribe = (listener: Listener) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    getSnapshot = () => this.snapshot;
}

const store = new LayerStore();

/**
 * Hook-like accessor for the Layer store.
 * Provides selected fragments of the Layer panel state and actions.
 */
export const useLayerStore = <T>(selector: (state: LayerStoreSnapshot) => T): T => {
    const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    return selector(snapshot);
};
