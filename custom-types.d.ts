import { Text, createEditor, Node, Element, Editor, Descendant, BaseEditor } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { HistoryEditor } from '@src/components/slate-packages/slate-history';
import { ELTYPE, HEADING_TYPES } from '@src/components/docs/plugins/config';

export type BlockQuoteElement = {
  type: ELTYPE.BLOCK_QUOTE;
  align?: string;
  children: Descendant[];
};

export type OrderedListElement = {
  type: ELTYPE.OLLIST;
  align?: string;
  children: Descendant[];
};

export type UnorderedListElement = {
  type: ELTYPE.ULLIST;
  align?: string;
  children: Descendant[];
};

export type TodoListElement = {
  type: ELTYPE.TODO_LIST;
  checked: boolean;
  children: Descendant[];
};

export type HeadingElement = {
  type: typeof HEADING_TYPES[number];
  align?: string;
  children: Descendant[];
};

export type InlineImageElement = {
  type: ELTYPE.INLINEIMAGE;
  url: string;
  children: EmptyText[];
};

export type LinkElement = { type: ELTYPE.LINK; url: string; children: Descendant[] };

export type MentionElement = {
  type: ELTYPE.MENTION;
  character: string;
  children: EmptyText[];
};

export type ParagraphElement = {
  type: ELTYPE.PARAGRAPH;
  align?: string;
  children: Descendant[];
};

export type TableElement = { type: ELTYPE.TABLE; row: number; col: number; hwEach: string[][]; children: TableRow[] };

export type TableCellElement = { type: ELTYPE.TABLE_CELL; children: Descendant[] };

export type TableRowElement = { type: ELTYPE.TABLE_ROW; children: TableCell[] };

export type TitleElement = { type: ELTYPE.HEADING_ONE; children: Text[] };

export type VideoElement = { type: ELTYPE.VIDEO; url: string; children: EmptyText[] };

type CustomElement =
  | BlockQuoteElement
  | UnorderedListElement
  | OrderedListElement
  | TodoListElement
  | HeadingElement
  | ImageElement
  | InlineImageElement
  | LinkElement
  | MentionElement
  | ParagraphElement
  | TableElement
  | TableRowElement
  | TableCellElement
  | TitleElement
  | VideoElement;

export type CustomText = {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  text: string;
};

export type EmptyText = {
  text: string;
};

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText | EmptyText;
  }
}
