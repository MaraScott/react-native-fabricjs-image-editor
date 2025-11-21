/**
 * Atomic Design - Atom: Layer
 * Basic Konva Layer wrapper with React/React Native compatibility
 */

import { forwardRef } from 'react';
import { Group as KonvaGroup } from 'react-konva';
import type Konva from 'konva';
import type { GroupConfig } from 'konva/lib/Group';
import type { ReactNode } from 'react';

export interface GroupProps extends GroupConfig {
  children?: ReactNode;
}

/**
 * Group Atom - Container for canvas elements
 * Wraps Konva Group with a consistent API
 */
export const Group = forwardRef<Konva.Group, GroupProps>(({ children, ...props }, ref) => {
  return (
    <KonvaGroup {...props} ref={ref}>
      {children}
    </KonvaGroup>
  );
});

Group.displayName = 'Group';
