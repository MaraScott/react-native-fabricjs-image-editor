import { useSyncExternalStore } from 'react';
import type { LayerDescriptor } from '@molecules/Layer/Layer.types';

// History stack mirrors the Konva React undo/redo guidance:
// https://konvajs.org/docs/react/Undo-Redo.html
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
    pointer: number;
}

type Listener = () => void;

const cloneSnapshot = (snapshot: LayersSnapshot): LayersSnapshot => ({
    layers: snapshot.layers.map((layer) => ({
        ...layer,
        position: { ...layer.position },
        scale: layer.scale ? { ...layer.scale } : undefined,
        bounds: layer.bounds ? { ...layer.bounds } : undefined,
        strokes: layer.strokes ? layer.strokes.map((stroke) => ({ ...stroke, points: [...stroke.points] })) : undefined,
    })),
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
        if (la.id !== lb.id || la.name !== lb.name || la.rotation !== lb.rotation) return false;
        if (la.position.x !== lb.position.x || la.position.y !== lb.position.y) return false;
        const sa = la.scale ?? { x: 1, y: 1 };
        const sb = lb.scale ?? { x: 1, y: 1 };
        if (sa.x !== sb.x || sa.y !== sb.y) return false;
        if (la.visible !== lb.visible) return false;
        if ((la.opacity ?? 1) !== (lb.opacity ?? 1)) return false;
        const strokesA = la.strokes ?? [];
        const strokesB = lb.strokes ?? [];
        if (strokesA.length !== strokesB.length) return false;
        for (let s = 0; s < strokesA.length; s += 1) {
            const saStroke = strokesA[s];
            const sbStroke = strokesB[s];
            if (
                saStroke.id !== sbStroke.id ||
                saStroke.color !== sbStroke.color ||
                saStroke.size !== sbStroke.size ||
                saStroke.hardness !== sbStroke.hardness ||
                saStroke.opacity !== sbStroke.opacity
            ) {
                return false;
            }
            if (saStroke.points.length !== sbStroke.points.length) return false;
            for (let p = 0; p < saStroke.points.length; p += 1) {
                if (saStroke.points[p] !== sbStroke.points[p]) return false;
            }
        }
    }
    return true;
};

class LayersHistoryStore {
    private state: LayersHistoryState | null = null;
    private timeline: LayersSnapshot[] = [];
    private pointer = -1;
    private listeners = new Set<Listener>();
    private maxHistory = 30;

    private syncFromTimeline() {
        if (this.pointer < 0 || this.pointer >= this.timeline.length) {
            this.state = null;
            return;
        }

        this.state = {
            present: this.timeline[this.pointer],
            history: this.timeline.slice(0, this.pointer),
            future: this.timeline.slice(this.pointer + 1),
            pointer: this.pointer,
        };
    }

    private commitSnapshot(snapshot: LayersSnapshot) {
        const incoming = cloneSnapshot(snapshot);
        const current = this.timeline[this.pointer] ?? null;

        const layerChanged = !layersEqual(incoming, current);

        if (!layerChanged) {
            // Keep selection/primary updates current without polluting the history stack
            const safeRevision = current?.revision ?? incoming.revision ?? 0;
            this.timeline[this.pointer] = { ...incoming, revision: safeRevision };
            this.syncFromTimeline();
            return;
        }

        const baseRevision = current?.revision ?? incoming.revision ?? 0;
        incoming.revision = baseRevision + 1;

        const truncated = [...this.timeline.slice(0, this.pointer + 1), incoming];
        const trimmed = truncated.slice(-(this.maxHistory));

        this.timeline = trimmed;
        this.pointer = this.timeline.length - 1;
        this.syncFromTimeline();
    }

    private dispatch(action: { type: 'INIT'; snapshot: LayersSnapshot } | { type: 'APPLY'; snapshot: LayersSnapshot } | { type: 'UNDO' } | { type: 'REDO' }) {
        switch (action.type) {
            case 'INIT': {
                this.timeline = [cloneSnapshot(action.snapshot)];
                this.pointer = 0;
                this.syncFromTimeline();
                break;
            }
            case 'APPLY': {
                if (this.pointer < 0 || this.timeline.length === 0) {
                    this.dispatch({ type: 'INIT', snapshot: action.snapshot });
                    break;
                }
                this.commitSnapshot(action.snapshot);
                break;
            }
            case 'UNDO': {
                if (this.pointer <= 0) break;
                this.pointer -= 1;
                this.syncFromTimeline();
                break;
            }
            case 'REDO': {
                if (this.pointer < 0 || this.pointer >= this.timeline.length - 1) break;
                this.pointer += 1;
                this.syncFromTimeline();
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
