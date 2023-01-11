import { message } from 'antd';
import $ from 'jquery';
import { Editor, Node, Range, Transforms, Text } from '@src/components/slate-packages/slate';
import { jsx } from '@src/components/slate-packages/slate-hyperscript';
import { v4 as anchorId } from 'uuid';
import storage from '../../../utils/storage';
import { createCard, insertCard } from '../plugins/Card';
import { ELTYPE, HEADING_TYPES, LIST_TYPES } from './config';
import {
  handleLinkInText,
  normalizeInlineLink,
  normalizeInlineNodeAtRoot,
  normalizeLi,
  normalizeParagraph,
  reorderOL,
  resetOL,
  trimEmptyText,
  unwrapCardElement,
  unwrapSingleCell,
  updateIdentities,
} from './deserializers/handleFragmentPlugins';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { defaultLanguage } from './CodeBlock/renderCodeBlock';
import { consumePlugins } from '@src/utils/helper/consumePlugins';
import { getClipboardData } from '@src/components/slate-packages/slate-react/utils/dom';
import { opsTable } from './table/tableOperation';
import { matchTable, pasteTableInTable } from './deserializers/handleTablePlugins';
import { htmlExportListAndText, htmlExportFirstHeadingAndList, htmlExportFirstTablevel } from './deserializers/handleExportPlugins';
import { TEXT_TAGS, ELEMENT_TAGS } from './deserializers/deserializeTags';
import { pasteTableForHTML } from './table/pasteTable';
import { imagePastingListener } from './deserializers/utils';
import { deserialize } from './deserializers/deserialize';
import { createUUID } from '@src/utils/randomId';

const invalidTags = ['o:p', 'xml', 'script', 'meta', 'link'];
const catchSlateFragment = /data-slate-fragment="(.+?)"/m;

export function allIsText(fragment: any[], id?) {
  return fragment.every(el => {
    if (id) el.id = id;
    return [ELTYPE.PARAGRAPH, ...HEADING_TYPES, ...LIST_TYPES, undefined].includes(el.type);
  });
}

export const isInTable = editor => {
  let ret = null;
  if (editor.selection) {
    ret = Editor.above(editor, {
      match: (n: any) => n.type === ELTYPE.TABLE,
    });
  }
  return ret;
};

export const withHtml = (editor: any) => {
  const { insertData, isInline, isVoid } = editor;

  editor.isInline = (element: any) => {
    return element.type === ELTYPE.LINK ? true : isInline(element);
  };

  editor.insertData = (data: any) => {
    const rtf = data.getData('text/rtf');
    const files = data.files;
    const html = data.getData('text/html');

    const plainText = data.getData('text/plain');
    console.info('[Transforms data types]', data.types);
    console.info('[Transforms data files]', files);
    console.info('[Transforms data rtf]', rtf);
    console.info('[Transforms data html]', html);
    console.info('[Transforms data plainText]', plainText);
    console.log('[Transforms.select 2]', editor.selection);

    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const isPureImg = parsed.body.childElementCount === 1 && parsed.body.children[0].tagName === 'IMG';
    if (isPureImg && files[0]) {
      insertData(data);
      return;
    }

    const [, dataSlateFragment] = html?.match(catchSlateFragment) || [];
    const childrenInnerText = handleLinkInText(plainText);

    const imageTags = imagePastingListener(rtf, html);

    try {
      const fragment = data.getData('application/x-slate-fragment');

      if (fragment) {
        const decoded = decodeURIComponent(window.atob(fragment));
        const newDecoded = updateIdentities(decoded);
        const parsed = JSON.parse(newDecoded) as Node[];
        console.log('PARSED', parsed);
        const preprocessPlugins = [unwrapSingleCell];
        let frag = unwrapCardElement(consumePlugins(parsed, preprocessPlugins), editor);

        editor.insertFragment(frag);
      } else if (html) {
        console.log('2');
        const fragId = createUUID();
        console.log('withHtml insertData', parsed);
        const docWidth = (editor && editor.docId && getEditorWidth(editor.docId)) || 610;
        const preprocessPlugins = [normalizeLi, reorderOL, trimEmptyText, normalizeInlineNodeAtRoot, normalizeInlineLink, normalizeParagraph];
        const deserializedFrag = deserialize(parsed.body, fragId, imageTags, { isInTable: false, docWidth: docWidth }) as Node[];
        const fragment = consumePlugins(deserializedFrag, preprocessPlugins);

        console.log('[deserializedFrag]', deserializedFrag, '[fragment]', fragment);
        const path1 = editor.selection.focus.path[0];
        const curNode: any = Node.get(editor, [editor.selection.focus.path[0]]);
        const prevPath = (editor.selection.focus.path[0] || 1) - 1;
        console.log('curNode', curNode.type);

        if (fragment.length !== 0) {
          const fragMatchTable = matchTable(fragment);

          if (isInTable(editor) && fragMatchTable.match) {
            const cardNode = fragment[fragMatchTable.tableIndex];
            pasteTableInTable(editor, cardNode);
            return;
          }

          const firstElement = fragment[0];
          const firstChildren = firstElement.children || [];
          if (LIST_TYPES.includes(curNode.type) && allIsText(fragment) && fragment.length > 1) {
            htmlExportListAndText(fragment, editor, path1);
            return;
          }

          const [node, path]: any = Editor.node(editor, editor.selection.focus.path);

          if (HEADING_TYPES.includes(firstElement.oldType) || [...HEADING_TYPES, ...LIST_TYPES, ELTYPE.CARD].includes(firstElement.type)) {
            htmlExportFirstHeadingAndList(fragment, editor, node, path, prevPath);
          } else {
            htmlExportFirstTablevel(fragment, editor, firstElement, path);
          }
          return;
        } else if (typeof childrenInnerText !== 'string') {
          Transforms.insertFragment(editor, childrenInnerText);
          return;
        }
        insertData(data);
      } else {
        insertData(data);
      }
    } catch (error) {
      console.log('withHtml insertData', error);
      console.error('粘贴失败，请尝试 ctrl+shift+v');
      insertData(data);
    }
  };

  return editor;
};

function getEditorWidth(docId) {
  const editorRect = document.querySelector(`[id^='editorarea-${docId}']`)?.getBoundingClientRect();
  const PADDING_X = 120;
  const MARGIN_X = 20;
  return (editorRect?.width || 750) - PADDING_X - MARGIN_X;
}
