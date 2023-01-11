import { Editor, Element as SlateElement, Node, Path, Point, Range, Transforms } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { getCache } from '@src/utils/cacheUtils';
import { getCurrentLineEnd, getCurrentLineStart } from '@src/utils/selectionUtils';
import { ELTYPE, inCardEL, TABBABLE_TYPES } from '../config';
import { getParentPathByType, getParentPathByTypes } from '../pluginsUtils/getPathUtils';

export const withCard = (editor: any) => {
  const { isInline, isVoid, deleteFragment, setFragmentData, deleteForward, deleteBackward } = editor;

  editor.deleteFragment = (direction?: any) => {
    console.log('[withCard] deleteFragment');
    const {
      selection: { anchor, focus },
    } = editor;

    if (anchor.path[0] !== focus.path[0]) {
      let path1, path2: any;
      if (anchor.path[0] > focus.path[0]) {
        path1 = anchor.path[0];
        path2 = focus.path[0];
      } else {
        path1 = focus.path[0];
        path2 = anchor.path[0];
      }
      const count = path1 - path2;
      const nodeArr: any[] = [];
      for (let i = 0; i <= count; i++) {
        const path = path2 + i;

        nodeArr[i] = Node.get(editor, [path]);
        const { type, elId, id } = nodeArr[i];
        if (type === ELTYPE.CARD) {
          Transforms.setNodes(editor, { type: ELTYPE.PARAGRAPH } as any, { at: [path] });
        }
      }
    }

    const isCardSelection = normalizeCardSelection(editor);
    console.log('[withCard] deleteFragment isCardSelection', isCardSelection);
    if (isCardSelection) {
      if (editor.selection && ReactEditor.hasRange(editor, editor.selection) && Range.isExpanded(editor.selection)) {
        console.log('[withCard] deleteFragment isCardSelection', editor.selection);
        Transforms.delete(editor, {
          at: editor.selection.focus.path.slice(0, -2),
          reverse: direction === 'backward',
          voids: true,
        });
        return;
      }
    } else {
      deleteFragment(direction);
    }
  };

  editor.setFragmentData = (data: DataTransfer) => {
    setFragmentData(data);
  };

  editor.deleteForward = () => {
    const cardSufPath = getParentPathByType(editor, editor.selection.anchor.path, ELTYPE.CARD_SUF);
    if (cardSufPath) {
      const cardPath = Path.parent(cardSufPath);
      const nextPath = cardPath && Path.next(cardPath);
      if (nextPath) {
        const nextNode = Node.has(editor, nextPath) && Node.get(editor, nextPath);
        console.log(
          '[withCard] deleteForward - 【1】光标在 card_suf 中 delete 删除，处理逻辑：将光标放到下一行开头（如果非空行）',
          cardSufPath,
          nextPath,
          nextNode
        );
        if (Node.string(nextNode) === '') {
          Transforms.removeNodes(editor, { at: nextPath });
        } else {
          Transforms.select(editor, nextPath);
          Transforms.collapse(editor, { edge: 'start' });
        }
      }
      return;
    }

    const tabbableParentPath = getParentPathByTypes(editor, editor.selection.anchor.path, TABBABLE_TYPES);
    const curLineEnd = getCurrentLineEnd(editor);
    if (Range.isCollapsed(editor.selection) && Point.equals(editor.selection.anchor, curLineEnd) && tabbableParentPath) {
      const nextPath = tabbableParentPath && Path.next(tabbableParentPath);
      if (nextPath) {
        const nextNode: any = Node.has(editor, nextPath) && Node.get(editor, nextPath);
        if (nextNode?.type === ELTYPE.CARD) {
          console.log('[withCard] deleteForward -【2】在 card 的前一行尾 delete 删除，阻止该行为', nextNode);
          return;
        }
      }
    }

    const cardPrePath = getParentPathByType(editor, editor.selection.anchor.path, ELTYPE.CARD_PRE);
    if (cardPrePath) {
      const cardPath = Path.parent(cardPrePath);
      Transforms.removeNodes(editor, { at: cardPath });
      console.log('[withCard] deleteForward -【3】在 card_pre delete 删除，删除一整行', cardPath);
    }

    let res = parentNodeFirstNodeOrCenterNodeCallBack(editor, [ELTYPE.CARD, ELTYPE.CARD_PRE, ELTYPE.CARD_SUF, ...inCardEL], function (parentPath) {
      console.log('withCard deleteBackward parentNodeFirstNodeOrCenterNodeCallBack', parentPath);
      Transforms.removeNodes(editor, { at: parentPath });
    });
    if (res) {
      return;
    }
    res = delCellPreviousChildren(editor, editor.selection, true);
    if (res) {
      return;
    }
    deleteForward();
  };

  editor.deleteBackward = (unit: any) => {
    const cardPrePath = getParentPathByType(editor, editor.selection.anchor.path, ELTYPE.CARD_PRE);
    if (cardPrePath) {
      const cardPath = Path.parent(cardPrePath);
      const prevPath = cardPath && Path.hasPrevious(cardPath) ? Path.previous(cardPath) : null;
      if (prevPath) {
        const prevNode = Node.has(editor, prevPath) && Node.get(editor, prevPath);
        console.log(
          '[withCard] deleteBackward - 【1】光标在 card_pre 中 backspace 删除，处理逻辑：将光标放到上一行末尾（如果非空行）',
          cardPrePath,
          prevPath,
          prevNode
        );
        if (Node.string(prevNode) === '') {
          Transforms.removeNodes(editor, { at: prevPath });
        } else {
          Transforms.select(editor, prevPath);
          Transforms.collapse(editor, { edge: 'end' });
        }
      }
      return;
    }

    console.log('[withCard deleteBackward] unit', unit);
    let res = parentNodeLastNodeOrCenterNodeCallBack(editor, [ELTYPE.CARD, ELTYPE.CARD_PRE, ELTYPE.CARD_SUF, ...inCardEL], function (parentPath) {
      console.log('withCard deleteBackward parentNodeLastNodeOrCenterNodeCallBack', parentPath);
      Transforms.removeNodes(editor, { at: parentPath });
    });
    if (res) {
      return;
    }

    console.log('isSameLineSelectingCard 0', editor.selection);
    if (isSameLineSelectingCard(editor)) {
      console.log('[withCard] deleteBackward - 【2】 backspace 删除当前选中的 card: 包含{card_pre, card_suf}', editor.selection);
      Transforms.removeNodes(editor, { voids: true });
      return;
    }

    const startPoint = getCurrentLineStart(editor);
    const elementPath = getParentPathByTypes(editor, startPoint.path, TABBABLE_TYPES);
    const previousElementPath = Path.hasPrevious(elementPath) && Path.previous(elementPath);

    const isPreviousNodeCardType = (path: Path) => {
      const node: any = Node.has(editor, path) && Node.get(editor, path);
      console.log('isPreviousNodeCardType node', path, node);
      return node && node.type === ELTYPE.CARD;
    };

    console.log(
      '[withCard] deleteBackward',
      startPoint.path,
      previousElementPath,
      Range.isCollapsed(editor.selection),
      Point.equals(startPoint, editor.selection.anchor),
      isPreviousNodeCardType(previousElementPath)
    );
    if (Range.isCollapsed(editor.selection) && Point.equals(startPoint, editor.selection.anchor) && isPreviousNodeCardType(previousElementPath)) {
      console.log('[withCard] deleteBackward - 【3】光标在 card 的下一行首，点 backspace 删除，全选 card 内容', startPoint.path, previousElementPath);
      Transforms.select(editor, previousElementPath);
      return;
    }
    deleteBackward(unit);
  };

  return editor;
};

