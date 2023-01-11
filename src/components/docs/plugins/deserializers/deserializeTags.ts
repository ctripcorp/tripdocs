import { Node } from '@src/components/slate-packages/slate';
import { createUUID } from '@src/utils/randomId';
import storage from '@src/utils/storage';
import { ELTYPE } from '../config';

export interface RenderHTMLProps {
  el: any;
  children: any;
  fragId: any;
}

const getAlign = (el: any) => {
  const ret = el.getAttribute('data-align') || el.style.textAlign || '';

  return ret;
};

const getLiAlign = (el: any) => {
  let ret = '';
  if (el?.classList && Array.from(el.classList).includes('align-center')) {
    ret = 'center';
  }
  if (el?.classList && Array.from(el.classList).includes('align-right')) {
    ret = 'right';
  }
  return ret;
};

const getLineHeight = (el: any) => {
  const ret = el.getAttribute('data-line-height') || el.style.lineHeight || '';
  return ret;
};

const hasTabLevel = (el: any) => {
  return el.getAttribute('data-tab-level');
};

const getTabLevel = (el: any) => {
  return hasTabLevel(el) ? Number.parseInt(el.getAttribute('data-tab-level')) : 0;
};

const employee = storage.get('userInfo')?.employee;

const string = (node: any): string => {
  if (node.text && node.text.length > 0) {
    return node.text;
  } else if (node.children && node.children.length > 0) {
    return node.children.map(string).join('');
  } else if (Array.isArray(node)) {
    return node.map(string).join('');
  } else if (typeof node === 'string') {
    return node;
  } else {
    return '';
  }
};

export const ELEMENT_TAGS: any = {
  A: ({ el, children }: RenderHTMLProps) => ({
    type: ELTYPE.LINK,
    href: el.getAttribute('href') || '',
    children: [{ text: (children && string(children)) || el.getAttribute('href') || '' }],
  }),
  BLOCKQUOTE: ({ el }: RenderHTMLProps) => ({
    type: ELTYPE.BLOCK_QUOTE,
    tabLevel: getTabLevel(el),
  }),
  H1: ({ el }: RenderHTMLProps) => ({
    type: ELTYPE.HEADING_ONE,
    tabLevel: getTabLevel(el),
    align: getAlign(el),
    lineHeight: getLineHeight(el),
  }),
  H2: ({ el }: RenderHTMLProps) => ({
    type: ELTYPE.HEADING_TWO,
    tabLevel: getTabLevel(el),
    align: getAlign(el),
    lineHeight: getLineHeight(el),
  }),
  H3: ({ el }: RenderHTMLProps) => ({
    type: ELTYPE.HEADING_THREE,
    tabLevel: getTabLevel(el),
    align: getAlign(el),
    lineHeight: getLineHeight(el),
  }),
  H4: ({ el }: RenderHTMLProps) => ({
    type: ELTYPE.HEADING_FOUR,
    tabLevel: getTabLevel(el),
    align: getAlign(el),
    lineHeight: getLineHeight(el),
  }),
  H5: ({ el }: RenderHTMLProps) => ({
    type: ELTYPE.HEADING_FIVE,
    tabLevel: getTabLevel(el),
    align: getAlign(el),
    lineHeight: getLineHeight(el),
  }),
  H6: ({ el }: RenderHTMLProps) => ({
    type: ELTYPE.HEADING_SIX,
    tabLevel: getTabLevel(el),
    align: getAlign(el),
    lineHeight: getLineHeight(el),
  }),
  H7: ({ el }: RenderHTMLProps) => ({
    type: ELTYPE.HEADING_SIX,
    tabLevel: getTabLevel(el),
    align: getAlign(el),
    lineHeight: getLineHeight(el),
  }),

  LI: ({ el, fragId }: RenderHTMLProps) => {
    const parent = el.parentNode;
    const parentNodeName = parent.nodeName;
    console.log('LI!!!!', el, fragId, parent);
    const elName = el.getAttribute('data-li-name') || '';
    const tabLevel = getTabLevel(el);
    const listId: string = el.getAttribute('data-list-id') || '';
    const oldtype = el.getAttribute('data-oldtype') || '';

    const listType = ['todo-list-item', 'todo-list-item-done'].includes(elName)
      ? ELTYPE.TODO_LIST
      : parentNodeName === 'OL'
      ? ELTYPE.OLLIST
      : parentNodeName === 'UL'
      ? ELTYPE.ULLIST
      : 'null';

    switch (listType) {
      case ELTYPE.TODO_LIST:
        console.log(el);
        if (elName === 'todo-list-item-done') {
          return {
            oldType: oldtype,
            type: ELTYPE.TODO_LIST,
            todoChecked: true,
            tabLevel,
            align: getLiAlign(el),
          };
        }
        return { type: ELTYPE.TODO_LIST, tabLevel, align: getLiAlign(el) };

      case ELTYPE.OLLIST:
        const remainingStr = (str: string) => str.replace(/^null/, '');
        const getRandomId = () => 'numbered-list=' + fragId + '_';
        return {
          oldType: oldtype,
          type: ELTYPE.OLLIST,
          tabLevel,
          num: parseInt(el.getAttribute('data-start')) || 1,

          id: getRandomId() + remainingStr(listId),
          authCls: 'auth-' + employee,
          elId: createUUID(),
        };

      case ELTYPE.ULLIST:
        return {
          oldType: el.getAttribute('data-oldtype') || '',
          type: ELTYPE.ULLIST,
          tabLevel,
          num: 1,
          authCls: 'auth-' + employee,
          elId: createUUID(),
          align: getLiAlign(el),
        };
      default:
        break;
    }
  },
  P: ({ el }: RenderHTMLProps) => {
    const tabLevel = getTabLevel(el);

    return {
      type: ELTYPE.PARAGRAPH,
      tabLevel,
      align: getAlign(el),
      lineHeight: getLineHeight(el),
    };
  },
  PRE: ({ el }: RenderHTMLProps) => {
    console.log(el);
    return { type: ELTYPE.CODE_BLOCK };
  },
  HR: () => ({
    type: ELTYPE.CARD,
    children: [
      {
        type: ELTYPE.CARD_PRE,
        children: [{ text: '' }],
      },
      { type: ELTYPE.DIVIDE, children: [{ text: '' }] },
      {
        type: ELTYPE.CARD_SUF,
        children: [{ text: '' }],
      },
    ],
  }),

  IMG: ({ el }) => ({ type: ELTYPE.INLINEIMAGE, linkSource: el.getAttribute('src') }),
  'V:IMAGEDATA': ({ el }) => ({ type: ELTYPE.INLINEIMAGE, linkSource: el.getAttribute('src') }),
};

export const TEXT_TAGS: any = {
  CODE: el => getColor(el, { code: true }),
  DEL: el => getColor(el, { strikethrough: true }),
  INS: el => getColor(el, { underline: true }),
  EM: el => getColor(el, { italic: true }),
  I: el => getColor(el, { italic: true }),
  S: el => getColor(el, { strikethrough: true }),
  STRONG: el => getColor(el, { bold: true }),
  B: el => getColor(el, { bold: true }),
  U: el => getColor(el, { underline: true }),
};

function getColor(el, attr: any) {
  const style = el.getAttribute('style');
  if (style && style.backgroundColor) {
    attr.backgroundColor = style.backgroundColor;
  }
  if (style && style.fontColor) {
    attr.fontColor = style.fontColor;
  }
  return attr;
}
