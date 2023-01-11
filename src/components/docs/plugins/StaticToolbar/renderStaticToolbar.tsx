import { css, cx } from '@emotion/css';
import { Editor, Node, Range, Transforms } from '@src/components/slate-packages/slate';
import { f } from '@src/resource/string';
import { getCache } from '@src/utils/cacheUtils';
import { SEL_CELLS } from '@src/utils/weak-maps';
import { Dropdown, Tooltip } from 'antd';
import $ from 'jquery';
import _ from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { TripdocsSdkContext } from '../../../../Docs';
import { ReactEditor } from '../../../slate-packages/slate-react';
import { IconBtn, IconButton } from '../../plugins/Components';
import { ELTYPE } from '../../plugins/config';
import { insertEditLink } from '../../plugins/EditLink';
import { colorChoice, dropdownMenuColor, FormatButton, getColorMark, MarkButton } from '../../plugins/HoveringToolbar';
import { isSameLineSelection } from '../../plugins/pluginsUtils/selectionUtils';
import { getEditorEventEmitter } from '../table/selection';
import {
  AlignSelectButton,
  BlockIconButton,
  CardMenuButton,
  FileButton,
  FontLetterSelectButton,
  LineHeightSelectButton,
  SizeSelectButton,
  StaticToolbarMoreMenuButton,
  TabButton,
  TocButton,
  ToolbarArrowButton,
  ToolbarButton,
  TypeSelectButton,
  VersionButton,
} from './buttons';

const noOpHandler = e => {
  e.preventDefault();
  e.stopPropagation();
  return false;
};

export const isTableUnbordered = (editor: ReactEditor) => {
  if (!editor) return false;
  const { selection } = editor;
  const [table] = Editor.nodes(editor, { match: (n: any) => n.type === 'table' });
  if (table && selection) {
    return table[0]['unbordered'];
  }
  return false;
};

