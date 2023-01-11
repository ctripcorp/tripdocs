import { Editor, Element as SlateElement, Node, Point, Range, Transforms, Path } from '@src/components/slate-packages/slate';
import { insertDivide } from '../plugins/Divide';
import { ELTYPE, HEADING_TYPES } from './config';
import { insertOl } from './OLULList/OlList';
import { v4 as anchorId } from 'uuid';
import { insertCard } from './Card';
import { insertCodeBlock } from './CodeBlock';
import { getIsTitle } from '@src/utils/selectionUtils';
import { getEditorEventEmitter } from './table/selection';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import storage from '@src/utils/storage';
import { createUUID } from '@src/utils/randomId';

const SHORTCUTS: any = {
  '1.': ELTYPE.OLLIST,
  '*': ELTYPE.ULLIST,
  '-': ELTYPE.ULLIST,
  '+': ELTYPE.ULLIST,
  '>': ELTYPE.BLOCK_QUOTE,
  '#': ELTYPE.HEADING_ONE,
  '##': ELTYPE.HEADING_TWO,
  '###': ELTYPE.HEADING_THREE,
  '####': ELTYPE.HEADING_FOUR,
  '#####': ELTYPE.HEADING_FIVE,
  '######': ELTYPE.HEADING_SIX,
  '---': ELTYPE.DIVIDE,
  '```': ELTYPE.CODE_BLOCK,
};

const MARKDOWN_SIGN: any = {
  __: 'bold',
  _: 'italic',
  '**': 'bold',
  '*': 'italic',
  '`': 'code',
};

function getCurrentChar(editor, signLength) {
  const { selection } = editor;
  const text = (Node.get(editor, selection.focus.path) as any).text as string;
  const fOffset = selection.focus.offset;
  const lastChar = fOffset < text.length ? text.slice(fOffset - signLength, fOffset) : text.slice(-signLength);

  return lastChar;
}

