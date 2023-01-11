import React, { useEffect, useMemo, useState } from 'react';
import { createEditor } from '@src/components/slate-packages/slate';
import { WebsocketProvider as WebsocketProviderOfficial } from 'y-websocket';

import * as Y from 'yjs';
import '@src/style/iconfont/Tripdocs.css';
import { actionKey, applyOpt } from '../../utils/apiListener';
import { hashCode, intToRGB } from '../../utils/hexColorUtils';
import { withHistory } from '../slate-packages/slate-history';
import { withReact } from '../slate-packages/slate-react';
import { SyncElement, toSharedType, toSlateDoc, useCursors, withCursor, withYjs } from '../slate-packages/slate-yjs';
import { withBlockquote } from './plugins/BlockQuote';
import { withImages } from './plugins/Image/imagePlugins';
import { withInlineImages } from './plugins/InlineImage/inlineImagePlugins';
import { withDeserializeMD } from './plugins/serializers/withDeserializeMD';
import { withTable } from './plugins/table/withTable';
import { withVideo } from './plugins/Video/withVideo';
import { withAnchor } from './plugins/withAnchor';
import { withHtml } from './plugins/withHtml';
import { withNormalizeNode } from './plugins/withNormalize';
import { withShortcuts } from './plugins/withShorcuts';
import EditorFrame, { EditorProps, printTime } from './slateEditor';
import storage from '../../utils/storage';
import { createRandomId } from '../../utils/randomId';
import { withOlList } from './plugins/OLULList/withOlList';
import { withMention } from './plugins/Mention/withMention';
import { consumePlugins } from '@src/utils/helper/consumePlugins';
import { notification } from 'antd';
import { getCache, setCache } from '@src/utils/cacheUtils';
import { withCard } from './plugins/Card';
import { withEditLink } from './plugins/EditLink';
import { withTabLevel } from './plugins/withTabLevel';
import { withTitleNormalized } from './plugins/withTitleNormalized';
import { slateDefaultValue } from './plugins/config';
import _ from 'lodash';
import { withElmentId } from './plugins/withElmentId';
import { withInline } from './plugins/withInline';
import { openNotification } from '@src/utils/notification';

interface ClientProps {
  name: string;
  id: string;
  docId: string;
  defaultValue: any[];
  removeUser: (id: any) => void;
  [key: string]: any;
}

