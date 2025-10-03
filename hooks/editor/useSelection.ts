import { useCallback, useEffect, useRef, useState } from 'react';
import type { Vector2d } from '@types/konva';
import type { EditorElement } from '@types/editor';

export interface SelectionRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

const MIN_SELECTION_SIZE = 2;

export function normalizeSelectionRect(start: Vector2d, end: Vector2d): SelectionRect {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    return { x, y, width, height };
}

export function isElementInsideSelection(element: EditorElement, rect: SelectionRect): boolean {
    const ex = element.x ?? 0;
    const ey = element.y ?? 0;
    const ew = element.width ?? 0;
    const eh = element.height ?? 0;

    return ex >= rect.x && ey >= rect.y && ex + ew <= rect.x + rect.width && ey + eh <= rect.y + rect.height;
}

export interface UseSelectionOptions {
    onSelectionChange?: (ids: string[]) => void;
}

export interface UseSelectionReturn {
    selectedIds: string[];
    selectionRect: SelectionRect | null;
    selectionOriginRef: React.RefObject<Vector2d | null>;
    setSelectedIds: (ids: string[]) => void;
    setSelectionRect: (rect: SelectionRect | null) => void;
    selectElement: (id: string, mode?: 'single' | 'toggle' | 'add') => void;
    selectMultiple: (ids: string[]) => void;
    clearSelection: () => void;
    startRectSelection: (origin: Vector2d) => void;
    updateRectSelection: (current: Vector2d) => void;
    endRectSelection: (elements: EditorElement[]) => string[];
    cancelRectSelection: () => void;
}

export function useSelection({ onSelectionChange }: UseSelectionOptions = {}): UseSelectionReturn {
    const [selectedIds, setSelectedIdsState] = useState<string[]>([]);
    const [selectionRect, setSelectionRectState] = useState<SelectionRect | null>(null);
    const selectionOriginRef = useRef<Vector2d | null>(null);

    const setSelectedIds = useCallback((ids: string[]) => {
        setSelectedIdsState(ids);
        onSelectionChange?.(ids);
    }, [onSelectionChange]);

    const setSelectionRect = useCallback((rect: SelectionRect | null) => {
        setSelectionRectState(rect);
    }, []);

    const selectElement = useCallback(
        (id: string, mode: 'single' | 'toggle' | 'add' = 'single') => {
            if (mode === 'single') {
                setSelectedIds([id]);
            } else if (mode === 'toggle') {
                setSelectedIds((prev) =>
                    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                );
            } else if (mode === 'add') {
                setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
            }
        },
        [setSelectedIds],
    );

    const selectMultiple = useCallback(
        (ids: string[]) => {
            setSelectedIds(ids);
        },
        [setSelectedIds],
    );

    const clearSelection = useCallback(() => {
        setSelectedIds([]);
    }, [setSelectedIds]);

    const startRectSelection = useCallback((origin: Vector2d) => {
        selectionOriginRef.current = origin;
        setSelectionRectState(null);
    }, []);

    const updateRectSelection = useCallback((current: Vector2d) => {
        if (!selectionOriginRef.current) {
            return;
        }

        const rect = normalizeSelectionRect(selectionOriginRef.current, current);

        if (rect.width >= MIN_SELECTION_SIZE || rect.height >= MIN_SELECTION_SIZE) {
            setSelectionRectState(rect);
        }
    }, []);

    const endRectSelection = useCallback(
        (elements: EditorElement[]): string[] => {
            if (!selectionOriginRef.current || !selectionRect) {
                selectionOriginRef.current = null;
                setSelectionRectState(null);
                return [];
            }

            const selectedElementIds = elements
                .filter((element) => isElementInsideSelection(element, selectionRect))
                .map((element) => element.id);

            setSelectedIds(selectedElementIds);
            selectionOriginRef.current = null;
            setSelectionRectState(null);

            return selectedElementIds;
        },
        [selectionRect, setSelectedIds],
    );

    const cancelRectSelection = useCallback(() => {
        selectionOriginRef.current = null;
        setSelectionRectState(null);
    }, []);

    return {
        selectedIds,
        selectionRect,
        selectionOriginRef,
        setSelectedIds,
        setSelectionRect,
        selectElement,
        selectMultiple,
        clearSelection,
        startRectSelection,
        updateRectSelection,
        endRectSelection,
        cancelRectSelection,
    };
}
