import { Editor, Node, Transforms } from '@src/components/slate-packages/slate';
import { Range } from '../../slate-packages/slate';
import { ELTYPE, HEADING_TYPES, LIST_TYPES } from './config';
import { updateOlList } from './OLULList/withOlList';
import { setNodesToPARAGRAPH } from './pluginsUtils/setNodesUtils';

function getPath12FromSelection(anchor: { path: any[] }, focus: { path: any[] }) {
  let path1, path2: any;
  if (anchor.path.length > 4) {
    const tmp1 = anchor.path.slice(0, -1),
      tmp2 = focus.path.slice(0, -1);
    if (tmp1[tmp1.length - 1] > tmp2[tmp2.length - 1]) {
      path1 = tmp1;
      path2 = tmp2;
    } else {
      path1 = tmp2;
      path2 = tmp1;
    }
  } else {
    if (anchor.path[0] > focus.path[0]) {
      path1 = [anchor.path[0]];
      path2 = [focus.path[0]];
    } else {
      path1 = [focus.path[0]];
      path2 = [anchor.path[0]];
    }
  }

  const count = path1[path1.length - 1] - path2[path2.length - 1];
  return { path1, path2, count };
}

export const toggleBlock = (editor: any, format: any, selection: any) => {
  const isActive = isBlockActive(editor, format, selection);
  const isList = LIST_TYPES.includes(format);
  isActive && setNodesToPARAGRAPH(editor, [format], selection);
  if (isList) {
    if (editor.selection) {
      const { anchor, focus } = editor.selection;

      if (Range.isExpanded(editor.selection)) {
        const { path1, path2, count } = getPath12FromSelection(anchor, focus);

        for (let i = 0; i < count + 1; i++) {
          const newPath = [...path2.slice(0, -1), path2[path2.length - 1] + i];
          if (Node.has(editor, newPath)) {
            const node: any = Node.get(editor, newPath);
            let newOpt: any = Object.assign(
              {},
              {
                type: isActive ? (node.oldType ? node.oldType : ELTYPE.PARAGRAPH) : format,
              }
            );

            if (HEADING_TYPES.includes(node.type)) {
              newOpt['oldType'] = node.type;
            }

            Transforms.setNodes(editor, newOpt, {
              at: newPath,
              match: node => Editor.isBlock(editor, node),
            });
            updateOlList(editor);
          }
        }
        return;
      } else {
        const node: any = Node.get(editor, focus.path.slice(0, -1));
        let newOpt: any = Object.assign(
          {},
          {
            type: isActive ? (node.oldType ? node.oldType : ELTYPE.PARAGRAPH) : format,
          }
        );
        if (HEADING_TYPES.includes(node.type)) {
          newOpt['oldType'] = node.type;
        }

        Transforms.setNodes(editor, newOpt, {
          at: focus.path.slice(0, -1),
        });
        updateOlList(editor);
      }
    }
  } else {
    !isActive &&
      Transforms.setNodes(
        editor,
        {
          type: isActive ? ELTYPE.PARAGRAPH : format,
        } as any,
        {
          at: isList ? editor.selection : selection,
        }
      );
    updateOlList(editor);
  }
};

export const isBlockActive = (editor: any, format: any, selection: any) => {
  try {
    const [match] = Editor.nodes(editor, {
      at: selection,
      match: (n: any) => n.type === format,
    });
    return !!match;
  } catch (e) {
    console.log(e);
  }
};
