import type { PathElement } from '../../types/editor';
import type { BaseNodeProps } from './common';
import { LineNode } from './LineNode';

export function PathNode(props: BaseNodeProps<PathElement>) {
  return <LineNode {...props} />;
}
