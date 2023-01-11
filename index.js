
import { message } from 'antd';
import isHotkey from 'is-hotkey';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Node } from '@src/components/slate-packages/slate';
import hash from 'object-hash';
import { getCache, setCache } from './src/utils/cacheUtils';
import './src/index';
// import './lib/index';
// import './lib/index.css';

let lastNormalizeTag = '';
const nativeDoc = require('./devDoc/welcome to tripdocs.json');
const defaultDocId = '170f11e82d18436893f89d787197a5a11';

const onKeyDown = e => {
  if (isHotkey('mod+s', e)) {
    e.preventDefault();
    console.log("isHotkey'mod+s'");
    saveDoc();
    return;
  }
  if (isHotkey('mod+shift+s', e)) {
    e.preventDefault();
    console.log("isHotkey'mod+shift+s'");
    saveDoc(`/tripdocs/api/docs/source/set`);
    return;
  }
};

const saveDoc = (url = `/tripdocs/api/docs/source/set/native`) => {
  if (window.tripdocs.editorsMap[defaultDocId].isMdEditor) {
    console.log('gogogo');

    const { md2SlateContent, api } = window.tripdocs.editorsMap[defaultDocId];
    api?.setContent(md2SlateContent);

    return;
  }

  let isRemote = false;
  if (url != `/tripdocs/api/docs/source/set/native`) {
    isRemote = true;
  }
  const docContent = tripdocs.editorsMap[defaultDocId].api.getContent();

};

