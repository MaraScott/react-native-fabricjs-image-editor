/**
 * Atomic Design - Atom: Layer
 * Basic Konva Layer wrapper with React/React Native compatibility
 */

import { Layer as KonvaLayer } from 'react-konva';
import type { LayerConfig } from 'konva/lib/Layer';
import type { ReactNode } from 'react';

export interface LayerProps extends Partial<LayerConfig> {
  children?: ReactNode;
}

/**
 * Layer Atom - Container for canvas elements
 * Wraps Konva Layer with a consistent API
 */
export const Layer = ({ children, ...props }: LayerProps) => {
  return (
    <KonvaLayer {...props}>
      {children}
    </KonvaLayer>
  );
};
