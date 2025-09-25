import type { FrameElement } from '../../types/editor';
import type { BaseNodeProps } from './common';
import { RectNode } from './RectNode';

export function FrameNode({ shape, ...rest }: BaseNodeProps<FrameElement>) {
  return <RectNode shape={{ ...shape, fill: 'transparent' }} {...rest} />;
}
