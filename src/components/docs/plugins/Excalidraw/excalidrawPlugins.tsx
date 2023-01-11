import { css, cx } from '@emotion/css';
import { Node, Transforms } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { getCache } from '@src/utils/cacheUtils';
import { createUUID } from '@src/utils/randomId';
import { currentLineSelectAll } from '@src/utils/selectionUtils';
import { message } from 'antd';
import React, { useEffect, useRef } from 'react';
import { judgePhone, TripdocsSdkContext } from '../../../../Docs';
import { insertCard } from '../Card';
import { ELTYPE } from '../config';
import { translateImgToBase64Native } from '../Image/imagePlugins';
import { getParentPathByType } from '../pluginsUtils/getPathUtils';

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
      console.log('blob', blob);
      forceDownload(blobUrl, filename);
    })
    .catch(e => console.error(e));
}

export const downloadFile = (url, filename) => {
  console.log('filePlugins downloadFile', url, filename);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.download = filename;
  link.click();
};

export function insertExcalidraw(editor: any, docId: string) {
  console.log('[insertExcalidraw]');
}

function getFile(params: any, docId: string) {
  const { url, fileName } = params;

  if (url && (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg'))) {
    translateImgToBase64Native(url, function name(urlData: any) {
      downloadFile(urlData, fileName);
    });
  } else {
    downloadFile(url, fileName);
  }
}

export const FileComponent = ({ attributes, children, element, editor }) => {
  const { docId } = React.useContext(TripdocsSdkContext);
  const fileRef = useRef(null);
  let timeout;

  useEffect(() => {
    if (fileRef?.current) {
      const div = fileRef.current;
      console.log('filePlugins FileComponent useEffect', div, div.querySelectorAll("[contenteditable='true']"));
      div.querySelectorAll("[contenteditable='true']").forEach((item: any) => {
        item.setAttribute('contenteditable', 'false');
      });
    }
  }, [children]);

  return (
    <div
      {...attributes}
      id={element.id}
      ref={fileRef}
      data-ignore-slate
      contentEditable={false}
      suppressContentEditableWarning
      className="ignore-toggle-readonly"
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
        onMouseDown={e => {
          e.preventDefault();
          e.stopPropagation();
          const isEmptyFile = element.name === '#empty_file';
          if (editor && isEmptyFile) {
            const path = ReactEditor.findPath(editor, element);
            Transforms.select(editor, path);
            console.log('filePlugins FileComponent onClick', element, path);
            const cardPath = getParentPathByType(editor, path, ELTYPE.CARD);
            Transforms.select(editor, cardPath);
            Transforms.collapse(editor, { edge: 'end' });
            return;
          }

          console.log('[onMouseDown]', element);
          getFile({ url: element.url || element.name, fileName: element.fileName }, docId);
        }}
      >
        {children}
      </div>
    </div>
  );
};
