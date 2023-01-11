import { DownloadOutlined } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { Editor, Range, Transforms } from '@src/components/slate-packages/slate';
import { f } from '@src/resource/string';
import { getCache } from '@src/utils/cacheUtils';
import { getSlateSlection } from '@src/utils/getSelection';
import { createUUID } from '@src/utils/randomId';
import { Empty, Image as AntdImage, message } from 'antd';
import imageExtensions from 'image-extensions';
import isUrl from 'is-url';
import React, { useContext, useEffect, useState } from 'react';
import { TripdocsSdkContext } from '../../../../Docs';
import { Node } from '../../../slate-packages/slate';
import { ReactEditor, useFocused, useSelected } from '../../../slate-packages/slate-react';
import { insertCard } from '../Card';
import { IconBtn } from '../Components';
import { ELTYPE, TABBABLE_TYPES } from '../config';
import DragHandle from '../OverlayComponents/DragHandle';
import { downloadFile } from '../File/filePlugins';
import { Overlay } from '../OverlayComponents/Overlay';
import { GeneralOverlayButton } from '../OverlayComponents/Overlay/GeneralOverlayButton';
import { getParentPathByType, getParentPathByTypes } from '../pluginsUtils/getPathUtils';
import { getEditorEventEmitter } from '../table/selection';

export const insertImage = (editor: any, source: string = '', paths: number[] = editor.selection?.focus?.path, linkSource?: string) => {
  console.log(paths);
  let selection, path;
  if ((selection = getSlateSlection(editor.docId))) {
    path = selection.focus.path;
  }
  const element = {
    type: ELTYPE.IMAGE,
    source,
    linkSource,
    children: [{ text: '' }],
    id: createUUID(),
  };
  element.source && delete element.linkSource;

  try {
    const imagePath = getParentPathByTypes(editor, path, TABBABLE_TYPES);
    console.log('imagePath', imagePath);
    if (imagePath) {
      const node: any = Node.has(editor, imagePath) && Node.get(editor, imagePath);
      console.log(' node', node, path);
      insertCard(editor, element, imagePath);
    }
  } catch (error) {
    message.error('插入图片时，发生错误');
    console.error(error);
  }
};

export async function translateImgUrlToBase64(docId: string, url: string | ArrayBuffer, callback: Function) {
  let myHeaders = new Headers();
  myHeaders.append('Cookie', 'principal_dev=TripDocs001;; GUID=09031045110005913542; Cookie_1=value');
  myHeaders.append('Content-Type', 'application/json');
  let raw = JSON.stringify({ url: url, docId: docId });
  let requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
  };

  const fetchUrl = getCache(docId, 'options')?.imgUploadUrl || '/tripdocs/api/docs/doc/uploadImg/byLink';
  fetch(fetchUrl, requestOptions)
    .then(response => response.json())
    .then(result => {
      Promise.resolve(callback(result?.data?.source));
    })
    .catch(error => console.log('error', error));
}

export async function translateImgFileToBase64(filePath: string, callback: Function) {
  const result: any = {};
  Promise.resolve(callback(result?.data?.source));
}

function dealImage(base64: string, w: number, callback: Function) {
  let newImage = new Image();
  newImage.crossOrigin = 'Anonymous';
  let quality = 0.8;
  newImage.src = base64;
  newImage.setAttribute('crossOrigin', 'Anonymous');
  let imgWidth, imgHeight;
  newImage.onload = function () {
    imgWidth = (this as any).width;
    imgHeight = (this as any).height;
    const newW = w || (this as any).width;
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    if (Math.max(imgWidth, imgHeight) > newW) {
      if (imgWidth > imgHeight) {
        canvas.width = newW;
        canvas.height = (newW * imgHeight) / imgWidth;
      } else {
        canvas.height = newW;
        canvas.width = (newW * imgWidth) / imgHeight;
      }
    } else {
      canvas.width = imgWidth;
      canvas.height = imgHeight;
      quality = 0.6;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this as any, 0, 0, canvas.width, canvas.height);
    let base64 = canvas.toDataURL('image/jpeg', quality);

    callback(base64);
  };
}

