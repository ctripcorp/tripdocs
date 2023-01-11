import { Editor, Node, Path, Point, Range } from '@src/components/slate-packages/slate';
import { createUUID } from '@src/utils/randomId';
import { ELTYPE, INLINE_TYPES, SINGLE_INLINE_TYPES } from './config';
import { selectTargetForPath } from './Image/imagePlugins';
import { getParentPathByType, getParentPathByTypes } from './pluginsUtils/getPathUtils';

export const withInline = (editor: any) => {
  const { apply } = editor;
  editor.apply = (op: any) => {
    let newOp: any = op;

    if (op.type === 'set_selection') {
      if (Range.isRange(op.newProperties) && Range.isCollapsed(op.newProperties)) {
        const tPath = getParentPathByType(editor, op.newProperties.anchor.path, ELTYPE.LINK);

        if (tPath && Point.equals(Editor.end(editor, tPath), op.newProperties.anchor)) {
          const parentPath = tPath.slice(0, -1);
          const pChildEnd = Editor.end(editor, parentPath);

          if (Path.equals(pChildEnd.path, tPath)) {
            newOp = insertLeaf(tPath);
          } else {
            const entry = Editor.next(editor, { at: tPath });

            if (entry) {
              const [nextText, nextPath] = entry;
              const nextNode: any = Node.get(editor, nextPath.slice(0, -1));
              if (Path.isAncestor(parentPath, nextPath) && !INLINE_TYPES.includes(nextNode.type)) {
                const start = Editor.start(editor, nextPath);
                newOp = {
                  ...newOp,
                  newProperties: {
                    anchor: start,
                    focus: start,
                  },
                };
              } else {
                newOp = insertLeaf(tPath);
              }
            }
          }
        }
      }
    }

    apply(newOp);
  };
  return editor;
};

function insertLeaf(path: number[]) {
  const newOp = {
    type: 'insert_node',
    path: [...path.slice(0, -1), path.pop() + 1],
    node: { text: '', anchorId: createUUID() },
  };
  return newOp;
}
