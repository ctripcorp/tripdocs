import { Editor, Node, Path, Range, Transforms } from '@src/components/slate-packages/slate';
import { getSlateSlection } from '@src/utils/getSelection';
import { ReactEditor } from '../../../slate-packages/slate-react';
import { ELTYPE, TABBABLE_TYPES } from '../config';
import { getParentPathByType, getParentPathByTypes } from '../pluginsUtils/getPathUtils';

export const createCard = cardCenter => {
  return {
    type: ELTYPE.CARD,
    children: [
      {
        type: ELTYPE.CARD_PRE,
        children: [{ text: '' }],
      },
      cardCenter,
      {
        type: ELTYPE.CARD_SUF,
        children: [{ text: '' }],
      },
    ],
  };
};
export const insertCard = (editor: ReactEditor, cardCenter: any, atPath?: any) => {
  const selection = getSlateSlection(editor.docId);

  const card = createCard(cardCenter);
  if (!selection) {
    console.log('当前编辑器没有获得焦点...');
    Transforms.insertNodes(editor, card, { select: true, at: [editor.children.length - 1] });
    return;
  }
  let isNoEmpty = false;

  let at = getParentPathByTypes(editor, selection.focus.path, TABBABLE_TYPES);

  const [parentNode, parentPath]: any = Editor.parent(editor, selection.focus?.path);
  console.log('G-------', selection);
  console.log('E-------', parentNode);

  if (Range.isCollapsed(selection)) {
    if (parentNode.type == ELTYPE.CARD_PRE || parentNode.type == ELTYPE.CARD_SUF || parentNode.type == ELTYPE.DIVIDE) {
      console.log('A-------');
      console.log('parentPath-------', parentPath);

      const parentPath2 = Path.parent(parentPath);
      const parentNode2 = Node.get(editor, parentPath2);
      console.log('parentNode2----', parentNode2);

      const nextPath = Path.next(parentPath2);
      at = nextPath;
      if (parentNode.type == ELTYPE.CARD_PRE) {
        at = parentPath2;
      }
      console.log('nextPath----', nextPath);
    } else {
      const text = (Node.get(editor, selection.focus.path) as any).text;
      if (!text) {
        if (!at) {
          console.log('B-------');
          at = [selection.focus.path[0]];
        }
      } else {
        console.log('C-------');

        if (!at && !selection.focus.offset && !selection.anchor.offset) {
          console.log('C1-------');
          at = [selection.focus.path[0]];
        } else {
          isNoEmpty = true;
          console.log('C2-------');
        }
      }
    }
  } else {
    isNoEmpty = true;
    console.log('D-------');
  }

  if (atPath) {
    at = atPath;
  }

  Transforms.insertNodes(editor, card, isNoEmpty ? {} : { at: at });

  if (!isNoEmpty) {
    setTimeout(() => {
      const nextPath = Editor.start(editor, Path.next(at));
      Transforms.select(editor, nextPath);
    });
  }
  console.log('@@@@@@@@@@@@', at, editor?.selection?.anchor);
};
