/**
 * Atomic Design - Page: CanvasApp
 * Main application page for the simple canvas with zoom controls
 */

import { useState, useMemo } from 'react';
import { CanvasLayout } from '@templates/Canvas';
import { CanvasContainer } from '@organisms/Canvas';
import type { CanvasLayerDefinition } from '@organisms/Canvas';
import { ZoomControl } from '@molecules/Controls';
import { Rect, Circle, Text } from 'react-konva';

export interface CanvasAppProps {
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
  const [zoom, setZoom] = useState(initialZoom);
  const [isPanToolActive, setIsPanToolActive] = useState(false);
  const [isSelectToolActive, setIsSelectToolActive] = useState(true);
  const initialCanvasLayers = useMemo<CanvasLayerDefinition[]>(() => [
    {
      id: 'layer-text',
      name: 'Title',
      visible: true,
      position: { x: 0, y: 0 },
      render: () => (
        <Text
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
          x={100}
          y={100}
          width={200}
          height={200}
          fill="#4A90E2"
          cornerRadius={8}
        />
                <Text
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

  const togglePanTool = () => {
    setIsPanToolActive((previous) => {
      const next = !previous;
      if (next) {
        setIsSelectToolActive(false);
      }
      return next;
    });
  };

  const toggleSelectTool = () => {
    setIsSelectToolActive((previous) => {
      const next = !previous;
      if (next) {
        setIsPanToolActive(false);
      }
      return next;
    });
  };

  return (
    <CanvasLayout
      headerLeft={
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            Simple Canvas Editor
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
            Built with Konva and Atomic Design Pattern - {width}x{height}px canvas
          </p>
        </div>
      }
      headerCenter={
        <ZoomControl zoom={zoom} onZoomChange={setZoom} />
      }
      sidebarLeft={
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={togglePanTool}
            aria-pressed={isPanToolActive}
            aria-label={isPanToolActive ? 'Disable pan tool' : 'Enable pan tool'}
            title={isPanToolActive ? 'Pan tool active' : 'Enable pan tool'}
            style={{
              width: '100%',
              border: `1px solid ${isPanToolActive ? '#333333' : '#d0d0d0'}`,
              backgroundColor: isPanToolActive ? '#333333' : '#f8f8f8',
              color: isPanToolActive ? '#ffffff' : '#333333',
              borderRadius: '8px',
              padding: '0.75rem 0.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              userSelect: 'none',
              transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
            }}
          >
            <span aria-hidden="true" style={{ fontSize: '1.5rem', lineHeight: 1 }}>
              {'\u270B'}
            </span>
            <span>Pan</span>
          </button>

          <button
            type="button"
            onClick={toggleSelectTool}
            aria-pressed={isSelectToolActive}
            aria-label={isSelectToolActive ? 'Disable select tool' : 'Enable select tool'}
            title={isSelectToolActive ? 'Select tool active' : 'Enable select tool'}
            style={{
              width: '100%',
              border: `1px solid ${isSelectToolActive ? '#333333' : '#d0d0d0'}`,
              backgroundColor: isSelectToolActive ? '#333333' : '#f8f8f8',
              color: isSelectToolActive ? '#ffffff' : '#333333',
              borderRadius: '8px',
              padding: '0.75rem 0.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              userSelect: 'none',
              transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
            }}
          >
            <span aria-hidden="true" style={{ fontSize: '1.5rem', lineHeight: 1 }}>
              {'\u261D'}
            </span>
            <span>Select</span>
          </button>
        </div>
      }
      footer={
        <div style={{ textAlign: 'center' }}>
          Canvas ready for further development
        </div>
      }
    >
      <CanvasContainer
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
