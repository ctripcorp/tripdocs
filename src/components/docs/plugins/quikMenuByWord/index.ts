import { Editor, Path, Range } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';

function quikMenuByWordSearch(editor: ReactEditor, selection: Range, callBack: Function) {
  const [start] = Range.edges(selection);
  const wordBefore = Editor.before(editor, start, { unit: 'word' });
  const before = wordBefore && Editor.before(editor, wordBefore);
  const beforeRange = before && Editor.range(editor, before, start);
  const beforeText = beforeRange && Editor.string(editor, beforeRange);
  const beforeMatch = beforeText && beforeText.match(/@([\u4e00-\u9fa5\w ]*)/);
  const beforeMatchEmpty = beforeText && beforeText.match(/@$/);

  if (beforeMatch && beforeMatch[1] !== undefined && beforeMatch[1].indexOf(' ') === -1) {
    const after = Editor.after(editor, start);
    const afterRange = Editor.range(editor, start, after);
    const afterText = Editor.string(editor, afterRange);
    const afterMatch = afterText.match(/^(\s|$)/);
    const isTarget = beforeText === '@';

    if (
      (beforeMatch || beforeMatchEmpty || isTarget) &&
      afterMatch &&
      beforeRange.focus.offset !== 0 &&
      Path.isCommon(beforeRange.focus.path, selection.anchor.path)
    ) {
      if (beforeMatchEmpty || isTarget) {
        beforeRange.anchor = JSON.parse(JSON.stringify(beforeRange.focus));
        beforeRange.anchor.offset = beforeRange.anchor.offset - 1;
      }
      const mSearch = (beforeMatch && beforeMatch[1]) || '';
      console.log('--------------------------', mSearch);
      callBack && callBack('@', beforeRange, mSearch);

      return true;
    }
  }
}
function quikMenuByWord(reg = '\\\\$') {
  return (editor: ReactEditor, selection: Range, callBack: Function) => {
    const [start] = Range.edges(selection);

    const before = start && Editor.before(editor, start);
    const beforeRange = before && Editor.range(editor, before, start);
    const beforeText = beforeRange && Editor.string(editor, beforeRange);
    const beforeMatchEmoji = beforeText && beforeText.match(new RegExp(reg));
    if (beforeMatchEmoji) {
      const after = Editor.after(editor, start);
      const afterRange = Editor.range(editor, start, after);
      const afterText = Editor.string(editor, afterRange);
      const afterMatch = afterText.match(/^(\s|$)/);
      const isTarget = beforeText === '\\';
      if (
        (beforeMatchEmoji || isTarget) &&
        afterMatch &&
        beforeRange.focus.offset !== 0 &&
        Path.isCommon(beforeRange.focus.path, selection.anchor.path)
      ) {
        callBack && callBack(reg, beforeRange);
        return true;
      }
    }
  };
}
function funArrExec(fns: Function[], ...arg) {
  return fns.some(fn => fn(...arg));
}
export { quikMenuByWordSearch, quikMenuByWord, funArrExec };
