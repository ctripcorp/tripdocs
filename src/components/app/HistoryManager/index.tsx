import { LoadingOutlined } from '@ant-design/icons';
import { cx } from '@emotion/css';
import { IconBtn } from '@src/components/docs/plugins/Components';
import { InlineSlateEditor } from '@src/components/docs/plugins/SideComment/inlineSlateEditor';
import { TripdocsSdkContext } from '@src/Docs';
import { f } from '@src/resource/string';
import { getCache } from '@src/utils/cacheUtils';
import { getDefaultValueByBase64 } from '@src/utils/getDefaultValue';
import { Button, Empty, message, Modal, Pagination, Spin } from 'antd';
import React, { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { DiffComponent } from '../DiffComponent';
import { HistoryDocAction, HistoryDocActionType, historyDocReducer, HistoryDocState, historyDocStore } from '../DiffComponent/HistoryDocReducer';
import { NoDiffComponent } from '../NoDiffComponent';
import './index.less';

const UNSAVED_CURRENT_VERSION_ID = '0';

export const HistoryManager = props => {
  const Actions = HistoryDocActionType;
  const PAGE_SIZE = 10;

  const { docId, editor, isShowHistoryManager } = props;
  const { isInElectron } = useContext(TripdocsSdkContext);
  const sideListRef = useRef(null);
  const [historyVersionList, setHistoryVersionList] = useState([]);

  const [historyDocState, historyDocDispatch] = useReducer(historyDocReducer, historyDocStore);

  const [isNoData, toggleIsNoData] = useReducer((state, action) => action, false);

  const refDoc = useMemo(() => editor.children, [editor?.children]);

  const getHistoryVersionList = useCallback(() => {}, [docId, historyDocState.versionList.pageNum]);

  useEffect(() => {
    if (isShowHistoryManager) {
      const promise = getHistoryVersionList();
      promise
        ?.then((res: any) => {
          console.log('[getHistoryVersionList]', res);
          if (res.docHistoryList && res.count) {
            const { docHistoryList: list, count } = res;
            historyDocDispatch({ type: Actions.setTotal, payload: count });
            setHistoryVersionList(list);
          } else {
            toggleIsNoData(true);
            console.warn('[getHistoryVersionList] invalid res: ', res);
          }
        })
        .catch(err => {
          console.log('[getHistoryVersionList] err]: ', err);
        });
    }
  }, [isShowHistoryManager, historyDocState.versionList.pageNum]);

  useEffect(() => {
    if (!isShowHistoryManager) {
      resetHistoryManager();
    }
  }, [isShowHistoryManager]);

  const resetHistoryManager = () => {
    historyDocDispatch({
      type: Actions.setCurrentVersionId,
      payload: UNSAVED_CURRENT_VERSION_ID,
    });
    historyDocDispatch({
      type: Actions.setPreviousVersionId,
      payload: '',
    });
    historyDocDispatch({
      type: Actions.setPageNum,
      payload: 1,
    });
    sideListRef.current && (sideListRef.current.scrollTop = 0);
  };

  const isRecoverBtnDisabled = isNoData || historyDocState.docCurrent.versionId === UNSAVED_CURRENT_VERSION_ID;
  return (
    <div className="history-manager-wrap">
      <Button
        className="recover-doc-btn"
        disabled={isRecoverBtnDisabled}
        style={{
          background: isRecoverBtnDisabled ? '#ccc' : '#1a4fe9',
          cursor: isRecoverBtnDisabled ? 'not-allowed' : 'pointer',
        }}
        onClick={e => {
          e.preventDefault();
          if (!isRecoverBtnDisabled) {
            Modal.confirm({
              title: f('importantNotice'),
              content: f('recoverVersionConfirm'),
              onOk: () => {
                restoreDoc(docId, isInElectron, historyDocState.docCurrent.versionId);
                resetHistoryManager();
              },
              onCancel: () => {},
              okText: f('confirm'),
              cancelText: f('cancel'),
            });
          }
        }}
      >
        {f('restore_doc')}
      </Button>
      <div className={cx('history-manager-main', 'editor_container_wrap')}>
        {isNoData || historyDocState.docCurrent.content.length === 0 || historyDocState.docCurrent.isError || historyDocState.docPrevious.isError ? (
          <Empty description={'空白文档'} />
        ) : historyDocState.docCurrent.isLoading || historyDocState.docPrevious.isLoading ? (
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        ) : (
          <>
            {}
            {}
            <NoDiffComponent docId={docId} isShowHistoryManager={isShowHistoryManager} docValue={historyDocState.docCurrent.content} />
          </>
        )}
      </div>
      <div className="history-manager-side">
        <div className="history-manager-side-list" ref={sideListRef}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              fontSize: '14px',
              letterSpacing: '2px',
              padding: '0 0 8px 0',
              margin: '0 8px 12px',
              borderBottom: '1px solid rgb(198 190 190 / 30%)',
            }}
          >
            {f('historyRecord')}
          </div>
          <HistoryVersionList
            list={historyVersionList}
            docId={docId}
            historyDocDispatch={historyDocDispatch}
            historyDocState={historyDocState}
            unsavedDoc={refDoc}
          />
        </div>
        <div className="history-manager-side-btn">
          <Pagination
            simple
            pageSize={PAGE_SIZE}
            current={historyDocState.versionList.pageNum}
            total={historyDocState.versionList.total}
            onChange={page => {
              historyDocDispatch({ type: Actions.setPageNum, payload: page });
            }}
          />
        </div>
      </div>
    </div>
  );
};

