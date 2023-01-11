import { Editor } from '@src/components/slate-packages/slate';
import sessStorage from './sessStorage';
import storage from './storage';

export function setCache(docId: any, key: string, value: any) {
  const editorProps = window.tripdocs.editorsMap[docId];
  if (!editorProps) {
    return undefined;
  }
  editorProps.cache[key] = value;
}

export function getCache(docId: any, key: string) {
  if (
    docId &&
    key &&
    window.tripdocs &&
    window.tripdocs.editorsMap[docId] &&
    window.tripdocs.editorsMap[docId].cache &&
    window.tripdocs.editorsMap[docId].cache[key]
  ) {
    return window.tripdocs.editorsMap[docId].cache[key];
  }
  return null;
}

export function setGlobalCache(key: string, value: any) {
  if (key && window.tripdocs && window.tripdocs.cache) {
    window.tripdocs.cache[key] = value;
  }
  return;
}
export function getGlobalCache(key: string) {
  if (key && window.tripdocs && window.tripdocs.cache && window.tripdocs.cache[key]) {
    return window.tripdocs.cache[key];
  }
  return null;
}

type DocContentQueue = object[];

export function cacheDocContent(editor: Editor, docId: string, docContent: object, curTime: string) {
  const docContentQueue: DocContentQueue = sessStorage.get('tripdocs_sdk/docContentCacheArr_' + docId) || [];
  if (docContentQueue?.length > 4) {
    docContentQueue.pop();
  }

  docContentQueue.unshift({ docContent, at: curTime });

  console.log('[docContentQueue]', docContentQueue);
  sessStorage.set('tripdocs_sdk/docContentCacheArr_' + docId, docContentQueue);
}

export function recoverCacheDocContent(editor: any, index?: number) {
  const { docId } = editor;
  removeLatestCacheDocContent(editor);
  const docContentCacheArr = sessStorage.get('tripdocs_sdk/docContentCacheArr_' + docId) || [];
  console.log('recoverCacheDocContent => ', docContentCacheArr, docContentCacheArr?.[0]?.docContent);
  return typeof index !== 'undefined' ? docContentCacheArr?.[index]?.docContent : docContentCacheArr?.[0]?.docContent;
}

export function removeLatestCacheDocContent(editor: any) {
  const { docId } = editor;
  const docContentQueue = sessStorage.get('tripdocs_sdk/docContentCacheArr_' + docId) || [];

  if (docContentQueue.length > 1) {
    docContentQueue.shift();
    console.log('removeLatestCacheDocContent => ', docContentQueue);

    sessStorage.set('tripdocs_sdk/docContentCacheArr_' + docId, docContentQueue);
  }
}
