import { WarningOutlined } from '@ant-design/icons';
import React from 'react';
import { IconBtn } from '../../Components';
import { ELTYPE } from '../../config';

import './index.less';
import { alignToggle } from '../../HoveringToolbar';
import { Editor, Node, Range, Transforms } from '@src/components/slate-packages/slate';
import { insertCodeBlock } from '../../CodeBlock';
import storage from '@src/utils/storage';
import { insertOl } from '../../OLULList/OlList';
import { toggleBlock } from '../../block';
import { insertDivide } from '../../Divide';
import { newTable } from '../../table/newTable';
import { getCache } from '@src/utils/cacheUtils';
import { createUUID } from '@src/utils/randomId';
import { f } from '@src/resource/string';
import { getEditorEventEmitter } from '../../table/selection';
import { getSlateSlection } from '@src/utils/getSelection';
import { ReactEditor } from '@src/components/slate-packages/slate-react';

function ListIconItem(props: any) {
  const { onMouseDown, icon, text } = props;
  const Icon = icon;
  const iconStyle: object = {
    fontSize: '14px',
    color: 'rgba(0,0,0,.5)',
    marginRight: '8px',
    display: 'inline-block',
  };
  console.log('icon', icon);
  return (
    <div
      className="group"
      onMouseDown={() => {
        onMouseDown && onMouseDown();
      }}
    >
      <div className="icon-list-wrapper">
        {typeof icon === 'string' ? <IconBtn className={`tripdocs-sdk-iconfont ${icon}`} /> : <Icon style={iconStyle} />}
      </div>
      {text.length === 4 ? <span className="title">{text}</span> : <span className="badge">{text}</span>}
    </div>
  );
}

