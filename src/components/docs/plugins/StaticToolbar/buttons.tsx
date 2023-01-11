import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  CheckOutlined,
  LineHeightOutlined,
  MoreOutlined,
  PlusSquareTwoTone,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignTopOutlined,
} from '@ant-design/icons';
import storage from '@utils/storage';
import { Dropdown, message, Modal, Popconfirm, Select, Tooltip } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Editor, Node, Range, Transforms } from '@src/components/slate-packages/slate';
import { isBlockActive, toggleBlock } from '../block';
import { COLOR_ACTIVE, COLOR_DEFAULT, COLOR_DISABLED, IconBtn, IconButton } from '../Components';
import { ELTYPE, HEADING_TYPES, TABBABLE_TYPES } from '../config';
import { alignToggle, isAlignActive, isVerticalAlignActive, setVerticalAlign } from '../HoveringToolbar';
import { decreaseIndent, increaseIndent } from '../indent';
import { insertOl } from '../OLULList/OlList';
import { min } from '../siderMenu';
import staticToolbarCardMenu from '../../../DropdownMenu/staticToolbarCardMenu';
import staticToolbarMoreMenu from '../../../DropdownMenu/staticToolbarMoreMenu';
import { opsTable, TableOps } from '../table/tableOperation';
import { css, cx } from '@emotion/css';
import { isLineHeightActive } from '../HoveringToolbar/lineheight';
import { getCache, recoverCacheDocContent } from '@src/utils/cacheUtils';
import { toSharedType, YjsEditor } from '@src/components/slate-packages/slate-yjs';
import { IS_RECOVERING_CONTENT } from '../ErrorHandle/weak-maps';
import sessStorage from '@src/utils/sessStorage';
import { SEL_CELLS } from '@src/utils/weak-maps';
import { getEditorEventEmitter } from '../table/selection';
import { createUUID } from '@src/utils/randomId';
import { f } from '@src/resource/string';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { fontLetterByNum, fontSizeByNum } from '../HoveringToolbar/fontSize';

export const FileButton: React.FC<any> = (props: any) => {
  const { title, icon, callback, style } = props;
  const [tooltipVisible, setTooltipVisible] = useState(false);
  return (
    <Tooltip
      title={title}
      placement="bottom"
      visible={tooltipVisible}
      onVisibleChange={visible => {
        setTooltipVisible(visible);
      }}
    >
      <div
        className="static-toolbar-btn"
        onMouseDown={e => {
          e.preventDefault();
          callback();
          window.event.returnValue = false;
          setTooltipVisible(false);
        }}
        style={style}
      >
        {icon}
      </div>
    </Tooltip>
  );
};

interface ToolbarButtonProps {
  title: string;
  button: React.ReactElement;
  onMouseDown: (e?: React.MouseEvent) => void;
  isDisabled?: boolean;
  buttonClass?: string;
}

export const ToolbarButton: React.FC<any> = (props: ToolbarButtonProps) => {
  const { title, button, onMouseDown: mouseDownFn, isDisabled = false, buttonClass } = props;
  const [tooltipVisible, setTooltipVisible] = useState(false);
  return (
    <Tooltip
      title={title}
      placement="bottom"
      visible={tooltipVisible}
      onVisibleChange={visible => {
        setTooltipVisible(visible);
      }}
    >
      <div
        className={cx('static-toolbar-btn', buttonClass)}
        onMouseDown={e => {
          e.preventDefault();
          setTooltipVisible(false);
          mouseDownFn && mouseDownFn(e);
        }}
        onMouseDownCapture={e => {
          if (isDisabled) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
        }}
        style={{
          cursor: isDisabled ? 'not-allowed' : null,
          opacity: isDisabled ? '0.4' : null,
        }}
      >
        {button}
      </div>
    </Tooltip>
  );
};

export const ToolbarArrowButton: React.FC<any> = (props: ToolbarButtonProps) => {
  const { button, isDisabled = false, buttonClass } = props;
  return (
    <div
      className={cx('static-toolbar-arrow-btn', buttonClass)}
      onMouseDownCapture={e => {
        if (isDisabled) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }}
      style={{
        cursor: isDisabled ? 'not-allowed' : null,
        opacity: isDisabled ? '0.4' : null,
      }}
    >
      {button}
    </div>
  );
};

