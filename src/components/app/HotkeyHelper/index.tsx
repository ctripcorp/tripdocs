import { EnterOutlined, FileAddOutlined, ReadOutlined, RedoOutlined, SaveOutlined, SearchOutlined, UndoOutlined } from '@ant-design/icons';
import { f } from '@src/resource/string';
import React from 'react';
import { IconBtn } from '../../docs/plugins/Components';
import './index.less';

export const HotkeyHelperContent = () => (
  <>
    <div className="hotkey-drawer-wrapper">
      {getHotkeyGroup(
        f('globalHotkey'),
        [
          { icon: <UndoOutlined />, cardInfo: f('undo'), hotkey: ['Ctrl', 'Z'] },
          { icon: <RedoOutlined />, cardInfo: f('redo'), hotkey: ['Ctrl', 'Y'] },
          { icon: <SaveOutlined />, cardInfo: f('save'), hotkey: ['Ctrl', 'S'] },
        ],
        false
      )}
      {getHotkeyGroup(
        f('textHotkey'),
        [
          { icon: <IconBtn className="Tripdocs-bold" />, cardInfo: f('bold'), hotkey: ['Ctrl', 'B'] },
          { icon: <IconBtn className="Tripdocs-italic" />, cardInfo: f('italic'), hotkey: ['Ctrl', 'I'] },
          { icon: <IconBtn className="Tripdocs-code_braces" />, cardInfo: f('code'), hotkey: ['Ctrl', 'E'] },
          { icon: <IconBtn className="Tripdocs-underline" />, cardInfo: f('underline'), hotkey: ['Ctrl', 'U'] },
          { icon: <IconBtn className="Tripdocs-strikethrough" />, cardInfo: f('strikethrough'), hotkey: ['Ctrl', 'Shift', 'X'] },
          { icon: <EnterOutlined />, cardInfo: f('softEnter'), hotkey: ['Shift', 'Enter'] },
        ],
        false
      )}
      {getHotkeyGroup(
        'Markdown',
        [
          { icon: <IconBtn className="Tripdocs-bold" />, cardInfo: f('bold'), hotkey: ['**' + f('text') + '**', f('space')] },
          { icon: <IconBtn className="Tripdocs-italic" />, cardInfo: f('italic'), hotkey: ['*' + f('text') + '*', f('space')] },
          { icon: <IconBtn className="Tripdocs-quote" />, cardInfo: f('quote'), hotkey: ['>', f('space')] },
          { icon: <IconBtn className="Tripdocs-code_braces" />, cardInfo: f('code'), hotkey: ['`' + f('code') + '`'] },
          { icon: <IconBtn className="Tripdocs-ordered" />, cardInfo: f('numberedList'), hotkey: ['1.', f('space')] },
          { icon: <IconBtn className="Tripdocs-unordered" />, cardInfo: f('bulletedList'), hotkey: ['*', f('space')] },
          { icon: <IconBtn className="Tripdocs-code_tags" />, cardInfo: f('codeBlock'), hotkey: ['```', f('space')] },

          { icon: <IconBtn className="Tripdocs-head1" />, cardInfo: f('heading1'), hotkey: ['#', f('space')] },
          { icon: <IconBtn className="Tripdocs-head2" />, cardInfo: f('heading'), hotkey: ['##', f('space')] },
          { icon: <IconBtn className="Tripdocs-head3" />, cardInfo: f('heading3'), hotkey: ['###', f('space')] },
          { icon: <IconBtn className="Tripdocs-head4" />, cardInfo: f('heading4'), hotkey: ['####', f('space')] },
          { icon: <IconBtn className="Tripdocs-head5" />, cardInfo: f('heading5'), hotkey: ['#####', f('space')] },
          { icon: <IconBtn className="Tripdocs-head6" />, cardInfo: f('heading6'), hotkey: ['######', f('space')] },
        ],
        true
      )}
    </div>
  </>
);

function toItemKey(...rest) {
  const args: any = [...rest];
  return args.map((item: any, index: number) =>
    index === args.length - 1 ? (
      <kbd key={index}>{item}</kbd>
    ) : (
      <React.Fragment key={index}>
        <kbd>{item}</kbd>
        <span>+</span>
      </React.Fragment>
    )
  );
}

function toSpaceItemKey(...rest) {
  const args: any = [...rest];
  return args.map((item: any, index: number) =>
    index === args.length - 1 ? (
      <kbd key={index}>{item}</kbd>
    ) : (
      <React.Fragment key={index}>
        <kbd>{item}</kbd>
        <span> </span>
      </React.Fragment>
    )
  );
}

function getHotkeyGroup(groupname: string, groupItemList: { icon: any; cardInfo: string; hotkey: string[] }[], withSpace: boolean) {
  return (
    <div className="hotkey-drawer-section">
      <div className="hotkey-groupname">{groupname}</div>
      {groupItemList.map((item: { icon: any; cardInfo: string; hotkey: string[] }, index: number) => (
        <div className="hotkey-groupitem" key={index}>
          <div className="hotkey-icon">{item.icon}</div>
          <div className="hotkey-cardinfo">{item.cardInfo}</div>
          <div className="hotkey-itemkey">{withSpace ? toSpaceItemKey(...item.hotkey) : toItemKey(...item.hotkey)}</div>
        </div>
      ))}
    </div>
  );
}
