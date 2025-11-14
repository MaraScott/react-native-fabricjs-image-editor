/**
 * Atomic Design - Organism: BackgroundLayer
 * 
 * Combines FullContainerBackground and StageMimic in a single Layer for performance
 */

import { Layer } from 'react-konva';
import { FullContainerBackground } from './FullContainerBackground';
import { StageMimic } from './StageMimic';

/**
 * BackgroundLayer component props
 */
export interface BackgroundLayerProps {
  /**
   * Container width divided by scale
   */
  containerWidth: number;
  /**
   * Container height divided by scale
   */
  containerHeight: number;
  /**
   * Container background color
   */
  containerBackground: string;
  /**
   * Stage viewport X offset
   */
  stageViewportOffsetX: number;
  /**
   * Stage viewport Y offset
   */
  stageViewportOffsetY: number;
  /**
   * Stage width
   */
  stageWidth: number;
  /**
   * Stage height
   */
  stageHeight: number;
  /**
   * Stage background color
   */
  stageBackground: string;
}

/**
 * BackgroundLayer component
 * 
 * Renders the background layer containing the full container background
 * and stage mimic. Combined for performance optimization.
 * 
 * @param {BackgroundLayerProps} props - Component props
 * @returns {JSX.Element} Layer with background elements
 */
export const BackgroundLayer = ({
  containerWidth,
  containerHeight,
  containerBackground,
  stageViewportOffsetX,
  stageViewportOffsetY,
  stageWidth,
  stageHeight,
  stageBackground,
}: BackgroundLayerProps) => {
  return (
    <Layer listening={false}>
      <FullContainerBackground
        key="full-container-background"
        width={containerWidth}
        height={containerHeight}
        fill={containerBackground}
      />
      <StageMimic
        key="stage-mimic"
        x={stageViewportOffsetX}
        y={stageViewportOffsetY}
        width={stageWidth}
        height={stageHeight}
        fill={stageBackground}
      />
    </Layer>
  );
};
