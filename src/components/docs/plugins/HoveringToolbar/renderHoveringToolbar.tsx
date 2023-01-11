import { ShareAltOutlined } from '@ant-design/icons';
import { Dropdown, Tooltip } from 'antd';
import $ from 'jquery';
import _, { debounce, min, throttle } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Editor, Node, Path, Point, Range } from '@src/components/slate-packages/slate';
import { ReactEditor, useSlate } from '../../../slate-packages/slate-react';

import { HoverMenu, IconBtn, IconButton } from '../Components';
import { ELTYPE, INLINE_TYPES, TABBABLE_TYPES } from '../config';
import { insertEditLink } from '../EditLink';
import { isSameLineSelection } from '../pluginsUtils/selectionUtils';
import { SideCommentButton, FontButton, MarkButton, ShareButton } from './buttons';
import { dropdownMenuColor } from './dropdownMenus';
import { getColorMark, toggleMark } from './mark';
import { getCache, setCache } from '@src/utils/cacheUtils';
import { getParentPathByTypes } from '../pluginsUtils/getPathUtils';
import { getSelectionFromDomSelection } from '@src/components/slate-packages/slate-react/components/editable';
import { f } from '@src/resource/string';

export const HoveringToolbar = (props: any) => {
  const {
    shareCallback,
    showToolbar,
    editorId,
    currentColor,
    setCurrentColor,
    setSideCommentRowNum,
    setCurRangeId,
    isMobile,
    isShowHoveringCommentButton,
  } = props;

  const ref = useRef<HTMLDivElement | null>();
  const editor: any = useSlate();
  const [select, setSelect] = useState(editor.selection);
  const [visible, setVisible] = useState({
    fontColorVisible: false,
    bgColorVisible: false,
    cellBgColorVisible: false,
    cellBgColor: 'rgb(0, 255, 0)',
  });

  const bgColorClick = () => {
    Editor.addMark(editor, 'backgroundColor', currentColor.bgColor);
  };

  const fontColorClick = () => {
    Editor.addMark(editor, 'fontColor', currentColor.fontColor);
  };

  const compareWidth = () => {
    if (window.innerWidth < 768) {
      return 10;
    } else if (window.innerWidth >= 768 && window.innerWidth < 992) {
      return -50;
    } else {
      return -200;
    }
  };

  const handleChange = (value: any) => {
    console.log(value);
    const selection = select;
    if (selection && ReactEditor.hasRange(editor, selection) && min([selection.anchor.path[0], selection.focus.path[0]]) !== 0) {
      toggleMark(editor, value);
    }
  };
  const isInElectron: boolean = getCache(editor?.docId, 'options')?.isInElectron;

  useEffect(() => {
    const handleMouseUp = () => {
      if (getCache(editor.docId, 'mouseIsPress')) {
        return;
      }
      const selection: any = editor && editor.selection;

      const el = ref.current;

      if (!el) {
        return;
      }
      if (!selection || !ReactEditor.isFocused(editor) || Range.isCollapsed(selection) || Editor.string(editor, selection) === '') {
        el.removeAttribute('style');
        return;
      }
      if (isMobile && ReactEditor.isReadOnly(editor)) {
        el.style.display = 'none';
        return;
      }
      const domSelection = window.getSelection();
      const { anchorNode, focusNode } = domSelection;
      if (!domSelection || !anchorNode || !focusNode) {
        return;
      }
      const [focusParentPath, anchorParentPath] = [
        getParentPathByTypes(editor, selection.focus.path, TABBABLE_TYPES),
        getParentPathByTypes(editor, selection.anchor.path, TABBABLE_TYPES),
      ];

      console.log(focusParentPath, anchorParentPath);
      const isAbove = Point.isAfter(selection.anchor, selection.focus);
      const domRange = domSelection.getRangeAt(0);
      const rect = domRange.getBoundingClientRect();
      el.style.transition = 'opacity 0.4s ease-in-out';
      el.style.position = 'absolute';
      el.style.lineHeight = '1';
      const editorRect = $(`#${editorId}`)[0].getBoundingClientRect();
      console.log('[handleMouseUp]', editor.selection);
      if (editor.selection === null || (editor && Range.isCollapsed(editor.selection))) {
        return;
      }
      const curNode: any = Editor.above(editor, selection) && Editor.above(editor, selection)[0];
      if (
        curNode
          ? !(
              (curNode.clientId && selection && ReactEditor.hasRange(editor, selection) && !_.isEqual(selection.focus.path, selection.anchor.path)) ||
              curNode.type === ELTYPE.TABLE
            )
          : true
      ) {
        el.style.opacity = '1';
        el.style.zIndex = '1000';
        el.style.top = isAbove ? `${rect.top - editorRect.top + 40}px` : `${rect.bottom - editorRect.top + 90}px`;

        let leftOffset = window.innerWidth - (rect.left + window.pageXOffset) - 420;
        if (0 < leftOffset) {
          leftOffset = 0;
        }

        el.style.left = `${rect.left - editorRect.left + leftOffset}px`;
      }
    };

    const handleMouseMove = _.debounce(() => setTimeout(handleMouseUp, 200), 220);
    const editorEl = ReactEditor.toDOMNode(editor, editor);

    function mouseUp() {
      setCache(editor.docId, 'mouseIsPress', false);
      handleMouseUp();
      const el = ref.current;
      setTimeout(() => {
        if (el && editor && editor.selection && ReactEditor.hasRange(editor, editor.selection) && !Range.isCollapsed(editor.selection)) {
          el.style.display = 'flex';
        }
      }, 100);
    }
    function mouseDown() {
      setCache(editor.docId, 'mouseIsPress', true);
      const el = ref.current;
      if (el) {
        el.style.display = 'none';
      }
    }
    editorEl.addEventListener('mouseup', mouseUp);
    editorEl.addEventListener('mousedown', mouseDown);
    document.addEventListener('selectionchange', handleMouseMove);
    console.log('[handleMouseUp] init', editorEl);

    return () => {
      setCache(editor.docId, 'mouseIsPress', false);
      editorEl.removeEventListener('mouseup', mouseUp);
      editorEl.removeEventListener('mousedown', mouseDown);
      document.removeEventListener('selectionchange', handleMouseMove);
    };
  }, []);
  const en = 'en';
  return (
    <HoverMenu className="hovering-toolbar-wrap" ref={ref}>
      {}
      <Tooltip title={`${f('bold')}（Ctrl+B）`}>
        <MarkButton format="bold" editor={editor} icon="Tripdocs-bold" />
      </Tooltip>
      <Tooltip title={`${f('italic')}（Ctrl+I）`}>
        <MarkButton format="italic" editor={editor} icon="Tripdocs-italic" />
      </Tooltip>
      <Tooltip title={`${f('underline')}（Ctrl+U）`}>
        <MarkButton format="underline" editor={editor} icon="Tripdocs-underline" />
      </Tooltip>
      <Tooltip title={`${f('strikethrough')}（Ctrl+Shift+X）`}>
        <MarkButton format="strikethrough" editor={editor} icon="Tripdocs-strikethrough" />
      </Tooltip>
      <Tooltip title={`${f('code')}（Ctrl+E）`}>
        <MarkButton format="code" editor={editor} icon="Tripdocs-code_braces" />
      </Tooltip>
      <Tooltip title={`${f('link')}`}>
        <IconButton
          style={{ display: !isSameLineSelection(editor.selection) ? 'none' : null }}
          onMouseDown={(e: any) => {
            e.preventDefault();
            const sel = editor.selection;
            if (editor && editor.selection && ReactEditor.hasRange(editor, editor.selection) && !isSameLineSelection(editor.selection)) {
              return;
            }
            insertEditLink(editor, '', sel);
            return;
          }}
        >
          <IconBtn className="Tripdocs-add_link"></IconBtn>
        </IconButton>
      </Tooltip>
      {}
      <Dropdown
        overlay={dropdownMenuColor(
          editor,
          'fontColor',
          flag => setCurrentColor({ ...currentColor, fontColor: flag }),
          getColorMark(editor, 'fontColor')
        )}
        visible={visible.fontColorVisible}
        onVisibleChange={flag => setVisible({ ...visible, fontColorVisible: flag })}
      >
        <IconButton
          fontColor={currentColor.fontColor}
          onMouseDown={(e: any) => {
            e.preventDefault();
            fontColorClick();
          }}
        >
          <IconBtn className="Tripdocs-text_color"></IconBtn>
        </IconButton>
      </Dropdown>
      <Dropdown
        overlay={dropdownMenuColor(
          editor,
          'backgroundColor',
          flag => setCurrentColor({ ...currentColor, bgColor: flag }),
          getColorMark(editor, 'backgroundColor')
        )}
        visible={visible.bgColorVisible}
        onVisibleChange={flag => setVisible({ ...visible, bgColorVisible: flag })}
      >
        <IconButton
          backgroundColor={currentColor.bgColor}
          onMouseDown={(e: any) => {
            e.preventDefault();
            bgColorClick();
          }}
        >
          <IconBtn className="Tripdocs-highlight_fill"></IconBtn>
        </IconButton>
      </Dropdown>
      <Tooltip title={`${f('increaseFontSize')}`}>
        <FontButton format="fontSizeLarger" icon="Tripdocs-zoom_in" />
      </Tooltip>
      <Tooltip title={`${f('decreaseFontSize')}`}>
        <FontButton format="fontSizeSmaller" icon="Tripdocs-zoom_out" />
      </Tooltip>
      {}
      {isShowHoveringCommentButton ? (
        <Tooltip title={`${f('addComment')}`}>
          <SideCommentButton
            icon="Tripdocs-comment_add"
            setSideCommentRowNum={setSideCommentRowNum}
            setCurRangeId={setCurRangeId}
            editorId={editorId}
          />
        </Tooltip>
      ) : null}
      {!isInElectron && (
        <Tooltip title={`${f('share')}`}>
          <ShareButton icon={<IconBtn className="Tripdocs-share" />} editor={editor} callback={shareCallback} />
        </Tooltip>
      )}
    </HoverMenu>
  );
};

