import { Editor, Text, Transforms } from '@src/components/slate-packages/slate';
import { getCache } from '@src/utils/cacheUtils';
import { transformObjStrTimeToNumAndCallback } from '@src/utils/faster';
import { actionKey, applyOpt } from '../../../../utils/apiListener';
import { bodySelectAll } from '../../../../utils/selectionUtils';
import { CommentCallbackActionType, getGlobalCommentRangeId } from '../config';
import { applyCommentCallback } from './commentOps';

export interface CommentContentProps {
  userName: string;
  content: string;
  commentId: string;
  rangeId: string;
  time: string;
  mentionedMemberList: any;
  replyTarget?: any;
}

export function insertSideComment(
  editor: Editor,
  docId: string | number,
  content: CommentContentProps,
  isReplyingComment: boolean,
  replyTarget?: {
    commentId: string;
    content: CommentContentProps;
    replyTarget?: CommentContentProps;
  }
) {
  console.log('insertSideComment', editor, docId, content, isReplyingComment, replyTarget);
  if (replyTarget && replyTarget.replyTarget) {
    delete replyTarget.replyTarget;
  }
  const userInfo = getCache(docId, 'options').userInfo;
  const creator = {
    headPortrait: userInfo.headPortrait,
  };
  let newContent = content;
  if (isReplyingComment) {
    const list = window.tripdocs.editorsMap[docId].commentData;

    const timezone = 8;
    const offset_GMT = new Date().getTimezoneOffset();
    const nowDate = new Date().getTime();
    const date = new Date(nowDate + offset_GMT * 60 * 1000 + timezone * 60 * 60 * 1000);

    const newData = [...list, { ...content, replyTarget, replyTo: replyTarget?.commentId, time: date.getTime(), creator }];
    window.tripdocs.editorsMap[docId].api.setCommentData(newData);
  } else if (newContent.rangeId === getGlobalCommentRangeId()) {
    const list = window.tripdocs.editorsMap[docId].commentData;

    const timezone = 8;
    const offset_GMT = new Date().getTimezoneOffset();
    const nowDate = new Date().getTime();
    const date = new Date(nowDate + offset_GMT * 60 * 1000 + timezone * 60 * 60 * 1000);

    const newData = [...list, { ...content, time: date.getTime(), creator }];
    window.tripdocs.editorsMap[docId].api.setCommentData(newData);
  } else {
    const list = window.tripdocs.editorsMap[docId].commentData.map((item: any) => {
      if (window.tripdocs.editorsMap[docId].cache.commentId === item.commentId) {
        item.content = content.content;
        item.userName = content.userName;
        item.mentionedMemberList = content.mentionedMemberList;
        window.tripdocs.editorsMap[docId].cache.commentId = '';
        newContent = item;
      }
      return item;
    });

    window.tripdocs.editorsMap[docId].api.setCommentData([...list]);
  }
  transformObjStrTimeToNumAndCallback(newContent, content => {
    if (content.content) {
      applyCommentCallback(editor, CommentCallbackActionType.INSERT, content, docId);
    }
  });
}
