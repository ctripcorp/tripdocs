import { Editor, Element, Node, Range, Transforms } from '@src/components/slate-packages/slate';
import { ELTYPE } from '../config';
import { createRandomId } from '../../../../utils/randomId';
import { removeSelection } from './selection';
import { SEL_CELLS } from '@src/utils/weak-maps';

const ROW_MIN_HEIGHT = '33px';

const insertRow = (editor: Editor, selection: any) => {
  const sel = selection;
  const selectedCells = SEL_CELLS.get(editor) || [];
  let cellsPath: any = [];
  for (const [, path] of selectedCells) {
    cellsPath.push(path);
  }

  let maxPos: any;
  if (cellsPath.length !== 0) {
    let row = 0;
    let x = 0;
    let y = 0;
    for (const path of cellsPath) {
      row = path[0];
      if (path[2] > x) {
        x = path[2];
      }
      if (path[3] > y) {
        y = path[3];
      }
    }
    maxPos = [row, 1, x, y];
  } else {
    if (sel.anchor && sel.focus) {
      maxPos = sel.focus.path[2] >= sel.anchor.path[2] ? sel.focus.path : sel.anchor.path;
    } else {
      return;
    }
  }
  const curTablePath = [maxPos[0], 1];
  const curTable: any = Editor.node(editor, curTablePath);
  const curRow = [maxPos[0], 1, maxPos[2]];
  const curRowRowspanNodes = Editor.nodes(editor, {
    at: curRow,
    match: (n: any) => {
      return typeof n.colspan === 'number' && typeof n.rowspan === 'number' && !(n.colspan === 0 && n.rowspan === 0);
    },
  });
  let next;
  let isLastCount = 0;
  while (!(next = curRowRowspanNodes.next()).done) {
    let tempCount = 1;
    const [curNode, curPath] = next.value as any;
    console.log('----[curRow Node]:', curNode, curPath);
    let pointLeftTop = { node: curNode, path: curPath };
    while (pointLeftTop.node.rowspan === 0) {
      const p = [pointLeftTop.path[0], 1, pointLeftTop.path[2] - 1, pointLeftTop.path[3]];
      const [n] = Editor.node(editor, p);
      pointLeftTop = { node: n, path: p };
      ++tempCount;
    }

    if (tempCount === pointLeftTop.node.rowspan) {
      isLastCount += pointLeftTop.node.colspan;
    } else {
      for (let i = 0; i < pointLeftTop.node.colspan; i++) {
        console.log(
          'for',
          { rowspan: (pointLeftTop.node.rowspan as number) + 1 },
          { at: [pointLeftTop.path[0], 1, pointLeftTop.path[2], pointLeftTop.path[3] + i] }
        );
        Transforms.setNodes(editor, JSON.parse(JSON.stringify({ rowspan: (pointLeftTop.node.rowspan as number) + 1 })), {
          at: [pointLeftTop.path[0], 1, pointLeftTop.path[2], pointLeftTop.path[3] + i],
        });
      }
    }
  }

  const selSecond = editor.selection;
  const nodePrev: any = Node.get(editor, [maxPos[0], 1, maxPos[2]]);
  const thisTable: any = Node.get(editor, [maxPos[0], 1]);

  const col = thisTable.children[0].children.length;
  const node = {
    height: nodePrev.height ? nodePrev.height : ROW_MIN_HEIGHT,

    type: ELTYPE.TABLE_ROW,
    children: [] as any,
  };

  const newRowNum = (thisTable.row as number) + 1;
  let newHwEach = [...(thisTable.hwEach as Array<any>)];
  let skip = 0;
  for (let i = 0; i < col; i++) {
    const child = nodePrev.children as Array<any>;
    if (child[i].colspan) {
      skip = child[i].colspan;
    }
    const tmpColspan = typeof child[i].colspan === 'number' ? (child[i].colspan === 1 ? null : child[i].colspan) : null;
    const tmpRowspan =
      typeof child[i].rowspan === 'number' && typeof child[i].colspan === 'number'
        ? Number.parseInt(child[i].rowspan) * Number.parseInt(child[i].colspan) > 0
          ? 1
          : child[i].colspan > 1
          ? 1
          : null
        : null;

    const column: any = {
      type: ELTYPE.TABLE_CELL,
      key: createRandomId(),
      height: child[i].height ? child[i].height : null,
      colspan: tmpColspan,
      rowspan: tmpRowspan,
      children: [
        {
          type: ELTYPE.PARAGRAPH,
          children: [
            {
              text: '',
            },
          ],
        },
      ],
    };
    for (let key in column) {
      if (column[key] === null) {
        delete column[key];
      }
    }

    if (skip === 0) {
      node.children.push(column);
    } else if (isLastCount > 0) {
      isLastCount--;
      skip--;
      node.children.push(column);
    } else {
      skip--;
      node.children.push({ ...column, colspan: child[i].colspan, rowspan: 0 });
    }
  }
  const prevRowNum = maxPos[2];
  const curRowNum = maxPos[2] + 1;
  const prevRowHwEach = [...newHwEach[prevRowNum]];
  newHwEach.splice(curRowNum, 0, prevRowHwEach);

  console.log('finally', node, { at: [maxPos[0], 1, maxPos[2] + 1] }, { hwEach: newHwEach, row: newRowNum }, { at: [maxPos[0], 1] });

  Transforms.setNodes(editor, JSON.parse(JSON.stringify({ hwEach: newHwEach, row: newRowNum })), {
    at: [maxPos[0], 1],
  });
  Transforms.insertNodes(editor, JSON.parse(JSON.stringify(node)), {
    at: [maxPos[0], 1, maxPos[2] + 1],
  });
};

