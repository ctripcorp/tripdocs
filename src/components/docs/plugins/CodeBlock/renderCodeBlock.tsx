import { css, cx } from '@emotion/css';
import { Divider, message, Select } from 'antd';
import isHotkey from 'is-hotkey';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createEditor, Node, Range, Text, Transforms } from '@src/components/slate-packages/slate';
import { TripdocsSdkContext } from '../../../../Docs';
import { withHistory } from '../../../slate-packages/slate-history';
import { Editable, ReactEditor, Slate, useSelected, withReact } from '../../../slate-packages/slate-react';
import { ELTYPE } from '../config';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@src/utils/copyToClipboard';
import './index.less';
import { f } from '@src/resource/string';
import CodeMirror from '@uiw/react-codemirror';
import { markdown as cm_md } from '@codemirror/lang-markdown';
import { javascript as cm_js } from '@codemirror/lang-javascript';
import { css as cm_css } from '@codemirror/lang-css';
import { html as cm_html } from '@codemirror/lang-html';
import { sql as cm_sql } from '@codemirror/lang-sql';
import { rust as cm_rust } from '@codemirror/lang-rust';
import { python as cm_python } from '@codemirror/lang-python';
import _, { isNull } from 'lodash';

const { Option } = Select;
export const defaultLanguage = 'JavaScript';

const languageMapping = {
  css: 'CSS',
  html: 'HTML',

  javascript: 'JavaScript',
  typescript: 'TypeScript',

  markdown: 'Markdown',

  python: 'Python',
  rust: 'Rust',
  sql: 'SQL',
};

const languageExtMapping = {
  css: cm_css(),
  html: cm_html({ matchClosingTags: true, autoCloseTags: true }),
  javascript: cm_js({ jsx: true }),
  typescript: cm_js({ jsx: true, typescript: true }),
  markdwon: cm_md(),
  python: cm_python(),
  rust: cm_rust(),
  sql: cm_sql(),
};