export const HoveringCommentButton = (props: any) => {
  const { editorId, width, setSideCommentRowNum, setCurRangeId, isShowHoveringCommentButton, isMobile } = props;

  const ref = useRef<HTMLDivElement | null>();
  const targetRef = useRef(null);
  const editor: any = useSlate();

  useEffect(() => {
    const onDOMSelectionChange = debounce(e => {
      console.log('HoveringCommentButton onDOMSelectionChange');
      const domSelection = window.getSelection();
      const domSel = getSelectionFromDomSelection(editor, domSelection);
      const el = ref.current;
      if (!domSel) {
        hideComment(el);
        return;
      }
      const { anchor, focus } = domSel;
      if (!anchor || !focus) {
        hideComment(el);
        return;
      }

      const editorDom = document.getElementById(editorId);

      const editorInlineContainerDom = editorDom?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement;

      const isInline = editorInlineContainerDom?.classList?.contains('inline-editor-container');
      const isFocused = editorInlineContainerDom?.classList?.contains('inline-editor-container-focused');
      const inTable = isInTable(editor, domSel);
      const isNotL = isNotLine(domSel);
      const isInlineEl = isInlineElement(editor, domSel);

      console.log('onDOMSelectionChange', el, domSel, inTable);
      if (
        !el ||
        domSelection.isCollapsed ||
        domSel?.anchor?.path[0] === 0 ||
        (isInline && !isFocused) ||
        (isMobile && ReactEditor.isReadOnly(editor)) ||
        isNotL ||
        inTable ||
        isInlineEl
      ) {
        hideComment(el);
        return;
      }
      const domRange = domSelection.getRangeAt(0);
      const rect = domRange.getBoundingClientRect();
      const editorRect = editorDom?.getBoundingClientRect();

      if (editorRect.width !== rect.width + 120) {
        const INPUT_EDITOR_HEIGHT = 68;

        el.style.display = 'flex';
        el.style.opacity = '1';
        el.style.zIndex = '1000';
        el.style.top = `${rect.top - editorRect.top + INPUT_EDITOR_HEIGHT - 25}px`;
        el.style.left = `${rect.left + rect.width / 2 - editorRect.left}px`;
      }
    }, 300);
    const hideComment = el => {
      if (el && el.style) {
        el.style.opacity = '0';
        el.style.display = 'none';
      }
    };
    const isInTable = (editor, sel) => {
      let ret = null;
      if (sel) {
        ret = Editor.above(editor, {
          at: sel,
          match: (n: any) => n.type === ELTYPE.TABLE,
        });
      }
      return ret;
    };
    const isNotLine = sel => {
      const res = Path.equals(sel.focus.path.slice(0, -1), sel.anchor.path.slice(0, -1));
      console.log('isNotLine', sel, res);
      return !res;
    };
    const isInlineElement = (editor, sel) => {
      const [start, end] = Range.edges(sel);
      const startNext = Editor.next(editor, { at: start });
      const endPrev = Editor.previous(editor, { at: end });

      if (startNext?.[1] && endPrev?.[1] && Path.equals(startNext[1], endPrev[1])) {
        const parent = Editor.parent(editor, startNext[1]);
        const el: any = parent?.[0];
        if (INLINE_TYPES.includes(el?.type)) {
          return true;
        }
        return false;
      }
    };
    const isMdEditor = getCache(editor?.docId, 'options')?.isMdEditor;
    if (isMdEditor) return;
    if (width) {
      document.addEventListener('mousedown', onDOMSelectionChange);
      document.addEventListener('mouseup', onDOMSelectionChange);
      document.addEventListener('selectionchange', onDOMSelectionChange);
    }
    return function () {
      document.removeEventListener('mousedown', onDOMSelectionChange);
      document.removeEventListener('mouseup', onDOMSelectionChange);
      document.removeEventListener('selectionchange', onDOMSelectionChange);
    };
  }, [width]);

  return isShowHoveringCommentButton ? (
    <HoverMenu className="hovering-toolbar-wrap" ref={ref}>
      <SideCommentButton icon="Tripdocs-comment_add" setSideCommentRowNum={setSideCommentRowNum} editorId={editorId} setCurRangeId={setCurRangeId} />
    </HoverMenu>
  ) : null;
};