export const isSameLineSelectingCard = (editor: Editor) => {
  const { selection } = editor;
  const { anchor, focus } = selection;
  const cardPath = getParentPathByType(editor, anchor.path, ELTYPE.CARD);
  let isSameLineSelectingCard = false;
  const anchorNode: any = Node.has(editor, anchor.path) && Node.get(editor, anchor.path);
  const focusNode: any = Node.has(editor, focus.path) && Node.get(editor, focus.path);
  const fillerTypes = [ELTYPE.CARD_PRE, ELTYPE.CARD_SUF];
  const anchorAtCardFiller = getParentPathByTypes(editor, anchor.path, fillerTypes) || fillerTypes.includes(anchorNode.type);
  const focusAtCardFiller = getParentPathByTypes(editor, focus.path, fillerTypes) || fillerTypes.includes(focusNode.type);

  if (cardPath) {
    const isSameLevel = Path.isAncestor(cardPath, anchor.path) && Path.isAncestor(cardPath, focus.path);
    isSameLineSelectingCard = isSameLevel && !!anchorAtCardFiller && !!focusAtCardFiller;
  }
  return isSameLineSelectingCard;
};

function delCellPreviousChildren(editor: any, selection: any, reverse: boolean) {
  if (selection.anchor.path.length > 4) {
    const start = Editor.start(editor, selection.anchor.path.slice(0, 4));
    const cellChildrenNodePath = selection.anchor.path.slice(0, 5);
    const cellChildrenNode = Node.get(editor, cellChildrenNodePath) as any;
    const type: any = cellChildrenNode.type;
    const getNodeFirst = !reverse ? Node.first : Node.last;
    const [cellChildrenNodeFirstNode, cellChildrenNodeFirstPath] = getNodeFirst(editor, cellChildrenNodePath);

    if (Path.equals(cellChildrenNodeFirstPath, selection.anchor.path) && selection.anchor.offset === 0) {
      if (cellChildrenNodePath.slice(0, 5).slice(-1)[0] === 0) {
        return;
      }
      let getPrevious = !reverse ? Editor.previous : Editor.last;
      let [previousNode, previousPath] = getPrevious(editor, {
        at: cellChildrenNodePath,
      } as any) as any;
      if (previousNode.type === ELTYPE.CARD) {
        Transforms.removeNodes(editor, { at: previousPath });
        console.log('table inner delete card');
        return true;
      }
    }
    if (Point.equals(selection.anchor, start) && ![ELTYPE.OLLIST, ELTYPE.ULLIST, ELTYPE.TODO_LIST, ELTYPE.CARD].includes(type)) {
      return;
    }
  }
}
function parentNodeFirstNodeOrCenterNodeCallBack(editor: any, types: any[], callback: Function) {
  const { path, offset } = editor.selection.anchor;
  const parentNode = Node.parent(editor, path) as any;
  console.log('[first cb]', parentNode);
  if (types.includes(parentNode.type)) {
    if ([...inCardEL, ELTYPE.CARD_PRE].includes(parentNode.type)) {
      callback(path.slice(0, -2));
      return true;
    }

    const [cellChildrenNodeFirstNode, cellChildrenNodeFirstPath] = Node.first(editor, path.slice(0, -1));

    if (Path.equals(cellChildrenNodeFirstPath, path) && offset === 0) {
      callback(path.slice(0, -1));

      return true;
    }
  }
}
function parentNodeLastNodeOrCenterNodeCallBack(editor: any, types: any[], callback: Function) {
  const { path, offset } = editor.selection.anchor;
  const parentNode = Node.parent(editor, path) as any;
  console.log('[last cb]', parentNode, types.includes(parentNode.type));
  if (types.includes(parentNode.type)) {
    if ([...inCardEL, ELTYPE.CARD_SUF].includes(parentNode.type)) {
      callback(path.slice(0, -2));
      return true;
    }

    const [cellChildrenNodeFirstNode, cellChildrenNodeFirstPath] = Node.last(editor, path.slice(0, -1));

    if (Path.equals(cellChildrenNodeFirstPath, path) && offset === 0) {
      callback(path.slice(0, -1));

      return true;
    }
  }
}

