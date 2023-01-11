import isHotkey from 'is-hotkey';
import { Editor, Node, Point, Range, Transforms } from '@src/components/slate-packages/slate';

import { ELTYPE } from '../config';
import { getParent, getParentPathByType } from '../pluginsUtils/getPathUtils';
import { getCurrentLineEnd, getCurrentLineStart } from '@src/utils/selectionUtils';
import { ReactEditor } from '@src/components/slate-packages/slate-react';

export const onKeyDownCommon = (e: KeyboardEvent, editor: ReactEditor) => {
  if (!editor.selection) {
    console.log('[onKeyDownCommon]', 'Selection不存在，不做处理！');
    return;
  }
  const { selection } = editor;
  if (isHotkey('enter', e) && Range.isCollapsed(selection)) {
    const {
      focus: { path },
      anchor,
    } = selection;
    const start = getCurrentLineStart(editor);
    const end = getCurrentLineEnd(editor);
    if (start) {
      const isStart = Point.equals(start, selection.anchor);
      const isEnd = Point.equals(end, selection.anchor);
      if (isStart || isEnd) {
        const [parent, parentPath] = getParent(editor, path);
        if ([ELTYPE.ALERTDESCRIPTION, ELTYPE.BLOCK_QUOTE, ELTYPE.TODO_LIST, ELTYPE.PARAGRAPH, ELTYPE.ALERTMESSAGE].includes(parent.type)) {
          e.preventDefault();
          const nextRow = [...parentPath.slice(0, -1), parentPath[parentPath.length - 1] + 1];
          const tPath = isStart ? (isEnd ? nextRow : parentPath) : nextRow;
          console.log('onKeyDownCommon test', parentPath, tPath);

          Transforms.insertNodes(editor, { ...parent, children: [{ text: '' }] }, { at: tPath, select: isEnd });

          return true;
        }
      }
    }
  }
  return false;
};