export const VerticalAlignButton: React.FC<any> = ({ valign, icon, editor, ...props }) => {
  const selection = editor && editor.selection;
  const active = editor && isVerticalAlignActive(editor, valign, selection);
  return (
    <IconButton
      {...props}
      active={active}
      onMouseDown={(event: any) => {
        event.preventDefault();
        setVerticalAlign(editor, valign, selection);
      }}
    >
      {icon}
    </IconButton>
  );
};

export const handleTableOps = (editor: ReactEditor, ops: TableOps) => {
  const selection = editor && editor.selection;
  if (
    selection &&
    ReactEditor.hasRange(editor, selection) &&
    ((selection.anchor && min(selection.anchor.path[0], selection.focus.path[0]) !== 0) || (!selection.anchor && selection[0] !== 0))
  ) {
    opsTable(editor, ops, selection);
  } else {
    if (selection && ReactEditor.hasRange(editor, selection) && selection.anchor && Range.start(selection).path[0] === Range.end(selection).path[0]) {
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
};

export const TableOpsButton: React.FC<any> = (props: any) => {
  const { ops, icon, editor, ...attributes } = props;
  return (
    <IconButton
      {...attributes}
      key={ops}
      style={{
        color: ['deleteTable', 'deleteRow', 'deleteCol'].includes(ops) ? 'rgb(245, 74, 69)' : null,
      }}
      onMouseDown={(event: any) => {
        event.preventDefault();
        handleTableOps(editor, ops);
      }}
    >
      <IconBtn className={`tripdocs-sdk-iconfont icon-${icon}`} style={{ fontSize: 16 }}></IconBtn>
    </IconButton>
  );
};

export const StaticToolbarMoreMenuButton: React.FC<any> = ({
  editor,
  editorSelection,
  docWidth,
  modalState,
  setValue,
  isShowAnchor,
  setIsShowAnchor,
  isDisabled,
  hasSelCells,
  ...props
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [cardMenuVisible, setCardMenuVisible] = useState(false);
  const selection = editor && editor.selection;
  const node = selection && ReactEditor.hasRange(editor, selection) && Node.get(editor, selection.focus.path.slice(0, -1));
  return (
    <Tooltip
      title={f('moreFeatures')}
      placement="bottom"
      visible={tooltipVisible}
      onVisibleChange={visible => {
        !cardMenuVisible && setTooltipVisible(visible);
      }}
    >
      <div
        onMouseDown={(e: any) => {
          e.preventDefault();
        }}
      ></div>
      <Dropdown
        placement="bottomRight"
        mouseEnterDelay={0}
        overlay={staticToolbarMoreMenu({
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
        })}
        trigger={['click']}
        overlayClassName={cx(
          'editor-header-cardmenu',
          css`
            & .static-toolbar-btn {
              width: 22px;
              height: 22px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              margin: 3px 6px;
              &:hover {
                background-color: ${COLOR_DEFAULT.HOVER_BG_COLOR};
                border-radius: 4px;
              }
              button,
              .pmenu-block-icon {
                cursor: pointer;
                display: flex;
                align-items: center;
                width: 100%;
                height: 100%;
                justify-content: center;
                border-radius: 4px;
              }
            }
          `
        )}
        visible={cardMenuVisible}
        onVisibleChange={flag => setCardMenuVisible(flag)}
      >
        <div
          className={cx('static-toolbar-btn', 'more-btn')}
          onMouseDown={e => {
            e.preventDefault();
            setTooltipVisible(false);
          }}
          onClick={e => {
            e.preventDefault();
          }}
        >
          <MoreOutlined
            onMouseDown={(e: any) => {
              e.preventDefault();
            }}
          />
        </div>
      </Dropdown>
    </Tooltip>
  );
};

export const CardMenuButton: React.FC<any> = ({ editor, editorSelection, docWidth, modalState, isDisabled, ...props }) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [cardMenuVisible, setCardMenuVisible] = useState(false);

  return (
    <Tooltip
      title={f('insert')}
      placement="bottom"
      visible={tooltipVisible}
      onVisibleChange={visible => {
        !cardMenuVisible && setTooltipVisible(visible);
      }}
    >
      <Dropdown
        mouseEnterDelay={0}
        overlay={staticToolbarCardMenu({
          editor,
          editorSelection,
          setCardMenuVisible,
          cardMenuVisible,
          docWidth,
          modalState,
        })}
        trigger={['click']}
        disabled={isDisabled}
        overlayClassName="editor-header-cardmenu"
        visible={cardMenuVisible}
        onVisibleChange={flag => setCardMenuVisible(flag)}
      >
        <div
          className="static-toolbar-btn"
          onMouseDown={e => {
            e.preventDefault();
            setTooltipVisible(false);
          }}
          onMouseDownCapture={e => {
            if (isDisabled) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
          }}
          onClick={e => {
            e.preventDefault();
          }}
          style={{
            width: '64px',
            borderRadius: '4px',
            cursor: isDisabled ? 'not-allowed' : null,
            opacity: isDisabled ? '0.4' : null,
          }}
        >
          <IconBtn
            className="Tripdocs-plus_squra"
            onMouseDown={(e: any) => {
              e.preventDefault();
            }}
          />
          <div
            className={cx(css`
              display: flex;
              justify-content: center;
              align-items: center;
              flex: 0 0 38px;
              margin-left: 2px;
            `)}
          >
            {f('insert')}
          </div>
        </div>
      </Dropdown>
    </Tooltip>
  );
};

export const FontLetterSelectButton: React.FC<any> = ({ editor, anchorTrigger, ...props }) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [selectVisible, setSelectVisible] = useState(false);
  const selection = editor && editor.selection;
  const node: any =
    selection && ReactEditor.hasRange(editor, selection) && ReactEditor.hasRange(editor, selection) && Node.get(editor, Range.start(selection).path);
  const { Option } = Select;
  const letter = [0, 1, 2, 3, 4, 5, 6];

  let curFontLetter: any = (node && node.fontLetter) || 0;

  return useMemo(
    () => (
      <Tooltip
        title={f('fontLetter')}
        placement="bottom"
        visible={tooltipVisible}
        onVisibleChange={visible => {
          !selectVisible && setTooltipVisible(visible);
        }}
      >
        <Select
          className={cx(
            'static-toolbar-select',
            css`
              & .ant-select-selection-item {
                width: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
              }
              &.ant-select-open {
                margin: 3px;
                border-radius: 4px;
                background-color: ${COLOR_ACTIVE.BG_COLOR};
                .ant-select-selection-item {
                  color: ${COLOR_ACTIVE.COLOR};
                }
              }
            `
          )}
          bordered={false}
          value={(curFontLetter || 0) + ''}
          dropdownStyle={{ minWidth: '75px' }}
          onDropdownVisibleChange={visible => {
            setSelectVisible(visible);
          }}
          onMouseDown={e => {
            e.preventDefault();
            setTooltipVisible(false);
          }}
          onClick={e => {
            e.preventDefault();
          }}
          onSelect={value => {
            fontLetterByNum(editor, value);
          }}
        >
          {letter.map((item, index) => (
            <Option
              value={item}
              key={index}
              style={{
                paddingLeft: item === curFontLetter ? null : '14px',
                minHeight: index !== 0 ? 42 - index * 2 : null,
                fontSize: 16,
                color: COLOR_DEFAULT.COLOR,
                display: 'flex',
                alignItems: 'center',
              }}
              className={css`
                &.ant-select-item-option-active {
                  background-color: ${COLOR_ACTIVE.BG_COLOR};
                }
              `}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  lineHeight: 1,
                }}
              >
                <CheckOutlined
                  style={{
                    marginRight: '5px',
                    fontSize: '14px',
                    color: COLOR_ACTIVE.COLOR,
                    visibility: letter[index] === curFontLetter && !tooltipVisible ? 'visible' : 'hidden',
                  }}
                />{' '}
                {letter[index]}
              </div>
            </Option>
          ))}
        </Select>
      </Tooltip>
    ),
    [curFontLetter, tooltipVisible]
  );
};

