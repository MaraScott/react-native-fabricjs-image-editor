import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Vector2d } from '../../types/konva';

const PAN_INERTIA_FRICTION = 0.9;
const PAN_MIN_VELOCITY = 0.01;

export interface ZoomPanBounds {
    min: number;
    max: number;
}

export interface StageSize {
    width: number;
    height: number;
}

export interface WorkspaceSize {
    width: number;
    height: number;
}

export interface ZoomPanState {
    zoom: number;
    stagePosition: Vector2d;
    fitScale: number;
    zoomBounds: ZoomPanBounds;
    workspaceSize: WorkspaceSize;
    isPanMode: boolean;
    isPanning: boolean;
}

export interface UseZoomPanOptions {
    initialZoom: number;
    maxZoom: number;
    stageSize: StageSize;
    canvasRef: React.RefObject<HTMLDivElement | null>;
}

export function clampZoom(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) {
        return min;
    }
    return Math.max(min, Math.min(max, value));
}

export function computeFitScale(stageWidth: number, stageHeight: number, viewportWidth: number, viewportHeight: number): number {
    if (stageWidth <= 0 || stageHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
        return 1;
    }
    return Math.min(viewportWidth / stageWidth, viewportHeight / stageHeight);
}

export function clampStagePosition(
    position: Vector2d,
    zoom: number,
    stageSize: StageSize,
    workspaceSize: WorkspaceSize,
): Vector2d {
    const scaledStageWidth = stageSize.width * zoom;
    const scaledStageHeight = stageSize.height * zoom;

    const minX = Math.min(0, workspaceSize.width - scaledStageWidth);
    const maxX = Math.max(0, workspaceSize.width - scaledStageWidth);
    const minY = Math.min(0, workspaceSize.height - scaledStageHeight);
    const maxY = Math.max(0, workspaceSize.height - scaledStageHeight);

    return {
        x: Math.max(minX, Math.min(maxX, position.x)),
        y: Math.max(minY, Math.min(maxY, position.y)),
    };
}

export function scaleToPercent(scale: number, referenceScale: number): number {
    if (!Number.isFinite(scale) || scale <= 0) {
        return -100;
    }
    if (!Number.isFinite(referenceScale) || referenceScale <= 0) {
        return 0;
    }
    const ratio = scale / referenceScale;
    if (ratio >= 1) {
        return (ratio - 1) * 100;
    }
    return -(1 - ratio) * 100;
}

export function percentToScale(percent: number, referenceScale: number): number {
    if (!Number.isFinite(percent) || !Number.isFinite(referenceScale) || referenceScale <= 0) {
        return 1;
    }
    if (percent >= 0) {
        return referenceScale * (1 + percent / 100);
    }
    return referenceScale * (1 + percent / 100);
}

export interface UseZoomPanReturn extends ZoomPanState {
    setZoom: (zoom: number) => void;
    setStagePosition: (position: Vector2d) => void;
    setIsPanMode: (mode: boolean) => void;
    setIsPanning: (panning: boolean) => void;
    startPanInertia: (velocity: { vx: number; vy: number }) => void;
    stopInertia: () => void;
    zoomRef: React.RefObject<number>;
    stagePositionRef: React.RefObject<Vector2d>;
    workspaceSizeRef: React.RefObject<WorkspaceSize>;
    fitScaleRef: React.RefObject<number>;
    zoomBoundsRef: React.RefObject<ZoomPanBounds>;
    panStateRef: React.RefObject<{
        startPointer: Vector2d;
        startPosition: Vector2d;
    } | null>;
    panVelocityRef: React.RefObject<{ vx: number; vy: number }>;
    lastPanTimestampRef: React.RefObject<number | null>;
    spacePressedRef: React.RefObject<boolean>;
    stageHoverRef: React.RefObject<boolean>;
    previousCursorRef: React.RefObject<{ inline: string; hadInline: boolean } | null>;
}

