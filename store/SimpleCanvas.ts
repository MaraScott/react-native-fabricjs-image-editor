import { useSyncExternalStore } from 'react';
import type { LayerControlHandlers, LayerDescriptor } from '@molecules/Layer/Layer.types';

interface SimpleCanvasState {
    layerControls: LayerControlHandlers | null;
    renderableLayers: LayerDescriptor[];
    revision: number | null;
}

type Listener = () => void;

const areLayerArraysEqual = (first: LayerDescriptor[], second: LayerDescriptor[]) => {
    if (first === second) {
        return true;
    }
    if (first.length !== second.length) {
        return false;
    }
    for (let index = 0; index < first.length; index += 1) {
        if (first[index].id !== second[index].id) {
            return false;
        }
    }
    return true;
};

class SimpleCanvasStore {
    
    private state: SimpleCanvasState = {
        layerControls: null,
        renderableLayers: [],
        revision: null,
    };

    private listeners = new Set<Listener>();

    subscribe = (listener: Listener) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    getSnapshot = () => this.state;

    setLayerState = (layerControls: LayerControlHandlers | null, renderableLayers: LayerDescriptor[]) => {
        const nextRenderable = layerControls ? [...renderableLayers] : [];
        const nextRevision = layerControls?.layersRevision ?? null;

        if (
            this.state.layerControls === layerControls &&
            this.state.revision === nextRevision &&
            areLayerArraysEqual(this.state.renderableLayers, nextRenderable)
        ) {
            return;
        }

        this.state = {
            layerControls,
            renderableLayers: nextRenderable,
            revision: nextRevision,
        };

        this.emit();
    };

    clear = () => {
        if (!this.state.layerControls && this.state.renderableLayers.length === 0) {
            return;
        }

        this.state = {
            layerControls: null,
            renderableLayers: [],
        };

        this.emit();
    };

    private emit() {
        this.listeners.forEach((listener) => listener());
    }
}

const store = new SimpleCanvasStore();

export const setSimpleCanvasLayerState = (
    layerControls: LayerControlHandlers | null,
    renderableLayers: LayerDescriptor[]
) => {
    store.setLayerState(layerControls, renderableLayers);
};

export const clearSimpleCanvasLayerControls = () => {
    store.clear();
};

export const useSimpleCanvasStore = <T>(selector: (state: SimpleCanvasState) => T): T => {
    const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    return selector(snapshot);
};
