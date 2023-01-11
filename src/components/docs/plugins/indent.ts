import { Transforms, Range, Node, Point } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { getCurrentLineStart } from '@src/utils/selectionUtils';
import { ELTYPE, TABBABLE_TYPES } from './config';

export const MAX_TABLEVEL = 20;

export const increaseIndent = (editor: any, rowNode: any, selection: any) => {
  if (!rowNode) return;
  let { tabLevel, type } = rowNode;
  let tempType = type;
  let tempRowNode = rowNode;

  if (type && type == ELTYPE.CARD && (rowNode.children[1].type == ELTYPE.TABLE || rowNode.children[1].type == ELTYPE.ALERTS)) {
    tempRowNode = Node.get(editor, selection.focus.path.slice(0, -1));
    tempType = tempRowNode.type;
    tabLevel = tempRowNode.tabLevel;
  }

  if (tempType && TABBABLE_TYPES.includes(tempType)) {
    if (selection && ReactEditor.hasRange(editor, selection) && Range.isCollapsed(selection)) {
      if (!tempRowNode.tabLevel) {
        Transforms.setNodes(editor, { tabLevel: 1 } as Partial<Node>, {
          at: selection.focus.path.slice(0, -1),
        });
      } else if (tempRowNode.tabLevel < MAX_TABLEVEL) {
        Transforms.setNodes(editor, { tabLevel: 1 + tabLevel } as Partial<Node>, {
          at: selection.focus.path.slice(0, -1),
        });
      }
    } else if (selection && ReactEditor.hasRange(editor, selection) && Range.isExpanded(selection)) {
      let [start, end] = [Range.start(selection), Range.end(selection)];
      let curRow: any;
      let startPath = start.path.slice(0, -1);
      let startIndex = startPath[startPath.length - 1];
      let endPath = end.path.slice(0, -1);
      let endIndex = endPath[endPath.length - 1];
      for (let i = startIndex; i <= endIndex; i++) {
        curRow = Node.get(editor, [...startPath.slice(0, -1), i]);

        if (!curRow.tabLevel) {
          Transforms.setNodes(editor, { tabLevel: 1 } as Partial<Node>, {
            at: [...startPath.slice(0, -1), i],
          });
        } else if (curRow.tabLevel < MAX_TABLEVEL) {
          Transforms.setNodes(editor, { tabLevel: Number.parseInt(curRow.tabLevel) + 1 } as Partial<Node>, { at: [...startPath.slice(0, -1), i] });
        }
      }
    }
  }
};

export const decreaseIndent = (editor: any, rowNode: any, selection: any) => {
  if (!rowNode) return;
  let { tabLevel, type } = rowNode;
  let tempType = type;
  let tempRowNode = rowNode;

  if (type && type == ELTYPE.CARD && (rowNode.children[1].type == ELTYPE.TABLE || rowNode.children[1].type == ELTYPE.ALERTS)) {
    tempRowNode = Node.get(editor, selection.focus.path.slice(0, -1));
    tempType = tempRowNode.type;
    tabLevel = tempRowNode.tabLevel;
  }
  if (tempType && TABBABLE_TYPES.includes(tempType)) {
    if (selection && ReactEditor.hasRange(editor, selection) && Range.isCollapsed(selection)) {
      if (!tempRowNode.tabLevel) {
        Transforms.setNodes(editor, { tabLevel: 0 } as Partial<Node>, {
          at: selection.focus.path.slice(0, -1),
        });
      } else if (tempRowNode.tabLevel > 0) {
        Transforms.setNodes(editor, { tabLevel: tabLevel - 1 } as Partial<Node>, {
          at: selection.focus.path.slice(0, -1),
        });
      }
    } else if (selection && ReactEditor.hasRange(editor, selection) && Range.isExpanded(selection)) {
      let [start, end] = [Range.start(selection), Range.end(selection)];
      let curRow: any;
      let startPath = start.path.slice(0, -1);
      let startIndex = startPath[startPath.length - 1];
      let endPath = end.path.slice(0, -1);
      let endIndex = endPath[endPath.length - 1];
      for (let i = startIndex; i <= endIndex; i++) {
        curRow = Node.get(editor, [...startPath.slice(0, -1), i]);

        if (!curRow.tabLevel) {
          Transforms.setNodes(editor, { tabLevel: 0 } as Partial<Node>, {
            at: [...startPath.slice(0, -1), i],
          });
        } else if (curRow.tabLevel > 0) {
          Transforms.setNodes(editor, { tabLevel: Number.parseInt(curRow.tabLevel) - 1 } as Partial<Node>, { at: [...startPath.slice(0, -1), i] });
        }
      }
    }
  }
};
