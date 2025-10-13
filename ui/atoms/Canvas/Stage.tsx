/**
 * Atomic Design - Atom: Stage
 * Basic Konva Stage wrapper with React/React Native compatibility
 */

import { Stage as KonvaStage } from 'react-konva';
import type { StageConfig } from 'konva/lib/Stage';
import type { ReactNode } from 'react';

export interface StageProps extends Partial<StageConfig> {
  children?: ReactNode;
  width: number;
  height: number;
}

/**
 * Stage Atom - The most basic canvas container
 * Wraps Konva Stage with a consistent API
 */
export const Stage = ({ children, width, height, ...props }: StageProps) => {
  return (
    <KonvaStage
      width={width}
      height={height}
      {...props}
    >
      {children}
    </KonvaStage>
  );
};
