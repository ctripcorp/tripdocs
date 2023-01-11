import { WarningOutlined } from '@ant-design/icons';
import React from 'react';
import { IconBtn } from '../../Components';
import { ELTYPE } from '../../config';
import { BlockIconButton } from '../../StaticToolbar/buttons';

import './index.less';
import { alignToggle, colorChoice } from '../../HoveringToolbar';
import { Editor, Node, Range, Transforms } from '@src/components/slate-packages/slate';
import { insertCodeBlock } from '../../CodeBlock';
import storage from '@src/utils/storage';
import { insertOl } from '../../OLULList/OlList';
import { toggleBlock } from '../../block';
import { insertDivide } from '../../Divide';
import { newTable } from '../../table/newTable';
import { getCache } from '@src/utils/cacheUtils';
import { css, cx } from '@emotion/css';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { f } from '@src/resource/string';

function ColorBtn(props: any) {
  const { editor, format, color, key, callback } = props;
  return (
    <div
      key={key}
      className="group"
      onMouseDown={e => {
        e.preventDefault();
        const selection = getCache(editor.docId, 'selection');
        console.log('icon', format, color, selection);
        if (!selection) return;
        Transforms.select(editor, selection);

        Editor.addMark(editor, format, color);
        console.log(Editor.fragment(editor, selection));
        callback();
      }}
    >
      <IconBtn
        className={cx(
          `tripdocs-sdk-iconfont icon-${format === 'fontColor' ? 'format-color-text' : 'format-color-fill'}`,
          css`
            width: 2em;
            height: 2em;
            justify-content: center;
            align-items: center;
            display: flex;
            border-radius: 4px;
            outline: 1px solid #e8e8e8;
          `
        )}
        style={{
          background: color,
        }}
      />
    </div>
  );
}

export default function (props: any) {
  const { setShowCard, editor, docWidth, docId } = props;
  const selection = getCache(docId, 'selection');

  const colorArray = [
    'rgb(0, 0, 0)',
    'rgb(224, 102, 102)',
    'rgb(246, 178, 107)',
    'rgb(255, 217, 102)',
    'rgb(147, 196, 125)',
    'rgb(111, 168, 220)',
    'rgb(142, 124, 195)',
    'rgb(217, 217, 217)',
    'rgb(255， 255， 255)',
  ];

  return (
    <div
      className="mobile-toolbar-doc-card-container"
      onMouseDown={() => {
        setShowCard(false);
      }}
    >
      <div
        className="mod"
        style={{
          position: 'fixed',
          bottom: 0,
        }}
      >
        <div
          className="container-inner"
          onMouseDown={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="header">
            <div className="wrapper-inner">
              <div
                className="tripdocs-sdk-iconfont Tripdocs-close"
                style={{ color: 'black' }}
                onMouseDown={function () {
                  setShowCard(false);
                }}
              />
              <span className="action-bg">{f('colorAndLingth')}</span>
            </div>
          </div>

          <div className="body" style={{ height: '50vh' }}>
            <div className="horizontal-line"></div>
            <span className="tag">{f('fontColor')}</span>
            <div
              className={css`
                display: flex;
                flex-direction: row;
                padding: 20px;
                overflow: auto;
                margin: 0 auto;
                justify-content: space-around;
              `}
            >
              {colorArray.map((colorItem: string, index: number) => (
                <ColorBtn editor={editor} format={'fontColor'} color={colorItem} key={index} callback={() => setShowCard(false)} />
              ))}
            </div>

            <span className="tag">{f('bgColor')}</span>
            <div
              className={css`
                display: flex;
                flex-direction: row;
                padding: 20px;
                overflow: auto;
                margin: 0 auto;
                justify-content: space-around;
              `}
            >
              {colorArray.map((colorItem: string, index: number) => (
                <ColorBtn editor={editor} format={'backgroundColor'} color={colorItem} key={index} callback={() => setShowCard(false)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
