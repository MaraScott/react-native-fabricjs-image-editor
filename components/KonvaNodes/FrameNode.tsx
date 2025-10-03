import type { FrameElement } from '@types/editor';
import type { BaseNodeProps } from '@components/KonvaNodes/common';
import { RectNode } from '@components/KonvaNodes/RectNode';

export function FrameNode({ shape, ...rest }: BaseNodeProps<FrameElement>) {
  return <RectNode shape={{ ...shape, fill: 'transparent' }} {...rest} />;
}