const insertRowReverse = (editor: Editor, selection: any) => {
  const sel = selection;
  const selectedCells = SEL_CELLS.get(editor) || [];

  let cellsPath: any = [];
  for (const [, path] of selectedCells) {
    cellsPath.push(path);
  }

  let minPos: any;
  if (cellsPath.length !== 0) {
    let row = 0;
    let x = Number.MAX_SAFE_INTEGER;
    let y = Number.MAX_SAFE_INTEGER;
    for (const path of cellsPath) {
      row = path[0];
      if (path[2] < x) {
        x = path[2];
      }
      if (path[3] < y) {
        y = path[3];
      }
    }
    minPos = [row, 1, x, y];
  } else {
    if (sel.anchor && sel.focus) {
      minPos = sel.focus.path[2] >= sel.anchor.path[2] ? sel.focus.path : sel.anchor.path;
    } else {
      minPos = sel;
      return;
    }
  }
  const curTablePath = [minPos[0], 1];
  const curTable: any = Editor.node(editor, curTablePath);
  const curRow = [minPos[0], 1, minPos[2]];
  const curRowRowspanNodes = Editor.nodes(editor, {
    at: curRow,
    match: (n: any) => {
      return typeof n.colspan === 'number' && typeof n.rowspan === 'number' && !(n.colspan === 0 && n.rowspan === 0);
    },
  });

  let next;
  let isLastCount = 0;
  while (!(next = curRowRowspanNodes.next()).done) {
    let tempCount = 1;
    const [curNode, curPath] = next.value as any;
    console.log('----[curRow Node]:', curNode, curPath);
    let pointLeftTop = { node: curNode, path: curPath };
    while (pointLeftTop.node.rowspan === 0) {
      const p = [pointLeftTop.path[0], 1, pointLeftTop.path[2] - 1, pointLeftTop.path[3]];
      const [n] = Editor.node(editor, p);
      pointLeftTop = { node: n, path: p };
      ++tempCount;
    }
    console.log('@@@pointLeftTop.node.rowspan', tempCount, pointLeftTop.node.rowspan);
    if (tempCount === 1) {
      isLastCount += pointLeftTop.node.colspan;
    } else {
      for (let i = 0; i < pointLeftTop.node.colspan; i++) {
        console.log(
          'for',
          { rowspan: (pointLeftTop.node.rowspan as number) + 1 },
          { at: [pointLeftTop.path[0], 1, pointLeftTop.path[2], pointLeftTop.path[3] + i] }
        );
        Transforms.setNodes(editor, JSON.parse(JSON.stringify({ rowspan: (pointLeftTop.node.rowspan as number) + 1 })), {
          at: [pointLeftTop.path[0], 1, pointLeftTop.path[2], pointLeftTop.path[3] + i],
        });
      }
    }
  }

  const nodePrev: any = Node.get(editor, [minPos[0], 1, minPos[2]]);
  const thisTable: any = Node.get(editor, [minPos[0], 1]);

  const col = thisTable.children[0].children.length;
  const node = {
    height: nodePrev.height ? nodePrev.height : ROW_MIN_HEIGHT,
    type: ELTYPE.TABLE_ROW,
    children: [] as any,
  };

  const newRowNum = (thisTable.row as number) + 1;
  let newHwEach = [...(thisTable.hwEach as Array<any>)];
  let skip = 0;
  for (let i = 0; i < col; i++) {
    const child = nodePrev.children as Array<any>;
    if (child[i].colspan) {
      skip = child[i].colspan;
    }
    const tmpColspan = typeof child[i].colspan === 'number' ? (child[i].colspan === 1 ? null : child[i].colspan) : null;
    const tmpRowspan =
      typeof child[i].rowspan === 'number' && typeof child[i].colspan === 'number'
        ? Number.parseInt(child[i].rowspan) * Number.parseInt(child[i].colspan) > 0
          ? 1
          : child[i].colspan > 1
          ? 1
          : null
        : null;

    const column: any = {
      type: ELTYPE.TABLE_CELL,
      key: createRandomId(),
      colspan: tmpColspan,
      rowspan: tmpRowspan,
      children: [
        {
          type: ELTYPE.PARAGRAPH,
          children: [
            {
              text: '',
            },
          ],
        },
      ],
    };
    for (let key in column) {
      if (column[key] === null) {
        delete column[key];
      }
    }

    if (skip === 0) {
      node.children.push(column);
    } else if (isLastCount > 0) {
      isLastCount--;
      skip--;
      node.children.push(column);
    } else {
      skip--;
      node.children.push({ ...column, colspan: child[i].colspan, rowspan: 0 });
    }
  }
  const prevRowNum = minPos[2];
  const curRowNum = newHwEach.length <= minPos[2] + 1 ? newHwEach.length - 1 : minPos[2] + 1;
  const curRowHwEach = [...newHwEach[curRowNum]];
  newHwEach.splice(prevRowNum, 0, curRowHwEach);

  console.log('finally', node, { at: [minPos[0], 1, minPos[2] + 1] }, { hwEach: newHwEach, row: newRowNum }, { at: [minPos[0], 1] });
  Transforms.setNodes(editor, JSON.parse(JSON.stringify({ hwEach: newHwEach, row: newRowNum })), {
    at: [minPos[0], 1],
  });
  Transforms.insertNodes(editor, JSON.parse(JSON.stringify(node)), {
    at: [minPos[0], 1, minPos[2]],
  });
};

