/**
 * Atomic Design - Page: CanvasApp
 * Main application page for the simple canvas with zoom controls
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import type { RootState } from '@store/CanvasApp';
import { useSelector } from 'react-redux';
import { CanvasLayout } from '@templates/Canvas';
import { CanvasContainer } from '@organisms/Canvas';
import { HeaderLeft } from '@organisms/Header';
import { Footer } from '@organisms/Footer';
import { SideBarLeft } from '@organisms/SideBar';
import type { InitialLayerDefinition } from '@organisms/Canvas';
import { ZoomControl } from '@molecules/Controls';
import { Rect, Circle, Text } from 'react-konva';
import { useSimpleCanvasStore } from '@store/SimpleCanvas';
import type { LayerDescriptor } from '@molecules/Layer/Layer.types';
import defaultTemplate from '../../../assets/public/template/default.json';

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-') || 'canvas';

/**
 * CanvasAppProps interface - Auto-generated interface summary; customize as needed.
 */
/**
 * CanvasAppProps interface - Generated documentation block.
 */
/**
 * CanvasAppProps Interface
 * 
 * Type definition for CanvasAppProps.
 */
export interface CanvasAppProps {
    id: string;
    width?: number;
    height?: number;
    backgroundColor?: string;
    containerBackground?: string;
    initialZoom?: number;
}

/**
 * CanvasApp Page - The complete canvas application
 * Demonstrates a simple canvas with basic shapes and zoom controls
 * Default size is 1024x1024 that fits container via zoom
 */
