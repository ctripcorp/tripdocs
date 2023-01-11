import classNames from 'classnames';
import React, { useState } from 'react';
import { CustomTypes, Editor, Element, ExtendedType, Node, Path, Point, Transforms } from '@src/components/slate-packages/slate';
import { convertTabLevel } from '../../../../utils/convertTabLevel';
import storage from '../../../../utils/storage';
import { Range } from '../../../slate-packages/slate';
import { ReactEditor, useSlate } from '../../../slate-packages/slate-react';
import { ELTYPE, LIST_TYPES } from './../config';
import './OlList.less';
import { createRandomId, createUUID } from '../../../../utils/randomId';
import { css, cx } from '@emotion/css';
import { SEL_CELLS } from '@src/utils/weak-maps';

interface OlListProps {
  className?: string;
  children: any;
  prop: {
    attributes: any;
    element: ElementOpt;
  };
  elementUniqueId?: string;
  textAlign?: string;
  isInAnchor: boolean;
  lineHeight: number;
}

export interface ElementOpt extends Partial<Element> {
  authCls: string;
  num: number;
  liType?: string;
  tabLevel: number;
  id: string;
  type: string;
  elId: string;
  oldType?: string;
}

function getPath12FromSelection(anchor: { path: any[] }, focus: { path: any[] }) {
  let path1, path2: any;
  if (anchor.path.length > 4) {
    const tmp1 = anchor.path.slice(0, -1),
      tmp2 = focus.path.slice(0, -1);
    if (tmp1[tmp1.length - 1] > tmp2[tmp2.length - 1]) {
      path1 = tmp1;
      path2 = tmp2;
    } else {
      path1 = tmp2;
      path2 = tmp1;
    }
  } else {
    if (anchor.path[0] > focus.path[0]) {
      path1 = [anchor.path[0]];
      path2 = [focus.path[0]];
    } else {
      path1 = [focus.path[0]];
      path2 = [anchor.path[0]];
    }
  }

  const count = path1[path1.length - 1] - path2[path2.length - 1];
  return { path1, path2, count };
}
const typeArr = [ELTYPE.HEADING_ONE, ELTYPE.HEADING_TWO, ELTYPE.HEADING_THREE, ELTYPE.HEADING_FOUR, ELTYPE.HEADING_FIVE, ELTYPE.HEADING_SIX];

const updateToOl = (editor: any, opt: ElementOpt, options?: any) => {
  if ([ELTYPE.IMAGE, ELTYPE.VIDEO].includes(opt.type)) {
    console.log('updateToOl***********', opt);
  }
  if (!opt.elId) {
    opt.elId = createUUID();
  }
  if (editor.selection) {
    const { anchor, focus } = editor.selection;

    if (Range.isExpanded(editor.selection)) {
      const { path1, path2, count } = getPath12FromSelection(anchor, focus);

      for (let i = 0; i < count + 1; i++) {
        const newOpt: ExtendedType<'Element', any> = Object.assign({}, opt, {
          elId: opt.elId + i,
          num: i + 1,
        });
        const node: any = Node.get(editor, [...path2.slice(0, -1), path2[path2.length - 1] + i]);
        console.log('*****updateToOl node*****', node, [...path2.slice(0, -1), path2[path2.length - 1] + i]);
        if (ELTYPE.CARD === node.type) {
          const cardChildPath = [...path2.slice(0, -1), path2[path2.length - 1] + i, 1];
          const rowNode: any = Node.get(editor, cardChildPath);
          console.log('******updateToOl rowNode******', rowNode, cardChildPath);
          if (ELTYPE.TABLE === rowNode.type) {
            let [start, end] = Range.edges(editor.selection);
            console.log(' start, end', start, end);
            const selectedCells = SEL_CELLS.get(editor);

            const list = [];

            for (const [, path] of selectedCells) {
              for (const [childNode, childPath] of Node.children(editor, path)) {
                list.push(childNode);
              }
            }
            const allList = list.every(x => x.type === newOpt.type);

            console.log('list', allList, list, selectedCells);
            for (const [, path] of selectedCells) {
              const newLId: string = createRandomId();
              let numAdd = 0;

              for (const [childNode, childPath] of Node.children(editor, path)) {
                console.log('path', childPath);

                if (typeArr.includes((childNode as any)?.type as string)) {
                  newOpt['oldType'] = (childNode as any).type;
                }
                Transforms.setNodes(
                  editor,
                  {
                    ...newOpt,
                    type: allList ? ELTYPE.PARAGRAPH : newOpt.type,
                    id: newLId,
                    num: (newOpt.num as number) + numAdd,
                    elId: newLId + numAdd,
                  },
                  {
                    at: childPath,
                    match: node => Editor.isBlock(editor, node),
                  }
                );
                numAdd = numAdd + 1;
              }
            }
          } else {
            const CardType = [ELTYPE.ALERTS];
            if (CardType.includes(rowNode.type)) {
              const list = [];

              for (const [childNode, childPath] of Node.children(editor, cardChildPath)) {
                if (Range.includes(editor.selection, childPath)) {
                  list.push(childNode);
                }
              }

              const allList = list.every(x => x.type === newOpt.type);
              console.log('******updateToOl rowNode 22222******', rowNode, cardChildPath, list, allList);
              const newLId: string = createRandomId();
              let numAdd = 0;
              for (const [childNode, childPath] of Node.children(editor, cardChildPath)) {
                console.log('path', childNode, list);

                if (Range.includes(editor.selection, childPath)) {
                  Transforms.setNodes(
                    editor,
                    {
                      ...newOpt,
                      type: allList ? ELTYPE.PARAGRAPH : newOpt.type,
                      id: newLId,
                      num: (newOpt.num as number) + numAdd,
                      elId: newLId + numAdd,
                    },
                    {
                      at: childPath,
                      match: node => Editor.isBlock(editor, node),
                    }
                  );
                  numAdd = numAdd + 1;
                }
              }
            }
          }
          continue;
        } else {
          if (typeArr.includes(node.type)) {
            newOpt['oldType'] = node.type;
          }
          Transforms.setNodes(editor, newOpt, {
            at: [...path2.slice(0, -1), path2[path2.length - 1] + i],
            match: node => Editor.isBlock(editor, node),
          });
        }
      }

      return;
    }
  }
  if (options?.isCopyList) {
    Transforms.insertNodes(editor, opt as any, options);
    return;
  }
  if (options) {
    Transforms.setNodes(editor, opt as Partial<Element>, options);
    return;
  }

  Transforms.setNodes(editor, opt as Partial<Element>);
};

