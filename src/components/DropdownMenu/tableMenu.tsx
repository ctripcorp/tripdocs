import { css } from '@emotion/css';
import { Menu } from 'antd';
import React from 'react';
import { IconBtn } from '../docs/plugins/Components';
import { setVerticalAlign } from '../docs/plugins/HoveringToolbar';
import { min } from '../docs/plugins/siderMenu';
import { opsTable } from '../docs/plugins/table/tableOperation';
import { ReactEditor, useSlate } from '../slate-packages/slate-react';
import { Editor, Node, Range, Transforms } from '@src/components/slate-packages/slate';
import { f } from '@src/resource/string';

const tableMenu = (thisPath: any, setVisible) => (
  <>
    <Menu
      className={css`
        .ant-menu-item {
          line-height: 22px !important;
          height: 22px !important;
          margin-top: 6px !important;
          margin-bottom: 6px !important;
        }
      `}
      contentEditable={false}
      style={{ userSelect: 'none' }}
    >
      <TableOpsMenu ops="insertRowReverse" icon="Tripdocs-add_row_below" text={f('tableInsertUp')} path={thisPath} setVisible={setVisible} />
      <TableOpsMenu ops="insertRow" icon="Tripdocs-add_row_above" text={f('tableInsertDown')} path={thisPath} setVisible={setVisible} />
      <TableOpsMenu ops="insertColReverse" icon="Tripdocs-add_col_before" text={f('tableInsertLeft')} path={thisPath} setVisible={setVisible} />
      <TableOpsMenu ops="insertCol" icon="Tripdocs-add_col_after" text={f('tableInsertRight')} path={thisPath} setVisible={setVisible} />
      <Menu.Divider />
      <TableOpsMenu ops="deleteRow" icon="Tripdocs-delete_row" text={f('tableDeleteSelectedRow')} path={thisPath} setVisible={setVisible} />
      <TableOpsMenu ops="deleteCol" icon="Tripdocs-delete_col" text={f('tableDeleteSelectedColumn')} path={thisPath} setVisible={setVisible} />
      <Menu.Divider />
      <TableOpsMenu ops="deleteTable" icon="Tripdocs-delete_table" text={f('tableDelete')} path={thisPath} setVisible={setVisible} />
      <Menu.Divider />
      <TableOpsMenu ops="mergeCell" icon="Tripdocs-combine" text={f('tableMerge')} path={thisPath} setVisible={setVisible} />
      <TableOpsMenu ops="unmergeCell" icon="Tripdocs-split" text={f('tableUnmerge')} path={thisPath} setVisible={setVisible} />
      {}
    </Menu>
  </>
);

const TableOpsMenu: React.FC<any> = (props: any) => {
  const { ops, icon, text, format, path, valign, setVisible, ...attributes } = props;
  const editor = useSlate();
  let selection = path;
  if (
    editor.selection &&
    ReactEditor.hasRange(editor, selection) &&
    selection &&
    ReactEditor.hasRange(editor, selection) &&
    editor.selection.focus.path[0] === selection[0]
  ) {
    selection = editor.selection;
  }

  if (ops === 'setVerticalAlign') {
    return (
      <Menu.Item
        {...attributes}
        contentEditable={false}
        data-ignore-slate
        key={valign}
        onMouseDown={(event: any) => {
          setVerticalAlign(editor, valign, selection);
          setVisible(false);
        }}
      >
        {text}
      </Menu.Item>
    );
  }

  return (
    <Menu.Item
      {...attributes}
      contentEditable={false}
      data-ignore-slate
      key={ops}
      icon={<IconBtn className={icon} style={{ fontSize: 22, opacity: 0.8 }}></IconBtn>}
      style={{
        color: ops === 'deleteTable' ? 'rgb(245, 74, 69)' : null,
      }}
      onMouseDown={(event: any) => {
        if (
          selection &&
          ReactEditor.hasRange(editor, selection) &&
          ((selection.anchor && min(selection.anchor.path[0], selection.focus.path[0]) !== 0) || (!selection.anchor && selection[0] !== 0))
        ) {
          opsTable(editor, ops, selection);
        } else {
          if (
            selection &&
            ReactEditor.hasRange(editor, selection) &&
            selection.anchor &&
            Range.start(selection).path[0] === path[0] &&
            Range.end(selection).path[0] === path[0]
          ) {
            if (selection.anchor.path[0] < selection.focus.path[0]) {
              let sel = {
                anchor: {
                  path: [selection.anchor.path[0] + 1, selection.anchor.path[1]],
                  offset: 0,
                },
                focus: selection.focus,
              };
              opsTable(editor, ops, sel);
            } else {
              let sel = {
                anchor: selection.anchor,
                focus: { path: [selection.focus.path[0] + 1, selection.focus.path[1]], offset: 0 },
              };
              opsTable(editor, ops, sel);
            }
          } else if (selection && ReactEditor.hasRange(editor, selection) && !selection.anchor) {
            opsTable(editor, ops, selection);
          }
        }
        setVisible(false);
      }}
    >
      {text}
    </Menu.Item>
  );
};

export default tableMenu;
