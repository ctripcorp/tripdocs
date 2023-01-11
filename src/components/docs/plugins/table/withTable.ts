import { Editor, Element as SlateElement, Node, Path, Point, Range, Transforms } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react/plugin/react-editor';
import { getPlainText } from '@src/components/slate-packages/slate-react/utils/dom';
import { IS_READ_ONLY } from '@src/components/slate-packages/slate-react/utils/weak-maps';
import { delChildrenComponent } from '@src/utils/normalize';
import { currentCellSelectAll, getCurrentLineEnd } from '@src/utils/selectionUtils';
import { ACTIVE_TABLE, SEL_CELLS } from '@src/utils/weak-maps';
import { ELTYPE, HEADING_TYPES, LIST_TYPES, TABBABLE_TYPES } from '../config';
import { getParentPathByType, getParentPathByTypes, isPathDescendantOfTable } from '../pluginsUtils/getPathUtils';
import { removeSelection, removeSelectionForAllTables } from './selection';
import { testActiveTable } from './tableElement';

export const withTable = (editor: any) => {
  const { deleteBackward, deleteForward, insertBreak, deleteFragment, insertText, setFragmentData } = editor;

  editor.setFragmentData = (data: DataTransfer) => {
    const isReadOnly = IS_READ_ONLY.get(editor);
    const selCellsFromDom = [];
    if (isReadOnly) {
      const domSelection = window.getSelection();
      const newSelection = ReactEditor.toSlateRange(editor, domSelection, {
        exactMatch: false,

        suppressThrow: true,
      });
      if (newSelection && ReactEditor.hasRange(editor, editor.selection) && Range.isExpanded(newSelection)) {
        const [start, end] = Range.edges(newSelection);
        const common = Path.common(start.path, end.path);
        const edgesInSameCell = common.length === 4;

        if (!edgesInSameCell) {
          editor.selection = newSelection;
          const cells = Editor.nodes(editor, { at: newSelection, match: (n: any) => n.type === ELTYPE.TABLE_CELL });
          selCellsFromDom.push(...cells);
          console.log('newSelection ~~', newSelection, selCellsFromDom);
        }
      }
    }
    if (!editor.selection || !Range.isRange(editor.selection)) return;
    const selectedCells = isReadOnly ? selCellsFromDom : SEL_CELLS.get(editor);
    console.log('[isOneTable]', editor.selection);
    const { anchor, focus } = editor.selection;
    const isInOneTable = anchor.path.length >= 6 && focus.path.length >= 6 && Path.equals(anchor.path.slice(0, 2), focus.path.slice(0, 2));

    let selectedCellsArr: Array<{ selectedNode; selectedPath }> = [];
    let contents;
    const div = document.createElement('div');
    div.setAttribute('hidden', 'true');
    let no = null;
    let tableEL = document.createElement('table');
    let tbodyEL = document.createElement('tbody');
    let tr = document.createElement('tr');
    if (selectedCells && isInOneTable) {
      for (const [selectedNode, selectedPath] of selectedCells) {
        selectedCellsArr.push({ selectedNode, selectedPath });
        if (
          typeof selectedNode.colspan === 'number' &&
          typeof selectedNode.rowspan === 'number' &&
          selectedNode.colspan * selectedNode.rowspan === 0
        ) {
          continue;
        }
        let dom = ReactEditor.toDOMNode(editor, selectedNode);
        let domClone = trimSlateDom(dom.cloneNode(true));

        contents = document.createDocumentFragment().appendChild(domClone);
        let attach = contents.childNodes[0] as HTMLElement;
        contents.childNodes.forEach((node: any) => {
          if (node.textContent && node.textContent.trim() !== '') {
            attach = node as HTMLElement;
          }
        });
        let no1 = selectedPath.slice(2, -1)[0];
        if (no != no1) {
          tr = document.createElement('tr');
          tr.appendChild(contents);
          no = no1;
        } else {
          tr.appendChild(contents);
        }
        tbodyEL.appendChild(tr);
        tableEL.appendChild(tbodyEL);
        console.log('[tab setFragmentData ] dom', tableEL);
      }
    }

    if (selectedCellsArr.length > 1) {
      div.appendChild(tableEL);

      document.body.appendChild(div);
      data.setData('text/html', div.innerHTML);
      data.setData('text/plain', getPlainText(div));
      console.log('[tab setFragmentData ] innerHTML', div.innerHTML);
      document.body.removeChild(div);
      console.log('[tab setFragmentData ]', selectedCellsArr);
    } else {
      setFragmentData(data);
    }
  };

  editor.deleteBackward = (unit: any) => {
    const { selection } = editor;

    if (selection && ReactEditor.hasRange(editor, selection) && Range.isCollapsed(selection)) {
      if (isPathDescendantOfTable(editor, selection.anchor.path)) {
        const tableCellPath = getParentPathByType(editor, selection.anchor.path, ELTYPE.TABLE_CELL);
        const parentPath = getParentPathByTypes(editor, selection.anchor.path, TABBABLE_TYPES);
        if (parentPath) {
          const start = Editor.start(editor, parentPath);
          const type: any = (Node.get(editor, start.path.slice(0, parentPath.length)) as any).type;

          const isFirstInTableCell = parentPath[tableCellPath.length] === 0;
          console.log('[deleteBackward] 阻止删除前面的 Cell', start, tableCellPath, parentPath, type, isFirstInTableCell);

          if (Point.equals(selection.anchor, start) && isFirstInTableCell && ![...LIST_TYPES, ...HEADING_TYPES].includes(type)) {
            return;
          }
        }
      }
    }

    deleteBackward(unit);
  };

  editor.deleteForward = (unit: any) => {
    console.log('table deleteForward', unit);
    const { selection } = editor;
    if (selection && ReactEditor.hasRange(editor, selection) && Range.isCollapsed(selection)) {
      if (isPathDescendantOfTable(editor, selection.anchor.path)) {
        const tableCellPath = getParentPathByType(editor, selection.anchor.path, ELTYPE.TABLE_CELL);
        const parentPath = getParentPathByTypes(editor, selection.anchor.path, [...TABBABLE_TYPES]);
        if (parentPath && Path.isChild(parentPath, tableCellPath)) {
          const end = Editor.end(editor, parentPath);

          const type: any = (Node.get(editor, end.path.slice(0, parentPath.length)) as any).type;
          const cellLastEntry = Editor.last(editor, tableCellPath);
          if (cellLastEntry) {
            const [lastnode, lastpath] = cellLastEntry;

            const isLastRowInCell = Path.isCommon(parentPath, lastpath);

            console.log('[deleteForward] 阻止继续删除后续 Cell', Point.equals(selection.anchor, end), isLastRowInCell);
            if (Point.equals(selection.anchor, end) && isLastRowInCell) {
              return;
            }
          }
        }
      }
    }

    deleteForward(unit);
  };

  editor.deleteFragment = () => {
    console.log('table deleteFragment', editor.deleteFragment);
    deleteFragment();
  };

  editor.insertBreak = () => {
    const { selection } = editor;
    console.log('withTable insertBreak');
    if (selection) {
      if (selection.focus.path[0] === 0) {
        const TABLE_TYPE = [ELTYPE.TABLE, ELTYPE.TABLE_ROW, ELTYPE.TABLE_CELL];
        const allNodes = (Node.get(editor, selection.focus.path[0]) as any).children as Array<any>;
        if (selection.focus.path[0] < allNodes.length - 1 && TABLE_TYPE.includes((Node.child(editor, selection.focus.path[0] + 1) as any).type)) {
          Transforms.insertNodes(
            editor,
            {
              type: ELTYPE.PARAGRAPH,
              children: [
                {
                  text: '',
                },
              ],
            } as Node,
            { at: selection }
          );
          return;
        }
      }
    }

    insertBreak();
  };

  editor.insertText = (text: any) => {
    console.log('withTable insertText');
    const { selection } = editor;

    ReactEditor.focus(editor);
    const selectedCells = SEL_CELLS.get(editor);
    if (selectedCells && selectedCells.length > 0) {
      removeSelectionForAllTables(editor);
      const [nodeTopLeft, pathTopLeft] = selectedCells[0];
      const path = [...pathTopLeft, 0, 0];
      console.log('[withTable] insertText 左上单元格', nodeTopLeft, path);
      Transforms.select(editor, { focus: { path, offset: 0 }, anchor: { path, offset: 0 } });
      const range: any = currentCellSelectAll(editor);
      Transforms.select(editor, range);
    }
    insertText(text);
  };

  return editor;
};