const Client: React.FC<ClientProps> = props => {
  const { id, name = '未知', docId, removeUser, defaultValue, socketUrl, userInfo, docToken, fakeCorp, secure, identityauth2, fake } = props;

  const slateEditor: any = useMemo(() => {
    const plugins = [
      withTitleNormalized,
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
    ].reverse();
    const wrappedEditor = consumePlugins(createEditor(docId), plugins);
    return wrappedEditor;
  }, []);

  const color = userInfo && userInfo.employee ? '#' + intToRGB(hashCode(userInfo.employee)) : '#000000';

  const [sharedType, provider] = useMemo(() => {
    const doc = new Y.Doc();
    const sharedType = doc.getArray<SyncElement>('content');
    console.log('toSlateDoc1', socketUrl, toSlateDoc(sharedType));
    let provider;
    const url = socketUrl.indexOf('ws') === 0 ? socketUrl : 'ws://' + socketUrl;
    provider = new WebsocketProviderOfficial(url, getCache(docId, 'options')?.docUrl || docId, doc, {
      connect: false,
      resyncInterval: 10000,
    });

    return [sharedType, provider];
  }, [id]);

  const editor = useMemo(() => {
    const editor = withElmentId(withCursor(withYjs(slateEditor, sharedType), provider.awareness));

    return editor;
  }, [sharedType, provider]);

  useEffect(() => {
    const updateUser = _.throttle(changes => {
      const usersArr = JSON.parse(JSON.stringify(Array.from(provider.awareness.getStates().values())));
      const sUsers = storage.get('roomUsers');
      const newUserArr = [];
      for (let i = 0; i < usersArr.length; i++) {
        const user: any = usersArr[i];
        delete user.anchor;
        delete user.focus;
        if (JSON.stringify(user) !== '{}') {
          newUserArr.push(user);
        }
      }
      if (!sUsers || JSON.stringify(sUsers) !== JSON.stringify(newUserArr)) {
        console.log('roomUsersCallback ****', sUsers, newUserArr);
        storage.set('roomUsers', newUserArr);
        applyOpt(actionKey.roomUsersCallback, newUserArr, docId);
      }
    }, 2000);
    provider.awareness.on('change', changes => {
      updateUser(changes);
    });

    provider.awareness.setLocalState({
      ...userInfo,
      alphaColor: color,
      color,
      name,
    });

    provider.on(
      'status',
      (msg: {
        status: {
          command: string;
          userId: string;
          username?: string;
        };
      }) => {
        let status;
        console.log('on status msg:', msg);

        if (typeof msg.status === 'string') {
          status = msg.status;
        } else {
          const {
            status: { command: st, userId },
          } = msg;
          if (st) {
            status = st;
          }
        }

        if (status === 'connected') {
          if (getCache(docId, 'timeCheck')) {
            const wsConnectedTime = `${new Date().getTime() - getCache(docId, 'initTimestamp')}ms`;
            console.log(
              '[time check] Websocket connected (status === "connected"),at:' + new Date().getTime() + ', time consuming:' + wsConnectedTime
            );
          }
        } else if (status === 'restoring') {
          const restoreUserId = msg.status.userId;
          const restoreUsername = msg.status.username;
          const userInfo = JSON.stringify(getCache(docId, 'options')?.userInfo);
          console.log('restoring', restoreUserId, userInfo);
          if (!userInfo.includes(restoreUserId)) {
            openNotification('restoring', restoreUsername + '恢复到该页面一个之前的版本', 4.5);
            setCache(docId, 'restoring', true);
          }
          const options: Options = getCache(docId, 'options');
          window.tripdocs.editorsMap[docId].api.destroy();
          new window.tripdocs.Editor(options);

          setTimeout(() => {
            options.reloadCallback();
            window.tripdocs.editorsMap[docId]?.socket.provider.disconnect();
            window.tripdocs.editorsMap[docId]?.api.setIsReadOnly(false);
          }, 1000);
        } else if (status === 'merge_conflict') {
          openNotification('merge_conflict', '页面已经被重置，请保存操作后刷新页面');
          setCache(docId, 'kickedOut', true);
        } else if (status === 'kicked_out') {
          openNotification('kicked_out', '其他端已经登录，请关闭页面重新进入');
          setCache(docId, 'kickedOut', true);
        } else if (['disconnected', 'connect_failed'].includes(status)) {
        }

        applyOpt(actionKey.docStatusCallback, status, docId, msg.status);
      }
    );

    async function reConnect() {
      const getDocToken = window.tripdocs.editorsMap[docId]?.api?.getDocToken;
      if (!getDocToken) {
        provider?.quikConnect();
        return;
      }
      const data = await getDocToken();
      console.log('reConnect data docToken', data);
      let docToken = '';
      let identityauth2 = '';
      if (data) {
        docToken = data.docToken;
        identityauth2 = data.identityauth2;
      }
      provider?.quikConnect(docToken, identityauth2);
    }

    provider.on('sync', (isSynced: boolean) => {
      if (getCache(docId, 'timeCheck') && getCache(docId, 'options').socketUrl !== 'offline') {
        setTimeout(() => {
          printTime(editor, docId);
          setCache(docId, 'timeCheck', false);
        }, 100);

        const syncTime = `${new Date().getTime() - getCache(docId, 'initTimestamp')}ms`;
        console.log('[time check] sync at: ' + new Date().getTime() + ', time consuming:' + syncTime);
      }

      if (isSynced && sharedType.length === 0) {
        toSharedType(sharedType, defaultValue.length ? defaultValue : slateDefaultValue);
      } else {
        window.tripdocs.editorsMap[docId].editor.history.undos = [];
      }
    });

    if (getCache(docId, 'timeCheck')) {
      const initSocketTime = `${new Date().getTime() - getCache(docId, 'initTimestamp')}ms`;
      console.log('[time check] Websocket init at: ' + new Date().getTime() + ', time consuming:' + initSocketTime);
    }

    provider.quikConnect = function (docToken: string = '', identityauth2: string = '') {
      console.log('quikConnect options', getCache(docId, 'options'));

      provider.connect(
        {
          userId: getCache(docId, 'options')?.userInfo?.employee,
          token: docToken || getCache(docId, 'options').docToken,

          corpId: getCache(docId, 'options').fakeCorp,
          identityauth2: identityauth2 || getCache(docId, 'options').identityauth2,
        },
        { fake: fake, secure: secure }
      );
    };

    reConnect();

    function reconnFun() {
      if (window.tripdocs.editorsMap[docId]?.socket) {
        const { provider } = window.tripdocs.editorsMap[docId].socket;

        if (!provider?.wsconnected && !(provider.status?.command === 'connecting')) {
          if (!getCache(docId, 'kickedOut')) {
            reConnect();
          }
        }
      }
    }

    const reconnInterval = setInterval(reconnFun, 2000);

    return () => {
      provider.disconnect();
      clearInterval(reconnInterval);
    };
  }, [provider]);

  const openCusors = true;
  const { decorate, cursors } = getCusorsDecorate(editor, openCusors);
  return (
    <EditorFrame
      {...(props as unknown as EditorProps)}
      editors={editor}
      decorate={decorate}
      defaultValue={null}
      provider={provider}
      cursors={cursors}
    />
  );
};

function getCusorsDecorate(editor: any, openCusors: any) {
  if (openCusors) {
    const { decorate, cursors } = useCursors(editor);
    const signCursors = (one: any) => {
      if (!one) {
        return [];
      }
      return decorate(one);
    };
    return { decorate: signCursors, cursors };
  } else {
    return { decorate: () => [], cursors: [] };
  }
}
export default Client;