export const CodeHighlightEditor = (props: any) => {
  const { element, children, setSelectCB, attributes, editor: parentEditor } = props;
  const renderLeaf = useCallback(props => <Leaf {...props} />, []);
  const renderElement = useCallback(props => <p {...props.attributes}>{props.children}</p>, []);
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const dataCodeBlockId = element['data-codeblock-id'] ? element['data-codeblock-id'] : element['id'];
  const editorRef = useRef();
  const { isReadOnly } = React.useContext(TripdocsSdkContext);

  const cmRef = useRef(null);

  let dataCardValueCode = !element['data-card-value']
    ? element['data-card-value'] === ''
      ? ''
      : element.children[0].text
    : decodeURIComponent(JSON.parse(decodeURIComponent(element['data-card-value']))['data']['code']);

  let dataCardValueLanguage = !element['data-card-value']
    ? defaultLanguage
    : JSON.parse(decodeURIComponent(element['data-card-value']))['data']['mode'];

  const [dataCardValue, setDataCardValue] = useState(
    element['data-card-value']
      ? element['data-card-value']
      : encodeURIComponent(
          `{"data": { "mode": "${defaultLanguage.toLowerCase()}", "code": "${encodeURIComponent(dataCardValueCode)}", "id": "${dataCodeBlockId}" }}`
        )
  );

  const [value, setValue] = useState<string>(dataCardValueCode);
  const [language, setLanguage] = useState(dataCardValueLanguage);

  useEffect(() => {
    if (props.editor && element.type === ELTYPE.CODE_BLOCK) {
      const curPath = ReactEditor.findPath(editor, ReactEditor.toSlateNode(props.editor, attributes.ref.current));
      const encodedValue = encodeURIComponent(
        `{"data": { "mode": "${language.toLowerCase()}", "code": "${encodeURIComponent(
          value ? value : dataCardValueCode
        )}", "id": "${dataCodeBlockId}" }}`
      );
      console.log(
        '[dataCardValue]',
        curPath,
        `{"data": { "mode": "${language.toLowerCase()}", "code": "${value ? value : dataCardValueCode}", "id": "${dataCodeBlockId}" }}`,
        props.editor,
        attributes.ref.current
      );
      _.throttle(
        () =>
          Transforms.setNodes(props.editor, { 'data-card-value': encodedValue } as Partial<Node>, {
            at: curPath,
          }),
        500
      )();
    }
    console.log('[dataCardValueCode]', value, dataCardValueCode, element);
  }, [value, language]);

  useEffect(() => {
    console.log('isReadOnly ---- CodeBlock ----', isReadOnly, cmRef?.current);
    const editorDom = editorRef.current;

    if (editorRef && editorDom) {
      if (isReadOnly) {
        $(editorDom).children('div').attr('contenteditable', 'false');
      } else {
        $(editorDom).children('div').removeAttr('contenteditable');
      }
    }

    const handler = e => {
      if (!cmRef || !cmRef.current || !cmRef.current.editor) return;
      const edt = cmRef.current.editor;
      if (!edt.contains(e.target)) {
        edt.querySelectorAll('.cm-selectionBackground').forEach(item => {
          item.remove();
        });
      }
    };
    let ea = document.getElementById(`editorarea-${parentEditor.docId}`);
    ea.addEventListener('click', handler);
    return () => {
      ea.removeEventListener('click', handler);
    };
  }, [isReadOnly]);

  const decorate = useCallback(
    ([node, path]) => {
      const ranges: any = [];
      if (!Text.isText(node)) {
        return ranges;
      }
      const tokens = Prism.tokenize(node.text, Prism.languages[(language as string).toLowerCase()]);
      let start = 0;
      for (const token of tokens) {
        const length = getLength(token);
        const end = start + length;
        if (typeof token !== 'string') {
          ranges.push({
            [token.type]: true,
            anchor: { path, offset: start },
            focus: { path, offset: end },
          });
        }
        start = end;
      }
      return ranges;
    },
    [language]
  );

  const onComposition = (e: React.CompositionEvent<HTMLDivElement>) => {
    if (e.type === 'compositionstart') {
      editor.insertText(' ');
    } else if (e.type === 'compositionend') {
      editor.deleteBackward('character');
    }
  };

  const isValidJS = (code: string) => {
    const frequentKeyword = ['this', 'function', 'if', 'return', 'var', 'else', 'for', 'new', 'const', 'let'];
    code.includes('this');
    let result = false;
    frequentKeyword.forEach(word => {
      if (!result && code.includes(word)) {
        result = true;
      }
    });
    return result;
  };

  const getExtension = (lang: string) => {
    let ext = languageExtMapping[lang] ?? languageExtMapping['javascript'];
    return ext;
  };

  return useMemo(
    () => (
      <pre
        {...attributes}
        data-block-context
        name="code-block-editor"
        className={cx('code-block-editor', 'ignore-toggle-readonly')}
        data-card-value={dataCardValue}
        id={dataCodeBlockId}
        onDragOverCapture={e => {
          console.log('[code-block] onDragOverCapture', e.target);
          e.dataTransfer.dropEffect = 'none';
          e.preventDefault();
        }}
      >
        {isReadOnly ? (
          <div
            data-ignore-slate
            className={cx(
              'ignore-toggle-readonly',
              css`
                & {
                  position: absolute;
                  z-index: 1;
                  top: 0px;
                  right: 0;
                  display: flex;
                  justify-content: flex-end;
                  align-items: center;
                  user-select: none;
                  color: rgba(140, 140, 140, 0.8);
                  font-size: 14px;
                  letter-spacing: -0.3px;
                  .lang-wrapper {
                    margin-right: 8px;
                    user-select: none;
                    font-family: sans-serif;
                    font-size: 12px;
                  }
                  .copy-code-btn {
                    margin: 0 16px 0 8px;
                    &:hover {
                      color: #000;
                      cursor: pointer;
                    }
                  }
                }
              `
            )}
          >
            <div data-ignore-slate className={cx('ignore-toggle-readonly', 'lang-wrapper')}>
              {languageMapping[language.toLowerCase()]}
            </div>
            <Divider type="vertical" />
            <div
              data-ignore-slate
              className={cx('ignore-toggle-readonly', 'copy-code-btn')}
              onClick={e => {
                e.preventDefault();
                copyToClipboard(dataCardValueCode || '');
                message.destroy();
                message.config({ maxCount: 2, top: 70 });
                message.success('复制成功');
              }}
            >
              <CopyOutlined data-ignore-slate />
            </div>
          </div>
        ) : (
          <div
            data-ignore-slate
            contentEditable={false}
            className={cx('ignore-toggle-readonly')}
            style={{
              position: 'relative',
              top: '0',
              right: '5px',
              background: 'rgba(0,0,0,0.05)',
              userSelect: 'none',
            }}
            onDragOverCapture={e => {
              console.log('[code-block] onDragOverCapture', e.target);
              e.dataTransfer.dropEffect = 'none';
              e.preventDefault();
            }}
          >
            <div className="code-block-language-bar ignore-toggle-readonly" contentEditable={false} style={{ userSelect: 'none' }}>
              <Select
                value={language}
                onChange={val => {
                  setLanguage(val);
                }}
              >
                {}
                <Option value="css">CSS</Option>
                <Option value="html">HTML</Option>
                {}
                <Option value="javascript">JavaScript</Option>
                <Option value="typescript">TypeScript</Option>
                {}
                <Option value="markdown">Markdown</Option>
                {}
                <Option value="python">Python</Option>
                <Option value="rust">Rust</Option>
                <Option value="sql">SQL</Option>
              </Select>
            </div>
          </div>
        )}
        <CodeMirror
          ref={cmRef}
          data-ignore-slate
          value={value}
          height="100%"
          width="100%"
          className={cx('ignore-toggle-readonly', isReadOnly ? 'cm-readonly' : null)}
          placeholder={f('pleaseInputCode')}
          contentEditable={false}
          readOnly={isReadOnly ? true : false}
          basicSetup={{
            highlightActiveLine: false,
            lineNumbers: true,
            autocompletion: true,
            crosshairCursor: false,
            bracketMatching: true,
            foldGutter: false,
            highlightSelectionMatches: false,
          }}
          extensions={[getExtension(language)]}
          onKeyDown={(e: any) => {
            if (isReadOnly) {
              e.preventDefault();
              return;
            }
            if (editor.selection && ReactEditor.hasRange(editor, editor.selection)) {
              if (isHotkey('mod+Enter', e)) {
                e.preventDefault();
                ReactEditor.blur(editor);
                setSelectCB(ReactEditor.findPath(props.editor, ReactEditor.toSlateNode(props.editor, attributes.ref.current)));
              }
              if (isHotkey('Enter', e)) {
                e.preventDefault();
                Transforms.insertText(editor, '\n');
              }
            }
          }}
          onFocus={e => {
            if (isReadOnly) {
              e.preventDefault();
              return;
            }
            ReactEditor.blur(props.editor);
          }}
          onChange={val => {
            setValue(val);
          }}
        />
        {}
        <div style={{ display: 'none' }}>{children}</div>
      </pre>
    ),
    [value, language, isReadOnly, element, dataCardValue, dataCardValueCode, dataCardValueLanguage]
  );
};

