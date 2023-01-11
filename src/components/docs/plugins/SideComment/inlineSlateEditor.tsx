import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Editable, ReactEditor, Slate, withReact } from '../../../slate-packages/slate-react';
import { Editor, Range, Text, Node } from '@src/components/slate-packages/slate';
import { createEditor, Transforms } from '../../../slate-packages/slate';
import { ELTYPE } from '../config';
import { withHistory } from '../../../slate-packages/slate-history';
import { insertMention } from '../Mention/mention';
import { InlineElement } from '../../InlineElement';
import { TripdocsSdkContext } from '../../../../Docs';
import ReactDOM from 'react-dom';
import isHotkey from 'is-hotkey';
import { Italic } from '../Components';
import { onKeyDownMention } from '../Mention/onKeyDownMention';
import { withMention } from '../Mention/withMention';
import { createRandomId } from '@src/utils/randomId';
import { DOMRange } from '@src/components/slate-packages/slate-react/utils/dom';
import { IS_READ_ONLY } from '@src/components/slate-packages/slate-react/utils/weak-maps';
import scrollIntoView from 'scroll-into-view-if-needed';
import { withInlineImages } from '../InlineImage/inlineImagePlugins';
import { withHtml } from '../withHtml';
import { getCache, setCache, setGlobalCache } from '@src/utils/cacheUtils';
import { Avatar } from 'antd';
import { css, cx } from '@emotion/css';

const string = (node: any): string => {
  if (node?.type === ELTYPE.MENTION) {
    return `@[[${JSON.stringify(node?.targetUser)}]]`;
  } else if (node?.type === ELTYPE.INLINEIMAGE) {
    return `![[${JSON.stringify({ source: node?.source, linkSource: node?.linkSource, width: node?.width, height: node?.height })}]]`;
  } else if (Text.isText(node)) {
    return node.text;
  } else {
    return node.children.map(string).join('');
  }
};

const serialize = nodes => {
  return nodes.map(n => string(n)).join('\n');
};

export const deserialize = string => {
  let leaves = [];
  if (/(\!|\@)\[\[(.*?)\]\]/.test(string)) {
    const inlineElArr = [];
    const textArr = string?.split(/[\!\@]\[\[.*?\]\]/);
    string?.replace(/([\!\@])\[\[(.*?)\]\]/g, (_, $1, $2) => {
      console.log('match', _, $1, $2);
      if ($2.startsWith('{')) {
        if ($1 === '!') {
          const element = JSON.parse($2);
          inlineElArr.push({
            type: ELTYPE.INLINEIMAGE,
            source: element?.source,
            linkSource: element?.linkSource,
            width: element?.width,
            height: element?.height,
          });
        } else if ($1 === '@') {
          inlineElArr.push({ type: ELTYPE.MENTION, data: JSON.parse($2) });
        }
      }
      return '';
    });
    if (inlineElArr.length === textArr?.length - 1) {
      for (let i = 0; i < inlineElArr.length; i++) {
        leaves.push({ text: textArr[i] });
        const inline = inlineElArr[i];
        if (inline.type === ELTYPE.INLINEIMAGE) {
          leaves.push({
            type: ELTYPE.INLINEIMAGE,
            width: inline.width,
            height: inline.height,
            source: inline.source,
            linkSource: inline.linkSource,
            children: [{ text: '' }],
          });
        } else if (inline.type === ELTYPE.MENTION) {
          leaves.push({
            type: ELTYPE.MENTION,
            character: inline.data,
            targetUser: inline.data,
            children: [{ text: '' }],
          });
        }
      }
      leaves.push({ text: textArr[textArr?.length - 1] });
    }
    console.log('Deserializing...', string, leaves, textArr, inlineElArr);
  }
  return [{ type: ELTYPE.PARAGRAPH, children: leaves.length === 0 ? [{ text: string || '' }] : leaves }];
};

export const renderLeaf = (props: any) => <Leaf {...props} />;

