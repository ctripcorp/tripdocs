import { Empty, Image as AntdImage, message, Tooltip } from 'antd';
import imageExtensions from 'image-extensions';
import isUrl from 'is-url';
import React, { useCallback, useEffect, useRef, useState, DragEvent } from 'react';
import { useContext, useRef } from 'react';
import { BaseElement, Editor, Element, Path, Range, Transforms } from '@src/components/slate-packages/slate';
import { Node } from '../../../slate-packages/slate';
import { ReactEditor, useFocused, useSelected } from '../../../slate-packages/slate-react';

import { ELTYPE, TABBABLE_TYPES } from '../config';
import { css, cx } from '@emotion/css';
import { getSlateSlection } from '@src/utils/getSelection';
import { getCache, getGlobalCache, setCache } from '@src/utils/cacheUtils';
import { getParentPathByType, getParentPathByTypes } from '../pluginsUtils/getPathUtils';
import { createUUID } from '@src/utils/randomId';
import { getEditorEventEmitter } from '../table/selection';
import { DownloadOutlined } from '@ant-design/icons';
import { downloadFile, insertFileObject } from '../File/filePlugins';
import { IconBtn } from '../Components';
import { f } from '@src/resource/string';
import { TripdocsSdkContext } from '@src/Docs';
import { Overlay } from '../OverlayComponents/Overlay';
import DragHandle, { getInlineInFragment } from '../OverlayComponents/DragHandle';
import { ResizeDot } from '../ResizeDot';
import { ImageInnerButtonWrap } from './ImageInnerButtonWrap';
import { addComment } from '../HoveringToolbar/buttons';
import { execUrl, getLocationPureUrl, isImageBase64, judgeIsPrivate } from './utils';
import { isInTable } from '../withHtml';

let _isDrawing = false;
let dragStop = false;

const calcInlineImageStorageKey = element => {
  const { source, linkSource } = element;
  const key = source || linkSource;
  return `inline-image-${key}`;
};

export const insertImage = (editor: any, source: string = '', paths: number[] = editor.selection?.focus?.path, linkSource?: string) => {
  let selection, path;
  const isInlineEditor = editor?.docId?.indexOf?.('#') !== -1;
  if (!isInlineEditor && (selection = getSlateSlection(editor.docId))) {
    path = selection.focus.path;
  }
  const element = {
    type: ELTYPE.INLINEIMAGE,
    source: undefined,
    linkSource: linkSource || source,
    children: [{ text: '' }],
    id: createUUID(),
  };
  delete element.source;

  try {
    const imagePath = isInlineEditor ? paths : getParentPathByTypes(editor, path, TABBABLE_TYPES);

    if (imagePath) {
      const node: any = Node.has(editor, imagePath) && Node.get(editor, imagePath);

      Transforms.select(editor, selection);
      Transforms.insertNodes(editor, [element, { text: '' }]);
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

export async function translateImgFileToBase64(docId: any, filePath: string, callback: Function) {
  const result: any = {};
  const getLocalImage = getCache(docId, 'options')?.getLocalImage;
  if (getLocalImage) {
    getLocalImage([filePath], (base64: any[]) => {
      Promise.resolve(callback(Array.isArray(base64) && base64[0]));
    });
  } else {
    Promise.resolve(callback(null));
  }
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

    const isLt10M = imageUrl.length / 1024 / 1024 < 15;
    if (!isLt10M) {
      message.error('图片大小应小于 10MB!');
      return;
    }
    callback(imageUrl);
  };
  img.src = url.toString();
}

export async function translateImgToBase64AndUpload(docId: string, url: string | ArrayBuffer, callback: Function) {
  const nUrl: string | ArrayBuffer = execUrl(url);

  const result = judgeIsPrivate(nUrl);
  if (result) {
    callback && callback(nUrl);
    return;
  }
  translatePureImgToBase64AndUpload(docId, nUrl, callback);
}
function limitImgSize(base64: string) {
  const isLt10M = base64.length / 1024 / 1024 < 15;
  if (!isLt10M) {
    console.error('Image LT 10M', base64.length, base64);
    message.error('图片大小应小于 10MB!');
    return true;
  }
  return false;
}

export async function translatePureImgToBase64AndUpload(docId: string, url: string | ArrayBuffer, callback: Function) {
  const isBase64Url =
    typeof url === 'string' &&
    (url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg') || url.startsWith('data:image/png') || url.startsWith('data:image/gif'));
  let canvas = document.createElement('canvas');
  if (isBase64Url && !limitImgSize(url)) {
    requestUploadImg(url, callback, docId);
    return;
  }

  let context = canvas.getContext('2d');
  let img: HTMLImageElement = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
    let URLData = canvas.toDataURL('image/png');
    const imageUrl = URLData;

    if (limitImgSize(imageUrl)) {
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
      message.error('文件不能大于 10mb');
      return;
    }

    readCopyFile(editor.docId, file, source => {
      insertImageFromSource(editor, source);
    });
  });
  input.click();
}

function requestUploadImg(imageUrl: string, callback: Function, docId: string) {
  const isInternet = getCache(docId, 'options')?.isInternet || getGlobalCache(docId)?.options?.isInternet;

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
      const url = location.protocol + '//' + location.host + '/' + result?.data?.source;
      callback && callback(url);
    })
    .catch(error => {
      message.destroy();
      message.error('图片上传失败，请检查网络后重试');
    });
}

