import { Editor, Element, Node, Path, Transforms } from '@src/components/slate-packages/slate';
import {
  delChildrenNotAllowComponent,
  delTopElement,
  ELEMENTNODE,
  isNodeChildrenIsTargetType,
  setPTagChildrenNotAllowComponent,
} from '@src/utils/normalize';
import { ELTYPE, inCardEL, TABBABLE_TYPES } from '../config';

export function normalizeCard(editor: Editor, entry: [ELEMENTNODE, number[]]): boolean {
  const [node, path]: any = entry;

  const parentEntry = Editor.parent(editor, path);
  const [parentNode, parentPath]: any = parentEntry;

  if ([ELTYPE.CARD, ELTYPE.CARD_PRE, ELTYPE.CARD_SUF].includes(node.type) && [...TABBABLE_TYPES].includes(parentNode.type)) {
    Transforms.unwrapNodes(editor, { at: parentPath });
    return false;
  }

  const { type, children } = node;

  if (parentNode.type === ELTYPE.CARD) {
    if (verifyCardChildNum(editor, parentNode, parentPath)) {
      return;
    }
  }

  if (Element.isElement(node) && type === ELTYPE.CARD) {
    if (node.children.length < 3) {
      delTopElement(editor, path);
      return true;
    }

    if (verifyCardChildNum(editor, node, path)) {
      return true;
    }

    if (!isNodeChildrenIsTargetType(children, [componentsOk])) {
      setPTagChildrenNotAllowComponent(editor, children, componentsOk, path);
      return true;
    }
  } else if (Element.isElement(node) && [ELTYPE.CARD_PRE, ELTYPE.CARD_SUF].includes(type)) {
    if (parentNode.type !== ELTYPE.CARD) {
      Transforms.delete(editor, { at: path });
      Transforms.insertNodes(editor, { type: ELTYPE.PARAGRAPH, children: [{ text: Node.string(node) || '' }] } as Node, { at: path });
      return true;
    }

    if ((node.children?.[0] as any)?.text !== '' || node.children?.length > 1) {
      Transforms.delete(editor, { at: path });
      Transforms.insertNodes(editor, { type: type, children: [{ text: '' }] } as Node, { at: path });
      Transforms.select(editor, path[0] > 0 ? [path[0] - 1] : [0]);
      Transforms.collapse(editor, { edge: 'end' });
      return true;
    }
  }

  return false;
}
const cardChildCom = [ELTYPE.CARD_PRE, ELTYPE.CARD_SUF];
const cardWrap = inCardEL;
const componentsOk = [...cardChildCom, ...cardWrap];

function verifyCardChildNum(editor: Editor, parentNode: any, curPath: Path): boolean {
  if (parentNode.children.length !== 3 || !(parentNode.children[0]?.type === ELTYPE.CARD_PRE && parentNode.children[2]?.type === ELTYPE.CARD_SUF)) {
    for (let i = 0; i < parentNode.children.length; i++) {
      const el = parentNode.children[i];
      Transforms.removeNodes(editor, { at: [...curPath] });
      if (cardWrap.includes(el.type)) {
        Transforms.insertNodes(
          editor,
          {
            type: ELTYPE.CARD,
            children: [{ type: ELTYPE.CARD_PRE, children: [{ text: '' }] }, el, { type: ELTYPE.CARD_SUF, children: [{ text: '' }] }],
          } as any,
          { at: [...curPath] }
        );

        return true;
      }
    }
  }
  return false;
}
