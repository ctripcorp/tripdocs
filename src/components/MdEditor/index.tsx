import React, { useEffect, useMemo, useRef, useState } from 'react';
import unified from 'unified';
import markdown from 'remark-parse';
import gfm from 'remark-gfm';
import frontmatter from 'remark-frontmatter';
import remarkToSlate from '../docs/plugins/transformers/remark-to-slate';
import { Element, Node } from '../slate-packages/slate';
import { createRandomId } from '../../utils/randomId';
import './index.less';
import CodeMirror from '@uiw/react-codemirror';
import { keymap } from '@codemirror/view';
import { markdown as md } from '@codemirror/lang-markdown';
import { myTheme } from './theme';
import { css, cx } from '@emotion/css';
import { f } from '@src/resource/string';
import sessStorage from '@src/utils/sessStorage';
import hash from 'object-hash';
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next';
import * as Y from 'yjs';
import { WebsocketProvider as WebsocketProviderOfficial } from 'y-websocket';
import { getCache } from '@src/utils/cacheUtils';
import { hashCode, intToRGB } from '@src/utils/hexColorUtils';
import { hexOpacity20 } from '../docs/slateEditor';
import { SyncElement, toSlateDoc } from '../slate-packages/slate-yjs';
import { dragInsertLocalFiles, isImageType, readCopyFile } from '../docs/plugins/InlineImage/inlineImagePlugins';
import { message } from 'antd';

export const usercolors = [
  { color: '#30bced', light: '#30bced33' },
  { color: '#6eeb83', light: '#6eeb8333' },
  { color: '#ffbc42', light: '#ffbc4233' },
  { color: '#ecd444', light: '#ecd44433' },
  { color: '#ee6352', light: '#ee635233' },
  { color: '#9ac2c9', light: '#9ac2c933' },
  { color: '#8acb88', light: '#8acb8833' },
  { color: '#1be7ff', light: '#1be7ff33' },
];

export const userColor = usercolors[Math.floor(Math.random() * 10000) % usercolors.length];

interface IMDEditorProps {
  onChange: Function;
  options: any;
}
const MDEditor: React.FC<IMDEditorProps> = ({ options, onChange }) => {
  const [value, setValue] = useState('');

  const cmRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    const newVal = value || '';
    const processor = unified().use(markdown).use(gfm).use(frontmatter).use(remarkToSlate);
    let slateValue: any[];
    slateValue = processor.processSync(newVal).result as any[];

    if (slateValue.length === 1 && slateValue[0].text === '') {
      slateValue = [];
    }

    const newContent = [
      {
        type: 'heading-one',
        children: [
          {
            text: '',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: '',
          },
        ],
      },
      ...(slateValue as any[]),
      {
        type: 'paragraph',
        children: [
          {
            text: ' ',
          },
        ],
      },
    ];

    if (window.tripdocs.editorsMap[options.docId].api?.setContent) {
      window.tripdocs.editorsMap[options.docId].mdContent = newVal;
      window.tripdocs.editorsMap[options.docId].md2SlateContent = newContent;
    }
  }, [value]);

  let interval;
  useEffect(() => {
    if (!interval) {
      interval = setInterval(() => {
        let cur_key = 'cur_markdown_content_' + options.docId;
        let last_key = 'last_markdown_content_' + options.docId;
        const currentHash = sessStorage.get(cur_key) || '';
        const lastHash = sessStorage.get(last_key) || '';
        if (lastHash) {
          if (lastHash !== currentHash && window.tripdocs.editorsMap[options.docId]) {
            console.log('【markdown_content_hash】inequal', currentHash, lastHash);
            window.tripdocs.editorsMap[options.docId]?.api.mdRefreshDocCallback();
            const { md2SlateContent, api } = window.tripdocs.editorsMap[options.docId];
            md2SlateContent && api?.setContent(md2SlateContent);
            sessStorage.set(last_key, currentHash);
          }
        } else {
          sessStorage.set(last_key, currentHash);
        }
      }, 1500);
    }
    return () => {
      clearInterval(interval);
    };
  }, []);

  const [sharedType, provider] = useMemo(() => {
    let provider;
    const ydoc = new Y.Doc();
    const docId = options.docId;
    const url = 'ws://localhost:5000';
    provider = new WebsocketProviderOfficial(url, docId, ydoc);

    const text = ydoc.getText('codemirror');

    const sharedType = text;

    const me = {
      name: '未知' + Math.floor(Math.random() * 100),
      color: userColor.color,
      colorLight: userColor.light,
    };
    if (getCache(options.docId, 'options')) {
      const { userInfo } = getCache(options.docId, 'options');
      me.name = userInfo.userName || userInfo.name || userInfo.displayName;
      me.color = userInfo && userInfo.employee ? '#' + intToRGB(hashCode(userInfo.employee)) : '#000000';
      me.colorLight = me.color + hexOpacity20;
    }
    console.log('Mddocs Yjs => me', getCache(options.docId, 'options'), options, me);

    provider.awareness.setLocalStateField('user', me);

    return [sharedType, provider];
  }, []);

  provider.on('sync', (isSynced: boolean) => {
    if (isSynced && !isInitialized.current && sharedType.length === 0 && options.defaultMDValue) {
      sharedType.insert(0, options.defaultMDValue);
      console.log('Mddocs Yjs => sharedType', sharedType, sharedType.toJSON());
      isInitialized.current = true;
    }
  });

  return (
    <div
      style={{ height: '100%' }}
      data-ignore-slate
      className={cx(
        'mdeditor_container_wrap',
        css`
          .cm-theme {
            height: 100%;
          }
          .cm-scroller {
            font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, Courier, monospace;
            overflow-x: hidden;
            .cm-content {
              width: 90%;
              white-space: pre-wrap;
              word-break: break-all;
            }
          }
          * ::selection {
            color: inherit;
            background: #d7d4f0;
          }
          .cm-activeLineGutter {
            background: none;
            color: #8f8f8f;
          }
        `
      )}
    >
      {}
      {sharedType && provider && (
        <CodeMirror
          ref={cmRef}
          data-ignore-slate
          height="100%"
          width="100%"
          theme={myTheme}
          basicSetup={{
            highlightActiveLine: false,
            lineNumbers: true,
            autocompletion: true,
            crosshairCursor: false,
            bracketMatching: true,
            foldGutter: false,
          }}
          extensions={[keymap.of([...yUndoManagerKeymap]), md(), yCollab(sharedType, provider.awareness)]}
          onDragOver={e => {
            e.preventDefault();
          }}
          onDragStart={e => {
            e.dataTransfer.effectAllowed;
          }}
          onDropCapture={e => {
            e.stopPropagation();

            e.preventDefault();
            let files = e.dataTransfer.files;
            if (files && files[0] && isImageType(files[0].type)) {
              if (files[0].size > 10 * 1024 * 1024) {
                message.error('图片文件不能大于 10mb');
                return;
              }
              readCopyFile(options.docId, files[0], source => {
                const imgMdStr = `![image](${source})`;

                sharedType.insert(sharedType.length, imgMdStr);
              });
            }
          }}
          onDrop={e => {
            e.stopPropagation();

            e.preventDefault();
          }}
          onChange={val => {
            setValue(val);
            onChange && onChange(val);
            throttle(() => {
              let cur_key = 'cur_markdown_content_' + options.docId;
              sessStorage.set(cur_key, hash(val));
            }, 400)();
          }}
        />
      )}
    </div>
  );
};

function throttle(fn, delay) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last > delay) {
      last = now;
      fn(...args);
    }
  };
}

export default MDEditor;
