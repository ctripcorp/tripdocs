import { useEffect, useState } from 'react';
import { Node, Transforms } from '@src/components/slate-packages/slate';
import { ReactEditor } from '../../slate-packages/slate-react';

export const findAndReplace = (highlight: any) => {
  const [highlightRanges, setHightlightRanges] = useState([]);
  const [num, setNum] = useState(0);

  useEffect(() => {
    setHightlightRanges(highlight);
    if (num >= highlight.length && highlight.length !== 0) {
      setNum(highlight.length - 1);
    }
  }, [highlight]);

  const getNum = () => {
    return num;
  };

  const find = (editor: any) => {
    if (highlightRanges.length > 0) {
      let thisNum = 0;
      if (num + 1 < highlightRanges.length) {
        setNum(num + 1);
        thisNum = num + 1;
      } else {
        setNum(0);
        thisNum = 0;
      }
      const value = highlightRanges[thisNum];
      const dom = ReactEditor.toDOMNode(editor, Node.get(editor, [highlightRanges[thisNum].anchor.path[0]]));
      const parentDom = ReactEditor.toDOMNode(editor, Node.parent(editor, [highlightRanges[thisNum].anchor.path[0]])).parentElement.parentElement;
      const height = dom.getBoundingClientRect().top + 70;

      parentDom.scrollTop = height + parentDom.scrollTop - window.innerHeight;
      console.log(value);

      return { anchor: value.anchor, focus: value.focus };
    }
    return null;
  };

  const replace = (editor: any, replace: any) => {
    if (highlightRanges.length > 0) {
      Transforms.delete(editor, {
        at: { anchor: highlightRanges[num].anchor, focus: highlightRanges[num].focus },
      });
      Transforms.insertText(editor, replace, {
        at: { anchor: highlightRanges[num].anchor, focus: highlightRanges[num].anchor },
      });
    }
  };

  const replaceAll = (editor: any, replace: any) => {
    if (highlightRanges.length > 0) {
      for (let i = highlightRanges.length - 1; i >= 0; i--) {
        Transforms.delete(editor, {
          at: { anchor: highlightRanges[i].anchor, focus: highlightRanges[i].focus },
        });
        Transforms.insertText(editor, replace, {
          at: { anchor: highlightRanges[i].anchor, focus: highlightRanges[i].anchor },
        });
      }
    }
  };

  return {
    getNum,
    find,
    replace,
    replaceAll,
  };
};