export async function translateImgToBase64Native(url: string | ArrayBuffer, callback: Function) {
  let canvas = document.createElement('canvas');
  let context = canvas.getContext('2d');
  let img: HTMLImageElement = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
    let URLData = canvas.toDataURL('image/png');
    const imageUrl = URLData;

    const isLt10M = imageUrl.length / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('图片大小应小于 10MB!');
      return;
    }
    callback(imageUrl);
  };
  img.src = url.toString();
}

export async function translateImgToBase64(docId: string, url: string | ArrayBuffer, callback: Function) {
  let canvas = document.createElement('canvas');
  let context = canvas.getContext('2d');
  let img: HTMLImageElement = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
    let URLData = canvas.toDataURL('image/png');
    const imageUrl = URLData;

    const isLt10M = imageUrl.length / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('图片大小应小于 10MB!');
      return;
    }
    requestUploadImg(imageUrl, callback, docId);
  };
  img.src = url.toString();
}

export function insertImgFile(editor: any, docId: string) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.png,.jpeg,.jpg,.gif,.ico';
  input.addEventListener('change', (event: any) => {
    const file = event.target.files[0];
    if (event.target.files[0].size > 10 * 1024 * 1024) {
      message.error('文件不能大于10mb');
      return;
    }

    readCopyFile(editor.docId, file, source => {
      insertImageFromSource(editor, source);
    });
  });
  input.click();
}

function requestUploadImg(imageUrl: string, callback: Function, docId: string) {
  let myHeaders = new Headers();
  myHeaders.append('Cookie', 'principal_dev=TripDocs001;; GUID=09031045110005913542; Cookie_1=value');
  myHeaders.append('Content-Type', 'application/json');
  let raw = JSON.stringify({ type: 'upload', docId: docId, base64: imageUrl });
  let requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
  };
  const fetchUrl = getCache(docId, 'options')?.imgUploadUrl || '/tripdocs/api/docs/doc/uploadImg';
  fetch(fetchUrl, requestOptions)
    .then(response => response.json())
    .then(result => {
      callback && callback(result?.data?.source);
    })
    .catch(error => {
      console.log('error', error);
      message.destroy();
      message.error('图片上传失败，请检查网络后重试');
    });
}
export function isImageBase64(text: string) {
  return text.indexOf('data:image/') === 0;
}
function insertImageFromSource(editor: any, source: string) {
  if (getCache(editor.docId, 'options')?.isInternet) {
    insertImage(editor, undefined, undefined, source);
  } else {
    insertImage(editor, source);
  }
}

function setImageNodeFromSource(editor: any, source: string, path: number[]) {
  if (getCache(editor.docId, 'options')?.isInternet) {
    Transforms.setNodes(editor, { linkSource: source } as Partial<Node>, { at: path });
  } else {
    Transforms.setNodes(editor, { source, linkSource: undefined } as Partial<Node>, { at: path });
  }
}

function deserializeCopyImage(editor: any, files: any[]) {
  for (const file of files) {
    const [mime] = file.type.split('/');
    console.log('imgplugins insertData file mime', mime);
    if (mime === ELTYPE.IMAGE) {
      readCopyFile(editor.docId, file, source => {
        insertImageFromSource(editor, source);
      });
    }
  }
}
function readCopyFile(docId: string, file: any, callback: Function) {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    const url = reader.result;
    translateImgToBase64(docId, url, function (source: string) {
      callback && callback(source);
    });
  });

  reader.readAsDataURL(file);
}

export const withImages = (editor: any) => {
  const { isVoid, insertData, deleteBackward, deleteForward, deleteFragment, isInline } = editor;
  editor.isVoid = (element: any) => {
    return element.type === ELTYPE.IMAGE ? true : isVoid(editor);
  };

  editor.insertData = (data: any) => {
    insertData(data);

    return;
  };
  return editor;
};

export const isImageUrl = (urlStr: string) => {
  if (!urlStr) return false;
  const url = urlStr.trim();

  if (!isUrl(url)) return false;
  const ext = new URL(url).pathname.split('.').pop();
  return [...imageExtensions, 'image'].includes(ext);
};

interface ImageProps {
  attributes: any;
  children: any;
  element: any;
  editor: any;
  textAlign: any;
}

