/**
 * Atomic Design - Atom: Stage
 * Basic Konva Stage wrapper with React/React Native compatibility
 */

import { forwardRef } from 'react';
import { Stage as KonvaStage } from 'react-konva';
import type { StageConfig } from 'konva/lib/Stage';
import type { ReactNode, CSSProperties } from 'react';
import type Konva from 'konva';

/**
 * StageProps interface - Auto-generated interface summary; customize as needed.
 */
/**
 * StageProps interface - Generated documentation block.
 */
export interface StageProps extends Partial<StageConfig> {
  children?: ReactNode;
  width: number;
  height: number;
  style?: CSSProperties;
}

/**
 * Stage Atom - The most basic canvas container
 * Wraps Konva Stage with a consistent API
 */
export const Stage = forwardRef<Konva.Stage, StageProps>(
  ({ children, width, height, style, ...props }, ref) => {
    const composedStyle: CSSProperties = {
      display: 'inline-block',
      width: `${width}px`,
      height: `${height}px`,
      flexShrink: 0,
      flexGrow: 0,
      background: '#ffffff',
      ...style,
    };

    return (
      <div style={composedStyle}>
        <KonvaStage
          ref={ref}
          width={width}
          height={height}
          {...props}
        >
          {children}
        </KonvaStage>
      </div>
    );
  }
);

Stage.displayName = 'Stage';