function insertImageFromSource(editor: any, source: string) {
  const { docId } = editor;

  const isInternet = getCache(docId, 'options')?.isInternet || getGlobalCache(docId)?.options?.isInternet;

  if (isInternet) {
    insertImage(editor, undefined, undefined, source);
  } else {
    insertImage(editor, source);
  }
}

function setImageNodeFromSource(editor: any, element: any, source: string, path: number[]) {
  if (element && element.linkSource !== source && !judgeIsPrivate(element.linkSource) && judgeIsPrivate(source)) {
    console.log('setImageNodeFromSource', element.linkSource, source, !judgeIsPrivate(element.linkSource));

    Transforms.setNodes(editor, { source: undefined, linkSource: source } as Partial<Node>, { at: path });
    return;
  }

  if (
    element &&
    element.linkSource !== source &&
    !judgeIsPrivate(element.linkSource) &&
    source.startsWith('tripdoc/img/') &&
    typeof location !== 'undefined'
  ) {
    const url = getLocationPureUrl() + source.replace('tripdoc/img/', 'tripdocs/img/old/');
    console.log('setImageNodeFromSource', url, element.linkSource, source, !judgeIsPrivate(element.linkSource));

    setTimeout(() => {
      Transforms.setNodes(editor, { source: undefined, linkSource: url } as Partial<Node>, { at: path });
    }, 500);
    return;
  }
  if (
    element &&
    element.linkSource !== source &&
    !judgeIsPrivate(element.linkSource) &&
    source.startsWith('tripdocs/img/') &&
    typeof location !== 'undefined'
  ) {
    const url = getLocationPureUrl() + source;
    console.log('setImageNodeFromSource', url, element.linkSource, source, !judgeIsPrivate(element.linkSource));

    setTimeout(() => {
      Transforms.setNodes(editor, { source: undefined, linkSource: url } as Partial<Node>, { at: path });
    }, 500);
    return;
  }
}

function deserializeCopyImage(editor: any, files: any[]) {
  for (const file of files) {
    const [mime] = file.type.split('/');

    if (mime === 'image') {
      readCopyFile(editor.docId, file, source => {
        insertImageFromSource(editor, source);
      });
    }
  }
}

export function dragInsertLocalFiles(editor, files: any[]) {
  if (!editor.selection) {
    message.error('请选择一个位置插入图片');
    return;
  }
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log('[drag uploadLocal]', files, file);
    const { type } = file;
    if (isImageType(type)) {
      if (file.size > 10 * 1024 * 1024) {
        message.error('图片文件不能大于 10mb');
        return;
      }
      readCopyFile(editor.docId, file, source => {
        insertImageFromSource(editor, source);
      });
    } else {
      insertFileObject(editor, file);
    }
  }
}

export function isImageType(type) {
  return type.startsWith('image');
}

export function readCopyFile(docId: string, file: any, callback: Function) {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    const url = reader.result;
    console.log('[readCopyFile] load url: ', file, url);
    translatePureImgToBase64AndUpload(docId, url, function (source: string) {
      callback && callback(source);
    });
  });

  reader.readAsDataURL(file);
}

