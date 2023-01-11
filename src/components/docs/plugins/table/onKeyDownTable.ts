import isHotkey from 'is-hotkey';
import { Editor, Node, Transforms, Range, Point, Path, Text } from '@src/components/slate-packages/slate';
import { ReactEditor } from '../../../slate-packages/slate-react';
import { ELTYPE } from '../config';
import { removeSelection } from './selection';
import { delChildrenComponent, delChildrenNotAllowComponent } from '@src/utils/normalize';
import { ACTIVE_TABLE, SEL_CELLS } from '@src/utils/weak-maps';
import { getStart } from '@src/utils/selectionUtils';
import { getParentPathByType } from '../pluginsUtils/getPathUtils';
import { testActiveTable } from './tableElement';
import { isInTable } from '../deserializers/deserialize';

export const onKeyDownTable = (e: KeyboardEvent, editor: ReactEditor) => {
  const selectedCells = SEL_CELLS.get(editor);

  console.log('selectedCells', selectedCells);

  const entry = ACTIVE_TABLE.get(editor);
  let isActiveTable = false;
  if (entry) {
    const [, curTablePath] = entry;
    const activeTableRow = curTablePath[0];
    isActiveTable = testActiveTable(editor, activeTableRow);
  }

  const isTitle = editor.selection && ReactEditor.hasRange(editor, editor.selection) && editor.selection.focus.path[0] === 0;
  const isCurTableSelectedCells = selectedCells?.length > 0 && isActiveTable;

  if (isTitle) {
    return;
  }

  if (isCurTableSelectedCells) {
    if (isHotkey('mod+c', e)) {
      e.preventDefault();
      e.stopPropagation();
      const tablePath = getParentPathByType(editor, selectedCells[0][1], ELTYPE.TABLE);
      const tableNode: any = Node.has(editor, tablePath) && Node.get(editor, tablePath);
      const rowNum = tableNode.children.length;
      const columNum = tableNode.children[0].children.length;
      if (rowNum * columNum === selectedCells.length) {
        const [start, end] = Editor.edges(editor, selectedCells[0][1].slice(0, 1));
        const range = {
          focus: start,
          anchor: end,
        };
        Transforms.select(editor, range);
        document.execCommand('copy');
        Transforms.deselect(editor);
      } else {
        e.preventDefault();
        e.stopPropagation();

        Transforms.select(editor, {
          anchor: Editor.start(editor, selectedCells[0][1].slice(0, -1)),
          focus: Editor.end(editor, selectedCells[selectedCells.length - 1][1].slice(0, -1)),
        });

        document.execCommand('copy');
      }
    } else if (isHotkey('backspace', e) || isHotkey('delete', e)) {
      e.preventDefault();
      e.stopPropagation();

      console.log('删除选蓝区域单元格的内容', selectedCells);
      selectedCells.forEach((entry: any) => {
        delChildrenComponent(editor, entry[0].children, entry[1]);
      });
    }
  }

  if (isInTable(editor) && Range.isCollapsed(editor.selection)) {
    if (e.key === 'ArrowUp' && isCellTop(editor)) {
      const point = getCellUpPoint(editor);
      if (point) {
        e.preventDefault();
        Transforms.setSelection(editor, { anchor: point, focus: point });
        return;
      }
    }
    if (e.key === 'ArrowDown' && isCellBottom(editor)) {
      e.preventDefault();
      const point = getCellDownPoint(editor);

      if (point) {
        e.preventDefault();
        Transforms.setSelection(editor, { anchor: point, focus: point });
        return;
      }
    }
  }
};

function isCellTop(editor: ReactEditor): boolean {
  if (editor.selection.anchor.path[4] === 0) {
    return true;
  }
  return false;
}

function isCellBottom(editor: ReactEditor): boolean {
  const endPoint = Editor.end(editor, editor.selection.anchor.path.slice(0, 4));
  if (endPoint.path[4] === editor.selection.anchor.path[4]) {
    return true;
  }
  return false;
}
function getCellUpPoint(editor: ReactEditor): Point {
  const path = editor.selection.anchor.path;
  if (path.length > 4) {
    if (Editor.hasPath(editor, [...path.slice(0, 2), path[2] - 1, ...path.slice(3, 4)])) {
      const point = Editor.start(editor, [...path.slice(0, 2), path[2] - 1, ...path.slice(3, 4)]);
      return point;
    }
    if (path[0] - 1 > 1) {
      const point = Editor.start(editor, [path[0] - 1]);
      return point;
    }
  }
  return null;
}
function getCellDownPoint(editor: ReactEditor): Point {
  const path = editor.selection.anchor.path;
  if (path.length > 4) {
    if (Editor.hasPath(editor, [...path.slice(0, 2), path[2] + 1, ...path.slice(3, 4)])) {
      const point = Editor.start(editor, [...path.slice(0, 2), path[2] + 1, ...path.slice(3, 4)]);
      return point;
    }
    if (Editor.hasPath(editor, [path[0] + 1])) {
      const point = Editor.start(editor, [path[0] + 1]);
      return point;
    }
  }
  return null;
}
export function getCellRightPoint(editor: ReactEditor): Point {
  const path = editor.selection.anchor.path;
  if (path.length > 4) {
    const entry = Editor.next(editor, { at: editor.selection });
    if (entry) {
      const [text, nPath] = entry;
      return Editor.start(editor, nPath);
    }
  }
  return null;
}
