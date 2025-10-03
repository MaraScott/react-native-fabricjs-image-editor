import type { PathElement } from '@types/editor';
import type { BaseNodeProps } from '@atoms/konva/nodes/common';
import { LineNode } from '@atoms/konva/nodes/LineNode';

export function PathNode(props: BaseNodeProps<PathElement>) {
  return <LineNode {...props} />;
}
