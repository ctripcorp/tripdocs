export interface Parent {
  children: Content[];
}

export interface Literal {
  value: string;
}

export interface Root extends Parent {
  type: 'root';
}

export interface Paragraph extends Parent {
  type: 'paragraph';
  children: PhrasingContent[];
}

export interface Heading extends Parent {
  type: 'heading';
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  children: PhrasingContent[];
}

export interface ThematicBreak {
  type: 'thematicBreak';
}

export interface Blockquote extends Parent {
  type: 'blockquote';
  children: BlockContent[];
}

export interface List extends Parent {
  type: 'list';
  ordered?: boolean;
  start?: number;
  spread?: boolean;
  children: ListContent[];
}

export interface ListItem extends Parent {
  type: 'listItem';
  checked?: boolean;
  spread?: boolean;
  children: BlockContent[];
}

export interface Table extends Parent {
  type: 'table';
  align?: AlignType[];
  children: TableContent[];
}

export interface TableRow extends Parent {
  type: 'tableRow';
  children: RowContent[];
}

export interface TableCell extends Parent {
  type: 'tableCell';
  children: PhrasingContent[];
}

export interface HTML extends Literal {
  type: 'html';
}

export interface Code extends Literal {
  type: 'code';
  lang?: string;
  meta?: string;
}

export interface YAML extends Literal {
  type: 'yaml';
}

export interface TOML extends Literal {
  type: 'toml';
}

export interface Definition extends Association, Resource {
  type: 'definition';
}

export interface FootnoteDefinition extends Parent, Association {
  type: 'footnoteDefinition';
  children: BlockContent[];
}

export interface Text extends Literal {
  type: 'text';
}

export interface Emphasis extends Parent {
  type: 'emphasis';
  children: PhrasingContent[];
}

export interface Strong extends Parent {
  type: 'strong';
  children: PhrasingContent[];
}

export interface Delete extends Parent {
  type: 'delete';
  children: PhrasingContent[];
}

export interface InlineCode extends Literal {
  type: 'inlineCode';
}

export interface Break {
  type: 'break';
}

export interface Link extends Parent, Resource {
  type: 'link';
  children: StaticPhrasingContent[];
}

export interface Image extends Resource, Alternative {
  type: 'image';
}

export interface LinkReference extends Parent, Reference {
  type: 'linkReference';
  children: StaticPhrasingContent[];
}

export interface ImageReference extends Reference, Alternative {
  type: 'imageReference';
}

export interface Footnote extends Parent {
  type: 'footnote';
  children: PhrasingContent[];
}

export interface FootnoteReference extends Association {
  type: 'footnoteReference';
}

export interface Math extends Literal {
  type: 'math';
}

export interface InlineMath extends Literal {
  type: 'inlineMath';
}

export interface Resource {
  url: string;
  title?: string;
}

export interface Association {
  identifier: string;
  label?: string;
}

export interface Reference extends Association {
  referenceType: ReferenceType;
}

export interface Alternative {
  alt?: string;
}

export type Content = TopLevelContent | ListContent | TableContent | RowContent | PhrasingContent;

export type TopLevelContent = BlockContent | FrontmatterContent | DefinitionContent;

export type BlockContent = Paragraph | Heading | ThematicBreak | Blockquote | List | Table | HTML | Code | Math;

export type FrontmatterContent = YAML | TOML;

export type DefinitionContent = Definition | FootnoteDefinition;

export type ListContent = ListItem;

export type TableContent = TableRow;

export type RowContent = TableCell;

export type PhrasingContent = StaticPhrasingContent | Link | LinkReference;

export type StaticPhrasingContent =
  | Text
  | Emphasis
  | Strong
  | Delete
  | HTML
  | InlineCode
  | Break
  | Image
  | ImageReference
  | Footnote
  | FootnoteReference
  | InlineMath;

export type AlignType = 'left' | 'right' | 'center' | null;

export type ReferenceType = 'shortcut' | 'collapsed' | 'full';
