export function addApiListener(fn: Function, docId: string | number, key?: string) {
  const api = window?.tripdocs?.editorsMap && window.tripdocs.editorsMap[docId].api;

  if (api) {
    if (key) {
      api[key] = fn;
      return;
    }
    api[getFunctionName(fn)] = fn;
  } else {
    console.error('tripdocs init error, addApiListener  error , listener name:', fn.name);
  }
}

function getFunctionName(fn: Function) {
  return fn.name;
}

export function applyOpt(key: string, opt: any, docId: string | number, others?: any) {
  const api = window?.tripdocs?.editorsMap && window.tripdocs.editorsMap[docId]?.api;
  try {
    if (api && key && api[key]) {
      return api[key](opt, others);
    }
  } catch (error) {
    console.log('failed:', error);
  }
}
export const actionKey = {
  mentionCallback: 'mentionCallback',
  roomUsersCallback: 'roomUsersCallback',
  docStatusCallback: 'docStatusCallback',
  commentCallback: 'commentCallback',
  shareCallback: 'shareCallback',
  initCallback: 'initCallback',
  onSlateChange: 'onSlateChange',
  setContent: 'setContent',
  getContent: 'getContent',
  getTitle: 'getTitle',
  getDocHistoryCallback: 'getDocHistoryCallback',
  getDocBlobByVersionCallback: 'getDocBlobByVersionCallback',
  restoreDocCallback: 'restoreDocCallback',
  mdRefreshDocCallback: 'mdRefreshDocCallback',
};
interface mentionCallbackData {
  type: string;
  [key: string]: any;
}
