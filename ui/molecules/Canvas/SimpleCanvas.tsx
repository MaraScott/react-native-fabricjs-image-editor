import { useRef, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { WHEEL_ZOOM_STEP, KEYBOARD_ZOOM_STEP, PINCH_ZOOM_SENSITIVITY, TOUCH_DELTA_THRESHOLD, useUpdateZoom, useApplyZoomDelta } from './hooks/zoomUtils';
import { useResize } from './hooks/useResize';
import { useRotation } from './hooks/useRotation';
import { useSelector, useDispatch } from 'react-redux';
import { selectActions } from '@store/CanvasApp/view/select';
import { selectSelectionTransform } from '@store/CanvasApp/view/selectors';
import { Stage } from '@atoms/Canvas';
import { SelectionLayer, StageGroup, LayerPanelUI, BackgroundLayer } from '@molecules/Layer';
import { useSimpleCanvasStore } from '@store/SimpleCanvas';
import { useSelectionBounds } from './hooks/useSelectionBounds';
import { Layer as KonvaLayer } from '@atoms/Canvas';

import type { RootState } from '@store/CanvasApp';
import type { PointerPanState, TouchPanState, SelectionDragState, SelectionNodeSnapshot, SelectionTransformSnapshot, Bounds } from './types/canvas.types';
import type { PanOffset } from '@molecules/Layer/Layer.types';

import { Rect, Group } from "react-konva";

export interface SimpleCanvasProps {
    stageWidth?: number;
    stageHeight?: number;
    backgroundColor?: string;
    containerBackground?: string;
    zoom?: number;
    fitRequest?: number;
    children?: ReactNode;
    onStageReady?: (stage: Konva.Stage) => void;
    onZoomChange?: (zoom: number) => void;
    panModeActive?: boolean;
    layersRevision?: number;
    selectModeActive?: boolean;
}

export const SimpleCanvas = ({
    stageWidth = 1024,
    stageHeight = 1024,
    containerBackground = '#cccccc',
    zoom = 0,
    fitRequest = 0,
    children,
    onStageReady,
    onZoomChange,
    panModeActive = false,
    layersRevision = 0,
    selectModeActive = false,
}: SimpleCanvasProps) => {
    const { layerControls, renderableLayers } = useSimpleCanvasStore((state) => state);
    const dispatch = useDispatch();
    const isSelectToolActive = useSelector((state: RootState) => state.view.select.active);
    // Read selectionTransform from Redux
    const reduxSelectionTransform = useSelector(selectSelectionTransform);
    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastTouchDistance = useRef(0);
    const pointerPanState = useRef<PointerPanState | null>(null);
    const touchPanState = useRef<TouchPanState | null>(null);
    const selectionDragStateRef = useRef<SelectionDragState | null>(null);
    const onRefChange = ({ node, layer }) => {
        if (node) {
            layerNodeRefs.current.set(layer.id, node);
        } else {
            layerNodeRefs.current.delete(layer.id);
        }
        syncTransformerToSelection();
    }
    const pendingSelectionRef = useRef<string[] | null>(null);
    const interactionLayerRef = useRef<Konva.Layer | null>(null);
    const selectionTransformerRef = useRef<Konva.Transformer | null>(null);
    const selectionTransformStateRef = useRef<SelectionTransformSnapshot | null>(null);
    const transformAnimationFrameRef = useRef<number | null>(null);
    const isSelectionTransformingRef = useRef(false);
    const [internalZoom, setInternalZoom] = useState<number>(zoom);
    const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 });
    // Use useResize hook for containerDimensions and scale (keep single containerRef)
    const { dimensions: containerDimensions, scale, setDimensions: setContainerDimensions, setScale } = useResize(containerRef, stageWidth, stageHeight, internalZoom);
    const panOffsetRef = useRef(panOffset);
    const [spacePressed, setSpacePressed] = useState(false);
    const [isPointerPanning, setIsPointerPanning] = useState(false);
    const [isTouchPanning, setIsTouchPanning] = useState(false);
    const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
    const [layerRefreshKey, setLayerRefreshKey] = useState(0);
    const [selectedLayerBounds, setSelectedLayerBounds] = useState<Bounds | null>(null);
    const [overlaySelectionBox, setOverlaySelectionBox] = useState<
        | { x: number; y: number; width: number; height: number; rotation?: number }
        | null
    >(null);

    // Map of selected layer IDs to their Konva nodes
    const selectedLayerNodeRefs = useRef<Map<string, Konva.Node>>(new Map());

    const layersToRender = useMemo(() => {
        if (!layerControls) return [];

        const source =
            renderableLayers.length === layerControls.layers.length
                ? renderableLayers
                : layerControls.layers;

        // always return a fresh array to reflect changed order
        return [...source];
    }, [layerControls?.layers, renderableLayers]);

    // Keep Konva node order in sync when moveLayer fires.
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const applyOrder = (orderedIds: string[]) => {
            orderedIds.forEach((id, index) => {
                const node = layerNodeRefs.current.get(id);
                if (node) {
                    node.zIndex(index);
                }
            });
            setLayerRefreshKey((previous) => previous + 1);
            interactionLayerRef.current?.batchDraw?.();
        };

        const handleRefresh = (event: Event) => {
            const detail = (event as CustomEvent<{ layerIds?: string[] }>).detail;
            const orderedIds = detail?.layerIds ?? layersToRender.map((layer) => layer.id);
            applyOrder(orderedIds);
        };

        // Initial sync for current render order
        applyOrder(layersToRender.map((layer) => layer.id));

        window.addEventListener('layer-move-refresh', handleRefresh as EventListener);
        return () => {
            window.removeEventListener('layer-move-refresh', handleRefresh as EventListener);
        };
    }, [layersToRender]);

    const selectedLayerIds = layerControls?.selectedLayerIds ?? [];
    const stableSelectedLayerIds = useMemo(
        () => selectedLayerIds,
        [JSON.stringify(selectedLayerIds)]
    );
    const selectedLayerSet = useMemo(() => new Set(selectedLayerIds), [selectedLayerIds]);

    // Viewport offsets and transformer scale helpers
    const renderWidth = Math.max(1, stageWidth * scale);
    const renderHeight = Math.max(1, stageHeight * scale);
    const safeScale = Math.max(scale, 0.0001);
    const stageViewportOffsetX = ((containerDimensions.width - renderWidth) / 2 + panOffset.x) / Math.max(safeScale, 0.000001);
    const stageViewportOffsetY = ((containerDimensions.height - renderHeight) / 2 + panOffset.y) / Math.max(safeScale, 0.000001);
    // Keep selection handles a constant screen size (do not scale with zoom)
    const outlineDash: [number, number] = [8, 4];
    const transformerAnchorSize = 8;
    const transformerAnchorStrokeWidth = 1;
    const transformerAnchorCornerRadius = 2;
    const transformerPadding = 0;
    const transformerHitStrokeWidth = 12;
    // Keep pan offset ref in sync for event handlers that read it
    useEffect(() => {
        panOffsetRef.current = panOffset;
    }, [panOffset]);

    // Utility: Sync selectedLayerNodeRefs from layerNodeRefs and selectedLayerIds
    const syncSelectedLayerNodeRefs = useCallback(() => {
        selectedLayerNodeRefs.current.clear();
        selectedLayerIds.forEach((id) => {
            const node = layerNodeRefs.current.get(id);
            if (node) {
                selectedLayerNodeRefs.current.set(id, node);
            }
        });
    }, [selectedLayerIds]);

    // Utility: Commit selected layer node values back to app state (e.g., after transform)
    const commitSelectedLayerNodeTransforms = useCallback(() => {
        if (!layerControls) return;
        selectedLayerNodeRefs.current.forEach((node, id) => {
            if (!node) return;
            const pos = node.position();
            const rot = node.rotation();
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            // Nodes are positioned with viewport offsets applied; store back in layer space.
            const adjustedX = pos.x - stageViewportOffsetX;
            const adjustedY = pos.y - stageViewportOffsetY;

            if (typeof layerControls.updateLayerTransform === 'function') {
                layerControls.updateLayerTransform(id, {
                    position: { x: adjustedX, y: adjustedY },
                    rotation: rot,
                    scale: { x: scaleX, y: scaleY },
                });
            } else {
                if (typeof layerControls.updateLayerPosition === 'function') {
                    layerControls.updateLayerPosition(id, { x: adjustedX, y: adjustedY });
                }
                if (typeof layerControls.updateLayerRotation === 'function') {
                    layerControls.updateLayerRotation(id, rot);
                }
                if (typeof layerControls.updateLayerScale === 'function') {
                    layerControls.updateLayerScale(id, { x: scaleX, y: scaleY });
                }
            }
        });
    }, [layerControls, stageViewportOffsetX, stageViewportOffsetY]);
    const layerNodeRefs = useRef<Map<string, Konva.Node>>(new Map());

    // Use selection bounds hook (must be before using resolveSelectionRotation)
    const {
        updateBoundsFromLayerIds: _updateBoundsFromLayerIds,
        refreshBoundsFromSelection: _refreshBoundsFromSelection,
        scheduleBoundsRefresh,
        resolveSelectionRotation,
    } = useSelectionBounds({
        selectModeActive,
        layerControls,
        stageRef,
        layerNodeRefs,
        pendingSelectionRef,
        transformAnimationFrameRef,
        setSelectedLayerBounds,
    });

    // Rotation logic is now handled by useRotation (must be after resolveSelectionRotation)
    const { selectionProxyRotationRef, getRotationDeg, getRotationRad } = useRotation(resolveSelectionRotation);

    // Wrap bounds functions with debug logging
    // Assume updateBoundsFromLayerIds takes a single argument (array of ids)
    const updateBoundsFromLayerIds = (ids: string[]) => {
        return _updateBoundsFromLayerIds(ids);
    };
    // Assume refreshBoundsFromSelection takes no arguments
    const refreshBoundsFromSelection = () => {
        return _refreshBoundsFromSelection();
    };


    // --- Unified selection transform state for Layer and SelectionLayer ---
    // Use Redux selectionTransform as the single source of truth
    const selectionTransform = reduxSelectionTransform;

    // Ensure selectionTransform is initialized when selection changes
    useEffect(() => {
        if (selectedLayerIds.length > 0 && !reduxSelectionTransform) {
            // Compute bounding box from selectedLayerBounds if available
            if (selectedLayerBounds) {
                const { x, y, width, height } = selectedLayerBounds;
                // Default rotation and scale
                const rotation = 0;
                const scaleX = 1;
                const scaleY = 1;
                dispatch(selectActions.setSelectionTransform({ x, y, width, height, rotation, scaleX, scaleY }));
            }
        }
        // If selection is cleared, also clear selectionTransform
        if (selectedLayerIds.length === 0 && reduxSelectionTransform) {
            dispatch(selectActions.setSelectionTransform(null));
        }
    }, [selectedLayerIds, selectedLayerBounds, reduxSelectionTransform, dispatch]);

    // Recenter-on-fit token from parent (Fit button)
    useEffect(() => {
        setPanOffset({ x: 0, y: 0 });
        panOffsetRef.current = { x: 0, y: 0 };
    }, [fitRequest]);

    const captureSelectionTransformState = useCallback(() => {

        const nodeSnapshots = selectedLayerIds
            .map((layerId) => {
                const node = layerNodeRefs.current.get(layerId);
                if (!node) {
                    return null;
                }

                return {
                    id: layerId,
                    node,
                    transform: node.getAbsoluteTransform().copy(),
                };
            })
            .filter((snapshot): snapshot is SelectionNodeSnapshot => Boolean(snapshot));

        if (nodeSnapshots.length === 0) {
            selectionTransformStateRef.current = null;
            return;
        }

    }, [selectedLayerIds]);

    const applySelectionTransformDelta = useCallback(() => {
        const snapshot = selectionTransformStateRef.current;
        if (!snapshot) {
            return;
        }
    }, []);

    // On transform finalize, update Redux selectionTransform
    const finalizeSelectionTransform = useCallback(() => {
        if (layerControls) {
            selectedLayerIds.forEach((layerId) => {
                const node = layerNodeRefs.current.get(layerId);
                if (!node) {
                    return;
                }
                const position = node.position();
                layerControls.updateLayerPosition(layerId, {
                    x: position.x,
                    y: position.y,
                });
                const rotation = node.rotation();
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                if (typeof layerControls.updateLayerTransform === 'function') {
                    layerControls.updateLayerTransform(layerId, {
                        position: { x: position.x, y: position.y },
                        rotation,
                        scale: { x: scaleX, y: scaleY },
                    });
                } else {
                    if (typeof layerControls.updateLayerRotation === 'function') {
                        layerControls.updateLayerRotation(layerId, rotation);
                    }
                    if (typeof layerControls.updateLayerScale === 'function') {
                        layerControls.updateLayerScale(layerId, { x: scaleX, y: scaleY });
                    }
                }
            });
            layerControls.ensureAllVisible();
        }
        selectionTransformStateRef.current = null;
        isSelectionTransformingRef.current = false;
        scheduleBoundsRefresh();
    }, [dispatch, layerControls, scheduleBoundsRefresh, selectedLayerIds]);

    // Unified effect for selection bounds refresh
    useEffect(() => {
        if (!selectModeActive) {
            setSelectedLayerBounds(null);
            return;
        }
        // Always refresh on these triggers
        refreshBoundsFromSelection();
    }, [selectModeActive, layersRevision, scale, JSON.stringify(selectedLayerIds)]);

    // Unified effect: handle stage ready, scale, and zoom sync
    useEffect(() => {
        if (stageRef.current) {
            if (onStageReady) onStageReady(stageRef.current);
            stageRef.current.scale({ x: scale, y: scale });
        }
        setInternalZoom(zoom);
    }, [onStageReady, scale, zoom]);

    // Zoom useCallback hooks
    const updateZoom = useUpdateZoom(onZoomChange, setInternalZoom);
    const applyZoomDelta = useApplyZoomDelta(updateZoom);

    const markSelectionTransforming = useCallback((flag: boolean) => {
        isSelectionTransformingRef.current = flag;
    }, []);

    const initializeSelectionTransform = useCallback((bounds: Bounds | null) => {
        if (!bounds) return;
        const { x, y, width, height } = bounds;
        const rotation = 0;
        const scaleX = 1;
        const scaleY = 1;
        dispatch(selectActions.setSelectionTransform({ x, y, width, height, rotation, scaleX, scaleY }));
    }, [dispatch]);

    // Mouse wheel zoom
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (event: WheelEvent) => {
            const target = event.target as HTMLElement | null;
            if (target && target.closest('.layer-panel-ui')) {
                // Let the layer panel handle its own scrolling
                return;
            }

            event.preventDefault();

            if (event.deltaY === 0) return;

            const direction = -Math.sign(event.deltaY);
            applyZoomDelta(direction * WHEEL_ZOOM_STEP);
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [applyZoomDelta]);

    // Keyboard zoom controls and pan activation via space bar
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target) {
                const tagName = target.tagName;
                if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable) {
                    return;
                }
            }

            if (event.code === 'Space') {
                if (!event.repeat) {
                    setSpacePressed(true);
                }
                event.preventDefault();
                return;
            }

            if (event.key === '+' || event.key === '=') {
                event.preventDefault();
                applyZoomDelta(KEYBOARD_ZOOM_STEP);
            } else if (event.key === '-' || event.key === '_') {
                event.preventDefault();
                applyZoomDelta(-KEYBOARD_ZOOM_STEP);
            } else if (event.key === '0' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                updateZoom(() => 0);
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.code === 'Space') {
                setSpacePressed(false);
            }
        };

        const handleWindowBlur = () => {
            setSpacePressed(false);
            pointerPanState.current = null;
            setIsPointerPanning(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [applyZoomDelta, updateZoom]);

    const clearSelection = useCallback(() => {
        if (layerControls && typeof layerControls.clearSelection === 'function') {
            layerControls.clearSelection();
        } else {
            pendingSelectionRef.current = null;
            setSelectedLayerBounds(null);
        }
    }, [layerControls]);

    // Deselect when clicking anywhere outside the canvas container
    useEffect(() => {
        if (!selectModeActive || !layerControls) return;
        if (typeof document === 'undefined') return;

        const handleDocumentPointerDown = (ev: PointerEvent) => {
            const target = ev.target as Node | null;
            if (containerRef.current && target && containerRef.current.contains(target)) {
                // Click was inside the canvas container - ignore (stage handler handles background clicks)
                return;
            }

            clearSelection();
        };

        document.addEventListener('pointerdown', handleDocumentPointerDown);
        return () => document.removeEventListener('pointerdown', handleDocumentPointerDown);
    }, [selectModeActive, layerControls, clearSelection]);

    const finishPointerPan = useCallback((event?: React.PointerEvent<HTMLDivElement>) => {
        if (!pointerPanState.current) {
            return;
        }

        const { pointerId } = pointerPanState.current;

        if (event) {
            try {
                if (event.currentTarget.hasPointerCapture(pointerId)) {
                    event.currentTarget.releasePointerCapture(pointerId);
                }
            } catch {
                // Ignore pointer capture release issues
            }
        }

        pointerPanState.current = null;
        setIsPointerPanning(false);
    }, []);

    const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
            return;
        }

        if (event.button !== 0) {
            return;
        }

        if (selectModeActive) {
            return;
        }

        if (!(panModeActive || spacePressed)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        pointerPanState.current = {
            pointerId: event.pointerId,
            start: { x: event.clientX, y: event.clientY },
            origin: { ...panOffsetRef.current },
        };
        setIsPointerPanning(true);

        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
            // Ignore pointer capture issues, panning will still work without it
        }
    }, [panModeActive, spacePressed]);

    const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const state = pointerPanState.current;
        if (!state || event.pointerId !== state.pointerId) {
            return;
        }

        event.preventDefault();

        const deltaX = event.clientX - state.start.x;
        const deltaY = event.clientY - state.start.y;

        setPanOffset({
            x: state.origin.x + deltaX,
            y: state.origin.y + deltaY,
        });
    }, []);

    const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const state = pointerPanState.current;
        if (!state || event.pointerId !== state.pointerId) {
            return;
        }

        event.preventDefault();
        finishPointerPan(event);
    }, [finishPointerPan]);

    const handlePointerCancel = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const state = pointerPanState.current;
        if (!state || event.pointerId !== state.pointerId) {
            return;
        }

        finishPointerPan(event);
    }, [finishPointerPan]);

    const handlePointerLeave = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const state = pointerPanState.current;
        if (!state || event.pointerId !== state.pointerId) {
            return;
        }

        finishPointerPan(event);
    }, [finishPointerPan]);

    // Touch pinch zoom and three-finger pan
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const getTouchDistance = (touches: TouchList) => {
            if (touches.length < 2) return 0;

            const touchOne = touches[0];
            const touchTwo = touches[1];

            const dx = touchTwo.clientX - touchOne.clientX;
            const dy = touchTwo.clientY - touchOne.clientY;

            return Math.sqrt(dx * dx + dy * dy);
        };

        const getTouchCenter = (touches: TouchList) => {
            let sumX = 0;
            let sumY = 0;
            const count = touches.length;

            for (let index = 0; index < count; index += 1) {
                const touch = touches[index];
                sumX += touch.clientX;
                sumY += touch.clientY;
            }

            return {
                x: sumX / count,
                y: sumY / count,
            };
        };

        const clearTouchPan = () => {
            if (touchPanState.current) {
                touchPanState.current = null;
                setIsTouchPanning(false);
            }
        };

        const handleTouchStart = (event: TouchEvent) => {
            const touches = event.touches;

            if (panModeActive && touches.length === 1) {
                event.preventDefault();
                touchPanState.current = {
                    center: getTouchCenter(touches),
                    origin: { ...panOffsetRef.current },
                    touchCount: 1,
                };
                setIsTouchPanning(true);
                lastTouchDistance.current = 0;
                return;
            }

            if (touches.length === 3) {
                event.preventDefault();
                touchPanState.current = {
                    center: getTouchCenter(touches),
                    origin: { ...panOffsetRef.current },
                    touchCount: 3,
                };
                setIsTouchPanning(true);
                lastTouchDistance.current = 0;
            } else if (touches.length === 2) {
                event.preventDefault();
                clearTouchPan();
                lastTouchDistance.current = getTouchDistance(touches);
            }
        };

        const handleTouchMove = (event: TouchEvent) => {
            const touches = event.touches;
            const panState = touchPanState.current;

            if (panState && panState.touchCount === 1) {
                if (!panModeActive) {
                    clearTouchPan();
                    return;
                }

                if (touches.length === 1) {
                    event.preventDefault();
                    const center = getTouchCenter(touches);

                    setPanOffset({
                        x: panState.origin.x + (center.x - panState.center.x),
                        y: panState.origin.y + (center.y - panState.center.y),
                    });
                    return;
                }
            }

            if (panState && panState.touchCount === 3 && touches.length === 3) {
                event.preventDefault();
                const center = getTouchCenter(touches);

                setPanOffset({
                    x: panState.origin.x + (center.x - panState.center.x),
                    y: panState.origin.y + (center.y - panState.center.y),
                });
                return;
            }

            if (touches.length === 2) {
                event.preventDefault();

                const currentDistance = getTouchDistance(touches);
                const previousDistance = lastTouchDistance.current;

                if (previousDistance > 0) {
                    const scaleFactor = currentDistance / previousDistance;
                    const deltaZoom = (scaleFactor - 1) * PINCH_ZOOM_SENSITIVITY;

                    applyZoomDelta(deltaZoom, TOUCH_DELTA_THRESHOLD);
                }

                lastTouchDistance.current = currentDistance;
            }
        };

        const handleTouchEnd = (event: TouchEvent) => {
            if (touchPanState.current) {
                const activeCount = touchPanState.current.touchCount;

                if ((activeCount === 3 && event.touches.length < 3) || (activeCount === 1 && event.touches.length === 0)) {
                    clearTouchPan();
                }
            }

            if (event.touches.length < 2) {
                lastTouchDistance.current = 0;
            }

            if (panModeActive && event.touches.length === 1 && (!touchPanState.current || touchPanState.current.touchCount !== 1)) {
                touchPanState.current = {
                    center: getTouchCenter(event.touches),
                    origin: { ...panOffsetRef.current },
                    touchCount: 1,
                };
                setIsTouchPanning(true);
                lastTouchDistance.current = 0;
            }
        };

        const handleTouchCancel = () => {
            clearTouchPan();
            lastTouchDistance.current = 0;
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);
        container.addEventListener('touchcancel', handleTouchCancel);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('touchcancel', handleTouchCancel);
        };
    }, [applyZoomDelta, panModeActive]);

    const sharedSelectionRect = selectionTransform ?? null;

    const baseCursor = (isPointerPanning || isTouchPanning)
        ? 'grabbing'
        : (panModeActive || spacePressed ? 'grab' : 'default');

    useEffect(() => {
        if (!stageRef.current) {
            return;
        }

        stageRef.current.container().style.cursor = baseCursor;
    }, [baseCursor, selectModeActive]);

    // Compute an HTML overlay selection box (screen-space) so the selection
    // bounding box can be visible even when portions are outside the Konva stage.
    useEffect(() => {
        if (!selectedLayerBounds) {
            setOverlaySelectionBox(null);
            return;
        }

        // Use selectedLayerBounds directly - same coordinates as Transformer
        // KonvaSelectionBox will use x,y as top-left corner (not center)
        const rotationDeg = resolveSelectionRotation();

        const newBox = {
            x: selectedLayerBounds.x,
            y: selectedLayerBounds.y,
            width: selectedLayerBounds.width,
            height: selectedLayerBounds.height,
            rotation: rotationDeg
        };
        setOverlaySelectionBox(newBox);
    }, [selectedLayerBounds, resolveSelectionRotation]);

    const syncTransformerToSelection = useCallback(() => {
        const transformer = selectionTransformerRef.current;

        if (!transformer) {
            return;
        }

        // Allow transformer to be visible during interaction even without valid bounds yet
        if (!selectModeActive || (!selectedLayerBounds)) {
            transformer.nodes([]);
            transformer.visible(false);
            return;
        }

        const nodes = selectedLayerIds
            .map((id) => layerNodeRefs.current.get(id))
            .filter((node): node is Konva.Node => Boolean(node));

        if (nodes.length === 0) {
            transformer.nodes([]);
            transformer.visible(false);
            return;
        }

        transformer.nodes(nodes);
        transformer.rotation(resolveSelectionRotation());
        transformer.centeredScaling(true);

        transformer.visible(true);
        transformer.forceUpdate();
    }, [selectModeActive, selectedLayerBounds, selectedLayerIds, overlaySelectionBox, resolveSelectionRotation, layerNodeRefs]);

    // Unified effect: sync transformer to selection and handle rotation
    useEffect(() => {
        syncTransformerToSelection();
        if (!selectModeActive || isSelectionTransformingRef.current) return;
        const nextRotation = resolveSelectionRotation();
        const normalizedRotation = Number.isFinite(nextRotation) ? nextRotation : 0;
        if (selectionProxyRotationRef.current !== normalizedRotation) {
            selectionProxyRotationRef.current = normalizedRotation;
            syncTransformerToSelection();
        }
    }, [layersRevision, syncTransformerToSelection, resolveSelectionRotation, selectModeActive]);

    // Unified effect: handle pending selection and reset transform state
    useEffect(() => {
        if (pendingSelectionRef.current) {
            const pending = pendingSelectionRef.current;
            if (pending.length === selectedLayerIds.length) {
                const matches = pending.every((id, index) => id === selectedLayerIds[index]);
                if (matches) {
                    pendingSelectionRef.current = null;
                }
            }
        }
        selectionTransformStateRef.current = null;
    }, [selectedLayerIds]);

    // Attach Konva stage listeners for background clicks (use Konva events to satisfy typings)
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage || !selectModeActive) return;

        const handler = (event: any) => {
            if (event.target === event.target.getStage()) {
                clearSelection();
            }
        };

        stage.on('mousedown', handler);
        stage.on('touchstart', handler);

        return () => {
            stage.off('mousedown', handler);
            stage.off('touchstart', handler);
        };
    }, [selectModeActive, clearSelection]);
    const GroupAny = StageGroup as any;

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={handlePointerLeave}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: containerBackground,
                overflow: 'hidden',
                touchAction: 'none',
                position: 'relative',
            }}
        >
            {layerControls && isSelectToolActive && (
                <LayerPanelUI
                    isOpen={isLayerPanelOpen}
                    onToggle={() => setIsLayerPanelOpen((previous) => !previous)}
                    onClose={() => setIsLayerPanelOpen(false)}
                    pendingSelectionRef={pendingSelectionRef}
                />
            )}

            <Stage
                className="layer-stage-ui"
                ref={stageRef}
                width={containerDimensions.width}
                height={containerDimensions.height}
                style={{
                    cursor: baseCursor,
                }}
            >

                <KonvaLayer key="interaction-layer">
                {layerControls && layersToRender.length > 0 ? (
                    layersToRender.reverse().map((layer, index) => {
                        const layerIsSelected = selectedLayerSet.has(layer.id);
                        const layerBounds = layer.bounds ?? null;
                        const computedX = stageViewportOffsetX + (layerBounds ? layerBounds.x : layer.position.x);
                        const computedY = stageViewportOffsetY + (layerBounds ? layerBounds.y : layer.position.y);
                                const selectionOverride = (layerIsSelected && isSelectionTransformingRef.current && sharedSelectionRect)
                            ? sharedSelectionRect
                            : null;
                        return (
                            <GroupAny
                                key={`${layersRevision}-${layer.id}`}
                                layersRevision={layersRevision}
                                index={index}
                                id={`layer-${layer.id}`}
                                layerId={layer.id}
                                visible={layer.visible}
                                x={selectionOverride ? selectionOverride.x : computedX}
                                y={selectionOverride ? selectionOverride.y : computedY}
                                rotation={selectionOverride ? selectionOverride.rotation : (layer.rotation ?? 0)}
                                scaleX={selectionOverride ? selectionOverride.scaleX : (layer.scale?.x ?? 1)}
                                scaleY={selectionOverride ? selectionOverride.scaleY : (layer.scale?.y ?? 1)}
                                draggable={Boolean(selectModeActive)}
                                selectModeActive={selectModeActive}
                                stageViewportOffsetX={stageViewportOffsetX}
                                stageViewportOffsetY={stageViewportOffsetY}
                                baseCursor={baseCursor}
                                layerNodeRefs={layerNodeRefs}
                                pendingSelectionRef={pendingSelectionRef}
                                selectionDragStateRef={selectionDragStateRef}
                                onRefChange={(node) => onRefChange({ node, layer })}
                                updateBoundsFromLayerIds={updateBoundsFromLayerIds}
                                syncTransformerToSelection={syncTransformerToSelection}
                            >
                                {layer.render()}
                            </GroupAny>
                        );
                    })
                ) : (
                    <GroupAny key="empty-layer">
                        {children}
                    </GroupAny>
                )}
                </KonvaLayer>

                <BackgroundLayer
                    key="background-layer"
                    containerWidth={containerDimensions.width / safeScale}
                    containerHeight={containerDimensions.height / safeScale}
                    containerBackground={containerBackground}
                    stageWidth={stageWidth}
                    stageHeight={stageHeight}
                    stageViewportOffsetX={stageViewportOffsetX}
                    stageViewportOffsetY={stageViewportOffsetY}
                />
                {layerControls && layersToRender.length > 0 ? (
                    <SelectionLayer
                        key="selection-layer"
                        selectModeActive={selectModeActive}
                        padding={transformerPadding}
                        borderDash={outlineDash}
                        transformerRef={selectionTransformerRef}
                        anchorSize={transformerAnchorSize}
                        anchorCornerRadius={transformerAnchorCornerRadius}
                        anchorStrokeWidth={transformerAnchorStrokeWidth}
                        hitStrokeWidth={transformerHitStrokeWidth}
                        stageRef={stageRef}
                        selectedLayerBounds={selectedLayerBounds}
                        captureSelectionTransformState={captureSelectionTransformState}
                        applySelectionTransformDelta={applySelectionTransformDelta}
                        syncSelectedLayerNodeRefs={syncSelectedLayerNodeRefs}
                        commitSelectedLayerNodeTransforms={commitSelectedLayerNodeTransforms}
                        scheduleBoundsRefresh={scheduleBoundsRefresh}
                        initializeSelectionTransform={initializeSelectionTransform}
                        markSelectionTransforming={markSelectionTransforming}
                    />
                ) : null}

            </Stage>
        </div>
    );
};
