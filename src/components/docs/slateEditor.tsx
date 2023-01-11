import { css, cx } from '@emotion/css';
import { Avatar, Input, Menu, message } from 'antd';

import Modal from 'antd/lib/modal/Modal';
import isHotkey from 'is-hotkey';
import $ from 'jquery';
import _, { debounce, slice } from 'lodash';
import throttle from 'lodash/throttle';
import React, { DragEventHandler, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BasePoint, createEditor, Editor, Node as SlateNode, NodeEntry, Range, Text, Transforms } from '@src/components/slate-packages/slate';
import { v4 as anchorId } from 'uuid';
import { TripdocsSdkContext } from '../../Docs';
import '@src/style/iconfont/Tripdocs.css';
import { actionKey, applyOpt } from '../../utils/apiListener';
import { resortListener } from '../../utils/listener';
import {
  bodySelectAll,
  currentCellSelectAll,
  currentLineSelectAll,
  getStart,
  getCurrentLineEnd,
  getCurrentLineStart,
  getIsTitle,
  sliceRangToLine,
} from '../../utils/selectionUtils';
import { HistoryEditor, withHistory } from '../slate-packages/slate-history';
import { Editable, ReactEditor, RenderElementProps, RenderLeafProps, Slate, useEditor, useSlate, withReact } from '../slate-packages/slate-react';
import Caret from './caret';
import { BlockQuote, withBlockquote } from './plugins/BlockQuote';
import { Card, CardPreSuf, onKeyDownCard, withCard } from './plugins/Card';
import { CodeHighlightEditor, insertCodeBlock } from './plugins/CodeBlock';

import { ClientFrame, H1, H2, H3, H5, H6, HFour, IconBtn, Italic } from './plugins/Components';
import {
  ELTYPE,
  FORMATS,
  HAS_INLINE_IMG_ELEMENT_TYPE,
  HEADING_TYPES,
  INLINE_TYPES,
  LIST_TYPES,
  SINGLE_INLINE_TYPES,
  TABBABLE_TYPES,
} from './plugins/config';
import { Divide, onKeyDownDivide } from './plugins/Divide';
import { EditLink, EditLinkButton, withEditLink } from './plugins/EditLink/index';
import { FileComponent } from './plugins/File/filePlugins';
import { HoveringCommentButton, HoveringToolbar, onKeyDownTextMark } from './plugins/HoveringToolbar';
import { selectTargetForPath, SlateImage, withImages } from './plugins/Image/imagePlugins';
import { insertImage, dragInsertLocalFiles, insertImgFile, SlateInlineImage, withInlineImages } from './plugins/InlineImage/inlineImagePlugins';
import { decreaseIndent, increaseIndent } from './plugins/indent';
import { insertMention, MentionElement } from './plugins/Mention/mention';
import { insertNewOlFromOl, OlList, removeOl, UlList, updateOlDecreaseIndent } from './plugins/OLULList/OlList';
import { rightClickMenuActions } from './plugins/rightClickMenu';
import { withDeserializeMD } from './plugins/serializers/withDeserializeMD';
import SiderMenu, { blockMenus, DeleteSiderButton, execFormat, iconMenus } from './plugins/siderMenu';
import TableElement from './plugins/table/tableElement';
import { withTable } from './plugins/table/withTable';
import { insertVideo, SlateVideo } from './plugins/Video/SlateVideo';
import { onVideoKeydown, withVideo } from './plugins/Video/withVideo';
import { withAnchor } from './plugins/withAnchor';
import { isInTable, withHtml } from './plugins/withHtml';
import { withNormalizeNode } from './plugins/withNormalize';
import { withShortcuts } from './plugins/withShorcuts';
import { createRandomId } from '../../utils/randomId';
import { Path, Point } from '../slate-packages/slate';
import { onKeyDownMention } from './plugins/Mention/onKeyDownMention';
import { sliceRangeNoRepeateAtOnePath, selectionObj, selectionObjSlice } from '@src/utils/commentUtils';
import { quikSlice } from '@src/utils/arrayUtils';
import { withOlList } from './plugins/OLULList/withOlList';
import { withMention } from './plugins/Mention/withMention';
import { consumePlugins } from '@src/utils/helper/consumePlugins';
import deferComponentRender from '@src/utils/helper/deferComponentRender';
import { cacheDocContent, getCache, setCache } from '@src/utils/cacheUtils';
import { ACTIVE_EDITOR, IS_RECOVERING_CONTENT, SLATE_ERRORS } from './plugins/ErrorHandle/weak-maps';
import { timeFormat } from './plugins/SideComment/utils';
import storage from '@src/utils/storage';
import { CardMenuButton, handleTableOps, showCacheDocContentModal } from './plugins/StaticToolbar/buttons';
import { withTabLevel } from './plugins/withTabLevel';
import { calcPath, getParentPathByType, getParentPathByTypes, getRelativePath, isEquals, isPath } from './plugins/pluginsUtils/getPathUtils';
import { withTitleNormalized } from './plugins/withTitleNormalized';
import { handleSlateError } from './plugins/ErrorHandle/handleSlateError';
import { getCellRightPoint, onKeyDownTable } from './plugins/table/onKeyDownTable';
import { getEditorEventEmitter } from './plugins/table/selection';
import { withElmentId } from './plugins/withElmentId';
import { onKeyDownCommon } from './plugins/HoveringToolbar/onKeyDownCommon';
import { f } from '@src/resource/string';
import { onKeyDownInlineImage } from './plugins/InlineImage/onKeyDownInlineImage';
import { onKeyDownImage } from './plugins/Image/onKeyDownImage';
import { ExcalidrawDomNode, withExcalidraw } from './plugins/Excalidraw';
import { DOMRange } from '../slate-packages/slate-react/utils/dom';
import { IS_READ_ONLY } from '../slate-packages/slate-react/utils/weak-maps';
import scrollIntoView from 'scroll-into-view-if-needed';
import { INLINE_IMAGE_COMMENTS, SEL_CELLS } from '@src/utils/weak-maps';
import { ExcalidrawEditor } from './plugins/Excalidraw/ExcalidrawEditor';
import { FLUSHING } from '../slate-packages/slate/utils/weak-maps';
import { registerValidationWorker } from '@src/worker/validationRun.worker';
import { withInline } from './plugins/withInline';
import sessStorage from '@src/utils/sessStorage';
import { EditorContainerInnerPortal, editorContainerOuterPortalFun, OverlayContainerRelativePortal } from '@src/utils/createPortal';
import { ErrorBoundary } from 'react-error-boundary';
import ReactDOM from 'react-dom';
import { DraggableEvent } from 'react-draggable';
import { TODOList } from './plugins/TodoList/todoList';
import ComIfram, { insertIFrame } from './plugins/iframe';
import { funArrExec, quikMenuByWord, quikMenuByWordSearch } from './plugins/quikMenuByWord';
import useMeasure from '@src/utils/useMeasure';

const emojis = [
  '🔥',
  '⚡',
  '🆕',
  '🆗',
  '☑️',
  '✅',
  '❎',
  '✔️',
  '❌',
  '🔴',
  '⭕',
  '🔗',
  '▶️',
  '💭',
  '🗨️',
  '💬',
  '🔔',
  '⚠️',
  '🚫',
  '‼️',
  '⁉️',
  '❓',
  '❔',
  '❕',
  '❗',
  '❤️',
  '🌈',
  '✨',
  '🌞',
  '☀️',
  '🐞',
  '🌸',
  '🌹',
  '🌺',
  '🌻',
  '🌼',
  '🌿',
  '🍃',
  '🍓',
  '🍻',
  '☕',
  '🎁',
  '🎂',
  '🎈',
  '🎉',
  '🎊',
  '🎵',
  '🎶',
  '🏃',
  '🏆',
  '🐶',
  '👀',
  '✊',
  '✌️',
  '👇',
  '👈',
  '👉',
  '👋',
  '👌',
  '👍',
  '👏',
  '👑',
  '💀',
  '💁',
  '💋',
  '💐',
  '💓',
  '💔',
  '💕',
  '💖',
  '💗',
  '💘',
  '💙',
  '💚',
  '💜',
  '💝',
  '💞',
  '💢',
  '💥',
  '💦',
  '💩',
  '💪',
  '💫',
  '⚽',
  '💯',
  '💰',
  '🖤',
  '🗣️',
  '😀',
  '☹️',
  '😁',
  '😂',
  '😃',
  '😄',
  '😅',
  '😆',
  '😇',
  '😈',
  '😉',
  '😊',
  '😋',
  '😌',
  '😍',
  '😎',
  '😏',
  '😐',
  '😑',
  '😒',
  '😔',
  '😕',
  '😘',
  '😚',
  '😛',
  '😜',
  '😞',
  '😠',
  '😡',
  '😢',
  '😣',
  '😤',
  '😩',
  '😫',
  '😬',
  '😭',
  '😮',
  '😰',
  '😱',
  '😲',
  '😳',
  '😴',
  '😶',
  '😹',
  '🙂',
  '🙃',
  '🙄',
  '🙆',
  '🙈',
  '🙊',
  '🙋',
  '🙌',
  '🙏',
  '🚶',
  '🤔',
  '🤗',
  '🤘',
  '🤙',
  '🤝',
  '🤞',
  '🤣',
  '🤤',
  '🤦',
  '🤨',
  '🤩',
  '🤪',
  '🤫',
  '🤭',
  '🤷',
  '🥰',
  '🥳',
  '🥴',
  '🥵',
  '🥺',
  '🧡',
];

export const hexOpacity20 = '33';

export function printTime(editor, docId) {
  applyOpt(actionKey.initCallback, {}, docId);
  setTimeout(() => {
    const options = getCache(docId, 'options');
    options?.reloadCallback();

    console.log('initCallback', options?.isRefresh);
    options?.isRefresh && showCacheDocContentModal(editor);
    setCache(docId, 'options', { ...options, isRefresh: false });
    const editorObj = window.tripdocs.editorsMap[docId];
    if (editorObj) {
      const isNoEdit = getCache(docId, 'isNoEdit');
      editorObj.readOnly !== isNoEdit && editorObj.api.setIsReadOnly(isNoEdit);
    }
  }, 500);

  resortListener(editor.children as any, editor);
}

const DefaultElement = (props: any) => {
  const {
    editorState: { docId, selectRow, width, setSelectCB, editorId, setIsModalVisible, setModalTitle },
    setFocusId,
    ...rest
  } = props;

  const editor = useEditor();

  useEffect(() => {
    let time;
    if (docId && editor.children.length) {
      if (getCache(docId, 'timeCheck')) {
        if (getCache(docId, 'options').socketUrl !== 'offline') {
          if (window.tripdocs.editorsMap[docId].socket?.provider?.wsconnected) {
          }
        } else {
          printTime(editor, docId);
          setCache(docId, 'timeCheck', false);
        }
      }
    }

    return () => {};
  }, []);

  return (
    <Element
      {...rest}
      editor={editor}
      selectedRow={selectRow}
      tableWidth={width}
      setIsModalVisible={setIsModalVisible}
      setModalTitle={setModalTitle}
      setSelectCB={setSelectCB}
      editorId={editorId}
      setFocusId={setFocusId}
    />
  );
};

export const renderElement = (props: any) => {
  return <DefaultElement {...props} />;
};
let targetSelect = { anchor: { path: [0], offset: 0 }, focus: { path: [0], offset: 0 } };

export interface EditorProps {
  name: string;
  id: any;
  docId: string;
  titleCallback: any;
  editors: any;
  isEmpty: any;
  template: any;
  templateReset: any;
  color: any;
  fileId: any;
  addUser: any;
  deleteUser: any;
  findCallbacks: any;
  searchText: any;
  decorate: any;
  replaceText: any;
  defaultValue: any[];
  findSelection: any;
  setEditorSelection: any;
  getNum: any;
  shareCallback: any;
  allUserList: any[];
  userInfo: any;
  setFocusedRangeId: any;
  focusedRangeId: any;
  setHoveredRangeId: any;
  setTitleLoading: any;
  setTemplateLoading: any;
  titleLoading: any;
  templateLoading: any;
  handleCompoStart: any;
  handleCompoEnd: any;
  type: any;
  renderPlaceholder: any;
  anchorTrigger: Function;
  setDocWidth: any;
  setModalState: any;
  currentColor: { fontColor: string; bgColor: string };
  setCurrentColor: any;
  chars: any;
  setChars: any;
  isShowHoveringCommentButton: boolean;
  setPlaceholderRects: Function;
  [key: string]: any;
}

