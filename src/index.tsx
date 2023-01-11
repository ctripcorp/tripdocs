import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import html2canvas from 'html2canvas';
import * as html2pdf from 'html2pdf.js';

import { Text, Node } from '@src/components/slate-packages/slate';

import { ELTYPE, HEADING_TYPES, slateDefaultValue } from './components/docs/plugins/config';
import Docs from './Docs';
import './style/less/slatedocs-sdk.less';
import { addApiListener } from './utils/apiListener';
import storage from './utils/storage';
import '@src/style/less/slatedocs.less';
import MdDocs from './MdDocs';
import { getCache, setCache } from './utils/cacheUtils';
import { getDefaultValueByBase64 } from './utils/getDefaultValue';
import { createUUID } from './utils/randomId';
import sessStorage from './utils/sessStorage';

export const Editor = function (opt: Options, container: any) {
  if (typeof window !== 'object') {
    return;
  }

  const options = { ...opt };
  const {
    onSlateChange = function onSlateChange() {},
    titleCallback = function titleCallback() {},
    initCallback = function initCallback() {},
    mentionCallback = function mentionCallback() {},
    roomUsersCallback = function roomUsersCallback() {},
    commentCallback = function commentCallback() {},
    shareCallback = function shareCallback() {},
    docStatusCallback = function docStatusCallback() {},
    getDocHistoryCallback = function getDocHistoryCallback() {},
    getDocBlobByVersionCallback = function getDocBlobByVersionCallback() {},
    restoreDocCallback = function restoreDocCallback() {},
    mdRefreshDocCallback = function mdRefreshDocCallback() {},
    getDocToken = async function getDocToken() {
      return Promise.resolve(null);
    },
    getUserList = null,
    linkClickCallBack = async function linkClickCallBack() {
      return Promise.resolve([]);
    },
    lang = 'zh',
  } = options;
  console.log(`tripdocs start init, version:` + require('../package.json').version);
  window.tripdocs.lang = lang;
  if (!window.tripdocs.cache.console) {
    try {
      window.tripdocs.cache.console = console;
      const proxy = new Proxy(window.tripdocs.cache.console.error, {
        apply(target, thisArg, ...args) {
          try {
            const errStr = args.toString();
            if (errStr && errStr.indexOf('Warning:') !== 0 && errStr.indexOf('ErrorBoundary') === -1 && errStr.indexOf('[handleSlateError]') !== 0) {
              let errFormat = '\n----\n' + errStr + '\n----\n';

              try {
                throw new Error();
              } catch (error: any) {
                errFormat += '\n----\n' + error.stack + '\n----\n';
              }
              console.log('proxy err stack:', errFormat);
              let newStack: any[] = [];
              const stack: any[] = getCache(options.docId, 'changeEditorStack') || [];
              if (stack.length >= 1) {
                newStack.push(stack[0]);
                for (let i = 1; i < stack.length; i++) {
                  newStack.push({
                    content: [],
                    operations: stack[i].operations,
                  });
                }
              } else {
                newStack = stack;
              }
              const id = createUUID();
              sessStorage.set('tripdocs_sdk/ubtErrorId', id);
              sessStorage.set('tripdocs_sdk/ubtError', errFormat + '\n id:' + id);

              const str = JSON.stringify(newStack);
              const sliceLen = 10 * 1000;
              const num = Math.ceil(str.length / sliceLen);

              for (let i = 0; i < num; i++) {}
            }
          } catch (error) {
          } finally {
            return Reflect.apply(target, thisArg, ...args);
          }
        },
      });
      console.error = proxy;
    } catch (error) {
      console.error(error);
    }
  }

  verifyOptions(options);
  polyfillJs();

  const { employee, userName: name } = options.userInfo;

  const dom = container || document.getElementById(`editorContainer-${options.docId}`);
  let isDOM =
    typeof HTMLElement === 'object'
      ? function (obj) {
          return obj instanceof HTMLElement;
        }
      : function (obj) {
          return obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
        };
  if (!isDOM(dom)) {
    console.error('dom err', dom);
    return;
  }

  window.tripdocs.editorsMap = window.tripdocs.editorsMap
    ? { ...window.tripdocs.editorsMap, [options.docId]: { ...options } }
    : { [options.docId]: { ...options } };
  window.tripdocs.editorsMap[options.docId].cache = {
    textValue: '',
    commentId: '',
    timeCheck: true,
    docContentQueue: [],
  };
  setCache(options.docId, 'options', options);
  const initTimestamp = new Date().getTime();
  console.log('[time check] benchmark timestamp: ', initTimestamp);
  setCache(options.docId, 'initTimestamp', initTimestamp);

  dom.addEventListener(
    'unload',
    () => {
      delete window.tripdocs.editorsMap[options.docId];
    },
    { once: true }
  );

  if (!options) {
    ReactDOM.render(<div>init error,your options is null</div>, dom);
    return;
  }
  window.tripdocs.editorsMap[options.docId].api = {};

  addApiListener(onSlateChange, options.docId);
  addApiListener(initCallback, options.docId);
  addApiListener(mentionCallback, options.docId);
  addApiListener(roomUsersCallback, options.docId);
  addApiListener(commentCallback, options.docId);
  addApiListener(shareCallback, options.docId);
  addApiListener(docStatusCallback, options.docId);
  addApiListener(getDocHistoryCallback, options.docId);
  addApiListener(getDocBlobByVersionCallback, options.docId);
  addApiListener(restoreDocCallback, options.docId);
  addApiListener(mdRefreshDocCallback, options.docId);

  if (options.isMdEditor) {
    ReactDOM.render(<MdDocs {...options} name={name} />, dom);
  } else {
    ReactDOM.render(<Docs {...options} name={name} />, dom);
  }

  window.tripdocs.editorsMap[options.docId].api.getContent = getContentForID(options.docId);
  window.tripdocs.editorsMap[options.docId].api.getTitle = getTitleForID(options.docId);
  window.tripdocs.editorsMap[options.docId].api.getMentions = getAllMentionsForID(options.docId);
  window.tripdocs.editorsMap[options.docId].api.getHeadings = getHeadingsForID(options.docId);
  window.tripdocs.editorsMap[options.docId].api.getComments = getAllComment(options.docId);
  window.tripdocs.editorsMap[options.docId].api.destroy = destroy(options.docId);
  window.tripdocs.editorsMap[options.docId].api.reload = reload(options);
  window.tripdocs.editorsMap[options.docId].api.scrollToViewByAnchorId = scrollToViewByAnchorId(options.docId);
  window.tripdocs.editorsMap[options.docId].api.scrollToViewByRangeId = scrollToViewByRangeId(options.docId);
  window.tripdocs.editorsMap[options.docId].api.getUserList = getUserList;
  window.tripdocs.editorsMap[options.docId].api.linkClickCallBack = linkClickCallBack;
  window.tripdocs.editorsMap[options.docId].api.titleCallback = titleCallback;
  window.tripdocs.editorsMap[options.docId].api.getDocToken = getDocToken;
  window.tripdocs.editorsMap[options.docId].api.compareDocContentWithDefault = compareDocContentWithDefault(options.docId);
  window.tripdocs.editorsMap[options.docId].api.setContent = setContent(options.docId);
  window.tripdocs.editorsMap[options.docId].api.getContentByBase64 = getDefaultValueByBase64;
  window.tripdocs.editorsMap[options.docId].api.getEditorBottomDom = getEditorBottomDom(options.docId);
  window.tripdocs.editorsMap[options.docId].api.joinDevGroup = options?.joinDevGroup;

  return window.tripdocs.editorsMap[options.docId];
};
window.tripdocs = {
  Editor,
  cache: {},
  lang: 'zh',
  rrwebRecord: { upload: () => {} },
};
function dynamicLoadJs(url, callback?: Function) {
  if (document.getElementsByTagName('head')[0].outerHTML.includes(url)) {
    return;
  }
  let head = document.getElementsByTagName('head')[0];
  let script: any = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;
  if (typeof callback == 'function') {
    script.onload = script.onreadystatechange = function () {
      if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
        callback();
        script.onload = script.onreadystatechange = null;
      }
    };
  }
  head.appendChild(script);
}

