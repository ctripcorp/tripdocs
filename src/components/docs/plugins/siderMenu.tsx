import { PlusCircleOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Menu, Popover, Tooltip } from 'antd';

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Editor, Node, Path, Range, Transforms } from '@src/components/slate-packages/slate';
import { v4 as anchorId } from 'uuid';
import { TripdocsSdkContext } from '../../../Docs';
import '@src/style/iconfont/Tripdocs.css';
import '../../../style/less/siderMenu.less';
import { copyToClipboard } from '../../../utils/copyToClipboard';
import storage from '../../../utils/storage';
import { HistoryEditor } from '../../slate-packages/slate-history';
import { ReactEditor, useSlate } from '../../slate-packages/slate-react';
import { insertEditLink } from '../plugins/EditLink/index';
import { isBlockActive, toggleBlock } from './block';
import { insertCodeBlock } from './CodeBlock';
import { COLOR_ACTIVE, COLOR_DEFAULT, IconBtn, SiderMemuDelete, SiderMemuPlus } from './Components';
import { ELTYPE } from './config';
import { alignToggle, isAlignActive } from './HoveringToolbar';
import { insertOl } from './OLULList/OlList';
import { isSameLineSelection } from './pluginsUtils/selectionUtils';
import { newTable } from './table/newTable';
import { createUUID } from '@src/utils/randomId';

const { SubMenu } = Menu;

interface SiderMenuProps {
  editor: any;
  children: any;
  selectedRow: any;
  type: any;
  setIsModalVisible: Function;
  setModalTitle: Function;
  menuIndex: number;
  [key: string]: any;
}

interface DeleteSiderButtonProps {
  editor: any;
  children: any;
  selectedRow: any;
  type: any;
}