export const insertOl = (editor: any, opts: ElementOpt | string | any[], options: any = {}) => {
  let opt: any;
  if (options?.isCopyList) {
    opt = opts[0];
  } else {
    opt = opts;
  }
  if (typeof opt !== 'string') {
    const sel = options.at || editor.selection;
    const [start, end] = [Range.start(sel), Range.end(sel)];

    let newPath = [end.path[0] + 1];
    if (editor.children.length == newPath[0]) {
      newPath = [newPath[0] - 1];
    }
    const endNode: any = Node.get(editor, newPath);
    const lastNode: any = Node.get(editor, [options?.isCopyList ? sel.focus.path[0] : sel.focus.path[0] - 1]);
    if (!lastNode || !endNode) return;
    let id = (opt?.id as string) || (lastNode?.id as string);
    const format: string = LIST_TYPES.includes(opt.type) ? opt.type : (lastNode.type as string);

    if (lastNode.type === format) {
      id = lastNode.id as string;
    }
    if (id === opt.id && endNode.type === format) {
      id = endNode.id as string;
    }
    if (id === opt.id) {
      const startArr = (editor.children as Array<any>).slice(0, start.path[0]);
      const endArr = (editor.children as Array<any>).slice(newPath[0]);
      let startNode: any, endNode: any;
      for (let i = 0; i < startArr.length; i++) {
        const el = startArr[i];
        if (el && opt && el.type === opt.type) {
          startNode = el;
          break;
        }
      }
      for (let i = 0; i < endArr.length; i++) {
        const el = endArr[i];
        if (el && opt && el.type === opt.type) {
          endNode = el;
          break;
        }
      }
      if (endNode && startNode && endNode.id === startNode.id) {
        console.log('******no no no*****');
        id = startNode.id;
      }
    }

    opt.id = id;
    opt.type = format;
    opt.elId = createUUID();
    if (!opt.tabLevel) {
      opt.tabLevel = 0;
    }
    console.log('insertOl updateToOl', opt, options);
    if (options?.isCopyList) {
      let arr: any[] = opts as any[];
      for (let i = 0; i < arr.length; i++) {
        const children = JSON.parse(JSON.stringify(arr[i].children));
        arr[i] = { ...arr[0], children };
      }
    }
    updateToOl(editor, opts as any, options);
  } else {
    const employee = storage.get('userInfo')?.employee;
    const id = opt + '=' + createUUID();

    insertOl(editor, {
      type: opt,
      tabLevel: 0,
      num: 1,
      id: id,
      authCls: 'auth-' + employee,
      elId: createUUID(),
    });
  }
};

export const updateOlDecreaseIndent = (editor: any, opt: any) => {
  const tabLevel: number = opt.tabLevel - 1 < 0 ? 0 : opt.tabLevel - 1;
  const newRowNode = Object.assign({}, opt, { tabLevel });
  console.log('updateDTabToOl', newRowNode);
  updateToOl(editor, newRowNode);
};

