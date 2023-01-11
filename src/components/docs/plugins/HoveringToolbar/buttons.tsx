import { ClearOutlined, FormatPainterOutlined } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { min } from 'lodash';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Editor, Node, Range, Transforms, Text, NodeEntry, Point, Path } from '@src/components/slate-packages/slate';
import { isRGBLight } from '../../../../utils/hexColorUtils';
import storage from '../../../../utils/storage';
import { ReactEditor, useSlate } from '../../../slate-packages/slate-react';
import { IconBtn, IconButton } from '../Components';
import { ELTYPE, TABBABLE_TYPES } from '../config';
import { createRandomId } from '../../../../utils/randomId';
import { alignToggle, isAlignActive } from './align';
import { colorChoice, colorNamesMap } from './color';
import { fontSize } from './fontSize';
import { getAllMatchedFormatNames } from './format';
import { isMarkActive, toggleMark } from './mark';
import { insertCommentStyle } from '../SideComment/commentOps';
import { TripdocsSdkContext } from '../../../../Docs';
import { isInTable } from '../withHtml';
import { getParentPathByTypes } from '../pluginsUtils/getPathUtils';
import { SEL_CELLS } from '@src/utils/weak-maps';
import { getSelectionFromDomSelection } from '@src/components/slate-packages/slate-react/components/editable';
import { getEditorEventEmitter } from '../table/selection';

export const MarkButton: React.FC<any> = ({ format, icon, editor, ...props }) => {
  const selection = editor && editor.selection;
  const markActive = editor && isMarkActive(editor, format);
  const [active, setActive] = useState(markActive);

  const isMarkActiveInCell = (format, cellPath) => {
    const [match] = Editor.nodes(editor, { at: cellPath, match: Text.isText });

    if (match) {
      const [node] = match as NodeEntry<Text>;
      const { text, ...rest } = node;
      return rest && rest[format];
    } else {
      return false;
    }
  };

  useEffect(() => {
    setActive(markActive);
  }, [markActive]);

  return (
    <IconButton
      {...props}
      active={active}
      onMouseDown={(event: any) => {
        event.preventDefault();
        console.log('[MarkButton]0', selection, isMarkActive(editor, format));
        const selCells = SEL_CELLS.get(editor);
        if (selCells && selCells.length > 0) {
          const firstCellEntry = selCells[0];
          const [, firstCellPath] = firstCellEntry;
          const isActive = isMarkActiveInCell(format, firstCellPath);

          selCells.forEach(entry => {
            const [, path] = entry;
            console.log('toggleMark', format, entry, isActive);
            Transforms.setNodes(editor, { [format]: !isActive }, { at: path, match: Text.isText, split: true });
          });
        } else if (selection && ReactEditor.hasRange(editor, selection) && min([selection.anchor.path[0], selection.focus.path[0]]) !== 0) {
          console.log('[MarkButton]1', selection, format, editor.marks, isMarkActive(editor, format), markActive);
          toggleMark(editor, format);

          setActive(!markActive);
        }
      }}
    >
      <IconBtn className={icon}></IconBtn>
    </IconButton>
  );
};

export const FontButton: React.FC<any> = ({ format, icon, ...props }) => {
  const editor = useSlate();
  const selection = editor.selection;
  return (
    <IconButton
      {...props}
      active={false}
      onMouseDown={(event: any) => {
        event.preventDefault();
        if (selection && ReactEditor.hasRange(editor, selection) && min([selection.anchor.path[0], selection.focus.path[0]]) !== 0) {
          fontSize(editor, format);
        }
      }}
    >
      <IconBtn className={icon}></IconBtn>
    </IconButton>
  );
};