const deleteRow = (editor: any, selection: any) => {
  if (selection.focus.path.length < 3) {
    return;
  }
  const sel = selection;
  const selectedCells = SEL_CELLS.get(editor) || [];

  let cellsPath: any = [];
  for (const [, path] of selectedCells) {
    cellsPath.push(path);
  }

  let maxPos: any;
  let minPos: any;
  if (cellsPath.length !== 0) {
    let row = 0;
    let x = 0,
      xmin = 9999999;
    let y = 0,
      ymin = 9999999;
    for (const path of cellsPath) {
      row = path[0];
      if (path[2] > x) {
        x = path[2];
      }
      if (path[3] > y) {
        y = path[3];
      }
      if (path[2] < xmin) {
        xmin = path[2];
      }
      if (path[3] < ymin) {
        ymin = path[3];
      }
    }
    maxPos = [row, 1, x, y];
    minPos = [row, 1, xmin, ymin];
  } else {
    if (sel.anchor && sel.focus) {
      maxPos = sel.focus.path[2] >= sel.anchor.path[2] ? sel.focus.path : sel.anchor.path;
      minPos = sel.focus.path[3] <= sel.anchor.path[3] ? sel.focus.path : sel.anchor.path;
    } else {
      return;
    }
  }

  const parentNode: any = Node.get(editor, [maxPos[0], 1]);
  const rows = parentNode.children as Array<any>;
  const row = rows.length;
  console.log(maxPos, minPos);
  if (maxPos[2] === row - 1 && minPos[2] === 0) {
    Transforms.removeNodes(editor, { at: [maxPos[0], 1] });
  } else {
    let index = [...maxPos];
    let newRowNum = parentNode.row as number;
    let newHwEach = [...(parentNode.hwEach as Array<any>)];
    while (index[2] >= minPos[2]) {
      newRowNum -= 1;
      newHwEach.splice(index[2], 1);

      const curRow = [index[0], 1, index[2]];
      const curRowRowspanNodes = Editor.nodes(editor, {
        at: curRow,
        match: (n: any) => {
          return typeof n.colspan === 'number' && typeof n.rowspan === 'number' && !(n.colspan === 0 && n.rowspan === 0);
        },
      });

      let next;
      while (!(next = curRowRowspanNodes.next()).done) {
        let tempCount = 1;
        const [curNode, curPath] = next.value as any;
        console.log('----[curRow Node]:', curNode, curPath);
        let pointLeftTop = { node: curNode, path: curPath };
        while (pointLeftTop.node.rowspan === 0) {
          const p = [pointLeftTop.path[0], 1, pointLeftTop.path[2] - 1, pointLeftTop.path[3]];
          const [n] = Editor.node(editor, p);
          pointLeftTop = { node: n, path: p };
          ++tempCount;
        }

        if (tempCount === 1 && pointLeftTop.node.rowspan !== 1) {
          for (let i = 0; i < pointLeftTop.node.colspan; i++) {
            console.log('[delrow]', pointLeftTop.node);
            Transforms.setNodes(
              editor,
              {
                rowspan: (pointLeftTop.node.rowspan as number) - 1,
              } as Partial<Node>,
              { at: [pointLeftTop.path[0], 1, pointLeftTop.path[2] + 1, pointLeftTop.path[3] + i] }
            );
          }
        } else {
          for (let i = 0; i < pointLeftTop.node.colspan; i++) {
            Transforms.setNodes(
              editor,
              {
                rowspan: (pointLeftTop.node.rowspan as number) - 1,
              } as Partial<Node>,
              { at: [pointLeftTop.path[0], 1, pointLeftTop.path[2], pointLeftTop.path[3] + i] }
            );
          }
        }
      }

      Transforms.removeNodes(editor, { at: curRow });
      index[2] -= 1;
    }
    Transforms.setNodes(editor, { hwEach: newHwEach, row: newRowNum } as Partial<Node>, { at: [index[0], 1] });
  }
};

