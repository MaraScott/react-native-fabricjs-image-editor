import { useSyncExternalStore } from 'react';
import type { LayerControlHandlers } from '@molecules/Canvas';

interface SimpleCanvasState {
    layerControls: LayerControlHandlers | null;
}

type Listener = () => void;

class SimpleCanvasStore {
    private state: SimpleCanvasState = {
        layerControls: null,
    };

    private listeners = new Set<Listener>();

    subscribe = (listener: Listener) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    getSnapshot = () => this.state;

    setLayerControls = (layerControls: LayerControlHandlers | null) => {
        if (this.state.layerControls === layerControls) {
            return;
        }
        this.state = { ...this.state, layerControls };
        this.emit();
    };

    clear = () => {
        this.setLayerControls(null);
    };

    private emit() {
        this.listeners.forEach((listener) => listener());
    }
}

const store = new SimpleCanvasStore();

export const setSimpleCanvasLayerControls = (layerControls: LayerControlHandlers | null) => {
    store.setLayerControls(layerControls);
};

export const clearSimpleCanvasLayerControls = () => {
    store.clear();
};

export const useSimpleCanvasStore = <T>(selector: (state: SimpleCanvasState) => T): T => {
    const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    return selector(snapshot);
};
