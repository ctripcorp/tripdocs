import { Editor } from '@src/components/slate-packages/slate';
import { HEADING_TYPES, LIST_TYPES } from './config';
import { getEditorEventEmitter } from './table/selection';

let timeout = null;
let flag = null;

export const withAnchor = (editor: any) => {
  const { insertData, apply, isVoid } = editor;

  editor.insertData = (data: any) => {
    insertData(data);
  };

  editor.isVoid = (element: any) => {
    if (element?.type?.indexOf('heading') === 0) {
      if (!(window as any).anchorPoint) {
        (window as any).anchorPoint = {};
      }
    }
    return isVoid(editor);
  };

  editor.apply = (op: any) => {
    apply(op);

    let node = null;
    if (['insert_text', 'remove_text', 'merge_node'].includes(op.type)) {
      const { path, text } = op;
      const entry = Editor.parent(editor, path);
      const parent: any = entry && entry[0];
      node = parent;
    }

    if (['insert_node', 'remove_node'].includes(op.type)) {
      node = op.node;
    }

    if (op.type === 'split_node') {
      node = op.properties;
    }

    const isSetNodesChange = op.type === 'set_node' && op.path?.length === 1 && isHeading(editor, op.path);
    const isOtherChange =
      node && node.type && (HEADING_TYPES.includes(node.type) || (HEADING_TYPES.includes(node.oldType) && LIST_TYPES.includes(node.type)));
    if (isSetNodesChange || isOtherChange) {
      if (!flag) {
        flag = true;
        timeout = setTimeout(() => {
          console.log('[withAnchor apply] updateOutlineAnchor', op);
          getEditorEventEmitter(editor.docId).emit('updateOutlineAnchor', editor.docId);
          flag = false;
        }, 200);
      }
    }
  };
  return editor;
};

function isHeading(editor, path) {
  const entry = Editor.node(editor, path);
  const node: any = entry && entry[0];
  return node && (HEADING_TYPES.includes(node.type) || HEADING_TYPES.includes(node.oldType));
}
