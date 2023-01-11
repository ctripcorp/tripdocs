import { Empty, message, Space, Tooltip } from 'antd';
import imageExtensions from 'image-extensions';
import isUrl from 'is-url';
import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import { Editor, Path, Range, Transforms } from '@src/components/slate-packages/slate';
import { TripdocsSdkContext } from '../../../../Docs';
import { Node } from '../../../slate-packages/slate';
import { ReactEditor, useFocused, useSelected } from '../../../slate-packages/slate-react';
import { insertCard } from '../Card';
import { ELTYPE, TABBABLE_TYPES } from '../config';
import { css, cx } from '@emotion/css';
import { getSlateSlection } from '@src/utils/getSelection';
import { getCache, setCache } from '@src/utils/cacheUtils';
import { getParentPathByType, getParentPathByTypes } from '../pluginsUtils/getPathUtils';
import { getEditorEventEmitter } from '../table/selection';
import { DownloadOutlined } from '@ant-design/icons';
import { IconBtn } from '../Components';
import { f } from '@src/resource/string';
import { Overlay } from '../OverlayComponents/Overlay';
import DragHandle from '../OverlayComponents/DragHandle';
import { GeneralOverlayButton } from '../OverlayComponents/Overlay/GeneralOverlayButton';

interface VideoProps {
  attributes: any;
  children: any;
  element: any;
  editor: any;
  setShow: any;
  isResizing?: any;
}

