import { Node, Transforms } from '@src/components/slate-packages/slate';
import { ELTYPE } from '../config';
export const setNodesToPARAGRAPH = (editor: any, typeArr: any[] = [], selection?: any[]) => {
  const { anchor, focus } = editor.selection;

  if (anchor.path[0] !== focus.path[0]) {
    let path1, path2: any;
    if (anchor.path[0] > focus.path[0]) {
      path1 = anchor.path[0];
      path2 = focus.path[0];
    } else {
      path1 = focus.path[0];
      path2 = anchor.path[0];
    }
    const count = path1 - path2;
    const nodeArr: any[] = [];
    for (let i = 0; i <= count; i++) {
      const path = path2 + i;

      nodeArr[i] = Node.get(editor, [path]);
      const { type, elId, id } = nodeArr[i];
      if (typeArr.includes(type)) {
        Transforms.setNodes(editor, { type: ELTYPE.PARAGRAPH } as Partial<Node>, { at: [path] });
      }
    }
  } else {
    Transforms.setNodes(editor, { type: ELTYPE.PARAGRAPH } as Partial<Node>, { at: selection });
  }
};
