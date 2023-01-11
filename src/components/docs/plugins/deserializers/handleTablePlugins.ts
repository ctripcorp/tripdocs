import { Transforms, Editor, Node } from '@src/components/slate-packages/slate';
import { SEL_CELLS } from '@src/utils/weak-maps';
import { ELTYPE } from '../config';
import { opsTable } from '../table/tableOperation';

export const matchTable = frag => {
  let tableCount = 0;
  let emptyTextCount = 0;
  let tableIndexInFragment = -1;
  for (let i = 0; i < frag.length; i++) {
    if (frag[i]?.type === ELTYPE.CARD && frag[i].children?.[1].type === ELTYPE.TABLE) {
      tableCount++;
      tableIndexInFragment = i;
    } else if (Node.string(frag[i]) === '') {
      emptyTextCount++;
    }
  }
  return { match: tableCount === 1 && emptyTextCount === frag.length - 1, tableIndex: tableIndexInFragment };
};

export const pasteTableInTable = (editor, cardNode) => {
  console.log('[pasteTableInTable]');

  const tableNode = cardNode.children[1];
  if (!tableNode) return;
  const trNodes = tableNode.children;
  const targetCellEntry = Editor.above(editor, { at: editor.selection, match: (n: any) => n.type === ELTYPE.TABLE_CELL });
  const targetTableEntry: any = Editor.above(editor, { at: editor.selection, match: (n: any) => n.type === ELTYPE.TABLE });
  const targetPos = { row: targetCellEntry[1][2], col: targetCellEntry[1][3] };
  const subTableContent: any[][] = [];
  trNodes.forEach(row => {
    const tmpArr = [];
    row?.children?.forEach((cell: any) => {
      tmpArr.push({ content: cell.children });
    });
    subTableContent.push(tmpArr);
  });
  console.log('纯 table 组件在 table 中粘贴 targetCellEntry', targetCellEntry, targetTableEntry, subTableContent);
  const { row: tableRow, column: tableCol } = targetTableEntry[0];
  const rowsToAdd = targetPos.row + subTableContent.length - tableRow > 0 ? targetPos.row + subTableContent.length - tableRow : 0;
  const colsToAdd = targetPos.col + subTableContent[0].length - tableCol > 0 ? targetPos.col + subTableContent[0].length - tableCol : 0;

  const selectedCells = SEL_CELLS.get(editor) || [];
  let cellsPath: any = [];
  for (const [, path] of selectedCells) {
    cellsPath.push(path);
  }
  if (cellsPath.length !== 0) {
    let x = -1;
    let y = -1;
    let newArr = [];
    let no = 0;
    for (const path of cellsPath) {
      console.log('[wxj] selectedCells', path);
      let path2 = path[2];
      let path3 = path[3];
      if (x < 0) {
        x = path2;
        newArr[no] = [];
      } else if (path2 != x) {
        x = path2;
        no++;
        newArr[no] = [];
      }
      newArr[no].push(path);
    }
    let row = 0;
    let cell = 0;
    row = subTableContent.length;
    cell = subTableContent[0].length;

    if (newArr.length) {
      newArr.forEach((tr, trIndex) => {
        tr.forEach((td, tdIndex) => {
          let tmpTR = trIndex;
          let tmpTD = tdIndex;
          if (tdIndex > cell - 1) {
            tmpTD = tdIndex % cell;
          } else {
          }

          if (trIndex > row - 1) {
            tmpTR = trIndex % row;
          } else {
          }
          Editor.withoutNormalizing(editor, function () {
            const tdSlateNode: any = Node.get(editor, td);
            const tdChildren = tdSlateNode.children;
            console.log('[wxj]tmpTR, tmpTD ', tmpTR, tmpTD, td);
            for (let i = tdChildren.length - 1; i >= 0; i--) {
              Transforms.removeNodes(editor, { at: [...td, i] });

              console.log('[wxj]removeNodes', [...td, i]);
            }
            Transforms.insertNodes(editor, subTableContent[tmpTR][tmpTD].content, { at: [...td, 0] });
          });
        });
      });
    }
    console.log('[wxj]newArr', newArr);
    console.log('[wxj]subTableContent', subTableContent);
  } else {
    for (let i = 0; i < rowsToAdd; i++) {
      const path = [targetCellEntry[1][0], 1, tableRow + i - 1, 0, 0, 0];
      opsTable(editor, 'insertRow', { anchor: { path, offset: 0 }, focus: { path, offset: 0 } });
    }
    for (let i = 0; i < colsToAdd; i++) {
      const path = [targetCellEntry[1][0], 1, 0, tableCol + i - 1, 0, 0];
      opsTable(editor, 'insertCol', { anchor: { path, offset: 0 }, focus: { path, offset: 0 } });
    }
    console.log('[DIFF]', rowsToAdd, colsToAdd);
    Editor.withoutNormalizing(editor, function () {
      subTableContent.forEach((tr, trIndex) => {
        tr.forEach((td, tdIndex) => {
          const tdPath = [targetCellEntry[1][0], 1, targetPos.row + trIndex, targetPos.col + tdIndex];
          const tdSlateNode: any = Node.get(editor, tdPath);
          const tdChildren = tdSlateNode.children;

          for (let i = tdChildren.length - 1; i >= 0; i--) {
            console.log('nodePath', [...tdPath, i], tdSlateNode, tdChildren, td.content);
            Transforms.removeNodes(editor, { at: [...tdPath, i] });
          }
          Transforms.insertNodes(editor, td.content, { at: [...tdPath, 0] });
          console.log('nodePath insertNodes', [...tdPath, 0]);
        });
      });
      Transforms.select(editor, [...targetCellEntry[1], 0, 0]);
    });
  }
};