function getContentForID(docId = 'default') {
  return () => window.tripdocs.editorsMap[docId]?.editor?.children;
}

function getTitleForID(docId = 'default') {
  return () => Node.string(window.tripdocs.editorsMap[docId]?.editor?.children[0]);
}

function getAllMentionsForID(docId = 'default') {
  return () => {
    const { SlateEditor: Editor, editor } = window.tripdocs.editorsMap[docId];
    if (!editor) {
      return;
    }
    const arr = [];
    for (let node of editor.children) {
      if (node.type === ELTYPE.MENTION) {
        console.log('getMentions editor.--------------', node);
        arr.push(node);
      }
    }
    return arr;
  };
}

function getHeadingsForID(docId = 'default') {
  return () => {
    const { SlateEditor: Editor, editor } = window.tripdocs.editorsMap[docId];
    const arr = [];

    for (let node of editor.children) {
      if (HEADING_TYPES.includes(node.type)) {
        console.log('getHeadings editor.--------------', node);
        arr.push({
          string: Node.string(node),
          type: node.type,
        });
      }
    }
    return arr;
  };
}

function getAllComment(docId = 'default') {
  return () => {
    return window.tripdocs.editorsMap[docId].commentData;
  };
}

function destroy(docId = 'default') {
  return () => {
    window.tripdocs.editorsMap[docId] &&
      window.tripdocs.editorsMap[docId]?.socket?.provider?.disconnect &&
      window.tripdocs.editorsMap[docId]?.socket?.provider?.destroy();
    const container = document.getElementById(`editorContainer-${docId}`);

    if (container) {
      ReactDOM.unmountComponentAtNode(container);
    }
    delete window.tripdocs.editorsMap[docId];
  };
}