export const SizeSelectButton: React.FC<any> = ({ editor, anchorTrigger, ...props }) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [selectVisible, setSelectVisible] = useState(false);
  const selection = editor && editor.selection;
  const node: any =
    selection && ReactEditor.hasRange(editor, selection) && ReactEditor.hasRange(editor, selection) && Node.get(editor, Range.start(selection).path);
  const { Option } = Select;
  const sizeArr = [12, 14, 16, 18, 20, 24, 28, 30, 32, 36, 40, 48, 56, 64, 72, 96, 120, 144];

  let curSize: any = (node && node.fontSizeChange && node.fontSizeChange + 14) || 14;

  return useMemo(
    () => (
      <Tooltip
        title={f('fontSize')}
        placement="bottom"
        visible={tooltipVisible}
        onVisibleChange={visible => {
          !selectVisible && setTooltipVisible(visible);
        }}
      >
        <Select
          className={cx(
            'static-toolbar-select',
            css`
              & .ant-select-selection-item {
                width: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
              }
              &.ant-select-open {
                margin: 3px;
                border-radius: 4px;
                background-color: ${COLOR_ACTIVE.BG_COLOR};
                .ant-select-selection-item {
                  color: ${COLOR_ACTIVE.COLOR};
                }
              }
            `
          )}
          bordered={false}
          value={(curSize || 14) + ''}
          dropdownStyle={{ minWidth: '75px' }}
          onDropdownVisibleChange={visible => {
            setSelectVisible(visible);
          }}
          onMouseDown={e => {
            e.preventDefault();
            setTooltipVisible(false);
          }}
          onClick={e => {
            e.preventDefault();
          }}
          onSelect={value => {
            fontSizeByNum(editor, value);
          }}
        >
          {sizeArr.map((item, index) => (
            <Option
              value={item}
              key={index}
              style={{
                paddingLeft: item === curSize ? null : '14px',
                minHeight: index !== 0 ? 42 - index * 2 : null,
                fontSize: 16,
                color: COLOR_DEFAULT.COLOR,
                display: 'flex',
                alignItems: 'center',
              }}
              className={css`
                &.ant-select-item-option-active {
                  background-color: ${COLOR_ACTIVE.BG_COLOR};
                }
              `}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  lineHeight: 1,
                }}
              >
                <CheckOutlined
                  style={{
                    marginRight: '5px',
                    fontSize: '14px',
                    color: COLOR_ACTIVE.COLOR,
                    visibility: sizeArr[index] === curSize && !tooltipVisible ? 'visible' : 'hidden',
                  }}
                />{' '}
                {sizeArr[index]}
              </div>
            </Option>
          ))}
        </Select>
      </Tooltip>
    ),
    [curSize, tooltipVisible]
  );
};