export const normalizeCardSelection = (editor: ReactEditor) => {
  const { selection } = editor;
  let isCardSelection = false;
  if (selection && ReactEditor.hasRange(editor, selection) && Range.isExpanded(selection)) {
    const { anchor, focus } = selection;
    const anchorNode: any = Node.has(editor, anchor.path) && Node.get(editor, anchor.path);
    const focusNode: any = Node.has(editor, focus.path) && Node.get(editor, focus.path);
    const fillerTypes = [ELTYPE.CARD_PRE, ELTYPE.CARD_SUF];
    const anchorAtCardFiller = getParentPathByTypes(editor, anchor.path, fillerTypes) || fillerTypes.includes(anchorNode.type);
    const focusAtCardFiller = getParentPathByTypes(editor, focus.path, fillerTypes) || fillerTypes.includes(focusNode.type);

    const cardPath = getParentPathByType(editor, anchor.path, ELTYPE.CARD);

    const isSelectionCard = isSameLineSelectingCard(editor);
    console.log('[normalizeCardSelection]', selection, cardPath, anchorAtCardFiller, focusAtCardFiller, isSelectionCard);

    if (isSelectionCard) {
      Transforms.select(editor, { anchor: { path: [...cardPath, 0, 0], offset: 0 }, focus: { path: [...cardPath, 2, 0], offset: 0 } });
      isCardSelection = true;
    }
  }
  return isCardSelection;
};

export const removeCardSelectionContentBeforeInput = (editor: Editor, e: React.BaseSyntheticEvent) => {
  const selection = editor.selection;
  if (!selection) {
    return;
  }
  const cardPath = getParentPathByType(editor, selection.anchor.path, ELTYPE.CARD);
  if (isSameLineSelectingCard(editor)) {
    console.log('[removeCardSelectionContentBeforeInput]', cardPath);
    e.preventDefault();
    console.log('isSameLineSelectingCard');
    Transforms.removeNodes(editor, { at: cardPath });
    (e as any).key && Transforms.insertText(editor, (e as any).key);
    return;
  }
};
