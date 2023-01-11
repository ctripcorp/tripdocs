import { Editor, Node, Range, Path, Transforms } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import hotkeys from '@src/components/slate-packages/slate-react/utils/hotkeys';
import isHotkey from 'is-hotkey';
import { ELTYPE } from '../config';
import { copyImage } from './imagePlugins';
export const onKeyDownImage = (e: any, editor: ReactEditor): boolean => {
  const { selection } = editor;
  if (selection) {
    const {
      anchor: { path },
    } = selection;

    if (isHotkey('mod+c', e) && Range.isCollapsed(selection) && Editor.hasPath(editor, path)) {
      const rowPath: any = path.slice(0, -1);
      const rowNode: any = Node.get(editor, path.slice(0, -1));
      if (rowNode?.type === ELTYPE.IMAGE) {
        copyImage(editor, rowPath);

        e.preventDefault();
        return true;
      }
    }
  }
};