export const SlateVideo: React.FC<any> = ({ attributes, children, element, editor }: VideoProps) => {
  const { url, source, align = 'left' } = element;

  const selected = useSelected();
  const focused = useFocused();
  const [show, setShow] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const [isOverElement, setIsOverElement] = useState(false);
  const [overlayRefDom, setOverlayRefDom] = useState(null);

  useEffect(() => {
    selected && focused && setShow(true);
  }, [selected, focused]);

  const _onMouseDown = e => {
    console.log('[currentTarget]', e.currentTarget, e.target, e.target.tagName);
    console.log('[SlateVideo] _onMouseDown', e);

    if (e.target.tagName == 'svg' || e.target.tagName == 'path') {
      e.stopPropagation();
      e.preventDefault();
    } else if (e.target.tagName == 'VIDEO') {
    } else if (e.target.tagName === 'DIV' && e.target.classList.contains('videoContainer-inner-wrap')) {
      e.stopPropagation();
      e.preventDefault();

      console.log('e.target 非图片区域', e.target, e.target.classList);
      let division: 'left' | 'right' = null;
      const { left, right } = e.target.getBoundingClientRect();
      const middle = (left + right) / 2;
      if (e.clientX < middle) {
        division = 'left';
      } else {
        division = 'right';
      }
      if (division) {
        const path = ReactEditor.findPath(editor, element);
        const parentPath = getParentPathByType(editor, path, ELTYPE.CARD);
        console.log('division', division, path, parentPath);
        switch (division) {
          case 'left':
            Transforms.select(editor, [...path.slice(0, -1), path.slice(-1)[0] - 1]);
            break;
          case 'right':
            Transforms.select(editor, [...parentPath, 2, 0]);
            break;
          default:
            break;
        }
      }
    } else {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const _onDrawing = isDrawing => {
    setIsDrawing(isDrawing);
  };

  return (
    <>
      <div
        {...attributes}
        contentEditable={false}
        data-ignore-slate
        className={cx(
          'ignore-toggle-readonly',
          'videoContainer-outer-wrap',
          css`
            background: none;
            border: 1px solid transparent;
          `
        )}
        id={element.id}
        onMouseDown={_onMouseDown}
        onDragOverCapture={e => {
          console.log('[video] onDragOverCapture', e.target);
          e.dataTransfer.dropEffect = 'none';
          e.preventDefault();
        }}
        onMouseOver={() => {
          setIsOverElement(true);
        }}
        onMouseLeave={() => {
          setTimeout(() => {
            setIsOverElement(false);
          }, 400);
        }}
      >
        <div
          contentEditable={false}
          data-ignore-slate
          className={cx(
            css`
              display: flex;
              flex-direction: row;
              justify-content: ${align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'};
              align-items: center;
              margin: 16px 0;
              user-select: none;
            `,
            'ignore-toggle-readonly',
            'videoContainer-inner-wrap'
          )}
        >
          <MyVideo
            element={element}
            editor={editor}
            isShow={show}
            setShow={setShow}
            onDrawing={_onDrawing}
            isDrawing2={isDrawing}
            align={align}
            overlayRefDom={overlayRefDom}
            setOverlayRefDom={setOverlayRefDom}
          />

          <div>{children}</div>
        </div>
      </div>
      <DragHandle
        editor={editor}
        isOverElement={isOverElement}
        docId={editor?.docId || ''}
        overlayRefDom={overlayRefDom}
        findDomToEl={dom => dom?.closest('[data-slate-node="element"]')?.children[0].children[0]}
      />
    </>
  );
};

function MyVideo(props: any) {
  const { element, editor, isShow, onDrawing, setShow, align, overlayRefDom, setOverlayRefDom, attributes, children } = props;
  const selected2 = useSelected();
  const focused2 = useFocused();

  const [isResizing, setIsResizing] = useState(false);

  const { isReadOnly } = useContext(TripdocsSdkContext);

  const [width, setWidth] = useState(element.width);
  const [height, setHeight] = useState(element.height);

  const [overlayRefRect, setOverlayRefRect] = useState(null);

  useEffect(() => {
    console.log('[video selected2]', selected2, editor.selection);
    const dom = editor && ReactEditor.toDOMNode(editor, element);
    if (dom) {
      const videoContainerDom = dom.querySelector('.videoContainer');
      setOverlayRefDom(videoContainerDom);
      setOverlayRefRect(videoContainerDom.getBoundingClientRect());
    }
  }, [selected2, align]);

  let isDrawing = false;
  let x = 0;
  let y = 0;
  let clientRect: any = {};
  let dom;
  let percent;
  let dataId;

  const style1: any = {
    background: `${isShow ? '#1890ff' : 'transparent'}`,
    position: 'absolute',
    top: -6,
    left: -6,
    height: 12,
    width: 12,
    cursor: 'nwse-resize',
  };
  const style2: any = {
    background: `${isShow ? '#1890ff' : 'transparent'}`,
    position: 'absolute',
    bottom: -6,
    left: -6,
    height: 12,
    width: 12,
    cursor: 'nesw-resize',
  };
  const style3: any = {
    background: `${isShow ? '#1890ff' : 'transparent'}`,
    position: 'absolute',
    top: -6,
    right: -6,
    height: 12,
    width: 12,
    cursor: 'nesw-resize',
  };
  const style4: any = {
    background: `${isShow ? '#1890ff' : 'transparent'}`,
    position: 'absolute',
    bottom: -6,
    right: -6,
    height: 12,
    width: 12,
    cursor: 'nwse-resize',
  };
  const style0: any = {
    boxShadow: 'none',
    position: 'relative',
    display: 'inline-block',
    width: width,
    height: height,
  };

  const fn = (e: any) => {
    console.log('[fn]', e);
    if (isDrawing === true) {
      console.log('[x,y]', e.clientX - x, e.clientY - y);

      let diffw = e.clientX - x;
      let diffh = e.clientY - y;
      let w = clientRect.width;
      let h = clientRect.height;
      let _left = 0;
      let _top = 0;
      let _width = 0;
      let _height = 0;
      console.log(diffw, diffh);

      if (diffh / diffw > percent) {
        diffh = percent * diffw;
      } else {
        diffw = diffh / percent;
      }

      if (dataId == 'point1') {
        _left = diffw;
        _top = diffh;
        _width = w - diffw;
        _height = h - diffh;
        if (_width <= 0) {
          _width = 6;
        }
        if (_height <= 0) {
          _height = 6;
        }
        if (_top >= h - 9) {
          _top = h;
        }
        if (_left >= w - 9) {
          _left = w;
        }
        console.log('[point1]', _top, h);
        dom.style.left = _left + 'px';
        dom.style.top = _top + 'px';
        dom.style.width = _width + 'px';
        dom.style.height = _height + 'px';
      } else if (dataId == 'point2') {
        _left = -diffw;
        _top = 0;
        _width = w + diffw;
        _height = h + diffh;
        if (_width <= 0) {
          _width = 6;
        }
        if (_height <= 0) {
          _height = 6;
        }

        if (_left >= w - 9) {
          _left = w;
        }

        dom.style.left = _left + 'px';
        dom.style.width = _width + 'px';
        dom.style.top = _top + 'px';
        dom.style.height = _height + 'px';
      } else if (dataId == 'point3') {
        _left = 0;
        _top = diffh;
        _width = w - diffw;
        _height = h - diffh;
        if (_width <= 0) {
          _width = 6;
        }
        if (_height <= 0) {
          _height = 6;
        }
        if (_top >= h - 9) {
          _top = h;
        }

        dom.style.top = _top + 'px';
        dom.style.width = _width + 'px';
        dom.style.left = _left + 'px';
        dom.style.height = _height + 'px';
      } else if (dataId == 'point4') {
        _left = 0;
        _top = 0;
        _width = w + diffw;
        _height = h + diffh;
        if (_width <= 0) {
          _width = 6;
        }
        if (_height <= 0) {
          _height = 6;
        }
        dom.style.left = _left + 'px';
        dom.style.top = _top + 'px';
        dom.style.width = _width + 'px';
        dom.style.height = _height + 'px';
      }

      dom.style.lineHeight = dom.style.height;
    }
  };

  const fn2 = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', fn);
    document.removeEventListener('mouseup', fn2);

    isDrawing = false;
    onDrawing(isDrawing);
    x = 0;
    y = 0;
    Transforms.setNodes(editor, { width: dom.style.width, height: dom.style.height } as any);
    setWidth(dom.style.width);
    setHeight(dom.style.height);
    clientRect = {};
    dom.style.display = 'none';
    dom.style.left = '0px';
    dom.style.top = '0px';

    setTimeout(() => {
      setCache(editor.docId, 'videoMouseIsDown', false);
      setShow(false);
    });
  };
  const _onMouseDown = e => {
    if (!editor) return;
    setIsResizing(true);
    const path = ReactEditor.findPath(editor, element);

    Transforms.select(editor, path);

    setCache(editor.docId, 'videoMouseIsDown', true);
    console.log('[_onMouseDown]', e.target.getAttribute('id'));
    x = e.clientX;
    y = e.clientY;
    isDrawing = true;
    onDrawing(isDrawing);
    document.addEventListener('mousemove', fn);
    document.addEventListener('mouseup', fn2);
    dom = e.target.parentNode;
    dom.style.display = 'block';
    clientRect = dom.getBoundingClientRect();
    percent = clientRect.height / clientRect.width;
    dataId = e.target.getAttribute('data-id');
  };
  const _onMouseUp = e => {};
  const _onMouseMove = e => {};

  useEffect(() => {}, [isShow]);
  return (
    <div
      style={style0}
      className="videoContainer"
      contentEditable={false}
      onMouseEnter={() => {
        const videoMouseLeaveTimeout = getCache(editor.docId, 'videoMouseLeaveTimeout');
        clearTimeout(videoMouseLeaveTimeout);
        setShow(true);
      }}
      onMouseLeave={() => {
        const videoMouseLeaveTimeout = setTimeout(() => {
          if (!getCache(editor.docId, 'videoMouseIsDown')) {
            setShow(false);
          }
        }, 1500);
        setCache(editor.docId, 'videoMouseLeaveTimeout', videoMouseLeaveTimeout);
      }}
    >
      {!isReadOnly && (
        <div
          contentEditable={false}
          data-ignore-slate
          className={cx('mask', 'ignore-toggle-readonly')}
          style={{
            background: 'black',
            opacity: 0.5,
            color: 'white',
            position: 'absolute',
            display: isShow ? 'block' : 'none',
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            bottom: 0,
            right: 0,
            left: 0,
            top: 0,
            zIndex: isResizing ? 9 : 0,
            outline: '1px solid rgb(24, 144, 255)',
          }}
        >
          <>
            <div
              id={element.id + 'point1'}
              style={style1}
              onMouseDown={_onMouseDown}
              onMouseUp={_onMouseUp}
              onMouseMove={_onMouseMove}
              className={'dot'}
              data-id="point1"
            ></div>
            <div
              id={element.id + 'point2'}
              style={style2}
              onMouseDown={_onMouseDown}
              onMouseUp={_onMouseUp}
              onMouseMove={_onMouseMove}
              className={'dot'}
              data-id="point2"
            ></div>
            <div
              id={element.id + 'point3'}
              style={style3}
              onMouseDown={_onMouseDown}
              onMouseUp={_onMouseUp}
              onMouseMove={_onMouseMove}
              className={'dot'}
              data-id="point3"
            ></div>
            <div
              id={element.id + 'point4'}
              style={style4}
              onMouseDown={_onMouseDown}
              onMouseUp={_onMouseUp}
              onMouseMove={_onMouseMove}
              className={'dot'}
              data-id="point4"
            ></div>
          </>
        </div>
      )}

      <Overlay
        show={isShow}
        docId={editor?.docId || ''}
        placement="top"
        overlayRefDom={overlayRefDom}
        left={overlayRefRect?.left}
        distance={38}
        bordered
      >
        <div
          className={cx(
            'overlay-button-wrap',
            css`
              display: flex;
              justify-content: space-between;
              align-items: center;
            `
          )}
        >
          {}
          <GeneralOverlayButton
            title={f('copy')}
            icon={<IconBtn className="Tripdocs-duplicate" style={{ fontSize: '15px' }} />}
            onMouseDown={e => {
              e.preventDefault();
              copyVideo(editor, element);
            }}
          />
          {!isReadOnly && (
            <GeneralOverlayButton
              title={f('delete')}
              icon={<IconBtn className="Tripdocs-delete" style={{ fontSize: '15px' }} />}
              onMouseDown={e => {
                e.preventDefault();
                const path = ReactEditor.findPath(editor, element);
                if (path) {
                  Transforms.removeNodes(editor, { at: path });
                  console.log('[delete]', path);
                }
              }}
            />
          )}
        </div>
      </Overlay>
      <SlateVideo2 element={element} editor={editor} attributes={attributes} setShow={setShow} data-ignore-slate isResizing={isResizing} />
    </div>
  );
}
export function copyVideo(editor: ReactEditor, element: Node) {
  const path = ReactEditor.findPath(editor, element);

  const startPoint = Editor.end(editor, Editor.previous(editor, { at: path })[1]);
  const endPoint = Editor.start(editor, Editor.next(editor, { at: path })[1]);
  Transforms.select(editor, { anchor: startPoint, focus: endPoint });
  setTimeout(() => {
    document.execCommand('copy');
  });
}

export const insertVideo = (editor: ReactEditor, url: string, source: string = '') => {
  let selection, path;
  if ((selection = getSlateSlection(editor.docId))) {
    path = selection.focus.path;
  }
  const parentPath = getParentPathByTypes(editor, path, TABBABLE_TYPES);
  const nextPath = Path.next(parentPath);
  const nextPath2 = Path.next(nextPath);
  console.log('[nextPath]: ', path, nextPath);

  insertCard(editor, { type: ELTYPE.VIDEO, url: url, source: source, children: [{ text: '' }] }, nextPath);

  Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] } as Node, {
    at: nextPath2,
  });
};

