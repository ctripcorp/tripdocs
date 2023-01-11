import { Editor, Element, Transforms } from '@src/components/slate-packages/slate';
import { delChildrenNotAllowComponent, ELEMENTNODE, isNodeChildrenIsTargetType } from '@src/utils/normalize';
import { ELTYPE, HEADING_TYPES } from './config';

export function normalizeHeadings(editor: Editor, entry: [ELEMENTNODE, number[]]): boolean {
  const [node, path] = entry;

  const { type, children } = node;
  if (Element.isElement(node) && HEADING_TYPES.includes(type)) {
    const componentOk = [ELTYPE.LINK, ELTYPE.MENTION, ELTYPE.INLINEIMAGE, undefined];

    if (!isNodeChildrenIsTargetType(children, [componentOk])) {
      console.log('isNodeChildrenIsTargetType', false, children);
      delChildrenNotAllowComponent(editor, children, componentOk, path);
      return true;
    }
  }
  return false;
}
