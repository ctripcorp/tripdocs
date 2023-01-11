import { Node } from '@src/components/slate-packages/slate';
import { debounce, throttle } from 'lodash';
import React, { useEffect, useState } from 'react';
import { ReactEditor } from '../../../slate-packages/slate-react';
import { ELTYPE } from '../config';
import { getEditorEventEmitter } from '../table/selection';
import { InlineSideCommentButton } from './renderSideComment';

export const AllCommentsList = (props: any) => {
  const { editor, docId, isShowHoveringCommentButton } = props;
  const allRows = editor?.children || [];

  const allRowsButtons = allRows.map((element, index) => {
    return (
      <CommentsItem
        element={element}
        index={index}
        key={index}
        docId={docId}
        editor={editor}
        isShowHoveringCommentButton={isShowHoveringCommentButton}
      />
    );
  });
  return allRowsButtons;
};

function CommentsItem(props: any) {
  const { element, index, docId, editor, isShowHoveringCommentButton } = props;

  let isTable = false;
  if (!element) {
    return null;
  }

  if ([ELTYPE.CARD].includes(element?.type)) {
    const cardCenter = element.children[1];
    if ([ELTYPE.TABLE].includes(cardCenter.type)) {
      isTable = true;
    } else {
      return null;
    }
  }
  const curElementCommentsArr = element?.children?.filter(item => item.rangeIdList && item.rangeIdList.length) ?? [];
  const curElementComments = curElementCommentsArr.length ? curElementCommentsArr : [];

  const tCommentRanges = window.tripdocs.editorsMap[docId].commentRanges;
  const tCommentData = window.tripdocs.editorsMap[docId].commentData;

  const elementStr = JSON.stringify(element);

  const commentData = tCommentData.filter(it => {
    const anchorId = JSON.parse(it.rangeId).anchorId;
    return (
      it.rangeId &&
      !it.rangeId.startsWith('global-comment_') &&
      anchorId &&
      anchorId.length !== 1 &&
      elementStr.indexOf(JSON.parse(it.rangeId).anchorId) > -1
    );
  });
  commentData?.length && console.log('commentData__', commentData);

  const hasSideComment = !!commentData.length;

  if (!hasSideComment) {
    return null;
  }
  const [sideCommentTop, setSideCommentTop] = useState(null);

  useEffect(() => {
    function updateTop() {
      let curRowTop = 0;
      const editor = window.tripdocs.editorsMap[docId].editor;
      const curRow = editor?.children[index];
      if (curRow && curRow.type === ELTYPE.CARD) {
        console.log('curRow', curRow, curRow.children[1]);
        curRowTop = ReactEditor.toDOMNode(editor, curRow.children[1])?.getBoundingClientRect().top;
      } else {
        curRowTop = ReactEditor.toDOMNode(editor, curRow)?.getBoundingClientRect().top;
      }
      const editorTop = document.getElementById(`editorarea-${docId}`)?.getBoundingClientRect().top;
      console.log('[CommentsItem Top]', editor, editor.children[index], curRowTop, editorTop);
      const EDITOR_PADDING = 10;
      const INPUT_EDITOR_HEIGHT = 68;
      const val = curRowTop - editorTop + EDITOR_PADDING + INPUT_EDITOR_HEIGHT;
      setSideCommentTop(val);
    }
    const debounceUpdateTop = debounce(updateTop, 500);
    debounceUpdateTop();
    getEditorEventEmitter(docId).on('updateCommentTop', debounceUpdateTop, docId);
    return () => {
      debounceUpdateTop.cancel();
      getEditorEventEmitter(docId).off('updateCommentTop', debounceUpdateTop, docId);
    };
  }, [index]);

  const nativeComment = [];

  for (let i = 0; i < commentData.length; i++) {
    const comment = commentData[i];
    const { refContent } = JSON.parse(comment.rangeId);
    nativeComment.push({
      text: refContent,
      rangeIdList: [comment.rangeId],
      commentContent: [comment],
    });
  }

  return nativeComment?.length > 0 ? (
    <InlineSideCommentButton
      key={index}
      editor={editor}
      comments={nativeComment}
      position={{ top: sideCommentTop }}
      isShowHoveringCommentButton={isShowHoveringCommentButton}
    />
  ) : null;
}
