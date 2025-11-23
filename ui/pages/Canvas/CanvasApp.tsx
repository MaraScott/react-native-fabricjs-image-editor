/**
 * Atomic Design - Page: CanvasApp
 * Main application page for the simple canvas with zoom controls
 */

import { useState, useMemo, useEffect } from 'react';
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

    const initialCanvasLayers = useMemo<InitialLayerDefinition[]>(() => [
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
    ], []);

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

    useEffect(() => {
        const updateScreenSize = () => {
            if (typeof window === 'undefined') return;
            setIsSmallScreen(window.innerWidth < 768);
        };
        updateScreenSize();
        window.addEventListener('resize', updateScreenSize);
        return () => window.removeEventListener('resize', updateScreenSize);
    }, []);

    if (isSmallScreen) {
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
            headerLeft={<HeaderLeft width={width} height={height} />}
            headerCenter={<ZoomControl zoom={zoom} onZoomChange={setZoom} onFit={() => setFitRequest((v) => v + 1)} />}
            headerRight={
                <div className="history-controls">
                    <button type="button" onClick={historyControls.undo} disabled={!historyControls.canUndo} title="Undo">
                        ⎌ Undo
                    </button>
                    <button type="button" onClick={historyControls.redo} disabled={!historyControls.canRedo} title="Redo">
                        Redo ↻
                    </button>
                </div>
            }
            sidebarLeft={<SideBarLeft isPanToolActive={isPanToolActive} isSelectToolActive={isSelectToolActive} isDrawToolActive={isDrawToolActive} isRubberToolActive={isRubberToolActive} />}
            footer={<Footer />}
        >
            <CanvasContainer
                key="canvas-container"
                width={width}
                height={height}
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