export const TypeSelectButton: React.FC<any> = ({ editor, anchorTrigger, ...props }) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [selectVisible, setSelectVisible] = useState(false);
  const selection = editor && editor.selection;
  const node: any =
    selection &&
    ReactEditor.hasRange(editor, selection) &&
    ReactEditor.hasRange(editor, selection) &&
    Node.get(editor, Range.start(selection).path.slice(0, -1));
  const { Option } = Select;
  const typeArr = [
    ELTYPE.PARAGRAPH,
    ELTYPE.HEADING_ONE,
    ELTYPE.HEADING_TWO,
    ELTYPE.HEADING_THREE,
    ELTYPE.HEADING_FOUR,
    ELTYPE.HEADING_FIVE,
    ELTYPE.HEADING_SIX,
  ];
  const mapping = {
    [ELTYPE.PARAGRAPH]: f('normal'),
    [ELTYPE.HEADING_ONE]: f('heading1'),
    [ELTYPE.HEADING_TWO]: f('heading2'),
    [ELTYPE.HEADING_THREE]: f('heading3'),
    [ELTYPE.HEADING_FOUR]: f('heading4'),
    [ELTYPE.HEADING_FIVE]: f('heading5'),
    [ELTYPE.HEADING_SIX]: f('heading6'),
  };

  let curType: any = node && (node.type as string) ? (node.type as string) : ELTYPE.PARAGRAPH;
  if (node && node.oldType && (node.type == ELTYPE.ULLIST || node.type == ELTYPE.OLLIST || node.type == ELTYPE.TODO_LIST)) {
    curType = node.oldType;
  }
  const mappedValue = mapping[curType] ?? mapping[ELTYPE.PARAGRAPH];

  return useMemo(
    () => (
      <Tooltip
        title={f('format')}
        placement="bottom"
        visible={tooltipVisible}
        onVisibleChange={visible => {
          !selectVisible && setTooltipVisible(visible);
        }}
      >
        <Select
          className={cx(
            'static-toolbar-select',
            css`
              & .ant-select-selection-item {
                width: 78px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
              }
              &.ant-select-open {
                margin: 3px;
                border-radius: 4px;
                background-color: ${COLOR_ACTIVE.BG_COLOR};
                .ant-select-selection-item {
                  color: ${COLOR_ACTIVE.COLOR};
                }
              }
            `
          )}
          bordered={false}
          value={mapping[curType] ?? mapping[ELTYPE.PARAGRAPH]}
          dropdownStyle={{ minWidth: '180px' }}
          onDropdownVisibleChange={visible => {
            setSelectVisible(visible);
          }}
          onMouseDown={e => {
            e.preventDefault();
            setTooltipVisible(false);
          }}
          onClick={e => {
            e.preventDefault();
          }}
          onSelect={value => {
            const listNodes =
              editor &&
              Editor.nodes(editor, {
                match: (n: any) => {
                  return n.type == ELTYPE.OLLIST || n.type == ELTYPE.ULLIST || n.type == ELTYPE.TODO_LIST;
                },
              });
            let no = 0;
            for (const [node1, path1] of listNodes) {
              no++;

              Transforms.setNodes(editor, { oldType: value } as Partial<Node>, { at: selection });
            }
            if (!no) {
              node && Transforms.setNodes(editor, { type: value } as Partial<Node>, { at: selection });
            }

            setTimeout(() => getEditorEventEmitter(editor.docId).emit('updateOutlineAnchor', editor.docId), 100);
          }}
        >
          {typeArr.map((item, index) => (
            <Option
              value={item}
              key={index}
              style={{
                paddingLeft: item === curType ? null : '14px',
                minHeight: index !== 0 ? 42 - index * 2 : null,
                fontSize: index !== 0 ? (index === 1 ? 26 : index === 6 ? 16 : 26 - index * 2) : null,
                color: index !== 0 ? COLOR_DEFAULT.COLOR : null,
                fontWeight: index !== 0 ? 600 : null,
                display: 'flex',
                alignItems: 'center',
              }}
              className={css`
                &.ant-select-item-option-active {
                  background-color: ${COLOR_ACTIVE.BG_COLOR};
                }
              `}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  lineHeight: 1,
                  color: mappedValue === mapping[item] ? COLOR_ACTIVE.COLOR : null,
                }}
              >
                <CheckOutlined
                  style={{
                    marginRight: '12px',
                    fontSize: '14px',
                    color: COLOR_ACTIVE.COLOR,
                    visibility: mappedValue === mapping[item] ? 'visible' : 'hidden',
                  }}
                />{' '}
                {mapping[item]}
              </div>
            </Option>
          ))}
        </Select>
      </Tooltip>
    ),
    [curType, tooltipVisible]
  );
};

