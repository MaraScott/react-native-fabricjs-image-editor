import type { FrameElement } from '@types/editor';
import type { BaseNodeProps } from '@atoms/konva/nodes/common';
import { RectNode } from '@atoms/konva/nodes/RectNode';

export function FrameNode({ shape, ...rest }: BaseNodeProps<FrameElement>) {
  return <RectNode shape={{ ...shape, fill: 'transparent' }} {...rest} />;
}