const lineHeightMapping: any = {
  H1: 1.8,
  H2: 1.6,
  H3: 1.4,
  H4: 1.3,
  H5: 1.2,
  H6: 1.1,
  H7: 1,
  H8: 1,
  H9: 1,
};
const tooltipInnerBlock = (title: string, content: string) => {
  return (
    <div className="tooltip-inner-block">
      <span>{title}</span>
      <span>{content}</span>
    </div>
  );
};
export const iconMenus = [
  {
    format: ELTYPE.HEADING_ONE,
    icon: 'head1',
    text: tooltipInnerBlock('一级标题', 'Markdown：# 空格'),
  },
  {
    format: ELTYPE.HEADING_TWO,
    icon: 'head2',
    text: tooltipInnerBlock('二级标题', 'Markdown：## 空格'),
  },
  {
    format: ELTYPE.HEADING_THREE,
    icon: 'head3',
    text: tooltipInnerBlock('三级标题', 'Markdown：### 空格'),
  },
  {
    format: ELTYPE.HEADING_FOUR,
    icon: 'head4',
    text: tooltipInnerBlock('四级标题', 'Markdown：#### 空格'),
  },
  {
    format: ELTYPE.HEADING_FIVE,
    icon: 'head5',
    text: tooltipInnerBlock('五级标题', 'Markdown：##### 空格'),
  },
  {
    format: ELTYPE.HEADING_SIX,
    icon: 'head6',
    text: tooltipInnerBlock('六级标题', 'Markdown：###### 空格'),
  },
  { format: ELTYPE.BLOCK_QUOTE, icon: 'quote', text: tooltipInnerBlock('引用', 'Markdown：> 空格') },
  {
    format: ELTYPE.CODE_BLOCK,
    icon: 'code_braces',
    text: tooltipInnerBlock('代码块', 'Markdown：``` 空格'),
  },
  { format: ELTYPE.OLLIST, icon: 'ordered', text: tooltipInnerBlock('有序列表', 'Markdown：1. 空格') },
  { format: ELTYPE.ULLIST, icon: 'unordered', text: tooltipInnerBlock('无序列表', 'Markdown：- 空格') },
  { format: ELTYPE.TODO_LIST, icon: 'tasklist', text: tooltipInnerBlock('待做事项', '') },
  { format: 'align-left', icon: 'align_left', text: tooltipInnerBlock('左对齐', '') },
  { format: 'align-center', icon: 'align_center', text: tooltipInnerBlock('居中对齐', '') },
  { format: 'align-right', icon: 'align-right', text: tooltipInnerBlock('右对齐', '') },
];
export const blockMenus = [
  { format: 'set-link', icon: 'add_link', text: '插入链接' },
  {
    format: ELTYPE.IMAGE,
    icon: 'photo',
    text: '图片',
  },
  {
    format: 'emoji',
    icon: 'photo',
    text: '表情',
  },
];
const SiderMenu = ({ editor, setMenuIndex, children, selectedRow, type, menuIndex, setIsModalVisible, setModalTitle }: SiderMenuProps) => {
  const [hover, setHover] = useState(false);
  const [select, setSelect] = useState(false);
  const [prevSR, setPrevSR] = useState(null);
  const [fullPath, setFullPath] = useState([]);
  const [tableHover, setTableHover] = useState(null);
  const [curNodeName, setCurNodeName] = useState(null);
  const [siderMenuVisible, setSiderMenuVisible] = useState(false);
  const { isReadOnly } = useContext(TripdocsSdkContext);

  const _onClick = () => {
    let path: any;

    path = selectedRow.anchor.path;
  };

  const [pathNum, setPath] = useState(null);
  useEffect(() => {
    let path: any;

    if (type === ELTYPE.IMAGE) {
      path = selectedRow.anchor.path;
    }
    if (type === ELTYPE.VIDEO) {
      path = selectedRow.anchor.path;
    } else {
      path = selectedRow.anchor.path;
    }
    setPath(path[0]);
    setFullPath(path);
  }, [selectedRow]);
  const getPath = useCallback(() => {
    if (selectedRow?.anchor?.path) {
      let path: any;

      path = selectedRow.anchor.path?.slice(0, -1);

      return path;
    } else {
      return undefined;
    }
  }, [pathNum]);
  const thisPath = getPath();

  return (
    <>
      <div
        className="pmenu-block-wrapper"
        onClick={() => {
          setSiderMenuVisible(false);
        }}
      >
        {iconMenus.map((props, index) => {
          return (
            <BlockIcon
              {...props}
              key={index}
              path={thisPath}
              type={type}
              menuIndex={menuIndex}
              setMenuIndex={setMenuIndex}
              style={{ background: menuIndex === index ? '#eee' : undefined }}
            />
          );
        })}
      </div>
      <Menu
        onClick={() => {
          setSiderMenuVisible(false);
        }}
      >
        <Menu.Divider />
        {blockMenus.map((props, index) => {
          return (
            <BlockMenu
              {...props}
              key={index + iconMenus.length}
              menuIndex={menuIndex}
              path={thisPath}
              type={type}
              setModalTitle={setModalTitle}
              setMenuIndex={setMenuIndex}
              setIsModalVisible={setIsModalVisible}
              style={{ background: menuIndex === index + iconMenus.length ? '#eee' : undefined }}
            />
          );
        })}

        <Menu.Divider />
        <Menu.Item
          key="deleteWhole"
          style={{
            background: menuIndex === blockMenus.length + iconMenus.length ? '#eee' : undefined,
          }}
          icon={<IconBtn className={`tripdocs-sdk-iconfont Tripdocs-delete`} style={{ fontSize: 16, color: 'red' }}></IconBtn>}
          onMouseDown={(event: any) => {
            const path = thisPath;
            Transforms.removeNodes(editor, { at: path });
          }}
        >
          删除
        </Menu.Item>

        {process.env.NODE_ENV !== 'production' && (
          <BlockMenu setMenuIndex={setMenuIndex} format="get-node" icon="quanbudingdan" text="获取节点" path={thisPath} />
        )}
        {process.env.NODE_ENV !== 'production' && (
          <BlockMenu
            format="set-node"
            icon="quanbudingdan"
            text="触发api"
            path={thisPath}
            setMenuIndex={setMenuIndex}
            setModalTitle={setModalTitle}
            setIsModalVisible={setIsModalVisible}
          />
        )}
        {process.env.NODE_ENV !== 'production' && (
          <BlockMenu
            format="set-remote-node"
            icon="quanbudingdan"
            text="更新？？"
            path={thisPath}
            setMenuIndex={setMenuIndex}
            setModalTitle={setModalTitle}
            setIsModalVisible={setIsModalVisible}
          />
        )}
      </Menu>
    </>
  );
};

export default SiderMenu;