export const SlateImage: React.FC<any> = ({ attributes, children, element, editor, textAlign }: ImageProps) => {
  const { source, linkSource: lSource } = element;
  const [data, setData] = useState(lSource);
  const [show, setShow] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [isOverElement, setIsOverElement] = useState(false);
  const [overlayRefDom, setOverlayRefDom] = useState(null);

  useEffect(() => {
    const docId = editor?.docId || '';
    if (element.linkSource) {
      console.log('isImageUrl', element);
      if (!element) {
        return;
      }
      const path = ReactEditor.findPath(editor, element);
      if (element.linkSource?.indexOf('http') === 0) {
        if (window.tripdocs.editorsMap[docId]?.isInElectron) {
          let url = element.linkSource;
          translateImgToBase64Native(url.trim(), function (source: string) {
            setData(source);
          });
          return;
        }

        element.linkSource && setData(element.linkSource);
        return;
      } else if (element.linkSource?.indexOf('file') === 0) {
        translateImgFileToBase64(element.linkSource, function (source: string) {
          Transforms.setNodes(editor, { source, linkSource: undefined } as Partial<Node>, { at: path });
        });
      } else if (isImageBase64(element.linkSource)) {
        console.log('isImageBase64');

        requestUploadImg(
          element.linkSource,
          source => {
            setImageNodeFromSource(editor, source, path);
          },
          docId
        );
      }

      return;
    }
    requestDownloadImg(docId, element);
  }, [source]);

  useEffect(() => {
    const docId = editor?.docId || '';

    getEditorEventEmitter(docId).emit('updateCommentTop', docId);

    return () => {};
  }, [data]);

  function requestDownloadImg(docId: string, element: any) {
    if (getCache(docId, 'options')?.isInternet || !element.source) {
      console.log('no resource, isInternet:', getCache(docId, 'options')?.isInternet, ', source:', source);
      return;
    }
    let myHeaders = new Headers();
    myHeaders.append('Cookie', 'principal_dev=TripDocs001;; GUID=09031045110005913542; Cookie_1=value');
    myHeaders.append('Content-Type', 'application/json');

    let raw = JSON.stringify({ type: 'get', path: element.source });

    let requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
    };

    const fetchUrl = getCache(docId, 'options')?.imgUploadUrl || '/tripdocs/api/docs/doc/uploadImg';
    fetch(fetchUrl, requestOptions)
      .then(response => response.json())
      .then(result => {
        result?.data?.base64 && setData(result.data.base64);
      })
      .catch(error => console.log('error', error));
  }

  const _onMouseDown = e => {
    console.log('[currentTarget]', e.currentTarget, e.target, e.target.tagName);
    console.log('[SlateImage] _onMouseDown', e);

    if (e.target.tagName == 'svg' || e.target.tagName == 'path') {
      e.stopPropagation();
      e.preventDefault();
      setShow(true);
      setShowPreview(true);
    } else if (e.target.tagName == 'IMG') {
      setShow(true);
    } else if (e.target.tagName === 'DIV' && e.target.classList.contains('imageContainer-inner-wrap')) {
      e.stopPropagation();
      e.preventDefault();
      setShow(false);

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
      setShow(false);
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
          'imageContainer-outer-wrap',
          css`
            background: none;
            border: 1px solid transparent;
          `
        )}
        id={element.id}
        onMouseDown={_onMouseDown}
        onDragOverCapture={e => {
          console.log('[image] onDragOverCapture', e.target);
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
              justify-content: ${textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'};
              align-items: center;
              margin: 16px 0;
            `,
            'ignore-toggle-readonly',
            'imageContainer-inner-wrap'
          )}
        >
          <MyImage
            element={element}
            editor={editor}
            data={data}
            isShow2={show}
            onDrawing={_onDrawing}
            isDrawing2={isDrawing}
            showPreview={showPreview}
            textAlign={textAlign}
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

function MyImage(props: any) {
  const { data, element, editor, isShow2, onDrawing, isDrawing2, textAlign, overlayRefDom, setOverlayRefDom } = props;
  const selected2 = useSelected();
  const focused2 = useFocused();

  const { isReadOnly } = useContext(TripdocsSdkContext);

  const [width, setWidth] = useState(element.width);

  function getMP(e: any) {
    let e = e || window.event;
    return {
      x: e.pageX || e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft),
      y: e.pageY || e.clientY + (document.documentElement.scrollTop || document.body.scrollTop),
    };
  }
  const [show, setShow] = useState(false);
  let target: { x: any; y: any } = null;
  const centerPoint = {
    x: 0,
    y: 0,
    point1: null,
    point4: null,
  };

  const [overlayRefRect, setOverlayRefRect] = useState(null);

  useEffect(() => {
    const dom = editor && ReactEditor.toDOMNode(editor, element);
    if (dom) {
      const imgContainerDom = dom.querySelector('.imageContainer');
      setOverlayRefDom(imgContainerDom);
      setOverlayRefRect(imgContainerDom.getBoundingClientRect());
    }
  }, [selected2, textAlign]);

  function start() {
    const ids = 'point';

    for (let i = 0; i < 4; i++) {
      const index = i + 1;
      const p = document.getElementById(element.id + ids + index);
      if (index === 1 || index === 4) {
        const key: any = ids + index;
        centerPoint[key] = p.getBoundingClientRect();
      }
      p.onmouseover = logMouseOver;
      p.onmouseout = logMouseOut;
      p.onmousedown = logMouseDown;
    }
  }

  function logMouseOver() {
    const textContent = 'MOUSE OVER detected';
    console.log(textContent);
  }

  function logMouseOut() {
    const textContent = 'MOUSE OUT detected';
    console.log(textContent);
  }

  function logMouseDown(e: any) {
    document.body.onmousemove = logMouseMove;
    let m = getMP(e);
    target = m;
    setShow(true);

    const textContent = 'MOUSE Down detected';
    console.log(textContent, target);
  }

  function exce(m: { y: number }) {
    start();
    centerPoint.x = (centerPoint.point1.x + centerPoint.point4.x) / 2;
    centerPoint.y = (centerPoint.point1.y + centerPoint.point4.y) / 2;
    const mWidth = centerPoint.point4.x - centerPoint.point1.x;
    const mHeight = centerPoint.point4.y - centerPoint.point1.y;
    let value = Math.abs(m.y - centerPoint.y) - mHeight / 2;
    console.log(centerPoint.point1.y + '+' + centerPoint.point4.y, 'get ', centerPoint.y, 'w and h', mWidth, mHeight, 'value', value);
    if (value > 0) {
      value = 5;
    } else if (value < 0) {
      value = -5;
    }
    let targetW = mWidth + value;
    if (targetW > 600) {
      targetW = 600;
    }
    if (targetW < 10) {
      targetW = 10;
    }
    if (document.body.onmousemove) {
      Transforms.setNodes(editor, { width: targetW } as any);
      setWidth(targetW);
    }
  }

  function debounce(func: { (m: any): void; apply?: any }, delay: number) {
    let timeout: NodeJS.Timeout;
    return function (e: any) {
      clearTimeout(timeout);
      let context = this,
        args = arguments;
      timeout = setTimeout(function () {
        console.log('----');
        func.apply(context, args);
      }, delay);
    };
  }
  const logMouseMove = (e: any) => {
    console.log('logMouseMove', target);
    if (target) {
      let m = getMP(e);
      let validate = debounce(function (m: any) {
        exce(m);
      }, 50);
      validate(m);
    }
  };
  function logMouseUp() {
    document.body.onmousemove = null;
    let textContent = 'MOUSE Up detected';
    target = null;
    setShow(false);
  }
  let isDrawing = false;
  let x = 0;
  let y = 0;
  let clientRect: any = {};
  let dom;
  let percent;
  let dataId;
  const isShow =
    editor?.selection &&
    ReactEditor.hasRange(editor, editor.selection) &&
    Range.isCollapsed(editor.selection) &&
    (isDrawing2 || (selected2 && focused2 && isShow2));
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
    width: element.width,
    height: element.height,
  };

  const [showPreview, setShowPreview] = useState(false);

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

      dom.querySelector('.title').innerHTML = Math.round(w) + ' X ' + Math.round(h);
      dom.style.lineHeight = dom.style.height;
    }
  };

  const fn2 = () => {
    document.removeEventListener('mousemove', fn);
    document.removeEventListener('mouseup', fn2);
    isDrawing = false;
    onDrawing(isDrawing);
    x = 0;
    y = 0;
    Transforms.setNodes(editor, { width: dom.style.width, height: dom.style.height } as any);
    clientRect = {};
    dom.style.display = 'none';
    dom.style.left = '0px';
    dom.style.top = '0px';
  };
  const _onMouseDown = e => {
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

  const _onClick = e => {
    console.log('[currentTarget]', e.currentTarget, e.target, e.target.tagName);
    setShowPreview(true);

    let p = e.currentTarget.parentElement.parentElement;
    let m = p.getElementsByClassName('ant-image-mask')[0];
    if (m) {
      m.click();
    } else {
      (function (p) {
        setTimeout(function () {
          p.getElementsByClassName('ant-image-mask')[0].click();
        });
      })(p);
    }
  };
  return (
    <div style={style0} className="imageContainer" contentEditable={false}>
      {data ? (
        <>
          <div
            contentEditable={false}
            data-ignore-slate
            className={cx('mask', 'ignore-toggle-readonly')}
            style={{
              background: 'black',
              opacity: 0.5,
              color: 'white',
              zIndex: 9,
              position: 'absolute',
              display: isShow ? 'block' : 'none',
              textAlign: 'center',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              contentEditable={false}
              data-ignore-slate
              className={cx(
                'preview',
                'Tripdocs-zoom-in',
                'ignore-toggle-readonly',
                css`
                  transform: translate(-50%, -50%);
                  top: 50%;
                  left: 50%;
                  position: absolute;
                  z-index: 500;
                `
              )}
              onMouseDown={_onClick}
            ></div>
            <div
              contentEditable={false}
              data-ignore-slate
              className={cx(
                'title',
                'ignore-toggle-readonly',
                css`
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -20%);
                `
              )}
            ></div>
            {isReadOnly ? null : element && element.id ? (
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
            ) : null}
          </div>
          <AntdImage preview={isReadOnly || showPreview} src={data} style={{ width: '100%', height: '100%' }} />
        </>
      ) : (
        <Empty />
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
          <GeneralOverlayButton
            title={f('download')}
            icon={<IconBtn className="Tripdocs-download" style={{ fontSize: '15px' }} />}
            onMouseDown={e => {
              e.preventDefault();
              const elDom = editor && ReactEditor.toDOMNode(editor, element);
              const imageDom: HTMLImageElement = elDom && elDom.querySelector('.ant-image > img');
              let imageSource = imageDom && imageDom.src;

              if (imageSource) {
                const imgSource = element.source || element.linkSource;
                const filename = imgSource.split('/').pop();
                if (imageSource.indexOf('http') > -1) {
                  translateImgToBase64Native(imageSource, function name(urlData: any) {
                    downloadFile(urlData, filename);
                  });
                } else {
                  downloadFile(imageSource, filename);
                }
              }
            }}
          />
          <GeneralOverlayButton
            title={f('copy')}
            icon={<IconBtn className="Tripdocs-duplicate" style={{ fontSize: '15px' }} />}
            onMouseDown={e => {
              e.preventDefault();
              copyImageForNode(editor, element);
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
    </div>
  );
}
export function copyImageForNode(editor: ReactEditor, element: any) {
  selectTargetForNode(editor, element);
  setTimeout(() => {
    document.execCommand('copy');
  });
}
export function copyImage(editor: ReactEditor, path: number[]) {
  selectTargetForPath(editor, path);
  setTimeout(() => {
    document.execCommand('copy');
  });
}
export function cutImage(editor: ReactEditor, path: number[]) {
  selectTargetForPath(editor, path);
  setTimeout(() => {
    document.execCommand('copy');
    Transforms.delete(editor, { at: path });
  });
}
export function selectTargetForPath(editor: any, tPath) {
  const startPoint = Editor.end(editor, Editor.previous(editor, { at: tPath })[1]);
  const endPoint = Editor.start(editor, Editor.next(editor, { at: tPath })[1]);
  Transforms.select(editor, { anchor: startPoint, focus: endPoint });
}
function selectTargetForNode(editor: any, element) {
  const path = ReactEditor.findPath(editor, element);
  selectTargetForPath(editor, path);
}
