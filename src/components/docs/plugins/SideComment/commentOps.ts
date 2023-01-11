import { Editor, Point, Text, Node } from '../../../../components/slate-packages/slate';
import { actionKey, applyOpt } from '../../../../utils/apiListener';
import { bodySelectAll } from '../../../../utils/selectionUtils';
import { CommentCallbackActionType, ELTYPE, TABBABLE_TYPES } from '../config';
import { v4 as uuid } from 'uuid';
import { getParentPathByTypes } from '../pluginsUtils/getPathUtils';
import { commentTypeMapToString } from './utils';

export type CommentType = null | ELTYPE.INLINEIMAGE | ELTYPE.CODE_BLOCK | ELTYPE.FILE | ELTYPE.TABLE | ELTYPE.VIDEO;

function getPointStrOffset(editor: Editor, point: Point) {
  console.log('getPointStrOffset', point);
  const nodes = Node.fragment(editor, {
    anchor: { path: Node.first(editor, point.path)[1], offset: 0 },
    focus: point,
  });
  const str = Node.string({
    type: '',
    children: nodes,
  } as any);
  console.log('insertCommentStyle str', str);
  return str.length;
}

export const insertCommentStyle = (
  editor: any,
  selection: any,
  setCurRangeId: any,
  editorId: string,
  setIdenticalSelectionRangeId?: any,
  setWIPCommentRangeId?: any,
  title?: string,
  commentType?: CommentType
) => {
  if (!selection) {
    console.error('insertCommentStyle slection error 1', selection);
    return;
  }
  const { focus, anchor } = selection;
  if (!(focus && anchor)) {
    console.error('insertCommentStyle slection error 2', selection);
    return;
  }
  const [start, end] = Point.isAfter(focus, anchor) ? [anchor, focus] : [focus, anchor];
  const anchorOffset = getPointStrOffset(editor, start);
  const focusOffset = getPointStrOffset(editor, end);
  const tabbableParentPath = getParentPathByTypes(editor, start.path, TABBABLE_TYPES);
  console.log('insertCommentStyle0', tabbableParentPath);
  if (!tabbableParentPath) {
    return;
  }
  const tabbableParentNode: any = Node.get(editor, tabbableParentPath);
  const rangeId = JSON.stringify({
    selection: { anchor: start, focus: end },
    anchorOffset: anchorOffset,
    focusOffset: focusOffset,
    refContent: !title && commentType ? commentTypeMapToString(commentType) : title,
    anchorId: tabbableParentNode.anchorId,
    commentType: commentType,
  });
  const commentId = uuid();
  const thisEditor = window.tripdocs.editorsMap[editorId.split('-')[1]];
  thisEditor.cache.commentId = commentId;
  const timezone = 8;
  const offset_GMT = new Date().getTimezoneOffset();
  const nowDate = new Date().getTime();
  const date = new Date(nowDate + offset_GMT * 60 * 1000 + timezone * 60 * 60 * 1000);
  thisEditor.api.setCommentData([
    ...thisEditor.commentData,
    {
      userName: thisEditor?.userInfo?.userName,
      commentId: commentId,
      rangeId: rangeId,
      time: date.getTime(),
      mentionedMemberList: [],
      replyTarget: null,
    },
  ]);
  console.log('insertCommentStyle setCommentData', [
    ...thisEditor.commentData,
    {
      userName: thisEditor?.userInfo?.userName,
      commentId: commentId,
      rangeId: rangeId,
      time: date.getTime(),
      mentionedMemberList: [],
      replyTarget: null,
    },
  ]);
  setCurRangeId(rangeId);
  setWIPCommentRangeId(rangeId);
};

export const getNodesByRangeId = (editor: any, rangeId: string) => {
  const allDocumentRange = bodySelectAll(editor);
  const nodes = Editor.nodes(editor, {
    at: allDocumentRange,
    match: (n: any) => Text.isText(n) && (n as any).rangeIdList && ((n as any).rangeIdList as any).includes(rangeId),
  });
  const nodesEntryArr = [];
  for (const [node, path] of nodes) {
    const tabbableParentPath = getParentPathByTypes(editor, path, TABBABLE_TYPES);
    if (!tabbableParentPath) {
      return;
    }
    const tabbableParentNode: any = Node.get(editor, tabbableParentPath);
    const anchorId = tabbableParentNode?.anchorId;
    const newN: any = { node, path, anchorId };
    nodesEntryArr.push(newN);
  }
  console.log('[getNodesByRangeId]', nodesEntryArr);
  return nodesEntryArr;
};

export const applyCommentCallback = (editor, action: CommentCallbackActionType, content, docId) => {
  const commentArr = window.tripdocs.editorsMap[docId].commentData;

  applyOpt(actionKey.commentCallback, { action, content, commentArr }, docId);
};
