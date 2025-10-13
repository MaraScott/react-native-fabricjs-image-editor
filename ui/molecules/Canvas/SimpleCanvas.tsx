/**
 * Atomic Design - Molecule: SimpleCanvas
 * Combines Stage and Layer atoms into a basic canvas with zoom support
 */

import { useRef, useEffect, useState } from 'react';
import { Stage, Layer } from '@atoms/Canvas';
import type { StageProps } from '@atoms/Canvas';
import type Konva from 'konva';

export interface SimpleCanvasProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  containerBackground?: string;
  zoom?: number;
  children?: React.ReactNode;
  onStageReady?: (stage: Konva.Stage) => void;
  onZoomChange?: (zoom: number) => void;
}

/**
 * SimpleCanvas Molecule - A ready-to-use canvas with stage and layer
 * Provides zoom functionality where:
 * - zoom = 0 (default): Stage fits to container
 * - zoom > 0: Zoom in (percentage increase)
 * - zoom < 0: Zoom out (percentage decrease)
 */
export const SimpleCanvas = ({
  width = 1024,
  height = 1024,
  backgroundColor = '#ffffff',
  containerBackground = '#cccccc',
  zoom = 0,
  children,
  onStageReady,
}: SimpleCanvasProps) => {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Calculate scale based on zoom and container size
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Calculate fit-to-container scale
      const scaleX = containerWidth / width;
      const scaleY = containerHeight / height;
      const fitScale = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding

      // Apply zoom adjustment
      // zoom = 0 means use fitScale
      // zoom > 0 means zoom in (increase scale)
      // zoom < 0 means zoom out (decrease scale)
      const zoomFactor = 1 + zoom / 100;
      const finalScale = fitScale * zoomFactor;

      setScale(finalScale);
    };

    updateScale();

    // Update on window resize
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [width, height, zoom]);

  // Notify when stage is ready
  useEffect(() => {
    if (stageRef.current && onStageReady) {
      onStageReady(stageRef.current);
    }
  }, [onStageReady]);

  // Update stage scale when it changes
  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.scale({ x: scale, y: scale });
      stageRef.current.batchDraw();
    }
  }, [scale]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: containerBackground,
        overflow: 'hidden',
      }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        style={{
          backgroundColor,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        <Layer>
          {children}
        </Layer>
      </Stage>
    </div>
  );
};