const max = (a: any, b: any) => {
  return a > b ? a : b;
};

function trimSlateDom(dom: globalThis.Node) {
  console.log('trimSlateDom', dom);
  if (['TD', 'TH'].includes(dom.nodeName) && dom.hasChildNodes()) {
    const { childNodes } = dom;

    let arr = Array.from(childNodes).map(child => child.cloneNode(true));
    for (let i = 0; i < arr.length - 1; i++) {
      const child = childNodes[i];
      const isNextToEnd = i + 1 >= arr.length - 1;

      if (!child) {
        continue;
      }

      while (child.nodeName === 'UL' && childNodes[i + 1]?.nodeName === 'UL') {
        const nextChildNodes = childNodes[i + 1]?.childNodes;
        if (!nextChildNodes || nextChildNodes.length === 0) {
          break;
        }
        child.appendChild(nextChildNodes[0]);
        childNodes[i + 1].remove();
        if (isNextToEnd) {
          break;
        }
      }

      while (child.nodeName === 'OL' && childNodes[i + 1]?.nodeName === 'OL') {
        const nextChildNodes = childNodes[i + 1]?.childNodes;
        if (!nextChildNodes || nextChildNodes.length === 0) {
          break;
        }
        child.appendChild(nextChildNodes[0]);
        childNodes[i + 1].remove();
        if (isNextToEnd) {
          break;
        }
      }

      if (['P'].includes(child.nodeName)) {
        const newChild = document.createElement('div');
        let tempNode = child.firstChild;
        let nextNode;
        while (tempNode) {
          nextNode = tempNode.nextSibling;
          newChild.appendChild(tempNode);
          tempNode = nextNode;
        }
        newChild.className = (child as any).className;
        newChild.id = (child as any).id;
        dom.replaceChild(newChild, child);
      }
    }
  }
  return dom;
}
