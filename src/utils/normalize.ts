import { Editor, Node, Transforms } from '@src/components/slate-packages/slate';
import { ELTYPE } from '@src/components/docs/plugins/config';

import { getArrFromArrByKey } from './faster';
import { createRandomId } from './randomId';
import { getNodeString } from '@src/components/docs/plugins/transformers/mdast-to-slate';
import { message } from 'antd';
import { normMsg } from '@src/components/docs/plugins/withNormalize';

export interface ELEMENTNODE {
  children?: ELEMENTNODE[];
  type?: string;
  [key: string]: any;
}
export function isVoidChildren(children: any[]) {
  return children.length === 1 && children[0].type === undefined && children[0].text === '';
}

export function delTopElement(editor: Editor, path: number[]) {
  Transforms.removeNodes(editor, { at: [path[0]] });
}

export function isNodeChildrenIsTargetType(children: ELEMENTNODE[], type?: string | any[], index?: number) {
  if (type) {
    return (
      Array.isArray(children) &&
      children.length &&
      children.every((item: ELEMENTNODE) => {
        if (typeof type === 'string') {
          return item.type === type;
        } else if (Array.isArray(type)) {
          let t = index || 0;
          if (typeof type[t] === 'string' || type[t] === undefined) {
            const result = type[t] === item.type;
            if (result && type.length === t + 1) {
              return true;
            } else if (result && type.length < t + 1) {
              return isNodeChildrenIsTargetType(item.children, type, t + 1);
            }

            return false;
          } else if (Array.isArray(type[t])) {
            const result = type[t].includes(item.type);
            if (result && type.length === t + 1) {
              return true;
            } else if (result && type.length < t + 1) {
              return isNodeChildrenIsTargetType(item.children, type, t + 1);
            }

            return false;
          } else {
            console.error('isNodeChildrenIsTargetType err', children, type, index);

            return false;
          }
        }
      })
    );
  }
  return Array.isArray(children) && children.length;
}

export function isNodeChildrenIsNotNull(children: ELEMENTNODE[]) {
  return children.length !== 0;
}
export function isNodeChildrenHasTargetType(children: ELEMENTNODE[], typeObj?: any | any[], path: number[] = []) {
  if (typeObj) {
    const curPath = [...path];
    const t = curPath.length;
    if (typeof typeObj === 'object' && !Array.isArray(typeObj)) {
      if (
        typeObj.require &&
        !children.some((i, num) => {
          return typeObj.type === i.type;
        })
      ) {
        return {
          requireType: typeObj.type,
          path: curPath,
          result: false,
        };
      }
    } else if (Array.isArray(typeObj) && typeObj[t]) {
      let requireTypes = [];

      if (typeObj[t].require && !children.some(i => typeObj[t].type === i.type)) {
        return {
          requireType: typeObj[t].type,
          path: curPath,
          result: false,
        };
      } else if (Array.isArray(typeObj[t])) {
        requireTypes = typeObj[t].filter(i => {
          return i.require;
        });
        const types = getArrFromArrByKey(requireTypes, 'type');
        const result = types.includes(typeObj[t].type);
        if (!result) {
          return {
            requireType: typeObj[t].type,
            path: curPath,
            result: false,
          };
        }
      }
      if (typeObj.length < t + 1) {
        for (let i = 0; i < children.length; i++) {
          const item = children[i];
          if (item.children) {
            const result = isNodeChildrenHasTargetType(item.children, typeObj, curPath.concat(i));

            if (!result.result) {
              return result;
            }
          } else {
            return {
              requireType: typeObj[t].type,
              path: curPath.concat(i),
              result: false,
            };
          }
        }
      }
    }
  }

  return {
    result: true,
  };
}
export function delChildrenComponent(editor: Editor, children: any[], path: number[]) {
  Editor.withoutNormalizing(editor, () => {
    Transforms.removeNodes(editor, {
      at: path,
    });

    Transforms.insertNodes(
      editor,
      { type: ELTYPE.TABLE_CELL, key: createRandomId(), children: [{ type: ELTYPE.PARAGRAPH, children: [{ text: '' }] }] } as any,
      {
        at: path,
      }
    );
  });
}

export function delChildrenNotAllowComponent(editor: Editor, children: any[], componentsOk: string[], path: number[], defaultChildren?: any) {
  let count = children.length;
  for (let i = children.length - 1; i >= 0; i--) {
    const el = children[i];
    if (!componentsOk.includes(el?.type)) {
      const tPath = path.concat([i]);
      console.log('delChildrenNotAllowComponent', el, children, tPath);

      if (Editor.hasPath(editor, tPath)) {
        if (count === 1) {
          const dNode = defaultChildren || { text: getNodeString(children) };
          Transforms.insertNodes(editor, dNode, { at: calcNextPath(tPath) });
        }
        Transforms.delete(editor, { at: tPath });
        count--;
      }
    }
  }
}

function calcNextPath(path: number[]) {
  return [...path.slice(0, -1), path[path.length - 1] + 1];
}

export function setPTagChildrenNotAllowComponent(editor: Editor, children: any[], componentsOk: string[], path: number[]) {
  if (children.length === 0) {
    Transforms.insertNodes(editor, { type: ELTYPE.PARAGRAPH, children: [{ text: '' }] } as any, { at: path.concat(0) });
    return;
  }

  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    if (!componentsOk.includes(el?.type)) {
      const tPath = path.concat([i]);
      console.log('delChildrenNotAllowComponent', children, tPath);

      Transforms.setNodes(editor, { type: ELTYPE.PARAGRAPH, children: [{ text: Node.string(el) || '' }] }, { at: tPath });
    }
  }
}
