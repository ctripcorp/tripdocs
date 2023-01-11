import { Editor, Node, Range } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { SEL_CELLS } from '@src/utils/weak-maps';
import { ELTYPE } from '../config';
import { ColorFormat } from './color';

const FONT_STYLE = ['fontSizeXLarge', 'fontSizeLarge', 'fontSizeNormal', 'fontSizeSmall'];

export const toggleMark = (editor: Editor, format: any) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

export const isMarkActive = (editor: ReactEditor, format: any) => {
  try {
    if (
      editor &&
      editor.selection &&
      ReactEditor.hasRange(editor, editor.selection) &&
      Node.has(editor, editor.selection.anchor.path) &&
      Node.has(editor, editor.selection.focus.path)
    ) {
      let marks = Editor.marks(editor);
      return marks ? marks[format] === true : false;
    } else {
      return false;
    }
  } catch (e) {}
};

export const getColorMark = (editor: ReactEditor, colorFormat: ColorFormat) => {
  try {
    if (colorFormat === 'cellBackgroundColor') {
      const selCells = SEL_CELLS.get(editor);
      if (selCells && selCells.length > 0) {
        const firstCell = selCells[0];
        const [, path] = firstCell;
        const cell = Node.get(editor, path);

        return cell[colorFormat];
      }
    }
    if (editor && editor.selection && ReactEditor.hasRange(editor, editor.selection) && Node.has(editor, editor.selection.anchor.path)) {
      const marks = Editor.marks(editor);
      return marks ? marks[colorFormat] : null;
    } else {
      return null;
    }
  } catch (e) {
    console.log(e);
  }
};
