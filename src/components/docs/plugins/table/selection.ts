import { Editor, Node, NodeEntry, Path, Transforms } from '@src/components/slate-packages/slate';
import { YjsEditor } from '@src/components/slate-packages/slate-yjs';
import { getCache, setCache } from '@src/utils/cacheUtils';
import EventEmitter from '@src/utils/eventEmitter';
import { CACHED_SEL_CELLS, SEL_CELLS } from '@src/utils/weak-maps';
import { HistoryEditor } from '../../../slate-packages/slate-history';
import { ReactEditor } from '../../../slate-packages/slate-react';
import { ELTYPE } from '../config';

export type Col = {
  cell: any;
  path: Path;
  originPath: Path;
  myRowSpan: number;
  myColSpan: number;
  isInsertPosition?: boolean;
};

export const splitedTable: (
  editor: Editor,
  table: NodeEntry,
  startKey?: string | undefined
) => {
  tableDepth?: number;
  gridTable: Col[][];
  getCol: (match?: (node: Col) => boolean) => Col[];
} = (editor, table, startKey) => {
  const tableDepth = table[1].length;

  let cells = [] as { cell: any; path: Path; realPath: Path }[];

  const nodes = Editor.nodes(editor, {
    at: table[1],
    match: (n: any) => n.type === ELTYPE.TABLE_CELL,
  });

  for (const node of nodes) {
    const [cell, path] = node;
    cells.push({
      cell,
      path,
      realPath: [...path],
    });
  }

  const gridTable: Col[][] = [];
  let insertPosition = null;

  for (let i = 0; i < cells.length; i++) {
    const { cell, path, realPath } = cells[i];
    const { rowspan = 1, colspan = 1 } = cell;

    let y = path[tableDepth];
    let x = path[tableDepth + 1];

    if (!gridTable[y]) {
      gridTable[y] = [];
    }

    while (gridTable[y][x]) {
      x++;
    }

    for (let j = 0; j < (rowspan || 1); j++) {
      for (let k = 0; k < (colspan || 1); k++) {
        let _y = y + j;
        let _x = x + k;

        if (!gridTable[_y]) {
          gridTable[_y] = [];
        }
        if (cell.display === 'none') {
          continue;
        }
        gridTable[_y][_x] = {
          cell,
          path: [...realPath.slice(0, tableDepth), _y, _x],
          originPath: path,
          myColSpan: colspan || 1,
          myRowSpan: rowspan || 1,
        };

        if (!insertPosition && cell.key === startKey) {
          insertPosition = gridTable[_y][_x];
          gridTable[_y][_x].isInsertPosition = true;
        }
      }
    }
  }

  const getCol = (match?: (node: Col) => boolean): Col[] => {
    const result: Col[] = [];

    gridTable.forEach(row => {
      row.forEach((col: Col) => {
        if (match && match(col)) {
          result.push(col);
        }
      });
    });

    return result;
  };

  return {
    gridTable,
    tableDepth,
    getCol,
  };
};

function getCoverCell(editor: any, gridTable: any[], getCol: Function, startPath: Path, endPath: Path): any[] {
  if (!getCol || !gridTable) return [];

  let [head] = getCol((n: Col) => Path.equals(Editor.path(editor, n.path), startPath));
  let [tail] = getCol((n: Col) => Path.equals(Editor.path(editor, n.path), endPath));

  if (!tail || !head) return [];

  const { path: tailPath } = tail;
  const { path: headPath } = head;

  const coverCells: Col[] = [];
  let isExpand = false;

  let rowMin = Math.min(headPath[2], tailPath[2]);
  let rowMax = Math.max(headPath[2], tailPath[2]);
  let columnMin = Math.min(headPath[3], tailPath[3]);
  let columnMax = Math.max(headPath[3], tailPath[3]);
  if (head.cell.rowspan * head.cell.colspan > 0) {
    rowMax = Math.max(rowMax, headPath[2] + (head.cell.rowspan || 1) - 1);
    columnMax = Math.max(columnMax, headPath[3] + (head.cell.colspan || 1) - 1);
  }
  if (tail.cell.rowspan * tail.cell.colspan > 0) {
    rowMax = Math.max(rowMax, tailPath[2] + (tail.cell.rowspan || 1) - 1);
    columnMax = Math.max(columnMax, tailPath[3] + (tail.cell.colspan || 1) - 1);
  }

  console.log('[ head, tail, gridTable]', head, tail, gridTable);
  gridTable.forEach((row: Col[]) => {
    row.forEach((col: Col) => {
      const { originPath, path, myColSpan, myRowSpan } = col;
      let isOver = true;

      if (!(rowMin <= path[2] && path[2] <= rowMax)) {
        isOver = false;
      }

      if (!(columnMin <= path[3] && path[3] <= columnMax)) {
        isOver = false;
      }

      if (isOver) {
        const newRowMax = originPath[2] + myRowSpan - 1;
        const newColMax = originPath[3] + myColSpan - 1;
        if (!(rowMin <= originPath[2] && newRowMax <= rowMax)) {
          if (originPath[2] < rowMin) {
            rowMin = originPath[2];
            isExpand = true;
          }
          if (newRowMax > rowMax) {
            rowMax = newRowMax;
            isExpand = true;
          }
        }
        if (!(columnMin <= originPath[3] && newColMax <= columnMax)) {
          if (originPath[3] < columnMin) {
            columnMin = originPath[3];
            isExpand = true;
          } else if (originPath[3] + myColSpan > columnMax) {
            columnMax = newColMax;
            isExpand = true;
          }
        }

        coverCells.push(col);
      }
    });
  });

  if (isExpand) {
    return getCoverCell(editor, gridTable, getCol, [startPath[0], rowMin, columnMin], [endPath[0], rowMax, columnMax]);
  }
  return coverCells;
}

