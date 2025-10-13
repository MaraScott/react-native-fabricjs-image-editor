/**
 * Atomic Design - Organism: CanvasContainer
 * Full-featured canvas container with state management
 */

import { useState } from 'react';
import { SimpleCanvas } from '@molecules/Canvas';
import type Konva from 'konva';

export interface CanvasContainerProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  children?: React.ReactNode;
}

/**
 * CanvasContainer Organism - Main canvas component with full functionality
 * Manages canvas state and provides context for child components
 */
export const CanvasContainer = ({
  width = 800,
  height = 600,
  backgroundColor = '#ffffff',
  children,
}: CanvasContainerProps) => {
  const [stage, setStage] = useState<Konva.Stage | null>(null);

  const handleStageReady = (stageInstance: Konva.Stage) => {
    setStage(stageInstance);
    console.log('Canvas stage ready:', stageInstance);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SimpleCanvas
        width={width}
        height={height}
        backgroundColor={backgroundColor}
        onStageReady={handleStageReady}
      >
        {children}
      </SimpleCanvas>
    </div>
  );
};