export const StaticToolbar = ({
  editor,
  editorSelection,
  docWidth,
  modalState,
  currentColor,
  setCurrentColor,
  anchorTrigger,
  setValue,
  isShowAnchor,
  setIsShowAnchor,
}: any) => {
  const { isReadOnly, docId } = React.useContext(TripdocsSdkContext);
  const { elementPath, elementType } = editorSelection;
  const isInElectron: boolean = getCache(editor?.docId, 'options')?.isInElectron;

  const [isTitle, setIsTitle] = useState(elementType === 'heading-one' && elementPath[0] === 0);
  const [visible, setVisible] = useState({
    fontColorVisible: false,
    bgColorVisible: false,
    cellBgColorVisible: false,
  });
  const sel = editor && editor.selection;
  const [docSelection, setDocSelection] = useState(null);

  const [isTable, setIsTable] = useState({
    hasSelCells: SEL_CELLS.get(editor)?.length > 0,
    cursorInTable: elementPath.length > 4,
    both: SEL_CELLS.get(editor)?.length > 0 || elementPath.length > 4,
  });

  const selectionHandler = useCallback(
    _.debounce(() => {
      editor?.selection && setDocSelection(editor.selection);
    }, 50),
    [editor]
  );

  useEffect(() => {
    document.addEventListener('selectionchange', selectionHandler);
    return () => {
      document.removeEventListener('selectionchange', selectionHandler);
    };
  }, [editor]);

  useEffect(() => {
    console.log('DOC_SEL', docSelection, docSelection?.focus?.path[0] === 0);

    if (docSelection?.focus?.path[0] === 0 || !docSelection) {
      $(`#editorContainer-${docId} .header-static-toolbar`).addClass('disabled-static-toolbar');
    } else {
      $(`#editorContainer-${docId} .header-static-toolbar`).removeClass('disabled-static-toolbar');
    }

    const elPath = editor?.selection?.anchor?.path;

    setIsTable({
      hasSelCells: SEL_CELLS.get(editor)?.length > 0,
      cursorInTable: elPath?.length > 4,
      both: SEL_CELLS.get(editor)?.length > 0 || elPath?.length > 4,
    });

    return () => {};
  }, [docSelection]);

  useEffect(() => {
    setIsTitle(elementType === 'heading-one' && elementPath[0] === 0);
  }, [elementPath, elementType]);

  const cellBgColorClick = () => {
    const selectedCells = SEL_CELLS.get(editor);

    if (selectedCells?.length > 0) {
      for (let cell of selectedCells) {
        Transforms.setNodes(editor, { cellBackgroundColor: currentColor.cellBgColor } as Partial<Node>, { at: cell[1] });
      }
    } else {
      editor.selection &&
        ReactEditor.hasRange(editor, editor.selection) &&
        editor.selection.focus.path.length === 6 &&
        Transforms.setNodes(editor, { cellBackgroundColor: currentColor.cellBgColor } as Partial<Node>, {
          at: editor.selection.focus.path.slice(0, 4),
        });
    }
  };

  const bgColorClick = () => {
    colorChoice(editor, 'backgroundColor', currentColor.bgColor);
  };

  const fontColorClick = () => {
    colorChoice(editor, 'fontColor', currentColor.fontColor);
  };

  const resetClick = () => {
    const selectedCells = SEL_CELLS.get(editor);

    if (selectedCells?.length > 0) {
      for (let cell of selectedCells) {
        Transforms.setNodes(editor, { cellBackgroundColor: null } as Partial<Node>, { at: cell[1] });
      }
    } else {
      editor?.selection &&
        ReactEditor.hasRange(editor, editor.selection) &&
        editor.selection.focus.path.length === 6 &&
        Transforms.setNodes(editor, { cellBackgroundColor: null } as Partial<Node>, { at: editor.selection.focus.path.slice(0, 4) });
    }
  };

  const [shouldShrink, setShouldShrink] = useState(false);

  useEffect(() => {
    const SHRINK_THRESHOLD = { LARGE: 1200, MIDDLE: 811 };

    const contentWrapListener = rect => {
      if (rect.width <= SHRINK_THRESHOLD.LARGE) {
        setShouldShrink(true);
      } else if (rect.width > SHRINK_THRESHOLD.LARGE) {
        setShouldShrink(false);
      }
    };

    getEditorEventEmitter(docId).on('resizeContentWrap', contentWrapListener, docId);
    return () => {
      getEditorEventEmitter(docId).off('resizeContentWrap', contentWrapListener, docId);
    };
  }, [docId]);

  const en = 'en';
  return (
    <div
      className={cx(
        'header-static-toolbar',
        css`
          .ant-dropdown-open {
            background-color: rgba(50, 100, 255, 0.1);
            color: rgb(50, 100, 255);
          }
        `
      )}
      style={{
        pointerEvents: isReadOnly ? 'none' : 'auto',
        filter: isReadOnly ? 'opacity(0.5)' : 'none',
      }}
      onMouseDown={(e: any) => {
        e.preventDefault();
      }}
    >
      <CardMenuButton
        editor={editor}
        editorSelection={editorSelection}
        docWidth={docWidth}
        modalState={modalState}
        isDisabled={isTable.hasSelCells}
      />
      <span className="static-toolbar__line"></span>

      {}
      <FileButton
        title={f('undo')}
        icon={<IconBtn className="Tripdocs-repeal" />}
        callback={() => {
          editor.undo();
        }}
        style={{
          cursor: editor && editor.history.undos.length === 0 ? 'not-allowed' : null,
          opacity: editor && editor.history.undos.length === 0 ? '0.4' : null,
        }}
      />
      <FileButton
        title={f('redo')}
        icon={<IconBtn className="Tripdocs-redo" />}
        callback={() => {
          editor.redo();
        }}
        style={{
          cursor: editor && editor.history.redos.length === 0 ? 'not-allowed' : null,
          opacity: editor && editor.history.redos.length === 0 ? '0.4' : null,
        }}
      />
      <ToolbarButton title={f('cleanFormatting')} button={<FormatButton editor={editor} format="reset" onClick={resetClick} />} />
      <ToolbarButton title={f('paintFormat')} button={<FormatButton editor={editor} format="copy" />} />

      <span className="static-toolbar__line"></span>
      <SizeSelectButton editor={editor} anchorTrigger={anchorTrigger} />
      <FontLetterSelectButton editor={editor} anchorTrigger={anchorTrigger} />
      <TypeSelectButton editor={editor} anchorTrigger={anchorTrigger} />

      <>
        <ToolbarButton title={`${f('bold')}（Ctrl+B）`} button={<MarkButton editor={editor} format="bold" icon="Tripdocs-bold" />} />
        <ToolbarButton title={`${f('italic')}（Ctrl+I）`} button={<MarkButton format="italic" editor={editor} icon="Tripdocs-italic" />} />
        <ToolbarButton title={`${f('underline')}（Ctrl+U）`} button={<MarkButton format="underline" editor={editor} icon="Tripdocs-underline" />} />
        <ToolbarButton
          title={`${f('strikethrough')}（Ctrl+Shift+X）`}
          button={<MarkButton format="strikethrough" editor={editor} icon="Tripdocs-strikethrough" />}
        />
        <ToolbarButton title={`${f('code')}（Ctrl+E）`} button={<MarkButton format="code" editor={editor} icon="Tripdocs-code_braces" />} />
        <ToolbarArrowButton
          button={
            <div className="toolbar-color-button-wrap">
              <Tooltip title={`${f('fontColor')}`}>
                <IconButton
                  className="embedded-color-button"
                  fontColor={currentColor.fontColor}
                  onMouseDown={(e: any) => {
                    e.preventDefault();
                    fontColorClick();
                  }}
                >
                  <IconBtn className="Tripdocs-text_color"></IconBtn>
                </IconButton>
              </Tooltip>
              <Dropdown
                overlay={dropdownMenuColor(
                  editor,
                  'fontColor',
                  flag => setCurrentColor({ ...currentColor, fontColor: flag }),
                  getColorMark(editor, 'fontColor')
                )}
                trigger={['click']}
                visible={visible.fontColorVisible}
                onVisibleChange={flag => setVisible({ ...visible, fontColorVisible: flag })}
              >
                <button className="embedded-arrow-button">
                  <IconBtn className="Tripdocs-drop_down_fill" style={{ fontSize: '14px' }}></IconBtn>
                </button>
              </Dropdown>
            </div>
          }
        />
        <ToolbarArrowButton
          button={
            <div className="toolbar-color-button-wrap">
              <Tooltip title={`${f('bgColor')}`}>
                <IconButton
                  className="embedded-color-button"
                  backgroundColor={currentColor.bgColor}
                  onMouseDown={(e: any) => {
                    e.preventDefault();
                    bgColorClick();
                  }}
                >
                  <IconBtn className="Tripdocs-highlight_fill"></IconBtn>
                </IconButton>
              </Tooltip>
              <Dropdown
                overlay={dropdownMenuColor(
                  editor,
                  'backgroundColor',
                  flag => setCurrentColor({ ...currentColor, bgColor: flag }),
                  getColorMark(editor, 'backgroundColor')
                )}
                trigger={['click']}
                visible={visible.bgColorVisible}
                onVisibleChange={flag => setVisible({ ...visible, bgColorVisible: flag })}
              >
                <button className="embedded-arrow-button">
                  <IconBtn className="Tripdocs-drop_down_fill" style={{ fontSize: '14px' }}></IconBtn>
                </button>
              </Dropdown>
            </div>
          }
        />
        <span className="static-toolbar__line"></span>
      </>
      {}

      {isTable.both && (
        <>
          {}
          <ToolbarArrowButton
            button={
              <div className="toolbar-color-button-wrap">
                <Tooltip title={`${f('tableCellBg')}`}>
                  <IconButton
                    className="embedded-color-button"
                    cellBgColor={currentColor.cellBgColor}
                    onMouseDown={(e: any) => {
                      e.preventDefault();
                      cellBgColorClick();
                    }}
                  >
                    <IconBtn className="Tripdocs-cell_color_fill" style={{ marginTop: -2 }}></IconBtn>
                  </IconButton>
                </Tooltip>
                <Dropdown
                  overlay={dropdownMenuColor(
                    editor,
                    'cellBackgroundColor',
                    flag => setCurrentColor({ ...currentColor, cellBgColor: flag }),
                    getColorMark(editor, 'cellBackgroundColor')
                  )}
                  visible={visible.cellBgColorVisible}
                  onVisibleChange={flag => setVisible({ ...visible, cellBgColorVisible: flag })}
                  trigger={['click']}
                >
                  <button className="embedded-arrow-button">
                    <IconBtn className="Tripdocs-drop_down_fill" style={{ fontSize: '14px' }}></IconBtn>
                  </button>
                </Dropdown>
              </div>
            }
          />

          <ToolbarButton
            title={isTableUnbordered(editor) ? `${f('showBorder')}` : `${f('hideBorder')}`}
            button={
              <IconButton
                active={isTableUnbordered(editor)}
                onMouseDown={(e: any) => {
                  e.preventDefault();
                  const sel = editor.selection;
                  if (sel && sel.focus.path.length > 3) {
                    const [tableNode, tablePath]: any = Editor.node(editor, [sel.focus.path[0], 1]);
                    console.log(sel, tableNode, tablePath);

                    if (tableNode.unbordered) {
                      Transforms.setNodes(editor, { unbordered: null } as Partial<Node>, { at: tablePath });
                    } else {
                      Transforms.setNodes(editor, { unbordered: true } as Partial<Node>, { at: tablePath });
                    }
                  }
                }}
              >
                <IconBtn className={`Tripdocs-no_border`}></IconBtn>
              </IconButton>
            }
          />
          {}
          <span className="static-toolbar__line"></span>
          <AlignSelectButton editor={editor} isVertical />
        </>
      )}

      {}
      <AlignSelectButton editor={editor} />

      {shouldShrink ? (
        <StaticToolbarMoreMenuButton
          editor={editor}
          editorSelection={editorSelection}
          docWidth={docWidth}
          modalState={modalState}
          setValue={setValue}
          isShowAnchor={isShowAnchor}
          setIsShowAnchor={setIsShowAnchor}
          isDisabled={docSelection?.focus?.path[0] === 0 || !docSelection}
          hasSelCells={isTable.hasSelCells}
        />
      ) : (
        <>
          <ToolbarButton
            title={`${f('numberedList')}`}
            button={<BlockIconButton format={ELTYPE.OLLIST} icon="Tripdocs-ordered" editor={editor} isDisabled={isTable.hasSelCells} />}
            isDisabled={isTable.hasSelCells}
          />
          <ToolbarButton
            title={`${f('bulletedList')}`}
            button={<BlockIconButton format={ELTYPE.ULLIST} icon="Tripdocs-unordered" editor={editor} isDisabled={isTable.hasSelCells} />}
            isDisabled={isTable.hasSelCells}
          />
          <ToolbarButton
            title={`${f('toDoList')}（Ctrl+Alt+T）`}
            button={<BlockIconButton format={ELTYPE.TODO_LIST} icon="Tripdocs-checkbox_selected" editor={editor} isDisabled={isTable.hasSelCells} />}
            isDisabled={isTable.hasSelCells}
          />
          <LineHeightSelectButton editor={editor} />
          <ToolbarButton
            title={`${f('quote')}`}
            button={<BlockIconButton format={ELTYPE.BLOCK_QUOTE} icon="Tripdocs-quote" editor={editor} isDisabled={isTable.hasSelCells} />}
            isDisabled={isTable.hasSelCells}
          />
          <ToolbarButton
            title={`${f('link')}`}
            button={<IconBtn className={`Tripdocs-add_link`} style={{ fontSize: 16 }}></IconBtn>}
            isDisabled={
              (editor &&
                editor.selection &&
                Range.isRange(editor.selection) &&
                ReactEditor.hasRange(editor, editor.selection) &&
                !isSameLineSelection(editor.selection)) ||
              isTable.hasSelCells
            }
            onMouseDown={e => {
              e.preventDefault();
              if (
                editor &&
                editor.selection &&
                Range.isRange(editor.selection) &&
                ReactEditor.hasRange(editor, editor.selection) &&
                !isSameLineSelection(editor.selection)
              ) {
                return;
              }

              insertEditLink(editor, '', sel);
              return;
            }}
          />

          <span className="static-toolbar__line"></span>

          <ToolbarButton
            title={`${f('increaseIndentation')}（Tab）`}
            button={<TabButton icon={<IconBtn className="Tripdocs-outdent" />} editor={editor} />}
          />
          <ToolbarButton
            title={`${f('decreaseIndentation')}（Shift+Tab）`}
            button={<TabButton isDecrease icon={<IconBtn className="Tripdocs-lnent" />} editor={editor} />}
          />
          {}

          {}
          <span className="static-toolbar__line"></span>

          {!isInElectron && (
            <ToolbarButton
              title={`${f('historyVersion')}（Alt+H）`}
              buttonClass={'version-btn'}
              button={<VersionButton icon={<IconBtn className="Tripdocs-history" />} editor={editor} setValue={setValue} />}
            />
          )}

          <ToolbarButton
            title={isShowAnchor ? `${f('hideOutline')}` : `${f('showOutline')}`}
            buttonClass={'toc-btn'}
            button={
              <TocButton icon={<IconBtn className="Tripdocs-menu" />} editor={editor} setIsShowAnchor={setIsShowAnchor} isShowAnchor={isShowAnchor} />
            }
          />
        </>
      )}
    </div>
  );
};