export function addSelection(editor: ReactEditor, table: NodeEntry | null, startPath: Path, endPath: Path, setSelCells: any): any[] {
  if (!table || !table[1]) {
    return [];
  }

  const coveredCells = calcCoveredCells(editor, table, startPath, endPath);

  setSelCells(() => {
    SEL_CELLS.set(editor, coveredCells);
    return coveredCells;
  });

  return coveredCells;
}

const calcCoveredCells = (editor, table, startPath, endPath): any[] => {
  let cells: NodeEntry[] = [];
  const totalCellsGenerator: any = Editor.nodes(editor, {
    at: table[1],
    match: (n: any) => !!n && n.type === ELTYPE.TABLE_CELL,
  });
  const totalCells = [];
  for (const [n, p] of totalCellsGenerator) {
    totalCells.push([n, p]);
  }

  const [startNode]: any = Editor.node(editor, startPath);
  const [endNode]: any = Editor.node(editor, endPath);
  let rowMin = Math.min(startPath[2], endPath[2]);
  let rowMax = Math.max(startPath[2], endPath[2]);
  let colMin = Math.min(startPath[3], endPath[3]);
  let colMax = Math.max(startPath[3], endPath[3], startPath[3] + (startNode.colspan || 1) - 1, endPath[3] + (endNode.colspan || 1) - 1);

  if (startNode.rowspan * startNode.colspan > 0) {
    rowMax = Math.max(rowMax, startPath[2] + (startNode.rowspan || 1) - 1);
    colMax = Math.max(colMax, startPath[3] + (startNode.colspan || 1) - 1);
  }
  if (endNode.rowspan * endNode.colspan > 0) {
    rowMax = Math.max(rowMax, endPath[2] + (endNode.rowspan || 1) - 1);
    colMax = Math.max(colMax, endPath[3] + (endNode.colspan || 1) - 1);
  }

  let collaboratedCellsArr: Array<NodeEntry> = [];

  for (const [cellNode, cellPath] of totalCells) {
    if (rowMin <= cellPath[2] && cellPath[2] <= rowMax && colMin <= cellPath[3] && cellPath[3] <= colMax) {
      if (typeof cellNode.colspan === 'number' && typeof cellNode.rowspan === 'number') {
        collaboratedCellsArr.push([cellNode, cellPath]);
      }
    }
  }

  collaboratedCellsArr.forEach(entry => {
    const [cellNode, cellPath]: any = entry;
    if ((cellNode.colspan as number) * (cellNode.rowspan as number) > 0) {
      colMax = Math.max(colMax, cellPath[3] + (cellNode.colspan as number) - 1);
      rowMax = Math.max(rowMax, cellPath[2] + (cellNode.rowspan as number) - 1);
    } else {
      const [nodeTopLeft, pathTopLeft]: any = findPointLeftTop([cellNode, cellPath], editor);
      colMin = Math.min(colMin, pathTopLeft[3]);
      rowMin = Math.min(rowMin, pathTopLeft[2]);
      colMax = Math.max(colMax, pathTopLeft[3] + (nodeTopLeft.colspan as number) - 1);
      rowMax = Math.max(rowMax, pathTopLeft[2] + (nodeTopLeft.rowspan as number) - 1);
    }
  });
  for (const [cellNode, cellPath] of totalCells) {
    if (rowMin <= cellPath[2] && cellPath[2] <= rowMax && colMin <= cellPath[3] && cellPath[3] <= colMax) {
      if (typeof cellNode.colspan === 'number' && typeof cellNode.rowspan === 'number' && cellNode.colspan * cellNode.rowspan > 0) {
        colMax = Math.max(colMax, cellPath[3] + cellNode.colspan - 1);
        rowMax = Math.max(rowMax, cellPath[2] + cellNode.rowspan - 1);
      } else if (
        typeof cellNode.colspan === 'number' &&
        typeof cellNode.rowspan === 'number' &&
        cellNode.colspan * cellNode.rowspan === 0 &&
        !cellNode.selectedCell
      ) {
        const [nodeTopLeft, pathTopLeft] = findPointLeftTop([cellNode, cellPath], editor);
        colMin = Math.min(colMin, pathTopLeft[3]);
        rowMin = Math.min(rowMin, pathTopLeft[2]);
        colMax = Math.max(colMax, pathTopLeft[3] + ((nodeTopLeft as any).colspan as number) - 1);
        rowMax = Math.max(rowMax, pathTopLeft[2] + ((nodeTopLeft as any).rowspan as number) - 1);
      }
    }
  }

  for (const [cellNode, cellPath] of totalCells) {
    if (rowMin <= cellPath[2] && cellPath[2] <= rowMax && colMin <= cellPath[3] && cellPath[3] <= colMax) {
      cells.push([cellNode as Node, cellPath as Path]);
    }
  }

  return cells;
};

