import { Editor, Element, Node, Transforms } from '@src/components/slate-packages/slate';
import {
  delChildrenNotAllowComponent,
  delTopElement,
  ELEMENTNODE,
  isNodeChildrenIsNotNull,
  isNodeChildrenIsTargetType,
  setPTagChildrenNotAllowComponent,
} from '@src/utils/normalize';
import { ELTYPE, HEADING_TYPES } from '../config';

export function normalizeTable(editor: Editor, entry: [ELEMENTNODE, number[]]): boolean {
  const [node, path] = entry;

  const { type, children } = node;
  if (Element.isElement(node) && type === ELTYPE.TABLE) {
    if (!isNodeChildrenIsTargetType(children, [ELTYPE.TABLE_ROW])) {
      console.log('isNodeChildrenIsTargetType', entry, children, [ELTYPE.TABLE_ROW]);

      delChildrenNotAllowComponent(editor, children, [ELTYPE.TABLE_ROW], path);
      return true;
    }
    if (!isNodeChildrenIsNotNull(children)) {
      let tRow, tCol;
      const { row, column, hwEach } = node as any;
      if ((row && column) || (hwEach.length && hwEach[0].length)) {
        tRow = row || hwEach.length;
        tCol = column || hwEach[0].length;
        const rows = new Array(tRow).fill({
          type: ELTYPE.TABLE_ROW,
          children: new Array(tCol).fill({ type: ELTYPE.TABLE_CELL, children: [{ type: ELTYPE.PARAGRAPH, children: [{ text: '' }] }] }),
        });
        Transforms.insertNodes(editor, rows, {
          at: path,
        });
      } else {
        Transforms.insertNodes(
          editor,
          {
            type: ELTYPE.TABLE_ROW,
            children: [{ type: ELTYPE.TABLE_CELL, children: [{ type: ELTYPE.PARAGRAPH, children: [{ text: '' }] }] }],
          } as any,
          {
            at: path,
          }
        );
      }

      return true;
    }
  }
  return false;
}

export function normalizeTableRow(editor: Editor, entry: [ELEMENTNODE, number[]]): boolean {
  const [node, path] = entry;

  const { type, children } = node;
  if (Element.isElement(node) && type === ELTYPE.TABLE_ROW) {
    if (!isNodeChildrenIsTargetType(children, [ELTYPE.TABLE_CELL])) {
      delTopElement(editor, path);
      return true;
    }
  }
  return false;
}

export function normalizeTableCell(editor: Editor, entry: [ELEMENTNODE, number[]]): boolean {
  const [node, path] = entry;

  const { type, children } = node;
  if (Element.isElement(node) && type === ELTYPE.TABLE_CELL) {
    const componentsOk = [ELTYPE.CARD, ELTYPE.OLLIST, ELTYPE.ULLIST, ELTYPE.TODO_LIST, ELTYPE.PARAGRAPH, ELTYPE.BLOCK_QUOTE, ...HEADING_TYPES];

    if (!isNodeChildrenIsTargetType(children, [componentsOk])) {
      setPTagChildrenNotAllowComponent(editor, children, componentsOk, path);
      return true;
    }
  }
  return false;
}
