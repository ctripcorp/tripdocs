import { css, cx } from '@emotion/css';
import { Node, Range, Transforms } from '@src/components/slate-packages/slate';
import { ReactEditor, useSelected } from '@src/components/slate-packages/slate-react';
import { f } from '@src/resource/string';
import { getCache, getGlobalCache } from '@src/utils/cacheUtils';
import { createUUID } from '@src/utils/randomId';
import { message } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TripdocsSdkContext } from '../../../../Docs';
import myFetch from '../../../../utils/request';
import { insertCard } from '../Card';
import { IconBtn } from '../Components';
import { ELTYPE } from '../config';
import { translateImgToBase64Native } from '../Image/imagePlugins';
import { Overlay } from '../OverlayComponents/Overlay';
import { GeneralOverlayButton } from '../OverlayComponents/Overlay/GeneralOverlayButton';
import { getParentPathByType } from '../pluginsUtils/getPathUtils';

const setFile = (editor: any, data: any, file_name: string, docId: string) => {
  const url = `/tripdocs/api/docs/source/set`;
  const docContent = data;
  let headers = new Headers();
  headers.append('Content-Type', 'application/json');

  const remoteDre = `tripdoc/file/${docId}/${file_name}.json`;

  const options = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      source: remoteDre,
      doc: docContent,
      env: 'fws',
    }),
  };

  myFetch(url, options).then((res: any) => {
    message.success('文档内容已保存');
    const obj: any = {
      type: ELTYPE.FILE,
      fileName: file_name,
      source: res.docContent.name.slice(4),
      children: [
        {
          text: '',
        },
      ],
      id: createUUID(),
    };
    insertCard(editor, obj);
  });
};

const handleDownload = (title: string, dataUrl: string) => {
  forceDownloadFile(dataUrl, `${title}`);
};

function forceDownload(blob, filename) {
  let a = document.createElement('a');
  a.download = filename;
  a.href = blob;

  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function forceDownloadFile(url, filename) {
  if (!filename) filename = url.split('\\').pop().split('/').pop();

  fetch(url, {
    headers: new Headers({
      Origin: location.origin,
    }),
    mode: 'cors',
  })
    .then((response: any) => {
      return response.blob();
    })
    .then(blob => {
      let blobUrl = window.URL.createObjectURL(blob);

      forceDownload(blobUrl, filename);
    })
    .catch(e => console.error(e));
}

export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.download = filename;
  link.click();
};

export function insertFile(editor: any, docId: string) {
  const input = document.createElement('input');
  input.type = 'file';

  input.addEventListener('change', (event: any) => {
    const file = event.target.files[0];
    insertFileObject(editor, file);
  });
  input.click();
}

export function formatFileSize(size) {
  return size > 1024 * 1024 ? Math.round(size / 1024 / 1024) + 'M' : size > 1024 ? Math.round(size / 1024) + 'K' : size + 'B';
}

function getFile(params: any, docId: string) {
  const { url, fileName } = params;
  const useTripdocsFileUpload: boolean = getCache(docId, 'options')?.useTripdocsFileUpload;

  if (useTripdocsFileUpload) {
    const urlSrc = `/tripdocs/api/docs/source/get`;
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    const options = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ source: params.url, env: 'fws' }),
    };

    myFetch(urlSrc, options).then((res: any) => {
      forceDownload(res.docContent, fileName);
    });
    return;
  }
  if (url && (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg'))) {
    translateImgToBase64Native(url, function name(urlData: any) {
      downloadFile(urlData, fileName);
    });
  } else {
    downloadFile(url, fileName);
  }
}

