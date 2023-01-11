import { Editor, Node, Path, Transforms, Range } from '@src/components/slate-packages/slate';
import { bodySelectAll } from '@src/utils/selectionUtils';
import { ELTYPE } from '../config';

export const deleteFragmentPluginsRunner = (editor: any, deleteFragment: Function) => {
  let preventDefault = false;

  preventDefault = keepStartElementProperties(editor, deleteFragment);
  if (!preventDefault) {
    deleteFragment();
  }
};

function keepStartElementProperties(editor: any, deleteFragment: Function): boolean {
  const { selection } = editor;
  const [start, end] = Editor.edges(editor, selection);
  const [startNode, startNodePath] = Editor.node(editor, [start.path[0]]);
  if (start.path[0] !== end.path[0]) {
    const isStart = start.offset === 0 && Path.equals(start.path, [...startNodePath, 0]);

    const bodyRange = bodySelectAll(editor);
    console.log(123, 'delete Frag', startNode, Range.equals(selection, bodyRange));
    if (Range.equals(selection, bodyRange)) {
      Transforms.delete(editor, { at: bodyRange });
      Transforms.setNodes(editor, { type: ELTYPE.PARAGRAPH } as Partial<Node>, { at: [1] });
      return;
    } else if (isStart) {
      deleteFragment('backward');
      Transforms.setNodes(editor, { ...startNode } as Partial<Node>, { at: startNodePath });
      return true;
    }
  }
  return false;
}
