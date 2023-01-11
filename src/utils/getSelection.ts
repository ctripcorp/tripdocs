import { message } from 'antd';
import { getCache } from './cacheUtils';

export function getSlateSlection(docId: string) {
  if (!docId) {
    message.error('文档错误，请刷新页面！');
    return null;
  }
  try {
    let selection = window.tripdocs.editorsMap[docId].editor.selection;
    if (selection) {
      return selection;
    }
    selection = getCache(docId, 'selection');

    if (selection) {
      return selection;
    } else {
      return [window.tripdocs.editorsMap[docId].editor.children.length - 1];
    }
  } catch (error) {
    message.error('文档错误，请刷新页面！');
    return null;
  }
}
