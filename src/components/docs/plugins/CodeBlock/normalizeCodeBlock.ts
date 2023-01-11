import { Editor, Element } from '@src/components/slate-packages/slate';
import { delChildrenNotAllowComponent, ELEMENTNODE, isNodeChildrenIsTargetType } from '@src/utils/normalize';
import { ELTYPE } from '../config';

export function normalizeCodeBlock(editor: Editor, entry: [ELEMENTNODE, number[]]): boolean {
  return false;
}
