import { ReactEditor } from '../../../slate-packages/slate-react';
import { insertCard } from '../Card';
import { ELTYPE } from '../config';

export const insertDivide = (editor: ReactEditor) => {
  insertCard(editor, {
    type: ELTYPE.DIVIDE,
    children: [{ text: '' }],
  });
};
