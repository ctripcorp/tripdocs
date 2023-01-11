import { PlayCircleOutlined, VideoCameraOutlined, WarningOutlined } from '@ant-design/icons';
import { Badge, Menu } from 'antd';
import React, { useState } from 'react';
import { TripdocsSdkContext } from '../../Docs';
import { insertCodeBlock } from '../docs/plugins/CodeBlock';
import { IconBtn } from '../docs/plugins/Components';
import { insertDivide } from '../docs/plugins/Divide';
import { insertFile } from '../docs/plugins/File/filePlugins';
import { TableCellSelect } from '../docs/plugins/siderMenu';
import { Node, Path } from '@src/components/slate-packages/slate';
import { f } from '@src/resource/string';
import { css } from '@emotion/css';
import $ from 'jquery';

import { ExcalidrawSlateNode } from '../docs/plugins/Excalidraw';
import { getCache } from '@src/utils/cacheUtils';
export default (props: any) => {
  const { editor, editorSelection, setCardMenuVisible, cardMenuVisible, docWidth, modalState } = props;
  const { selection, elementPath, elementType } = editorSelection;

  const [tableHover, setTableHover] = useState(null);
  const { docId } = React.useContext(TripdocsSdkContext);

  const isTable = editor?.selection?.focus.path.length > 4;

  const isInElectron: boolean = getCache(docId, 'options')?.isInElectron;
  console.log('[isInElectron]', isInElectron);
  const iconStyle: object = {
    fontSize: '18px',
    color: 'rgba(0,0,0,.5)',
    marginRight: '8px',
    display: 'inline-block',
  };

  return (
    <Menu
      className={css`
        .ant-dropdown-menu-item-active,
        .ant-dropdown-menu-submenu-active {
          color: rgb(50, 100, 255);
          background-color: rgba(50, 100, 255, 0.1);
          .ant-dropdown-menu-item-icon,
          .ant-dropdown-menu-title-content {
            color: rgb(50, 100, 255) !important;
          }
          .ant-dropdown-menu-submenu-title {
            background-color: transparent;
          }
        }
      `}
      onContextMenu={e => {
        e.preventDefault();
      }}
      style={{ width: '224px' }}
      data-ignore-slate
    >
      {!isTable && (
        <Menu.Item
          key={'0'}
          icon={<IconBtn className={`Tripdocs-split_line`} style={iconStyle}></IconBtn>}
          onMouseDown={e => {
            e.preventDefault();
            insertDivide(editor);
            setCardMenuVisible(false);
          }}
        >
          {f('divider')}
        </Menu.Item>
      )}

      {!isTable && (
        <Menu.Item
          key={'1'}
          icon={<IconBtn className={`Tripdocs-code_tags`} style={iconStyle}></IconBtn>}
          onMouseDown={e => {
            e.preventDefault();
            insertCodeBlock(editor, editor.selection.focus.path);
            setCardMenuVisible(false);
          }}
        >
          {f('codeBlock')}
        </Menu.Item>
      )}

      {!isTable && (
        <Menu.SubMenu
          key="table-sub"
          title={f('table')}
          icon={<IconBtn className={`Tripdocs-table`} style={{ ...iconStyle, transform: 'translateY(3px)' }}></IconBtn>}
          onTitleClick={e => {
            e.domEvent.preventDefault();
          }}
        >
          <div key={'00'} style={{ padding: '8px 12px', display: cardMenuVisible ? null : 'none' }}>
            <div
              style={{
                display: 'flex',
                height: 30,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p>
                {f('tableSize')} {Math.floor(tableHover / 9 + 1)} × {(tableHover % 9) + 1}
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                width: 234,
                height: 234,
                flexFlow: 'wrap',
              }}
              onMouseOver={e => {
                e.preventDefault();
              }}
            >
              {TableCellSelect(setCardMenuVisible, setTableHover, tableHover, editor, docWidth, elementPath)}
            </div>
          </div>
        </Menu.SubMenu>
      )}
    </Menu>
  );
};