const insertCol = (editor: any, selection: any) => {
  const sel = selection;

  const selectedCells = SEL_CELLS.get(editor) || [];

  let cellsPath: any = [];
  for (const [, path] of selectedCells) {
    cellsPath.push(path);
  }

  let initialPath: any;

  if (cellsPath.length !== 0) {
    let row = 0;
    let y = 0;
    for (const path of cellsPath) {
      row = path[0];
      if (path[3] > y) {
        y = path[3];
      }
    }
    initialPath = [row, 1, 0, y + 1];
  } else {
    if (sel.anchor && sel.focus) {
      initialPath = [...sel.focus.path];
      initialPath[2] = 0;
      initialPath[3] += 1;
    } else {
      return;
    }
  }
  const parentNode: any = Node.get(editor, [initialPath[0], initialPath[1]]);
  const rows = parentNode.children as Array<any>;
  const row = rows.length;
  let newColNum = (parentNode.column as number) + 1;
  const oldHwEach = [...(parentNode.hwEach as Array<any>)];
  let newHwEach: any[] = [];

  console.log('initialPath] = ', initialPath, 'parentNode] = ', parentNode);
  let pointsLeftTop = [];

  for (let i = 1; i <= row; i++) {
    let isLastCount = 1;

    const [prevNode, prevPath]: any = Editor.node(editor, [initialPath[0], 1, initialPath[2], initialPath[3] - 1]);

    let tmpNode = prevNode;
    let tmpPath = prevPath;

    if (typeof tmpNode.colspan === 'number') {
      while (tmpNode.colspan === 0) {
        [tmpNode, tmpPath] = Editor.node(editor, [...prevPath.slice(0, -1), tmpPath[tmpPath.length - 1] - 1]);
        ++isLastCount;
      }
    }
    let isLast = isLastCount === tmpNode.colspan;
    console.log('{prevNode, isLastCount, tmpNode.colspan}', prevNode, isLastCount, tmpNode.colspan);

    tmpNode = prevNode;
    tmpPath = prevPath;
    let isLastColspan = typeof tmpNode.colspan === 'number' && isLast;
    if (typeof tmpNode.colspan === 'number' && !isLastColspan) {
      while (tmpNode.colspan === 0) {
        console.log('tmpNode]=', tmpNode);
        [tmpNode, tmpPath] = Editor.node(editor, [...prevPath.slice(0, -1), tmpPath[tmpPath.length - 1] - 1]);
      }
    }

    console.log(' [tmpNode, tmpPath] ', tmpNode, tmpPath);

    if (!isLastColspan) {
      if (tmpNode.colspan > 1 && tmpNode.rowspan >= 1) {
        pointsLeftTop.push([tmpNode, tmpPath]);
      }
    }
    const tmpIsNotReal = typeof tmpNode.colspan !== 'undefined' || tmpPath[3] + tmpNode.colspan - 1 > prevPath[3];
    const node: any = {
      type: ELTYPE.TABLE_CELL,
      key: createRandomId(),

      colspan: isLastColspan ? null : tmpIsNotReal ? 0 : null,
      rowspan: isLastColspan ? null : typeof prevNode.rowspan === 'number' ? prevNode.rowspan : null,
      children: [
        {
          type: ELTYPE.PARAGRAPH,
          children: [
            {
              text: '',
            },
          ],
        },
      ],
    };
    for (let key in node) {
      if (node[key] === null) {
        delete node[key];
      }
    }
    let newHwEachCell = [...oldHwEach[i - 1]];
    const prevHw = newHwEachCell[initialPath[3] - 1];
    newHwEachCell.splice(initialPath[3], 0, prevHw);
    newHwEach.push(newHwEachCell);
    Transforms.insertNodes(editor, JSON.parse(JSON.stringify(node)), {
      at: [initialPath[0], 1, initialPath[2], initialPath[3]],
    });
    initialPath[2] = i;
  }
  pointsLeftTop.forEach(([node, path]) => {
    for (let i = 0; i < node.rowspan; i++) {
      Transforms.setNodes(editor, JSON.parse(JSON.stringify({ colspan: (node.colspan as number) + 1 })), {
        at: [path[0], 1, path[2] + i, path[3]],
      });
    }
  });
  Transforms.setNodes(editor, JSON.parse(JSON.stringify({ hwEach: newHwEach, column: newColNum })), { at: [initialPath[0], 1] });
};