export const SlateVideo2: React.FC<any> = ({ isResizing, element }: VideoProps) => {
  const { url, source, width, height } = element;
  const mWidth = width && parseInt(width.split('px')[0]);
  const mHeight = height && parseInt(height.split('px')[0]);

  const [iframeSrc, setIframeSrc] = useState('');

  useEffect(() => {
    const isYouku = url?.indexOf('youku.com') > -1;
    const isBilibili = url?.indexOf('bilibili.com') > -1;
    let src = source || '';
    if (isYouku) {
      src = 'https://player.youku.com/embed/' + url.split('/id_').pop().split('.html?').shift();
    } else if (isBilibili) {
      src = 'https://player.bilibili.com/player.html?bvid=' + url.split('/').pop().split('?').shift() + '&page=1';
    } else if (typeof source === 'undefined') {
      alert('暂不支持显示该内容');
      return;
    }
    setIframeSrc(src);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          userSelect: 'none',
          display: 'flex',
          justifyContent: 'revert',
          margin: 5,
          pointerEvents: isResizing ? 'none' : 'auto',
        }}
        className={cx('videoContainer', 'ignore-toggle-readonly')}
        contentEditable={false}
        data-ignore-slate
      >
        {iframeSrc ? (
          <iframe
            style={{ background: '#ccc' }}
            height={(mHeight || (640 / 16) * 9) - 10}
            width={(mWidth || 640) - 10}
            scrolling="no"
            className={'ignore-toggle-readonly'}
            data-testid="ne-thirdparty-reader-iframe"
            src={iframeSrc}
            data-ignore-slate
          ></iframe>
        ) : (
          <div
            className={cx(
              'ignore-toggle-readonly',
              css`
                color: #096dd9;
                cursor: pointer;

                border-radius: 4px;
                padding: 10px 5px;

                &:hover {
                  background-color: #f0f0f0;
                }
                &:before {
                  content: '📄';
                  margin-right: 8px;
                }
              `
            )}
          >
            文件上传失败，请重试
          </div>
        )}
      </div>
    </div>
  );
};
