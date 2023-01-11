import { Editor, Node, Range } from '@src/components/slate-packages/slate';
import { Editable, ReactEditor } from '@src/components/slate-packages/slate-react';

const FONT_STYLE = ['fontSizeLarger', 'fontSizeSmaller'];

export const fontSize = (editor: ReactEditor, format: any) => {
  if (
    editor &&
    editor.selection &&
    ReactEditor.hasRange(editor, editor.selection) &&
    Node.has(editor, editor.selection.anchor.path) &&
    FONT_STYLE.includes(format)
  ) {
    const marks: any = Editor.marks(editor);
    if (marks.fontSizeChange) {
      if (format === 'fontSizeLarger') {
        Editor.removeMark(editor, 'fontSizeChange');
        Editor.addMark(editor, 'fontSizeChange', marks.fontSizeChange + 4);
      } else {
        Editor.removeMark(editor, 'fontSizeChange');
        Editor.addMark(editor, 'fontSizeChange', marks.fontSizeChange - 4);
      }
    } else {
      if (format === 'fontSizeLarger') {
        Editor.addMark(editor, 'fontSizeChange', 4);
      } else {
        Editor.addMark(editor, 'fontSizeChange', -4);
      }
    }

    return;
  }
};

export const fontSizeByNum = (editor: ReactEditor, num: any) => {
  if (editor && editor.selection && ReactEditor.hasRange(editor, editor.selection) && Node.has(editor, editor.selection.anchor.path) && num >= 12) {
    const marks: any = Editor.marks(editor);
    if (marks.fontSizeChange) {
      Editor.removeMark(editor, 'fontSizeChange');
      Editor.addMark(editor, 'fontSizeChange', num - 14);
    } else {
      Editor.addMark(editor, 'fontSizeChange', num - 14);
    }
    return;
  }
};

export const fontLetterByNum = (editor: ReactEditor, num: any) => {
  if (editor && editor.selection && ReactEditor.hasRange(editor, editor.selection) && Node.has(editor, editor.selection.anchor.path)) {
    const marks: any = Editor.marks(editor);
    if (marks.fontLetter) {
      Editor.removeMark(editor, 'fontLetter');
      Editor.addMark(editor, 'fontLetter', num);
    } else {
      Editor.addMark(editor, 'fontLetter', num);
    }
    return;
  }
};