const insertColReverse = (editor: any, selection: any) => {
  const sel = selection;

  const selectedCells = SEL_CELLS.get(editor) || [];

  let cellsPath: any = [];
  for (const [, path] of selectedCells) {
    cellsPath.push(path);
  }

  let initialPath: any;

  if (cellsPath.length !== 0) {
    let row = 0;
    let y = Number.MAX_SAFE_INTEGER;
    for (const path of cellsPath) {
      row = path[0];
      if (path[3] < y) {
        y = path[3];
      }
    }
    initialPath = [row, 1, 0, y + 1];
  } else {
    if (sel.anchor && sel.focus) {
      initialPath = [...sel.focus.path];
      initialPath[2] = 0;
      initialPath[3] += 1;
    } else {
      return;
    }
  }
  const parentNode: any = Node.get(editor, [initialPath[0], initialPath[1]]);
  const rows = parentNode.children as Array<any>;
  const row = rows.length;
  let newColNum = (parentNode.column as number) + 1;
  const oldHwEach = [...(parentNode.hwEach as Array<any>)];
  let newHwEach: any[] = [];

  console.log('initialPath] = ', initialPath, 'parentNode] = ', parentNode);
  let pointsLeftTop = [];

  for (let i = 1; i <= row; i++) {
    let isLastCount = 1;

    const [prevNode, prevPath]: any = Editor.node(editor, [
      initialPath[0],
      1,
      initialPath[2],
      initialPath[3] - 2 >= 0 ? initialPath[3] - 2 : initialPath[3] - 1,
    ]);

    let tmpNode = prevNode;
    let tmpPath = prevPath;

    if (typeof tmpNode.colspan === 'number') {
      while (tmpNode.colspan === 0) {
        [tmpNode, tmpPath] = Editor.node(editor, [...prevPath.slice(0, -1), tmpPath[tmpPath.length - 1] - 1]);
        ++isLastCount;
      }
    }
    let isLast = isLastCount === tmpNode.colspan;
    console.log('{prevNode, isLastCount, tmpNode.colspan}', prevNode, isLastCount, tmpNode.colspan);

    tmpNode = prevNode;
    tmpPath = prevPath;
    let isLastColspan = typeof tmpNode.colspan === 'number' && isLast;
    if (typeof tmpNode.colspan === 'number' && !isLastColspan) {
      while (tmpNode.colspan === 0) {
        console.log('tmpNode]=', tmpNode);
        [tmpNode, tmpPath] = Editor.node(editor, [...prevPath.slice(0, -1), tmpPath[tmpPath.length - 1] - 1]);
      }
    }

    let isFirstCol = tmpPath[3] === 0;
    console.log(' [tmpNode, tmpPath] ', tmpNode, tmpPath, isFirstCol);

    if (!isLastColspan && !isFirstCol) {
      if (tmpNode.colspan > 1 && tmpNode.rowspan >= 1) {
        pointsLeftTop.push([tmpNode, tmpPath]);
      }
    }
    const tmpIsNotReal = typeof tmpNode.colspan !== 'undefined' || tmpPath[3] + tmpNode.colspan - 1 > prevPath[3];
    const node: any = {
      type: ELTYPE.TABLE_CELL,
      key: createRandomId(),
      colspan: isFirstCol ? null : isLastColspan ? null : tmpIsNotReal ? 0 : null,
      rowspan: isFirstCol ? null : isLastColspan ? null : prevNode.rowspan ? prevNode.rowspan : null,
      children: [
        {
          type: ELTYPE.PARAGRAPH,
          children: [
            {
              text: '',
            },
          ],
        },
      ],
    };
    for (let key in node) {
      if (node[key] === null) {
        delete node[key];
      }
    }
    let newHwEachCell = [...oldHwEach[i - 1]];
    const curHw = newHwEachCell[initialPath[3] - 1];
    newHwEachCell.splice(initialPath[3], 0, curHw);
    newHwEach.push(newHwEachCell);
    Transforms.insertNodes(editor, JSON.parse(JSON.stringify(node)), {
      at: [initialPath[0], 1, initialPath[2], initialPath[3] - 1],
    });
    initialPath[2] = i;
  }
  pointsLeftTop.forEach(([node, path]) => {
    for (let i = 0; i < node.rowspan; i++) {
      Transforms.setNodes(editor, JSON.parse(JSON.stringify({ colspan: (node.colspan as number) + 1 })), {
        at: [path[0], 1, path[2] + i, path[3]],
      });
    }
  });
  Transforms.setNodes(editor, JSON.parse(JSON.stringify({ hwEach: newHwEach, column: newColNum })), { at: [initialPath[0], 1] });
};