function reload(options) {
  return () => {
    const { docId } = options;
    const container = document.getElementById(`editorContainer-${docId}`);
    ReactDOM.unmountComponentAtNode(container);
    const editor = new window.tripdocs.Editor(options, container);
    return editor;
  };
}

function scrollToViewByAnchorId(docId = 'default') {
  return (anchorId: string) => {
    const { SlateEditor: Editor, editor, ReactEditor } = window.tripdocs.editorsMap[docId];
    const curNodeEntry = Editor.nodes(editor, {
      at: [],
      match: (n: any) => n?.anchorId === anchorId,
    }).next().value;

    const anchorItemEl = ReactEditor.toDOMNode(editor, curNodeEntry[0]);
    anchorItemEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    $(anchorItemEl).on('webkitAnimationEnd animationEnd', function () {
      $(this).removeClass('anchor-target');
    });
    $(anchorItemEl).addClass('anchor-target');
  };
}

function scrollToViewByRangeId(docId = 'default') {
  return (rangeId: string) => {
    const json = JSON.parse(rangeId);
    const { SlateEditor: Editor, editor, ReactEditor } = window.tripdocs.editorsMap[docId];
    const curNodeEntry = Editor.nodes(editor, {
      at: [],
      match: (n: any) => n?.anchorId === json.anchorId,
    }).next().value;

    const anchorItemEl = ReactEditor.toDOMNode(editor, curNodeEntry[0]);
    anchorItemEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    $(anchorItemEl).on('webkitAnimationEnd animationEnd', function () {
      $(this).removeClass('anchor-target');
    });
    $(anchorItemEl).addClass('anchor-target');
  };
}

function compareDocContentWithDefault(docId = 'default') {
  return () => {
    const undos = window.tripdocs.editorsMap[docId].editor.history.undos as any[][];
    const result = undos.some(arr => {
      return arr.some(op => {
        if (op.type !== 'set_selection') {
          return true;
        }
        return false;
      });
    });
    return result;
  };
}
function setContent(docId = 'default') {
  return (obj: any, mode: string = 'json', loading: boolean) => {
    if (!window.tripdocs.editorsMap[docId].api.setTemplate) {
      console.error('setContent setTemplate function undefined');
      return;
    }
    const api = window.tripdocs.editorsMap[docId]?.api;
    loading && api && api?.setLoading(true);

    if (mode === 'json') {
      const newJson = execModalParam(docId, obj);
      api?.setTemplate(newJson);
      return;
    }

    const json = getDefaultValueByBase64(obj);
    const newJson = execModalParam(docId, json);

    console.log('setContent ::', newJson);
    api?.setTemplate(newJson);
  };
}
export function execModalParam(docId: string, content: any[]) {
  const options = getCache(docId, 'options');
  try {
    if (options.openModalParam && Array.isArray(content)) {
      if (Node.string(content[0]) === '$name') {
        const name = options?.userInfo?.userName;
        const title = { ...content[0], children: [{ text: name }] };
        return [title, ...content.slice(1)];
      }
    }
  } catch (error) {
    console.error('execModalParam error');
    return content;
  }
  return content;
}
function getEditorBottomDom(docId = 'default') {
  return () => {
    try {
      const dom = document.getElementById('editorContainer-bottom-' + docId);
      return dom;
    } catch (error) {
      console.log(error);
    }
  };
}

