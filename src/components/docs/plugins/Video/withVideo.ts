import { Editor, Node, NodeEntry, Path, Point, Range, Transforms } from '../../../slate-packages/slate';
import { ReactEditor } from '../../../slate-packages/slate-react';
import { DOMNode, isDOMNode } from '../../../slate-packages/slate-react/utils/dom';
import hotkeys from '../../../slate-packages/slate-react/utils/hotkeys';
import { ELTYPE } from '../config';

export const withVideo = (editor: any) => {
  const { deleteBackward, isBlockCard, insertBreak, insertText, deleteForward, deleteFragment, removeMark } = editor;

  editor.insertBreak = () => {
    const domSelection = window.getSelection();
    const anchorNode = domSelection.anchorNode;

    if (domSelection && domSelection.isCollapsed && hasCardTarget(anchorNode)) {
      const isLeftCursor = ReactEditor.isCardLeft(anchorNode);

      const cardEntry = toSlateCardEntry(editor, anchorNode);
      const cursorRootPath = cardEntry[1];

      Transforms.insertNodes(editor, { type: ELTYPE.PARAGRAPH, children: [{ text: '' }] } as Node, {
        at: isLeftCursor ? cursorRootPath : Path.next(cursorRootPath),
      });

      if (!isLeftCursor) {
        Transforms.select(editor, Path.next(cursorRootPath));
      }
      return;
    }
    insertBreak();
  };
  editor.isBlockCard = (element: any) => {
    if (element.type === ELTYPE.VIDEO) {
      return true;
    }
    return isBlockCard(element);
  };

  editor.deleteBackward = (unit: any) => {
    const domSelection = window.getSelection();
    const anchorNode = domSelection.anchorNode;
    if (domSelection && domSelection.isCollapsed && hasCardTarget(anchorNode)) {
      const isLeftCursor = ReactEditor.isCardLeft(anchorNode);
      const cardEntry = toSlateCardEntry(editor, anchorNode);
      const cursorRootPath = cardEntry[1];
      if (isLeftCursor) {
        Transforms.select(editor, Editor.before(editor, cursorRootPath));
        deleteBackward(unit);
        return;
      } else {
        Transforms.removeNodes(editor, { at: cursorRootPath });
        Transforms.insertNodes(
          editor,
          {
            type: ELTYPE.PARAGRAPH,
            children: [{ text: '' }],
          } as Node,
          {
            at: cursorRootPath,
          }
        );
        Transforms.select(editor, cursorRootPath);
        return;
      }
    }
    deleteBackward(unit);
  };
  return editor;
};

function hasCardTarget(node: any) {
  return node && (node.parentElement.hasAttribute('card-target') || (node instanceof HTMLElement && node.hasAttribute('card-target')));
}

function toSlateCardEntry(editor: any, node: DOMNode): NodeEntry {
  const element = node.parentElement.closest('.sla-block-card-element')?.querySelector('[card-target="card-center"]').firstElementChild;
  const slateNode = ReactEditor.toSlateNode(editor, element);
  const path = ReactEditor.findPath(editor, slateNode);
  return [slateNode, path];
}

export function onVideoKeydown(event: any, editor: ReactEditor) {
  if (true) {
    return;
  }
}

function anchorBlockEntry(editor: ReactEditor, at?: Path | Point): NodeEntry<any> | undefined {
  if (!at && isBlockCardCursor(editor)) {
    at = getBlockCardCenterCursor(editor);
  }
  const entry = Editor.above<any>(editor, {
    match: (n: any) => Editor.isBlock(editor, n),
    at,
  });
  return entry;
}

function isBlockCardCursor(editor: ReactEditor) {
  return editor.selection.anchor.offset < 0;
}
function getBlockCardCenterCursor(editor: ReactEditor) {
  return Editor.start(editor, editor.selection.anchor.path);
}

function focusBlockEntry(editor: ReactEditor, at?: Path | Point): NodeEntry<any> {
  if (!at && isBlockCardCursor(editor)) {
    at = getBlockCardCenterCursor(editor);
  }
  return Editor.above<any>(editor, {
    match: (n: any) => Editor.isBlock(editor, n),
    at: at || editor.selection.focus,
  });
}

const isTargetInsideVoid = (editor: ReactEditor, target: EventTarget | null): boolean => {
  const slateNode = hasTarget(editor, target) && ReactEditor.toSlateNode(editor, target);
  return Editor.isVoid(editor, slateNode);
};

const hasTarget = (editor: ReactEditor, target: EventTarget | null): target is DOMNode => {
  return isDOMNode(target) && ReactEditor.hasDOMNode(editor, target);
};