const deleteCol = (editor: any, selection: any) => {
  if (selection.focus.path.length < 4) {
    return;
  }
  const sel = selection;

  const selectedCells = SEL_CELLS.get(editor) || [];

  let cellsPath: any = [];
  for (const [, path] of selectedCells) {
    cellsPath.push(path);
  }

  let left: any;
  let right: any;

  if (cellsPath.length !== 0) {
    let row = 0;
    let y = 0,
      ymin = 9999999;
    for (const path of cellsPath) {
      row = path[0];
      if (path[3] > y) {
        y = path[3];
      }
      if (path[3] < ymin) {
        ymin = path[3];
      }
    }
    left = [row, 1, 0, ymin];
    right = [row, 1, 0, y];
  } else {
    if (sel.anchor && sel.focus) {
      left = [...sel.focus.path];
      left[2] = 0;
      right = [...sel.focus.path];
      right[2] = 0;
    } else {
      return;
    }
  }

  console.log('[left, right]', left, right);
  const parentNode: any = Node.get(editor, [left[0], 1]);
  const rows = parentNode.children as Array<any>;
  const row = rows.length;
  let newColNum = (parentNode.column as number) - 1;
  const oldHwEach = JSON.parse(JSON.stringify(parentNode.hwEach as Array<any>));
  let newHwEach: any[] = [];

  for (let j = right[3]; j >= left[3]; j--) {
    let thisRow = 0;
    let pointsLeftTop = [];

    for (let i = 1; i <= row; i++) {
      oldHwEach[i - 1][j] = null;

      let [curNode, curPath] = Editor.node(editor, [left[0], 1, thisRow, j]);
      console.log('curNode((((', curNode);
      let tmpNode: any = curNode;
      let tmpPath = curPath;
      if (typeof tmpNode.colspan === 'number' && tmpNode.colspan === 0) {
        let no = 0;
        while (tmpNode.colspan === 0) {
          [tmpNode, tmpPath] = Editor.node(editor, [...curPath.slice(0, -1), tmpPath[tmpPath.length - 1] - 1]);
          no++;
        }

        pointsLeftTop.push([tmpNode, tmpPath, no]);
      } else if (typeof tmpNode.colspan === 'number' && tmpNode.colspan > 1) {
        Transforms.setNodes(
          editor,
          {
            colspan: (tmpNode.colspan as number) - 1,
            rowspan: tmpNode.rowspan,
          } as Partial<Node>,
          {
            at: [left[0], 1, thisRow, j + 1],
          }
        );
      }
      console.log('[pointsLeftTop]', pointsLeftTop);
      console.log('-----removeNodes: ', [left[0], 1, thisRow, j]);
      Transforms.removeNodes(editor, { at: [left[0], 1, thisRow, j] });
      thisRow = i;
    }
    pointsLeftTop.forEach(([node, path, no]) => {
      Transforms.setNodes(
        editor,
        {
          colspan: node.colspan - 1,
        } as Partial<Node>,
        { at: path }
      );
    });
  }

  const tempHwEachItem: any[] = [];
  for (let i = 0; i < oldHwEach[0].length; i++) {
    const curHw = oldHwEach[0][i];
    if (!curHw) {
      continue;
    }
    tempHwEachItem.push(curHw);
  }

  if (tempHwEachItem.length === 0) {
    Transforms.removeNodes(editor, { at: [left[0]] });
    return;
  }
  newHwEach.length = row;
  newHwEach.fill(tempHwEachItem);
  Transforms.setNodes(editor, { hwEach: newHwEach, column: newColNum } as Partial<Node>, { at: [left[0], 1] });
};