const Leaf: any = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.code) {
    children = (
      <code
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '2px',
          padding: '0 2px',
          margin: '2px 4px',
        }}
      >
        {children}
      </code>
    );
  }
  if (leaf.italic) {
    children = <Italic>{children}</Italic>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  if (leaf.strikethrough) {
    children = <del>{children}</del>;
  }
  return (
    <span {...attributes} contentEditable={leaf.readonly ? false : true} suppressContentEditableWarning={true}>
      {children}
    </span>
  );
};

const ContainerPortal = ({ children, editor }) => {
  const container = ReactEditor.toDOMNode(editor, editor)?.parentElement;
  return ReactDOM.createPortal(children, container);
};

export const InlineSlateEditor = (props: any) => {
  const { value, setValue, setCommentValue, setEditor } = props;
  const { editor: mainEditor, docId: mainDocId, userInfo } = useContext(TripdocsSdkContext);

  const [allUserList, setAllUserList] = useState([]);
  const docId = useMemo(() => mainDocId + '#' + createRandomId().substring(0, 3), []);

  const editor: any = useMemo(() => withInlineImages(withHtml(withMention(withHistory(withReact(createEditor(docId)))))), []);

  const mentionRef = useRef();
  const [target, setTarget] = useState<Range | undefined>();
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [chars, setChars] = useState([]);
  const [mentionsPosition, setMentionsPosition] = useState({ top: '-9999px', left: '-9999px' });
  const [editorWrapMaxHeight, setEditorWrapMaxHeight] = useState(
    document.getElementsByClassName('side-comment-wrapper')[0]?.getBoundingClientRect().height
  );
  const [isOverMaxHeight, setIsOverMaxHeight] = useState(false);

  useEffect(() => {
    setEditor && setEditor(editor);
    const mainOptions: Options = getCache(mainDocId, 'options');
    const { isInternet, isInElectron, isRefresh, isWideMode, isMdEditor, userInfo, readOnly } = mainOptions;
    const options: Partial<Options> = {
      isInternet,
      isInElectron,
      isRefresh,
      isWideMode,
      isMdEditor,
      userInfo,
      readOnly,
    };
    console.log('isInternet 00', docId, options);
    setAllUserList(mainOptions?.allUserList?.length > 0 ? mainOptions.allUserList : mainOptions.defaultUserList);
    setGlobalCache(docId, { options });
  }, []);

  async function setUserList(getUserList) {
    console.log('setUserList-----------******', search);
    let userList = [];
    if (!search) {
      userList = getCache(mainDocId, 'options').defaultUserList;
      console.log('setUserList-----------******1', search, userList);
    } else {
      userList = await getUserList(search);
      console.log('setUserList,arr 2', userList);
      if (!userList) {
        setChars([]);
        return;
      }
    }

    const newArr = [];
    userList.filter(c => {
      if (c?.status === 0) {
        return false;
      }
      newArr.push({ ...c, sn: c.c_name });
      return true;
    });
    console.log('******************', newArr);

    setChars(newArr);
  }

  useEffect(() => {
    console.log('search target', search, target, allUserList, window.tripdocs.editorsMap[mainDocId]?.api?.getUserList);
    if (window.tripdocs.editorsMap[mainDocId]?.api?.getUserList) {
      setUserList(window.tripdocs.editorsMap[mainDocId]?.api.getUserList);
    } else {
      const arr = allUserList.filter(c => {
        const sn = c?.sn;
        if (sn?.status === 0) {
          return false;
        }

        return sn?.startsWith(search.toLowerCase());
      });
      setChars(arr);
    }
  }, [search, target, mainDocId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeItems = document.getElementsByClassName('mention-item-active');
      if (activeItems.length > 0 && index !== 0) {
        activeItems[0].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [index]);

  useEffect(() => {
    const editorDOM = ReactEditor.toDOMNode(editor, editor);
    console.log(`editorDOM`, editorDOM, target, chars, allUserList);
    if (editorDOM && target && chars.length > 0) {
      const el: any = mentionRef.current;
      const domRange = ReactEditor.toDOMRange(editor, target);
      const rect = domRange?.getBoundingClientRect();
      const editorRect = editorDOM.getBoundingClientRect();

      setMentionsPosition({
        top: `${rect.top - editorRect.top + 24}px`,
        left: `${rect.left - editorRect.left + 16}px`,
      });

      const editorHeight = document.getElementsByClassName('inline-side-comment__editor')[0]?.getBoundingClientRect().height;
      setEditorWrapMaxHeight(editorHeight);
      if (rect.bottom + 100 > editorWrapMaxHeight) {
        setIsOverMaxHeight(true);
      } else {
        setIsOverMaxHeight(false);
      }
    }
  }, [target]);

  const _onKeyDown = (e: any) => {
    onKeyDownMention(e, editor);
    console.log('[Inline Mention]', e.key, chars[index], userInfo, mainDocId);
    const { selection } = editor;
    if (target) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const prevIndex = index >= chars.length - 1 ? 0 : index + 1;
          setIndex(prevIndex);
          break;
        case 'ArrowUp':
          e.preventDefault();
          const nextIndex = index <= 0 ? chars.length - 1 : index - 1;
          setIndex(nextIndex);
          break;
        case 'Tab':
        case 'Enter':
          e.preventDefault();
          if (chars[index] && chars[index].sn) {
            Transforms.select(editor, target);
            insertMention(editor, chars[index], userInfo, docId);
            setTarget(null);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setTarget(null);
          break;
      }
      return;
    }
    if (selection) {
      if (isHotkey('alt+c', e)) {
        e.preventDefault();
        console.log('|| selection: ', editor, selection);
        console.log('|| CURRENT NODE: ', Editor.node(editor, selection)[0]);
        console.log('|| CURRENT PATH: ', Editor.node(editor, selection)[1]);
      }
      if (isHotkey('alt+v', e)) {
        e.preventDefault();
        console.log('|| selection: ', editor, selection);
        console.log('|| PARENT NODE: ', Editor.parent(editor, Editor.node(editor, selection)[1])[0]);
        console.log('|| PARENT PATH: ', Editor.parent(editor, Editor.node(editor, selection)[1])[1]);
      }
      if (isHotkey('Enter', e)) {
        e.preventDefault();
        Transforms.insertText(editor, '\n');
      }
    }
  };

  return (
    <>
      <Slate
        editor={editor}
        value={value}
        onChange={(value: any) => {
          setValue(value);
          setCommentValue(serialize(value));
          const { selection } = editor;
          console.log('value', value, serialize(value));
          selection &&
            ReactEditor.hasRange(editor, selection) &&
            console.log('value', editor.selection, value, Range.isCollapsed(selection), serialize(value));
          if (selection && ReactEditor.hasRange(editor, selection) && selection.anchor && selection.focus && Range.isCollapsed(selection)) {
            const [start] = Range.edges(selection);
            const wordBefore = Editor.before(editor, start, { unit: 'word' });
            const before = wordBefore && Editor.before(editor, wordBefore) ? Editor.before(editor, wordBefore) : wordBefore;
            const beforeRange = before && Editor.range(editor, before, start);
            const beforeText = beforeRange && Editor.string(editor, beforeRange);
            const beforeMatch = beforeText && beforeText.match(/@([\u4e00-\u9fa5\w ]*)/);
            const beforeMatchEmpty = beforeText && beforeText.match(/@$/);
            const after = Editor.after(editor, start);
            const afterRange = Editor.range(editor, start, after);
            const afterText = Editor.string(editor, afterRange);
            const afterMatch = afterText.match(/^(\s|$)/);
            const isTarget = beforeText === '@';

            console.log('[beforeMatch] :>> ', beforeMatch);
            if ((beforeMatch || beforeMatchEmpty || isTarget) && afterMatch) {
              if (beforeMatchEmpty || isTarget) {
                beforeRange.anchor = JSON.parse(JSON.stringify(beforeRange.focus));
                beforeRange.anchor.offset = beforeRange.anchor.offset - 1;
              }
              setTarget(beforeRange);
              const mSearch = (beforeMatch && beforeMatch[1]) || '';
              setSearch(mSearch);

              setChars(allUserList);
              setIndex(0);
              return;
            }
          }
          setTarget(null);
        }}
      >
        <Editable
          data-ignore-slate
          scrollSelectionIntoView={inlineScrollSelectionIntoView(mainEditor)}
          renderElement={InlineElement}
          renderLeaf={renderLeaf}
          onKeyDown={_onKeyDown}
          style={{
            padding: '6px',
            border: '1px solid #dadada',
            borderRadius: '4px',

            background: '#fff',
            height: '98px',
            minHeight: '98px',
            overflow: 'auto',
            resize: 'vertical',
          }}
        ></Editable>
      </Slate>
      {editor && target && chars.length > 0 && (
        <ContainerPortal editor={editor}>
          <div
            ref={mentionRef}
            style={{
              top: isOverMaxHeight ? null : mentionsPosition.top,
              bottom: isOverMaxHeight ? 0 : null,
              left: mentionsPosition.left,
              position: 'absolute',
              zIndex: 1,
              padding: '3px',
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 5px rgba(0,0,0,.2)',
              height: 200,
              maxHeight: 200,
              overflow: 'auto',
              minWidth: 250,
            }}
          >
            {chars.map((char, i) => (
              <div
                contentEditable="false"
                suppressContentEditableWarning
                data-ignore-slate
                className={i === index ? 'mention-item-active' : 'mention-item'}
                key={i}
                style={{
                  padding: '1px 3px',
                  borderRadius: '3px',
                  background: i === index ? '#B4D5FF' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  userSelect: 'none',
                }}
                onMouseEnter={() => {
                  if (index !== i) setIndex(i);
                }}
                onMouseLeave={() => {
                  setIndex(0);
                }}
                onMouseDown={e => {
                  e.preventDefault();
                  setIndex(i);
                  Transforms.select(editor, target);
                  insertMention(editor, chars[i], userInfo, docId);
                  setTarget(null);
                }}
                onClick={e => {
                  e.preventDefault();
                  setIndex(i);
                  Transforms.select(editor, target);
                  insertMention(editor, chars[i], userInfo, docId);
                  setTarget(null);
                }}
              >
                <Avatar src={char?.avatarUrl} size={28} style={{ margin: '0 0.5em' }} />
                <div
                  className={cx(
                    'mention-item-info',
                    css`
                      display: flex;
                      flex-direction: column;
                      justify-content: center;
                      align-items: start;
                    `
                  )}
                >
                  <div className={css``}>{char?.displayname || char?.sn}</div>
                  <div
                    className={css`
                      font-size: 12px;
                      color: #8090a2;
                    `}
                  >
                    {char?.displayInfo}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ContainerPortal>
      )}
    </>
  );
};

export const inlineScrollSelectionIntoView = (mainEditor: Editor) => (editor: ReactEditor, domRange: DOMRange) => {
  const inlineEditorEl = ReactEditor.toDOMNode(editor, editor);
  if (!inlineEditorEl || !mainEditor) return;
  const editorRect = inlineEditorEl.getBoundingClientRect();
  if (!editor.selection || (editor.selection && ReactEditor.hasRange(editor, editor.selection) && Range.isCollapsed(editor.selection))) {
    const leafEl = domRange.startContainer.parentElement!;
    leafEl.getBoundingClientRect = domRange.getBoundingClientRect.bind(domRange);
    const leafRect = leafEl.getBoundingClientRect();
    if (leafRect.bottom > editorRect.bottom) {
      inlineEditorEl.scrollTop = inlineEditorEl.scrollTop + leafRect.bottom - editorRect.bottom + leafRect.height * 2;
    } else if (leafRect.top < editorRect.top) {
      inlineEditorEl.scrollTop = inlineEditorEl.scrollTop - editorRect.top + leafRect.top - leafRect.height * 2;
    }
    if (!isElementInViewport(inlineEditorEl)) {
      const editorContainerWrapEl = document.getElementById(`editor-content-wrap-${mainEditor?.docId}`);
      if (!editorContainerWrapEl) return;
      editorContainerWrapEl.scrollTop = editorContainerWrapEl.scrollHeight - editorContainerWrapEl.clientHeight;
    }
    delete leafEl.getBoundingClientRect;
  }
};

function isElementInViewport(el) {
  if (typeof jQuery === 'function' && el instanceof jQuery) {
    el = el[0];
  }

  let rect = el.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
