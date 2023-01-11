import * as slate from './models/slate';
import * as mdast from './models/mdast';
import { uniqueId } from 'lodash';
import { v4 as anchorId } from 'uuid';
import { createCard } from '../Card';
import { createRandomId, createUUID } from '../../../../utils/randomId';
import { ELTYPE } from '../config';
import { Node } from '../../../slate-packages/slate';
import { createParagraph as createParagraph2 } from '../deserializers/deserialize';

export type Decoration = {
  [key in (mdast.Emphasis | mdast.Strong | mdast.Delete | mdast.InlineCode)['type']]?: true;
};

export function mdastToSlate(node: mdast.Root): slate.Node[] {
  return createSlateRoot(node);
}

function createSlateRoot(root: mdast.Root): slate.Node[] {
  return convertNodes(root.children, {});
}

function convertNodes(nodes: mdast.Content[], deco: Decoration, id?: string, level?: number, ordered?: boolean): slate.Node[] {
  if (nodes.length === 0) {
    return [{ text: '' }];
  }

  return nodes.reduce<slate.Node[]>((acc, node) => {
    const slateNodes = createSlateNode(node, deco, id, level, ordered);
    for (let i = 0; i < slateNodes.length; i++) {
      const el = slateNodes[i];
      el.anchorId = createRandomId();
    }
    acc.push(...slateNodes);

    return acc;
  }, []);
}

function createSlateNode(node: mdast.Content, deco: Decoration, id?: string, level?: number, ordered?: boolean): SlateNode[] {
  switch (node.type) {
    case 'paragraph':
      return [...createParagraph(node, deco)];
    case 'heading':
      return [createHeading(node, deco)];
    case 'thematicBreak':
      return [createThematicBreak(node)];
    case 'blockquote':
      return [createBlockquote(node, deco)];
    case 'list':
      console.log('createList', node);
      return createList(node, deco, id, level);
    case 'listItem':
      node.type = ELTYPE.ULLIST as any;
      return createListItem(node, deco, id, level, ordered);
    case 'table':
      return [createTable(node, deco)];
    case 'tableRow':
      return [createTableRow(node, deco)];
    case 'tableCell':
      return [createTableCell(node, deco)];
    case 'html':
      return [createHtml(node)];
    case 'code':
      return [createCode(node)];
    case 'yaml':
      return [createYaml(node)];
    case 'toml':
      return [createToml(node)];
    case 'definition':
      return [createDefinition(node)];
    case 'footnoteDefinition':
      return [createFootnoteDefinition(node, deco)];
    case 'text':
      return [createText(node.value, deco)];
    case 'emphasis':
    case 'strong':
    case 'delete': {
      let { type, children } = node;
      if (type === 'emphasis') {
        type = 'italic' as any;
      }
      if (type === 'strong') {
        type = 'bold' as any;
      }
      if (type === 'delete') {
        type = 'strikethrough' as any;
      }
      return children.reduce<SlateNode[]>((acc, n) => {
        acc.push(...createSlateNode(n, { ...deco, [type]: true }));
        return acc;
      }, []);
    }
    case 'inlineCode': {
      let { type, value } = node;
      if (type === 'inlineCode') {
        type = 'code' as any;
      }
      return [createText(value, { ...deco, [type]: true })];
    }
    case 'break':
      return [createBreak(node)];
    case 'link':
      const link = createLink(node, deco);

      return Array.isArray(link) ? link : [link];
    case 'image':
      return [createImage(node)];
    case 'linkReference':
      return [createLinkReference(node, deco)];
    case 'imageReference':
      return [createImageReference(node)];
    case 'footnote':
      return [createFootnote(node, deco)];
    case 'footnoteReference':
      return [createFootnoteReference(node)];
    case 'math':
      return [createMath(node)];
    case 'inlineMath':
      return [createInlineMath(node)];
    default:
      const _: never = node;
      break;
  }
  return [];
}

export type Paragraph = ReturnType<typeof createParagraph>;

function createParagraph(node: mdast.Paragraph, deco: Decoration): any | any[] {
  const { type, children } = node;
  if (children.some(it => it.type === 'image')) {
    const nodesArr = [];
    for (let i = 0; i < children.length; i++) {
      let el = children[i];
      let node: SlateNode;
      if (el.type === 'text') {
        node = [
          {
            type: 'paragraph' as any,
            children: createSlateNode(el, deco),
          },
        ];
      } else {
        node = createSlateNode(el, deco);
      }
      nodesArr.push(...node);
    }
    return nodesArr;
  }
  return [
    {
      type,
      children: convertNodes(children, deco),
    },
  ];
}

