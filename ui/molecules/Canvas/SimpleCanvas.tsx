/**
 * Atomic Design - Molecule: SimpleCanvas
 * Combines Stage and Layer atoms into a basic canvas
 */

import { useRef } from 'react';
import { Stage, Layer } from '@atoms/Canvas';
import type { StageProps } from '@atoms/Canvas';
import type Konva from 'konva';

export interface SimpleCanvasProps {
  width: number;
  height: number;
  backgroundColor?: string;
  children?: React.ReactNode;
  onStageReady?: (stage: Konva.Stage) => void;
}

/**
 * SimpleCanvas Molecule - A ready-to-use canvas with stage and layer
 * Provides a simple interface for rendering Konva elements
 */
export const SimpleCanvas = ({
  width,
  height,
  backgroundColor = '#ffffff',
  children,
  onStageReady,
}: SimpleCanvasProps) => {
  const stageRef = useRef<Konva.Stage>(null);

  const handleStageMount = (stage: Konva.Stage) => {
    stageRef.current = stage;
    if (onStageReady) {
      onStageReady(stage);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
      }}
    >
      <Stage
        width={width}
        height={height}
        ref={handleStageMount as any}
        style={{
          backgroundColor,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Layer>
          {children}
        </Layer>
      </Stage>
    </div>
  );
};