const EditorSlate: React.FC<EditorProps> = ({
  id,
  name,
  editors,
  docId,
  titleCallback,
  isEmpty,
  template,
  templateReset,
  color,
  decorate,
  fileId,
  addUser,
  deleteUser,
  anchorTrigger,
  findCallbacks,
  searchText,
  replaceText,
  findSelection,
  setEditorSelection,
  getNum,
  shareCallback,
  setFocusedRangeId,
  focusedRangeId,
  setHoveredRangeId,
  setTitleLoading,
  setTemplateLoading,
  titleLoading,
  allUserList,
  userInfo,
  templateLoading,
  handleCompoStart,
  handleCompoEnd,

  type,
  renderPlaceholder,
  setDocWidth,
  defaultValue,
  setModalState,
  currentColor,
  setCurrentColor,
  socketUrl,
  setSideCommentRowNum,
  sideCommentRowNum,
  setCurRangeId,
  chars,
  setChars,
  isShowHoveringCommentButton,
  provider,
  cursors,
  commentData = [],
  setPlaceholderRects,
}) => {
  const initialValue: any = defaultValue || [
    {
      type: ELTYPE.HEADING_ONE,
      children: [
        {
          text: '',
        },
      ],
      anchorId: createRandomId(),
    },
    {
      type: ELTYPE.PARAGRAPH,
      children: [
        {
          text: '',
        },
      ],
      anchorId: createRandomId(),
    },
  ];
  const { isReadOnly, WIPCommentRangeId } = useContext(TripdocsSdkContext);
  const [ref, { x, y, width, height: minHeight, top, right, bottom, left }] = useMeasure();
  console.log('useMeasure width', width);
  const [titleValue, setTitleValue] = useState('');

  const [cUser, setCUser] = useState(userInfo);

  const [highlightRanges, setHightlightRanges] = useState([]);

  const [thisFindSelection, setFindSelection] = useState(findSelection);

  const [isLastSelectAll, setIsLastSelectAll] = useState(false);

  const [dragOverFocus, setDragOverFocus] = useState(null);
  const [cursorsTarget, setCursorsTarget] = useState<Range | undefined>();
  useEffect(() => {
    setFindSelection(findSelection);
  }, [findSelection]);
  useEffect(() => {
    const dp = document.getElementById(`editorContainer-${docId}`);
    let editorDom = document.getElementById(`editorarea-${docId}`);
    let dragStop = false;
    const debouceDragover = _.throttle((e, editorDom, editor) => {
      if (!editorDom) {
        editorDom = document.getElementById(`editorarea-${docId}`);
      }

      const list = editorDom ? Array.from(editorDom.childNodes) : [];
      console.log('dragover', e);
      for (let i = 0; i < e.path.length; i++) {
        const el = e.path[i];
        if (list.includes(el)) {
          const node: any = ReactEditor.toSlateNode(editor, el);
          if (HAS_INLINE_IMG_ELEMENT_TYPE.includes(node?.type)) {
            const path = ReactEditor.findPath(editor, node);
            const end = Editor.end(editor, path);
            const sel: Range = { anchor: end, focus: end };
            ReactEditor.focus(editor);
            Transforms.select(editor, sel);
            setCursorsTarget(sel);

            const scrollWrap: HTMLElement = getCache(docId, 'editorWrapDom');
            const scrollWrapRect = scrollWrap.getBoundingClientRect();
            dragStop = true;
            if (e.clientY < scrollWrapRect.top + Math.floor(scrollWrapRect.height * 0.15)) {
              dragStop = false;
              scroll(-10);
            }
            if (e.clientY > scrollWrapRect.bottom - Math.floor(scrollWrapRect.height * 0.15)) {
              dragStop = false;
              scroll(10);
            }
          }
        }
      }
    }, 50);

    function dragover(e: any) {
      let types = e.dataTransfer.types;
      if (types && types[0] !== 'Files') {
        return;
      }
      e.stopPropagation();

      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      debouceDragover(e, editorDom, editor);
    }
    const scroll = step => {
      const scrollWrap: HTMLElement = getCache(docId, 'editorWrapDom');
      if (scrollWrap) {
        const scrollY = scrollWrap.scrollTop;
        scrollWrap.scrollTo({ top: scrollY + step });
      }
    };
    dp.addEventListener('dragover', dragover);
    function drop(e: DragEvent) {
      let types = e.dataTransfer.types;
      if (isReadOnly || (types && types[0] !== 'Files')) {
        return;
      }
      e.stopPropagation();

      e.preventDefault();
      dragStop = true;
      let files = e.dataTransfer.files;
      dragInsertLocalFiles(editor, Array.from(files));
      setTimeout(() => {
        setCursorsTarget(undefined);
      }, 100);
    }
    dp.addEventListener('drop', drop);

    return () => {
      dp.removeEventListener('dragover', dragover);
      dp.removeEventListener('drop', drop);
    };
  }, [isReadOnly]);

  const isFirstMounted = useRef(true);

  const testIsEmptyDoc = value =>
    value &&
    value.length === 2 &&
    value[0]?.type === ELTYPE.HEADING_ONE &&
    value[1]?.type === ELTYPE.PARAGRAPH &&
    value[0]?.children[0]?.text === '' &&
    value[1]?.children[0]?.text === '';

  useEffect(() => {
    const testLog = false;

    const targetNode = document.getElementById(`editorarea-${docId}`);

    const config = { attributes: true, childList: true, subtree: true };

    const callback = function (mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          testLog && console.log('[MutationObserver] A child node has been added or removed.', mutation.target, new Date().getTime());
        } else if (mutation.type === 'attributes') {
          testLog &&
            console.log('[MutationObserver] The ' + mutation.attributeName + ' attribute was modified.', mutation.target, new Date().getTime());
        }
      }

      if (!getCache(docId, 'renderedToDom')) {
        console.log('[MutationObserver] first mounted', isFirstMounted.current, editor.children);

        if (editor?.children?.length > 0) {
          const renderTime: string = `${new Date().getTime() - getCache(docId, 'initTimestamp')}ms`;
          console.log('[time check] rendered to DOM at:' + new Date().getTime() + ', time consuming: ' + renderTime);

          console.log('elementInit -> updateOutlineAnchor', window, 1, editor, 2, docId);
          setTimeout(() => {
            getEditorEventEmitter(docId).emit('updateOutlineAnchor', docId);
            getEditorEventEmitter(docId).emit('renderedToDom', docId);
          }, 0);

          setCache(docId, 'renderedToDom', true);
        }
      }
    };

    const observer = new MutationObserver(callback);

    observer.observe(targetNode, config);
  }, []);

  useEffect(() => {
    const container = document.getElementById(`editorarea-${docId}`);
    if (isFirstMounted.current) {
      container.style.pointerEvents = 'none';
    } else {
      container.style.pointerEvents = 'auto';
    }
  }, [isFirstMounted.current]);

  useEffect(() => {
    renderPlaceholder && renderPlaceholder();
    setDocWidth(width);
  });

  useLayoutEffect(() => {
    setModalState({ setIsModalVisible: setIsModalVisible, setModalTitle: setModalTitle });
    isFirstMounted.current = false;

    if (typeof Node === 'function' && Node.prototype) {
      const originalRemoveChild = Node.prototype.removeChild;
      Node.prototype.removeChild = function (child) {
        if (child.parentNode !== this) {
          if (console) {
            console.warn('Cannot remove a child from a different parent', child, this);
          }
          return child;
        }
        return originalRemoveChild.apply(this, arguments);
      };

      const originalInsertBefore = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function (newNode, referenceNode) {
        if (referenceNode && referenceNode.parentNode !== this) {
          if (console) {
            console.warn('Cannot insert before a reference node from a different parent', referenceNode, this);
          }
          return newNode;
        }
        return originalInsertBefore.apply(this, arguments);
      };
    }
  }, []);

  const cursorsRef = useRef();
  const mentionRef = useRef();
  const menuRef = useRef();
  const emojiPanelRef = useRef();
  const [value, setValue] = useState(initialValue);
  const [target, setTarget] = useState<Range | undefined>();
  const [menuTarget, setMenuTarget] = useState<Range | undefined>();
  const [emojiTarget, setEmojiTarget] = useState<Range | undefined>();
  const [emojiIndex, setEmojiIndex] = useState(0);
  const [menuIndex, setMenuIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [pages, setPages] = useState(0);

  async function setUserList(getUserList) {
    console.log('setUserList-----------******', search);
    let userList = [];
    if (!search) {
      userList = getCache(docId, 'options').defaultUserList;
      console.log('setUserList-----------******', search, userList);
    } else {
      userList = await getUserList(search);
      console.log('setUserList,arr', userList);
      if (!userList) {
        setChars([]);
        return;
      }
    }

    const newArr = [];
    userList.filter(c => {
      if (c?.status === 0) {
        return false;
      }
      newArr.push({ ...c, sn: c.c_name });
      return true;
    });
    console.log('******************', newArr);

    setChars(newArr);
  }

  useEffect(() => {
    console.log('search target', search, target);
    if (window.tripdocs.editorsMap[docId]?.api?.getUserList) {
      setUserList(window.tripdocs.editorsMap[docId]?.api.getUserList);
    } else {
      const allUserListFilter = window.tripdocs.editorsMap[docId]?.allUserListFilter;
      const newArr = [];
      const arr =
        window.tripdocs.editorsMap[docId]?.allUserList.slice().map(c => {
          const sn = c?.sn;
          const displayname = c?.displayname;

          if (
            sn?.status !== 0 &&
            ((allUserListFilter && allUserListFilter(c)) ||
              sn?.toLowerCase().includes(search.toLowerCase()) ||
              displayname?.toLowerCase().includes(search.toLowerCase()))
          ) {
            newArr.push({ ...c, sn: c?.c_name });
          }
        }) || [];
      setChars(newArr);
    }
  }, [search, target]);

  useEffect(() => {}, [pages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeItems = document.getElementsByClassName('mention-item-active');
      if (activeItems.length > 0 && index !== 0) {
        activeItems[0].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [index]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeItems = document.getElementsByClassName('emoji-item-active');
      if (activeItems.length > 0 && emojiIndex !== 0) {
        activeItems[0].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [emojiIndex]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
    }
  }, [menuIndex]);

  const slateEditor = useMemo(() => {
    const plugins = [
      withTitleNormalized,
      withElmentId,
      withHtml,
      withBlockquote,
      withDeserializeMD,
      withTabLevel,
      withOlList,
      withImages,
      withInlineImages,
      withVideo,
      withMention,
      withTable,
      withAnchor,
      withInline,
      withShortcuts,
      withNormalizeNode,
      withEditLink,
      withCard,
      withReact,
      withHistory,
      withExcalidraw,
    ].reverse();
    const wrappedEditor = consumePlugins(createEditor(docId), plugins);
    return wrappedEditor;
  }, []);

  const editor = useMemo(() => {
    return editors || slateEditor;
  }, []);

  useEffect(() => {
    const container = document.getElementById(`editorarea-${docId}`);

    if (isReadOnly) {
      container
        ?.querySelectorAll("[contenteditable='true']:not(.ignore-toggle-readonly):not(.ant-image):not([class^='Tripdocs-'])")
        .forEach(function (item) {
          item.setAttribute('contenteditable', 'false');
        });
    } else {
      container
        ?.querySelectorAll("[contenteditable='false']:not(.ignore-toggle-readonly):not(.ant-image):not([class^='Tripdocs-'])")
        .forEach(function (item) {
          item.setAttribute('contenteditable', 'true');
        });
    }
  }, [template, isReadOnly, focusedRangeId, sideCommentRowNum, window.tripdocs.editorsMap[docId]?.editor?.children]);

  const [selectRow, setSelectRow] = useState<Path>(null);
  const [isTitle, setIsTitle] = useState(editor.selection ? (editor.selection.focus.path[0] === 0 ? true : false) : false);

  const _initFocus = useCallback(() => {
    console.log('[init] FOUCS');
    if (!window.tripdocs.editorsMap[docId]?.readOnly && editor.children && editor.children.length > 1) {
    }
  }, []);

  const _onMouseUp = (e: any) => {
    if (editor.selection && ReactEditor.hasRange(editor, editor.selection) && Range.isExpanded(editor.selection)) {
      if (editor.selection.anchor.path[0] === 0 && editor.selection.focus.path[0] !== 0) {
        editor.selection = Range.intersection(editor.selection, {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: (editor.children[0] as any).children[0].text.length },
        });
      }

      if (editor.selection.focus.path[0] === 0 && editor.selection.anchor.path[0] !== 0) {
        const lastChildIndex = editor.children.length - 1;
        const lastGrandChildren: any = editor.children[editor.children.length - 1].children;
        const lastTextLength = lastGrandChildren[lastGrandChildren.length - 1].text.length;
        const { startPoint } = getStart(editor);
        const bodySelection = {
          focus: startPoint,
          anchor: { path: [lastChildIndex, lastGrandChildren.length - 1], offset: lastTextLength },
        };
        editor.selection = Range.intersection(editor.selection, bodySelection);
      }

      const [start, end] = [Range.start(editor.selection), Range.end(editor.selection)];
      if (start.path[0] === end.path[0]) {
        const rowNode: any = SlateNode.get(editor, [start.path[0]]);
        const lastTextLength: any = rowNode?.children[rowNode.children.length - 1]?.text?.length;
        if (start && start.offset === 0 && end && end.offset === lastTextLength && HEADING_TYPES.includes(rowNode.type)) {
        }
      }
    }
  };

  const _onKeyDown = (e: any) => {
    if (getCache(docId, 'isComposing')) {
      e.preventDefault();
      return;
    }
    const startPath = editor.selection && ReactEditor.hasRange(editor, editor.selection) && [Range.start(editor.selection).path[0]];
    if (onKeyDownCard(e, editor)) {
      return;
    }
    onKeyDownDivide(e, editor);
    onKeyDownTextMark(e, editor);
    if (onKeyDownMention(e, editor)) {
      return;
    }
    if (onKeyDownImage(e, editor)) {
      return;
    }
    if (onKeyDownInlineImage(e, editor)) {
      return;
    }

    if (target) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (index >= chars.length - 1) {
            setPages(pages + 1);
          } else {
            const prevIndex = index + 1;
            setIndex(prevIndex);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          const nextIndex = index <= 0 ? index : index - 1;
          setIndex(nextIndex);
          break;
        case 'Tab':
        case 'Enter':
          e.preventDefault();
          if (chars[index] && chars[index].sn) {
            Transforms.select(editor, target);
            insertMention(editor, chars[index], cUser, docId);
            setTarget(null);
            setPages(0);
            setChars([]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setTarget(null);
          setPages(0);
          setChars([]);
          break;
      }
      return;
    }
    if (menuTarget) {
      const doms = document.getElementsByClassName('pmenu-block-wrapper');
      const dom = doms[0];
      const iconLen = dom.children.length;
      const lastFullRow = Math.floor(iconLen / 5) * 5;

      if (menuIndex < iconLen) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            if (menuIndex < lastFullRow) {
              setMenuIndex(prev => (prev + 5 < iconLen ? prev + 5 : iconLen - 1));
            } else {
              setMenuIndex(iconLen);
            }

            break;
          case 'ArrowUp':
            e.preventDefault();
            if (menuIndex >= 5) {
              setMenuIndex(prev => (prev >= 5 ? prev - 5 : 0));
            }
            break;
          case 'ArrowLeft':
            e.preventDefault();
            if (menuIndex > 0) {
              setMenuIndex(prev => prev - 1);
            }
            break;
          case 'ArrowRight':
            e.preventDefault();
            if (menuIndex < iconLen - 1) {
              setMenuIndex(prev => prev + 1);
            }
            break;
          case 'Tab':
          case 'Enter':
            e.preventDefault();
            const formats = [...iconMenus, ...blockMenus, { format: 'delete' }];
            const path = editor.selection.anchor.path?.slice(0, -1);
            execFormat(formats[menuIndex].format, editor, path, setIsModalVisible, setModalTitle);
            setMenuTarget(null);
            setMenuIndex(0);
            break;
          case 'Escape':
            e.preventDefault();
            setMenuTarget(null);
            setMenuIndex(0);
            break;
        }
      } else {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();

            setMenuIndex(prev => (prev + 1 > iconMenus.length + blockMenus.length ? 0 : prev + 1));

            break;
          case 'ArrowUp':
            e.preventDefault();
            setMenuIndex(prev => prev - 1);

            break;
          case 'ArrowLeft':
            e.preventDefault();

            break;
          case 'ArrowRight':
            e.preventDefault();

            break;
          case 'Tab':
          case 'Enter':
            e.preventDefault();
            const formats = [...iconMenus, ...blockMenus, { format: 'delete' }];
            const path = editor.selection.anchor.path?.slice(0, -1);
            execFormat(formats[menuIndex].format, editor, path, setIsModalVisible, setModalTitle);
            setMenuTarget(null);
            setMenuIndex(0);
            break;
          case 'Escape':
            e.preventDefault();
            setMenuTarget(null);
            setMenuIndex(0);
            break;
        }
      }

      return;
    }
    if (emojiTarget) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const lastFullRow = Math.floor(emojis.length / 7) * 7;
          if (emojiIndex < lastFullRow) {
            setEmojiIndex(prev => (prev + 7 < emojis.length ? prev + 7 : emojis.length - 1));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (emojiIndex >= 7) {
            setEmojiIndex(prev => (prev >= 7 ? prev - 7 : 0));
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (emojiIndex > 0) {
            setEmojiIndex(prev => prev - 1);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (emojiIndex < emojis.length - 1) {
            setEmojiIndex(prev => prev + 1);
          }
          break;
        case 'Tab':
        case 'Enter':
          e.preventDefault();
          Transforms.select(editor, emojiTarget);
          Transforms.insertText(editor, emojis[emojiIndex]);
          setEmojiTarget(null);
          setEmojiIndex(0);
          break;
        case 'Escape':
          e.preventDefault();
          setEmojiTarget(null);
          setEmojiIndex(0);
          break;
      }
      return;
    }

    onKeyDownTable(e, editor);

    if (editor.selection) {
      const selection = editor.selection;
      const { path, offset } = editor.selection.anchor;
      const rowNode: any = SlateNode.get(editor, [path[0]]);
      let tabbableParentPath: any = null;
      let tabbableParentNode: any = null;
      if ((rowNode.type === ELTYPE.CARD && rowNode.children[1].type === ELTYPE.TABLE) || rowNode.type !== ELTYPE.CARD) {
        tabbableParentPath = getParentPathByTypes(editor, path, TABBABLE_TYPES);
        tabbableParentNode = tabbableParentPath && SlateNode.has(editor, tabbableParentPath) && SlateNode.get(editor, tabbableParentPath);
      }

      const currentNode: any = Editor.node(editor, Range.start(selection));

      if (
        (rowNode?.type && (HEADING_TYPES.includes(rowNode.type) || (HEADING_TYPES.includes(rowNode.oldType) && LIST_TYPES.includes(rowNode.type)))) ||
        ((Editor.node(editor, selection)[0] as any).text as string)?.startsWith('#')
      ) {
        setTimeout(() => anchorTrigger(), 50);
      }

      let hasLeafProperty = false;
      const leafNode: any = currentNode && currentNode[0] && currentNode[0];
      const leafProperties = [...FORMATS, 'rangeIdList', 'isCaret'];
      if (leafNode && Text.isText(leafNode)) {
        leafProperties.forEach(prop => {
          if (leafNode.hasOwnProperty(prop)) {
            hasLeafProperty = true;
          }
        });
      }

      if (currentNode && leafNode && Text.isText(leafNode)) {
        const isEnd = Editor.isEnd(editor, editor.selection.focus, currentNode[1]);
        const parentNode: any = Editor.parent(editor, editor.selection.focus)[0];
        const wrapTypes = [ELTYPE.LINK];
        const isWrapped = wrapTypes.includes(parentNode.type);
        if (isEnd && isWrapped) {
          const nextNodeEntry = Editor.next(editor, { at: currentNode[1] });
          if (nextNodeEntry) {
            HistoryEditor.withoutMerging(editor, () => {
              const nextPath = nextNodeEntry[1];
              const nextLeafNodeEntry = Editor.leaf(editor, nextPath, { edge: 'start' });
              const nextLeafPath = nextLeafNodeEntry && nextLeafNodeEntry[1];
              const nextLeafStartPoint = { path: nextLeafPath, offset: 0 };
              Transforms.select(editor, nextLeafStartPoint);
            });
          }
        }
      }

      if (
        Range.start(selection) &&
        currentNode &&
        currentNode[0] &&
        currentNode[0].rangeIdList &&
        Range.start(selection).offset === currentNode[0].text?.length
      ) {
        Editor.removeMark(editor, 'rangeIdList');
        Editor.removeMark(editor, 'commentContent');
      }

      if (isHotkey('alt+ArrowUp', e)) {
        e.preventDefault();
        Transforms.select(editor, currentLineSelectAll(editor));
      }
      if (isHotkey('mod+a', e)) {
        e.preventDefault();
        if (editor.selection.focus.path[0] === 0) {
          Transforms.select(editor, currentLineSelectAll(editor));
        } else if (
          editor.selection.focus.path[0] === 1 &&
          editor.children.length === 2 &&
          editor.children[1].children &&
          editor.children[1].children[0] &&
          editor.children[1].children[0].text === ''
        ) {
          return;
        } else if (editor.selection.focus.path.length >= 4) {
          console.log(editor.selection.focus.path, ReactEditor.toDOMNode(editor, Editor.node(editor, editor.selection.focus.path.slice(0, -2))[0]));
          const range: any = currentCellSelectAll(editor);
          Transforms.select(editor, range);
        } else {
          const range = bodySelectAll(editor);

          Transforms.select(editor, range);
          console.log(editor.children, editor.selection, range);
        }
        return;
      }

      if (isHotkey('Enter', e)) {
        const { tabLevel = 0, type, children }: any = rowNode;
        const parentNode: any = SlateNode.get(editor, path.slice(0, -1));
        const parentChildren = parentNode && parentNode.children;
        const hasSomeInline = parentChildren.some(child => INLINE_TYPES.includes(child.type));
        const { tabLevel: childTabLevel, type: childType, children: childChildren } = parentNode;
        const isLeaf = Text.isText(Editor.node(editor, selection));

        const isTitle = getIsTitle(editor);
        if (isTitle) return;

        if (type && type !== ELTYPE.OLLIST && type !== ELTYPE.ULLIST) {
          if ((childType && childType === ELTYPE.OLLIST) || childType === ELTYPE.ULLIST) {
            const text = SlateNode.string(parentNode);

            if (text === '' && !hasSomeInline) {
              if (childTabLevel > 0) {
                updateOlDecreaseIndent(editor, parentNode);
              } else {
                removeOl(editor);
              }
              e.preventDefault();
              return;
            } else {
              insertNewOlFromOl(editor, parentNode as any, text);
            }
            window.event.returnValue = false;
            return;
          }
        } else {
          const text = SlateNode.leaf(editor, path).text;
          if (text === '' && !hasSomeInline) {
            if (tabLevel > 0) {
              updateOlDecreaseIndent(editor, rowNode);
            } else {
              removeOl(editor);
            }
          } else {
            insertNewOlFromOl(editor, rowNode as any, text);
          }
          e.preventDefault();
        }

        const firstChild: any = children[0];
        const lastChild: any = children[children.length - 1];
        const isFirstWithFormat = type && type === ELTYPE.PARAGRAPH && FORMATS.some((item: any) => firstChild[item]);
        const isLastWithFormat = type && type === ELTYPE.PARAGRAPH && FORMATS.some((item: any) => lastChild[item]);

        if (
          ((tabbableParentNode && tabbableParentNode.type && HEADING_TYPES.includes(tabbableParentNode.type)) || isFirstWithFormat) &&
          selection &&
          ReactEditor.hasRange(editor, selection) &&
          selection.focus.path[0] !== 0 &&
          Range.isCollapsed(selection)
        ) {
          const parentPath = getParentPathByTypes(editor, selection.focus.path, HEADING_TYPES);
          const lineStart = getCurrentLineStart(editor);
          if (parentPath && Point.equals(selection.focus, lineStart)) {
            e.preventDefault();
            const lastParentPath = parentPath[parentPath.length - 1];
            const newLinePath = [...parentPath.slice(0, -1), lastParentPath > 0 ? lastParentPath : 0];
            Transforms.insertNodes(editor, { type: ELTYPE.PARAGRAPH, children: [{ text: '' }] } as SlateNode, { at: newLinePath });
          }
        }

        if (
          ((tabbableParentNode && tabbableParentNode.type && HEADING_TYPES.includes(tabbableParentNode.type)) || isLastWithFormat) &&
          selection &&
          ReactEditor.hasRange(editor, selection) &&
          Range.isCollapsed(selection)
        ) {
          const parentPath = getParentPathByTypes(editor, selection.focus.path, HEADING_TYPES);
          const lineEnd = getCurrentLineEnd(editor);
          console.log('parentPath', parentPath, lineEnd, Point.equals(selection.focus, lineEnd));
          if (parentPath && Point.equals(selection.focus, lineEnd)) {
            e.preventDefault();
            const lastParentPath = parentPath[parentPath.length - 1];
            const newLinePath = [...parentPath.slice(0, -1), lastParentPath + 1];
            console.log('newLinePath', newLinePath);
            Transforms.insertNodes(editor, { type: ELTYPE.PARAGRAPH, children: [{ text: '' }] } as SlateNode, { at: newLinePath });
            Transforms.select(editor, newLinePath);
            return;
          }
        }

        if (
          type &&
          type === ELTYPE.TODO_LIST &&
          Editor.node(editor, [editor.selection.focus.path[0]]) &&
          Editor.node(editor, [editor.selection.focus.path[0]])[0] &&
          (Editor.node(editor, [editor.selection.focus.path[0]])[0] as any).todoChecked
        ) {
          setTimeout(() =>
            Transforms.setNodes(editor, { todoChecked: false } as Partial<SlateNode>, {
              at: [editor.selection.focus.path[0]],
            })
          );
        }

        if (isLeaf) {
          const [leafBefore]: any = Editor.leaf(editor, selection);

          if (leafBefore && leafBefore.rangeIdList && leafBefore.rangeIdList.length !== 0) {
            e.preventDefault();
            Transforms.insertNodes(editor, { type: ELTYPE.PARAGRAPH, children: [{ text: '' }] } as SlateNode, { at: [selection.focus.path[0] + 1] });
            Transforms.select(editor, [selection.focus.path[0] + 1]);
          }
        }

        if (SlateNode.has(editor, path)) {
          const texts = SlateNode.string(rowNode);
          if (texts === '```') {
            e.preventDefault();
            Transforms.removeNodes(editor, { at: path });
            setTimeout(() => {
              insertCodeBlock(editor);
            });
            return;
          }
        }
      }

      if (editor.selection.focus.path[0] === 0 && isHotkey('Tab', e)) {
        e.preventDefault();

        const { startPoint } = getStart(editor);
        editor.selection = {
          anchor: startPoint,
          focus: startPoint,
        };
      } else if (isHotkey('tab', e)) {
        e.preventDefault();

        if (isInTable(editor) && Range.isCollapsed(editor.selection)) {
          const point = getCellRightPoint(editor);
          if (point) {
            const node: any = SlateNode.get(editor, point.path.slice(0, -1));
            if (node?.type === ELTYPE.CARD_SUF) {
              handleTableOps(editor, 'insertRow');
              setTimeout(() => {
                const point = getCellRightPoint(editor);
                Transforms.setSelection(editor, { anchor: point, focus: point });
              }, 100);
            } else {
              Transforms.setSelection(editor, { anchor: point, focus: point });
            }
            return;
          }
        } else {
          increaseIndent(editor, rowNode, selection);
        }
      }
      if (isHotkey('shift+tab', e)) {
        e.preventDefault();
        decreaseIndent(editor, rowNode, selection);
      }

      if (editor.selection && ReactEditor.hasRange(editor, selection) && isHotkey('Enter', e)) {
        const isSelectedNode: any = SlateNode.get(editor, [editor.selection.focus.path[0]]);
        if (isSelectedNode.selectedRow) {
          e.preventDefault();
        }
      }

      if (onKeyDownCommon(e, editor)) {
        return;
      }
      if (editor.selection.focus.path[0] !== 0 && isHotkey('shift+enter', e)) {
        e.preventDefault();
        editor.insertText('\n');
      }

      if (editor.selection.focus.path[0] === 0 && editor.selection.focus.offset === value[0].children[0].text.length && e.key === 'Delete') {
        e.preventDefault();
      }
      if (Range.isCollapsed(editor.selection)) {
        if (tabbableParentPath && !_.isEqual(tabbableParentPath, selectRow)) {
          setSelectRow(tabbableParentPath);
        } else if (startPath && !_.isEqual(startPath, selectRow)) {
          setSelectRow(startPath);
        }
      }

      if (isHotkey('Delete', e)) {
        const parentImagePath = getParentPathByType(editor, selection.focus.path, ELTYPE.IMAGE);
        if (parentImagePath) {
          e.preventDefault();
          e.stopPropagation();
          const parentCardPath = getParentPathByType(editor, selection.focus.path, ELTYPE.CARD);
          Transforms.removeNodes(editor, { at: parentCardPath });
          return;
        }
        const parentMentionPath = getParentPathByType(editor, selection.focus.path, ELTYPE.MENTION);
        if (parentMentionPath) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Delete parentMentionPath');
          Transforms.removeNodes(editor, { at: parentMentionPath });
          return;
        }
      }

      if (isHotkey('Backspace', e)) {
        const { type } = rowNode;

        const { startPoint } = getStart(editor);
        const [start, end] = Range.edges(editor.selection);

        const parentImagePath = getParentPathByType(editor, selection.focus.path, ELTYPE.IMAGE);
        if (parentImagePath) {
          e.preventDefault();
          e.stopPropagation();
          const parentCardPath = getParentPathByType(editor, selection.focus.path, ELTYPE.CARD);
          Transforms.removeNodes(editor, { at: parentCardPath });
          return;
        }

        const parentMentionPath = getParentPathByType(editor, selection.focus.path, ELTYPE.MENTION);
        if (parentMentionPath) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Backspace parentMentionPath');
          Transforms.removeNodes(editor, { at: parentMentionPath });
          return;
        }

        if (
          editor.selection.focus.path[0] > 1 &&
          editor.selection.focus.offset === 0 &&
          value[selection.focus.path[0]]?.type === ELTYPE.PARAGRAPH &&
          value[(selection.focus.path[0] || 1) - 1]?.type === ELTYPE.CODE_BLOCK &&
          Range.isCollapsed(editor.selection)
        ) {
          e.preventDefault();
          e.stopPropagation();
          Transforms.removeNodes(editor, { at: [editor.selection.focus.path[0] - 1] });
          return;
        }

        if (
          tabbableParentNode &&
          tabbableParentNode.type &&
          HEADING_TYPES.includes(tabbableParentNode.type) &&
          selection &&
          ReactEditor.hasRange(editor, selection) &&
          Range.isCollapsed(selection) &&
          Point.equals(selection.focus, getCurrentLineStart(editor)) &&
          !(selection.focus.path.length === 2 && selection.focus.path[0] === 1)
        ) {
          e.preventDefault();
          const prevPath = tabbableParentPath && tabbableParentPath[tabbableParentPath.length - 1] > 0 ? Path.previous(tabbableParentPath) : null;
          if (prevPath) {
            const prevNode: any = SlateNode.get(editor, prevPath);

            console.log('[prevNode]', SlateNode.string(prevNode));
            if ([...HEADING_TYPES, ...LIST_TYPES].includes(prevNode.type) || SlateNode.string(prevNode).length) {
              Transforms.setNodes(editor, { type: ELTYPE.PARAGRAPH } as Partial<SlateNode>);
              editor.deleteBackward();
            } else {
              console.log('-------2--------');

              Transforms.removeNodes(editor, { at: prevPath });
            }
          }
        }

        console.log(Range.end(editor.selection).path[0], editor.selection, rowNode);

        return;
      }

      if (editor.selection.focus.path.length >= 4 && isHotkey('mod+Enter', e)) {
        e.preventDefault();
        Transforms.insertNodes(editor, { type: ELTYPE.PARAGRAPH, children: [{ text: '' }] } as SlateNode, {
          at: [editor.selection.focus.path[0] + 1],
        });
        editor.selection = {
          anchor: { path: [editor.selection.focus.path[0] + 1, 0], offset: 0 },
          focus: { path: [editor.selection.focus.path[0] + 1, 0], offset: 0 },
        };
      }
      if (
        (editor.selection.focus.path[0] >= 1 &&
          value[editor.selection.focus.path[0] - 1] &&
          value[editor.selection.focus.path[0] - 1].type === ELTYPE.CODE_BLOCK &&
          editor.selection.focus.offset === 0 &&
          isHotkey('left', e)) ||
        (value[editor.selection.focus.path[0] + 1] !== undefined &&
          value[editor.selection.focus.path[0] + 1].type === ELTYPE.CODE_BLOCK &&
          value[editor.selection.focus.path[0]].children[0].text &&
          editor.selection.focus.offset === value[editor.selection.focus.path[0]].children[0].text.length &&
          isHotkey('right', e)) ||
        (value[editor.selection.focus.path[0] + 1] !== undefined &&
          value[editor.selection.focus.path[0] + 1].type === ELTYPE.CODE_BLOCK &&
          value[editor.selection.focus.path[0]].children[0].text &&
          editor.selection.focus.offset === value[editor.selection.focus.path[0]].children[0].text.length &&
          isHotkey('Delete', e))
      ) {
        e.preventDefault();
        console.log(e, SlateNode.get(editor, [editor.selection.focus.path[0]]), editor.selection.focus);
      }

      if (
        selection &&
        ReactEditor.hasRange(editor, selection) &&
        Range.isExpanded(selection) &&
        selection.anchor.path[0] === 0 &&
        selection.focus.path[0] !== 0
      ) {
        e.preventDefault();
        editor.selection = Range.intersection(selection, {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: (editor.children[0] as any).children[0].text.length },
        });
      }
      if (
        selection &&
        ReactEditor.hasRange(editor, selection) &&
        Range.isExpanded(selection) &&
        selection.focus.path[0] === 0 &&
        selection.anchor.path[0] !== 0
      ) {
        e.preventDefault();
        const lastChildIndex = editor.children.length - 1;
        const lastGrandChildren: any = editor.children[editor.children.length - 1].children;
        const lastTextLength = lastGrandChildren[lastGrandChildren.length - 1].text.length;

        const { startPoint } = getStart(editor);
        const bodySelection = {
          focus: startPoint,
          anchor: { path: [lastChildIndex, lastGrandChildren.length - 1], offset: lastTextLength },
        };
        editor.selection = Range.intersection(selection, bodySelection);
      }
      const historyVersionShortKey = getCache(docId, 'options')?.historyVersionShortKey;

      if (historyVersionShortKey && isHotkey('alt+h', e)) {
        e.preventDefault();

        const hasCallbacks =
          window?.tripdocs?.editorsMap?.[docId]?.api?.getDocHistoryCallback &&
          window?.tripdocs?.editorsMap?.[docId]?.api?.getDocBlobByVersionCallback &&
          window?.tripdocs?.editorsMap?.[docId]?.api?.restoreDocCallback;

        if (hasCallbacks) {
          window.tripdocs.editorsMap[docId].api.setIsShowHistoryManager(prev => !prev);
        }
      }

      if (process.env.NODE_ENV !== 'production') {
        if (isHotkey('alt+r', e)) {
          e.preventDefault();
          window.tripdocs.editorsMap[docId].api.setIsReadOnly(prev => !prev);
        }

        if (isHotkey('alt+k', e)) {
          e.preventDefault();
          ReactEditor.focus(editor);
          for (let i = value.length - 1; i >= 1; i--) {
            Transforms.removeNodes(editor, { at: [i] });
          }
          Transforms.insertNodes(editor, { type: ELTYPE.PARAGRAPH, children: [{ text: '' }] } as SlateNode, { at: [1] });
        }

        if (isHotkey('alt+t', e)) {
          e.preventDefault();
          handleSlateError(`[Test] 主动异常抛出测试`, editor);
        }
        if (isHotkey('shift+alt+t', e)) {
          e.preventDefault();

          window.tripdocs.editorsMap[docId].api.setContent([
            { type: ELTYPE.DIVIDE, children: [{ text: 123 }] },
            { type: ELTYPE.CARD, children: [{ type: 123 }] },
          ]);
        }

        if (isHotkey('alt+l', e)) {
          e.preventDefault();
          const errors = SLATE_ERRORS.get(editor);
          errors?.forEach((err, index) => {
            console.error('[SLATE_ERROR] #' + index, err);
          });
        }

        if (isHotkey('alt+e', e)) {
          e.preventDefault();
          console.log('|| CURRENT CHILDREN: ', editor.children);
          console.log('|| CURRENT SELECTION: ', editor.selection);
        }

        if (isHotkey('alt+c', e)) {
          e.preventDefault();
          console.log('|| CURRENT NODE: ', Editor.node(editor, selection)[0]);
          console.log('|| CURRENT PATH: ', Editor.node(editor, selection)[1], selection.focus.offset);
        }
        if (isHotkey('alt+v', e)) {
          e.preventDefault();
          console.log('|| PARENT NODE: ', Editor.parent(editor, Editor.node(editor, selection)[1])[0]);
          console.log('|| PARENT PATH: ', Editor.parent(editor, Editor.node(editor, selection)[1])[1], selection.focus.offset);
        }
        if (isHotkey('alt+a', e)) {
          e.preventDefault();
          console.log('|| current editor: ', editor);
          console.log('|| current NODE: ', selection, currentNode);
          console.log('|| current dom: ', ReactEditor.toDOMNode(editor, currentNode[0]));
        }
        if (isHotkey('alt+b', e)) {
          e.preventDefault();
          console.log(
            '|| TABLE NODE: ',
            Editor.parent(editor, Editor.parent(editor, Editor.node(editor, selection)[1])[1]),
            Editor.parent(editor, Editor.parent(editor, Editor.parent(editor, Editor.node(editor, selection)[1])[1])[1]),
            Editor.parent(editor, Editor.parent(editor, Editor.parent(editor, Editor.parent(editor, Editor.node(editor, selection)[1])[1])[1])[1])
          );
          console.log('|| TABLE PATH: ', Editor.parent(editor, Editor.node(editor, selection)[1])[1]);
        }
      }

      setFocusedRangeId(null);
    }
    onVideoKeydown(e, editor);
  };

  const _onKeyUp = (e: any) => {
    if (editor.selection) {
    }
  };

  const _onMouseOver = (e: any) => {
    const leafNode = e && e.target && e.target.parentNode;
    if (!leafNode.classList.contains('side-comment-leaf')) {
      setHoveredRangeId(null);
      return;
    }
    console.log('_onMouseOver...', e, leafNode);

    const dataRangeId = leafNode.getAttribute('data-rangeid');
    setHoveredRangeId(dataRangeId);
  };

  const _onCopy = (e: any) => {};

  const _onPaste = (e: any) => {};

  const _onCut = (e: any) => {};

  useEffect(() => {
    const sel = editor.selection;
    sel && Range.isCollapsed(sel) && sel.focus.path && debounceSetEditorSelection(sel);

    if (!sel || Range.equals(targetSelect, sel) || Range.start(sel).path[0] === 0) {
      return;
    }
    targetSelect = sel;

    if (Range.isExpanded(editor.selection) && Range.equals(editor.selection, bodySelectAll(editor))) {
      setIsLastSelectAll(true);
    } else {
      setIsLastSelectAll(false);
    }

    if (isLastSelectAll && editor.children.length === 3 && editor.children[2].children[0].text === '') {
      Transforms.delete(editor, { unit: 'line', at: [editor.children.length - 1] });
    }
  }, [editor.selection]);

  const debounceSetEditorSelection = throttle(sel => {
    let nodeType = null;
    const newPath = [...sel.focus.path.slice(0, -1)];
    const isPathValid = Path.isPath(newPath);
    const isNodeValid = SlateNode.has(editor, newPath);
    try {
      if (isPathValid && isNodeValid) {
        nodeType = (SlateNode.get(editor, newPath) as any).type;
      }
    } catch (e) {}
    setEditorSelection({
      selection: sel,
      elementPath: sel.focus.path.slice(0, -1),
      elementType: nodeType,
    });
  }, 100);

  useEffect(() => {
    const throttled = _.throttle(() => {
      const api = docId && window.tripdocs?.editorsMap[docId]?.api;
      setTimeout(() => {
        api && api?.setLoading(false);
      }, 500);

      if (editor.children && editor.children.length > 1) {
        const res = (SlateNode.get(editor, [0, 0]) as any).text;
        if (editor.selection && ReactEditor.hasRange(editor, editor.selection) && editor.selection.focus.path[0] === 0) {
          setIsTitle(true);
          setTitleValue(res as any);
        } else {
          if (isTitle) {
            setIsTitle(false);
          }
        }
        let cacheTitle = getCache(docId, 'docTitle');
        if (cacheTitle !== res) {
          setCache(docId, 'docTitle', res);
          titleCallback(res);
        }
        if (value.length > 2 || (value.length === 2 && (value[0].children[0].text || value[1].children[0].text))) {
          isEmpty(true);
        } else {
          isEmpty(false);
        }
      }
    }, 1000);

    throttled();
  }, [value]);

  useEffect(() => {
    if (target && chars.length > 0) {
      const el: any = mentionRef.current;
      const domRange = ReactEditor.toDOMRange(editor, target);
      const rect = domRange?.getBoundingClientRect();
      const editorRect = document.querySelector(`[id^='editorarea-${docId}']`)?.getBoundingClientRect();

      el.style.position = 'absolute';
      el.style.top = `${rect.top - editorRect.top + 94}px`;
      el.style.left =
        rect.left - editorRect.left + 24 + 250 < editorRect.right ? `${rect.left - editorRect.left + 24}px` : editorRect.right - 250 + 'px';
    }
  }, [chars]);

  useEffect(() => {
    if (emojiTarget) {
      const el: any = emojiPanelRef.current;
      const domRange = ReactEditor.toDOMRange(editor, emojiTarget);
      const rect = domRange?.getBoundingClientRect();
      const editorRect = document.querySelector(`[id^='editorarea-${docId}']`)?.getBoundingClientRect();

      el.style.position = 'absolute';
      el.style.top = `${rect.top - editorRect.top + 94}px`;
      el.style.left =
        rect.left - editorRect.left + 24 + 250 < editorRect.right ? `${rect.left - editorRect.left + 24}px` : editorRect.right - 250 + 'px';
    }
  }, [emojiTarget]);
  useEffect(() => {
    if (menuTarget) {
      const el: any = menuRef.current;
      const domRange = ReactEditor.toDOMRange(editor, menuTarget);
      const rect = domRange?.getBoundingClientRect();
      const editorRect = document.querySelector(`[id^='editorarea-${docId}']`)?.getBoundingClientRect();

      el.style.position = 'absolute';
      el.style.top = `${rect.top - editorRect.top + 94}px`;
      el.style.left =
        rect.left - editorRect.left + 24 + 250 < editorRect.right ? `${rect.left - editorRect.left + 24}px` : editorRect.right - 250 + 'px';
    }
  }, [menuTarget]);
  useEffect(() => {
    const el: any = cursorsRef?.current;
    if (cursorsTarget && el) {
      const domRange = ReactEditor.toDOMRange(editor, cursorsTarget);
      const rect = domRange?.getBoundingClientRect();
      const editorRect = document.querySelector(`[id^='editorarea-${docId}']`)?.getBoundingClientRect();
      el.style.position = 'absolute';
      el.style.top = `${rect.top - editorRect.top + 77}px`;
      el.style.right = editorRect.right - rect.right + 9 + 'px';
    }
  }, [cursorsTarget]);

  useEffect(() => {
    if (!width) {
      return;
    }
    if (template !== null && template.length > 0 && editor) {
      let arr = [];

      if (editor.children.length !== 0) {
        ReactEditor.focus(editor);
        for (let i = editor.children.length - 1; i >= 1; i--) {
          Transforms.removeNodes(editor, { at: [i] });
        }
      }

      if (template[0].children[0].text.length > 0) {
        console.log(template[0].children[0].text);
        Transforms.insertText(editor, template[0].children[0].text, { at: [0, 0] });
      }

      for (let i = 1; i < template.length; i++) {
        arr.push(template[i]);
      }
      Transforms.insertNodes(editor, arr, { at: [1] });
      window.tripdocs.editorsMap[docId].api.setTemplate(null);
      setTemplateLoading(false);
    }
  }, [template, width]);

  useEffect(() => {
    window.tripdocs.editorsMap[docId].editor = editor;
    window.tripdocs.editorsMap[docId].ReactEditor = ReactEditor;
    window.tripdocs.editorsMap[docId].SlateEditor = Editor;
    window.tripdocs.editorsMap[docId].Transforms = Transforms;
    if (provider) {
      window.tripdocs.editorsMap[docId].socket = {
        provider,
      };
    }
  }, [, width]);

  const searchDecorate = useCallback(
    ([node, path]: NodeEntry<SlateNode>) => {
      const ranges: any[] = [];

      if (searchText && Text.isText(node)) {
        const { text } = node;
        const parts = text.split(searchText);
        let offset = 0;

        parts.forEach((part: any, i: any) => {
          if (i !== 0) {
            ranges.push({
              anchor: { path, offset: offset - (searchText as string).length },
              focus: { path, offset },
              highlight: true,
            });
          }

          offset = offset + part.length + (searchText as string).length;
        });
      }

      return ranges;
    },
    [searchText]
  );

  const commentInitRanges = useMemo((): selectionObjSlice[] => {
    window.tripdocs.editorsMap[docId].commentData = commentData;
    console.log('commentData---222', commentData);
    const nCommentData: selectionObj[] = [];
    for (let i = 0; i < commentData.length; i++) {
      if (commentData[i].rangeId && !commentData[i].rangeId.startsWith('global-comment_')) {
        const jsonRangeId = JSON.parse(commentData[i].rangeId);
        const { selection } = jsonRangeId;
        const cData: selectionObj = {
          ...selection,

          rangeId: commentData[i].rangeId,
          data: commentData[i],
          jsonRangeId,
        };
        nCommentData.push(cData);
      }
    }
    return sliceRangeNoRepeateAtOnePath(editor, nCommentData);
  }, [commentData]);

  const [commentRanges, setCommentRanges] = useState([]);

  useEffect(() => {
    setCommentRanges(commentInitRanges);
  }, [commentInitRanges]);

  useEffect(() => {
    window.tripdocs.editorsMap[docId].commentRanges = commentRanges;
  }, [commentRanges]);

  const commentDecorate = useCallback(
    ([node, path]: NodeEntry<any>) => {
      let ranges: any[] = [];
      const newRanges = [];
      const isElement = !Text.isText(node);
      if (isElement && commentData?.length) {
        ranges = JSON.parse(JSON.stringify(commentRanges));
        for (let i = 0; i < ranges.length; i++) {
          const {
            jsonRangeId: {
              anchorId,
              commentType,
              refContent,
              selection: { focus, anchor },
            },
          } = ranges[i];

          if (node?.anchorId === anchorId) {
            let newPath = path;
            if (Array.isArray(path) && path[path.length - 1] !== 0) {
              newPath = [...path, 0];
            }
            const relativePath = getRelativePath(newPath, anchor.path);
            const AnchorPath = calcPath(anchor.path, relativePath);
            const FocusPath = calcPath(focus.path, relativePath);
            if (isPath(FocusPath) && isPath(AnchorPath) && Editor.hasPath(editor, AnchorPath) && Editor.hasPath(editor, FocusPath)) {
              const newSelection = {
                anchor: { ...anchor, path: AnchorPath },
                focus: { ...focus, path: FocusPath },
              };
              const fragement = Editor.fragment(editor, newSelection);
              const str = SlateNode.string({ children: fragement });
              console.log('fragement', fragement, str);
              const isStrEquals = str === refContent;

              const relativePath = getRelativePath(newPath, anchor.path);
              const newAnchorPath = calcPath(ranges[i].anchor.path, relativePath);
              const newFocusPath = calcPath(ranges[i].focus.path, relativePath);

              if (
                isStrEquals &&
                isPath(newFocusPath) &&
                isPath(newAnchorPath) &&
                Editor.hasPath(editor, newAnchorPath) &&
                Editor.hasPath(editor, newFocusPath)
              ) {
                ranges[i].focus = { ...ranges[i].focus, path: newFocusPath };
                ranges[i].anchor = { ...ranges[i].anchor, path: newAnchorPath };
                newRanges.push(ranges[i]);
              }
            }
          }
        }
      }
      if (newRanges.length) {
        console.log('insertSideComment combineDecorate ranges', node, path, newRanges, ranges);
      }
      return newRanges;
    },
    [commentRanges, commentData, WIPCommentRangeId]
  );

  const findDecorate = useCallback(
    ([node, path]: NodeEntry<SlateNode>) => {
      let ranges: any = [];
      if (searchText && Text.isText(node)) {
        const num = getNum();
        if (
          highlightRanges.length !== 0 &&
          highlightRanges[num] &&
          highlightRanges[num].anchor.path[0] === path[0] &&
          highlightRanges[num].focus.path[0] === path[0] &&
          ((highlightRanges[num].anchor.path.length > 2 &&
            highlightRanges[num].anchor.path[1] === path[1] &&
            highlightRanges[num].anchor.path[2] === path[2] &&
            highlightRanges[num].focus.path[1] === path[1] &&
            highlightRanges[num].focus.path[2] === path[2]) ||
            highlightRanges[num].anchor.path.length <= 2)
        ) {
          const findRanges = {
            anchor: highlightRanges[num].anchor,
            focus: highlightRanges[num].focus,
            findHighlight: true,
          };
          ranges.push(findRanges);
        }
      }
      return ranges;
    },
    [searchText, highlightRanges, thisFindSelection]
  );

  const [cursorsArr, setCursorsArr] = useState(cursors);
  useEffect(() => {
    const cacheCursors = getCache(docId, 'cursors');
    const isComposing = getCache(docId, 'isComposing');

    if (!isComposing && JSON.stringify(cacheCursors) !== JSON.stringify(cursors)) {
      setCache(docId, 'cursors', cursors);
      setCursorsArr(cursors);
    }
  }, [cursors]);

  const combineDecorate = useCallback(
    ([node, path]: NodeEntry<SlateNode>) => {
      const range1 = decorate && !isReadOnly ? decorate([node, path]) : [];
      const range2 = commentDecorate([node, path]);

      return [...range1, ...range2];
    },
    [commentData, cursorsArr, isReadOnly, commentRanges, WIPCommentRangeId]
  );

  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [combineDecorate]);

  useEffect(() => {
    const entries = SlateNode.nodes(editor);
    let ranges: any = [];
    for (const entry of entries) {
      const arr = searchDecorate(entry);
      for (const el of arr) {
        ranges.push(el);
      }
    }
    setHightlightRanges(ranges);
  }, [searchDecorate]);

  const setSelectCB = ([path]: any) => {
    ReactEditor.blur(editor);
    ReactEditor.focus(editor);
    Transforms.insertNodes(editor, { type: ELTYPE.PARAGRAPH, children: [{ text: '' }] } as SlateNode, {
      at: [path + 1],
    });
    Transforms.select(editor, {
      anchor: { path: [path + 1, 0], offset: 0 },
      focus: { path: [path + 1, 0], offset: 0 },
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.addEventListener('mouseup', _onMouseUp);

      getEditorEventEmitter(docId).on('renderedToDom', _initFocus, docId);
    }
    return () => {
      document.removeEventListener('mouseup', _onMouseUp);
    };
  }, []);

  useEffect(() => {
    if (!width) {
      return;
    }

    const editorRect = $(`#editorarea-${docId}`)[0]?.parentElement?.getBoundingClientRect();
    const titleRect = $(`#editorarea-${docId} > *:first-child`)[0]?.getBoundingClientRect();
    const contentRect = $(`#editorarea-${docId} > *:nth-child(2)`)[0]?.getBoundingClientRect();
    const editorRectParentPadding = 10 - 6;
    if (titleRect && contentRect) {
      setPlaceholderRects({
        titleRect: {
          left: `${titleRect.left - editorRect.left + editorRectParentPadding}px`,
          top: `${titleRect.top - editorRect.top - 2}px`,
        },
        contentRect: {
          left: `${contentRect.left - editorRect.left + editorRectParentPadding - 4}px`,
          top: `${contentRect.top - editorRect.top + editorRectParentPadding}px`,
        },
      });
    }
  }, [width]);

  useEffect(() => {
    findCallbacks(highlightRanges, editor, setValue);
  }, [highlightRanges, editor]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [modalTitle, setModalTitle] = useState(0);
  const titleArr = ['请插入视频（仅限优酷，哔哩哔哩）链接', '请插入图片链接', '请插入卡比平台设计稿链接', '请插入链接'];

  useEffect(() => {
    if (isModalVisible) {
      setInputValue('');
    }
  }, [isModalVisible]);

  const refocusEditorAfterModal = useCallback(
    (hasInserted = false) => {
      ReactEditor.focus(editor);
      const cacheSelection = getCache(docId, 'selection');
      console.log('[cacheSelection]', cacheSelection);
      if (cacheSelection && Range.isRange(cacheSelection)) {
        if (hasInserted) {
          const { anchor } = cacheSelection;
          const nextPoint = { path: [...anchor.path.slice(0, -1), anchor.path[anchor.path.length - 1] + 2], offset: 0 };
          const nextRange = { anchor: nextPoint, focus: nextPoint };
          if (ReactEditor.hasRange(editor, nextRange)) {
            Transforms.select(editor, nextRange);
          }
        } else {
          Transforms.select(editor, cacheSelection);
        }
      }
    },
    [editor, docId]
  );

  const handleOk = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (modalTitle === 0) {
      if (!inputValue) return;

      if (inputValue.indexOf('youku.com') > -1 || inputValue.indexOf('bilibili.com') > -1) {
        console.log('video', selectRow);
        insertVideo(editor, inputValue);
        refocusEditorAfterModal(true);
      } else {
        message.destroy();
        message.error('仅支持优酷，哔哩哔哩视频');
      }
    } else if (modalTitle === 1) {
      if (!inputValue) return;

      insertImage(editor, '', selectRow, inputValue);
      refocusEditorAfterModal(true);
    }

    setIsModalVisible(false);

    console.log('handleOk');
  };

  const handleCancel = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalVisible(false);
    refocusEditorAfterModal();
    console.log('handleCancel');
  };

  const onInputChange = (e: any) => {
    setInputValue(e.target.value);
    console.log('onInputChange', e.target.value);
  };

  const [titleEditorValue, setTitleEditorValue] = useState((editor?.children?.[0] && SlateNode.string(editor.children[0])) || '');

  useEffect(() => {
    setTitleEditorValue((editor?.children?.[0] && SlateNode.string(editor.children[0])) || '');
  }, [editor?.children?.[0]?.children?.[0]?.text]);

  useEffect(() => {
    if (getCache(docId, 'options').isMdEditor || !getCache(docId, 'options').useValidationWorker) {
      return;
    }
    let validationWorker = null;
    let workerBlobURL = '';

    const isDev = __DEV__;

    if (editor?.children) {
      if (isDev) {
        validationWorker = window?.tripdocs?.cache?.registerValidationWorker__DEV(editor)?.worker;
      } else {
        const result = registerValidationWorker(editor);
        if (result) {
          const { worker, blobURL } = result;
          validationWorker = worker;
          workerBlobURL = blobURL;
        }
      }
      debouncedUpdateCache(editor, docId);
    }

    return () => {
      if (getCache(docId, 'options').isMdEditor) {
        return;
      }
      validationWorker?.terminate?.();
      workerBlobURL && window.URL.revokeObjectURL(workerBlobURL);
    };
  }, [editor?.history?.undos?.length]);

  const changeSlateEditorTitle = useCallback(
    _.debounce(e => {
      handleTitleEditorBinding(e);
    }, 500),
    []
  );

  const onTitleEditorChange = useCallback((e: any) => {
    setTitleEditorValue(e.target.value);
    changeSlateEditorTitle(e);
  }, []);

  const handleTitleEditorBinding = useCallback((e: any) => {
    console.log('Title Input => setTitleInputValue', e.target.value);

    if (editor.children.length) {
      const anchor = Editor.start(editor, [0]);
      const focus = Editor.end(editor, [0]);
      console.log('setTitleInputValue*************', { anchor, focus });
      if (Range.isExpanded({ anchor, focus })) {
        Transforms.delete(editor, { at: { anchor, focus } });
      }
      Transforms.insertText(editor, e.target.value, { at: anchor });
    }
  }, []);

  const rightClickMenu = (
    <Menu>
      <RightClickMenuItem icon="content-cut" action="cut" itemName="剪切" />
      <RightClickMenuItem icon="content-copy" action="copy" itemName="复制" />
      <RightClickMenuItem icon="content-paste" action="paste" itemName="粘贴" />
      <Menu.Divider></Menu.Divider>
      {}
      <EditLinkButton></EditLinkButton>
    </Menu>
  );

  const { isMobile, isMiddle, isWideMode } = useContext(TripdocsSdkContext);
  function addNewStyle(newStyle) {
    let styleElement: HTMLStyleElement = document.getElementById('styles_js') as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.id = 'styles_js';
      document.getElementsByTagName('head')[0].appendChild(styleElement);
    }

    styleElement.appendChild(document.createTextNode(newStyle));
  }

  useEffect(() => {
    if (isMobile) {
      addNewStyle(
        ".editor_container_wrap .editor-container div[id^='editorarea']::before { content: ''; width: calc(100% - 50px); height: 1px; background-color: rgba(0, 0, 0, 0.05); position: absolute; top: 74px; margin: 4px 0; }"
      );
    } else {
      addNewStyle(
        ".editor_container_wrap .editor-container div[id^='editorarea']::before { content: ''; width: calc(100% - 140px); height: 1px; background-color: rgba(0, 0, 0, 0.05); position: absolute; top: 74px; margin: 4px 0; }"
      );
    }
  }, [isMobile]);
  const { isInElectron } = useContext(TripdocsSdkContext);

  return (
    <ClientFrame
      id={`editor-content-${docId}`}
      style={{ maxWidth: isMobile || !isMiddle || isWideMode ? '100vw' : '936px' }}
      spellCheck={getCache(docId, 'spellcheck')}
    >
      {}
      <Modal
        title={titleArr[modalTitle]}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={f('complete')}
        cancelText={f('cancel')}
      >
        <Input value={inputValue} onChange={onInputChange} />
        {[1].includes(modalTitle) && (
          <div
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();
              insertImgFile(editor, docId);

              handleCancel(e);
            }}
            style={{ color: '#1890ff', marginTop: 10 }}
          >
            {f('localFile')}
          </div>
        )}
      </Modal>
      <input
        className={cx(
          'title-editor-area',
          css`
            white-space: nowrap;
            width: 100%;

            line-height: 36px;
            margin: 16px 0;
            padding: 0 ${isMobile ? `15px` : `60px`};
            border: none;
            outline: none;
            background: transparent;
            &::-webkit-input-placeholder {
              color: rgba(0, 0, 0, 0.25);
            }
          `
        )}
        style={{
          color: 'rgba(0, 0, 0, 0.85)',
          fontWeight: 600,
          fontSize: '28px',
        }}
        readOnly={isReadOnly}
        placeholder={f('titleHint')}
        maxLength={45}
        value={titleEditorValue}
        onBlur={handleTitleEditorBinding}
        onChange={onTitleEditorChange}
        onDragStart={e => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onKeyDown={e => {
          console.log('INPUT keydown', e);
        }}
      />
      <Slate
        editor={editor}
        value={value}
        onChange={(newValue: any) => {
          let isBlockContext = false;
          if (!!document?.activeElement?.closest('[data-block-context]')) {
            isBlockContext = true;
            if (isBlockContext) {
              setValue(newValue);
              applyOpt(actionKey.onSlateChange, newValue, docId);
              return;
            }
          }

          const isComposing = getCache(docId, 'isComposing');
          const options = getCache(docId, 'options');
          const isUseIMEInputing = getCache(docId, 'isUseIMEInputing');
          if (!(options?.useIMEInput && isComposing && isUseIMEInputing)) {
            setValue(newValue);
          } else {
            setCache(docId, 'newValue', newValue);
          }
          applyOpt(actionKey.onSlateChange, newValue, docId);

          const { selection } = editor;
          selection && ReactEditor.hasRange(editor, selection) && setCache(docId, 'selection', selection);
          if (
            selection &&
            ReactEditor.hasRange(editor, selection) &&
            selection.anchor &&
            selection.focus &&
            Range.isCollapsed(selection) &&
            newValue.length
          ) {
            const result = funArrExec([quikMenuByWordSearch, quikMenuByWord(), quikMenuByWord('/$')], editor, selection, (tag, target, mSearch) => {
              switch (tag) {
                case '@':
                  if (typeof mSearch === 'string') {
                    setSearch(mSearch);
                    setIndex(0);
                    setTarget(target);
                  }
                  break;

                case '/$':
                  if (target?.anchor?.path) {
                    const start = Editor.start(editor, target?.anchor?.path);
                    const isEqual = Point.equals(start, target.anchor);

                    const node = SlateNode.get(editor, target?.anchor?.path?.slice(0, -1));
                    const str = SlateNode.string(node);
                    if (isEqual && str === '/') {
                      setMenuTarget(target);
                    }
                  }
                  break;
                case '\\\\$':
                  setEmojiTarget(target);
                  break;
                default:
                  break;
              }
            });
            if (result) {
              return;
            }
          }

          setMenuTarget(null);
          setTarget(null);
          setEmojiTarget(null);
          setEmojiIndex(0);

          setTimeout(() => {
            const sel = editor.selection;
            const myValue = editor.children;
            if (
              sel &&
              sel.anchor &&
              sel.focus &&
              Range.isCollapsed(sel) &&
              myValue.length >= 2 &&
              myValue[myValue.length - 1].children[0].text !== ''
            ) {
              Transforms.insertNodes(editor, [{ type: 'paragraph', children: [{ text: '' }] } as SlateNode], { at: [myValue.length] });
            }
          });
        }}
      >
        {isMobile ? (
          <HoveringCommentButton
            width={width}
            editorId={`editorarea-${docId}`}
            setSideCommentRowNum={setSideCommentRowNum}
            setCurRangeId={setCurRangeId}
            isMobile={isMobile}
            isShowHoveringCommentButton={isShowHoveringCommentButton}
          />
        ) : !isReadOnly ? (
          <HoveringToolbar
            shareCallback={shareCallback}
            editorId={`editorarea-${docId}`}
            currentColor={currentColor}
            setCurrentColor={setCurrentColor}
            setSideCommentRowNum={setSideCommentRowNum}
            setCurRangeId={setCurRangeId}
            isMobile={isMobile}
            isShowHoveringCommentButton={isShowHoveringCommentButton}
          />
        ) : (
          <HoveringCommentButton
            width={width}
            editorId={`editorarea-${docId}`}
            setSideCommentRowNum={setSideCommentRowNum}
            setCurRangeId={setCurRangeId}
            isMobile={isMobile}
            isShowHoveringCommentButton={isShowHoveringCommentButton}
          />
        )}
        {}
        <Editable
          spellCheck={getCache(docId, 'spellcheck')}
          id={`editorarea-${docId}`}
          editorId={`editorarea-${docId}`}
          readOnly={isReadOnly}
          className={cx('slate-editable')}
          refs={ref}
          data-ignore-slate
          decorate={combineDecorate}
          style={{
            width: '100%',
            padding: isMobile ? '10px 15px 160px' : '10px 60px 160px',

            overflow: 'visible',
          }}
          onCompositionStartCapture={e => {
            if (!!document?.activeElement?.closest('[data-block-context]')) {
              return;
            }
            const options = getCache(docId, 'options');
            const isMulti = Range.isExpanded(editor.selection) && sliceRangToLine(editor, editor.selection).length > 1 ? true : false;

            if (options?.useIMEInput && isMulti) {
              setCache(docId, 'compositionSelection', editor.selection);
              setCache(docId, 'isUseIMEInputing', true);
              const editorDom = document.getElementById('editorarea-' + docId);
              const domArr = Array.from(editorDom.children);
              const domLen = domArr.length;
              const editorObj = window.tripdocs.editorsMap[docId];
              const value = editorObj?.editor?.children || [];
              if (value.length === domLen) {
                for (let i = 0; i < value.length; i++) {
                  const element = value[i];
                  const elDOm = domArr[i];
                  setCache(docId, 'editorDoms-' + (element.anchorId || i.toString()), elDOm);
                }
              }
            }
            handleCompoStart(e);
          }}
          onCompositionEnd={e => {
            if (!!document?.activeElement?.closest('[data-block-context]')) {
              return;
            }
            const newValue = getCache(docId, 'newValue');

            const options = getCache(docId, 'options');
            const isUseIMEInputing = getCache(docId, 'isUseIMEInputing');

            if (options?.useIMEInput && isUseIMEInputing) {
              setCache(docId, 'isUseIMEInputing', false);
              const text = e.data.replace(/\n/g, '');
              const compositionSelection = getCache(docId, 'compositionSelection');
              const start = Editor.start(editor, compositionSelection);
              console.log('onCompositionEnd insert text', text);
              setCache(docId, 'cacheSelect', { path: start.path, offset: start.offset + text.length });
              if (Array.isArray(newValue)) {
                setCache(docId, 'newValue', undefined);
                setTimeout(() => {
                  setValue(newValue);
                  Transforms.insertText(editor, text, { at: start });
                  execDom(text);
                }, 0);
              } else {
                execDom('');
              }
            }
            function execDom(text) {
              setTimeout(() => {
                const start = Editor.start(editor, editor.selection);
                Transforms.select(editor, start);
                const [node, path] = Editor.above(editor, {
                  at: start,
                  match: (n: any) => Editor.isBlock(editor, n),
                });
                const dom = ReactEditor.toDOMNode(editor, node);

                delInvalidDom(dom);
                setTimeout(() => {
                  recoverDom();
                  setSelect();
                }, 0);
              }, 0);
              function setSelect() {
                setTimeout(() => {
                  const point = getCache(docId, 'cacheSelect');
                  Transforms.setSelection(editor, { anchor: point, focus: point });
                }, 0);
              }
              function delInvalidDom(dom: HTMLElement) {
                if (dom && dom.parentNode) {
                  const parentDom = dom.parentNode;
                  Array.from(parentDom.children).map(element => {
                    if (element.tagName === 'P') {
                      if (
                        !(
                          element.children &&
                          element.children[0] &&
                          element.children[0].children &&
                          element.children[0].children[0] &&
                          element.children[0].children[0].tagName !== 'BR'
                        ) ||
                        (element.querySelectorAll('span')?.length || 0) < 3
                      ) {
                        parentDom.removeChild(element);
                      }
                    }
                  });
                }

                if (dom && dom.children[1] && dom.children[1].tagName === 'SPAN') {
                  if (dom.children[1].querySelectorAll('span').length < 2) {
                    dom.removeChild(dom.children[1]);
                    delInvalidDom(dom);
                  }
                }
              }
              function recoverDom() {
                const editorDom = document.getElementById('editorarea-' + docId);
                const domArr = Array.from(editorDom.children);
                const domLen = domArr.length;
                const editorObj = window.tripdocs.editorsMap[docId];
                const value = editorObj?.editor?.children || [];

                setTimeout(() => {
                  for (let i = 0; i < value.length; i++) {
                    const element = value[i];
                    const elDOm = getCache(docId, 'editorDoms-' + (element.anchorId || i.toString()));

                    const str = SlateNode.string(element);
                    const str2 = (elDOm && elDOm?.textContent) || '';
                    if (str.trim() !== str2.trim()) {
                      const path = [i];
                      const node = SlateNode.get(editor, path);
                      Transforms.removeNodes(editor, { at: path });
                      Transforms.insertNodes(editor, node, { at: path });
                    }
                    delInvalidDom(elDOm);
                  }

                  console.log('onCompositionEnd', value.length, domLen);
                }, 0);
              }
            }
            handleCompoEnd(e);
          }}
          onDrop={(event: any) => {
            const target = event.target;
            const shouldIgnore =
              target.classList.contains('card_suf') || target.classList.contains('card_pre') || target.getAttribute('data-slate-editor') === 'true';
            if (shouldIgnore) {
              event.preventDefault();
              return;
            }
          }}
          renderElement={props => {
            return (
              <>
                {}
                {}
                {}
                {}
                <DefaultElement {...props} />
              </>
            );
          }}
          selectRow={selectRow}
          width={width}
          setSelectCB={setSelectCB}
          docId={docId}
          renderLeaf={renderLeaf}
          scrollSelectionIntoView={slateScrollSelectionIntoView}
          onKeyDown={_onKeyDown}
          onKeyUp={_onKeyUp}
          onMouseDown={handleCompoEnd}
          onMouseOver={_onMouseOver}
          onPaste={_onPaste}
          onCut={_onCut}
          onFocus={() => {
            ACTIVE_EDITOR.set(window, editor);
          }}
          onBlur={() => {
            ACTIVE_EDITOR.set(window, null);
          }}
        />
        {!isReadOnly && isInElectron && cursorsTarget && (
          <EditorContainerInnerPortal docId={docId}>
            <div
              ref={cursorsRef}
              style={{
                top: '-9999px',
                right: '-9999px',
                position: 'absolute',
                zIndex: 1000,
                background: 'black',

                height: 20,
                width: 2,
              }}
            ></div>
          </EditorContainerInnerPortal>
        )}
        {}

        {!isReadOnly && emojiTarget && (
          <EditorContainerInnerPortal docId={docId}>
            <div
              ref={emojiPanelRef}
              style={{
                top: '-9999px',
                left: '-9999px',
                position: 'absolute',
                zIndex: 100,
                padding: '3px',
                background: 'white',
                borderRadius: '4px',
                boxShadow: '0 1px 5px rgba(0,0,0,.2)',
                height: 200,
                maxHeight: 200,
                overflow: 'hidden auto',
                display: 'flex',
                flexWrap: 'wrap',
                width: '210px',
                fontSize: '18px',
              }}
            >
              {emojis.map((emoji, i) => (
                <div
                  contentEditable="false"
                  suppressContentEditableWarning
                  data-ignore-slate
                  className={i === emojiIndex ? 'emoji-item-active' : 'emoji-item'}
                  key={i}
                  style={{
                    padding: '5px',
                    borderRadius: '3px',
                    width: '28px',
                    height: '28px',
                    background: i === emojiIndex ? '#B4D5FF' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    userSelect: 'none',
                  }}
                  onMouseEnter={() => {
                    if (index !== i) setEmojiIndex(i);
                  }}
                  onMouseLeave={() => {
                    setEmojiIndex(0);
                  }}
                  onMouseDown={e => {
                    e.preventDefault();
                    setEmojiIndex(i);
                    Transforms.select(editor, emojiTarget);
                    Transforms.insertText(editor, emoji);
                    setEmojiTarget(null);
                    setEmojiIndex(0);
                  }}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </EditorContainerInnerPortal>
        )}

        {!isReadOnly && target && chars.length > 0 && (
          <EditorContainerInnerPortal docId={docId}>
            <div
              ref={mentionRef}
              style={{
                top: '-9999px',
                left: '-9999px',
                position: 'absolute',
                zIndex: 1,
                padding: '3px',
                background: 'white',
                borderRadius: '4px',
                boxShadow: '0 1px 5px rgba(0,0,0,.2)',
                height: 200,
                maxHeight: 200,
                overflow: 'auto',
                minWidth: 250,
              }}
            >
              {chars.map((char, i) => (
                <div
                  contentEditable="false"
                  suppressContentEditableWarning
                  data-ignore-slate
                  className={i === index ? 'mention-item-active' : 'mention-item'}
                  key={i}
                  style={{
                    padding: '1px 3px',
                    borderRadius: '3px',
                    background: i === index ? '#B4D5FF' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    userSelect: 'none',
                  }}
                  onMouseEnter={() => {
                    if (index !== i) setIndex(i);
                  }}
                  onMouseLeave={() => {
                    setIndex(0);
                  }}
                  onMouseDown={e => {
                    e.preventDefault();
                    setIndex(i);
                    Transforms.select(editor, target);
                    insertMention(editor, chars[i], cUser, docId);
                    setTarget(null);
                  }}
                  onClick={e => {
                    e.preventDefault();
                    setIndex(i);
                    Transforms.select(editor, target);
                    insertMention(editor, chars[i], cUser, docId);
                    setTarget(null);
                  }}
                >
                  <Avatar src={char?.avatarUrl} size={28} style={{ margin: '0 0.5em' }} />
                  <div
                    className={cx(
                      'mention-item-info',
                      css`
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: start;
                      `
                    )}
                  >
                    <div className={css``}>{char?.displayname || char?.sn}</div>
                    <div
                      className={css`
                        font-size: 12px;
                        color: #8090a2;
                      `}
                    >
                      {char?.displayInfo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </EditorContainerInnerPortal>
        )}
        {!isReadOnly && menuTarget && (
          <EditorContainerInnerPortal docId={docId}>
            <div
              ref={menuRef}
              style={{
                top: '-9999px',
                left: '-9999px',
                position: 'absolute',
                zIndex: 1,
                padding: '3px',
                background: 'white',
                borderRadius: '4px',
                boxShadow: '0 1px 5px rgba(0,0,0,.2)',
                overflow: 'auto',
              }}
            >
              <SiderMenu
                menuIndex={menuIndex}
                setIsModalVisible={setIsModalVisible}
                setModalTitle={setModalTitle}
                setMenuIndex={setMenuIndex}
                children={<span></span>}
                editor={editor}
                selectedRow={menuTarget}
                type={ELTYPE.PARAGRAPH}
                docWidth={width}
                element={{}}
              />
            </div>
          </EditorContainerInnerPortal>
        )}
      </Slate>
      <div id={'editorContainer-bottom-' + docId}></div>
      <ExcalidrawEditor editor={editor} />
    </ClientFrame>
  );
};

export default EditorSlate;

export const Element: any = (props: any) => {
  let {
    attributes,
    children,
    element,
    editor,
    selectedRow,
    url,
    tableWidth,
    setSelectCB,
    isReadOnly,
    editorId,
    setIsModalVisible,
    setModalTitle,
    isNumb = false,
  } = props;
  let newProps = Object.assign({}, props);
  delete newProps.setIsModalVisible;
  delete newProps.setModalTitle;

  const tableRef = useRef();
  const cardRef = useRef();

  switch (element.type) {
    case ELTYPE.EXCALIDRAW:
      return <ExcalidrawDomNode attributes={attributes} element={element} children={children} editor={editor} newProps={newProps} />;
    case ELTYPE.CARD:
      return <Card attributes={attributes} element={element} children={children} editor={editor} ref={cardRef} />;
    case ELTYPE.CARD_PRE:
    case ELTYPE.CARD_SUF:
      return <CardPreSuf attributes={attributes} element={element} children={children} />;
    case ELTYPE.DIVIDE:
      return <Divide attributes={attributes} element={element} children={children} />;

    case ELTYPE.FILE:
      return (children = <FileComponent attributes={attributes} element={element} children={children} editor={editor} />);
    case ELTYPE.DESIGN:
    case ELTYPE.SANDBOX:
      return (children = <ComIfram attributes={attributes} element={element} children={children} />);

    case ELTYPE.TABLE:
      return (
        <TableElement
          {...attributes}
          ref={tableRef}
          children={children}
          element={element}
          attributes={attributes}
          editor={editor}
          maxWidth={tableWidth}
          editorId={editorId}
        />
      );

    case ELTYPE.TABLE_ROW:
      return (
        <tr
          {...attributes}
          style={{
            height: element.height || 'auto',
          }}
        >
          {children}
        </tr>
      );
    case ELTYPE.TABLE_CELL:
      return (
        <td
          {...attributes}
          rowSpan={element.rowspan}
          colSpan={element.colspan}
          data-key={element.key}
          style={{
            display: element.rowspan === 0 || element.colspan === 0 ? 'none' : null,
            pointerEvents: element.rowspan === 0 || element.colspan === 0 ? 'none' : null,
            border: element.unbordered ? null : '1px solid #d9d9d9',

            wordBreak: 'break-all',
            borderCollapse: 'separate',
            borderSpacing: '2px 1px',
            backgroundColor: element.cellBackgroundColor ? element.cellBackgroundColor : 'transparent',

            verticalAlign: element.verticalAlign || 'top',

            position: 'relative',
            padding: '4px',
            userSelect: 'auto',
          }}
          onDragStartCapture={e => {
            const target: any = e.target;
            const isDraggable = target.getAttribute('draggable');
            console.log('[slateEditor] onDragStartCapture', target, isDraggable);
            if (!isDraggable) {
              e.preventDefault();
            }
          }}
        >
          {children}
        </td>
      );
    case ELTYPE.LINK:
      return (
        <EditLink {...attributes} element={element} editor={editor} editorId={editorId} attributes={attributes}>
          {children}
        </EditLink>
      );
    case ELTYPE.VIDEO:
      return (
        <SlateVideo {...attributes} element={element} editor={editor} attributes={attributes} data-ignore-slate>
          {children}
        </SlateVideo>
      );
    case ELTYPE.HEADING_ONE:
      children = (
        <H1
          {...attributes}
          name={'slate-heading'}
          style={{
            lineHeight: element.lineHeight ? element.lineHeight : undefined,
            textAlign: element.align ? element.align : 'left',
            marginLeft: _.isNumber(element.tabLevel) ? `${Number.parseInt(element.tabLevel) * 2}rem` : null,
          }}
          data-tab-level={element.tabLevel}
          data-line-height={element.lineHeight}
        >
          {children}
        </H1>
      );
      break;
    case ELTYPE.HEADING_TWO:
      children = (
        <H2
          {...attributes}
          name={'slate-heading'}
          style={{
            lineHeight: element.lineHeight ? element.lineHeight : undefined,
            textAlign: element.align ? element.align : 'left',
            marginLeft: _.isNumber(element.tabLevel) ? `${Number.parseInt(element.tabLevel) * 2}rem` : null,
            color: 'black',
          }}
          data-tab-level={element.tabLevel}
          data-line-height={element.lineHeight}
        >
          {children}
        </H2>
      );
      break;
    case ELTYPE.HEADING_THREE:
      children = (
        <H3
          {...attributes}
          name={'slate-heading'}
          style={{
            lineHeight: element.lineHeight ? element.lineHeight : undefined,
            textAlign: element.align ? element.align : 'left',
            marginLeft: _.isNumber(element.tabLevel) ? `${Number.parseInt(element.tabLevel) * 2}rem` : null,
          }}
          data-tab-level={element.tabLevel}
          data-line-height={element.lineHeight}
        >
          {children}
        </H3>
      );
      break;
    case ELTYPE.HEADING_FOUR:
      children = (
        <HFour
          {...attributes}
          name={'slate-heading'}
          style={{
            lineHeight: element.lineHeight ? element.lineHeight : undefined,
            textAlign: element.align ? element.align : 'left',
            marginLeft: _.isNumber(element.tabLevel) ? `${Number.parseInt(element.tabLevel) * 2}rem` : null,
          }}
          data-tab-level={element.tabLevel}
          data-line-height={element.lineHeight}
        >
          {children}
        </HFour>
      );
      break;
    case ELTYPE.HEADING_FIVE:
      children = (
        <H5
          {...attributes}
          name={'slate-heading'}
          style={{
            lineHeight: element.lineHeight ? element.lineHeight : undefined,
            textAlign: element.align ? element.align : 'left',
            marginLeft: _.isNumber(element.tabLevel) ? `${Number.parseInt(element.tabLevel) * 2}rem` : null,
          }}
          data-tab-level={element.tabLevel}
          data-line-height={element.lineHeight}
        >
          {children}
        </H5>
      );
      break;
    case ELTYPE.HEADING_SIX:
      children = (
        <H6
          {...attributes}
          name={'slate-heading'}
          style={{
            lineHeight: element.lineHeight ? element.lineHeight : undefined,
            textAlign: element.align ? element.align : 'left',
            marginLeft: _.isNumber(element.tabLevel) ? `${Number.parseInt(element.tabLevel) * 2}rem` : null,
          }}
          data-tab-level={element.tabLevel}
          data-line-height={element.lineHeight}
        >
          {children}
        </H6>
      );
      break;

    case ELTYPE.BLOCK_QUOTE:
      children = (
        <BlockQuote
          {...attributes}
          element={element}
          editor={editor}
          attributes={attributes}
          lineHeight={element.lineHeight}
          data-tab-level={element.tabLevel}
          data-line-height={element.lineHeight}
        >
          {children}
        </BlockQuote>
      );
      break;
    case ELTYPE.ULLIST:
      children = (
        <UlList
          {...attributes}
          prop={newProps}
          textAlign={element.align ? element.align : 'left'}
          lineHeight={element.lineHeight ? element.lineHeight : 1.75}
        >
          {children}
        </UlList>
      );
      break;
    case ELTYPE.OLLIST:
      children = (
        <OlList
          {...attributes}
          prop={newProps}
          textAlign={element.align ? element.align : 'left'}
          lineHeight={element.lineHeight ? element.lineHeight : 1.75}
        >
          {children}
        </OlList>
      );
      break;
    case ELTYPE.MENTION:
      return <MentionElement {...newProps} />;
    case ELTYPE.IMAGE:
      return <SlateImage {...newProps} textAlign={element.align ? element.align : 'center'} />;
    case ELTYPE.INLINEIMAGE:
      return <SlateInlineImage {...newProps} textAlign={element.align ? element.align : 'center'} />;
    case ELTYPE.TODO_LIST:
      children = (
        <TODOList
          {...attributes}
          editor={editor}
          prop={newProps}
          textAlign={element.align ? element.align : 'left'}
          lineHeight={element.lineHeight ? element.lineHeight : 1.75}
        >
          {children}
        </TODOList>
      );
      break;

    case ELTYPE.CODE_BLOCK:
      return <CodeHighlightEditor {...newProps} children={children} editor={editor} element={element} setSelectCB={setSelectCB} />;
    case ELTYPE.DIVIDE:
      return <Divide attributes={attributes} element={element} children={children} />;
    default:
      children = (
        <p
          {...attributes}
          style={{
            lineHeight: element.lineHeight ? element.lineHeight : 1.75,
            textAlign: element.align ? element.align : 'left',
            marginLeft: _.isNumber(element.tabLevel) ? `${Number.parseInt(element.tabLevel) * 2}rem` : null,
          }}
          data-tab-level={element.tabLevel}
          data-line-height={element.lineHeight}
        >
          {children}
        </p>
      );
      break;
  }
  return children;
};

export const Leaf: any = (props: any) => {
  const { attributes, leaf } = props;
  let { children } = props;
  let outerSize: any;
  const parent = children.props.parent;
  switch (children.props.parent.type) {
    case ELTYPE.HEADING_ONE:
      outerSize = 26;
      break;
    case ELTYPE.HEADING_TWO:
      outerSize = 22;
      break;
    case ELTYPE.HEADING_THREE:
      outerSize = 20;
      break;
    case ELTYPE.HEADING_FOUR:
      outerSize = 18;
      break;
    case ELTYPE.HEADING_FIVE:
      outerSize = 16;
      break;
    case ELTYPE.HEADING_SIX:
      outerSize = 16;
      break;
    default:
      outerSize = 14;
      break;
  }

  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = (
      <code
        style={{
          margin: '0.2em',
          padding: '0.2em 0.4em',
          fontSize: '13px',
          background: '#f2f4f5',
          border: '1px solid rgba(0,0,0,.06)',
          borderRadius: '3px',
        }}
      >
        {children}
      </code>
    );
  }

  if (leaf.italic) {
    children = <Italic>{children}</Italic>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  if (leaf.strikethrough) {
    children = <del>{children}</del>;
  }

  if (leaf.backgroundColor) {
    const bgColor = leaf.backgroundColor;
    children = (
      <span data-backgroundcolor={bgColor} style={{ backgroundColor: bgColor.replace(')', ', 0.8)').replace('rgb', 'rgba') }}>
        {children}
      </span>
    );
  }

  if (leaf.fontColor) {
    children = (
      <span data-fontcolor={leaf.fontColor} style={{ color: leaf.fontColor }}>
        {children}
      </span>
    );
  }
  if (leaf.fontLetter) {
    children = (
      <span data-fontcolor={leaf.fontLetter} style={{ letterSpacing: leaf.fontLetter }}>
        {children}
      </span>
    );
  }

  if (leaf.fontSizeChange) {
    children = (
      <span {...attributes} style={{ fontSize: outerSize + leaf.fontSizeChange }}>
        {children}
      </span>
    );
  }

  if (leaf.rangeIdList) {
    const { focusedRangeId, hoveredRangeId, setFocusedRangeId, isReadOnly } = useContext(TripdocsSdkContext);
    console.log('leaf.rangeIdList', leaf.rangeIdList, focusedRangeId, hoveredRangeId);
    const isFocusedComment = leaf.rangeIdList?.includes(focusedRangeId);
    const isHoveredComment = leaf.rangeIdList?.includes(hoveredRangeId);
    children = (
      <span
        {...attributes}
        data-rangeid-list={leaf.rangeIdList.join`&`}
        onMouseUp={e => {
          if (isReadOnly) {
          } else {
            const dataRangeId = leaf.rangeId;
            console.log('dataRangeId', dataRangeId);
            setFocusedRangeId(dataRangeId);
          }
        }}
        className={cx(
          'side-comment-leaf',
          css`
            & {
              border-bottom: 2px solid rgba(250, 173, 20, ${isFocusedComment ? `0.8` : `0.4`});
              background: ${isHoveredComment ? `rgba(250, 173, 20, 0.35);` : isFocusedComment ? `rgba(250, 173, 20, 0.2);` : null};
            }
          `
        )}
      >
        {children}
      </span>
    );
  }
  const alphaColor = leaf?.data?.alphaColor;
  const { isMobile, isDrag } = useContext(TripdocsSdkContext);

  return (
    <span
      {...attributes}
      suppressContentEditableWarning={true}
      data-ignore-slate
      style={{
        position: 'relative',
        caretColor: isMobile || isDrag ? 'transparent' : undefined,
        paddingLeft: leaf?.text === '' ? '0.1px' : null,
        backgroundColor: alphaColor
          ? alphaColor + hexOpacity20
          : leaf.findHighlight
          ? 'orange'
          : leaf.highlight
          ? 'yellow'
          : leaf.commentHighlight
          ? 'rgba(255, 188, 0, 0.4)'
          : 'transparent',
      }}
    >
      {leaf.isCaret ? <Caret {...(leaf as any)} isMobile={isMobile} /> : null}
      {children}
    </span>
  );
};

const slateScrollSelectionIntoView = (editor: ReactEditor, domRange: DOMRange) => {
  const readonly = IS_READ_ONLY.get(editor);
  const isTableSelectingCells = SEL_CELLS.get(editor)?.length;
  const isCardSuf = editor.selection && Editor.above(editor, { at: editor.selection, match: (n: any) => n.type === ELTYPE.CARD_SUF });
  const editorWrapDom = getCache(editor.docId, 'editorWrapDom');
  console.log('defaultScrollSelectionIntoView', readonly, isTableSelectingCells);
  if (readonly || isTableSelectingCells || isCardSuf) return;

  if (!editor.selection || (editor.selection && ReactEditor.hasRange(editor, editor.selection) && Range.isCollapsed(editor.selection))) {
    const isInlineType = getParentPathByTypes(editor, editor.selection.anchor.path, [...SINGLE_INLINE_TYPES]);
    if (isInlineType) return;
    const leafEl = domRange.startContainer.parentElement!;
    leafEl.getBoundingClientRect = domRange.getBoundingClientRect.bind(domRange);
    scrollIntoView(leafEl, {
      scrollMode: 'if-needed',
      boundary: editorWrapDom,
    });

    delete leafEl.getBoundingClientRect;
  }
};

const RightClickMenuItem = (props: any) => {
  const { action, icon, itemName, ...attributes } = props;

  const editor = useSlate();

  const selection = editor.selection;

  const [hover, setHover] = useState(false);

  return (
    <Menu.Item
      {...attributes}
      key={anchorId()}
      style={{
        backgroundColor: hover ? '#EEEEEE' : 'unset',
      }}
      icon={<IconBtn className={`tripdocs-sdk-iconfont icon-${icon}`} style={{ fontSize: 16, paddingRight: 10 }}></IconBtn>}
      onMouseEnter={e => {
        setHover(true);
      }}
      onMouseLeave={e => {
        setHover(false);
      }}
      onMouseDown={(event: any) => {
        event.preventDefault();
        if (selection && ReactEditor.hasRange(editor, selection) && min(selection.anchor.path[0], selection.focus.path[0]) !== 0) {
          rightClickMenuActions(editor, action);
        }
      }}
    >
      {itemName}
    </Menu.Item>
  );
};

const min = (a: any, b: any) => {
  return a > b ? b : a;
};
const max = (a: any, b: any) => {
  return a > b ? a : b;
};

const debouncedUpdateCache = _.debounce((editor, docId) => {
  if (!IS_RECOVERING_CONTENT.get(editor)) {
    const curTime = timeFormat();
    console.log('[debouncedUpdateCache] 保存', editor.children, curTime);
    cacheDocContent(editor, docId, editor.children, curTime);
  }
}, 5000);