export type Heading = ReturnType<typeof createHeading>;

function createHeading(node: mdast.Heading, deco: Decoration) {
  const { type, children, depth } = node;
  let numArr = new Array('zero', 'one', 'two', 'three', 'four', 'five', 'six', 'sever', 'eight', 'nine');
  return {
    type: type + '-' + numArr[depth],
    children: convertNodes(children, deco),
  };
}
export type ThematicBreak = ReturnType<typeof createThematicBreak>;

function createThematicBreak(node: mdast.ThematicBreak) {
  return createCard({
    type: 'hr',
    children: [{ text: '' }],
  });
}

export type Blockquote = ReturnType<typeof createBlockquote>;

function createBlockquote(node: mdast.Blockquote, deco: Decoration) {
  const node2 = {
    type: 'block-quote',
    children: convertNodes(node.children, deco),
  };
  for (let i = 0; i < node2.children.length; i++) {
    const el: any = node2.children[i];
    el.type = 'block-quote';
  }
  return node2;
}

export type List = ReturnType<typeof createList>;

function createList(node: mdast.List, deco: Decoration, id?: string, level?: number) {
  const { type, children, ordered, start, spread } = node;
  console.log('createList', children);
  return convertNodes(children, deco, id || createRandomId(), level, ordered);
}

export type ListItem = ReturnType<typeof createListItem>;

export function getNodeString(node: Node & any): string {
  if (node?.type === 'text') {
    return typeof node.value === 'string' ? (node.value as string) : '';
  } else {
    if (Array.isArray(node)) {
      return node.map(getNodeString).join('');
    } else if (Array.isArray(node?.children)) {
      return node.children?.map(getNodeString).join('');
    } else {
      return '';
    }
  }
}

function createListItem(node: mdast.ListItem, deco: Decoration, id?: string, level?: number, ordered?: boolean) {
  const { type, children, checked, spread } = node;
  let newLevel = level || 0;
  const pNode: any = children.shift() || { children: [] };

  if (children.length === 0) {
    return [
      {
        type: ordered ? ELTYPE.OLLIST : ELTYPE.ULLIST,

        children: pNode?.children?.map(it => {
          const node = createSlateNode(it, deco, id, level, ordered);
          return Array.isArray(node) ? node[0] : node;
        }),
        tabLevel: newLevel,
        id: id || createRandomId(),
        elId: createUUID(),
        checked,
        spread,
      },
    ];
  } else {
    return [
      {
        type: ordered ? ELTYPE.OLLIST : ELTYPE.ULLIST,
        children: [{ text: getNodeString(pNode as any) }],
        tabLevel: newLevel,
        id: id || createRandomId(),
        elId: createUUID(),
        checked,
        spread,
      },
      ...convertNodes(children, deco, createRandomId(), newLevel + 1),
    ];
  }
}

export type Table = ReturnType<typeof createTable>;

function createTable(node: mdast.Table, deco: Decoration) {
  const { type, children, align } = node;
  console.log('createTable children', children);
  const tableObject = getTableOptions(children);
  let table = createCard({
    type,

    ...tableObject,

    children: convertNodes(children, deco),
    align,
  });
  table = JSON.parse(JSON.stringify(table).replaceAll('66px', tableObject.hwEach[0][0]));

  return table;
}

function getTableOptions(children: mdast.TableRow[]): { row: number; column: number; hwEach: string[][] } {
  let tableObject = { row: 0, column: 0, hwEach: [] };
  tableObject.row = children.length;
  tableObject.column = children[0].children.length;
  for (let i = 0; i < tableObject.row; i++) {
    tableObject.hwEach.push(new Array(tableObject.column).fill(Math.floor(652 / tableObject.column) + 'px'));
  }
  return tableObject;
}

export type TableRow = ReturnType<typeof createTableRow>;

function createTableRow(node: mdast.TableRow, deco: Decoration) {
  const { type, children } = node;
  return {
    type: 'table-row',
    height: '33px',
    children: convertNodes(children, deco),
  };
}

export type TableCell = ReturnType<typeof createTableCell>;

function createTableCell(node: mdast.TableCell, deco: Decoration) {
  const { type, children } = node;
  return {
    type: 'table-cell',
    key: createRandomId(),
    selectedCell: false,
    width: '66px',
    children: [
      {
        type: 'paragraph',
        children: convertNodes(children, deco),
      },
    ],
  };
}

export type Html = ReturnType<typeof createHtml>;

function createHtml(node: mdast.HTML) {
  const { type, value } = node;
  return {
    type,
    children: [{ text: value }],
  };
}

