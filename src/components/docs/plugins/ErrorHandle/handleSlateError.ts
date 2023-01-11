import { Editor } from '@src/components/slate-packages/slate';
import { HistoryEditor } from '@src/components/slate-packages/slate-history';
import { getCache, recoverCacheDocContent } from '@src/utils/cacheUtils';
import { notification } from 'antd';
import { showCacheDocContentModal } from '../StaticToolbar/buttons';
import { ErrorMsg } from './types';
import { IS_RECOVERING_CONTENT, SLATE_ERRORS } from './weak-maps';

let timeout = null;

export const handleSlateError = (e: ErrorMsg, editor?: (Editor & HistoryEditor) | any) => {
  let errorStack;
  try {
    throw new Error();
  } catch (err) {
    errorStack = err.stack.toString();
    console.error('[handleSlateError]', errorStack, e);
  }

  if (editor?.history?.undos?.length) {
    console.log(editor.history.undos);

    const lastCached = recoverCacheDocContent(editor);

    if (lastCached && lastCached.length > 2) {
      console.log('[handleSlateError] 恢复缓存', lastCached);
      IS_RECOVERING_CONTENT.set(editor, true);
      window.tripdocs.editorsMap[editor.docId].api.setContent(lastCached);
      setTimeout(() => IS_RECOVERING_CONTENT.set(editor, false));
    }

    const errors = SLATE_ERRORS.get(editor) || [];
    SLATE_ERRORS.set(editor, [...errors, e]);
    if (!timeout) {
      timeout = setTimeout(() => {
        showCacheDocContentModal(editor);
        notification.warn({
          message: '',
          description: '文档出现异常，请选择一个版本回退',
          duration: 3,
        });

        const stack: any[] = getCache(editor.docId, 'changeEditorStack') || [];
        let newStack: any[] = [];
        if (stack.length >= 1) {
          newStack.push(stack[0]);
          for (let i = 1; i < stack.length; i++) {
            newStack.push({
              content: [],
              operations: stack[i].operations,
            });
          }
        } else {
          newStack = stack;
        }

        timeout = null;
      }, 0);
    }
  }

  return;
};