const deleteTable = (editor: any, selection: any) => {
  const sel = selection;
  if (sel.anchor && sel.focus) {
    if (sel.focus.path.length > 3) {
      Transforms.removeNodes(editor, { at: [sel.focus.path[0]] });
    }
  } else {
    Transforms.removeNodes(editor, { at: [sel[0]] });
  }
};

const mergeCell = (editor: any, selection: any) => {
  const sel = selection;

  const selectedNodes = SEL_CELLS.get(editor);

  let cellsPath: any = [];
  for (const [, path] of selectedNodes) {
    cellsPath.push(path);
  }
  if (cellsPath.length === 0) {
    return;
  }

  let start: any;
  let end: any;

  if (cellsPath.length !== 0) {
    let row = 0;
    let x = 0,
      xmin = 9999999;
    let y = 0,
      ymin = 9999999;
    for (const path of cellsPath) {
      row = path[0];
      if (path[2] > x) {
        x = path[2];
      }
      if (path[3] > y) {
        y = path[3];
      }
      if (path[2] < xmin) {
        xmin = path[2];
      }
      if (path[3] < ymin) {
        ymin = path[3];
      }
    }
    start = { path: [row, 1, xmin, ymin] };
    end = { path: [row, 1, x, y] };
  } else {
    if (sel.anchor && sel.focus) {
      start = Range.start(sel);
      end = Range.end(sel);
    } else {
      return;
    }
  }

  const pointLeftTop = [
    start.path[0],
    1,
    start.path[2] >= end.path[2] ? end.path[2] : start.path[2],
    start.path[3] >= end.path[3] ? end.path[3] : start.path[3],
  ];

  let rowspan: any = Math.abs(start.path[2] - end.path[2]) + 1;
  let colspan: any = Math.abs(start.path[3] - end.path[3]) + 1;
  for (let row = pointLeftTop[2] + rowspan - 1; row >= pointLeftTop[2]; row--) {
    for (let col = pointLeftTop[3] + colspan - 1; col >= pointLeftTop[3]; col--) {
      const thisNode: any = Node.get(editor, [start.path[0], 1, row, col]);
      if (thisNode.colWidth || thisNode.colHeight) {
        const addedArr = unmergeCell(editor, [start.path[0], 1, row, col]);
      }
    }
  }

  const x_len = end.path[3] - start.path[3] + 1;
  const y_len = end.path[2] - start.path[2] + 1;
  let arr = [];
  let contentArr = [];
  for (let i = start.path[2]; i < end.path[2] + 1; i++) {
    let row = [];
    for (let j = start.path[3]; j < end.path[3] + 1; j++) {
      const cellContent: any = (Editor.node(editor, [start.path[0], 1, i, j])[0] as any).children;
      if (!(i === start.path[2] && j === start.path[3]) && !(cellContent.length === 1 && cellContent[0]?.children[0]?.text === '')) {
        contentArr.push(...cellContent);
      }
      row.push({
        rowspan: null,
        colspan: null,
        path: [i, j],
      });
    }
    arr.push(row);
  }

  const tablePath = start.path[0];

  let totalWidth = 0;

  let totalHeight = 0;

  const reg = /([0-9])\w+px/g;

  for (let row = pointLeftTop[2] + rowspan - 1; row >= pointLeftTop[2]; row--) {
    console.log(Node.get(editor, [start.path[0], 1, row]));
    const thisNode = Node.get(editor, [start.path[0], 1, row]);

    for (let col = pointLeftTop[3] + colspan - 1; col >= pointLeftTop[3]; col--) {
      if (row === pointLeftTop[2] + rowspan - 1) {
        const thisNode = Node.get(editor, [start.path[0], 1, row, col]);
        console.log('[thisNode]', thisNode);
      }
      if (row === pointLeftTop[2] && col === pointLeftTop[3]) {
        break;
      }

      Transforms.removeNodes(editor, {
        at: {
          anchor: Editor.start(editor, [start.path[0], 1, row, col]),
          focus: Editor.end(editor, [start.path[0], 1, row, col]),
        },
      });
    }
  }

  for (let i = 0; i < y_len; i++) {
    for (let j = 0; j < x_len; j++) {
      if (i === 0 && j === 0) {
        arr[i][j].rowspan = rowspan;
        arr[i][j].colspan = colspan;
      } else if (i === 0) {
        arr[i][j].rowspan = rowspan;
        arr[i][j].colspan = 0;
      } else if (j === 0) {
        arr[i][j].rowspan = 0;
        arr[i][j].colspan = colspan;
      } else {
        arr[i][j].rowspan = 0;
        arr[i][j].colspan = 0;
      }
      const path = arr[i][j].path;
      i === 0 && j === 0 && console.log('****totalWidth****', totalWidth);
      Transforms.setNodes(
        editor,
        {
          rowspan: arr[i][j].rowspan,
          colspan: arr[i][j].colspan,
        } as Partial<Node>,
        { at: [tablePath, 1, ...path] }
      );
      if (i === 0 && j === 0) {
        Transforms.insertNodes(editor, contentArr, {
          at: Editor.end(editor, [tablePath, 1, ...path]),
        });
      }
    }
  }
};

