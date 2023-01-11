import { v4 as anchorId } from 'uuid';
import { Transforms, Node, Path } from '@src/components/slate-packages/slate';
import { insertCard } from '../Card';
import { ELTYPE } from '../config';

export const insertCodeBlock = (editor: any, selectionFocusPath: Path = editor.selection.focus.path) => {
  const voidNode = {
    type: ELTYPE.CODE_BLOCK,
    children: [{ text: '' }],
    'data-codeblock-id': encodeURI(anchorId()),
    'data-card-value': '',
  };

  insertCard(editor, voidNode, [selectionFocusPath[0] + 1]);
  Transforms.insertNodes(editor, { type: ELTYPE.PARAGRAPH, children: [{ text: '' }] } as Node, {
    at: [selectionFocusPath[0] + 2],
  });
  Transforms.select(editor, [selectionFocusPath[0] + 1, 0]);
};
