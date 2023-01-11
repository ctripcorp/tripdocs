import { CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { AllCommentsList } from '@src/components/docs/plugins/SideComment/renderAllCommentsList';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import '@src/style/less/slatedocs.less';
import { Button, Drawer, Layout, Select, Spin, Tooltip } from 'antd';

import classNames from 'classnames';
import $ from 'jquery';
import { debounce } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { HistoryManager } from './components/app/HistoryManager';
import { FallbackComponent } from './components/app/FallbackComponent';
import { HotkeyHelperContent } from './components/app/HotkeyHelper';
import { SideTipContainer } from './components/app/SideTipContainer';
import EditorNative from './components/docs/nativeEditor';
import { IconBtn } from './components/docs/plugins/Components';
import { ELTYPE } from './components/docs/plugins/config';
import { findAndReplace } from './components/docs/plugins/findAndReplace';
import { GlobalComment } from './components/docs/plugins/GlobalComment';
import { MobileToolbar } from './components/docs/plugins/MobileToolbar';
import { OlList, UlList } from './components/docs/plugins/OLULList/OlList';
import { DocTocTitle, OutlineAnchor } from './components/docs/plugins/OutlineAnchor/renderOutlineAnchor';
import { SideCommentCreator } from './components/docs/plugins/SideComment';

import { StaticToolbar } from './components/docs/plugins/StaticToolbar';
import { getEditorEventEmitter } from './components/docs/plugins/table/selection';
import Editor from './components/docs/yjsEditor';
import { Range, Transforms } from './components/slate-packages/slate';
import { f } from './resource/string';
import './style/less/slatedocs-sdk.less';
import { useForceUpdate } from './utils/apiOperations/hooks/useForceUpdate';
import { useWindowUnloadEffect } from './utils/apiOperations/hooks/useWindowUnloadEffect';
import { getCache, setCache } from './utils/cacheUtils';
import { EditorContainerBottomPortal, EditorContainerInnerPortal, EditorContainerOuterPortal } from './utils/createPortal';
import { getDefaultValueByBase64 } from './utils/getDefaultValue';
import './Docs.less';
import { TODOList } from './components/docs/plugins/TodoList/todoList';
import useMeasure from './utils/useMeasure';
const { Content } = Layout;

const { Option } = Select;

export const TripdocsSdkContext = React.createContext(null);

type DocsProps = {
  userInfo: any;
  readOnly: boolean;
  tocPlacement: 'left' | 'right';
  deepestDisplayAnchorHeading: 3 | 4 | 5 | 6;
  socketUrl: string;
  fileUploadUrl: string;
  mentionCallback: (mention: any) => void;
  shareCallback: (share: any) => void;
  commentCallback: (comment: any) => void;
  docId: string;
  defaultValue: any[];
  docToken: string;
  fake: boolean;
  identityauth2: string;
  secure: boolean;
  isMdEditor: boolean;
  isWideMode: boolean;
  defaultCommentData: any;
  showHoveringCommentButton: boolean;
  showGlobalComment: boolean;
  showHelpBlock: boolean;
  theme: { backgroundColor: string };
};
const setEdit = debounce((setIsReadOnly, isNoEdit, docId) => {
  if (window.tripdocs.editorsMap?.[docId]?.editor && !getCache(docId, 'timeCheck')) {
    setIsReadOnly(isNoEdit);
  }
}, 1000);
const Docs = (props: DocsProps) => {
  let {
    userInfo,
    readOnly,
    tocPlacement = 'left',
    deepestDisplayAnchorHeading = 6,
    socketUrl: sUrl,
    fileUploadUrl,
    mentionCallback,
    shareCallback,
    commentCallback,
    docId = 'default',
    defaultValue: propsDefaultValue,
    docToken: propsDocToken,
    fake,
    identityauth2: idAuth,
    secure,
    isMdEditor,
    isWideMode: propsIsWideMode,
    defaultCommentData,
    showHoveringCommentButton,
    showGlobalComment,
    showHelpBlock,
    theme,
  } = props;

  const [socketUrl, setSocketUrl] = useState(sUrl);
  const [defaultValue, setDefaultValue] = useState(propsDefaultValue);
  const [socketToken, setSocketToken] = useState(propsDocToken);
  const [socketAuth, setSocketAuth] = useState(idAuth);

  const [docIds, setDocIds] = useState('default');

  const [isShowHotkeyHelper, setIsShowHotkeyHelper] = useState(false);
  const [isShowHelpBlock, setIsShowHelpBlock] = useState(showHelpBlock);

  const [isShowHoveringCommentButton, setIsShowHoveringCommentButton] = useState(showHoveringCommentButton);
  const [isShowGlobalComment, setIsShowGlobalComment] = useState(showGlobalComment);

  useWindowUnloadEffect(() => {
    if (window.tripdocs.editorsMap[docId]?.editor?.selection) {
      window.tripdocs.editorsMap[docId].Transforms.deselect(window.tripdocs.editorsMap[docId].editor);
    }
  }, false);

  try {
    const [mail, setMail] = useState('');
    const [me, setMe] = useState({
      id: userInfo.userId,
      name: userInfo.userName,
      mail: '',
    });
    useEffect(() => {
      const newMe = JSON.parse(JSON.stringify(me));
      newMe.mail = mail;
      if (JSON.stringify(newMe) === JSON.stringify(me)) {
        return;
      }
      setMe(newMe);
    }, [me, mail]);

    const overlayContainerRef = useRef();

    const anchorContainerRef = useRef();

    const [filename, setFilename] = useState('未命名文档');

    const [foldername, setFoldername] = useState(null);

    const [fileId, setFileId] = useState('');

    const [templateBarShow, setTemplateBar] = useState(true);

    const [template, setTemplate] = useState(null);

    const [users, setUsers] = useState([]);

    const [lastName, setLastName] = useState('');

    const [drawerVisible, setDrawerVisible] = useState(false);

    const [openFindAndReplaceDia, setFindAndReplaceDia] = useState(false);

    const [searchText, setSearchText] = useState('');

    const [replaceText, setReplaceText] = useState('');

    const [findSelection, setFindSelection] = useState('');

    const [titleLoading, setTitleLoading] = useState(true);

    const [templateLoading, setTemplateLoading] = useState(true);

    const [placeholderContentVisible, setPlaceholderContentVisible] = useState(false);

    const [isReadOnly, setIsReadOnly] = useState(readOnly);
    const [isNoEdit, setIsNoEdit] = useState(readOnly);

    const [tocPlace, setTocPlace] = useState(tocPlacement);

    const [sideCommentRowNum, setSideCommentRowNum] = useState(-1);

    const [curRangeId, setCurRangeId] = useState('');

    const [chars, setChars] = useState([]);

    const [placeholderRects, setPlaceholderRects] = useState({
      titleRect: { top: '34px', left: '74px' },
      contentRect: { top: '90px', left: '70px' },
    });

    const [deepestDisplayAnchor, setDeepestDisplayAnchor] = useState<3 | 4 | 5 | 6>(deepestDisplayAnchorHeading);

    const [currentColor, setCurrentColor] = useState({
      fontColor: 'rgb(255, 0, 0)',
      bgColor: 'rgb(255, 217, 102)',
      cellBgColor: 'rgb(243, 243, 243)',
    });

    const [findAndReplaceMethods, setFindAndReplaceMethods] = useState({
      highlightRanges: [],
      editor: undefined as any,
      setValue: () => {},
    });

    const [editorSelection, setEditorSelection] = useState({
      selection: '',
      elementPath: [0],
      elementType: '',
    });

    const [modalState, setModalState] = useState({
      setIsModalVisible: () => {},
      setModalTitle: () => {},
    });
    const [docWidth, setDocWidth] = useState(800);

    const scrollRef = useRef(null);

    const [editorContainerScrollTop, setEditorContainerScrollTop] = useState(0);

    const { dep: anchorDep, trigger: anchorTrigger } = useForceUpdate();

    const options: Options = getCache(docId, 'options');
    const isInElectron: boolean = getCache(docId, 'options')?.isInElectron;

    const [contentWrapRect, setContentWrapRect] = useState(document?.getElementById(`editor-content-wrap-${docId}`)?.getBoundingClientRect?.());
    const [contentRect, setContentRect] = useState(document?.getElementById(`editor-content-${docId}`)?.getBoundingClientRect?.());

    const [anchorContainerMaxWidth, setAnchorContainerMaxWidth] = useState(null);

    const isMobile = useMemo(judgePhone, []);
    const [ref, { x, y, width, height: minHeight, top, right, bottom, left }] = useMeasure();
    const [isLarge, setIsLarge] = useState(true);
    const [isMiddle, setIsMiddle] = useState(false);
    const [isWideMode, setIsWideMode] = useState(propsIsWideMode);
    const [editorHeight, setEditorHeight] = useState(isReadOnly ? '100%' : isMobile ? '100%' : 'calc(100% - 32px)');

    const [WIPCommentRangeId, setWIPCommentRangeId] = useState(null);
    const [isShowHistoryManager, setIsShowHistoryManager] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      setEditorHeight(isReadOnly ? '100%' : isMobile ? '100%' : 'calc(100% - 32px)');
    }, [isReadOnly, isMobile]);

    useEffect(() => {
      setTemplateLoading(false);
      setTitleLoading(false);

      const contentWrapListener = obj => {
        setContentWrapRect(obj);
      };
      const contentListener = obj => {
        setContentRect(obj);
      };
      getEditorEventEmitter(docId).on('resizeContentWrap', contentWrapListener, docId);
      getEditorEventEmitter(docId).on('resizeContent', contentListener, docId);

      return () => {
        getEditorEventEmitter(docId).off('resizeContentWrap', contentWrapListener, docId);
        getEditorEventEmitter(docId).off('resizeContent', contentListener, docId);
      };
    }, []);

    useEffect(() => {
      if (typeof ResizeObserver !== 'undefined' && typeof window !== 'undefined') {
        const resizeObservers = [];

        resizeObservers[0] = new ResizeObserver(entries => {
          const entry = entries[0];
          const rect = entry.contentRect;
          console.log('[resizeContentWrap] resize', rect.width, rect.height);
          getEditorEventEmitter(docId).emit('resizeContentWrap', docId, rect);
          getEditorEventEmitter(docId).emit('updateOutlineAnchor', docId);
        });
        document.getElementById(`editor-content-wrap-${docId}`) &&
          resizeObservers[0].observe(document.getElementById(`editor-content-wrap-${docId}`));

        resizeObservers[1] = new ResizeObserver(entries => {
          const rect = entries[0].contentRect;
          console.log('[resizeContent] resize', rect.width, rect.height);
          getEditorEventEmitter(docId).emit('resizeContent', docId, rect);
        });
        document.getElementById(`editor-content-${docId}`) && resizeObservers[1].observe(document.getElementById(`editor-content-${docId}`));
      }
    }, [docId]);

    useEffect(() => {
      const docDirectoryTitle = document.getElementById(`editor-content-wrap-${docId}`)?.getElementsByClassName('doc-directory-title')?.[0];
      console.log('[docDirectoryTitle]', docDirectoryTitle);
      const maxWidth = (docDirectoryTitle && docDirectoryTitle.getBoundingClientRect().width + 36) || 250;
      setAnchorContainerMaxWidth(`${Math.floor(maxWidth) - 16}px`);
    }, [isReadOnly, isWideMode, contentWrapRect?.width, contentRect?.width]);

    useEffect(() => {
      window.tripdocs.editorsMap[docId].readOnly = isReadOnly;
      window.tripdocs.editorsMap[docId].editor.history.undos = [];
      window.tripdocs.editorsMap[docId].editor.history.redos = [];
    }, [isReadOnly]);

    useEffect(() => {
      setEdit(setIsReadOnly, isNoEdit, docId);
      setCache(docId, 'isNoEdit', isNoEdit);
    }, [isNoEdit, socketUrl]);

    useEffect(() => {
      window.tripdocs.editorsMap[docId].api.setIsReadOnly = setIsNoEdit;
      window.tripdocs.editorsMap[docId].api.setSocketUrl = function (
        url: string,
        opt: { defaultValue?: any[]; defaultValue2?: string; docToken?: string; docUrl?: string; identityauth2?: string } = {}
      ) {
        Transforms.deselect(window.tripdocs.editorsMap[docId].editor);
        setCache(docId, 'initTimestamp', new Date().getTime());

        setCache(docId, 'timeCheck', true);
        setCache(docId, 'renderedToDom', false);
        const { defaultValue, defaultValue2, docToken, docUrl = '', identityauth2 } = opt;
        let defaultVal;
        if (defaultValue2) {
          defaultVal = getDefaultValueByBase64(defaultValue2);
        } else {
          defaultVal = defaultValue;
        }

        console.log('options', getCache(docId, 'options'));

        setTemplateLoading(true);
        const options = getCache(docId, 'options');
        setDefaultValue(defaultVal || options.defaultValue);
        setSocketToken(docToken || options.docToken);
        setSocketAuth(identityauth2 || options.identityauth2);
        setCache(docId, 'options', {
          ...options,
          socketUrl: url,
          defaultValue: defaultVal || options.defaultValue,
          docToken: docToken || options.docToken,
          docUrl: docUrl,
          identityauth2: identityauth2,
        });
        console.log('options', getCache(docId, 'options'));
        setTemplateLoading(false);

        window.tripdocs.editorsMap[docId].editor.history.undos = [];
        window.tripdocs.editorsMap[docId].editor.history.redos = [];

        setSocketUrl(url);
      };

      window.tripdocs.editorsMap[docId].api.setTocPlacement = setTocPlace;
      window.tripdocs.editorsMap[docId].api.setDeepestDisplayAnchorHeading = setDeepestDisplayAnchor;
      window.tripdocs.editorsMap[docId].api.setIsShowHoveringCommentButton = setIsShowHoveringCommentButton;
      window.tripdocs.editorsMap[docId].api.setIsShowGlobalComment = setIsShowGlobalComment;
      window.tripdocs.editorsMap[docId].api.setIsShowHelpBlock = setIsShowHelpBlock;
      window.tripdocs.editorsMap[docId].api.setIsShowHistoryManager = setIsShowHistoryManager;
    }, []);

    useEffect(() => {
      if (socketUrl === 'offline') {
        setCache(docId, 'kickedOut', true);

        window.tripdocs.editorsMap[docId]?.socket?.provider?.disconnect();
      } else {
        setCache(docId, 'kickedOut', false);
      }
    }, [socketUrl]);

    useEffect(() => {
      let timeout;
      if (scrollRef.current) {
        setCache(docId, 'editorWrapDom', scrollRef.current);
      }
      const handler = () => {
        if (scrollRef.current) {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            if (!getCache(docId, 'options')?.isMdEditor) {
              setEditorContainerScrollTop(scrollRef.current.scrollTop);
            }
          }, 500);
        }
      };
      if (scrollRef.current) {
        (scrollRef.current as any).addEventListener('scroll', handler, {
          capture: false,
          passive: true,
        });
      }
      return () => {
        if (scrollRef.current) {
          (scrollRef.current as any).removeEventListener('scroll', handler);
        }
      };
    }, [scrollRef]);

    useEffect(() => {
      me && me.name && setLastName(me?.name?.split('）')[0].slice(-2));
    }, [me]);

    useEffect(() => {
      const editor = findAndReplaceMethods?.editor;
      if (typeof window !== 'undefined' && window.document.getElementById(`editorContainer-${docId}`) && editor) {
        const childrenArr = editor.children.slice();
        const titleEl = childrenArr.shift();

        const titleDom = ReactEditor.toDOMNode(editor, titleEl);

        titleDom && titleDom.classList.add('editor-titleEl');
      }
    }, []);

    const titleCallback = (title: any) => {
      const callback = window.tripdocs.editorsMap[docId]?.api?.titleCallback;
      callback && callback(title);
      if (title) setFilename(title);
      else setFilename('未命名文档');
    };

    const isEmptyCallback = (boo: boolean) => {
      if (boo) {
        setTemplateBar(false);
      } else {
        setTemplateBar(true);
      }
    };

    useEffect(() => {
      if (width > 1280) {
        setIsLarge(true);
        setDrawerVisible(false);
      } else if (width > 936) {
        setIsMiddle(true);
        setIsLarge(false);
      } else if (0 < width && width < 936) {
        setIsLarge(false);
        setIsMiddle(false);
      }
    }, [width]);

    const [isShowAnchor, setIsShowAnchor] = useState(true);
    const [isAnchorCollapsed, setIsAnchorCollapsed] = useState(false);

    const handleDeepestHeading = e => {
      console.log(3000000, e);
      setDeepestDisplayAnchor(e.target.value);
    };

    const getHeadTablevel = (type, oldType) => {
      let ret = {};
      ret[ELTYPE.HEADING_ONE] = 0;
      ret[ELTYPE.HEADING_TWO] = 1;
      ret[ELTYPE.HEADING_THREE] = 2;
      ret[ELTYPE.HEADING_FOUR] = 3;
      ret[ELTYPE.HEADING_FIVE] = 4;
      ret[ELTYPE.HEADING_SIX] = 5;
      return ret[type] || ret[oldType] || 0;
    };

    const getText = el => {
      if (el && el.text) return el.text;
      if (el && el.children) return getText(el.children);
      if (el && Array.isArray(el)) return el.map((item: any) => getText(item));
      return '';
    };

    const wrapTextWithStyle = (item, text) => {
      if (!item?.type) return text;
      const { type } = item;
      let styled = text;
      switch (type) {
        case 'bulleted-list':
          if (isMobile) {
            styled = <li style={{ lineHeight: 1.75 }}>{text}</li>;
          } else {
            styled = (
              <UlList prop={{ attributes: {}, element: { ...item } }} isInAnchor={true} lineHeight={1.75}>
                {text}
              </UlList>
            );
          }
          break;
        case 'numbered-list':
          if (isMobile) {
            styled = <span style={{ lineHeight: 1.75, marginLeft: '-0.2em' }}>{item.num + '. ' + text}</span>;
          } else {
            styled = (
              <OlList prop={{ attributes: {}, element: { ...item } }} isInAnchor={true} lineHeight={1.75}>
                {text}
              </OlList>
            );
          }

          break;
        case 'todo-list':
          styled = (
            <TODOList isMobile={isMobile} prop={{ attributes: {}, element: { ...item } }} isInAnchor={true}>
              {text}
            </TODOList>
          );
          break;
      }
      return styled;
    };

    const findLastSameIdTabLevel = (arr, index, id, tabLevel) => {
      if (index >= arr.length || index < 1) {
        return null;
      }
      let res = null;
      let startPointIndex = 0;
      if (tabLevel >= 1) {
        for (let i = index - 1; i >= 0; i--) {
          const curItem = arr[i];
          if (curItem && typeof curItem.tabLevel === 'number' && curItem.tabLevel === tabLevel - 1 && curItem.id === id) {
            startPointIndex = i;
            break;
          }
        }
      }
      for (let i = index - 1; i >= startPointIndex; i--) {
        const curItem = arr[i];

        if (curItem && typeof curItem.tabLevel === 'number' && curItem.tabLevel === tabLevel && curItem.id === id) {
          res = curItem;
          break;
        }
      }
      return res;
    };
    const [drag, setDrag] = useState(false);

    const [focusedRangeId, setFocusedRangeId] = useState(null);

    const [hoveredRangeId, setHoveredRangeId] = useState(null);

    const [identicalSelectionRangeId, setIdenticalSelectionRangeId] = useState(null);

    const resetFocusedRangeId = () => {
      setFocusedRangeId(null);
    };

    const findCallbacks = (highlightRanges: any, editor: any, setValue: any) => {
      setFindAndReplaceMethods({
        highlightRanges: highlightRanges,
        editor: editor,
        setValue: setValue,
      });
    };

    const { find, replace, replaceAll, getNum } = findAndReplace(findAndReplaceMethods.highlightRanges);

    useEffect(() => {
      window.tripdocs.editorsMap[docId].isWideMode = isWideMode;
    }, [isWideMode]);

    const handleCompoStart = e => {
      const { editor } = findAndReplaceMethods;

      setCache(docId, 'isComposing', true);
    };

    const handleCompoEnd = () => {
      setCache(docId, 'isComposing', false);
    };

    const renderPlaceholder = () => {
      const titleText = $(`#editorarea-${docId} h1:first-of-type > span > span > *`)[0];

      const contentParagraphText = $(`#editorarea-${docId} p:first-of-type > span > span > span`)[0];
      const contentParagraphTodo = $(`#editorarea-${docId} p:first-of-type`)[0];

      const contentParagraphLinkText = $(`#editorarea-${docId} p:first-of-type > a > span > span > span`)[0];
      const contentParagraphChildrenLen = $(`#editorarea-${docId} p:first-of-type > span`).length;
      const contentCountArr = $(`#editorarea-${docId}`).children('div').filter(':not(div[class^="placeholder"])');

      const notStyled = contentCountArr && contentCountArr.length == 2 && contentCountArr.has('p > span > span > span[data-slate-length="0"]').length;

      if (
        findAndReplaceMethods?.editor?.children.length > 2 ||
        contentParagraphChildrenLen > 1 ||
        (contentParagraphLinkText && contentParagraphLinkText.textContent) ||
        (notStyled ? contentCountArr.length > 2 : contentCountArr.length >= 2) ||
        (contentParagraphTodo && contentParagraphTodo.getAttribute('data-name') === 'todo-list-item') ||
        (contentParagraphText && contentParagraphText.textContent && encodeURIComponent(contentParagraphText.textContent) !== '%EF%BB%BF')
      ) {
        setPlaceholderContentVisible(false);
      } else {
        setPlaceholderContentVisible(true);
      }
    };

    interface commentDataType {
      userName: string;
      content: string;
      commentId: string;
      rangeId: string;
      time: string;
      mentionedMemberList: string[];
      replyTarget: null | commentDataType;
    }
    const [commentData, setCommentData] = useState<commentDataType[]>(defaultCommentData);
    if (typeof window === 'object' && window.tripdocs.editorsMap[docId]) {
      window.tripdocs.editorsMap[docId].api.setCommentData = function (args) {
        setCommentData(args);
      };
      window.tripdocs.editorsMap[docId].api.setTemplate = setTemplate;
      window.tripdocs.editorsMap[docId].api.setIsWideMode = setIsWideMode;

      window.tripdocs.editorsMap[docId].api.setIsShowAnchor = setIsShowAnchor;
      window.tripdocs.editorsMap[docId].api.setLoading = setLoading;
    }

    const [isShowMobileToolBar, setIsShowMobileToolBar] = useState(false);

    useEffect(() => {
      const updateState = (selection: null | Range) => {
        const isShowMobileMenuPopup = getCache(docId, 'isShowMobileMenuPopup');
        console.log('getEditorEventEmitter selection:', selection, '. isShowMobileMenuPopup:', isShowMobileMenuPopup);
        if (selection) {
          if (getCache(docId, 'isShowMobileToolBar') !== true) {
            setCache(docId, 'isShowMobileToolBar', true);
            setIsShowMobileToolBar(true);
          }
        } else {
          if (getCache(docId, 'isShowMobileToolBar') !== false && !isShowMobileMenuPopup) {
            setCache(docId, 'isShowMobileToolBar', false);
            setIsShowMobileToolBar(false);
          }
        }
      };

      if (isMobile) {
        getEditorEventEmitter(docId).on('editorSelection', updateState, docId, false);
      }
      return () => {
        getEditorEventEmitter(docId).off('editorSelection', updateState, docId);
      };
    }, [isMobile]);

    useEffect(() => {
      getEditorEventEmitter(docId).emit('updateOutlineAnchor', docId);
    }, [isMobile, isLarge, isShowAnchor, deepestDisplayAnchor, isAnchorCollapsed]);

    useEffect(() => {
      if (scrollRef.current) {
        $(scrollRef.current).bind('click', function (e) {
          console.log('[scrollRef]click 捕获！！！');
          getEditorEventEmitter(docId).emit('scrollRefClick', docId, e);
        });
      }
      return () => {
        $(scrollRef.current).unbind('click');
      };
    }, []);

    const hasCallbacks =
      window?.tripdocs?.editorsMap?.[docId]?.api?.getDocHistoryCallback &&
      window?.tripdocs?.editorsMap?.[docId]?.api?.getDocBlobByVersionCallback &&
      window?.tripdocs?.editorsMap?.[docId]?.api?.restoreDocCallback;

    return (
      <div className="editor_container_wrap" ref={ref}>
        <ErrorBoundary
          FallbackComponent={fallback => <FallbackComponent docId={docId} editor={findAndReplaceMethods.editor} fallback={fallback} />}
          onError={error => {
            console.error('[ErrorBoundary] onError: ', error);
          }}
        >
          <TripdocsSdkContext.Provider
            value={{
              docId,
              editor: findAndReplaceMethods.editor,
              userInfo,
              isWide: isLarge,
              isInElectron: isInElectron,
              isMobile,
              isWideMode: isWideMode,
              isMiddle: isMiddle,
              isReadOnly,
              WIPCommentRangeId,
              setWIPCommentRangeId,
              allUserList: chars,
              hoveredRangeId,
              focusedRangeId,
              resetFocusedRangeId,
              setFocusedRangeId,
              identicalSelectionRangeId,
              setIdenticalSelectionRangeId,
              setSideCommentRowNum,
              setCurRangeId,
              isDrag: drag,
            }}
          >
            {loading ? (
              <div
                id="spin"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  position: 'absolute',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'none',
                  zIndex: 99999,
                  background: 'rgb(2,2,2,0.1)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  自动修复数据中，请稍后
                  <Spin size="large" indicator={<LoadingOutlined spin />} />
                </div>
              </div>
            ) : null}
            {isMobile ? (
              isReadOnly ? null : (
                <MobileToolbar
                  editor={findAndReplaceMethods.editor}
                  docWidth={docWidth}
                  modalState={modalState}
                  isReadOnly={isReadOnly}
                  currentColor={currentColor}
                  setCurrentColor={setCurrentColor}
                  anchorTrigger={anchorTrigger}
                  display={isShowMobileToolBar ? 'block' : 'none'}
                ></MobileToolbar>
              )
            ) : isReadOnly && !options.showTopMenuOnlyRead ? null : (
              <StaticToolbar
                editor={findAndReplaceMethods.editor}
                editorSelection={editorSelection}
                docWidth={docWidth}
                modalState={modalState}
                currentColor={currentColor}
                setCurrentColor={setCurrentColor}
                anchorTrigger={anchorTrigger}
                setValue={findAndReplaceMethods.setValue}
                isShowAnchor={isShowAnchor}
                setIsShowAnchor={setIsShowAnchor}
              ></StaticToolbar>
            )}

            <div
              id={'editor-content-wrap-' + docId}
              ref={scrollRef}
              className={classNames({
                'editor-container': true,
                'editor-shell': true,
              })}
              style={{
                display: titleLoading || templateLoading ? 'none' : isMobile || (!isMiddle && !isLarge) ? 'block' : 'grid',
                height: editorHeight,
                position: 'relative',
                gridGap: isMdEditor ? 0 : '18px',
                gridTemplateColumns:
                  !isShowAnchor || !isLarge || (isWideMode && isAnchorCollapsed)
                    ? '0 minmax(752px, 100vw) 0'
                    : isWideMode && !isAnchorCollapsed
                    ? tocPlace === 'left'
                      ? 'minmax(0px, 280px) minmax(752px, 100vw) minmax(0px, 0px)'
                      : 'minmax(0px, 0px) minmax(752px, 100vw) minmax(0px, 280px)'
                    : 'minmax(0px, 280px) minmax(752px, 100vw) minmax(0px, 280px)',
                gridTemplateRows: 'max-content max-content',
                background: isInElectron ? 'rgb(242,244,246)' : theme && theme.backgroundColor ? theme.backgroundColor : '#ffffff',
              }}
              onDragOver={event => {
                setDrag(true);
              }}
              onDrag={event => {
                setDrag(false);
              }}
              onDragLeave={event => {
                setDrag(false);
              }}
            >
              {socketUrl !== 'offline' ? (
                <Editor
                  id={me.id}
                  name={me.name}
                  slug={docId}
                  docToken={socketToken}
                  docId={docId}
                  titleCallback={titleCallback}
                  userInfo={userInfo}
                  isEmpty={isEmptyCallback}
                  allUserList={chars}
                  template={template}
                  fileId={fileId}
                  anchorTrigger={anchorTrigger}
                  defaultValue={defaultValue}
                  findCallbacks={findCallbacks}
                  searchText={searchText}
                  replaceText={replaceText}
                  findSelection={findSelection}
                  setEditorSelection={setEditorSelection}
                  getNum={getNum}
                  shareCallback={shareCallback}
                  setFocusedRangeId={setFocusedRangeId}
                  focusedRangeId={focusedRangeId}
                  setHoveredRangeId={setHoveredRangeId}
                  setTitleLoading={setTitleLoading}
                  setTemplateLoading={setTemplateLoading}
                  titleLoading={titleLoading}
                  templateLoading={templateLoading}
                  handleCompoStart={handleCompoStart}
                  handleCompoEnd={handleCompoEnd}
                  type="normal"
                  renderPlaceholder={renderPlaceholder}
                  setDocWidth={setDocWidth}
                  setModalState={setModalState}
                  currentColor={currentColor}
                  setCurrentColor={setCurrentColor}
                  socketUrl={socketUrl}
                  setSideCommentRowNum={setSideCommentRowNum}
                  sideCommentRowNum={sideCommentRowNum}
                  setCurRangeId={setCurRangeId}
                  setChars={setChars}
                  chars={chars}
                  isShowHoveringCommentButton={isShowHoveringCommentButton}
                  {...me}
                  key={me.id}
                  removeUser={() => {}}
                  fake={fake}
                  identityauth2={socketAuth}
                  commentData={commentData}
                  secure={secure}
                  setPlaceholderRects={setPlaceholderRects}
                ></Editor>
              ) : (
                <EditorNative
                  id={me.id}
                  name={me.name}
                  docId={docId}
                  titleCallback={titleCallback}
                  userInfo={userInfo}
                  isEmpty={isEmptyCallback}
                  defaultValue={defaultValue}
                  allUserList={chars}
                  template={template}
                  fileId={fileId}
                  anchorTrigger={anchorTrigger}
                  findCallbacks={findCallbacks}
                  searchText={searchText}
                  replaceText={replaceText}
                  findSelection={findSelection}
                  setEditorSelection={setEditorSelection}
                  getNum={getNum}
                  shareCallback={shareCallback}
                  setFocusedRangeId={setFocusedRangeId}
                  focusedRangeId={focusedRangeId}
                  setHoveredRangeId={setHoveredRangeId}
                  setTitleLoading={setTitleLoading}
                  setTemplateLoading={setTemplateLoading}
                  titleLoading={titleLoading}
                  templateLoading={templateLoading}
                  handleCompoStart={handleCompoStart}
                  handleCompoEnd={handleCompoEnd}
                  type="normal"
                  renderPlaceholder={renderPlaceholder}
                  setDocWidth={setDocWidth}
                  setModalState={setModalState}
                  currentColor={currentColor}
                  setCurrentColor={setCurrentColor}
                  {...me}
                  key={me.id}
                  removeUser={() => {}}
                  socketUrl={socketUrl}
                  setSideCommentRowNum={setSideCommentRowNum}
                  sideCommentRowNum={sideCommentRowNum}
                  setCurRangeId={setCurRangeId}
                  setChars={setChars}
                  chars={chars}
                  isShowHoveringCommentButton={isShowHoveringCommentButton}
                  commentData={commentData}
                  setPlaceholderRects={setPlaceholderRects}
                ></EditorNative>
              )}

              {!isMobile && isLarge && isShowAnchor && (
                <div
                  className="anchor-sticky-wrapper"
                  style={{
                    gridRow: 1,
                    gridColumn: tocPlace === 'left' ? 1 : 3,
                    width: 'auto',
                  }}
                >
                  {isAnchorCollapsed ? (
                    <div
                      className={css`
                        position: absolute;
                        top: 46px;
                        width: 41px;
                        height: 40px;
                        ${tocPlace === 'left' ? `left: 0;` : `right: 0;`}
                        cursor: pointer;
                        z-index: 0;
                        text-align: center;
                        line-height: 40px;
                        font-size: 16px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background: #fff;
                        box-shadow: 0px 1px 8px 0px rgba(42, 51, 60, 0.08);
                        .Tripdocs-menu {
                          color: #4a535d;
                          &:hover {
                            color: #3264ff;
                          }
                        }
                      `}
                      onMouseDown={e => {
                        e.preventDefault();
                        setIsAnchorCollapsed(false);
                      }}
                    >
                      <Tooltip title={f('expandAnchor')} placement="topLeft">
                        <IconBtn className="Tripdocs-menu" />
                      </Tooltip>
                    </div>
                  ) : (
                    <>
                      <DocTocTitle
                        showCollapseBtn={true}
                        isAnchorCollapsed={isAnchorCollapsed}
                        handleDeepestHeading={handleDeepestHeading}
                        deepestDisplayAnchor={deepestDisplayAnchor}
                        setIsAnchorCollapsed={setIsAnchorCollapsed}
                        tocPlacement={tocPlace}
                      />
                      <div
                        data-ignore-slate
                        ref={anchorContainerRef}
                        className={cx('anchor-container', 'ignore-toggle-readonly')}
                        style={{
                          maxHeight: contentWrapRect?.height && contentWrapRect.height - 65,
                          maxWidth: anchorContainerMaxWidth,
                          overscrollBehavior: 'none',

                          left: '24px',
                          paddingLeft: '4px',
                        }}
                      >
                        <OutlineAnchor
                          editor={findAndReplaceMethods.editor}
                          docId={docId}
                          scrollRef={scrollRef}
                          deepestDisplayAnchor={deepestDisplayAnchor}
                          isLarge={isLarge}
                          isMobile={isMobile}
                          isShowAnchor={isShowAnchor}
                          maxWidth={anchorContainerMaxWidth}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div
                id={`overlayContainer-${docId}`}
                ref={overlayContainerRef}
                className={cx(
                  'inner-overlay-container',
                  css`
                    top: 0px;
                    left: 0px;
                    position: absolute;
                    z-index: 1000;
                  `
                )}
              ></div>

              <div id={`editorContainerBottom-${docId}`} style={{ gridColumn: 2 }}></div>

              {isShowGlobalComment && typeof window !== 'undefined' && !(isMobile && !isReadOnly) && (
                <EditorContainerBottomPortal docId={docId}>
                  <GlobalComment
                    isMobile={isMobile}
                    commentData={commentData}
                    setCommentData={setCommentData}
                    editor={findAndReplaceMethods.editor}
                  ></GlobalComment>
                </EditorContainerBottomPortal>
              )}
            </div>

            {typeof window !== 'undefined' &&
              window.document.getElementById(`editorContainer-${docId}`) &&
              findAndReplaceMethods.editor &&
              sideCommentRowNum !== -1 && (
                <SideCommentCreator
                  editor={findAndReplaceMethods.editor}
                  sideCommentRowNum={sideCommentRowNum}
                  isShowHoveringCommentButton={isShowHoveringCommentButton}
                  docId={docId}
                  setSideCommentRowNum={setSideCommentRowNum}
                  rangeId={curRangeId}
                  curUserName={me.name}
                  WIPCommentRangeId={WIPCommentRangeId}
                  setWIPCommentRangeId={setWIPCommentRangeId}
                  identicalSelectionRangeId={identicalSelectionRangeId}
                  setIdenticalSelectionRangeId={setIdenticalSelectionRangeId}
                  editorClientRect={document.getElementById(`editorarea-${docId}`).getBoundingClientRect()}
                  containerClientRect={document.getElementById(`editorarea-${docId}`)?.parentElement?.parentElement?.getBoundingClientRect()}
                />
              )}
            {}

            {typeof window !== 'undefined' && window.document.getElementById(`editorContainer-${docId}`) && findAndReplaceMethods.editor ? (
              <EditorContainerInnerPortal docId={docId}>
                <AllCommentsList
                  editor={window.tripdocs.editorsMap[docId]?.editor}
                  docId={docId}
                  isShowHoveringCommentButton={isShowHoveringCommentButton}
                />
                {}
              </EditorContainerInnerPortal>
            ) : null}

            {!isMobile && typeof window !== 'undefined' && window.document.getElementById(`editorContainer-${docId}`) && (
              <Drawer
                data-ignore-slate
                className="hotkey-helper-drawer"
                placement={'right'}
                width={330}
                closable={true}
                maskClosable={true}
                onClose={() => setIsShowHotkeyHelper(false)}
                visible={isShowHotkeyHelper}
                getContainer={window.document.getElementById(`editorContainer-${docId}`) as any}
                title={<div className="hotkey-drawer-header">{f('quickGuide')}</div>}
                headerStyle={{
                  fontSize: '18px',
                  fontWeight: 500,
                }}
              >
                <HotkeyHelperContent />
              </Drawer>
            )}
            {}
            {typeof window !== 'undefined' &&
            window.document.getElementById(`editorContainer-${docId}`) &&
            findAndReplaceMethods.editor &&
            !isShowHistoryManager ? (
              <EditorContainerOuterPortal docId={docId}>
                <SideTipContainer
                  editor={findAndReplaceMethods.editor}
                  docId={docId}
                  editorContainerScrollTop={editorContainerScrollTop}
                  isMobile={isMobile}
                  scrollRef={scrollRef}
                  showHelpBlock={isShowHelpBlock}
                  setIsShowHotkeyHelper={setIsShowHotkeyHelper}
                ></SideTipContainer>
              </EditorContainerOuterPortal>
            ) : null}
            {typeof window !== 'undefined' && window.document.getElementById(`editorContainer-${docId}`) && findAndReplaceMethods.editor ? (
              <EditorContainerInnerPortal docId={docId}>
                <AllCommentsList
                  editor={window.tripdocs.editorsMap[docId].editor}
                  docId={docId}
                  isShowHoveringCommentButton={isShowHoveringCommentButton}
                />
                {}
              </EditorContainerInnerPortal>
            ) : null}

            {!isMobile && typeof window !== 'undefined' && window.document.getElementById(`editorContainer-${docId}`) && (
              <Drawer
                data-ignore-slate
                className="hotkey-helper-drawer"
                placement={'right'}
                width={330}
                closable={true}
                maskClosable={true}
                onClose={() => setIsShowHotkeyHelper(false)}
                visible={isShowHotkeyHelper}
                getContainer={window.document.getElementById(`editorContainer-${docId}`) as any}
                title={<div className="hotkey-drawer-header">{f('quickGuide')}</div>}
                headerStyle={{
                  fontSize: '18px',
                  fontWeight: 500,
                }}
              >
                <HotkeyHelperContent />
              </Drawer>
            )}

            {hasCallbacks && typeof window !== 'undefined' && window.document.getElementById(`editorContainer-${docId}`) && (
              <Drawer
                data-ignore-slate
                className="history-manager-drawer"
                placement={'right'}
                width={'100vw'}
                closable={true}
                maskClosable={true}
                onClose={() => setIsShowHistoryManager(false)}
                visible={isShowHistoryManager}
                getContainer={window.document.getElementById(`editorContainer-${docId}`) as any}
                title={<div className="history-manager-drawer-header"></div>}
                closeIcon={
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <IconBtn className="Tripdocs-drop_left" />
                    <span style={{ color: '#000', marginLeft: '8px', fontWeight: 300 }}>{f('returnToDoc')}</span>
                  </div>
                }
                headerStyle={{
                  height: '64px',
                }}
              >
                <HistoryManager docId={docId} editor={findAndReplaceMethods.editor} isShowHistoryManager={isShowHistoryManager} />
              </Drawer>
            )}

            {!isMobile && !isLarge && isShowAnchor && typeof window !== 'undefined' && window.document.getElementById(`editorContainer-${docId}`) && (
              <Drawer
                data-ignore-slate
                className="anchor-drawer"
                placement={tocPlace === 'left' ? 'left' : 'right'}
                width={330}
                closable={false}
                onClose={() => setDrawerVisible(false)}
                visible={drawerVisible}
                getContainer={window.document.getElementById(`editorContainer-${docId}`)?.firstElementChild as any}
                handler={
                  <div
                    className={classNames('drawer-handle', `drawer-${tocPlace === 'left' ? 'left' : 'right'}`)}
                    onClick={() => setDrawerVisible(!drawerVisible)}
                    style={{
                      top: 29 + 46,
                    }}
                  >
                    {drawerVisible ? <CloseOutlined /> : <IconBtn className="Tripdocs-menu" />}
                  </div>
                }
              >
                <div
                  data-ignore-slate
                  className={cx(
                    css`
                      & {
                        min-width: 171px;
                        position: absolute;
                        margin: 24px 0 0 0px;
                        overflow-y: auto;
                        overflow-x: hidden;
                        z-index: 500;
                      }
                    `,
                    'ignore-toggle-readonly'
                  )}
                  style={{
                    maxHeight: contentWrapRect?.height && contentWrapRect.height - 98,
                  }}
                >
                  <OutlineAnchor
                    editor={findAndReplaceMethods.editor}
                    docId={docId}
                    scrollRef={scrollRef}
                    deepestDisplayAnchor={deepestDisplayAnchor}
                    isLarge={isLarge}
                    isMobile={isMobile}
                    isShowAnchor={isShowAnchor}
                    maxWidth={'250px'}
                  />
                </div>
              </Drawer>
            )}
            {isMobile && isShowAnchor && typeof window !== 'undefined' && window.document.getElementById(`editorContainer-${docId}`) && (
              <Drawer
                data-ignore-slate
                className="anchor-drawer"
                placement={tocPlace === 'left' ? 'left' : 'right'}
                width={'15rem'}
                closable={false}
                onClose={() => setDrawerVisible(false)}
                visible={drawerVisible}
                getContainer={window.document.getElementById(`editorContainer-${docId}`)?.firstElementChild as any}
                handler={
                  <div
                    className={css`
                      & {
                        width: 2rem;
                        height: 2rem;
                        ${tocPlace === 'left' ? `right: -2rem;` : `left: -2rem;`}
                        position: absolute;
                        top: 8rem;
                        cursor: pointer;
                        z-index: 0;
                        text-align: center;
                        line-height: 3.5rem;
                        font-size: 1rem;
                        display: -webkit-box;
                        display: -ms-flexbox;
                        display: flex;
                        -webkit-box-pack: center;
                        -ms-flex-pack: center;
                        justify-content: center;
                        -webkit-box-align: center;
                        -ms-flex-align: center;
                        align-items: center;
                        background: #fff;
                        -webkit-box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
                        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
                        border-radius: ${tocPlace === 'left' ? `0 4px 4px 0` : `4px 0 0 4px`};
                      }
                    `}
                    onClick={() => setDrawerVisible(!drawerVisible)}
                  >
                    {drawerVisible ? <CloseOutlined /> : <IconBtn className="Tripdocs-menu" />}
                  </div>
                }
              >
                <DocTocTitle
                  showCollapseBtn={false}
                  isAnchorCollapsed={isAnchorCollapsed}
                  handleDeepestHeading={handleDeepestHeading}
                  deepestDisplayAnchor={deepestDisplayAnchor}
                  setIsAnchorCollapsed={setIsAnchorCollapsed}
                  tocPlacement={tocPlace}
                />
                <div
                  data-ignore-slate
                  className={cx(
                    css`
                      & {
                        min-width: 171px;
                        position: absolute;
                        margin: 24px 0 0 0px;
                        overflow-y: auto;
                        overflow-x: hidden;
                        z-index: 500;
                      }
                    `,
                    'ignore-toggle-readonly'
                  )}
                  style={{
                    maxHeight: contentWrapRect?.height && contentWrapRect.height - 98,
                  }}
                >
                  <OutlineAnchor
                    editor={findAndReplaceMethods.editor}
                    docId={docId}
                    scrollRef={scrollRef}
                    deepestDisplayAnchor={deepestDisplayAnchor}
                    isLarge={isLarge}
                    isMobile={isMobile}
                    isShowAnchor={isShowAnchor}
                    maxWidth={'250px'}
                  />
                </div>
              </Drawer>
            )}
            {}
            {typeof window !== 'undefined' &&
              window.document.getElementById(`editorContainer-${docId}`) &&
              placeholderContentVisible &&
              !isReadOnly && (
                <EditorContainerInnerPortal docId={docId}>
                  <div
                    data-ignore-slate
                    className={cx(
                      'placeholder-content',
                      'ignore-toggle-readonly',
                      css`
                        position: absolute;
                        user-select: none;
                        pointer-events: none;
                        color: rgba(0, 0, 0, 0.25);
                        line-height: ${findAndReplaceMethods.editor?.children[1]?.lineHeight ?? null};

                        font-size: 14px;
                      `
                    )}
                    contentEditable={false}
                    style={{
                      display: placeholderContentVisible ? null : 'none',
                      top: placeholderRects.contentRect.top,
                      left: placeholderRects.contentRect.left,
                    }}
                  >
                    {f('contextHint')}
                  </div>
                </EditorContainerInnerPortal>
              )}
          </TripdocsSdkContext.Provider>
        </ErrorBoundary>
      </div>
    );
  } catch (e) {
    console.log('****Catch Error: ', e);
  }
};

export const judgePhone = function () {
  let userAgent = navigator.userAgent,
    Agents = ['Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod'];
  return Agents.some(i => {
    return userAgent.includes(i);
  });
};

export default Docs;
