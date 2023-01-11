import { transformObjStrTimeToNumAndCallback } from '@src/utils/faster';
import { Editor, Text, Transforms } from '../../../../components/slate-packages/slate';
import { bodySelectAll } from '../../../../utils/selectionUtils';
import { CommentCallbackActionType } from '../config';
import { applyCommentCallback } from './commentOps';

export const deleteCommentByRangeId = (editor: any, rangeId: string, nodesEntryArr: any, docId: any) => {
  let newContent;
  const list = window.tripdocs.editorsMap[docId].commentData.filter(item => {
    const isTargetComment = window.tripdocs.editorsMap[docId].cache.commentId === item.commentId;
    if (isTargetComment) {
      window.tripdocs.editorsMap[docId].cache.commentId = '';
      newContent = item;
    }
    return !isTargetComment;
  });
  window.tripdocs.editorsMap[docId].api.setCommentData(list);
  transformObjStrTimeToNumAndCallback(newContent, content => {
    applyCommentCallback(editor, CommentCallbackActionType.DELETE, content, docId);
  });
};

export const deleteCommentByCommentId = (editor: any, commentId: string, docId: any, isReplyingComment: boolean) => {
  let newContent;
  const list = window.tripdocs.editorsMap[docId].commentData.filter(item => {
    const isTargetComment = commentId === item.commentId;
    if (isTargetComment) {
      newContent = item;
    }
    return !isTargetComment;
  });
  console.log('list', list);
  window.tripdocs.editorsMap[docId].api.setCommentData(list);

  if (!isReplyingComment) {
    transformObjStrTimeToNumAndCallback(newContent, content => {
      applyCommentCallback(editor, CommentCallbackActionType.DELETE, content, docId);
    });
  }
};