export const AlignSelectButton: React.FC<any> = ({ editor, isVertical, ...props }) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [selectVisible, setSelectVisible] = useState(false);
  const selection = editor && editor.selection;
  const node: any = selection && ReactEditor.hasRange(editor, selection) && Node.get(editor, selection.focus.path.slice(0, -1));
  const { Option } = Select;
  const alignArr = ['align-left', 'align-center', 'align-right'];
  const vAlignArr: any = ['top', 'middle', 'bottom'];
  const mapping: any = {
    'align-left': [f('alignLeft'), <IconBtn className="Tripdocs-align_left" />],
    'align-center': [f('alignCenter'), <IconBtn className="Tripdocs-align_center" />],
    'align-right': [f('alignRight'), <IconBtn className="Tripdocs-align-right" />],
    top: [f('alignTop'), <IconBtn className="Tripdocs-back_to_top" />],
    middle: [f('alignMiddle'), <IconBtn className="Tripdocs-align_middle" />],
    bottom: [f('alignBottom'), <IconBtn className="Tripdocs-align_bottom" />],
  };
  let curAlign: any;
  const defaultAlign = {
    vertical: vAlignArr.filter(
      (valign: any) => editor && editor.selection && ReactEditor.hasRange(editor, selection) && isVerticalAlignActive(editor, valign, selection)
    )[0],
    horizontal:
      alignArr.filter(align => editor && editor.selection && ReactEditor.hasRange(editor, selection) && isAlignActive(editor, align, selection))[0] ||
      (node && node.type === ELTYPE.IMAGE ? 'align-center' : 'align-left'),
  };
  curAlign = selection && ReactEditor.hasRange(editor, selection) && (isVertical ? defaultAlign.vertical : defaultAlign.horizontal);
  return (
    <Tooltip
      title={isVertical ? f('alignmentVertical') : f('alignmentHorizontal')}
      placement="bottom"
      visible={tooltipVisible}
      onVisibleChange={visible => {
        !selectVisible && setTooltipVisible(visible);
      }}
    >
      <Select
        className={cx(
          'static-toolbar-select',
          css`
            &.ant-select-open {
              margin: 3px;
              border-radius: 4px;
              background-color: ${COLOR_ACTIVE.BG_COLOR};
              .ant-select-selection-item {
                color: ${COLOR_ACTIVE.COLOR};
              }
            }
          `
        )}
        bordered={false}
        value={
          isVertical
            ? (curAlign && mapping[curAlign][1]) ?? <IconBtn className="Tripdocs-back_to_top" />
            : (curAlign && mapping[curAlign][1]) ?? <IconBtn className="Tripdocs-align_left" />
        }
        dropdownStyle={{ minWidth: '150px' }}
        onDropdownVisibleChange={visible => {
          setSelectVisible(visible);
        }}
        onMouseDown={e => {
          e.preventDefault();
          setTooltipVisible(false);
        }}
        onClick={e => {
          e.preventDefault();
        }}
        onSelect={value => {
          editor && node && (isVertical ? setVerticalAlign(editor, value, selection) : alignToggle(editor, value.split('-')[1], selection));
        }}
      >
        {(isVertical ? vAlignArr : alignArr).map((item: any, index: number) => (
          <Option
            value={item}
            key={'index' + index}
            style={{
              paddingLeft: item === curAlign ? null : '14px',
            }}
            className={css`
              &.ant-select-item-option-active {
                background-color: ${COLOR_ACTIVE.BG_COLOR};
              }
            `}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                color: item === curAlign ? COLOR_ACTIVE.COLOR : null,
              }}
            >
              <CheckOutlined
                style={{
                  marginRight: '12px',
                  fontSize: '14px',
                  color: COLOR_ACTIVE.COLOR,
                  visibility: item === curAlign ? 'visible' : 'hidden',
                }}
              />
              <span style={{ marginRight: '10px' }}>{mapping[item][1]}</span>
              <span>{mapping[item][0]}</span>
            </div>
          </Option>
        ))}
      </Select>
    </Tooltip>
  );
};

