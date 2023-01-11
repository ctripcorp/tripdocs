import { f } from '@src/resource/string';

export enum ELTYPE {
  CODE_BLOCK = 'code-block',
  TODO_LIST = 'todo-list',
  IMAGE = 'image',
  INLINEIMAGE = 'inline-image',
  FILE = 'file',
  DESIGN = 'design',
  SANDBOX = 'sandBox',
  VIDEO = 'video',
  MENTION = 'mention',
  BLOCK_QUOTE = 'block-quote',
  PARAGRAPH = 'paragraph',
  HEADING_SIX = 'heading-six',
  HEADING_FIVE = 'heading-five',
  HEADING_FOUR = 'heading-four',
  HEADING_THREE = 'heading-three',
  HEADING_TWO = 'heading-two',
  HEADING_ONE = 'heading-one',
  OLLIST = 'numbered-list',
  ULLIST = 'bulleted-list',
  LINK = 'edit-link',

  TABLE = 'table',
  TABLE_ROW = 'table-row',
  TABLE_CELL = 'table-cell',
  DIVIDE = 'hr',
  CARD = 'card',
  CARD_PRE = 'card-pre',
  CARD_SUF = 'card-suf',
  ALERTS = 'alerts',
  ALERTMESSAGE = 'alertmessage',
  ALERTDESCRIPTION = 'alertdescription',
  EXCALIDRAW = 'excalidraw',
  SLIDES = 'slides',
}

export const TextElmentType = [ELTYPE.ALERTMESSAGE, ELTYPE.ALERTDESCRIPTION, ELTYPE.PARAGRAPH];
export const HEADING_MAP: any = {
  'heading-six': 'H6',
  'heading-five': 'H5',
  'heading-four': 'H4',
  'heading-three': 'H3',
  'heading-two': 'H2',
  'heading-one': 'H1',
};

export const TEXT_TAGS_MAP: any = {
  code: 'CODE',
  underline: 'U',
  bold: 'STRONG',
  italic: 'EM',
  strikethrough: 'DEL',
  backgroundColor: 'SPAN',
  fontColor: 'SPAN',
};

export const LIST_TYPES = [ELTYPE.ULLIST, ELTYPE.OLLIST, ELTYPE.TODO_LIST];
export const OL_UL_LIST_TYPES = [ELTYPE.ULLIST, ELTYPE.OLLIST];

export const HEADING_TYPES = [
  ELTYPE.HEADING_ONE,
  ELTYPE.HEADING_TWO,
  ELTYPE.HEADING_THREE,
  ELTYPE.HEADING_FOUR,
  ELTYPE.HEADING_FIVE,
  ELTYPE.HEADING_SIX,
];
export const slateDefaultValue = [
  {
    type: 'heading-one',
    children: [
      {
        text: '',
      },
    ],
    anchorId: '111',
  },
  {
    type: 'paragraph',
    children: [
      {
        text: '',
      },
    ],
    anchorId: '222',
  },
];

export const TABBABLE_TYPES = [...LIST_TYPES, ...HEADING_TYPES, ELTYPE.BLOCK_QUOTE, ELTYPE.PARAGRAPH, ELTYPE.ALERTMESSAGE, ELTYPE.ALERTDESCRIPTION];

export enum CommentCallbackActionType {
  INSERT = 'insert',
  DELETE = 'delete',
  UPDATE = 'update',
  REPLY = 'reply',
}

export const FORMATS = ['backgroundColor', 'fontColor', 'code', 'underline', 'bold', 'italic', 'fontSizeChange', 'strikethrough'];

export const pageTitleMap = {
  home: '工作台',
  me: '我的空间',
  shared: '共享空间',
  favorites: '收藏夹',
  deleted: '回收站',
};

export const DOCTYPE = {
  NORMAL: 'normal',
  INLINE: 'inline',
};

export const READONLYTYPE = {
  READONLY: 'readonly',
  INLINE_READONLY: 'inline-readonly',
};

export const MENU_ELEMENT_TYPE = [...HEADING_TYPES, ELTYPE.BLOCK_QUOTE, ...LIST_TYPES, ELTYPE.PARAGRAPH];
export const HAS_INLINE_IMG_ELEMENT_TYPE = [...HEADING_TYPES, ELTYPE.BLOCK_QUOTE, ...LIST_TYPES, ELTYPE.PARAGRAPH];

export function isCommendElement(type: ELTYPE) {
  return MENU_ELEMENT_TYPE.includes(type) || !Object.values(ELTYPE).includes(type);
}

export const INLINE_TYPES = [ELTYPE.MENTION, ELTYPE.LINK, ELTYPE.INLINEIMAGE];
export const SINGLE_INLINE_TYPES = [ELTYPE.MENTION, ELTYPE.INLINEIMAGE];
export const inCardEL = [
  ELTYPE.DIVIDE,
  ELTYPE.TABLE,
  ELTYPE.IMAGE,
  ELTYPE.ALERTS,
  ELTYPE.CODE_BLOCK,
  ELTYPE.VIDEO,
  ELTYPE.DESIGN,
  ELTYPE.SANDBOX,
  ELTYPE.FILE,
  ELTYPE.EXCALIDRAW,
];
export const getGlobalCommentRangeId = () =>
  `{"selection":{"anchor":{"path":[0,0],"offset":0},"focus":{"path":[0,0],"offset":0}},"anchorOffset":0,"focusOffset":0,"refContent":"${f(
    'globalComment'
  )}","anchorId":"0"}`;