function verifyOptions(options: Options) {
  const containerVerify = document.getElementById(`editorContainer-${options.docId}`);

  if (!options.docId || !containerVerify) {
    console.error('没有 docId，或者 editorContainer-${docId}无法获取 dom，不可以初始化');
    return;
  }
  if (!options.allUserList) {
    options.allUserList = [];
  }
  if (!options.openModalParam) {
    options.openModalParam = true;
  }
  if (!options.useTripdocsFileUpload) {
    options.useTripdocsFileUpload = false;
  }
  if (typeof options.historyVersionShortKey !== 'boolean') {
    options.historyVersionShortKey = false;
  }
  if (!options.defaultTitle) {
    options.defaultTitle = '';
  }
  if (!options.reloadCallback) {
    options.reloadCallback = function () {};
  }
  if (!options.spellcheck) {
    options.spellcheck = false;
  }
  if (!options.defaultUserList) {
    options.defaultUserList = [];
  }
  if (!options.banCommentNesting) {
    options.banCommentNesting = false;
  }
  if (!options.openAutoRecover) {
    options.openAutoRecover = false;
  }
  if (options.isWideMode === undefined) {
    options.isWideMode = false;
  }
  if (!options.defaultCommentData) {
    options.defaultCommentData = [];
  }
  if (!options.toolbar) {
    options.toolbar = [];
  }
  if (!options.socketUrl) {
    options.socketUrl = 'offline';
  }
  if (!options.socketUrl) {
    options.socketUrl = 'offline';
  }
  if (!options.userInfo) {
    options.userInfo = {
      employee: 'TEST00',
      userName: '游客',
    };
  }
  if (!options.safeAreaBottom) {
    options.safeAreaBottom = 0;
  }
  if (!options.showTopMenuOnlyRead) {
    options.showTopMenuOnlyRead = false;
  }

  if (typeof options.useIMEInput !== 'boolean') {
    options.useIMEInput = true;
  }
  if (!options.tocPlacement) {
    options.tocPlacement = 'left';
  }
  if (!options.deepestDisplayAnchorHeading) {
    options.deepestDisplayAnchorHeading = 6;
  }
  if (!options.errorRecoverCallback) {
    options.errorRecoverCallback = function errorRecoverCallback() {
      console.log('errorRecoverCallback');
    };
  }
  if (!options.fallbackCallback) {
    options.fallbackCallback = function fallbackCallback() {
      console.log('fallbackCallback');
    };
  }
  if (!options.isMdEditor) {
    options.isMdEditor = false;
  }
  if (!options.joinDevGroup) {
    options.joinDevGroup = () => {};
  }
  if (options.showGlobalComment === undefined) {
    options.showGlobalComment = true;
  }
  if (options.showHoveringCommentButton === undefined) {
    options.showHoveringCommentButton = true;
  }
  if (!options.showHelpBlock) {
    options.showHelpBlock = false;
  }
  if (!options.openRrweb) {
    options.openRrweb = false;
  }
  if (!options.cssTarget) {
    options.cssTarget = '';
  }
  if (options.useValidationWorker === undefined) {
    options.useValidationWorker = true;
  }
  if (options.defaultValue2) {
    options.defaultValue = getDefaultValueByBase64(options.defaultValue2);

    console.log('options.defaultValue', options.defaultValue);
  }
  options.socketUrl = options.socketUrl || 'offline';
  options.socketUrl = options.socketUrl.replace(/https*:\/\//, '');
  console.log('options.socketUrl', options.socketUrl);
  options.secure = !!options.secure;
  options.fake = !!options.fake;
  if (!options.defaultValue) {
    if (options.defaultTitle) {
      slateDefaultValue[0].children = [{ text: options.defaultTitle }];
      options.defaultValue = slateDefaultValue;
    } else {
      options.defaultValue = slateDefaultValue;
    }

    console.log('options.defaultValue', options.defaultValue);
  }
  if (!options.defaultMDValue) {
    if (options.defaultMDValue === null) {
      options.defaultMDValue = '';
    }
  }
}

function polyfillJs() {
  if (!String.prototype.matchAll) {
    String.prototype.matchAll = function (rx) {
      if (typeof rx === 'string') rx = new RegExp(rx, 'g');
      rx = new RegExp(rx);
      let cap = [];
      let all = [];
      while ((cap = rx.exec(this)) !== null) all.push(cap);
      return all;
    } as any;
  }
}
