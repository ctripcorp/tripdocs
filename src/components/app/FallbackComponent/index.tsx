import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { timeFormat } from '@src/components/docs/plugins/SideComment/utils';
import { Slate } from '@src/components/slate-packages/slate-react';
import { judgePhone, TripdocsSdkContext } from '@src/Docs';
import { getCache, setCache } from '@src/utils/cacheUtils';
import { createUUID } from '@src/utils/randomId';
import sessStorage from '@src/utils/sessStorage';
import { Button, Collapse } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { FallbackProps } from 'react-error-boundary';

const { Panel } = Collapse;

export const FallbackComponent: React.FunctionComponent<FallbackProps & any> = (props: FallbackProps & any) => {
  const { docId, editor, fallback } = props;
  const docIdMemo = useMemo(() => docId, []);
  const docContentQueue = sessStorage.get('tripdocs_sdk/docContentCacheArr_' + docIdMemo) || [];
  const docContent = docContentQueue.length > 0 && docContentQueue[0];
  console.log('[FallbackComponent] : ', props);

  const [showErrorMsg, setShowErrorMsg] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const errorId = sessStorage.get('tripdocs_sdk/ubtErrorId');
    const id = errorId || 'new_' + createUUID();

    const options = getCache(docId, 'options');
    setTimeout(() => {
      const eid = getCache(docId, 'e:' + id);
      if (!eid) {
        options?.fallbackCallback();
        if (options?.openRrweb) {
          window.tripdocs?.rrwebRecord?.upload(() => {}, 'error id : ' + id, 'tripdocsError');
        }

        setCache(docId, 'e:' + id, true);
      }
    }, 300);
  }, []);
  const isMobile = useMemo(judgePhone, []);
  function joinTripPalGroupForPC(url: string, isInElectron: boolean) {
    if (window?.ctxBridge) {
      window?.ctxBridge?.openExternal(url);
    } else {
      const cchatHref = url;
      const newWindow = window.open(cchatHref, '_blank');
      isInElectron && setTimeout(() => newWindow.close(), 100);
    }
  }

  return (
    <div
      style={{
        backgroundColor: 'rgba(221,225,239,0.7)',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: isMobile ? 'auto' : 999999999,
        overflow: 'hidden',
      }}
    >
      {}

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          left: '50%',
          top: showErrorMsg ? '10%' : '40%',
          transform: 'translateX(-50%)',
        }}
      >
        <div
          className="contentWrapper"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            width: '80vw',
          }}
        >
          <div
            onClick={e => {
              setCount(prev => prev + 1);
            }}
            style={{
              textAlign: 'center',
            }}
          >
            很抱歉😧，
            {isMobile && <br />}
            编辑器出现了异常，请
            <Button
              style={{ marginLeft: '8px' }}
              type="primary"
              onClick={e => {
                const options = getCache(docId, 'options');
                if (!options?.isRefresh) {
                  setCache(options.docId, 'options', { ...options, isRefresh: true });
                  options.isRefresh = true;
                  if (!options?.openAutoRecover) {
                    options?.errorRecoverCallback();
                  } else {
                    window.tripdocs.editorsMap[options.docId].api.destroy();
                    const dom = document.getElementById(`editorContainer-${options.docId}`);
                    dom && window.tripdocs.Editor(options, dom);
                  }
                }
              }}
            >
              刷新重试
            </Button>
          </div>
          <div style={{ marginTop: '32px' }}>
            您可以选择
            {!isMobile && (
              <>
                <Button
                  style={{ marginLeft: '8px', marginRight: '8px', backgroundColor: 'rgb(236,98,105)' }}
                  type="primary"
                  onClick={e => {
                    const ubtError = sessStorage.get('tripdocs_sdk/ubtError');
                    const stack: any[] = getCache(docId, 'changeEditorStack') || [];
                    const json = {
                      editor,
                      error: JSON.stringify(fallback.error),
                      ubtError,
                      stack,
                      docsdkversion: 'sdk version:' + require('../../../../package.json').version,
                    };
                    const jsonStr = JSON.stringify(json);
                    const a = document.createElement('a');
                    a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr));

                    a.setAttribute('download', timeFormat() + '报错日志.json');
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  下载报错日志
                </Button>
                并
              </>
            )}
            <Button
              style={{ marginLeft: '8px', backgroundColor: 'rgb(236,98,105)' }}
              type="primary"
              onClick={e => {
                const isInElectron = getCache(docId, 'options')?.isInElectron;
                if (isInElectron && isMobile) {
                  window.tripdocs.editorsMap[docId]?.api?.joinDevGroup();
                  return;
                }
              }}
            >
              进群反馈
            </Button>
            {!isMobile && <span style={{ marginLeft: '8px', color: 'rgb(125,125,125)' }}>（请在群里上传报错日志）</span>}
          </div>
          {count >= 8 && (
            <>
              <div
                style={{ fontWeight: 'bold', margin: '48px 0 16px', alignSelf: 'flex-start' }}
                onClick={e => {
                  setShowErrorMsg(prev => !prev);
                }}
              >
                报错信息 <span style={{ display: 'inline-block', transform: showErrorMsg ? 'rotateZ(-90deg)' : 'rotateZ(90deg)' }}>▶️</span>
              </div>
              <Collapse
                accordion
                style={{
                  display: showErrorMsg ? 'block' : 'none',
                  width: '100%',
                }}
                defaultActiveKey={[1]}
              >
                <Panel header="报错信息" key="1">
                  <div
                    style={{
                      overflow: 'auto',
                      height: '40vh',
                    }}
                  >
                    <p>{fallback.error.message}</p>
                    <p>{fallback.error.stack}</p>
                  </div>
                </Panel>
                <Panel header="操作历史" key="2">
                  <div
                    style={{
                      overflow: 'auto',
                      height: '40vh',
                    }}
                  >
                    {editor?.history?.undos &&
                      JSON.stringify(editor.history.undos.length > 3 ? editor.history.undos.slice(0, 3) : editor.history.undos)}
                  </div>
                </Panel>
              </Collapse>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