export const BlockIconButton: React.FC<any> = (props: any) => {
  const { format, icon, svgIcon, editor, isDisabled, ...attributes } = props;
  const selection = editor && editor.selection;

  const active = editor && isBlockActive(editor, format, selection);

  let alignActive: any;
  if (format.startsWith('align')) {
    alignActive = editor && isAlignActive(editor, format, selection);
  }
  return (
    <div
      className="pmenu-block-icon"
      {...attributes}
      key={format}
      style={{
        backgroundColor: active || alignActive ? '#e8efff' : 'unset',
        cursor: isDisabled ? 'not-allowed' : null,
        opacity: isDisabled ? '0.4' : null,
        color: isDisabled ? COLOR_DISABLED.COLOR : null,
      }}
      onMouseDown={(event: any) => {
        event.preventDefault();
        if (editor.selection) {
          const rowNode: any =
            editor.selection.anchor.path.length < 3
              ? Node.get(editor, [editor.selection.anchor.path[0]])
              : Node.get(editor, editor.selection.anchor.path.slice(0, -1));
          if (format.startsWith('align')) {
            const fo = format.split('-')[1];
            alignToggle(editor, fo, selection);
            return;
          }

          if (rowNode.type !== format && [ELTYPE.OLLIST, ELTYPE.ULLIST].includes(format)) {
            let id = format + '=' + createUUID();

            const employee = storage.get('userInfo')?.employee;
            insertOl(
              editor,
              {
                type: format,
                tabLevel: 0,
                num: 1,
                id: id,
                oldType: rowNode.oldType || (HEADING_TYPES.includes(rowNode.type) ? rowNode.type : undefined),
                authCls: 'auth-' + employee,
                elId: createUUID(),
              },
              { at: editor.selection }
            );
            return;
          }
          if (selection && ReactEditor.hasRange(editor, selection) && selection[0] !== 0) {
            toggleBlock(editor, format, selection);
          } else {
            if (selection) {
              toggleBlock(editor, format, selection);
            }
          }
        }
      }}
    >
      <div style={{ color: active ? COLOR_ACTIVE.COLOR : COLOR_DEFAULT.COLOR, fontSize: 16 }}>
        {svgIcon ? svgIcon : <IconBtn className={icon}></IconBtn>}
      </div>
    </div>
  );
};

