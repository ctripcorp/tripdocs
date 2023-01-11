import { BaseText, Editor, Node, Transforms, Range, Point } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { getStart } from '@src/utils/selectionUtils';
import { message } from 'antd';
import { ELTYPE, HEADING_TYPES } from './config';
import { getParentPathByTypes } from './pluginsUtils/getPathUtils';

export const withTitleNormalized = (editor: any) => {
  const { normalizeNode, deleteBackward } = editor;

  editor.deleteBackward = (unit: any) => {
    if (editor.selection && ReactEditor.hasRange(editor, editor.selection) && Range.isCollapsed(editor.selection)) {
      const { startPoint } = getStart(editor);

      const preventedBackspaceAtStartTypes = [ELTYPE.PARAGRAPH, ELTYPE.CARD_PRE, ELTYPE.BLOCK_QUOTE, ...HEADING_TYPES];
      let preventedParentPath = getParentPathByTypes(editor, editor.selection.anchor.path, preventedBackspaceAtStartTypes);

      let start = Range.start(editor.selection);
      if (preventedParentPath && Point.equals(startPoint, start)) {
        return;
      }
    }
    deleteBackward(unit);
  };

  editor.normalizeNode = (entry: any) => {
    const [node, path] = entry;

    let str = '';
    try {
      str = Node.string(node);
    } catch (error) {
      console.error('withTitleNormalized', error);
    }
    const title = { type: ELTYPE.HEADING_ONE, children: [{ text: str }] };
    const paragraph = { type: ELTYPE.PARAGRAPH, children: [{ text: '' }] };
    if (!node || !path || path?.length === 0 || (path[0] === 0 && path?.length > 1)) {
      if (path && path.length === 0 && editor.children.length < 1) {
        Transforms.insertNodes(editor, [title, paragraph], { at: [0] });
      }
      return;
    }

    const isInTable =
      !!editor.selection &&
      ReactEditor.hasRange(editor, editor.selection) &&
      editor.children.length > editor.selection.focus.path[0] &&
      Editor.above(editor, {
        at: editor.selection.focus.path,
        match: (n: any) => {
          if (!n) {
            console.error('title normalizeNode n：', n);
          }
          return n && n.type === ELTYPE.TABLE;
        },
      });

    if (path[0] === 0 && !isInTable) {
      if (editor.children.length < 2) {
        Transforms.insertNodes(editor, [paragraph], { at: [1] });
        const nextLeafStartPoint = { path: [1, 0], offset: 0 };
        setTimeout(() => {
          Transforms.select(editor, nextLeafStartPoint);
        });
        return;
      } else if (ELTYPE.HEADING_ONE !== node.children[0].type) {
        Transforms.setNodes(editor, { type: ELTYPE.HEADING_ONE } as Partial<BaseText>, { at: [0] });
        return;
      } else if (Node.string(node.children[0]).length > 45) {
        Transforms.delete(editor, {
          at: {
            focus: Editor.end(editor, [0]),
            anchor: {
              ...Editor.start(editor, [0]),
              offset: 45,
            },
          },
        });
        return;
      }
    }

    normalizeNode(entry);
  };

  return editor;
};

let lastTime = 0;
const timeFrame = 2000;
function showMessage() {
  const now = Date.now();
  if (now - lastTime > timeFrame) {
    message.config({ maxCount: 1, duration: 1 });
    message.error('标题最大长度为 45 个字符，超出部分将被舍弃');
    lastTime = now;
  }
}
