import { getCache } from '@src/utils/cacheUtils';
import { createRandomId } from '@src/utils/randomId';
import { nodeName } from 'jquery';

export const withElmentId = (editor: any) => {
  const { apply } = editor;
  editor.apply = (op: any) => {
    let newOp: any = op;
    if (['insert_node'].includes(op.type)) {
      if (getCache(editor.docId, 'timeCheck')) {
        newOp = { ...newOp, node: { ...(newOp.node as Node), anchorId: newOp.node.anchorId || createRandomId() + '1111' } as any };
      } else {
        newOp = { ...newOp, node: { ...(newOp.node as Node), anchorId: createRandomId() + '1111' } as any };
      }
    }
    if (['split_node'].includes(op.type)) {
      if (Object.keys(newOp.properties).length !== 0) {
        newOp = { ...newOp, properties: { ...(newOp.properties as Node), anchorId: createRandomId() + '1111' } };
      }
    }
    if (['set_node'].includes(op.type) && newOp.newProperties) {
      delete newOp.newProperties.anchorId;
    }
    apply(newOp);
  };
  return editor;
};
