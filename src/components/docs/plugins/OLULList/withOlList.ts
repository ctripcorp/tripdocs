import { bodySelectAll, getCurrentLineStart } from '@src/utils/selectionUtils';
import { CustomTypes, Editor, Element, ExtendedType, Node, Path, Point, Range, Transforms } from '@src/components/slate-packages/slate';
import { ELTYPE, LIST_TYPES, TABBABLE_TYPES } from '../config';
import { deleteFragmentPluginsRunner } from '../pluginsUtils/deleteFragment';
import { resortListener } from '@src/utils/listener';
import { reorderOL } from '../deserializers/handleFragmentPlugins';
import { getParentPathByTypes } from '../pluginsUtils/getPathUtils';

export const updateOlList = editor => {
  if (editor.operations) {
    const opsStr = JSON.stringify(editor.operations);

    if (opsStr.indexOf(ELTYPE.OLLIST) > -1 || opsStr.indexOf(ELTYPE.ULLIST) > -1 || opsStr.indexOf('"newProperties":{"tabLevel"') > -1) {
      resortListener(editor.children, editor);
    }
  }
};

export const withOlList = (editor: any) => {
  const { deleteBackward, setFragmentData, apply, deleteFragment, onChange } = editor;

  editor.deleteFragment = () => {
    deleteFragmentPluginsRunner(editor, deleteFragment);
  };

  editor.onChange = () => {
    updateOlList(editor);
    onChange();
  };

  editor.deleteBackward = (unit: any) => {
    console.log('[withOlList] deleteBackward', unit);
    const { path, offset } = editor.selection.anchor;
    const tabbableParentPath = getParentPathByTypes(editor, path, TABBABLE_TYPES);
    const prevPath = tabbableParentPath && tabbableParentPath[tabbableParentPath.length - 1] > 0 ? Path.previous(tabbableParentPath) : null;
    if (prevPath && Range.isCollapsed(editor.selection)) {
      const prevNode: any = Node.get(editor, prevPath);
      const rowNode: any = Node.get(editor, tabbableParentPath);
      const { type } = prevNode;
      const text = Node.string(prevNode);
      const start = getCurrentLineStart(editor);

      if (LIST_TYPES.includes(type) && !LIST_TYPES.includes(rowNode.type) && Point.equals(start, editor.selection.anchor) && text.length === 0) {
        console.log('[withOlList] deleteBackward', prevPath, prevNode);
        Transforms.setNodes(editor, { ...prevNode });
        Transforms.removeNodes(editor, { at: prevPath });
        console.log('[withOlList] returned ');
        return;
      }
    }

    const parentNode = Node.parent(editor, path) as any;
    if (LIST_TYPES.includes(parentNode.type)) {
      const [cellChildrenNodeFirstNode, cellChildrenNodeFirstPath] = Node.first(editor, path.slice(0, -1));

      if (Path.equals(cellChildrenNodeFirstPath, path) && offset === 0) {
        console.log('withOlList deleteBackward', cellChildrenNodeFirstPath, cellChildrenNodeFirstNode, path);
        if (parentNode.oldType) {
          Transforms.setNodes(editor, { type: parentNode.oldType } as any);
        } else {
          Transforms.setNodes(editor, { type: ELTYPE.PARAGRAPH } as any);
        }
        console.log('[withOlList] returned ');
        return;
      }
    }

    deleteBackward(unit);
  };

  editor.setFragmentData = (data: DataTransfer) => {
    setFragmentData(data);
  };

  editor.apply = (op: any) => {
    try {
      if (op?.newProperties?.anchor?.path?.[0] == 5) {
      }
    } catch (error) {
      console.log('[0]', error.message);
    }

    apply(op);
  };

  return editor;
};
