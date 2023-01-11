import { ELTYPE, TABBABLE_TYPES } from '@src/components/docs/plugins/config';
import { getParentPathByType, getParentPathByTypes, getRelativePath } from '@src/components/docs/plugins/pluginsUtils/getPathUtils';
import { BaseRange, Editor, Node, Path, Point, Range, Text } from '@src/components/slate-packages/slate';
import { ReactEditor } from '../components/slate-packages/../slate-packages/slate-react';

export const getStart = (editor: ReactEditor, curStartPath?: Path) => {
  let startPath = curStartPath || [1, 0];
  let startNode = Node.has(editor, startPath) && Node.get(editor, startPath);
  while (startNode && !Text.isText(startNode)) {
    startPath = [...startPath, 0];
    startNode = Node.has(editor, startPath) && Node.get(editor, startPath);
  }
  return { startNode, startPath, startPoint: { path: startPath, offset: 0 } };
};

export const bodySelectAll = (editor: ReactEditor) => {
  const lastChildIndex = editor.children.length - 1;
  const lastChild: any = editor.children[lastChildIndex];
  const lastGrandChildren: any = lastChild.children;
  const lastTextLength = lastGrandChildren[lastGrandChildren.length - 1]?.text?.length || 0;
  const { startPoint } = getStart(editor);
  const start = Editor.start(editor, startPoint);
  const end = Editor.end(editor, {
    path: [lastChildIndex, lastGrandChildren.length - 1],
    offset: lastTextLength,
  });
  const range = Editor.range(editor, start, end);
  return range;
};

export const currentCellSelectAll = (editor: ReactEditor, cPath?: Path) => {
  const startPoint = currentCellStartPoint(editor, cPath);
  const endPoint = currentCellEndPoint(editor, cPath);
  if (startPoint && endPoint) {
    return Editor.range(editor, startPoint, endPoint);
  }
};

export const currentCellStartPoint = (editor: ReactEditor, cPath?: Path) => {
  const sel: any = editor.selection;
  const thisCellPath = cPath || getParentPathByType(editor, sel.focus.path, ELTYPE.TABLE_CELL);
  if (thisCellPath) {
    const [cellNode, cellPath]: any = Editor.node(editor, thisCellPath);
    const { startPoint } = getStart(editor, [...cellPath, 0, 0]);

    console.log('cellPath', thisCellPath, startPoint);
    return startPoint;
  }
};

export const currentCellEndPoint = (editor: ReactEditor, cPath?: Path) => {
  const sel: any = editor.selection;
  const thisCellPath = cPath || getParentPathByType(editor, sel.focus.path, ELTYPE.TABLE_CELL);
  if (thisCellPath) {
    const [cellNode, cellPath]: any = Editor.node(editor, thisCellPath);
    const lastChildIndex = cellNode.children.length - 1;
    const lastGrandChildren: any = cellNode.children[cellNode.children.length - 1].children;
    const lastTextLength = lastGrandChildren[lastGrandChildren.length - 1]?.text?.length || 0;
    const end = Editor.end(editor, {
      path: [...cellPath, lastChildIndex, lastGrandChildren.length - 1],
      offset: lastTextLength,
    });
    return end;
  }
};
export const currentLineSelectAll = (editor: ReactEditor): BaseRange => {
  const start = getCurrentLineStart(editor);
  const end = getCurrentLineEnd(editor);
  const range = Editor.range(editor, start, end);
  return range;
};

export const getCurrentLineEnd = (editor: ReactEditor) => {
  const linePath = editor.selection.focus.path.slice(0, -1);
  const [lineNode]: any = Editor.node(editor, linePath);
  const lastTextLength = lineNode.children[lineNode.children.length - 1]?.text?.length || 0;
  const end = Editor.end(editor, {
    path: [...linePath, lineNode.children.length - 1],
    offset: lastTextLength,
  });
  return end;
};

export const getCurrentLineStart = (editor: ReactEditor): Point => {
  let linePath = getParentPathByTypes(editor, editor.selection.focus.path, [...TABBABLE_TYPES]);
  if (linePath?.length === 0) {
    linePath = null;
  }

  const cardPath = getParentPathByType(editor, linePath, ELTYPE.CARD);
  let start = null;
  if (linePath) {
    start = Editor.start(editor, { path: [...linePath, 0], offset: 0 });
  } else if (cardPath) {
    console.log('[getCurrentLineStart] cardPath', cardPath);
    start = { path: [...cardPath, 0, 0], offset: 0 };
  }
  return start;
};

export const getIsTitle = (editor: ReactEditor): boolean => {
  return editor?.selection?.focus?.path[0] === 0 || editor?.selection?.anchor?.path[0] === 0;
};
export const rangeisLine = (range: BaseRange): boolean => {
  const [start, end] = Range.edges(range);

  const isLine =
    start.path.length > end.path.length
      ? Path.equals(end.path, start.path.slice(0, end.path.length))
      : Path.equals(start.path, end.path.slice(0, start.path.length));
  return isLine;
};

export const sliceRangToLine = (editor: ReactEditor, range: BaseRange): BaseRange[] => {
  const [start, end] = Range.edges(range);
  const { path: startPath, offset: startOffset } = start;
  const { path: endPath, offset: endOffset } = end;
  const ranges = [];
  if (rangeisLine(range)) {
    ranges.push(range);
    return ranges;
  }

  const basePath = [];
  for (let i = 0; i < start.path.length; i++) {
    const p1 = startPath[i];
    const p2 = endPath[i];
    if (p1 === p2) {
      basePath.push(p1);
    }
    break;
  }

  const startOffsetPath = startPath.slice(0, basePath.length);

  const endOffsetPath = endPath.slice(0, basePath.length);
  const startIndex = startPath[basePath.length];
  const endIndex = endPath[basePath.length];
  const startBasePath = [...startOffsetPath, startIndex];
  const endBasePath = [...endOffsetPath, endIndex];

  if (Editor.hasPath(editor, startBasePath)) {
    const ranges = [];

    const firstRangeEnd = Editor.end(editor, startBasePath);
    const startRangs = {
      anchor: start,
      focus: firstRangeEnd,
    };
    ranges.push(startRangs);
    const centerNum = endIndex - startIndex;

    if (1 < centerNum) {
      for (let i = 1; i < centerNum; i++) {
        const path = [...basePath, startIndex + i];
        if (Editor.hasPath(editor, path)) {
          const startPoint = Editor.start(editor, path);
          const endPoint = Editor.end(editor, path);
          const range = { anchor: startPoint, focus: endPoint };
          ranges.push(range);
        }
      }
    }
    if (Editor.hasPath(editor, endBasePath)) {
      const lastRangeSatrt = Editor.start(editor, endBasePath);
      const endRangs = {
        anchor: lastRangeSatrt,
        focus: end,
      };
      ranges.push(endRangs);
    }
    return ranges;
  }
  return [range];
};
