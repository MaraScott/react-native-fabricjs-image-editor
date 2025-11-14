/**
 * Atomic Design - Organism: FullContainerBackground
 * 
 * Renders the full container background rectangle in the canvas
 */

import { Rect } from 'react-konva';

/**
 * FullContainerBackground component props
 */
export interface FullContainerBackgroundProps {
  key?: string;
  /**
   * Container width divided by scale
   */
  width: number;
  /**
   * Container height divided by scale
   */
  height: number;
  /**
   * Background fill color
   */
  fill: string;
}

/**
 * FullContainerBackground component
 * 
 * Renders a full-size background rectangle for the canvas container
 * 
 * @param {FullContainerBackgroundProps} props - Component props
 * @returns {JSX.Element} Rect element for full container background
 */
export const FullContainerBackground = ({
  width,
  height,
  fill,
}: FullContainerBackgroundProps) => {
  return (
    <Rect
      x={0}
      y={0}
      width={width}
      height={height}
      fill={fill}
    />
  );
};
