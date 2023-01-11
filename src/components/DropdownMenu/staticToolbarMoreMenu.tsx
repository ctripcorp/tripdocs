import React from 'react';
import { f } from '@src/resource/string';
import { getCache } from '@src/utils/cacheUtils';
import { Menu } from 'antd';
import { IconBtn } from '../docs/plugins/Components';
import { ELTYPE } from '../docs/plugins/config';
import { insertEditLink } from '../docs/plugins/EditLink';
import { isSameLineSelection } from '../docs/plugins/pluginsUtils/selectionUtils';
import { BlockIconButton, TabButton, TocButton, ToolbarButton, VersionButton } from '../docs/plugins/StaticToolbar/buttons';
import { ReactEditor } from '../slate-packages/slate-react';

export default (props: any) => {
  const {
    editor,
    editorSelection,
    setCardMenuVisible,
    cardMenuVisible,
    docWidth,
    modalState,
    setValue,
    isShowAnchor,
    setIsShowAnchor,
    isDisabled,
    hasSelCells,
  } = props;
  const isInElectron: boolean = getCache(editor?.docId, 'options')?.isInElectron;

  return (
    <Menu
      onContextMenu={e => {
        e.preventDefault();
      }}
      style={{ width: '302px' }}
      data-ignore-slate
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <ToolbarButton
          title={f('numberedList')}
          isDisabled={isDisabled || hasSelCells}
          button={<BlockIconButton format={ELTYPE.OLLIST} icon="Tripdocs-ordered" editor={editor} />}
        />
        <ToolbarButton
          title={f('bulletedList')}
          isDisabled={isDisabled || hasSelCells}
          button={<BlockIconButton format={ELTYPE.ULLIST} icon="Tripdocs-unordered" editor={editor} />}
        />
        <ToolbarButton
          title={`${f('toDoList')}（Ctrl+Alt+T）`}
          isDisabled={isDisabled || hasSelCells}
          button={<BlockIconButton format={ELTYPE.TODO_LIST} icon="Tripdocs-checkbox_selected" editor={editor} />}
        />
        <ToolbarButton
          title={f('quote')}
          isDisabled={isDisabled || hasSelCells}
          button={<BlockIconButton format={ELTYPE.BLOCK_QUOTE} icon="Tripdocs-quote" editor={editor} />}
        />
        <ToolbarButton
          title={f('link')}
          button={<IconBtn className={`Tripdocs-add_link`}></IconBtn>}
          style={{
            cursor:
              editor && editor.selection && ReactEditor.hasRange(editor, editor.selection) && !isSameLineSelection(editor.selection)
                ? 'not-allowed'
                : null,
            opacity:
              editor && editor.selection && ReactEditor.hasRange(editor, editor.selection) && !isSameLineSelection(editor.selection) ? '0.4' : null,
          }}
          isDisabled={
            isDisabled ||
            (editor && editor.selection && ReactEditor.hasRange(editor, editor.selection) && !isSameLineSelection(editor.selection)) ||
            hasSelCells
          }
          onMouseDown={e => {
            if (editor && editor.selection && ReactEditor.hasRange(editor, editor.selection) && !isSameLineSelection(editor.selection)) {
              return;
            }

            insertEditLink(editor, '', editor.selection);
            return;
          }}
        />
        <ToolbarButton
          title={`${f('increaseIndentation')}（Tab)`}
          isDisabled={isDisabled}
          button={<TabButton icon={<IconBtn className="Tripdocs-outdent" />} editor={editor} />}
        />
        <ToolbarButton
          title={`${f('decreaseIndentation')}（Shift+Tab)`}
          isDisabled={isDisabled}
          button={<TabButton isDecrease icon={<IconBtn className="Tripdocs-lnent" />} editor={editor} />}
        />
        {}
        {!isInElectron && (
          <ToolbarButton
            title={`${f('historyVersion')}（Alt+H)`}
            button={<VersionButton icon={<IconBtn className="Tripdocs-history" />} editor={editor} setValue={setValue} />}
          />
        )}
        <ToolbarButton
          title={isShowAnchor ? f('hideOutline') : f('showOutline')}
          buttonClass={'toc-btn'}
          button={
            <TocButton icon={<IconBtn className="Tripdocs-menu" />} editor={editor} setIsShowAnchor={setIsShowAnchor} isShowAnchor={isShowAnchor} />
          }
        />
      </div>
    </Menu>
  );
};