export const TableCellSelect = (setMenuVisible: any, setTableHover: any, tableHover: any, editor: any, docWidth: any, thisPath: any) => {
  let cells = [];
  for (let i = 0; i < 81; i++) {
    const mod = (i % 9) + 1;
    const cons = Math.ceil((i + 1) / 9);
    cells.push(
      <div
        key={'cellSelect_' + anchorId()}
        style={{
          width: 26,
          height: 26,
          cursor: 'pointer',
        }}
        onMouseOver={e => {
          e.preventDefault();

          setTableHover(i);
        }}
        onMouseLeave={e => {
          e.preventDefault();

          setTableHover(null);
        }}
        onClick={e => {
          e.preventDefault();

          setTimeout(() => setMenuVisible(false), 50);

          newTable(editor, cons, mod, docWidth - 15, thisPath);
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            margin: '3px',
            border: Math.ceil((tableHover + 1) / 9) >= cons && (tableHover % 9) + 1 >= mod ? '1px solid rgb(50, 100, 255)' : '1px solid lightgray',
            backgroundColor: Math.ceil((tableHover + 1) / 9) >= cons && (tableHover % 9) + 1 >= mod ? 'rgb(232, 242, 255)' : 'transparent',
          }}
        ></div>
      </div>
    );
  }
  return cells;
};

const BlockMenu: React.FC<any> = (props: any) => {
  const { format, icon, text, path, antIcon, setMenuIndex, style, setIsModalVisible, setModalTitle, ...attributes } = props;
  const editor = useSlate();
  return (
    <Menu.Item
      {...attributes}
      key={format || anchorId()}
      className={'sider_menu_item'}
      icon={antIcon ? antIcon : <IconBtn className={`tripdocs-sdk-iconfont Tripdocs-${icon}`} style={{ fontSize: 16 }}></IconBtn>}
      style={{
        ...style,
      }}
      onMouseEnter={() => {
        setMenuIndex(-1);
      }}
      onMouseDown={(event: any) => {
        event.preventDefault();
        execFormat(format, editor, path, setIsModalVisible, setModalTitle);
      }}
    >
      {text}
    </Menu.Item>
  );
};

const BlockIcon: React.FC<any> = (props: any) => {
  const { format, icon, setMenuIndex, key, text, path, style, setIsModalVisible, setModalTitle, ...attributes } = props;
  const editor = useSlate();

  const selection = path;

  const active = isBlockActive(editor, format, selection);
  let alignActive: any;
  if (format.startsWith('align')) {
    alignActive = isAlignActive(editor, format, selection);
  }
  return (
    <Tooltip title={text} overlayStyle={{ userSelect: 'none' }} mouseEnterDelay={0} mouseLeaveDelay={0}>
      <div
        className="pmenu-block-icon sider_icon"
        {...attributes}
        key={format}
        style={{
          ...style,
        }}
        onMouseEnter={() => {
          setMenuIndex(-1);
        }}
        onMouseDown={(event: any) => {
          event.preventDefault();

          execFormat(format, editor, path, setIsModalVisible, setModalTitle);
        }}
      >
        <IconBtn
          className={`tripdocs-sdk-iconfont Tripdocs-${icon}`}
          style={{ color: active ? COLOR_ACTIVE.COLOR : COLOR_DEFAULT.COLOR, fontSize: 16 }}
        ></IconBtn>
      </div>
    </Tooltip>
  );
};

export const min = (a: any, b: any) => {
  return a > b ? b : a;
};

const max = (a: any, b: any) => {
  return a > b ? a : b;
};