export const ColorButton: React.FC<any> = ({ editor, format, color, callback, curSelectedColor }) => {
  const selection = editor && editor.selection;
  const isSelected =
    curSelectedColor === color ||
    (format === 'backgroundColor' && color === 'rgb(255, 255, 255)' && !curSelectedColor) ||
    (format === 'fontColor' && color === 'rgb(0, 0, 0)' && !curSelectedColor) ||
    (format === 'cellBackgroundColor' && color === 'rgb(255, 255, 255)' && !curSelectedColor);
  return (
    <div
      title={colorNamesMap[color]}
      className={cx(
        format === 'fontColor' ? 'toolbar-font-colorbtn' : 'toolbar-bg-colorbtn',
        format === 'backgroundColor' && color === 'rgb(255, 255, 255)'
          ? css`
              &::before {
                content: '|';
                color: red;
                position: absolute;
                transform: rotate(-45deg) scale(2.5);
                font-weight: 100;
              }
            `
          : '',
        css`
          & {
            border-radius: 4px;
            border: solid 1px #dee0e3;
            cursor: pointer;
            margin-left: 2px;
            overflow: hidden;
            &:hover {
              outline: solid 2px rgba(180, 213, 254, 0.5);
            }
          }
        `
      )}
      style={{
        backgroundColor: color,
        width: '20px',
        height: '20px',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onMouseDown={(event: any) => {
        event.preventDefault();
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
        if (selection && ReactEditor.hasRange(editor, selection) && min([selection.anchor.path[0], selection.focus.path[0]]) !== 0) {
          colorChoice(editor, format, color);
          callback && callback(color);
        }
      }}
    >
      {isSelected ? (
        <div
          className={cx(
            'cur-selected-color-tick',
            css`
              & > svg {
                width: 14px;
                height: 14px;
                transform: translate(-1px, -1px);
              }
            `
          )}
        >
          {/* hewb ok */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="256"
            height="256"
            viewBox="0 0 256 256"
            style={{
              marginLeft: 2,
              marginTop: 6,
            }}
            fill={isRGBLight(color) ? 'rgba(0, 0, 0, .5)' : 'rgb(255, 255, 255)'}
          >
            <path d="M107.36 241.6L0 127.55l27.523-23.04 62.082 50.85c25.438-31.6 81.922-94.299 159.835-144.16L256 26.994C184.484 95.628 125.925 192.228 107.36 241.6z" />
          </svg>
        </div>
      ) : null}
    </div>
  );
};

export const AlignButton: React.FC<any> = ({ format, icon, editor, ...props }) => {
  const selection = editor && editor.selection;

  const alignActive = editor && isAlignActive(editor, format, selection);
  const [active, setActive] = useState(alignActive);

  useEffect(() => {
    if (editor?.docId) {
      getEditorEventEmitter(editor.docId).on(
        'mobileAlignButtonClick',
        fmt => {
          if (format !== fmt) {
            setActive(false);
          } else {
            setActive(true);
          }
        },
        editor.docId
      );
    }
  }, [editor?.docId]);

  return (
    <IconButton
      {...props}
      active={active}
      onMouseDown={(event: any) => {
        event.preventDefault();
        const align = format.split('-')[1];
        alignToggle(editor, align, editor.selection);
        setActive(!alignActive);
        editor?.docId && getEditorEventEmitter(editor.docId).emit('mobileAlignButtonClick', editor.docId, format);
      }}
    >
      <IconBtn className={icon}></IconBtn>
    </IconButton>
  );
};

export const SideCommentButton: React.FC<any> = ({ icon, setSideCommentRowNum, setCurRangeId, editorId, ...props }) => {
  const editor: any = useSlate();
  const { selection } = editor;
  const { setIdenticalSelectionRangeId, setWIPCommentRangeId } = useContext(TripdocsSdkContext);
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    if (selection && ReactEditor.hasRange(editor, selection) && Range.isExpanded(selection)) {
      const nodes = Editor.nodes(editor, { at: selection });
      for (const [node, path] of nodes) {
        if (node && (node as any).type && (node as any).type === 'mention') {
          setIsDisabled(true);
          break;
        }
      }

      if (isInTable(editor)) {
        setIsDisabled(true);
      }
    } else {
      setIsDisabled(false);
    }
  }, [selection]);

  useEffect(() => {
    window.tripdocs.editorsMap[editor.docId].api.addComment = function () {
      addComment(
        window.tripdocs.editorsMap[editor.docId].editor,
        setSideCommentRowNum,
        setCurRangeId,
        editorId,
        setIdenticalSelectionRangeId,
        false,
        setWIPCommentRangeId
      );
    };
  }, []);

  return isDisabled ? (
    <IconButton {...props} disabled={true}>
      <IconBtn
        className={icon}
        style={{
          color: '#a0a0a0',
        }}
      ></IconBtn>
    </IconButton>
  ) : (
    <IconButton
      {...props}
      onMouseDown={async (event: any) => {
        event.preventDefault();

        window.tripdocs.editorsMap[editor.docId].api.addComment();
      }}
    >
      <IconBtn className={icon}></IconBtn>
    </IconButton>
  );
};

export const ShareButton: React.FC<any> = ({ icon, editor, callback, ...props }) => {
  const selection = editor.selection;
  return (
    <IconButton
      {...props}
      onMouseDown={async (event: any) => {
        event.preventDefault();
        const shareInfo = {
          docUrl: '',
          targetLocation: editor.selection.focus.path.slice(0, -1),
          targetNode: Node.get(editor, editor.selection.focus.path.slice(0, -1)),
          sharer: storage.get('userInfo'),
          readOnly: false,
        };
        callback(shareInfo);
        Transforms.deselect(editor);
      }}
    >
      <IconBtn>{icon}</IconBtn>
    </IconButton>
  );
};

let count = 0;
let isDoubleClick = false;
export const FormatButton: React.FC<any> = ({ format, editor, onClick, ...props }) => {
  const selection = editor && editor.selection;
  const formats = ['backgroundColor', 'fontColor', 'code', 'underline', 'bold', 'italic', 'fontSizeChange', 'strikethrough'];
  const [copyBtnArr, setCopyBtnArr] = useState([]);
  const [copyBtnActive, setCopyBtnActive] = useState(false);

  const [copyMeta, setCopyMeta] = useState({ type: null, tabLevel: null, oldType: null, id: null });
  const copyBtnActiveRef = useRef(copyBtnActive);
  const copyBtnArrRef = useRef(copyBtnArr);
  const copyMetaRef = useRef(copyMeta);

  const mouseUpFn = () => {
    const selection = editor && editor.selection;
    const curCopyBtnActive = copyBtnActiveRef.current;
    const curCopyBtnArr = copyBtnArrRef.current;
    const curCopyMeta = copyMetaRef.current;
    if (selection && ReactEditor.hasRange(editor, selection) && min([selection.anchor.path[0], selection.focus.path[0]]) !== 0) {
      if (curCopyBtnActive) {
        const editorEl = editor && ReactEditor.toDOMNode(editor, editor);
        if (Range.isCollapsed(selection)) {
          Transforms.select(editor, selection.focus.path.slice(0, -1));
        }
        formats.forEach((format: any) => {
          Editor.removeMark(editor, format);
        });
        let fmtObj: any = {};
        curCopyBtnArr.forEach(item => Object.assign(fmtObj, item));
        for (let key in fmtObj) {
          Editor.addMark(editor, key, fmtObj[key]);
        }

        Object.values(curCopyMeta).some(item => item !== null) && Transforms.setNodes(editor, curCopyMeta as any);

        if (isDoubleClick) {
          return;
        }
        setCopyMeta({ type: null, tabLevel: null, oldType: null, id: null });
        setCopyBtnArr([]);
        setCopyBtnActive(false);
        copyBtnArrRef.current = [];
        copyBtnActiveRef.current = false;
        copyMetaRef.current = { type: null, tabLevel: null, oldType: null, id: null };
        editorEl.style.cursor = 'unset';
        Transforms.collapse(editor, { edge: 'focus' });
      }
    }
  };
  const resetCopyBtn = () => {
    const editorEl = editor && ReactEditor.toDOMNode(editor, editor);
    setCopyMeta({ type: null, tabLevel: null, oldType: null, id: null });
    setCopyBtnArr([]);
    setCopyBtnActive(false);
    copyBtnArrRef.current = [];
    copyBtnActiveRef.current = false;
    copyMetaRef.current = { type: null, tabLevel: null, oldType: null, id: null };
    editorEl.style.cursor = 'unset';
    Transforms.collapse(editor, { edge: 'focus' });
  };

  useEffect(() => {
    const editorEl = editor && ReactEditor.toDOMNode(editor, editor);
    editorEl && editorEl.addEventListener('mouseup', mouseUpFn);
    return () => {
      editorEl && editorEl.removeEventListener('mouseup', mouseUpFn);
    };
  }, [editor]);

  switch (format) {
    case 'reset':
      return (
        <IconButton
          {...props}
          active={false}
          onClick={onClick}
          onMouseDown={(event: any) => {
            event.preventDefault();
            event.stopPropagation();
            event.nativeEvent.stopImmediatePropagation();
            if (selection && ReactEditor.hasRange(editor, selection) && min([selection.anchor.path[0], selection.focus.path[0]]) !== 0) {
              formats.forEach((format: any) => {
                Editor.removeMark(editor, format);
              });
            }
          }}
        >
          <IconBtn
            className="Tripdocs-clear_format"
            style={{ fontSize: 18 }}
            onMouseDown={(e: any) => {
              e.preventDefault();
            }}
          />
        </IconButton>
      );
    case 'copy':
      return (
        <IconButton
          {...props}
          active={copyBtnActive}
          onMouseDown={(event: any) => {
            let selection = editor.selection;
            count += 1;
            setTimeout(() => {
              if (count === 1) {
                if (copyBtnActive) {
                  resetCopyBtn();
                }
                isDoubleClick = false;
              } else if (count === 2) {
                isDoubleClick = true;
              }
              count = 0;
            }, 300);

            event.preventDefault();
            if (selection && ReactEditor.hasRange(editor, selection) && min([selection.anchor.path[0], selection.focus.path[0]]) !== 0) {
              if (!copyBtnActive) {
                const nextFormatNode = Editor.nodes(editor, {
                  at: selection,
                  match: (node: any) => {
                    if (!node.text) return false;
                    const formatCount = getAllMatchedFormatNames(node, formats).length;
                    return formatCount > 0;
                  },
                }).next().value;
                if (nextFormatNode) {
                  const [node, path]: any = nextFormatNode;
                  const formatArr = getAllMatchedFormatNames(node, formats);
                  setCopyBtnArr(formatArr);
                  copyBtnArrRef.current = formatArr;
                } else {
                  setCopyBtnArr([]);
                  copyBtnArrRef.current = [];
                }

                const [curNode]: any = Editor.above(editor, { at: Editor.start(editor, selection) });

                console.log('[onDoubleClick] curNode ', curNode, selection, editor.selection);
                if (curNode.type || curNode.tabLevel) {
                  setCopyMeta({
                    type: (curNode as any).type,
                    tabLevel: (curNode as any).tabLevel,
                    oldType: (curNode as any).oldType,
                    id: (curNode as any).id,
                  }); // 设置 heading，li 等格式
                  copyMetaRef.current = {
                    type: (curNode as any).type,
                    tabLevel: (curNode as any).tabLevel,
                    oldType: (curNode as any).oldType,
                    id: (curNode as any).id,
                  };
                }
                setCopyBtnActive(true);
                copyBtnActiveRef.current = true;

                if (typeof window !== 'undefined') {
                  const editorEl = editor && ReactEditor.toDOMNode(editor, editor);
                  editorEl.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAGKADAAQAAAABAAAAGAAAAADiNXWtAAABv0lEQVRIDe2UPSiFYRTHfZavDEySQclgQ5IFJbEQWVjEqJiQUiws8rVQyGi6q8nNJlEWWdgQkyw+E4Xf/3quzn09F7eU5Z76dc75n/Pc8z7v87w3JSVp//0G0s0DjBHnwKnTVKuFdjhwWtAVIdTAPTwGi8F8GmEHQqCFYdiFSfBZK+I1bMMVVMOvbJauZ5j7oXuTerfrGcav+PrTPOIEWiaMe2pWuiO5dcINXvkX8w14cl3axXe2R7HBNTTi910c43wDYho8ic6nA7TLZleXzwddiAKnRVyqTUz8Ruyr5aJfwha8gA53FFYhC/KgCkrhFeKaBvisHFED4pneiAZrUMQyooHxiy5ewg8aXeEZ6Izk9UMyu9Nscp2FvouI+Qacu9qx89bp4HdBPcu2QKyn34DpgO5N470iNV9AiXfVx4AeW0v0FlWwWNvXEGtdNrFxogNGWLxuf4C4EIaMFrN734Ac16wraU1Xrw3WrEhcD5VOswcekYKHrIEL8ADzMADRJ2oh1g0aBmudJPrIZqAJpuDT7A50LQ9BH0wxaNERRP/0QsT6Q9POLGHXowfphRPwWh9qWaBSR94f0JLp376Bd9juSuHEZV/lAAAAAElFTkSuQmCC') 5 5,text`;
                }
              }
            }
          }}
        >
          <IconBtn className="Tripdocs-format_brush" style={{ fontSize: 18 }} />
        </IconButton>
      );
    default:
      return null;
  }
};

export function addComment(
  editor: ReactEditor,
  setSideCommentRowNum: any,
  setCurRangeId: any,
  editorId: any,
  setIdenticalSelectionRangeId: any,
  isInlineImage: boolean = false,
  setWIPCommentRangeId: any
) {
  const domSelection = window.getSelection();

  let selection = editor.selection;
  const editorOptions = window.tripdocs.editorsMap[editor.docId];
  if (!selection) {
    if (editorOptions.readOnly) {
      selection = getSelectionFromDomSelection(editor, domSelection);
    }
    console.log('[addComment] selection', selection);
    if (!selection) {
      return;
    }
  }

  let anchorSelection = null;

  const anchorRowPath = selection.anchor.path.slice(0, -1);
  const focusRowPath = selection.focus.path.slice(0, -1);

  let texts: string[] = [];
  let title = '';
  const fragments = Node.fragment(editor, selection);
  for (let i = 0; i < fragments.length; i++) {
    texts.push(Node.string(fragments[i]));
  }
  for (const str of texts) {
    title += str;
  }
  console.log('[addComment]~~[texts]', texts, selection, fragments, fragments.length);
  anchorSelection = isInlineImage ? getInnerSelection(editor, selection) : selection;

  console.log('[addComment] {title}', title, anchorSelection);

  if (isInlineImage) {
    const commentType = ELTYPE.INLINEIMAGE;
    insertCommentStyle(editor, anchorSelection, setCurRangeId, editorId, setIdenticalSelectionRangeId, setWIPCommentRangeId, title, commentType);
  } else {
    insertCommentStyle(editor, anchorSelection, setCurRangeId, editorId, setIdenticalSelectionRangeId, setWIPCommentRangeId, title);
  }

  ReactEditor.blur(editor);
  console.log('[addComment] [anchorRowPath]', anchorRowPath);
  const tabbableParentPath = getParentPathByTypes(editor, selection.anchor.path, TABBABLE_TYPES);
  if (tabbableParentPath) {
    setSideCommentRowNum(tabbableParentPath[0]);
  }

  setTimeout(() => {
    const textareaDom: HTMLElement = document.getElementsByClassName('comment-creator')[0] as HTMLElement;
    textareaDom && textareaDom.children && textareaDom.children[0] && (textareaDom.children[0] as HTMLElement).focus();
  }, 150);
}

function getInnerSelection(editor, selection) {
  if (!editor || !selection) {
    return null;
  }
  const anchorPoint = selection.anchor;
  const point = { path: Path.next(anchorPoint.path), offset: 0 };
  const inlineImageEntry = Editor.node(editor, point);
  if (inlineImageEntry) {
    const [node, path] = inlineImageEntry;
    console.log('[getInnerSelection] [inlineImageEntry]', node, path);
    if ((node as any).type === ELTYPE.INLINEIMAGE) {
      return {
        anchor: {
          path: [...path, 0],
          offset: 0,
        },
        focus: {
          path: [...path, 0],
          offset: 0,
        },
      };
    }
  }
}
