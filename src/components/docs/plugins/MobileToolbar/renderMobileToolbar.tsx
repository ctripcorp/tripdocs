import {
  AlignLeftOutlined,
  CalendarOutlined,
  CaretDownOutlined,
  CheckSquareOutlined,
  FontColorsOutlined,
  FontSizeOutlined,
  KeyOutlined,
  PictureOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { Transforms, Node } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { IS_IOS } from '@src/components/slate-packages/slate-react/utils/environment';
import { TripdocsSdkContext } from '@src/Docs';
import useVisualViewport from '@src/utils/apiOperations/hooks/useVisualViewport';
import { getCache, setCache } from '@src/utils/cacheUtils';
import storage from '@src/utils/storage';
import { Drawer, Popover } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { isBlockActive, toggleBlock } from '../block';
import { COLOR_ACTIVE } from '../Components';
import { ELTYPE } from '../config';
import { AlignButton, isAlignActive, MarkButton } from '../HoveringToolbar';
import { getEditorEventEmitter } from '../table/selection';
import CardPopup from './CardPopup';
import ColorPopup from './ColorPopup';
export const BodyPortal = ({ children }) => {
  return ReactDOM.createPortal(children, document.body);
};

export function MobileToolbar(props) {
  const { editor, docWidth, modalState, currentColor, setCurrentColor, anchorTrigger, display } = props;
  const [showCardPopup, setShowCardPopup] = useState(false);
  const [showColorPopup, setShowColorPopup] = useState(false);

  const { isReadOnly, docId } = React.useContext(TripdocsSdkContext);
  const [theme, setTheme] = useState({ backgroundColor: '#fff', color: 'rgba(0, 0, 0, 0.85)' });
  const clientHeight = window.document.body.clientHeight;

  const viewport = useVisualViewport();

  useEffect(() => {
    const editorDom = document.getElementById(`editorarea-${docId}`);
    const selection = getCache(docId, 'selection');
    if (!editor) {
      return;
    }
    if (showColorPopup || showCardPopup) {
      if (!selection) {
        return;
      }
      editorDom && (editorDom.style.padding = '10px 15px 100vh');
      const node = Node.has(editor, selection.anchor.path) && Node.get(editor, selection.anchor.path);
      if (node) {
        const domNode = ReactEditor.toDOMNode(editor, node);
        domNode.style.scrollMarginTop = `20vh`;
        domNode && domNode.scrollIntoView(true);
      }
      setTimeout(() => ReactEditor.blur(editor));
    } else {
      if (selection) {
        editorDom.focus();
        Transforms.select(editor, selection);
      }
      setCache(docId, 'isShowMobileMenuPopup', false);
      editorDom && (editorDom.style.padding = '10px 15px 160px');
    }
  }, [showCardPopup, showColorPopup]);

  const isInElectron: boolean = getCache(docId, 'options')?.isInElectron;
  const safeAreaBottom: number = getCache(docId, 'options')?.safeAreaBottom;
  const [isViewport, setIsViewport] = useState(IS_IOS && !isInElectron);
  const keyboardHeight = clientHeight - viewport.height;

  return showCardPopup ? (
    <CardPopup setShowCard={setShowCardPopup} editor={editor} docWidth={docWidth} bottom={isInElectron ? safeAreaBottom + 42 : 42} docId={docId} />
  ) : showColorPopup ? (
    <ColorPopup setShowCard={setShowColorPopup} editor={editor} docWidth={docWidth} bottom={isInElectron ? safeAreaBottom + 42 : 42} docId={docId} />
  ) : (
    <div
      id={'mobile-toolbar-' + docId}
      className={css`
        & {
          height: ${isInElectron ? safeAreaBottom + 42 + 'px' : '42px'};
          width: ${viewport.width}px;
          position: fixed;
          top: ${viewport.height - 42}px;
          box-shadow: 0 0 12px 1px #dadada;
          z-index: 9999;
          overflow: hidden;
          display: ${display};
          padding-bottom: ${isInElectron && keyboardHeight === 0 ? safeAreaBottom + 'px' : '0px'};
        }
      `}
    >
      <div
        className={css`
          & {
            overflow-x: auto;
            height: 42px;
            width: ${viewport.width - 42}px;
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            flex-wrap: nowrap;
            background-color: ${theme.backgroundColor};
            color: ${theme.color};
            &::after {
              content: '';
              position: absolute;
              right: 0;
              top: 0;
              bottom: 0;
              width: 10px;

              transition: opacity 0.1s;
              right: 42px;
              background: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.15));
            }
            &::-webkit-scrollbar {
              display: none;
            }
          }
        `}
      >
        <MobileToolbarButton
          type={'cards'}
          editor={editor}
          icon={<PlusCircleOutlined />}
          callback={() => {
            setCache(docId, 'isShowMobileMenuPopup', true);
            ReactEditor.blur(editor);
            setTimeout(() => {
              setShowCardPopup(true);
            }, 300);
          }}
        />
        <VerticalDivider />
        <MobileToolbarButton type={'format'} editor={editor} icon={<FontSizeOutlined />} callback={() => {}} />
        <MobileToolbarButton
          type={'color'}
          editor={editor}
          icon={<FontColorsOutlined />}
          callback={() => {
            setCache(docId, 'isShowMobileMenuPopup', true);
            ReactEditor.blur(editor);
            setTimeout(() => {
              setShowColorPopup(true);
            }, 300);
          }}
        />
        <MobileToolbarButton type={'align'} editor={editor} icon={<AlignLeftOutlined />} callback={() => {}} />
        <VerticalDivider />
        <MobileToolbarButton
          type={'todo-list'}
          editor={editor}
          icon={<CheckSquareOutlined />}
          callback={e => {
            toggleBlock(editor, ELTYPE.TODO_LIST, editor.selection);
          }}
        />
        {}
        {}
      </div>
      <div
        className={css`
          position: absolute;
          right: 0;
          top: 0;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: ${theme.backgroundColor};
          color: ${theme.color};
        `}
      >
        <MobileToolbarButton
          type={'collapse-keyboard'}
          editor={editor}
          icon={<CaretDownOutlined />}
          callback={e => {
            e.preventDefault();

            ReactEditor.blur(editor);
            const dom = document.getElementById('editor-content-' + docId);
            if (dom && dom.firstChild) {
              const input = dom.firstChild;
              input?.blur();
            }
          }}
        />
      </div>
    </div>
  );
}

function MobileToolbarButton(props: any) {
  const { icon, type, editor, callback } = props;

  const popoverContent = {
    format: (
      <div
        className={css`
          display: flex;
        `}
      >
        <InlineButton button={<MarkButton format="bold" editor={editor} icon="Tripdocs-bold" />} />
        <InlineButton button={<MarkButton format="italic" editor={editor} icon="Tripdocs-italic" />} />
        <InlineButton button={<MarkButton format="underline" editor={editor} icon="Tripdocs-underline" />} />
        <InlineButton button={<MarkButton format="strikethrough" editor={editor} icon="Tripdocs-strikethrough" />} />
        <InlineButton button={<MarkButton format="code" editor={editor} icon="Tripdocs-code_tags" />} />
      </div>
    ),
    align: (
      <div
        className={css`
          display: flex;
        `}
      >
        <InlineButton button={<AlignButton editor={editor} format="align-left" icon="Tripdocs-align_left" />} />
        <InlineButton button={<AlignButton editor={editor} format="align-center" icon="Tripdocs-align_center" />} />
        <InlineButton button={<AlignButton editor={editor} format="align-right" icon="Tripdocs-align-right" />} />
      </div>
    ),
  };

  const activableTypes = ['todo-list'];
  let active;
  if (activableTypes.includes(type)) {
    active = editor && isBlockActive(editor, type, editor.selection);
  }

  return (
    <div
      className={cx(
        'mobile-toolbar-btn',
        css`
          & {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            margin: 0 3px;
            font-size: 22px;
            flex: 1 0 auto;
            background-color: ${active ? '#e8efff' : null};
            color: ${active ? COLOR_ACTIVE.COLOR : null};
          }
        `
      )}
      onMouseDown={e => {
        e.preventDefault();
        callback && callback(e);
      }}
      onPointerMove={e => {
        e.preventDefault();
      }}
    >
      <Popover
        autoAdjustOverflow
        placement={'top'}
        content={popoverContent[type]}
        onVisibleChange={visible => {
          if (visible && type === 'align') {
            const aligns = ['align-left', 'align-center', 'align-right'];
            const activeAlignFormat = aligns.find(align => isAlignActive(editor, align, editor.selection));
            editor?.docId && getEditorEventEmitter(editor.docId).emit('mobileAlignButtonClick', editor.docId, activeAlignFormat);
          }
        }}
        trigger={['click']}
        overlayClassName={css`
          & {
            border-radius: 4px;
            .ant-popover-arrow {
              display: none;
            }
            .ant-popover-inner {
              border-radius: 4px;
              .ant-popover-inner-content {
                padding: 0;
              }
            }
          }
        `}
      >
        {icon}
      </Popover>
    </div>
  );
}

function VerticalDivider() {
  return (
    <span
      className={css`
        width: 1px;
        background-color: #d0d0d0;
        height: 20px;
      `}
    ></span>
  );
}

function InlineButton({ button }) {
  return (
    <div
      className={cx(
        'mobile-toolbar-btn',
        css`
          & {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            margin: 0 3px;
            font-size: 22px;
            [class^='Tripdocs-'],
            [class*=' Tripdocs-'] {
              width: 28px;
              height: 28px;
              font-size: 20px;
              border-radius: 4px;
            }
          }
        `
      )}
      onPointerMove={e => {
        e.preventDefault();
      }}
    >
      {button}
    </div>
  );
}