export const DeleteSiderButton = ({ editor, children, selectedRow, type }: DeleteSiderButtonProps) => {
  const blockRef = useRef(null);
  const [hover, setHover] = useState(false);
  const [select, setSelect] = useState(false);
  const [path, setPath] = useState(null);
  const [curNodeName, setCurNodeName] = useState(null);

  useEffect(() => {
    if (type === ELTYPE.CODE_BLOCK) {
      let path = 0;
      for (let i = 0; i < children.props.editor.children.length; i++) {
        if (
          children.props.editor.children[i].type === ELTYPE.CODE_BLOCK &&
          children.props.editor.children[i]['data-codeblock-id'] &&
          children.props.editor.children[i]['data-codeblock-id'] === children.props.element['data-codeblock-id']
        ) {
          path = i;
        }
      }
      setPath([path]);
    } else if (type === ELTYPE.IMAGE) {
      let path = 0;
      for (let i = 0; i < children.props.editor.children.length; i++) {
        if (
          children.props.editor.children[i].type === ELTYPE.IMAGE &&
          children.props.editor.children[i]['id'] &&
          children.props.editor.children[i]['id'] === children.props.element['id']
        ) {
          path = i;
        }
      }
      setPath([path]);
    } else if (type === ELTYPE.VIDEO) {
      let path = 0;
      for (let i = 0; i < children.props.editor.children.length; i++) {
        if (
          children.props.editor.children[i].type === ELTYPE.VIDEO &&
          children.props.editor.children[i]['id'] &&
          children.props.editor.children[i]['id'] === children.props.element['id']
        ) {
          path = i;
        }
      }
      setPath([path]);
    }
  }, [selectedRow]);

  return (
    <div
      className="sider-menu-wrapper"
      ref={blockRef}
      style={{
        position: 'relative',
        marginLeft: hover ? -30 : 0,
      }}
      onMouseEnter={e => {
        setCurNodeName(blockRef.current && blockRef.current.childNodes[1].childNodes[0].nodeName);
      }}
      onMouseLeave={e => {
        setHover(false);
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          display: (hover || select) && path && path[0] !== 0 ? 'inline' : 'none',
          lineHeight: lineHeightMapping[curNodeName] ?? 1,
          userSelect: 'none',
        }}
        contentEditable={false}
      >
        <SiderMemuDelete>
          <Tooltip title={`移除${type === ELTYPE.CODE_BLOCK ? `代码块` : type === ELTYPE.IMAGE ? `图片` : type === ELTYPE.VIDEO ? `视频` : ''}`}>
            <IconBtn
              className="tripdocs-sdk-iconfont icon-ic24-delete"
              style={{ fontSize: 20 }}
              onMouseDown={(event: any) => {
                event.preventDefault();
                if (type === ELTYPE.CODE_BLOCK) {
                  let path = 0;
                  for (let i = 0; i < children.props.editor.children.length; i++) {
                    if (
                      children.props.editor.children[i].type === ELTYPE.CODE_BLOCK &&
                      children.props.editor.children[i]['data-codeblock-id'] &&
                      children.props.editor.children[i]['data-codeblock-id'] === children.props.element['data-codeblock-id']
                    ) {
                      path = i;
                    }
                  }
                  Transforms.removeNodes(editor, { at: [path] });
                } else if (type === ELTYPE.IMAGE) {
                  Transforms.removeNodes(editor, { at: path });
                }
              }}
              onMouseLeave={() => {
                setSelect(false);
              }}
            ></IconBtn>
          </Tooltip>
        </SiderMemuDelete>
      </div>
      <div
        style={{
          marginLeft: hover ? 30 : 0,
        }}
        onMouseEnter={e => {
          setHover(true);
        }}
      >
        {children}
      </div>
    </div>
  );
};

export function execFormat(format: any, editor: ReactEditor, path: Path, setIsModalVisible, setModalTitle) {
  editor.deleteBackward('character');
  const selection = path;
  const { type } = Node.get(editor, path) as any;

  if (format.startsWith('align')) {
    const fo = format.split('-')[1];
    alignToggle(editor, fo, selection);
    return;
  }

  if (format === ELTYPE.CODE_BLOCK) {
    insertCodeBlock(editor, path);
    return;
  }

  if (type !== format && [ELTYPE.OLLIST, ELTYPE.ULLIST].includes(format)) {
    let id = format + '=' + createUUID();

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
      { at: editor.selection }
    );
    return;
  }

  if (format === 'emoji') {
    Transforms.insertText(editor, '\\');

    return;
  }
  if (format === 'set-link') {
    if (editor && editor.selection && Node.has(editor, selection) && !isSameLineSelection(editor.selection)) {
      return;
    }
    insertEditLink(editor, '', editor.selection);
    return;
  }
  if (format === 'get-node') {
    const mynode: any = Node.get(editor, 0 as any);
    console.log(`BlockMenu get-node path[0]:${0} mynode:`, mynode, Editor.above(editor, { at: [0, 0] }));
    copyToClipboard(JSON.stringify(mynode.children));
    return;
  }
  if (format === 'set-remote-node') {
  }
  if (format === 'set-node') {
    return;
  }
  if ([ELTYPE.INLINEIMAGE, ELTYPE.IMAGE].includes(format)) {
    setIsModalVisible(true);
    setModalTitle(1);

    return;
  }
  if (format === ELTYPE.VIDEO) {
    setIsModalVisible(true);
    setModalTitle(0);
    return;
  }
  if (format === 'delete') {
    Transforms.removeNodes(editor, { at: path });
    return;
  }

  if (selection && Node.has(editor, selection) && selection[0] !== 0) {
    toggleBlock(editor, format, selection);
  } else {
    if (selection) {
      toggleBlock(editor, format, selection);
    }
  }
}