export const withInlineImages = (editor: ReactEditor) => {
  const { isVoid, insertData, deleteBackward, deleteForward, deleteFragment, isInline, apply, setFragmentData } = editor;
  editor.isInline = (element: BaseElement) => {
    return (element as any).type === ELTYPE.INLINEIMAGE ? true : isInline(element);
  };

  editor.insertData = (data: any) => {
    const text = data.getData('text/plain');
    const html = data.getData('text/html');
    if (html) {
      if (html.indexOf('table') > -1) {
        insertData(data);
        return editor;
      }
    }

    const { files } = data;

    if (files && files.length > 0) {
      deserializeCopyImage(editor, files);
    } else if (isImageUrl(text)) {
      translateImgToBase64AndUpload(editor.docId, text.trim(), function (source: string) {
        insertImageFromSource(editor, source);
      });
    } else if (isImageBase64(text)) {
      translatePureImgToBase64AndUpload(editor.docId, text, function (source: string) {
        insertImageFromSource(editor, source);
      });
    } else {
      insertData(data);
    }
  };

  editor.setFragmentData = (data: DataTransfer) => {
    if (editor.selection && ReactEditor.hasRange(editor, editor.selection) && Range.isCollapsed(editor.selection)) {
      const [inlineImageNodeEntry] = Editor.nodes(editor, { at: editor.selection, match: (n: any) => n.type === ELTYPE.INLINEIMAGE });
      if (inlineImageNodeEntry) {
        const [node, path] = inlineImageNodeEntry;
        const dom = ReactEditor.toDOMNode(editor, node);
        const img = dom.querySelector('img');
        data.setData('text/html', img.outerHTML);
        return;
      }
    }
    setFragmentData(data);
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
}

export const SlateInlineImage: React.FC<any> = ({ attributes, children, element, editor }: ImageProps) => {
  const { source, linkSource: lSource } = element;
  const { isReadOnly, docId, focusedRangeId, setFocusedRangeId } = useContext(TripdocsSdkContext);
  const selected = useSelected();
  const focused = useFocused();
  const [data, setData] = useState(null);
  const [isFocused, setIsFocused] = useState(focused || selected);

  const [isDrawing, setIsDrawing] = useState(false);
  const [thisImageRangeId, setThisImageRangeId] = useState('');
  const [hasComment, setHasComment] = useState(false);
  const isInlineEditor = docId?.indexOf?.('#') !== -1;

  useEffect(() => {
    if (typeof window !== 'undefined' && editor) {
      const commentData = window.tripdocs.editorsMap[docId].commentData;
      if (commentData) {
        if (commentData.length > 0) {
          const jsonRangeId_arr = commentData.map(item => item && JSON.parse(item.rangeId));
          const elementPath = ReactEditor.findPath(editor, element);
          if (!elementPath) return;
          const parentEntry: any = Editor.parent(editor, elementPath);
          if (!parentEntry) return;
          const [parentNode] = parentEntry;
          const inlineImage_arr = jsonRangeId_arr.filter(
            item =>
              item.commentType === ELTYPE.INLINEIMAGE &&
              item.anchorId === parentNode.anchorId &&
              Path.isAncestor(elementPath, item.selection.anchor.path)
          );

          if (inlineImage_arr.length > 0) {
            setHasComment(true);
            setThisImageRangeId(JSON.stringify(inlineImage_arr[0]));
            return;
          }
        }

        setHasComment(false);
      }
    }
  }, [window?.tripdocs?.editorsMap[docId]?.commentData]);

  const [isOverElement, setIsOverElement] = useState(false);
  const [overlayRefDom, setOverlayRefDom] = useState(null);

  useEffect(() => {
    if (!selected) {
      setIsFocused(false);
    }
  }, [selected]);

  useEffect(() => {
    console.log('[SlateInlineImage] paste init');
    const handleClickOutside = (event: any) => {
      const { target } = event;
      if (overlayRefDom && overlayRefDom.contains(target)) {
        return;
      } else {
        setIsFocused(false);
      }
    };

    if (isReadOnly) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isReadOnly, overlayRefDom]);

  useEffect(() => {
    if (isReadOnly) {
      return;
    }
    const docId = editor?.docId || '';
    let isMounted = true;
    const path = ReactEditor.findPath(editor, element);
    if (element.linkSource) {
      if (!element) {
        return;
      }
      if (isUrl(element.linkSource)) {
        let url = element.linkSource.trim();

        if (!judgeIsPrivate(element.linkSource)) {
          translateImgToBase64AndUpload(docId, url, function (source: string) {
            setImageNodeFromSource(editor, element, source, path);
          });
        }

        return;
      } else if (element.linkSource?.indexOf('file') === 0) {
        translateImgFileToBase64(docId, element.linkSource, function (source: string) {
          if (source) {
            Transforms.setNodes(editor, { linkSource: source } as Partial<Node>, { at: path });
          }
        });
      } else if (isImageBase64(element.linkSource)) {
        requestUploadImg(
          element.linkSource,
          source => {
            if (isMounted) setImageNodeFromSource(editor, element, source, path);
          },
          docId
        );
      }

      return;
    }

    setImageNodeFromSource(editor, element, source, path);
    return () => {
      isMounted = false;
    };
  }, [source, lSource]);

  const _onMouseDown = e => {
    if (!editor) {
      return;
    }
    const path = ReactEditor.findPath(editor, element);
    if (!Editor.hasPath(editor, path)) {
      return;
    }

    selectInlineImage(editor, element);

    if (e.target.tagName === 'DIV' && e.target.classList.contains('imageContainer-inner-wrap')) {
      e.stopPropagation();
      e.preventDefault();
    } else {
    }
  };

  const handleDragStartCapture = useCallback(e => {
    let { target } = e;
    if (isReadOnly) return;
    const el = document.querySelector(`div[id="${element.id}"]`);
    console.log('drag start ===> ', e);
    Transforms.deselect(editor);

    let path = ReactEditor.findPath(editor, element);
    const dt = new DataTransfer();
    if (path) {
      const range = Editor.range(editor, path);
      Transforms.select(editor, range);
      const fragment = getInlineInFragment(editor, path);
      console.log('DragHandle 1', range, path, fragment);
      console.log('DragHandle 1.5', range, Node.fragment(editor, range));
      dt.setData('text/html', JSON.stringify(fragment));
      dt.setData('text/plain', JSON.stringify(fragment));
    }
    const dragDataTransfer = {
      dragData: dt,
      dragOriginalPath: path,
      isInline: true,
    };
    setCache(docId, 'drag-data-transfer', dragDataTransfer);
    e.dataTransfer.setData('text/html', JSON.stringify(editor.getFragment()));
    e.dataTransfer.setData('text/plain', JSON.stringify(editor.getFragment()));
    e.dataTransfer.setDragImage(el, 0, 0);
    e.dataTransfer.effectAllowed = 'all';
    dt.effectAllowed = 'all';
    ReactEditor.setFragmentData(editor, e.dataTransfer);
    console.log('DragHandle 2', e.dataTransfer, dt, editor.getFragment());
  }, []);

  const handleDrag = e => {
    if (isReadOnly) return;
    const scrollWrap: HTMLElement = getCache(docId, 'editorWrapDom');
    const scrollWrapRect = scrollWrap.getBoundingClientRect();
    dragStop = true;
    if (e.clientY < scrollWrapRect.top + Math.floor(scrollWrapRect.height * 0.15)) {
      dragStop = false;
      scroll(-10);
    }
    if (e.clientY > scrollWrapRect.bottom - Math.floor(scrollWrapRect.height * 0.15)) {
      dragStop = false;
      scroll(10);
    }
  };

  const scroll = step => {
    const scrollWrap: HTMLElement = getCache(docId, 'editorWrapDom');
    if (scrollWrap) {
      const scrollY = scrollWrap.scrollTop;
      scrollWrap.scrollTo({ top: scrollY + step });
    }
  };

  function handleDragEnd(e: DragEvent<HTMLDivElement>) {
    if (isReadOnly) return;
    console.log('dragEnd', e);
    dragStop = true;
  }

  return (
    <>
      <div
        {...attributes}
        contentEditable={false}
        data-ignore-slate
        className={cx(
          'ignore-toggle-readonly',
          'imageContainer-outer-wrap',
          isReadOnly
            ? null
            : css`
                &::before {
                  content: '';
                  background-color: ${selected ? 'rgba(180, 213, 254, 0.5)' : null};
                  display: ${!selected ? 'none' : 'block'};
                  width: 100%;
                  height: 100%;
                  position: absolute;
                  z-index: 8;
                  pointer-events: none;
                }
              `
        )}
        style={{
          outline: hasComment ? '3px solid rgba(250, 173, 20, 0.35)' : 'none',
          border: hasComment ? '1px solid rgba(250, 173, 20, 0.35)' : '1px solid transparent',
          background: 'none',
          display: 'inline-block',
          margin: '5px',
          userSelect: 'none',
          maxWidth: 'calc(100% - 12px)',
          position: 'relative',
        }}
        id={element.id}
        onMouseDown={_onMouseDown}
        onDragOverCapture={e => {
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
        draggable
        onDragStart={handleDragStartCapture}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        <div
          contentEditable={false}
          data-ignore-slate
          className={cx(
            css`
              display: flex;
              flex-direction: row;
              align-items: center;
              position: relative;
            `,
            'ignore-toggle-readonly',
            'imageContainer-inner-wrap'
          )}
        >
          <MyImage
            element={element}
            editor={editor}
            isFocused={isFocused}
            setIsFocused={setIsFocused}
            thisImageRangeId={thisImageRangeId}
            setIsDrawing={setIsDrawing}
            isDrawing={isDrawing}
            overlayRefDom={overlayRefDom}
            setOverlayRefDom={setOverlayRefDom}
          />
          <span className={cx('ignore-toggle-readonly')} contentEditable={false} style={{ userSelect: 'none', display: 'none' }}>
            {children}
          </span>
        </div>
      </div>
      {!isInlineEditor && (
        <DragHandle
          editor={editor}
          isOverElement={isOverElement}
          docId={editor?.docId || ''}
          overlayRefDom={overlayRefDom}
          findDomToEl={dom => dom?.closest('[data-slate-node="element"]')?.children[0].children[0]}
        />
      )}
    </>
  );
};

function MyImage(props: any) {
  const {
    element,
    editor,
    isFocused,
    setIsFocused,
    isSelected,
    setIsSelected,
    setIsDrawing,
    isDrawing,
    overlayRefDom,
    setOverlayRefDom,
    thisImageRangeId,
  } = props;

  const ref = useRef(null);
  const {
    docId,
    isReadOnly,
    isMobile,
    isInElectron,
    setCurRangeId,
    setSideCommentRowNum,
    setIdenticalSelectionRangeId,
    setWIPCommentRangeId,
    setFocusedRangeId,
  } = useContext(TripdocsSdkContext);

  const innerMaskRef = useRef(null);
  const [width, setWidth] = useState(element.width);
  const [metrics, setMetrics] = useState({ width: 0, height: 0 });
  const [showOverlay, setShowOverlay] = useState(isFocused && !isDrawing);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [isOverlayScrolled, setIsOverlayScrolled] = useState(false);
  const [isOnVisibleChangeActivated, setIsOnVisibleChangeActivated] = useState(false);

  const isInlineEditor = docId?.indexOf?.('#') !== -1;

  useEffect(() => {
    const scrollContainerRefDom = document.getElementById(`editor-content-wrap-${docId}`);
    if (isFocused) {
      setShowOverlay(true);
      handleScrollTop();
      scrollContainerRefDom?.addEventListener('scroll', handleScrollTop);
    } else {
      setShowOverlay(false);
    }
    return () => {
      scrollContainerRefDom?.removeEventListener('scroll', handleScrollTop);
    };
  }, [isFocused]);

  function handleScrollTop() {
    const scrollContainerRefDom: HTMLElement = document.getElementById(`editor-content-wrap-${docId}`);
    const image: HTMLElement = ref?.current;
    if (!scrollContainerRefDom || !image) return;
    const containerRect = scrollContainerRefDom.getBoundingClientRect();
    const imageRect = (image as HTMLElement).getBoundingClientRect();

    const { top: ctnTop, bottom: ctnBottom } = containerRect;
    const { top: imgTop, bottom: imgBottom } = imageRect;
    if (isFocused) {
      if (imgTop - ctnTop < 45) {
        setIsOverlayScrolled(true);
      } else {
        setIsOverlayScrolled(false);
      }
      if (imgBottom - ctnTop < 0) {
        setShowOverlay(false);
      } else {
        setShowOverlay(true);
      }
    }
  }

  function getMP(e: any) {
    let e = e || window.event;
    return {
      x: e.pageX || e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft),
      y: e.pageY || e.clientY + (document.documentElement.scrollTop || document.body.scrollTop),
    };
  }

  let target: { x: any; y: any } = null;
  const centerPoint = {
    x: 0,
    y: 0,
    point1: null,
    point4: null,
  };

  const [overlayRefRect, setOverlayRefRect] = useState(null);

  const updateOverlay = useCallback(() => {
    const dom = editor && ReactEditor.toDOMNode(editor, element);
    if (dom) {
      const imgContainerDom = dom.querySelector('.imageContainer');
      setOverlayRefDom(imgContainerDom);
      setOverlayRefRect(imgContainerDom.getBoundingClientRect());
    }
  }, [editor, element]);

  useEffect(() => {
    updateOverlay();
  }, []);

  useEffect(() => {
    if (editor && element.data) {
      const path = ReactEditor.findPath(editor, element);
      Transforms.setNodes(editor, { data: null } as Partial<Node>, { at: path });
    }
  }, [element?.data]);

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
  }

  function logMouseOut() {
    const textContent = 'MOUSE OUT detected';
  }

  function logMouseDown(e: any) {
    document.body.onmousemove = logMouseMove;
    let m = getMP(e);
    target = m;

    const textContent = 'MOUSE Down detected';
  }

  function exce(m: { y: number }) {
    start();
    centerPoint.x = (centerPoint.point1.x + centerPoint.point4.x) / 2;
    centerPoint.y = (centerPoint.point1.y + centerPoint.point4.y) / 2;
    const mWidth = centerPoint.point4.x - centerPoint.point1.x;
    const mHeight = centerPoint.point4.y - centerPoint.point1.y;
    let value = Math.abs(m.y - centerPoint.y) - mHeight / 2;

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
      const path = ReactEditor.findPath(editor, element);
      Transforms.setNodes(editor, { width: targetW } as any, { at: path });
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
        func.apply(context, args);
      }, delay);
    };
  }
  const logMouseMove = (e: any) => {
    if (target) {
      let m = getMP(e);
      let validate = debounce(function (m: any) {
        exce(m);
      }, 50);
      validate(m);
    }
  };
  let x = 0;
  let y = 0;
  let clientRect: any = {};
  let dom: HTMLElement;
  let percent;
  let dataId;

  let isMax = false;

  function limitSize(width, height, inTable, cellWidth, editorWidth) {
    let _width = width;
    let _height = height;
    if (inTable) {
      if (width > cellWidth - 6) {
        _width = cellWidth - 12;
        _height = height / (width / _width);
        isMax = true;
      } else {
        isMax = false;
      }
    } else {
      if (width > editorWidth - 6) {
        _width = editorWidth - 12;
        _height = height / (width / _width);
        isMax = true;
      } else {
        isMax = false;
      }
    }
    return [_width, _height];
  }
  const inTable = editor && isInTable(editor);

  const handleMouseMove = (e: any) => {
    if (_isDrawing === true) {
      let editorDom = document.getElementById(`editorarea-${docId}`);
      let editorWidth = editorDom.getBoundingClientRect().width - 120;
      let cellEntry = null;
      let cellWidth;
      if (editor && inTable) {
        cellEntry = Editor.above(editor, { at: editor.selection, match: (n: any) => n.type === ELTYPE.TABLE_CELL });
        if (cellEntry) {
          let cellDom = ReactEditor.toDOMNode(editor, cellEntry[0]);
          cellWidth = cellDom.getBoundingClientRect().width - 12;
        }
      }
      console.log('[x,y]', editorDom.getBoundingClientRect(), editorWidth, e.clientX - x, e.clientY - y, isMax);
      let diffw = e.clientX - x;
      let diffh = e.clientY - y;
      let w = clientRect.width;
      let h = clientRect.height;
      let _left = 0;
      let _top = 0;
      let _width = 0;
      let _height = 0;

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
        [_width, _height] = limitSize(_width, _height, inTable, cellWidth, editorWidth);
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
        [_width, _height] = limitSize(_width, _height, inTable, cellWidth, editorWidth);
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
        [_width, _height] = limitSize(_width, _height, inTable, cellWidth, editorWidth);
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
        [_width, _height] = limitSize(_width, _height, inTable, cellWidth, editorWidth);
      }
      if (isMax) {
        return;
      }
      dom.style.left = _left + 'px';
      dom.style.top = _top + 'px';
      dom.style.width = _width + 'px';
      dom.style.height = _height + 'px';
      setMetrics({
        width: Math.round(_width),
        height: Math.round(_height),
      });
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    _isDrawing = false;
    setIsDrawing(_isDrawing);
    isMax = false;
    setTimeout(() => {
      setShowOverlay(true);
      updateOverlay();
    }, 200);
    x = 0;
    y = 0;
    const path = ReactEditor.findPath(editor, element);
    Transforms.setNodes(editor, { width: dom.style.width, height: dom.style.height } as any, { at: path });
    clientRect = {};
    dom.style.left = '0px';
    dom.style.top = '0px';
    dom.style.removeProperty('width');
    dom.style.removeProperty('height');
  };

  const _onMouseDown = e => {
    e.preventDefault();
    e.stopPropagation();
    const innerMask = innerMaskRef.current;
    if (innerMask) {
      innerMask.style.maxWidth = 'none';
    }

    x = e.clientX;
    y = e.clientY;
    _isDrawing = true;
    setIsDrawing(_isDrawing);
    setShowOverlay(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    dom = e.target.parentNode;

    dom.style.display = 'block';
    clientRect = dom.getBoundingClientRect();
    percent = clientRect.height / clientRect.width;
    dataId = e.target.getAttribute('data-id');
  };
  const _onMouseUp = e => {
    const innerMask = innerMaskRef.current;
    if (innerMask) {
      innerMask.style.removeProperty('max-width');
    }
  };
  const _onMouseMove = e => {};

  function translateOldSource(source: string, linkSource: string) {
    if (source && source.startsWith('tripdoc/img/') && typeof location !== 'undefined') {
      const url = getLocationPureUrl() + source.replace('tripdoc/img/', 'tripdocs/img/old/');

      return url;
    }
    return linkSource;
  }
  function translateLinkSource(linkSource: string) {
    const link = linkSource.replace(/http:|https:/, '');
    const curL = getLocationPureUrl();
    if (link.indexOf(curL) === 0) {
      return link;
    }
    return linkSource;
  }
  const imageURL = judgeIsPrivate(element.linkSource, isReadOnly)
    ? translateLinkSource(element.linkSource)
    : translateOldSource(element.source, element.linkSource);

  function handlerCopy(e: any) {
    e.preventDefault();
    e.stopPropagation();

    if (isReadOnly) {
      try {
        const input = document.createElement('input');
        input.oncopy = function (e: any) {
          e.preventDefault();

          e.clipboardData.setData('text/html', `<img src="${imageURL}" width="${element.width}" height="${element.height}" />`);
        };
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      } catch (error) {}
    } else {
      selectInlineImage(editor, element);
      setTimeout(() => {
        document.execCommand('copy');
      });
    }
  }
  return (
    <div
      ref={ref}
      style={{
        boxShadow: 'none',
        position: 'relative',
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      className={cx('imageContainer', editor ? 'show-outline' : null)}
      contentEditable={false}
      onMouseEnter={e => {}}
    >
      {!!imageURL ? (
        <>
          <div
            contentEditable={false}
            data-ignore-slate
            className={cx('image-inner-mask', 'ignore-toggle-readonly')}
            ref={innerMaskRef}
            style={{
              background: isDrawing ? 'rgba(0,0,0,.5)' : null,
              outline: editor && (isFocused || isDrawing) ? '1px solid rgb(24, 144, 255)' : null,
              color: 'white',
              zIndex: 9,
              position: 'absolute',
              display: editor && element && (isFocused || isDrawing) ? 'block' : 'none',
              textAlign: 'center',
              justifyContent: 'center',
              alignItems: 'center',
              pointerEvents: 'none',
              inset: 0,
            }}
          >
            {!editor || isReadOnly ? null : element ? (
              <ResizeDot
                isResizing={isDrawing}
                visible={isFocused || isDrawing}
                elementId={
                  element.id ||
                  (element.source && encodeURIComponent(element.source)) ||
                  (element.linkSource && encodeURIComponent(element.linkSource))
                }
                metrics={metrics}
                onMouseDown={_onMouseDown}
                onMouseUp={_onMouseUp}
                onMouseMove={_onMouseMove}
              />
            ) : null}
          </div>

          <AntdImage
            wrapperStyle={{
              maxWidth: element.width,
              maxHeight: element.height,
            }}
            onMouseDown={e => {
              console.log('ANTD image MOUSEDOWN', e.target);
              if (e.button === 0) {
                setIsFocused(true);
              }
              setTimeout(() => {
                thisImageRangeId && setFocusedRangeId(thisImageRangeId);
              }, 400);
            }}
            contentEditable={false}
            preview={{
              visible: previewVisible,
              src: imageURL,
              mask: null,
              onVisibleChange: (value, prevValue) => {
                console.log('{previewVisible}', isFocused, previewVisible, value);
                if (isOnVisibleChangeActivated) {
                  setPreviewVisible(value);
                  setIsOnVisibleChangeActivated(false);
                }
              },
            }}
            src={imageURL}
            style={{
              width: '100%',
              height: '100%',
              userSelect: isReadOnly ? 'all' : 'none',
              objectFit: 'cover',
              objectPosition: 'left',
            }}
          />
          {!isDrawing && !isMobile && (
            <ImageInnerButtonWrap
              editor={editor}
              setPreviewVisible={visible => {
                if (visible === true) {
                  setIsOnVisibleChangeActivated(true);
                }
                setPreviewVisible(visible);
              }}
            />
          )}
        </>
      ) : (
        <Empty style={{ width: '100%', height: '100%', userSelect: 'none' }} />
      )}
      {!isInlineEditor && (
        <Overlay
          show={showOverlay && !!imageURL}
          docId={editor?.docId || ''}
          overlayRefDom={overlayRefDom}
          left={overlayRefRect?.left}
          placement={'top'}
          distance={40}
          bordered
          overlayWrapStyle={{
            position: isFocused && isOverlayScrolled ? 'fixed' : null,
          }}
          overlayWrapClassName={
            isFocused && isOverlayScrolled
              ? css`
                  top: 60px !important;
                `
              : ''
          }
        >
          <div
            className={cx(
              'overlay-button-wrap',
              css`
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 2px;
              `
            )}
          >
            <ImageOverlayButton
              title={f('download')}
              isMobile={isMobile}
              icon={<DownloadOutlined style={{ fontSize: '15px' }} onClick={undefined} />}
              onMouseDown={e => {
                e.preventDefault();
                const elDom = editor && ReactEditor.toDOMNode(editor, element);
                const imageDom: HTMLImageElement = elDom && elDom.querySelector('.ant-image > img');
                let imageSource = imageDom && imageDom.src;

                if (imageSource) {
                  const filename = element?.source?.split('/')?.pop() || 'image' + new Date().getTime().toString(32);
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
            <ImageOverlayButton
              title={f('copy')}
              isMobile={isMobile}
              icon={<IconBtn className="Tripdocs-duplicate" style={{ fontSize: '15px' }} />}
              onMouseDown={e => {
                handlerCopy(e);
              }}
            />
            {!isReadOnly && (
              <ImageOverlayButton
                title={f('cut')}
                isMobile={isMobile}
                icon={<IconBtn className="Tripdocs-cut" style={{ fontSize: '15px' }} />}
                onMouseDown={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  selectInlineImage(editor, element);
                  setTimeout(() => {
                    document.execCommand('copy');
                    const path = ReactEditor.findPath(editor, element);
                    if (path) {
                      Transforms.removeNodes(editor, { at: path });
                    }
                  });
                }}
              />
            )}
            {!isReadOnly && (
              <ImageOverlayButton
                title={f('delete')}
                isMobile={isMobile}
                icon={<IconBtn className="Tripdocs-delete" style={{ fontSize: '15px' }} />}
                onMouseDown={e => {
                  e.preventDefault();
                  const path = ReactEditor.findPath(editor, element);
                  if (path) {
                    Transforms.removeNodes(editor, { at: path });
                  }
                }}
              />
            )}
            <ImageOverlayButton
              title={f('addComment')}
              isMobile={isMobile}
              icon={<IconBtn className="Tripdocs-comment_add" style={{ fontSize: '15px' }} />}
              onMouseDown={e => {
                e.preventDefault();
                selectInlineImage(editor, element);
                addComment(
                  editor,
                  setSideCommentRowNum,
                  setCurRangeId,
                  `editorarea-${docId}`,
                  setIdenticalSelectionRangeId,
                  true,
                  setWIPCommentRangeId
                );
              }}
            />
            {isMobile && (
              <ImageOverlayButton
                title={f('zoomIn')}
                isMobile={isMobile}
                icon={<IconBtn className="Tripdocs-zoom_in" style={{ fontSize: '15px' }} />}
                onMouseDown={e => {
                  e.preventDefault();
                  setIsOnVisibleChangeActivated(true);
                  setPreviewVisible(true);
                }}
              />
            )}
          </div>
        </Overlay>
      )}
    </div>
  );
}
function selectInlineImage(editor, element) {
  const path = ReactEditor.findPath(editor, element);

  const startPoint = Editor.end(editor, Editor.previous(editor, { at: path })[1]);
  const endPoint = Editor.start(editor, Editor.next(editor, { at: path })[1]);
  Transforms.select(editor, { anchor: startPoint, focus: endPoint });
}

export function getInlineImageSelectForPath(editor, path) {
  const startPoint = Editor.end(editor, Editor.previous(editor, { at: path })[1]);
  const endPoint = Editor.start(editor, Editor.next(editor, { at: path })[1]);
  return { anchor: startPoint, focus: endPoint };
}

export const ImageOverlayButton = props => {
  const { title, icon, isMobile, ...rest } = props;
  return !isMobile ? (
    <Tooltip title={title}>
      <div
        className={cx(
          'image-overlay-button',
          css`
            z-index: 1;
            background: white;
            border-radius: 4px;
            width: 28px;
            height: 28px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            &:hover {
              background: #f5f5f5;
            }
          `
        )}
        {...rest}
      >
        {icon}
      </div>
    </Tooltip>
  ) : (
    <div
      className={cx(
        'image-overlay-button',
        css`
          z-index: 1;
          background: white;
          border-radius: 4px;
          width: 28px;
          height: 28px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          &:hover {
            background: #f5f5f5;
          }
        `
      )}
      {...rest}
    >
      {icon}
    </div>
  );
};