export type Code = ReturnType<typeof createCode>;

function createCode(node: mdast.Code) {
  const { type, value, lang, meta } = node;
  const dataCardID = encodeURI(anchorId());
  return createCard({
    type: 'code-block',
    'data-codeblock-id': dataCardID,
    children: [{ text: '' }],
    'data-card-value': encodeURI(`{"data": { "mode": "JavaScript", "code": "${encodeURI('\n' + value)}", "id": "${dataCardID}" }}`),
  });
}

export type Yaml = ReturnType<typeof createYaml>;

function createYaml(node: mdast.YAML) {
  const { type, value } = node;
  return {
    type: ELTYPE.BLOCK_QUOTE,
    children: [{ text: value }],
  };
}

export type Toml = ReturnType<typeof createToml>;

function createToml(node: mdast.TOML) {
  const { type, value } = node;
  return {
    type,
    children: [{ text: value }],
  };
}

export type Math = ReturnType<typeof createMath>;

function createMath(node: mdast.Math) {
  const { type, value } = node;
  return {
    type,
    children: [{ text: value }],
  };
}

export type InlineMath = ReturnType<typeof createInlineMath>;

function createInlineMath(node: mdast.InlineMath) {
  const { type, value } = node;
  return {
    type,
    children: [{ text: value }],
  };
}

export type Definition = ReturnType<typeof createDefinition>;

function createDefinition(node: mdast.Definition) {
  const { type, identifier, label, url, title } = node;
  return {
    type,
    identifier,
    label,
    url,
    title,
    children: [{ text: '' }],
  };
}

export type FootnoteDefinition = ReturnType<typeof createFootnoteDefinition>;

function createFootnoteDefinition(node: mdast.FootnoteDefinition, deco: Decoration) {
  const { type, children, identifier, label } = node;
  return {
    type,
    children: convertNodes(children, deco),
    identifier,
    label,
  };
}

export type Text = ReturnType<typeof createText>;

function createText(text: string, deco: Decoration) {
  return {
    ...deco,
    text,
  };
}

export type Break = ReturnType<typeof createBreak>;

function createBreak(node: mdast.Break) {
  return {
    type: node.type,
    children: [{ text: '' }],
  };
}

export type Link = ReturnType<typeof createLink>;

function createLink(node: mdast.Link, deco: Decoration) {
  const { type, children, url, title } = node;
  console.log('createLink', node);
  const link = {
    type: 'edit-link',
    children: convertNodes(children, deco),

    href: url,
    title,
  };
  const child: any[] = link.children;

  if (child.length > 0 && child[0]?.type === ELTYPE.INLINEIMAGE) {
    link.children = [{ text: link.href }];
    return [child[0], link];
  }

  return link;
}

export type Image = ReturnType<typeof createImage>;

function createImage(node: mdast.Image) {
  const { type, url, title, alt } = node;

  return {
    type: ELTYPE.INLINEIMAGE,
    linkSource: url,
    title,
    alt,
    children: [{ text: '' }],
  };
}
export type LinkReference = ReturnType<typeof createLinkReference>;

function createLinkReference(node: mdast.LinkReference, deco: Decoration) {
  const { type, children, referenceType, identifier, label } = node;
  return {
    type,
    children: convertNodes(children, deco),
    referenceType,
    identifier,
    label,
  };
}

export type ImageReference = ReturnType<typeof createImageReference>;

function createImageReference(node: mdast.ImageReference) {
  const { type, alt, referenceType, identifier, label } = node;
  return {
    type,
    alt,
    referenceType,
    identifier,
    label,
    children: [{ text: '' }],
  };
}

export type Footnote = ReturnType<typeof createFootnote>;

function createFootnote(node: mdast.Footnote, deco: Decoration) {
  const { type, children } = node;
  return {
    type,
    children: convertNodes(children, deco),
  };
}

export type FootnoteReference = ReturnType<typeof createFootnoteReference>;

function createFootnoteReference(node: mdast.FootnoteReference) {
  const { type, identifier, label } = node;
  return {
    type,
    identifier,
    label,
    children: [{ text: '' }],
  };
}

export type SlateNode =
  | Paragraph
  | Heading
  | ThematicBreak
  | Blockquote
  | List
  | ListItem
  | Table
  | TableRow
  | TableCell
  | Html
  | Code
  | Yaml
  | Toml
  | Definition
  | FootnoteDefinition
  | Text
  | Break
  | Link
  | Image
  | LinkReference
  | ImageReference
  | Footnote
  | FootnoteReference
  | Math
  | InlineMath;