const getLength = (token: any) => {
  if (typeof token === 'string') {
    return token.length;
  } else if (typeof token.content === 'string') {
    return token.content.length;
  } else {
    return token.content.reduce((l: any, t: any) => l + getLength(t), 0);
  }
};

const colorTheme = {
  gray: '#7D8B99',
  darkGray: '#666',
  yellow: '#ffa903',
  blue: '#1646ad',
  gold: '#e90',
  green: '#009e9d',
  red: '#c92c2c',
  purple: '#bb51b8',
  orange: '#ff6800',
};

const Leaf = ({ attributes, children, leaf }: any) => {
  return (
    <span
      {...attributes}
      className={css`
        ${leaf.comment &&
        css`
          color: ${colorTheme.gray};
        `}
        ${(leaf.operator || leaf.bold || leaf.url) &&
        css`
          color: ${colorTheme.yellow};
        `}
        ${(leaf.parameter || leaf.title) &&
        css`
          color: ${colorTheme.blue};
        `}
        ${(leaf.variable || leaf.regex || leaf.blockquote) &&
        css`
          color: ${colorTheme.gold};
        `}
        ${(leaf.string || leaf['template-string']) &&
        css`
          color: ${colorTheme.orange};
        `}
        ${(leaf.number ||
          leaf.boolean ||
          leaf.tag ||
          leaf.constant ||
          leaf.symbol ||
          leaf.attr ||
          leaf.selector ||
          leaf.code ||
          leaf.char ||
          leaf['code-snippet'] ||
          leaf['front-matter-block']) &&
        css`
          color: ${colorTheme.green};
        `}
        ${(leaf.punctuation || leaf.hr) &&
        css`
          color: ${colorTheme.darkGray};
        `}
        ${(leaf.function || leaf.class || leaf['url-reference']) &&
        css`
          color: ${colorTheme.red};
        `}
        ${leaf.keyword &&
        css`
          color: ${colorTheme.purple};
        `}
        ${leaf.italic &&
        css`
          font-style: italic;
        `}
        ${leaf.bold &&
        css`
          font-weight: bold;
        `}
        ${leaf.strike &&
        css`
          text-decoration: line-through;
        `}
      `}
    >
      {children}
    </span>
  );
};

