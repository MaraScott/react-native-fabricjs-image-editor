/**
 * Atomic Design - Organism: StageMimic
 * 
 * Renders the visible canvas area (stage mimic) with shadow effect
 */

import { Rect } from 'react-konva';

/**
 * StageMimic component props
 */
export interface StageMimicProps {
  key?: string;
  /**
   * X offset for stage viewport
   */
  x: number;
  /**
   * Y offset for stage viewport
   */
  y: number;
  /**
   * Stage width
   */
  width: number;
  /**
   * Stage height
   */
  height: number;
  /**
   * Background color for the stage
   */
  fill: string;
}

/**
 * StageMimic component
 * 
 * Renders the visible canvas area rectangle with shadow styling
 * 
 * @param {StageMimicProps} props - Component props
 * @returns {JSX.Element} Rect element for stage mimic
 */
export const StageMimic = ({
  x,
  y,
  width,
  height,
  fill,
}: StageMimicProps) => {
  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      shadowColor="rgba(0,0,0,0.2)"
      shadowBlur={8}
      shadowOffsetY={2}
    />
  );
};