export const TabButton: React.FC<any> = (props: any) => {
  const { format, icon, editor, isDecrease, ...attributes } = props;

  const selection = editor && editor.selection;

  return (
    <IconButton
      {...props}
      onMouseDown={(event: any) => {
        event.preventDefault();
        const selCells = SEL_CELLS.get(editor);
        const hasSelCells = selCells && selCells.length > 0;
        const node = selection && ReactEditor.hasRange(editor, selection) && Node.get(editor, selection.focus.path.slice(0, -1));

        if (isDecrease) {
          if (hasSelCells) {
            selCells.forEach((entry: any) => {
              const [, path] = entry;
              const node: any = Node.get(editor, path);
              const { children } = node;
              children.forEach((child: any, index: number) => {
                if ([...TABBABLE_TYPES].includes(child.type)) {
                  decreaseIndent(editor, child, {
                    anchor: { path: [...path, index, 0], offset: 0 },
                    focus: { path: [...path, index, 0], offset: 0 },
                  });
                }
              });
            });
          } else {
            decreaseIndent(editor, node, selection);
          }
        } else {
          if (hasSelCells) {
            selCells.forEach((entry: any) => {
              const [, path] = entry;
              const node: any = Node.get(editor, path);
              const { children } = node;
              console.log('[increaseIndent]', children);
              children.forEach((child: any, index: number) => {
                if ([...TABBABLE_TYPES].includes(child.type)) {
                  increaseIndent(editor, child, {
                    anchor: { path: [...path, index, 0], offset: 0 },
                    focus: { path: [...path, index, 0], offset: 0 },
                  });
                }
              });
            });
          } else {
            console.log('increaseIndent((((', editor, node, selection);
            increaseIndent(editor, node, selection);
          }
        }
      }}
    >
      {icon}
    </IconButton>
  );
};

export const LineHeightSelectButton: React.FC<any> = ({ editor, ...props }) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [selectVisible, setSelectVisible] = useState(false);
  const selection = editor && editor.selection;
  const node = selection && ReactEditor.hasRange(editor, selection) && Node.get(editor, selection.focus.path.slice(0, -1));
  const { Option } = Select;

  const lineHeightArr: any = ['1.75', '1', '1.15', '1.5', '2', '2.5', '3'];

  let curLineHeight;

  curLineHeight =
    selection &&
    ReactEditor.hasRange(editor, selection) &&
    lineHeightArr.filter(
      (lineHeight: any) => editor && editor.selection && ReactEditor.hasRange(editor, selection) && isLineHeightActive(editor, lineHeight, selection)
    )[0];
  const en = 'en';
  return (
    <Tooltip
      title={f('lineHeight')}
      placement="bottom"
      visible={tooltipVisible}
      onVisibleChange={visible => {
        !selectVisible && setTooltipVisible(visible);
      }}
    >
      <Select
        className={cx(
          'static-toolbar-select',
          css`
            &.ant-select-open {
              margin: 3px;
              border-radius: 4px;
              background-color: ${COLOR_ACTIVE.BG_COLOR};
              .ant-select-selection-item {
                color: ${COLOR_ACTIVE.COLOR};
              }
            }
          `
        )}
        bordered={false}
        value={(<IconBtn className="Tripdocs-line_height" />) as any}
        dropdownStyle={{ minWidth: '140px' }}
        onDropdownVisibleChange={visible => {
          setSelectVisible(visible);
        }}
        onMouseDown={e => {
          e.preventDefault();
          setTooltipVisible(false);
        }}
        onClick={e => {
          e.preventDefault();
        }}
        onSelect={value => {
          Transforms.setNodes(editor, { lineHeight: value } as Partial<Node>, { at: selection });
        }}
      >
        {lineHeightArr.map((item: any, index: number) => (
          <Option
            value={item}
            key={'index' + index}
            style={{
              paddingLeft: item === curLineHeight ? null : '14px',
            }}
            className={css`
              &.ant-select-item-option-active {
                background-color: ${COLOR_ACTIVE.BG_COLOR};
              }
            `}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                color: item === curLineHeight ? COLOR_ACTIVE.COLOR : null,
              }}
            >
              <CheckOutlined
                style={{
                  marginRight: '12px',
                  fontSize: '14px',
                  color: COLOR_ACTIVE.COLOR,
                  visibility: item === curLineHeight ? 'visible' : 'hidden',
                }}
              />
              <span>{item === '1.75' ? f('default') : item}</span>
            </div>
          </Option>
        ))}
      </Select>
    </Tooltip>
  );
};