export const withShortcuts = (editor: any) => {
  const { deleteBackward, insertText, insertBreak } = editor;

  editor.insertText = (text: any) => {
    const { selection } = editor;
    const isTitle = getIsTitle(editor);
    if (!isTitle && selection) {
      const curLeaf: any = Node.get(editor, selection.focus.path);
      const texts = curLeaf.text as string;
      if (selection && ReactEditor.hasRange(editor, selection) && selection.focus.path.length !== 5 && !curLeaf.code) {
        let accContent = '';
        texts.replace(/(?:\*{2}([^\*]+?)\*{2})|(?:\*([^\*]+?)\*)|(?:\_{2}([^\_]+?)\_{2})|(?:\_([^\_]+?)\_)|(?:\`([^\`]+?)\`)/, (_, inner) => {
          accContent += inner;
          return '';
        });

        if (text === ' ' && selection && ReactEditor.hasRange(editor, selection) && Range.isCollapsed(selection)) {
          if (accContent.length) {
            for (const sign in MARKDOWN_SIGN) {
              const isAtTheEnd = texts.endsWith(sign);
              if (getCurrentChar(editor, sign.length) === sign) {
                const reverseArr = texts.split('').reverse();
                reverseArr.splice(0, sign.length);
                const reverseTexts = reverseArr.join('');

                if (reverseTexts.indexOf(sign) !== -1) {
                  const normalPos = texts.indexOf(sign);
                  const reversePos = reverseTexts.indexOf(sign);
                  const start = isAtTheEnd ? reverseTexts.length - reversePos : normalPos;
                  const end = isAtTheEnd ? reverseTexts.length : reverseTexts.length - reversePos;
                  Transforms.select(editor, {
                    anchor: { path: selection.anchor.path, offset: start },
                    focus: { path: selection.focus.path, offset: end },
                  });
                  Editor.addMark(editor, MARKDOWN_SIGN[sign], true);
                  Transforms.collapse(editor, { edge: 'focus' });
                  if (isAtTheEnd) {
                    const nextNextPath = Path.next(Path.next(selection.anchor.path));

                    Transforms.delete(editor, {
                      at: {
                        anchor: { path: nextNextPath, offset: 0 },
                        focus: { path: nextNextPath, offset: sign.length },
                      },
                    });
                    Transforms.delete(editor, {
                      at: {
                        anchor: { path: selection.anchor.path, offset: start - sign.length },
                        focus: { path: selection.anchor.path, offset: start },
                      },
                    });
                  } else {
                    const nextPath = Path.next(selection.anchor.path);
                    Transforms.delete(editor, {
                      at: {
                        anchor: { path: nextPath, offset: end - start - sign.length },
                        focus: { path: nextPath, offset: end - start },
                      },
                    });
                    Transforms.delete(editor, {
                      at: {
                        anchor: { path: nextPath, offset: 0 },
                        focus: { path: nextPath, offset: sign.length },
                      },
                    });
                  }

                  Editor.removeMark(editor, MARKDOWN_SIGN[sign]);
                  return;
                }
              }
            }
          }

          const { anchor } = selection;
          const block = Editor.above(editor, {
            match: (n: any) => Editor.isBlock(editor, n),
          });
          const path = block ? block[1] : [];
          const start = Editor.start(editor, path);
          const range = { anchor, focus: start };
          const beforeText = Editor.string(editor, range);
          const type = /^\d+\.$/.test(beforeText) ? ELTYPE.OLLIST : SHORTCUTS[beforeText];

          const curEl: any = Node.get(editor, path);
          const oldType = curEl.type;
          console.log(`oldType`, type, curEl, oldType);
          let skip = false;
          if (editor.selection.anchor.path.length > 4) {
            if (type === ELTYPE.DIVIDE) {
              skip = true;
            }
          }
          if (skip) {
          } else if (type) {
            Transforms.select(editor, range);
            Transforms.delete(editor);
            const newProperties: any = {
              type,
            };
            if (type === ELTYPE.DIVIDE) {
              insertDivide(editor);
              const next = [Range.end(editor.selection).path[0] + 1];
              Transforms.select(editor, next);

              return;
            }

            if (type === ELTYPE.CODE_BLOCK) {
              insertCodeBlock(editor, selection.focus.path);
              return;
            }

            if (type === ELTYPE.ULLIST) {
              insertOl(editor, ELTYPE.ULLIST);
              if (HEADING_TYPES.includes(oldType)) {
                Transforms.setNodes(
                  editor,
                  {
                    ...newProperties,
                    oldType,
                  },
                  {
                    match: (n: any) => Editor.isBlock(editor, n),
                  }
                );
              }

              return;
            }

            if (type === ELTYPE.OLLIST) {
              if (appandList(editor, type, beforeText)) {
                return;
              }

              insertOl(editor, type);
              if (HEADING_TYPES.includes(oldType)) {
                Transforms.setNodes(
                  editor,
                  {
                    ...newProperties,
                    oldType,
                  },
                  {
                    match: (n: any) => Editor.isBlock(editor, n),
                  }
                );
              }

              return;
            }
            Transforms.setNodes(editor, newProperties);
            if (HEADING_TYPES.includes(type)) {
              getEditorEventEmitter(editor.docId).emit('updateOutlineAnchor', editor.docId);
            }
            return;
          }
        }
      }
    }

    insertText(text);
  };

  editor.insertBreak = () => {
    const { selection } = editor;
    if (selection) {
      const curNode: any = Node.get(editor, selection.focus.path);
      const texts = curNode?.text as string;

      for (const sign in MARKDOWN_SIGN) {
        if (texts.endsWith(sign)) {
          const reverseArr = texts.split('').reverse();
          reverseArr.splice(0, sign.length);
          const reverseTexts = reverseArr.join('');
          if (reverseTexts.indexOf(sign) !== -1) {
            const reversePos = reverseTexts.indexOf(sign);
            const start = reverseTexts.length - reversePos;
            const end = reverseTexts.length;
            Transforms.select(editor, {
              anchor: { path: selection.anchor.path, offset: start },
              focus: { path: selection.focus.path, offset: end },
            });
            Editor.addMark(editor, MARKDOWN_SIGN[sign], true);
            Transforms.collapse(editor, { edge: 'focus' });
            for (let i = 0; i < sign.length; i++) {
              editor.deleteForward('charactor');
            }
            Transforms.delete(editor, {
              at: {
                anchor: {
                  path: selection.anchor.path,
                  offset: start - sign.length,
                },
                focus: { path: selection.anchor.path, offset: start },
              },
              unit: 'character',
            });
            Editor.removeMark(editor, MARKDOWN_SIGN[sign]);
            insertBreak();
            return;
          }
        }
      }

      const match = Editor.above(editor, {
        match: (n: any) => Editor.isBlock(editor, n),
      });
    }

    insertBreak();
  };

  editor.deleteBackward = (...args: any) => {
    const { selection } = editor;

    if (selection && ReactEditor.hasRange(editor, selection) && Range.isCollapsed(selection)) {
      const match = Editor.above(editor, {
        match: (n: any) => Editor.isBlock(editor, n),
      });

      deleteBackward(...args);
    }
  };

  return editor;
};

function appandList(editor, type, beforeText: string) {
  const numStr = beforeText?.split('.')?.[0];
  if (Range.isCollapsed(editor.selection) && numStr && numStr.match(/\d+/)) {
    const num = parseInt(numStr);
    let tPathParent = [];
    let tPath = editor.selection.anchor.path.slice(0, -1);
    if (editor.selection.anchor.path.length > 2) {
      tPathParent = editor.selection.anchor.path.slice(0, -2);
    }
    const curNodeEntry = Editor.nodes(editor, {
      at: tPathParent,
      match: (n: any, path: number[]) => {
        return n?.type === ELTYPE.OLLIST && Path.isBefore(path, tPath);
      },
      reverse: true,
    }).next().value;
    const node = curNodeEntry?.[0];
    if (node && num === node?.num + 1) {
      const employee = storage.get('userInfo')?.employee;
      const id = node.id;

      insertOl(editor, {
        type: type,
        tabLevel: 0,
        num: num,
        id: id,
        authCls: 'auth-' + employee,
        elId: createUUID(),
      });
      return true;
    }
  }
  return false;
}
