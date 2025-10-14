/**
 * Atomic Design - Organism: CanvasContainer
 * Full-featured canvas container with state management and zoom controls
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import { SimpleCanvas } from '@molecules/Canvas';
import type Konva from 'konva';

export interface CanvasContainerProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  containerBackground?: string;
  zoom?: number;
  children?: ReactNode;
  onStageReady?: (stage: Konva.Stage) => void;
  onZoomChange?: (zoom: number) => void;
  panModeActive?: boolean;
}

/**
 * CanvasContainer Organism - Main canvas component with full functionality
 * Manages canvas state and provides context for child components
 * Supports zoom where 0 = fit to container, positive = zoom in, negative = zoom out
 */
export const CanvasContainer = ({
  width = 1024,
  height = 1024,
  backgroundColor = '#ffffff',
  containerBackground = '#cccccc',
  zoom = 0,
  children,
  onStageReady,
  onZoomChange,
  panModeActive = false,
}: CanvasContainerProps) => {
  const [stage, setStage] = useState<Konva.Stage | null>(null);

  const handleStageReady = (stageInstance: Konva.Stage) => {
    setStage(stageInstance);
    console.log('Canvas stage ready:', stageInstance);

    if (onStageReady) {
      onStageReady(stageInstance);
    }
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
        containerBackground={containerBackground}
        zoom={zoom}
        onStageReady={handleStageReady}
        onZoomChange={onZoomChange}
        panModeActive={panModeActive}
      >
        {children}
      </SimpleCanvas>
    </div>
  );
};
