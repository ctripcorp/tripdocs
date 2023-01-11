import { Editor, Node, Path, Transforms } from '@src/components/slate-packages/slate';
import { ELTYPE, OL_UL_LIST_TYPES } from '../components/docs/plugins/config';
import { ReactEditor } from '../components/slate-packages/slate-react';
import { setCache } from './cacheUtils';
import { createUUID } from './randomId';

export interface LListProps {
  tabLevel?: any;
  id: string;
  path?: any;
  lId: string;
  elId: string;
  callback: Function;
  element: any;
  slateNode: any;
  editor: any;
  type?: any;
}

interface ListenerArr {
  lId: string;
  lListMap: Map<string, LListProps>;
}
let listenerArr: ListenerArr[] = [];

let listMap = {};
const getArr2d = lId => {
  let arr2d = [];
  let lists = document.querySelectorAll('ol[data-list-id="' + lId + '"]');

  lists.forEach(function (item, i) {
    let tabLevel = parseInt(item.getAttribute('data-tab-level'), 10);
    let num = parseInt(item.getAttribute('data-start'), 10);
    if (!arr2d[i]) arr2d[i] = [];
    arr2d[i][tabLevel] = num;
  });
  let len = arr2d.length;
  for (let i = 0; i < len; i++) {
    let item = arr2d[i];
    let len2 = item.length;
    for (let j = 0; j < len2; j++) {
      let item2 = item[j];
      if (i == 0) {
        if (!item2) arr2d[i][j] = 1;
      } else {
        if (!item2) arr2d[i][j] = arr2d[i - 1][j];
      }
    }
  }

  return arr2d;
};

const callback = editor => (targetVal: any) => {
  setTimeout(() => {
    if (Node.has(editor, targetVal.path)) {
      const targetNode: any = Node.get(editor, targetVal.path);
      if (targetNode.num === targetVal.slateNode.num) {
        return;
      } else {
        setTimeout(() => {
          Transforms.setNodes(editor, { num: targetVal.slateNode.num } as any, { at: targetVal.path });
        }, 100);
        return;
      }
      const parentDom = ReactEditor.toDOMNode(editor, targetNode);
      if (!parentDom || !parentDom.children || !parentDom.children.length) return;
      parentDom.children[0].setAttribute('start', targetVal.slateNode.num);
      parentDom.children[0].setAttribute('data-start', targetVal.slateNode.num);
      let arr2d = getArr2d(targetVal.lId);
      let currNo = 0;
      let currTabLevel = 0;
      if (listMap[targetVal.lId]) {
      } else {
      }
      let lists = document.querySelectorAll('ol[data-list-id="' + targetVal.lId + '"]');

      const curNodeEntry: any = Editor.nodes(editor, { at: [], match: (n: any) => OL_UL_LIST_TYPES.includes(n.type) });

      for (let [node, path] of curNodeEntry) {
        console.log('curNodeEntry', node, path);

        if (targetVal.slateNode.elId === node.elId && targetVal.slateNode.num !== node.num) {
          console.log('curNodeEntry', node, path);
          Transforms.setNodes(editor, { ...targetVal.slateNode }, { at: path });
          return;
        }
      }

      lists.forEach(function (item, i) {
        let tabLevel = parseInt(item.getAttribute('data-tab-level'), 10);

        if (item == parentDom.children[0]) {
          currNo = i;
          currTabLevel = tabLevel;
          if (!arr2d[i]) arr2d[i] = [];
          arr2d[i][tabLevel] = targetVal.slateNode.num;
        }
      });
    }
  });
};

