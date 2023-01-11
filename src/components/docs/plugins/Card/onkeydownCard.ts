import { Editor, NodeEntry, Path, Transforms, Node, Range, Point } from '@src/components/slate-packages/slate';
import { getStart } from '@src/utils/selectionUtils';
import { ReactEditor } from '../../../slate-packages/slate-react';
import { ELTYPE } from '../config';
import { getParentPathByType } from '../pluginsUtils/getPathUtils';
import { removeCardSelectionContentBeforeInput } from './withCard';

const getLastNode = (editor: Editor, lastPath: Path): NodeEntry => {
  let i = lastPath.length;
  while (i > 0) {
    const path = lastPath.slice(0, i);
    const node: any = Editor.node(editor, path);
    if (!!node[0].type) {
      return node;
    }
    i--;
  }
  return Editor.node(editor, lastPath.slice(0, 1));
};

export const onKeyDownCard = (e: any, editor: ReactEditor) => {
  if (!editor.selection) {
    console.log('[Card onKeyDownCard]', 'Selection不存在，不做处理！');
    return;
  }

  const matchTool = Editor.above(editor, {
    match: (n: any) => [ELTYPE.CARD_PRE, ELTYPE.CARD_SUF].includes(n.type as string),
  });
  const rowNode: any = Node.get(editor, [editor.selection.anchor.path[0]]);
  const isParagraph = rowNode.type === ELTYPE.PARAGRAPH;

  if (matchTool) {
    console.log('[onKeyDownCard]---', e, e.metaKey, e.key);
    const isCtrlV = e.key === 'v' && (e.ctrlKey || e.metaKey);

    if (!isCtrlV && (!e.key || ['Meta', 'Control'].includes(e.key) || e.metaKey || e.ctrlKey)) {
      console.log('[Card onKeyDownCard]', '不处理此类按键，按键为', e.key);
      return;
    }

    const [node, path]: any = matchTool;

    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (e.key === 'Enter' || e.key === 'Process') {
        let wrap = Editor.above(editor, {
          match: (n: any) => n.type === ELTYPE.CARD,
        });
        if (wrap) {
          if (node.type === ELTYPE.CARD_PRE) {
            console.log('A');
            Transforms.insertNodes(
              editor,
              {
                type: ELTYPE.PARAGRAPH,
                children: [{ text: '' }],
              } as Node,
              { at: wrap[1] }
            );
            let currentPath = path;
            path[path.length - 2] = path[path.length - 2] + 1;
            Transforms.select(editor, currentPath);
            e.preventDefault();
            return true;
          } else {
            console.log('B');
            let nextPath = Path.next(wrap[1]);
            Transforms.insertNodes(
              editor,
              {
                type: ELTYPE.PARAGRAPH,
                children: [{ text: '' }],
              } as Node,
              { at: nextPath }
            );
            Transforms.select(editor, nextPath);
            e.preventDefault();
            return true;
          }
        }
      } else if (e.key.length === 1) {
        let wrap = Editor.above(editor, {
          match: (n: any) => n.type === ELTYPE.CARD,
        });
        if (wrap) {
          if (node.type === ELTYPE.CARD_PRE) {
            console.log('D1');
            let previous = Editor.previous(editor, { at: wrap[1] });

            console.log('D1-2');
            Transforms.insertNodes(
              editor,
              {
                type: ELTYPE.PARAGRAPH,
                children: [{ text: '' }],
              } as Node,
              { at: wrap[1] }
            );
            Transforms.select(editor, wrap[1]);
            Transforms.collapse(editor, { edge: 'end' });
          } else if (node.type === ELTYPE.CARD_SUF) {
            console.log('D2');
            let next = Editor.next(editor, { at: wrap[1] });

            console.log('D2-2');
            let nextPath = Path.next(wrap[1]);
            console.log('[next nextPath ]', next, nextPath);
            Transforms.insertNodes(
              editor,
              {
                type: ELTYPE.PARAGRAPH,
                children: [{ text: '' }],
              } as Node,
              { at: nextPath }
            );
            Transforms.select(editor, nextPath);
            Transforms.collapse(editor, { edge: 'end' });
          }
        }
      }
    } else if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
      const parentPath = getParentPathByType(editor, path, ELTYPE.CARD);
      if (node.type === ELTYPE.CARD_PRE && e.key == 'ArrowRight' && parentPath) {
        let [lastNode, lastPath] = Editor.last(editor, parentPath);

        Transforms.select(editor, lastPath);
        e.preventDefault();
      } else if (node.type === ELTYPE.CARD_SUF && e.key == 'ArrowLeft' && parentPath) {
        let [firstNode, firstPath] = Editor.first(editor, parentPath);

        Transforms.select(editor, firstPath);
        e.preventDefault();
      }
    }
  } else if (e.key === 'Tab') {
  } else if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
  }
  if (e.key.length === 1) {
    removeCardSelectionContentBeforeInput(editor, e);
  }
};