function execInsertComponent(props: any) {
  console.log('execInsertComponent', props);
  const { format, editor, selection, setShowCard } = props;

  const path = selection?.anchor?.path;
  if (!path) {
    setShowCard(false);
    return;
  }

  const { type } = Node.get(editor, path) as any;
  if (format.startsWith('align')) {
    const fo = format.split('-')[1];
    alignToggle(editor, fo, selection);
    setShowCard(false);
    return;
  } else if (format === ELTYPE.CODE_BLOCK) {
    console.log('format', format);
    setShowCard(false);
    insertCodeBlock(editor, Range.start(selection).path);
    return;
  } else if (type !== format && [ELTYPE.OLLIST, ELTYPE.ULLIST].includes(format)) {
    let id = format + '=' + createUUID();
    console.log('execInsertComponent list cur:', type, ',targetType:', format);
    const employee = storage.get('userInfo')?.employee;
    insertOl(
      editor,
      {
        type: format,
        tabLevel: 0,
        num: 1,
        id: id,
        authCls: 'auth-' + employee,
        elId: createUUID(),
      },
      { at: selection }
    );
    setShowCard(false);
    return;
  }
  if (selection && ReactEditor.hasRange(editor, selection) && selection[0] !== 0) {
    toggleBlock(editor, format, selection);
    getEditorEventEmitter(editor.docId).emit('updateOutlineAnchor', editor.docId);
  } else {
    if (selection) {
      toggleBlock(editor, format, selection);
      getEditorEventEmitter(editor.docId).emit('updateOutlineAnchor', editor.docId);
    }
  }

  setShowCard(false);
}
export const isInTable = editor => {
  let ret = null;
  const sel = getSlateSlection(editor.docId);
  if (sel) {
    ret = Editor.above(editor, {
      match: (n: any) => n.type === ELTYPE.TABLE,
      at: sel,
    });
  }
  console.log('isInTable', editor, sel, ret);

  return ret;
};
export default function (props: any) {
  const { setShowCard, editor, docWidth, docId } = props;
  const selection = getCache(docId, 'selection');

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
              <span className="action-bg">在下方添加</span>
            </div>
          </div>

          <div className="body">
            <div className="horizontal-line"></div>
            <span className="tag">样式</span>
            <div className="wrapper-inner-i0">
              <ListIconItem
                icon="Tripdocs-head1"
                onMouseDown={() => {
                  execInsertComponent({
                    format: ELTYPE.HEADING_ONE,
                    editor,
                    selection,
                    setShowCard,
                  });
                }}
                text=""
              />
              <ListIconItem
                icon="Tripdocs-head2"
                onMouseDown={() => {
                  execInsertComponent({
                    format: ELTYPE.HEADING_TWO,
                    editor,
                    selection,
                    setShowCard,
                  });
                }}
                text=""
              />
              <ListIconItem
                icon="Tripdocs-head3"
                onMouseDown={() => {
                  execInsertComponent({
                    format: ELTYPE.HEADING_THREE,
                    editor,
                    selection,
                    setShowCard,
                  });
                }}
                text=""
              />
              <ListIconItem
                icon="Tripdocs-head4"
                onMouseDown={() => {
                  execInsertComponent({
                    format: ELTYPE.HEADING_FOUR,
                    editor,
                    selection,
                    setShowCard,
                  });
                }}
                text=""
              />
              <ListIconItem
                icon="Tripdocs-head5"
                onMouseDown={() => {
                  execInsertComponent({
                    format: ELTYPE.HEADING_FIVE,
                    editor,
                    selection,
                    setShowCard,
                  });
                }}
                text=""
              />

              <ListIconItem
                icon="Tripdocs-head6"
                onMouseDown={() => {
                  execInsertComponent({
                    format: ELTYPE.HEADING_SIX,
                    editor,
                    selection,
                    setShowCard,
                  });
                }}
                text=""
              />
              <div>&emsp;</div>
            </div>

            <div style={{ display: 'flex', marginLeft: '4vw' }}>
              <ListIconItem
                icon="Tripdocs-format_clear"
                onMouseDown={() => {
                  execInsertComponent({
                    format: ELTYPE.PARAGRAPH,
                    editor,
                    selection,
                    setShowCard,
                  });
                }}
                text={f('normal')}
              />
              <ListIconItem
                icon="Tripdocs-ordered"
                onMouseDown={() => {
                  execInsertComponent({
                    format: ELTYPE.OLLIST,
                    editor,
                    selection,
                    setShowCard,
                  });
                }}
                text={f('numberedList')}
              />
              <ListIconItem
                icon="Tripdocs-unordered"
                onMouseDown={() => {
                  execInsertComponent({
                    format: ELTYPE.ULLIST,
                    editor,
                    selection,
                    setShowCard,
                  });
                }}
                text={f('bulletedList')}
              />
              <ListIconItem
                icon="Tripdocs-checkbox_selected"
                onMouseDown={() => {
                  execInsertComponent({
                    format: ELTYPE.TODO_LIST,
                    editor,
                    selection,
                    setShowCard,
                  });
                }}
                text={f('toDoList')}
              />
              <ListIconItem
                icon="Tripdocs-code_braces"
                onMouseDown={() => {
                  execInsertComponent({
                    format: ELTYPE.CODE_BLOCK,
                    editor,
                    selection,
                    setShowCard,
                  });
                }}
                text={f('codeBlock')}
              />
              <ListIconItem
                icon="Tripdocs-quote"
                onMouseDown={() => {
                  execInsertComponent({
                    format: ELTYPE.BLOCK_QUOTE,
                    editor,
                    selection,
                    setShowCard,
                  });
                }}
                text={f('quote')}
              />
            </div>
            <span className="tag">{f('common')}</span>
            <div className="wrapper-inner-1">
              {!isInTable(editor) && (
                <ListIconItem
                  icon="Tripdocs-table"
                  onMouseDown={() => {
                    newTable(editor, 2, 2, docWidth - 15, selection.anchor.path.slice(0, 1));
                    setShowCard(false);
                  }}
                  text={f('table')}
                />
              )}

              <ListIconItem
                icon="Tripdocs-split_line"
                onMouseDown={() => {
                  insertDivide(editor);
                  setShowCard(false);
                }}
                text={f('divider')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