export const FileComponent = ({ attributes, children, element, editor }) => {
  const { docId, isReadOnly, isMobile } = React.useContext(TripdocsSdkContext);
  const fileRef = useRef(null);
  const isSelected = useSelected();

  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayRefDom, setOverlayRefDom] = useState(null);
  const [overlayRefRect, setOverlayRefRect] = useState(null);

  const handleClickOutside = useCallback(
    (event: any) => {
      const file: Element = fileRef?.current;
      if (file && file.contains(event.target)) {
        setShowOverlay(true);
      } else {
        setShowOverlay(false);
      }
    },
    [fileRef?.current]
  );

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isReadOnly]);

  const updateOverlay = useCallback(() => {
    const fileDom = fileRef?.current;
    if (fileDom) {
      setOverlayRefDom(fileDom);
      setOverlayRefRect(fileDom.getBoundingClientRect());
      const { left, top, bottom, right } = fileDom.getBoundingClientRect();
    }
  }, [fileRef?.current]);

  useEffect(() => {
    if (fileRef?.current) {
      updateOverlay();
    }
  }, [fileRef?.current]);

  useEffect(() => {
    if (fileRef?.current) {
      const div = fileRef.current;

      div.querySelectorAll("[contenteditable='true']").forEach((item: any) => {
        item.setAttribute('contenteditable', 'false');
      });
      updateOverlay();
    }
  }, [children]);

  return (
    <>
      <div
        {...attributes}
        id={element.id}
        ref={fileRef}
        data-ignore-slate
        contentEditable={false}
        suppressContentEditableWarning
        className="ignore-toggle-readonly"
        onMouseEnter={e => {
          const isMousePressed = getCache(docId, 'mouseIsPress');
          if (isMousePressed && editor.selection && ReactEditor.hasRange(editor, editor.selection) && Range.isExpanded(editor.selection)) {
            const { anchor } = editor.selection;
            const path = ReactEditor.findPath(editor, element);
            const cardPath = getParentPathByType(editor, path, ELTYPE.CARD);

            if (cardPath) {
              const focus = { path: [...cardPath, 2], offset: 0 };
              Transforms.select(editor, { anchor, focus });
            }
          }
        }}
      >
        <div
          data-ignore-slate
          contentEditable={false}
          suppressContentEditableWarning
          className={cx(
            'ignore-toggle-readonly',
            css`
              color: #096dd9;
              cursor: pointer;
              box-shadow: 0px 0px 2px 0px #ddd;
              margin: 12px 0;
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
          style={{ backgroundColor: isSelected ? '#f0f0f0' : null }}
          onMouseDown={e => {
            e.preventDefault();
            e.stopPropagation();
            if (editor) {
              const isEmptyFile = element.name === '#empty_file';
              const path = ReactEditor.findPath(editor, element);
              Transforms.select(editor, path);

              const cardPath = getParentPathByType(editor, path, ELTYPE.CARD);
              Transforms.select(editor, cardPath);
              Transforms.collapse(editor, { edge: 'end' });

              if (!isEmptyFile) {
                setShowOverlay(true);
              }
              return;
            }
          }}
        >
          <span>{element.fileName}</span>
          {element.fileSize && (
            <span
              contentEditable={false}
              className={css`
                margin-left: 10px;
                color: #a0a0a0;
                font-size: 12px;
              `}
            >
              {element.fileSize}
            </span>
          )}
          <span className={cx('ignore-toggle-readonly')} contentEditable={false} style={{ display: 'none', userSelect: 'none' }}>
            {children}
          </span>
        </div>
      </div>
      <Overlay
        show={showOverlay}
        docId={editor?.docId || ''}
        overlayRefDom={overlayRefDom}
        left={overlayRefRect?.left}
        placement={'top'}
        distance={40}
        bordered
      >
        <GeneralOverlayButton
          title={f('download')}
          icon={<IconBtn className="Tripdocs-align_bottom" style={{ fontSize: '15px' }} />}
          onMouseDown={e => {
            e.preventDefault();
            e.stopPropagation();
            if (isMobile) {
              message.info('请前往桌面端下载');
              return;
            }
            getFile({ url: element.url || element.source, fileName: element.fileName }, docId);
          }}
        />
        {!isReadOnly && (
          <GeneralOverlayButton
            title={f('cut')}
            icon={<IconBtn className="Tripdocs-cut" style={{ fontSize: '15px' }} />}
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();

              const path = ReactEditor.findPath(editor, element);
              if (path.length < 5) {
                const cardNode = Node.get(editor, path.slice(0, -1));
                try {
                  const input = document.createElement('input');
                  input.oncopy = function (e: any) {
                    e.preventDefault();

                    e.clipboardData.setData('text/plain', `${element.fileName}`);
                    const string = JSON.stringify([cardNode]);
                    const encoded = window.btoa(encodeURIComponent(string));
                    e.clipboardData.setData('application/x-slate-fragment', encoded);
                  };
                  document.body.appendChild(input);
                  input.select();
                  document.execCommand('copy');
                  document.body.removeChild(input);
                } catch (error) {}
                Transforms.removeNodes(editor, { at: [path[0]] });
              }
            }}
          />
        )}
        <GeneralOverlayButton
          title={f('copy')}
          icon={<IconBtn className="Tripdocs-duplicate" style={{ fontSize: '15px' }} />}
          onMouseDown={e => {
            e.preventDefault();
            e.stopPropagation();

            const path = ReactEditor.findPath(editor, element);
            if (path.length < 5) {
              const cardNode = Node.get(editor, path.slice(0, -1));
              try {
                const input = document.createElement('input');
                input.oncopy = function (e: any) {
                  e.preventDefault();

                  e.clipboardData.setData('text/plain', `${element.fileName}`);
                  const string = JSON.stringify([cardNode]);
                  const encoded = window.btoa(encodeURIComponent(string));
                  e.clipboardData.setData('application/x-slate-fragment', encoded);
                };
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
              } catch (error) {}
            }
          }}
        />
        {!isReadOnly && (
          <GeneralOverlayButton
            title={f('delete')}
            icon={<IconBtn className="Tripdocs-delete" style={{ fontSize: '15px' }} />}
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();

              const path = ReactEditor.findPath(editor, element);
              if (path.length < 5) {
                Transforms.removeNodes(editor, { at: [path[0]] });
              }
            }}
          />
        )}
      </Overlay>
    </>
  );
};

export function insertFileObject(editor: any, file: any) {
  const { docId } = editor;
  const file_name = file.name;
  const file_size = (file.size && formatFileSize(file.size)) || '0B';
  const useTripdocsFileUpload: boolean = getCache(docId, 'options')?.useTripdocsFileUpload;

  const file_reader = new FileReader();
  file_reader.onload = event => {
    const str = event.target.result;
    console.log('filePlugins insertFile 弹出窗口，触发上传 str', event, file_name);

    setFile(editor, str, file_name, docId);
  };
  file_reader.readAsDataURL(file);
}