const unmergeCell = (editor: any, selection: any) => {
  const sel = selection;

  const selectedCells = SEL_CELLS.get(editor) || [];

  let cellsPath: any = [];
  for (const [, path] of selectedCells) {
    cellsPath.push(path);
  }

  let start: any;
  let end: any;
  let thisSelection: any;

  if (cellsPath.length !== 0) {
    let row = 0;
    let x = 0,
      xmin = 9999999;
    let y = 0,
      ymin = 9999999;
    for (const path of cellsPath) {
      row = path[0];
      if (path[2] > x) {
        x = path[2];
      }
      if (path[3] > y) {
        y = path[3];
      }
      if (path[2] < xmin) {
        xmin = path[2];
      }
      if (path[3] < ymin) {
        ymin = path[3];
      }
    }
    start = { path: [row, 1, xmin, ymin, 0, 0], offset: 0 };
    end = { path: [row, 1, x, y, 0, 0], offset: 0 };
    thisSelection = { anchor: start, focus: end };
  } else {
    if (sel.anchor && sel.focus) {
      thisSelection = sel;
    } else {
      return;
    }
  }

  const cells = Editor.nodes(editor, {
    at: thisSelection,
    match: (n: any) =>
      !Editor.isEditor(n) &&
      Element.isElement(n) &&
      (n as any).type === ELTYPE.TABLE_CELL &&
      (typeof (n as any).colspan !== 'undefined' || typeof (n as any).rowspan !== 'undefined'),
  });

  const colCellsArr: any = [...cells];
  console.log('REMOVE COL CELL', colCellsArr);

  for (let [node, path] of colCellsArr) {
    console.log('[TOPLEFT NODE]', node, path);
    for (let i = 0; i < node.rowspan; i++) {
      for (let j = 0; j < node.colspan; j++) {
        console.log('==[span cell]', [path[0], 1, path[2] + i, path[3] + j]);
        let nowPath = [path[0], 1, path[2] + i, path[3] + j];
        Transforms.unsetNodes(editor, ['colspan', 'rowspan'], { at: nowPath });
      }
    }
  }
};

export type TableOps =
  | 'insertRow'
  | 'insertRowReverse'
  | 'insertCol'
  | 'insertColReverse'
  | 'deleteRow'
  | 'deleteCol'
  | 'deleteTable'
  | 'mergeCell'
  | 'unmergeCell';

export const opsTable = (editor: any, ops: TableOps, selection: any) => {
  if (ops === 'insertRow') {
    insertRow(editor, selection);
  } else if (ops === 'insertRowReverse') {
    insertRowReverse(editor, selection);
  } else if (ops === 'insertCol') {
    insertCol(editor, selection);
  } else if (ops === 'insertColReverse') {
    insertColReverse(editor, selection);
  } else if (ops === 'deleteRow') {
    deleteRow(editor, selection);
  } else if (ops === 'deleteCol') {
    deleteCol(editor, selection);
  } else if (ops === 'deleteTable') {
    deleteTable(editor, selection);
  } else if (ops === 'mergeCell') {
    mergeCell(editor, selection);
  } else if (ops === 'unmergeCell') {
    unmergeCell(editor, selection);
  }
};
