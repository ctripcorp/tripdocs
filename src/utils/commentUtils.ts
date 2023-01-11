import { Editor, Node, Path, Point, Range } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { rangeisLine, sliceRangToLine } from './selectionUtils';

interface selectionObj extends Range {
  rangeId: string;
  data?: any;
  jsonRangeId?: any;
}

interface selectionObjSlice extends Range {
  rangeIdList: string[];
  data?: any;
  jsonRangeId?: any;
}

function sliceRangeNoRepeateAtOnePath(editor: ReactEditor, aArr: selectionObj[]): selectionObjSlice[] {
  let newArr: selectionObjSlice[] = [];
  let lineRangeArr: selectionObj[] = [];

  for (let i = 0; i < aArr.length; i++) {
    const snippet = aArr[i];

    const range = { anchor: snippet.anchor, focus: snippet.focus };
    const isLine = rangeisLine(range);

    if (isLine) {
      lineRangeArr.push({
        ...snippet,
        anchor: snippet.anchor,
        focus: snippet.focus,
      });
    } else {
      const ranges = sliceRangToLine(editor, range);
      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        lineRangeArr.push({
          ...snippet,
          anchor: range.anchor,
          focus: range.focus,
        });
      }
    }
  }
  for (let i = 0; i < lineRangeArr.length; i++) {
    const snippet2 = lineRangeArr[i];

    let sliceSnippets: selectionObj[] = [snippet2];

    for (let j = 0; j < lineRangeArr.length; j++) {
      const cutSnippet = lineRangeArr[j];

      if (snippet2.rangeId !== cutSnippet.rangeId) {
        sliceSnippets = sliceSnippets
          .map(tSnippet => {
            return sliceSnippet(tSnippet, cutSnippet);
          })
          .flat();
      }
    }

    for (let o = 0; o < sliceSnippets.length; o++) {
      const newSliceSnippets: selectionObj = sliceSnippets[o];
      let isAdd = false;

      for (let k = 0; k < newArr.length; k++) {
        const old = newArr[k];
        if (Range.equals(old, newSliceSnippets)) {
          if (!old.rangeIdList.includes(newSliceSnippets.rangeId)) {
            old.rangeIdList.push(newSliceSnippets.rangeId);
          }
          isAdd = true;
        }
      }
      if (!isAdd) {
        const commentType = newSliceSnippets?.jsonRangeId?.commentType;
        if (Range.isCollapsed(newSliceSnippets) && !commentType) {
          continue;
        }
        newArr.push({
          ...newSliceSnippets,
          anchor: newSliceSnippets.anchor,
          focus: newSliceSnippets.focus,
          rangeIdList: [newSliceSnippets.rangeId],
        });
      }
    }
  }
  console.log('newArr', newArr);
  return newArr;
}

function sliceSnippet(snippet: selectionObj, cutSnippet: selectionObj): selectionObj[] {
  const newArr: selectionObj[] = [];
  let isStartIn = Range.includes(snippet, cutSnippet.anchor);
  let isEndIn = Range.includes(snippet, cutSnippet.focus);

  if (isStartIn && isEndIn) {
    const p1: selectionObj = {
      ...snippet,
      anchor: snippet.anchor,
      focus: cutSnippet.anchor,
      rangeId: snippet.rangeId,
    };

    const p2: selectionObj = {
      ...snippet,
      anchor: cutSnippet.anchor,
      focus: cutSnippet.focus,
      rangeId: snippet.rangeId,
    };

    const p3: selectionObj = {
      ...snippet,
      anchor: cutSnippet.focus,
      focus: snippet.focus,
      rangeId: snippet.rangeId,
    };
    newArr.push(p1, p2, p3);
  } else if (isStartIn) {
    const p1: selectionObj = {
      ...snippet,
      anchor: snippet.anchor,
      focus: cutSnippet.anchor,
      rangeId: snippet.rangeId,
    };

    const p2: selectionObj = {
      ...snippet,
      anchor: cutSnippet.anchor,
      focus: snippet.focus,
      rangeId: snippet.rangeId,
    };

    newArr.push(p1, p2);
  } else if (isEndIn) {
    const p2: selectionObj = {
      ...snippet,
      anchor: snippet.anchor,
      focus: cutSnippet.focus,
      rangeId: snippet.rangeId,
    };

    const p3: selectionObj = {
      ...snippet,
      anchor: cutSnippet.focus,
      focus: snippet.focus,
      rangeId: snippet.rangeId,
    };

    newArr.push(p2, p3);
  } else {
    newArr.push(snippet);
  }
  return newArr;
}

export { sliceRangeNoRepeateAtOnePath };
export type { selectionObj, selectionObjSlice };