export function resortListener(list: LListProps[], editor: any) {
  listenerArr = [];
  for (let i = 0; i < list.length; i++) {
    const it: any = list[i];
    if ([ELTYPE.OLLIST, ELTYPE.ULLIST].includes(it?.type)) {
      addListener({
        lId: it.id,
        elId: createUUID(),
        callback: callback(editor),
        slateNode: it,
        editor,
        path: [i],
      });
    } else if ([ELTYPE.CARD].includes(it?.type)) {
      if (!it || !it.children.length || (!it.children[1] && it.children[1]?.type)) {
        continue;
      }

      if ([ELTYPE.TABLE].includes(it.children[1]?.type)) {
        if (!it.children[1]?.children || !it.children[i]?.children?.length) continue;
        for (let j = 0; j < it.children[1].children.length; j++) {
          const rowIt: any = it.children[1].children[j];

          if (!rowIt || !rowIt.children || !rowIt.children.length) continue;
          for (let k = 0; k < rowIt.children.length; k++) {
            const cellIt: any = rowIt.children[k];

            for (let h = 0; h < cellIt.children.length; h++) {
              const cellChildIt: any = cellIt.children[h];

              if ([ELTYPE.OLLIST, ELTYPE.ULLIST].includes(cellChildIt?.type)) {
                addListener({
                  lId: cellChildIt.id,
                  elId: createUUID(),
                  callback: callback(editor),
                  slateNode: cellChildIt,
                  editor,
                  path: [i, 1, j, k, h],
                });
              }
            }
          }
        }
      } else if ([ELTYPE.ALERTS].includes(it.children[1]?.type)) {
        for (let j = 0; j < it.children[1].children.length; j++) {
          const childIt: any = it.children[1].children[j];

          if ([ELTYPE.OLLIST, ELTYPE.ULLIST].includes(childIt?.type)) {
            console.log('-------', it, childIt);
            addListener({
              lId: childIt.id,
              elId: createUUID(),
              callback: callback(editor),
              slateNode: childIt,
              editor,
              path: [i, 1, j],
            });
          }
        }
      }
    }
  }
  updateListNum();
  setCache(editor.docId, 'list-listenerArr', listenerArr);
}

export function addListener(props: any) {
  const { lId, elId } = props;

  let map;

  for (let i = 0; i < listenerArr.length; i++) {
    const el = listenerArr[i];
    if (el?.lId === lId) {
      map = el?.lListMap;
      break;
    }
  }

  if (map) {
    map.set(elId, props);
  } else {
    map = new Map();
    map.set(elId, props);
    listenerArr.push({
      lId,
      lListMap: map,
    });
  }
}

function sortListFromPath(newArr: any[]) {
  newArr.sort((a: { path: number[] }, b: { path: number[] }) => (Path.isBefore(a.path, b.path) ? -1 : 1));
  return newArr;
}

export function updateListNum() {
  for (let i = 0; i < listenerArr.length; i++) {
    const el = listenerArr[i];
    let map = el?.lListMap;
    if (!map.values) {
      return;
    }

    const zArr: any[] = [];

    let utabLevel = 0;
    let newArr: any[] = [];

    for (const value of map.values()) {
      newArr.push(value);
    }

    sortListFromPath(newArr);
    for (let i = 0; i < newArr.length; i++) {
      const value = newArr[i];

      const tabLevel = value.slateNode.tabLevel;

      let isPush = true;
      if (tabLevel > utabLevel) {
        isPush = false;
      }

      if (!zArr[tabLevel]) {
        zArr[tabLevel] = [
          {
            isPush: true,
            arr: [value],
          },
        ];
      } else {
        const targetObj = zArr[tabLevel][zArr[tabLevel].length - 1];

        if (isPush) {
          targetObj.arr.push(value);
        } else {
          zArr[tabLevel].push({
            isPush: true,
            arr: [value],
          });
        }
      }
      utabLevel = tabLevel;
    }

    const target: any = {};
    for (let i = 0; i < zArr.length; i++) {
      const targetArr = zArr[i] || [];

      for (let j = 0; j < targetArr.length; j++) {
        let lArr = targetArr[j].arr;
        sortListFromPath(lArr);

        for (let i = 0; i < lArr.length; i++) {
          const el = lArr[i];
          if (el !== i + 1) {
            el.slateNode = {
              ...el.slateNode,
              num: i + 1,
            };
            el.callback(el);
          }
        }
      }
    }
  }
}
