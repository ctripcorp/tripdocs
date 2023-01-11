import { Element, Transforms, Node, Editor, Text } from '@src/components/slate-packages/slate';
import { getCache } from '@src/utils/cacheUtils';
import { normalizeBlockQuote } from './BlockQuote/normalizeBlockQuote';
import { normalizeCard } from './Card/normalizeCard';
import { normalizeCodeBlock } from './CodeBlock/normalizeCodeBlock';
import { ELTYPE, inCardEL, INLINE_TYPES } from './config';
import { normalizeDivide } from './Divide/normalizeDivide';
import { normalizeLink } from './EditLink/normalizeLink';
import { normalizeExcalidraw } from './Excalidraw';
import { normalizeFile } from './File/normalizeFile';
import { normalizeImage } from './Image/normalizeImage';
import { normalizeInlineImage } from './InlineImage/normalizeInlineImage';
import { normalizeMetion } from './Mention/normalizeMetion';
import { normalizeHeadings } from './normalizeHeadings';
import { normalizeParagraph } from './normalizeParagraph';
import { normalizeOLULList } from './OLULList/normalizeOLULList';
import { normalizeTable, normalizeTableCell, normalizeTableRow } from './table/normalizeTable';
import { normalizeTodoList } from './TodoList/normalizeTodoList';
import { normalizeVideo } from './Video/normalizeVideo';
import { message } from 'antd';

export function normMsg() {}

export const withNormalizeNode = (editor: any) => {
  const { normalizeNode, insertData } = editor;
  const inlineNodeTypeArr = [
    ELTYPE.MENTION,
    ELTYPE.PARAGRAPH,
    ELTYPE.HEADING_SIX,
    ELTYPE.HEADING_FIVE,
    ELTYPE.HEADING_FOUR,
    ELTYPE.HEADING_THREE,
    ELTYPE.HEADING_TWO,
    ELTYPE.HEADING_ONE,
    ELTYPE.LINK,
  ];
  editor.insertData = data => {
    insertData(data);
  };
  editor.normalizeNode = (entry: any) => {
    const [node, path] = entry;
    if (!node || !path) {
      return;
    }
    if (getCache(editor.docId, 'options').isMdEditor) {
      return;
    }

    if (path?.length === 0) {
      const { children } = node;
      if (!!children && children?.length !== 0) {
        for (let i = 0; i < children.length; i++) {
          const child: any = children[i];
          if (!child.type || !!child.text) {
            Transforms.removeNodes(editor, { at: [i] });
            normMsg();
            return;
          }
        }
      }
    }

    if (typeof node.text === 'string' && Array.isArray(node.children)) {
      const newChildren = node.children;
      const newText = node.text;
      Transforms.insertNodes(editor, [{ text: newText }], { at: path });
      const next: number[] = [...path.slice(0, -1), path[path.length - 1] + 1];
      normMsg();
      Transforms.removeNodes(editor, { at: next });
    }

    if (Element.isElement(node)) {
      if (normalizeLink(editor, entry)) {
        return;
      }

      if (Element.isElement(node) && (node as any).type === 'inlineImage') {
        Transforms.setNodes(editor, { type: ELTYPE.INLINEIMAGE } as Partial<Node>, { at: path });
        return;
      } else if (Array.isArray(node.children) && node.children.length === 0 && [...inCardEL, ...INLINE_TYPES].includes((node as any).type)) {
        console.log('[normalizeNode] 孩子节点为空数组的结构，直接干掉', node, path[0]);
        Transforms.delete(editor, { at: path });
        normMsg();
      }

      if (normalizeTable(editor, entry)) {
        console.log('normalizeTable');
        normMsg();
        return;
      }

      if (normalizeTableCell(editor, entry)) {
        normMsg();
        console.log('normalizeTableCell');
        return;
      }
      if (normalizeExcalidraw(editor, entry)) {
        normMsg();
        return;
      }
      if (normalizeDivide(editor, entry)) {
        normMsg();
        return;
      }
      if (normalizeCodeBlock(editor, entry)) {
        normMsg();
        return;
      }
      if (normalizeTodoList(editor, entry)) {
        normMsg();
        return;
      }
      if (normalizeFile(editor, entry)) {
        normMsg();
        return;
      }
      if (normalizeImage(editor, entry)) {
        normMsg();
        return;
      }
      if (normalizeInlineImage(editor, entry)) {
        normMsg();
        return;
      }
      if (normalizeVideo(editor, entry)) {
        normMsg();
        return;
      }
      if (normalizeMetion(editor, entry)) {
        normMsg();
        return;
      }
      if (normalizeBlockQuote(editor, entry)) {
        normMsg();
        return;
      }
      if (normalizeHeadings(editor, entry)) {
        normMsg();
        return;
      }
      if (normalizeOLULList(editor, entry)) {
        normMsg();
        return;
      }
      if (normalizeCard(editor, entry)) {
        normMsg();
        console.log('normalizeCard');
        return;
      }
      if (normalizeParagraph(editor, entry)) {
        return;
      }
    } else {
      if (!node.children) {
        if (!node.text) {
          if (node.code) {
            console.log('--------------------------');
            Transforms.setNodes(editor, { code: undefined } as any, { at: path });
          }
        } else if (!!(node as any).type) {
          console.log('[normalizeNode] 单独的文本节点，直接干掉', node, path[0]);
          normMsg();
          Transforms.delete(editor, { at: path });
        }
      }
    }

    normalizeNode(entry);
  };

  return editor;
};