const deleteIndent = (editor: any, dataCardValueCode: any) => {
  if (
    dataCardValueCode[editor.selection.focus.offset - 1] === ' ' &&
    dataCardValueCode[editor.selection.focus.offset - 2] === ' ' &&
    dataCardValueCode[editor.selection.focus.offset - 3] === ' ' &&
    dataCardValueCode[editor.selection.focus.offset - 4] === ' '
  ) {
    Transforms.delete(editor, { reverse: true, distance: 4, hanging: true });
  } else if (
    dataCardValueCode[editor.selection.focus.offset - 1] === ' ' &&
    dataCardValueCode[editor.selection.focus.offset - 2] === ' ' &&
    dataCardValueCode[editor.selection.focus.offset - 3] === ' '
  ) {
    Transforms.delete(editor, { reverse: true, distance: 3, hanging: true });
  } else if (dataCardValueCode[editor.selection.focus.offset - 1] === ' ' && dataCardValueCode[editor.selection.focus.offset - 2] === ' ') {
    Transforms.delete(editor, { reverse: true, distance: 2, hanging: true });
  } else if (dataCardValueCode[editor.selection.focus.offset - 1] === ' ') {
    Transforms.delete(editor, { reverse: true, distance: 1, hanging: true });
  }
};

const initialValue = [
  {
    children: [
      {
        text: '<h1>wong</h1>\n<h2>xxx</h2>',
      },
    ],
  },
];

let Prism: any = null;
if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
  Prism = require('prismjs');
  require('prismjs/components/prism-python');
  require('prismjs/components/prism-php');
  require('prismjs/components/prism-sql');
  require('prismjs/components/prism-java');
  require('prismjs/components/prism-json');
  require('prismjs/components/prism-markdown');
  require('prismjs/components/prism-bash');
  require('prismjs/components/prism-rust');

  Prism.languages.json = Prism.languages.extend('json', {});

  Prism.languages.python = Prism.languages.extend('python', {});
  Prism.languages.insertBefore('python', 'string', {
    comment: { pattern: /#[^\n]*/, alias: 'comment' },
  });
  Prism.languages.javascript = Prism.languages.extend('javascript', {});
  Prism.languages.insertBefore('javascript', 'string', {
    comment: { pattern: /(\/\/[^\n]*)|(\/\*.*?\*\/)/, alias: 'comment' },
  });
  Prism.languages.html = Prism.languages.extend('html', {});
  Prism.languages.insertBefore('html', 'string', {
    comment: { pattern: /<!--[^\n]*-->/, alias: 'comment' },
  });
}
