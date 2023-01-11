import { EnterOutlined, FileAddOutlined, ReadOutlined, RedoOutlined, SaveOutlined, SearchOutlined, UndoOutlined } from '@ant-design/icons';
import { f } from '@src/resource/string';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { IconBtn, Italic } from '../../docs/plugins/Components';
import './index.less';
import '../../../style/less/slatedocs.less';
import sessStorage from '@src/utils/sessStorage';
import { Editable, Slate, withReact } from '@src/components/slate-packages/slate-react';
import { TripdocsSdkContext } from '@src/Docs';
import { createEditor } from '@src/components/slate-packages/slate';
import { withHtml } from '@src/components/docs/plugins/withHtml';
import { createRandomId } from '@src/utils/randomId';
import * as jsondiffpatch from 'jsondiffpatch';
import { css } from '@emotion/css';
import { renderElement } from './renderElement';
import { renderLeaf } from './renderLeaf';
import { ErrorBoundary } from 'react-error-boundary';
import { ELTYPE } from '@src/components/docs/plugins/config';

type DiffComponentProps = {
  [key: string]: any;
};

const v2 = [
    { children: [{ text: '数仓WFSDFA周报' }], type: 'heading-one', anchorId: '111' },
    { children: [{ text: '≈a' }], type: 'paragraph', anchorId: '6d6e3889-5033-4f60-ac31-03820d138018_1g6l3jh9d1111' },
    { children: [{ text: 'ś' }], type: 'paragraph', anchorId: '2086af4e-cc59-42cf-b5f2-d79ef8d481fd_1g6l3jiq91111' },
    { children: [{ text: '' }], type: 'paragraph', anchorId: '2db2777c-6da6-42d6-b8d7-949f6e4301ca_1g6l3m76r1111' },
  ],
  v1 = [
    { children: [{ text: '数仓WFSDFA周报' }], type: 'heading-one', anchorId: '111' },
    { children: [{ text: '≈a' }], type: 'paragraph', anchorId: '6d6e3889-5033-4f60-ac31-03820d138018_1g6l3jh9d1111' },
    { children: [{ text: 'śwfwegwww' }], type: 'paragraph', anchorId: '2086af4e-cc59-42cf-b5f2-d79ef8d481fd_1g6l3jiq91111' },
    { children: [{ text: 'dd' }], type: 'paragraph', anchorId: '17146d70-7835-49f7-b7f6-d92e80ff87df_1g6l42p7r1111' },
    { children: [{ text: 'dsf' }], type: 'paragraph', anchorId: '27270318-72c7-4039-9b47-bd82649add63_1g6l42psh1111' },
    { children: [{ text: '' }], type: 'paragraph', anchorId: '2db2777c-6da6-42d6-b8d7-949f6e4301ca_1g6l3m76r1111' },
  ];

const DiffPatcher = jsondiffpatch.DiffPatcher;

export const NoDiffComponent = (props: DiffComponentProps) => {
  const { docId, isShowHistoryManager, docValue } = props;

  return (
    <div className="diff-wrap" style={{}}>
      <div className="diff-editor">
        <NoDiffEditor value={docValue} docId={docId} />
      </div>
    </div>
  );
};

const NoDiffEditor = (props: any) => {
  const { value, docId } = props;

  const editor: any = useMemo(() => withReact(createEditor(docId + '#' + createRandomId().substring(0, 3))), []);

  return (
    <ErrorBoundary
      FallbackComponent={fallback => {
        return <div>{fallback.error.message}</div>;
      }}
      onError={error => {
        console.error('[DiffEditor] onError: ', error);
      }}
    >
      <TripdocsSdkContext.Provider
        value={{
          docId,
          editor: editor,
          userInfo: {},
          isWide: false,
          isInElectron: false,
          isMobile: false,
          isWideMode: false,
          isMiddle: false,
          isReadOnly: true,
          WIPCommentRangeId: '',
          setWIPCommentRangeId: () => {},
          allUserList: [],
          hoveredRangeId: '',
          focusedRangeId: '',
          resetFocusedRangeId: () => {},
          setFocusedRangeId: () => {},
          identicalSelectionRangeId: '',
          setIdenticalSelectionRangeId: () => {},
          setSideCommentRowNum: () => {},
          setCurRangeId: () => {},
        }}
      >
        <Slate
          editor={editor}
          value={
            !value || value.length === 0
              ? [
                  { type: ELTYPE.HEADING_ONE, children: [{ text: '' }] },
                  { type: ELTYPE.PARAGRAPH, children: [{ text: '' }] },
                ]
              : value
          }
          onChange={(value: any) => {
            return;
          }}
        >
          <Editable
            data-ignore-slate
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            style={{
              padding: '6px 12px',
              border: '1px solid #dadada',
              borderRadius: '4px',

              background: '#fff',
              height: '100%',
              minHeight: '60vh',
              overflow: 'auto',
            }}
            readOnly={true}
          ></Editable>
        </Slate>
      </TripdocsSdkContext.Provider>
    </ErrorBoundary>
  );
};