export const TocButton: React.FC<any> = (props: any) => {
  const { format, icon, editor, setIsShowAnchor, isShowAnchor, ...attributes } = props;

  const selection = editor && editor.selection;
  return (
    <IconButton
      {...props}
      active={isShowAnchor}
      onMouseDown={(event: any) => {
        event.preventDefault();
        setIsShowAnchor(prev => !prev);
      }}
    >
      {icon}
    </IconButton>
  );
};

export const CACHE_DOC_CONTENT: WeakMap<Editor, Node[]> = new WeakMap();

export const VersionButton: React.FC<any> = (props: any) => {
  const { format, icon, editor, setValue, ...attributes } = props;

  const selection = editor && editor.selection;
  const node = selection && ReactEditor.hasRange(editor, selection) && Node.get(editor, selection.focus.path.slice(0, -1));

  return (
    <IconButton
      {...props}
      onMouseDown={(event: any) => {
        event.preventDefault();
        showCacheDocContentModal(editor);
        const { docId } = editor;
      }}
    >
      {icon}
    </IconButton>
  );
};

const DocCacheItemContent = props => {
  const { docContentCacheArr, editor } = props;

  const [index, setIndex] = useState(0);

  const serialize = useCallback(nodes => {
    return nodes.map(n => Node.string(n)).join('\n');
  }, []);

  useEffect(() => {
    CACHE_DOC_CONTENT.set(editor, docContentCacheArr?.[index]?.docContent);
  }, [index]);

  return (
    <div>
      {docContentCacheArr.map(({ docContent, at }, i) => {
        return (
          <div
            className={cx(
              'doc-cache-item',
              css`
                & {
                  padding: 12px;
                  border: 1px solid ${index === i ? `#286fff` : `#f0f0f0`};
                  margin-top: 16px;

                  &:hover {
                    border: 1px solid #286fff;
                  }
                }
              `
            )}
            onMouseDown={e => {
              e.preventDefault();
              setIndex(i);
            }}
          >
            <div>
              <span style={{ fontWeight: 'bold' }}>保存时间</span>
              {'： '}
              <span>{at.replace(/:\d{3}$/, '')}</span>
            </div>
            <div>
              <span style={{ fontWeight: 'bold' }}>文档内容</span>
              {'： '}
              {}
              <span
                className={css`
                  font-size: 12px;
                  word-break: break-all;
                  display: -webkit-box;
                  -webkit-box-orient: vertical;
                  -webkit-line-clamp: 3;
                  overflow: hidden;
                `}
              >
                {serialize(docContent)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const showCacheDocContentModal = editor => {
  const { docId } = editor;
  const docContentCacheArr = sessStorage.get('tripdocs_sdk/docContentCacheArr_' + docId) || [];

  if (docContentCacheArr.length > 0) {
    const modal = Modal.info({
      title: '文档历史版本',
      content: <DocCacheItemContent docContentCacheArr={docContentCacheArr} editor={editor} />,
      maskClosable: true,
      closable: true,
      width: '70vw',
      onOk: () => {
        const cacheDocContent = CACHE_DOC_CONTENT.get(editor);

        IS_RECOVERING_CONTENT.set(editor, true);
        window.tripdocs.editorsMap[editor.docId].api.setContent(cacheDocContent);
        setTimeout(() => IS_RECOVERING_CONTENT.set(editor, false));
      },
    });
  } else {
    message.destroy();
    message.info('没有历史版本');
  }
};
