import { Editor, Node, Range, Path, Transforms } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import hotkeys from '@src/components/slate-packages/slate-react/utils/hotkeys';
import isHotkey from 'is-hotkey';
import { ELTYPE } from '../config';
import { copyImage, cutImage } from '../Image/imagePlugins';
import { getParentPathByType } from '../pluginsUtils/getPathUtils';

export const onKeyDownInlineImage = (e: any, editor: ReactEditor): boolean => {
  const { selection } = editor;
  if (!selection) return;
  const {
    anchor: { path: anchorPath },
  } = selection;
  if (e.keyCode === 37 && Range.isCollapsed(selection) && anchorPath[anchorPath.length - 1] !== 0 && selection.anchor.offset === 0) {
    const beforePath = [...anchorPath.slice(0, -1), anchorPath[anchorPath.length - 1] - 1];
    const isPathValid = Path.isPath(beforePath);
    const isNodeValid = Node.has(editor, beforePath);
    if (isPathValid && isNodeValid) {
      const rowNode: any = Node.get(editor, beforePath);
      if (rowNode?.type === ELTYPE.INLINEIMAGE) {
        const point = Editor.end(editor, [...anchorPath.slice(0, -1), anchorPath[anchorPath.length - 1] - 2]);
        Transforms.select(editor, point);
        console.log('onKeyDownInlineImage before', point);
        e.preventDefault();
        return true;
      }
    }
  }
  if (e.keyCode === 39 && Range.isCollapsed(selection) && selection.anchor.offset === Editor.end(editor, anchorPath).offset) {
    const afterPath = [...anchorPath.slice(0, -1), anchorPath[anchorPath.length - 1] + 1];
    const endPath = Editor.end(editor, anchorPath.slice(0, 1));
    if (anchorPath[anchorPath.length - 1] + 1 <= endPath.path[endPath.path.length - 1]) {
      const isPathValid = Path.isPath(afterPath);
      const isNodeValid = Node.has(editor, afterPath);
      if (isPathValid && isNodeValid) {
        const rowNode: any = Node.get(editor, afterPath);
        if (rowNode?.type === ELTYPE.INLINEIMAGE) {
          let tPath = [...anchorPath.slice(0, -1), anchorPath[anchorPath.length - 1] + 2];
          const point = Editor.start(editor, tPath);
          Transforms.select(editor, point);
          console.log('onKeyDownInlineImage after', point);
          e.preventDefault();
          return true;
        }
      }
    }
  }

  if (isHotkey('mod+c', e) && Range.isCollapsed(selection) && Editor.hasPath(editor, anchorPath)) {
    const rowPath = anchorPath.slice(0, -1);
    const rowNode: any = Node.get(editor, rowPath);
    if (rowNode?.type === ELTYPE.INLINEIMAGE) {
      copyImage(editor, rowPath);

      e.preventDefault();
      return true;
    }
  }
  if (isHotkey('mod+x', e) && Range.isCollapsed(selection) && Editor.hasPath(editor, anchorPath)) {
    const rowPath = anchorPath.slice(0, -1);
    const rowNode: any = Node.get(editor, rowPath);
    if (rowNode?.type === ELTYPE.INLINEIMAGE) {
      cutImage(editor, rowPath);

      e.preventDefault();
      return true;
    }
  }

  const parentInlineImagePath = getParentPathByType(editor, selection.focus.path, ELTYPE.INLINEIMAGE);
  if (parentInlineImagePath && Range.isCollapsed(selection) && (isHotkey('Backspace', e) || isHotkey('Delete', e))) {
    e.preventDefault();
    e.stopPropagation();
    Transforms.removeNodes(editor, { at: parentInlineImagePath });
    return;
  }

  const focusPath = selection.focus.path;
  const prevLeafPath = [...focusPath.slice(0, -1), (focusPath[focusPath.length - 1] || 1) - 1];
  if (
    hotkeys.isDeleteBackward(e) &&
    Node.has(editor, prevLeafPath) &&
    (Node.get(editor, prevLeafPath) as any)?.type === ELTYPE.INLINEIMAGE &&
    prevLeafPath[0] === focusPath[0] &&
    selection.focus.offset === 0 &&
    Range.isCollapsed(editor.selection)
  ) {
    e.preventDefault();
    e.stopPropagation();
    Transforms.removeNodes(editor, { at: prevLeafPath });
    return true;
  }

  function parentPathEquals(path: number[], other: number[]) {
    return Path.equals(path.slice(0, -1), other.slice(0, -1));
  }
  const nextLeafPath = [...focusPath.slice(0, -1), focusPath[focusPath.length - 1] + 1];

  if (
    hotkeys.isDeleteForward(e) &&
    Node.has(editor, nextLeafPath) &&
    (Node.get(editor, nextLeafPath) as any)?.type === ELTYPE.INLINEIMAGE &&
    parentPathEquals(nextLeafPath, focusPath) &&
    Range.isCollapsed(editor.selection)
  ) {
    e.preventDefault();
    e.stopPropagation();
    Transforms.removeNodes(editor, { at: nextLeafPath });
    return true;
  }
};
