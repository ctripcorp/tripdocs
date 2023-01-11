import { Editor, Element, Node, Text, Range, Path, Transforms } from '@src/components/slate-packages/slate';
import hotkeys from '@src/components/slate-packages/slate-react/utils/hotkeys';
import { ELTYPE } from '../config';
export const onKeyDownMention = (e: any, editor: Editor) => {
  const { selection } = editor;
  if (!selection) return;
  if (
    e.keyCode === 37 &&
    Range.isCollapsed(selection) &&
    selection.anchor.path[selection.anchor.path.length - 1] !== 0 &&
    selection.anchor.offset === 0
  ) {
    const beforePath = [...selection.anchor.path.slice(0, -1), selection.anchor.path[selection.anchor.path.length - 1] - 1];
    const isPathValid = Path.isPath(beforePath);
    const isNodeValid = Node.has(editor, beforePath);
    if (isPathValid && isNodeValid) {
      const rowNode: any = Node.get(editor, beforePath);
      if (rowNode?.type === 'mention') {
        const point = Editor.end(editor, [...selection.anchor.path.slice(0, -1), selection.anchor.path[selection.anchor.path.length - 1] - 2]);
        Transforms.select(editor, point);
        console.log('before', point);
        e.preventDefault();
        return true;
      }
    }
  }
  if (e.keyCode === 39 && Range.isCollapsed(selection) && selection.anchor.offset === Editor.end(editor, selection.anchor.path).offset) {
    const afterPath = [...selection.anchor.path.slice(0, -1), selection.anchor.path[selection.anchor.path.length - 1] + 1];
    const endPath = Editor.end(editor, selection.anchor.path.slice(0, 1));
    if (selection.anchor.path[selection.anchor.path.length - 1] + 1 <= endPath.path[endPath.path.length - 1]) {
      console.log('endPath', endPath);
      const isPathValid = Path.isPath(afterPath);
      const isNodeValid = Node.has(editor, afterPath);
      if (isPathValid && isNodeValid) {
        const rowNode: any = Node.get(editor, afterPath);
        if (rowNode?.type === 'mention') {
          const point = Editor.start(editor, [...selection.anchor.path.slice(0, -1), selection.anchor.path[selection.anchor.path.length - 1] + 2]);
          Transforms.select(editor, point);
          console.log('after', point);
          e.preventDefault();
          return true;
        }
      }
    }
  }

  const focusPath = selection.focus.path;
  const prevLeafPath = [...focusPath.slice(0, -1), (focusPath[focusPath.length - 1] || 1) - 1];
  if (
    hotkeys.isDeleteBackward(e) &&
    Node.has(editor, prevLeafPath) &&
    (Node.get(editor, prevLeafPath) as any).type === ELTYPE.MENTION &&
    prevLeafPath[0] === focusPath[0] &&
    selection.focus.offset === 0 &&
    Range.isCollapsed(editor.selection)
  ) {
    e.preventDefault();
    e.stopPropagation();
    Transforms.removeNodes(editor, { at: prevLeafPath });
    return true;
  }
};