export function useZoomPan({
    initialZoom,
    maxZoom,
    stageSize,
    canvasRef,
}: UseZoomPanOptions): UseZoomPanReturn {
    const [zoom, setZoomState] = useState(initialZoom);
    const [stagePosition, setStagePositionState] = useState<Vector2d>({ x: 0, y: 0 });
    const [workspaceSize, setWorkspaceSize] = useState<WorkspaceSize>({ width: 0, height: 0 });
    const [fitScale, setFitScale] = useState(1);
    const [zoomBounds, setZoomBounds] = useState<ZoomPanBounds>({ min: 1, max: maxZoom });
    const [isPanMode, setIsPanMode] = useState(false);
    const [isPanning, setIsPanning] = useState(false);

    const zoomRef = useRef(zoom);
    const stagePositionRef = useRef(stagePosition);
    const workspaceSizeRef = useRef(workspaceSize);
    const fitScaleRef = useRef(fitScale);
    const zoomBoundsRef = useRef(zoomBounds);
    const panStateRef = useRef<{ startPointer: Vector2d; startPosition: Vector2d } | null>(null);
    const panVelocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
    const lastPanTimestampRef = useRef<number | null>(null);
    const inertiaHandleRef = useRef<number | null>(null);
    const spacePressedRef = useRef(false);
    const stageHoverRef = useRef(false);
    const previousCursorRef = useRef<{ inline: string; hadInline: boolean } | null>(null);

    const setZoom = useCallback((newZoom: number) => {
        const clamped = clampZoom(newZoom, zoomBoundsRef.current.min, zoomBoundsRef.current.max);
        setZoomState(clamped);
        zoomRef.current = clamped;
    }, []);

    const setStagePosition = useCallback((position: Vector2d) => {
        const clamped = clampStagePosition(position, zoomRef.current, stageSize, workspaceSizeRef.current);
        setStagePositionState(clamped);
        stagePositionRef.current = clamped;
    }, [stageSize]);

    const stopInertia = useCallback(() => {
        if (inertiaHandleRef.current !== null) {
            cancelAnimationFrame(inertiaHandleRef.current);
            inertiaHandleRef.current = null;
        }
    }, []);

    const startPanInertia = useCallback(
        (velocity: { vx: number; vy: number }) => {
            let { vx, vy } = velocity;
            if (Math.abs(vx) < PAN_MIN_VELOCITY && Math.abs(vy) < PAN_MIN_VELOCITY) {
                return;
            }

            stopInertia();

            let lastTime: number | null = null;

            const step = (time: number) => {
                if (lastTime === null) {
                    lastTime = time;
                }
                const delta = time - lastTime;
                lastTime = time;

                const decay = Math.pow(PAN_INERTIA_FRICTION, delta / 16.67);
                vx *= decay;
                vy *= decay;

                if (Math.abs(vx) < PAN_MIN_VELOCITY && Math.abs(vy) < PAN_MIN_VELOCITY) {
                    stopInertia();
                    return;
                }

                const nextPosition = clampStagePosition(
                    {
                        x: stagePositionRef.current.x + vx * delta,
                        y: stagePositionRef.current.y + vy * delta,
                    },
                    zoomRef.current,
                    stageSize,
                    workspaceSizeRef.current,
                );

                if (
                    nextPosition.x === stagePositionRef.current.x &&
                    nextPosition.y === stagePositionRef.current.y
                ) {
                    stopInertia();
                    return;
                }

                setStagePosition(nextPosition);
                inertiaHandleRef.current = requestAnimationFrame(step);
            };

            inertiaHandleRef.current = requestAnimationFrame(step);
        },
        [setStagePosition, stageSize, stopInertia],
    );

    useEffect(() => {
        workspaceSizeRef.current = workspaceSize;
    }, [workspaceSize]);

    useEffect(() => {
        zoomBoundsRef.current = zoomBounds;
    }, [zoomBounds]);

    useEffect(() => {
        fitScaleRef.current = fitScale;
    }, [fitScale]);

    useEffect(() => {
        zoomRef.current = zoom;
    }, [zoom]);

    useEffect(() => {
        stagePositionRef.current = stagePosition;
    }, [stagePosition]);

    useEffect(() => () => stopInertia(), [stopInertia]);

    // Measure workspace
    useLayoutEffect(() => {
        const element = canvasRef.current;
        if (!element) {
            return;
        }

        const parseSpacingValue = (value: string | null | undefined) => {
            if (!value) {
                return 0;
            }
            const parsed = Number.parseFloat(value);
            return Number.isFinite(parsed) ? parsed : 0;
        };

        let frame: number | null = null;

        const measure = () => {
            frame = null;

            const rect = element.getBoundingClientRect();
            const style = typeof window !== 'undefined' ? window.getComputedStyle(element) : null;
            const paddingX = style
                ? parseSpacingValue(style.paddingLeft) + parseSpacingValue(style.paddingRight)
                : 0;
            const paddingY = style
                ? parseSpacingValue(style.paddingTop) + parseSpacingValue(style.paddingBottom)
                : 0;

            const width = Math.max(1, rect.width - paddingX);
            const height = Math.max(1, rect.height - paddingY);

            setWorkspaceSize((prev) => {
                if (prev.width === width && prev.height === height) {
                    return prev;
                }
                return { width, height };
            });

            const rawFitScale = computeFitScale(stageSize.width, stageSize.height, width, height);
            const clampedFitScale = Math.min(1, rawFitScale);
            setFitScale(clampedFitScale);

            const minZoom = Math.max(0.05, clampedFitScale * 0.1);
            setZoomBounds({ min: minZoom, max: maxZoom });
        };

        const scheduleMeasure = () => {
            if (frame === null) {
                frame = requestAnimationFrame(measure);
            }
        };

        scheduleMeasure();

        if (typeof window !== 'undefined') {
            const observer = new ResizeObserver(scheduleMeasure);
            observer.observe(element);

            return () => {
                observer.disconnect();
                if (frame !== null) {
                    cancelAnimationFrame(frame);
                }
            };
        }
    }, [canvasRef, maxZoom, stageSize.height, stageSize.width]);

    return {
        zoom,
        stagePosition,
        fitScale,
        zoomBounds,
        workspaceSize,
        isPanMode,
        isPanning,
        setZoom,
        setStagePosition,
        setIsPanMode,
        setIsPanning,
        startPanInertia,
        stopInertia,
        zoomRef,
        stagePositionRef,
        workspaceSizeRef,
        fitScaleRef,
        zoomBoundsRef,
        panStateRef,
        panVelocityRef,
        lastPanTimestampRef,
        spacePressedRef,
        stageHoverRef,
        previousCursorRef,
    };
}
