import { Editor, Element, Node, Transforms } from '@src/components/slate-packages/slate';
import { delChildrenNotAllowComponent, ELEMENTNODE, isNodeChildrenIsTargetType } from '@src/utils/normalize';
import { ELTYPE } from '../config';

export function normalizeBlockQuote(editor: Editor, entry: [ELEMENTNODE, number[]]): boolean {
  const [node, path] = entry;

  const { type, children } = node;
  if (Element.isElement(node) && type === ELTYPE.BLOCK_QUOTE) {
    const componentsOk = [undefined, ELTYPE.LINK];

    if (!isNodeChildrenIsTargetType(children, [componentsOk])) {
      Transforms.removeNodes(editor, { at: path });
      Transforms.insertNodes(editor, { type: ELTYPE.BLOCK_QUOTE, children: [{ text: Node.string(node) }] } as Node, { at: path });

      return true;
    }
  }
  return false;
}
