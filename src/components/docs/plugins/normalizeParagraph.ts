import { Editor, Element, Node, Transforms } from '@src/components/slate-packages/slate';
import { delChildrenNotAllowComponent, ELEMENTNODE, isNodeChildrenIsNotNull, isNodeChildrenIsTargetType } from '@src/utils/normalize';
import { ELTYPE } from './config';

export function normalizeParagraph(editor: Editor, entry: [ELEMENTNODE, number[]]): boolean {
  const [node, path] = entry;

  const { type, children } = node;
  if (Element.isElement(node) && (type === ELTYPE.PARAGRAPH || !Object.values(ELTYPE).includes(type))) {
    const componentOk = [ELTYPE.MENTION, ELTYPE.LINK, ELTYPE.INLINEIMAGE, undefined];
    if (!isNodeChildrenIsTargetType(children, [componentOk])) {
      if (!isNodeChildrenIsNotNull(children)) {
        Transforms.removeNodes(editor, { at: path });
        Transforms.insertNodes(editor, { type: ELTYPE.PARAGRAPH, children: [{ text: '' }] } as Node, { at: path });
        return true;
      }

      delChildrenNotAllowComponent(editor, children, componentOk, path);
      return true;
    }
  }
  return false;
}
