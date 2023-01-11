import { Editor, Element, Node, Transforms } from '@src/components/slate-packages/slate';
import { ELEMENTNODE, isNodeChildrenIsTargetType } from '@src/utils/normalize';
import { ELTYPE, HEADING_TYPES } from '../config';

export function normalizeOLULList(editor: Editor, entry: [ELEMENTNODE, number[]]): boolean {
  const [node, path] = entry;

  const { type, children } = node;
  if (Element.isElement(node) && [ELTYPE.OLLIST, ELTYPE.ULLIST].includes(type)) {
    if (!isNodeChildrenIsTargetType(children, [[ELTYPE.LINK, undefined, ...HEADING_TYPES, ELTYPE.MENTION, ELTYPE.INLINEIMAGE]])) {
      console.log('isNodeChildrenIsTargetType', false, children);
      Transforms.delete(editor, { at: path });
      Transforms.insertNodes(editor, { ...node, children: [{ text: Node.string(node) }] }, { at: path });
      return true;
    }
  }
  return false;
}
