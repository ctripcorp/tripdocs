import { Editor, Text, Transforms } from '@src/components/slate-packages/slate';
import { transformObjStrTimeToNumAndCallback } from '@src/utils/faster';
import { actionKey, applyOpt } from '../../../../utils/apiListener';
import { bodySelectAll } from '../../../../utils/selectionUtils';
import { CommentCallbackActionType } from '../config';
import { applyCommentCallback } from './commentOps';
import { CommentContentProps } from './insertSideComment';

export function updateSideComment(editor: any, rangeId: string, content: CommentContentProps, docId: string, isReplyingComment: boolean) {
  let newContent;
  const list = window.tripdocs.editorsMap[docId].commentData.map((item: any) => {
    const isTargetComment = content.commentId === item.commentId;
    if (isTargetComment) {
      item.content = content.content;
      item.mentionedMemberList = content.mentionedMemberList;
      window.tripdocs.editorsMap[docId].cache.commentId = '';
      newContent = item;
    }
    return item;
  });

  window.tripdocs.editorsMap[docId].api.setCommentData(list);

  transformObjStrTimeToNumAndCallback(newContent, content => {
    applyCommentCallback(editor, isReplyingComment ? CommentCallbackActionType.REPLY : CommentCallbackActionType.UPDATE, { ...content }, docId);
  });
}