function Root() {
  useEffect(() => {
    tripdocs.cache.registerValidationWorker__DEV = registerValidationWorker__DEV;

    const container = document.getElementById(`editorContainer-${defaultDocId}`);
    const socketOpt = {
      secure: false,
      fake: true,
      socketUrl: 'offline',

      docId: defaultDocId,
      token: 'fcefbbc80460101f90741d5fe05b82db',
      auth: '{"Str_TimeStamp":"2021-11-23 03:03:46","Str_Signature":"b8b962bf243d6aae9a8224ce5e5b12e7","SessionID":"dev:f87b99924b0f464293e5cd03d4e60c46eeB4RvD6SRemUDOX8X0QhJafiKtCS17r"}',
    };

    const mdOpt = {
      isMdEditor: false,
      readOnly: true,
    };
    const readOnly = false || (mdOpt.isMdEditor && mdOpt.readOnly);
    const options = {
      docId: socketOpt.docId,
      openRrweb: false,
      tocPlacement: 'left',
      historyVersionShortKey: true,
      socketUrl: socketOpt.socketUrl,
      userInfo: {
        employee: 'TripDocs001',
        userName: 'TripDocs002',
        headPortrait: null,
      },
      roomUsersCallback: room => {
        console.log('room', room);
      },
      showHoveringCommentButton: true,
      showGlobalComment: true,
      useTripdocsFileUpload: false,
      showHelpBlock: true,
      theme: { backgroundColor: 'rgb(242,244,246)' },
      banCommentNesting: true,
      isInElectron: false,

      openAutoRecover: false,

      fake: socketOpt.fake,
      docToken: socketOpt.token,
      identityauth2: socketOpt.auth,
      secure: socketOpt.secure,
      isMdEditor: mdOpt.isMdEditor,
      readOnly: readOnly,
      isWideMode: true,
      mdRefreshDocCallback: () => {
        console.log("[mdRefreshDocCallback] saveDoc");
        saveDoc();
      },
      mentionCallback: mentionInfo => {
        console.log('mentionCallback mentionInfo', mentionInfo);
      },

      getDocToken: async () => {
        const res = await new Promise(resolve => {
          setTimeout(() => {
            return resolve({
              docToken: 'fcefbbc80460101f90741d5fe05b1111' + Math.random(),
              identityauth2: 'fcefbbc80460101f90741d5fe05b1111' + Math.random(),
            });
          }, 2000);
        });
        console.log('getDocToken res', res);
        return Promise.resolve(res);
      },

      titleCallback: (title = '未命名文档') => {
        if (document.title !== title) {
          document.title = title;
        }
      },
      linkClickCallBack: href => {
        console.log('linkClickCallBack', href);
        window?.open(href, '_blank');
      },
      shareCallback: shareInfo => {
        console.log('{{shareCB}}', shareInfo);
      },
      docStatusCallback: status => {
        console.log('docStatusCallback status', status);
      },
      commentCallback: commentInfo => {

        console.log('commentCallback commentInfo', commentInfo);
      },
      errorRecoverCallback: () => {
        window.location.reload();
      },

      get defaultValue() {
        if (this.socketUrl === 'offline') {
          return nativeDoc;
        }
        return undefined;
      },
      initCallback: () => {





        console.log('initCallback');

      },
      defaultTitle: 'aaa',
      onSlateChange: value => {

      },




































































































































    };

    const editor = new window.tripdocs.Editor(options, container);

    setTimeout(() => {


























    }, 1000);




    setTimeout(() => {




    }, 15000);


  }, []);

  return (
    <div
      className="editor-outer-wrapper"
      style={{
        border: '1px solid rgba(0,0,0,0.1)',
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <div id="test"></div>
      <div>
        {/* 假装这是顶部栏 */}
        <span
          style={{ background: 'yellow' }}
          onClick={() => {




            if (getCache(defaultDocId, 'options').socketUrl === 'offline') {
              tripdocs.editorsMap[defaultDocId].api.setIsReadOnly(false);
              tripdocs.editorsMap[defaultDocId].api.setSocketUrl('localhost:8080');
            } else {

              tripdocs.editorsMap[defaultDocId].api.setIsReadOnly(true);
              tripdocs.editorsMap[defaultDocId].api.setSocketUrl('offline', { defaultValue: tripdocs.editorsMap[defaultDocId].api.getContent() });
            }
          }}
        >
          {/* 切换 本地/协作 模式 */}
        </span>
      </div>
      { }

      <div
        id={`editorContainer-${defaultDocId}`}
        onKeyDown={onKeyDown}
        style={{
          height: '100%',
        }}
      ></div>
    </div>
  );
}





ReactDOM.render(<Root />, document.getElementById('root'));


export const registerValidationWorker__DEV = editor => {
  const { children } = editor;
  if (window.Worker) {
    try {

      const worker = new Worker(new URL('@src/worker/validation.worker.js', import.meta.url));


      if (worker && children) {


        const messageChannel = new MessageChannel();

        worker.postMessage('init port2', [messageChannel.port2]);

        messageChannel.port1.postMessage({
          docContent: JSON.stringify(children),
        });

        messageChannel.port1.onmessage = function (event) {
          const { data } = event;

          if (data) {
            if (data.isValid) {
              console.log('[worker out] VALID content');
            } else {
              console.log('[worker out] INVALID content, at node:', data.invalidNode, data);
              console.log('[worker end] Trying to normalize content');

              const normalizeTag = hash(data);
              console.log('[worker out] normalizeTag:', normalizeTag, data);
              if (lastNormalizeTag === normalizeTag) {
                console.log('[worker end] Already normalized, but still invalid');
              } else {
                window.tripdocs.editorsMap[defaultDocId].SlateEditor.normalize(editor, { force: true });
                lastNormalizeTag = normalizeTag;
              }
            }
          }
        };
        messageChannel.port1.onmessageerror = function (event) {
          console.log('[worker] messageChannel.port1.onmessageerror', event);
        };
        return { worker };
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};



function highlightKeyword(node, pattern, index) {
  let exposeCount = 0;
  if (node.nodeType === 3) {
    let matchResult = node.data.match(pattern);
    console.log('highlightKeyword data', matchResult);

    if (matchResult) {
      console.log(' ·', matchResult, node, exposeCount);
      let highlightEl = document.createElement('span');
      highlightEl.dataset.highlight = 'yes';
      highlightEl.dataset.highlightMatch = matchResult[0];
      if (index !== null) {
        highlightEl.dataset.highlightIndex = index;
      }
      let matchNode = node.splitText(matchResult.index);
      matchNode.splitText(matchResult[0].length);
      let highlightTextNode = document.createTextNode(matchNode.data);
      highlightEl.appendChild(highlightTextNode);
      matchNode.parentNode.replaceChild(highlightEl, matchNode);
      exposeCount++;
    }
  }

  else if (node.nodeType === 1 && !/script|style/.test(node.tagName.toLowerCase())) {
    if (node.dataset.highlight === 'yes') {
      if (index == null) {
        return;
      }
      if (node.dataset.highlightIndex === index.toString()) {
        return;
      }
    }
    let childNodes = node.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      highlightKeyword(childNodes[i], pattern, index);
    }
  }
  return exposeCount;
}
