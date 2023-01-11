import { Transforms, Range, Node, Editor, Point } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { ELTYPE, TABBABLE_TYPES } from './config';
import { decreaseIndent } from './indent';
import { getParentPathByTypes } from './pluginsUtils/getPathUtils';

export const withTabLevel = (editor: any) => {
  const { normalizeNode, deleteBackward } = editor;

  editor.deleteBackward = (unit: any) => {
    console.log('[withTabLevel] deleteBackward', unit);
    const { selection } = editor;

    if (selection && ReactEditor.hasRange(editor, selection) && Range.isCollapsed(selection)) {
      const parentPath = getParentPathByTypes(editor, selection.anchor.path, TABBABLE_TYPES);
      if (parentPath) {
        const offset = selection.anchor.offset;
        const rowNode: any = Node.get(editor, parentPath);
        const start = Editor.start(editor, parentPath);
        if (offset === 0 && rowNode.tabLevel && Point.equals(start, selection.anchor)) {
          decreaseIndent(editor, rowNode, selection);
          console.log('[withTabLevel] returned ');
          return;
        }
      }
    }

    deleteBackward(unit);
  };

  return editor;
};