export function findPointLeftTop(entry: NodeEntry, editor: Editor): NodeEntry {
  const [cell, cellPath]: any = entry;
  if (!(typeof cell.colspan === 'number' && typeof cell.rowspan === 'number')) {
    return null;
  }
  let tmpNode: any = cell as Node;
  let tmpPath = cellPath;
  if (cell.colspan === 0 && cell.rowspan !== 0) {
    while (tmpNode && typeof tmpNode.colspan === 'number' && tmpNode.colspan === 0) {
      [tmpNode, tmpPath] = Editor.node(editor, [...tmpPath.slice(0, -1), tmpPath[tmpPath.length - 1] - 1]);
    }
    return [tmpNode, tmpPath];
  }
  if (cell.rowspan === 0 && cell.colspan !== 0) {
    while (tmpNode && typeof tmpNode.rowspan === 'number' && tmpNode.rowspan === 0) {
      [tmpNode, tmpPath] = Editor.node(editor, [...tmpPath.slice(0, -2), tmpPath[tmpPath.length - 2] - 1, tmpPath[tmpPath.length - 1]]);
    }
    return [tmpNode, tmpPath];
  }
  if (cell.rowspan === 0 && cell.colspan === 0) {
    while (tmpNode && typeof tmpNode.colspan === 'number' && tmpNode.colspan === 0) {
      [tmpNode, tmpPath] = Editor.node(editor, [...tmpPath.slice(0, -1), tmpPath[tmpPath.length - 1] - 1]);
    }
    while (tmpNode && typeof tmpNode.rowspan === 'number' && tmpNode.rowspan === 0) {
      [tmpNode, tmpPath] = Editor.node(editor, [...tmpPath.slice(0, -2), tmpPath[tmpPath.length - 2] - 1, tmpPath[tmpPath.length - 1]]);
    }
    return [tmpNode, tmpPath];
  }
}

export function removeSelection(editor: Editor, setSelCells: Function) {
  setSelCells(() => {
    SEL_CELLS.set(editor, []);
    return [];
  });
}

export function getEditorEventEmitter(docId: string): EventEmitter {
  let eventEmitter = getCache(docId, 'EventEmitter');
  if (!eventEmitter) {
    eventEmitter = new EventEmitter(docId);
    setCache(docId, 'EventEmitter', eventEmitter);
  }
  return eventEmitter;
}

export function removeSelectionForAllTables(editor: Editor) {
  getEditorEventEmitter(editor.docId).emit('removeSelection', editor.docId, editor);
}

export function addRemoveSelectionListener(editor: Editor, setSelCells: Function) {
  if (!editor || !setSelCells) return;
  getEditorEventEmitter(editor.docId).on(
    'removeSelection',
    (editor: Editor) => {
      removeSelection(editor, setSelCells);
    },
    0,
    false
  );
}
