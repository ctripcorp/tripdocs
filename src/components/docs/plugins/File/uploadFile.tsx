import { Editor, Node, Path, Point, Transforms } from '@src/components/slate-packages/slate';
import { HistoryEditor } from '@src/components/slate-packages/slate-history';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { YjsEditor } from '@src/components/slate-packages/slate-yjs';
import { f } from '@src/resource/string';
import { getCache } from '@src/utils/cacheUtils';
import { getConfig } from '@src/utils/config';
import { createUUID } from '@src/utils/randomId';
import { message, Modal, Popconfirm } from 'antd';
import { createCard, insertCard } from '../Card';
import { ELTYPE, TABBABLE_TYPES } from '../config';
import { insertImage } from '../InlineImage/inlineImagePlugins';
import { getEditorEventEmitter } from '../table/selection';
import { insertVideo } from '../Video/SlateVideo';
import $ from 'jquery';
import { getCurrentLineStart } from '@src/utils/selectionUtils';
import { getParentPathByTypes } from '../pluginsUtils/getPathUtils';
import React from 'react';
import ReactDOM from 'react-dom';
import Progress from './Progress';

type File = {
  type: ELTYPE.FILE;
  url: string;
  fileName: string;
  fileSize: string;
  children: Node[];
  id: string;
};

const insertFile = (editor, url: string, file_name: string, file_size: string) => {
  if (!editor?.selection) return;
  const obj: File = {
    type: ELTYPE.FILE,
    url: url,
    fileName: file_name,
    fileSize: file_size || '0B',
    children: [
      {
        text: '',
      },
    ],
    id: createUUID(),
  };
  const path = getParentPathByTypes(editor, editor.selection.focus.path, TABBABLE_TYPES);
  let isStart = Point.equals(getCurrentLineStart(editor), editor.selection.focus);
  let insertPath;
  if (isStart) {
    insertPath = path;
  } else {
    insertPath = Path.next(path);
  }
  const card = createCard(obj);
  Transforms.insertNodes(editor, card, { at: insertPath });
};

const insertProgress = (editor, filename, size) => {
  if (!editor?.selection) return;
  const { docId } = editor;
  const prevNode = Node.get(editor, editor.selection.focus.path);
  let prevDOM = ReactEditor.toDOMNode(editor, prevNode);
  let isStart = Point.equals(getCurrentLineStart(editor), editor.selection.focus);
  const maxFind = 10;
  let count = 0;
  while (prevDOM.getAttribute('data-slate-node') !== 'element' && count < maxFind) {
    prevDOM = prevDOM.parentElement;
    count++;
  }
  if (count >= maxFind) return;
  console.log('prevElement, ', prevNode, prevDOM);
  const progress = document.createElement('div');
  progress.style.margin = '0 4px';
  const innerBarId = createUUID();

  if (isStart) {
    $(prevDOM).before(progress);
  } else {
    $(prevDOM).after(progress);
  }

  const removeProgress = () => {
    progress.remove();
  };

  ReactDOM.render(<Progress innerBarId={innerBarId} filename={filename} size={size} />, progress);

  const handleUploadProgress = (filename, pgrs) => {
    if (pgrs === -1) {
      removeProgress();
      message.destroy();
      message.error(f('uploadFailed'));
      return;
    }
    const innerBar = document.getElementById(innerBarId);
    innerBar && innerBar.style && (innerBar.style.width = pgrs + '%');
    console.log('progress ==> pgrs: ', pgrs);
    if (pgrs === 100) {
      removeProgress();
    }
  };

  getEditorEventEmitter(docId).on('uploadProgress', handleUploadProgress, docId);
  return () => {
    getEditorEventEmitter(docId).off('uploadProgress', handleUploadProgress, docId);
  };
};

const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
  const byteCharacters = Buffer.from(b64Data, 'base64').toString('utf-8');
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};
