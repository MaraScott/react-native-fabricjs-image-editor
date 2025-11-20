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
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
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
  fill = 'rgba(0,0,0,1)',
}: StageMimicProps) => {
  return (
    <Rect
      key="stage-mimic"
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      shadowColor="rgba(0,0,0,0.2)"
      shadowBlur={8}
      shadowOffsetY={2}
      globalCompositeOperation="destination-out"
    />
  );
};
