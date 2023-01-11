import isHotkey from 'is-hotkey';
import { Editor } from '@src/components/slate-packages/slate';
import { toggleMark } from './mark';
import { toggleBlock } from '../block';
import { ELTYPE } from '../config';

export const onKeyDownTextMark = (e: KeyboardEvent, editor: Editor) => {
  if (!editor.selection) {
    console.log('[onKeyDownTextMark]', 'Selection不存在，不做处理！');
    return;
  }
  const isTitle = editor.selection.focus.path[0] === 0;
  if (isTitle) {
    return;
  }
  if (isHotkey('mod+b', e)) {
    e.preventDefault();
    toggleMark(editor, 'bold');
  }
  if (isHotkey('mod+i', e)) {
    e.preventDefault();
    toggleMark(editor, 'italic');
  }
  if (isHotkey('mod+shift+x', e)) {
    e.preventDefault();
    toggleMark(editor, 'strikethrough');
  }
  if (isHotkey('mod+u', e)) {
    e.preventDefault();
    toggleMark(editor, 'underline');
  }
  if (isHotkey('mod+e', e)) {
    e.preventDefault();
    toggleMark(editor, 'code');
  }
  if (isHotkey('mod+alt+t', e)) {
    e.preventDefault();
    toggleBlock(editor, ELTYPE.TODO_LIST, editor.selection);
  }
};
