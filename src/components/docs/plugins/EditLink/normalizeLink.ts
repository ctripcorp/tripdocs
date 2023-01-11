import { Editor, Element, Node, Transforms } from '@src/components/slate-packages/slate';
import { delChildrenNotAllowComponent, ELEMENTNODE, isNodeChildrenIsTargetType } from '@src/utils/normalize';
import { ELTYPE } from '../config';

export function normalizeLink(editor: Editor, entry: [ELEMENTNODE, number[]]): boolean {
  const [node, path] = entry;

  const { type, children } = node;
  if (Element.isElement(node) && type === ELTYPE.LINK) {
    const textNode = children.find(item => typeof item.text === 'string');
    const isTextEmpty = textNode && ['', '%EF%BB%BF'].includes(encodeURIComponent(textNode.text));

    if (isTextEmpty) {
      const hasWrappedElement = isTextEmpty && children.find(item => typeof item.type !== 'undefined');
      if (hasWrappedElement) {
        Transforms.unwrapNodes(editor, { at: path });
        return true;
      }

      Transforms.delete(editor, { at: [...path] });
      return true;
    }
    const componentsOk = [undefined];

    if (!isNodeChildrenIsTargetType(children, [componentsOk])) {
      delChildrenNotAllowComponent(editor, children, componentsOk, path);
      return true;
    }
  }
  return false;
}
