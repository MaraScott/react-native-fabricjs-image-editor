import type { PathElement } from '@types/editor';
import type { BaseNodeProps } from '@components/KonvaNodes/common';
import { LineNode } from '@components/KonvaNodes/LineNode';

export function PathNode(props: BaseNodeProps<PathElement>) {
  return <LineNode {...props} />;
}
