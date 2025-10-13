/**
 * Atomic Design - Page: CanvasApp
 * Main application page for the simple canvas
 */

import { CanvasLayout } from '@templates/Canvas';
import { CanvasContainer } from '@organisms/Canvas';
import { Rect, Circle, Text } from 'react-konva';

export interface CanvasAppProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  containerBackground?: string;
  zoom?: number;
}

/**
 * CanvasApp Page - The complete canvas application
 * Demonstrates a simple canvas with basic shapes
 * Default size is 1024x1024 that fits container via zoom
 */
export const CanvasApp = ({
  width = 1024,
  height = 1024,
  backgroundColor = '#ffffff',
  containerBackground = '#cccccc',
  zoom = 0,
}: CanvasAppProps) => {
  return (
    <CanvasLayout
      header={
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            Simple Canvas Editor
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
            Built with Konva and Atomic Design Pattern - {width}x{height}px canvas
          </p>
        </div>
      }
      footer={
        <div style={{ textAlign: 'center' }}>
          Canvas ready for further development - Zoom: {zoom}%
        </div>
      }
    >
      <CanvasContainer
        width={width}
        height={height}
        backgroundColor={backgroundColor}
        containerBackground={containerBackground}
        zoom={zoom}
      >
        {/* Example shapes to demonstrate the canvas */}
        <Rect
          x={100}
          y={100}
          width={200}
          height={200}
          fill="#4A90E2"
          cornerRadius={8}
        />
        <Circle
          x={500}
          y={200}
          radius={100}
          fill="#E24A4A"
        />
        <Text
          x={100}
          y={400}
          text="Simple Canvas Ready!"
          fontSize={48}
          fill="#333333"
          fontFamily="system-ui, sans-serif"
        />
      </CanvasContainer>
    </CanvasLayout>
  );
};