export const CanvasApp = ({
    id = 'tiny-artist-editor',
    width = 1024,
    height = 1024,
    backgroundColor = '#ffffff',
    containerBackground = '#cccccc',
    initialZoom = 0,
}: CanvasAppProps) => {
    const templateData = defaultTemplate as { stageWidth?: number; stageHeight?: number; layers?: InitialLayerDefinition[]; stageName?: string };
    const resolvedStageWidth = templateData.stageWidth ?? width;
    const resolvedStageHeight = templateData.stageHeight ?? height;
    const [stageName, setStageName] = useState<string>(templateData.stageName ?? 'Canvas Stage');
    const [isStageMenuOpen, setIsStageMenuOpen] = useState(false);

    const [zoom, setZoom] = useState(initialZoom);
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const [fitRequest, setFitRequest] = useState(0);
    const [historyControls, setHistoryControls] = useState<{ undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean; revision?: number }>({
        undo: () => { },
        redo: () => { },
        canUndo: false,
        canRedo: false,
        revision: 0,
    });
    const layerControls = useSimpleCanvasStore((state) => state.layerControls);
    const jsonFileInputRef = useRef<HTMLInputElement | null>(null);

    const initialCanvasLayers = useMemo<InitialLayerDefinition[]>(() => {
        const templateLayers = templateData.layers;
        if (Array.isArray(templateLayers) && templateLayers.length > 0) {
            return templateLayers;
        }

        // Fallback to legacy sample layers if template is missing or empty.
        return [
            {
                id: 'layer-text',
                name: 'Title',
                visible: true,
                position: { x: 0, y: 0 },
                render: () => (
                    <Text
                        key="title-text"
                        x={100}
                        y={400}
                        text="Simple Canvas Ready!"
                        fontSize={48}
                        fill="#333333"
                        fontFamily="system-ui, sans-serif"
                        visible={true}
                    />
                ),
            },
            {
                id: 'layer-circle',
                name: 'Circle',
                visible: true,
                position: { x: 0, y: 0 },
                render: () => (
                    <Circle
                        key="red-circle"
                        x={500}
                        y={200}
                        radius={100}
                        fill="#E24A4A"
                        visible={true}
                    />
                ),
            },
            {
                id: 'layer-rectangle',
                name: 'Blue Rectangle',
                visible: true,
                position: { x: 0, y: 0 },
                render: () => (
                    <>
                        <Rect
                            key="blue-rectangle"
                            x={100}
                            y={100}
                            width={200}
                            height={200}
                            fill="#4A90E2"
                            visible={true}
                            cornerRadius={8}
                        />
                        <Text
                            key="title-text"
                            x={140}
                            y={170}
                            text="RECT!"
                            fontSize={48}
                            fill="#333333"
                            fontFamily="system-ui, sans-serif"
                            visible={true}
                        />
                    </>
                ),
            },
        ];
    }, [templateData.layers]);

    const handleSaveJSON = useCallback(() => {
        if (!layerControls) return;
        const payload = {
            stageName,
            stageWidth: resolvedStageWidth,
            stageHeight: resolvedStageHeight,
            layers: layerControls.layers,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${slugify(stageName)}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
    }, [layerControls, resolvedStageHeight, resolvedStageWidth, stageName]);

    const handleRequestPNG = useCallback(() => {
        try {
            window.dispatchEvent(
                new CustomEvent('export-stage-png', {
                    detail: { fileName: `${slugify(stageName)}.png` },
                }),
            );
        } catch {
            // ignore
        }
    }, [stageName]);

    const handleUploadJSONClick = useCallback(() => {
        jsonFileInputRef.current?.click();
    }, []);

    const handleUploadJSON = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const parsed = JSON.parse(reader.result as string);
                    const layers: LayerDescriptor[] | null = Array.isArray(parsed?.layers) ? parsed.layers : null;
                    if (parsed?.stageName && typeof parsed.stageName === 'string') {
                        setStageName(parsed.stageName);
                    }
                    if (layers && layerControls?.replaceLayers) {
                        layerControls.replaceLayers(layers);
                    }
                } catch (error) {
                    console.warn('Unable to load JSON', error);
                } finally {
                    event.target.value = '';
                }
            };
            reader.readAsText(file);
        },
        [layerControls],
    );

    // Get tool states from Redux store
    /**
     * useSelector - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} (state - Parameter derived from the static analyzer.
     */
    /**
     * useSelector - Auto-generated documentation stub.
     *
     * @param {*} (state - Parameter forwarded to useSelector.
     */
    const isPanToolActive = useSelector((state: RootState) => state.view.pan.active);
    /**
     * useSelector - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} (state - Parameter derived from the static analyzer.
     */
    /**
     * useSelector - Auto-generated documentation stub.
     *
     * @param {*} (state - Parameter forwarded to useSelector.
     */
    const isSelectToolActive = useSelector((state: RootState) => state.view.select.active);
    const isDrawToolActive = useSelector((state: RootState) => state.view.draw.active);
    const isRubberToolActive = useSelector((state: RootState) => state.view.rubber.active);
    const isTextToolActive = useSelector((state: RootState) => state.view.text.active);

    useEffect(() => {
        const updateScreenSize = () => {
            if (typeof window === 'undefined') return;
            setIsSmallScreen(window.innerWidth < 768);
        };
        updateScreenSize();
        window.addEventListener('resize', updateScreenSize);
        return () => window.removeEventListener('resize', updateScreenSize);
    }, []);

    if (isSmallScreen && false) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '32px',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    textAlign: 'center',
                    lineHeight: 1.5,
                }}
                role="alert"
            >
                <div style={{ maxWidth: '420px', fontSize: '18px', fontWeight: 600 }}>
                    Sorry !<br />
                    TinyArtist is available only on<br />
                    tablet and desktop<br />
                    for best experience.
                </div>
            </div>
        );
    }

    return (
        <CanvasLayout
            headerLeft={<HeaderLeft width={resolvedStageWidth} height={resolvedStageHeight} />}
            headerCenter={<ZoomControl zoom={zoom} onZoomChange={setZoom} onFit={() => setFitRequest((v) => v + 1)} />}
            headerRight={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                    <button
                        type="button"
                        onClick={() => setIsStageMenuOpen((open) => !open)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid #e5e7eb',
                            background: '#fff',
                            cursor: 'pointer',
                        }}
                        title="Stage menu"
                    >
                        <span style={{ fontWeight: 600 }}>{stageName}</span>
                        <span aria-hidden="true">▾</span>
                    </button>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" onClick={historyControls.undo} disabled={!historyControls.canUndo} title="Undo">
                            ⎌ Undo
                        </button>
                        <button type="button" onClick={historyControls.redo} disabled={!historyControls.canRedo} title="Redo">
                            Redo ↻
                        </button>
                    </div>
                    {isStageMenuOpen ? (
                        <div
                            style={{
                                position: 'absolute',
                                top: '110%',
                                right: 0,
                                minWidth: 180,
                                background: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: 8,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                padding: 8,
                                zIndex: 10,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    const next = window.prompt('Rename stage', stageName);
                                    if (next && next.trim()) {
                                        setStageName(next.trim());
                                    }
                                    setIsStageMenuOpen(false);
                                }}
                                style={{ textAlign: 'left' }}
                            >
                                Rename stage
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    handleSaveJSON();
                                    setIsStageMenuOpen(false);
                                }}
                                disabled={!layerControls}
                                style={{ textAlign: 'left' }}
                            >
                                Save JSON
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    handleUploadJSONClick();
                                    setIsStageMenuOpen(false);
                                }}
                                disabled={!layerControls?.replaceLayers}
                                style={{ textAlign: 'left' }}
                            >
                                Load JSON
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    handleRequestPNG();
                                    setIsStageMenuOpen(false);
                                }}
                                disabled={!layerControls}
                                style={{ textAlign: 'left' }}
                            >
                                Save PNG
                            </button>
                        </div>
                    ) : null}
                    <input
                        ref={jsonFileInputRef}
                        type="file"
                        accept="application/json"
                        style={{ display: 'none' }}
                        onChange={handleUploadJSON}
                    />
                </div>
            }
            sidebarLeft={<SideBarLeft isPanToolActive={isPanToolActive} isSelectToolActive={isSelectToolActive} isDrawToolActive={isDrawToolActive} isRubberToolActive={isRubberToolActive} isTextToolActive={isTextToolActive} />}
            footer={<Footer />}
        >
            <CanvasContainer
                key="canvas-container"
                width={resolvedStageWidth}
                height={resolvedStageHeight}
                backgroundColor={backgroundColor}
                containerBackground={containerBackground}
                zoom={zoom}
                onZoomChange={setZoom}
                fitRequest={fitRequest}
                onHistoryChange={setHistoryControls}
                panModeActive={isPanToolActive}
                selectModeActive={isSelectToolActive}
                initialLayers={initialCanvasLayers}
            />
        </CanvasLayout>
    );
};