type HistoryVersionListProps = {
  list: any[];
  docId: string;
  historyDocDispatch: (action: HistoryDocAction) => void;
  historyDocState: HistoryDocState;
  unsavedDoc: any;
};

const HistoryVersionList = (props: HistoryVersionListProps) => {
  const { list, docId, historyDocDispatch: dispatch, historyDocState: state, unsavedDoc } = props;
  const { isInElectron } = useContext(TripdocsSdkContext);
  const Actions = HistoryDocActionType;
  const isDev = process.env.NODE_ENV === 'development';
  const curUserName = getCache(docId, 'options')?.userInfo?.userName;

  const getVersionPreview = useCallback(versionId => {}, [docId]);

  useEffect(() => {
    console.log('[HistoryVersionList] list: ', state.docCurrent, list);
    if (!state.docCurrent.versionId && list.length > 0) {
      dispatch({
        type: Actions.setCurrentVersionId,
        payload: UNSAVED_CURRENT_VERSION_ID,
      });
      if (list.length > 1) {
        const firstItem = list[0];
        dispatch({
          type: Actions.setPreviousVersionId,
          payload: isDev ? firstItem.version_id : firstItem.versionId,
        });
      }
    }
  }, [list?.[0]]);

  useEffect(() => {
    const versionId = state.docCurrent.versionId;

    const previousVersionId = state.docPrevious.versionId;
    let promises = [];
    console.log('[HistoryVersionList] useEffect', versionId, previousVersionId);
    if (versionId) {
      if (versionId === UNSAVED_CURRENT_VERSION_ID) {
        dispatch({ type: Actions.setCurrentLoading, payload: true });
        dispatch({ type: Actions.setCurrentDoc, payload: unsavedDoc });
        dispatch({ type: Actions.setCurrentLoading, payload: false });
      } else {
        dispatch({ type: Actions.setCurrentLoading, payload: true });
        promises.push(
          getVersionPreview(versionId)
            ?.then((res: any) => {
              if (res.blob) {
                console.log('[current versionId]', versionId, res);
                const { blob: doc } = res;
                const docContent = getDefaultValueByBase64(doc);
                dispatch({ type: Actions.setCurrentDoc, payload: docContent });
                return docContent;
              } else {
                console.warn('[getVersionPreview] invalid res', versionId, res);
                return '';
              }
            })
            .catch(err => {
              dispatch({ type: Actions.setCurrentError, payload: true });
              console.log('[getVersionPreview] err: ', err);
            })
        );
      }

      if (previousVersionId) {
        dispatch({ type: Actions.setPreviousLoading, payload: true });
        promises.push(
          getVersionPreview(previousVersionId)
            ?.then((res: any) => {
              if (res.blob) {
                console.log('[previous versionId]', previousVersionId, res);
                const { blob: doc } = res;
                const docContent = getDefaultValueByBase64(doc);
                dispatch({ type: Actions.setPreviousDoc, payload: docContent });
                return docContent;
              } else {
                console.warn('[getVersionPreview] invalid res', previousVersionId, res);
                return '';
              }
            })
            .catch(err => {
              dispatch({ type: Actions.setPreviousError, payload: true });
              console.log('[getVersionPreview] err: ', err);
            })
        );
      } else {
        dispatch({ type: Actions.setPreviousDoc, payload: [] });
      }
    }

    Promise.all(promises).then(result => {
      console.log('[HistoryVersionList] all promises resolved', result);
      dispatch({ type: Actions.setPreviousLoading, payload: false });
      dispatch({ type: Actions.setCurrentLoading, payload: false });
      dispatch({ type: Actions.setPreviousError, payload: false });
      dispatch({ type: Actions.setCurrentError, payload: false });
    });
  }, [state.docCurrent.versionId]);

  return (
    <div className="history-version-list">
      <div
        className="history-version-list-item"
        style={{
          background: state.docCurrent.versionId === UNSAVED_CURRENT_VERSION_ID ? 'rgba(26, 78, 233, 0.15)' : null,
        }}
        onClick={() => {
          dispatch({ type: Actions.setCurrentDoc, payload: unsavedDoc });
          dispatch({ type: Actions.setCurrentVersionId, payload: UNSAVED_CURRENT_VERSION_ID });
        }}
      >
        <div className="history-version-list-item-title">
          <span className="list-item-title-left">
            <span style={{ color: '#1a4fe9' }}>{f('currentVersion')}</span>
            {`(v.${state.versionList.total + 1})`}
          </span>
          <span className="list-item-title-right">{formatTime()}</span>
        </div>
        <div className="history-version-list-item-info">
          <span className="list-item-info-left">{curUserName}</span>
          <span className="list-item-info-right" style={{ color: '#A9A9A9', cursor: 'not-allowed' }}>
            {f('restore')}
          </span>
        </div>
      </div>
      {list?.map((item, index) => {
        const versionTime = isDev ? item.create_time : item.lastModifiedTime;
        const formattedTime = formatTime(versionTime);
        const versionId = isDev ? item.version_id : item.versionId;
        const versionName = isDev ? item.version_name : item.versionName;
        const modifier = isDev ? item.commit_user : item.lastModifiedPerson.displayName;
        return (
          <div
            className="history-version-list-item"
            onClick={e => {
              if (index !== list.length - 1) {
                const previousVersionId = isDev ? list[index + 1].version_id : list[index + 1].versionId;
                dispatch({ type: Actions.setPreviousVersionId, payload: previousVersionId });
              } else {
                dispatch({ type: Actions.setPreviousVersionId, payload: '' });
              }
              dispatch({ type: Actions.setCurrentVersionId, payload: versionId });
            }}
            style={{
              background: state.docCurrent.versionId === versionId ? 'rgba(26, 78, 233, 0.15)' : null,
            }}
          >
            <div className="history-version-list-item-title">
              {}
              <span className="list-item-title-left">{`${f('versionName')}: ${versionName}`}</span>
              <span className="list-item-title-right">{formattedTime}</span>
            </div>
            <div className="history-version-list-item-info">
              <span className="list-item-info-left">{modifier}</span>
              <span
                className="list-item-info-right"
                onClick={e => {
                  e.preventDefault();
                  Modal.confirm({
                    title: f('importantNotice'),
                    content: f('recoverVersionConfirm'),
                    onOk: () => {
                      restoreDoc(docId, isInElectron, versionId);
                    },
                    onCancel: () => {},
                    okText: f('confirm'),
                    cancelText: f('cancel'),
                  });
                }}
              >
                {f('restore')}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

function formatTime(timeStr?) {
  const curDate = new Date();
  const date = timeStr ? new Date(timeStr) : curDate;
  const yearStr = date.getFullYear() === curDate.getFullYear() ? '' : date.getFullYear() + '-';
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${yearStr}${month}-${day} ${hour}:${minute}`;
}

function restoreDoc(docId, isInElectron, versionId) {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => resolve(0), 1500);
    });
    promise.then(() => {
      message.success(f('restore_doc_success'));
      window.tripdocs.editorsMap[docId].api.setIsShowHistoryManager(false);
    });
  } else {
    if (isInElectron && versionId) {
      const promise = window?.tripdocs?.editorsMap?.[docId]?.api?.restoreDocCallback(docId, versionId);
      if (promise) {
        promise.then(res => {
          console.log('[HistoryManager] restore doc success', versionId, res);
          message.success(f('restore_doc_success'));
          const options: Options = getCache(docId, 'options');
          window.tripdocs.editorsMap[docId].api.destroy();
          new window.tripdocs.Editor(options);

          setTimeout(() => {
            options.reloadCallback();
            window.tripdocs.editorsMap[docId]?.socket.provider.disconnect();
            window.tripdocs.editorsMap[docId]?.api.setIsReadOnly(false);
          }, 1000);
        });
      }
    } else {
    }
  }
}
