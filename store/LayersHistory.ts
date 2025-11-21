import { useSyncExternalStore } from 'react';
import type { LayerDescriptor } from '@molecules/Layer/Layer.types';

export interface LayersSnapshot {
    layers: LayerDescriptor[];
    selectedLayerIds: string[];
    primaryLayerId: string | null;
    revision: number;
}

interface LayersHistoryState {
    present: LayersSnapshot;
    history: LayersSnapshot[];
    future: LayersSnapshot[];
}

type Listener = () => void;

const cloneSnapshot = (snapshot: LayersSnapshot): LayersSnapshot => ({
    layers: snapshot.layers.map((layer) => ({ ...layer, position: { ...layer.position }, scale: layer.scale ? { ...layer.scale } : undefined, bounds: layer.bounds ? { ...layer.bounds } : undefined })),
    selectedLayerIds: [...snapshot.selectedLayerIds],
    primaryLayerId: snapshot.primaryLayerId,
    revision: snapshot.revision,
});

const layersEqual = (a: LayersSnapshot | null, b: LayersSnapshot | null): boolean => {
    if (!a || !b) return false;
    if (a.layers.length !== b.layers.length) return false;
    for (let i = 0; i < a.layers.length; i += 1) {
        const la = a.layers[i];
        const lb = b.layers[i];
        if (la.id !== lb.id || la.rotation !== lb.rotation) return false;
        if (la.position.x !== lb.position.x || la.position.y !== lb.position.y) return false;
        const sa = la.scale ?? { x: 1, y: 1 };
        const sb = lb.scale ?? { x: 1, y: 1 };
        if (sa.x !== sb.x || sa.y !== sb.y) return false;
        if (la.visible !== lb.visible) return false;
    }
    return true;
};

class LayersHistoryStore {
    private state: LayersHistoryState | null = null;
    private listeners = new Set<Listener>();
    private maxHistory = 30;

    private dispatch(action: { type: 'INIT'; snapshot: LayersSnapshot } | { type: 'APPLY'; snapshot: LayersSnapshot } | { type: 'UNDO' } | { type: 'REDO' }) {
        switch (action.type) {
            case 'INIT': {
                this.state = {
                    present: cloneSnapshot(action.snapshot),
                    history: [],
                    future: [],
                };
                break;
            }
            case 'APPLY': {
                if (!this.state) {
                    this.dispatch({ type: 'INIT', snapshot: action.snapshot });
                    break;
                }
                const incoming = cloneSnapshot(action.snapshot);
                if (!layersEqual(incoming, this.state.present)) {
                    // layer change: push history, clear future, increment revision
                    incoming.revision = this.state.present.revision + 1;
                    this.state = {
                        present: incoming,
                        history: [...this.state.history.slice(-(this.maxHistory - 1)), cloneSnapshot(this.state.present)],
                        future: [],
                    };
                } else {
                    // selection-only change: update present, keep history/future
                    incoming.revision = this.state.present.revision;
                    this.state = {
                        ...this.state,
                        present: incoming,
                    };
                }
                break;
            }
            case 'UNDO': {
                if (!this.state || this.state.history.length === 0) break;
                const prev = this.state.history[this.state.history.length - 1];
                const remaining = this.state.history.slice(0, -1);
                const current = cloneSnapshot(this.state.present);
                this.state = {
                    present: { ...prev, revision: prev.revision },
                    history: remaining,
                    future: [current, ...this.state.future],
                };
                break;
            }
            case 'REDO': {
                if (!this.state || this.state.future.length === 0) break;
                const [next, ...rest] = this.state.future;
                const current = cloneSnapshot(this.state.present);
                this.state = {
                    present: { ...cloneSnapshot(next), revision: next.revision },
                    history: [...this.state.history, current],
                    future: rest,
                };
                break;
            }
        }
        this.emit();
    }

    init(snapshot: LayersSnapshot) {
        this.dispatch({ type: 'INIT', snapshot });
    }

    apply(next: LayersSnapshot) {
        this.dispatch({ type: 'APPLY', snapshot: next });
    }

    undo() {
        this.dispatch({ type: 'UNDO' });
    }

    redo() {
        this.dispatch({ type: 'REDO' });
    }

    getSnapshot = () => this.state ?? null;

    subscribe = (listener: Listener) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    private emit() {
        this.listeners.forEach((listener) => listener());
    }
}

const store = new LayersHistoryStore();

export const initLayersHistory = (snapshot: LayersSnapshot) => store.init(snapshot);
export const applyLayersSnapshot = (snapshot: LayersSnapshot) => store.apply(snapshot);
export const undoLayers = () => store.undo();
export const redoLayers = () => store.redo();
export const subscribeLayersHistory = (listener: Listener) => store.subscribe(listener);
export const getLayersSnapshot = () => store.getSnapshot();
export const useLayersHistory = <T>(selector: (state: LayersHistoryState | null) => T): T => {
    const snap = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    return selector(snap);
};
