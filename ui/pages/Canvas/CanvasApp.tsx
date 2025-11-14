/**
 * Atomic Design - Page: CanvasApp
 * Main application page for the simple canvas with zoom controls
 */

import { useState, useMemo } from 'react';
import type { RootState } from '@store/CanvasApp';
import { useSelector } from 'react-redux';
import { CanvasLayout } from '@templates/Canvas';
import { CanvasContainer } from '@organisms/Canvas';
import { HeaderLeft } from '@organisms/Header';
import { Footer } from '@organisms/Footer';
import { SideBarLeft } from '@organisms/SideBar';
import type { CanvasLayerDefinition } from '@organisms/Canvas';
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
  key: string;
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
  width = 1024,
  height = 1024,
  backgroundColor = '#ffffff',
  containerBackground = '#cccccc',
  initialZoom = 0,
}: CanvasAppProps) => {
  /**
   * useState - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {initialZoom} Refer to the implementation for the precise returned value.
   */
  /**
   * useState - Auto-generated documentation stub.
   *
   * @returns {initialZoom} Result produced by useState.
   */
  const [zoom, setZoom] = useState(initialZoom);
  
  const initialCanvasLayers = useMemo<CanvasLayerDefinition[]>(() => [
    {
      id: 'layer-text',
      name: 'Title',
      visible: true,
      position: { x: 0, y: 0 },
      render: () => (
        <Text
          key="text"
          x={100}
          y={400}
          text="Simple Canvas Ready!"
          fontSize={48}
          fill="#333333"
          fontFamily="system-ui, sans-serif"
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
          x={500}
          y={200}
          radius={100}
          fill="#E24A4A"
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
            key="rect"
            x={100}
            y={100}
            width={200}
            height={200}
            fill="#4A90E2"
            cornerRadius={8}
          />
          <Text
            key="rect-label"
            x={100}
            y={200}
            text="I'm the rect!"
            fontSize={48}
            fill="#333333"
            fontFamily="system-ui, sans-serif"
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
  


  return (
    <CanvasLayout
      key={`canvasapp`}
      headerLeft={<HeaderLeft key={`headerleft`} width={width} height={height} />}
      headerCenter={<ZoomControl key={`headercenter`}  zoom={zoom} onZoomChange={setZoom} />}
      sidebarLeft={<SideBarLeft key={`sidebarleft`}  isPanToolActive={isPanToolActive} isSelectToolActive={isSelectToolActive} />}
      footer={<Footer key={`footer`}  />}
    >
      <CanvasContainer
        key="canvas-container"
        width={width}
        height={height}
        backgroundColor={backgroundColor}
        containerBackground={containerBackground}
        zoom={zoom}
        onZoomChange={setZoom}
        panModeActive={isPanToolActive}
        selectModeActive={isSelectToolActive}
        initialLayers={initialCanvasLayers}
      />
    </CanvasLayout>
  );
};