export const insertNewOlFromOl = (editor: any, rowNode: ElementOpt, text: string) => {
  const { selection } = editor;
  const { path, offset } = selection.anchor;
  const selectionStart = Range.start(selection);
  const selectionEnd = Range.end(selection);
  const currentNode: any = Editor.node(editor, Range.start(selection));

  if (Range.isExpanded(selection)) {
    Transforms.select(editor, Editor.unhangRange(editor, selection));
    Transforms.delete(editor);
  }

  const parentNodePath = path.slice(0, -1);
  const parentNodeStart = Range.start(Editor.range(editor, parentNodePath));
  const parentNodeEnd = Range.end(Editor.range(editor, parentNodePath));
  const isAtParentNodeEnd = Point.equals(selectionEnd, parentNodeEnd);
  const isAtParentNodeStart = Point.equals(selectionStart, parentNodeStart);

  console.log('[insertNewOlFromOl]', path, offset, isAtParentNodeEnd);

  if (isAtParentNodeEnd || isAtParentNodeStart) {
    const employee = storage.get('userInfo')?.employee;
    const elId = createUUID();
    const newRowNode: any = Object.assign({}, rowNode, {
      num: (rowNode.num as number) + 1,
      children: [{ text: '' }],
      authCls: 'auth-' + employee,
      elId,
    });
    Transforms.insertNodes(editor, newRowNode);
  } else {
    Transforms.splitNodes(editor, { at: selectionStart });
  }

  Transforms.select(editor, Path.next(parentNodePath));
  Transforms.collapse(editor, { edge: 'start' });
};

export const removeOl = (editor: any) => {
  updateToOl(editor, {
    type: ELTYPE.PARAGRAPH,
    tabLevel: null,
    num: null,
    id: null,
    authCls: null,
    liType: null,
    elId: null,
  });
};

export const OlList: React.FC<OlListProps> = (props: OlListProps) => {
  const [show, setShow] = useState(false);

  const {
    prop: { attributes, element },
    className = '',
    children,
    elementUniqueId,
    textAlign,
    isInAnchor = false,
    lineHeight,
  } = props;

  const { num = 1, liType = 'i', tabLevel = 1, authCls = '', id, oldType = '' } = element;
  let type: any = '1';
  switch (tabLevel % 3) {
    case 1:
      type = 'a';
      break;
    case 2:
      type = 'i';
      break;
    case 0:
      type = '1';
      break;
    default:
      break;
  }

  return (
    <ol
      {...attributes}
      className={`${className} ${id} ${show ? 'slate_plugins_ol_list' : ''} ${!isInAnchor ? oldType : ''}`}
      style={{
        lineHeight,
        marginLeft: isInAnchor ? '1rem' : convertTabLevel(tabLevel),
        textAlign: textAlign as any,
      }}
      type={type}
      start={num}
      data-start={num}
      data-list-id={id}
      data-tab-level={tabLevel}
    >
      <li
        id={elementUniqueId}
        data-start={liType}
        data-tab-level={tabLevel}
        data-list-id={id}
        data-oldtype={oldType}
        data-li-name={oldType ? 'slate-heading' : ''}
      >
        <span className={`${authCls} op-symbol`}>
          <span
            className={css(
              isInAnchor
                ? `
            &{
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
              white-space: nowrap;
              display: block;
            }
          `
                : ''
            )}
            data-string="true"
          >
            {children}
          </span>
        </span>
        {}
      </li>
    </ol>
  );
};

export const UlList: React.FC<OlListProps> = (props: OlListProps) => {
  const [show, setShow] = useState(false);

  const {
    prop: { attributes, element },
    className = '',
    children,
    elementUniqueId,
    textAlign,
    isInAnchor = false,
    lineHeight,
  } = props;
  const { num = 1, liType = 'i', tabLevel = 1, authCls = '', id, oldType = '' } = element;
  let type: any = '1';
  switch (tabLevel % 3) {
    case 1:
      type = 'square';
      break;
    case 2:
      type = 'circle';
      break;
    case 0:
      type = 'disc';
      break;
    default:
      break;
  }

  return (
    <ul
      {...attributes}
      className={`${className} ${id} ${show ? 'slate_plugins_ol_list' : ''} ${!isInAnchor ? oldType : ''}`}
      style={{
        lineHeight,
        listStyleType: `${type}`,
        marginLeft: isInAnchor ? '1rem' : convertTabLevel(tabLevel),

        textAlign: textAlign as any,
      }}
      data-tab-level={tabLevel}
      data-list-id={id}
    >
      <li id={elementUniqueId} data-tab-level={tabLevel} data-list-id={id} data-oldtype={oldType} data-li-name={oldType ? 'slate-heading' : ''}>
        <span className={`${authCls} op-symbol`}>
          <span
            className={css(
              isInAnchor
                ? `
            &{
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
              white-space: nowrap;
              display: block;
            }
          `
                : ''
            )}
            data-string="true"
          >
            {children}
          </span>
        </span>
      </li>
    </ul>
  );
};
