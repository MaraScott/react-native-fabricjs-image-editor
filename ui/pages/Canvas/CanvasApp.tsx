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
}

/**
 * CanvasApp Page - The complete canvas application
 * Demonstrates a simple canvas with basic shapes
 */
export const CanvasApp = ({
  width = 800,
  height = 600,
  backgroundColor = '#ffffff',
}: CanvasAppProps) => {
  return (
    <CanvasLayout
      header={
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            Simple Canvas Editor
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
            Built with Konva and Atomic Design Pattern
          </p>
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
      >
        {/* Example shapes to demonstrate the canvas */}
        <Rect
          x={50}
          y={50}
          width={100}
          height={100}
          fill="#4A90E2"
          cornerRadius={8}
        />
        <Circle
          x={250}
          y={100}
          radius={50}
          fill="#E24A4A"
        />
        <Text
          x={50}
          y={200}
          text="Simple Canvas Ready!"
          fontSize={24}
          fill="#333333"
          fontFamily="system-ui, sans-serif"
        />
      </CanvasContainer>
    </CanvasLayout>
  );
};
