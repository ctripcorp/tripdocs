import { css, cx } from '@emotion/css';
import { EditorContainerInnerPortal, TripdocsSdkContext } from '@src/Docs';
import { hashCode, intToRGB } from '@src/utils/hexColorUtils';
import { Avatar, Button, message, Tooltip } from 'antd';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CommentContent } from '../SideComment/renderSideComment';
import $ from 'jquery';
import { timeFormat } from '../SideComment/utils';
import { CommentOutlined } from '@ant-design/icons';
import GlobalCommentEditor from './globalCommentEditor';
import storage from '@src/utils/storage';
import { ELTYPE } from '../config';
import { getNodesByRangeId } from '../SideComment/commentOps';
import { deleteCommentByCommentId, deleteCommentByRangeId } from '../SideComment/deleteSideComment';
import { createRandomId } from '@src/utils/randomId';
import { insertSideComment } from '../SideComment/insertSideComment';
import { updateSideComment } from '../SideComment/updateSideComment';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { Transforms } from '@src/components/slate-packages/slate';
import { bodySelectAll } from '@src/utils/selectionUtils';
import { f } from '@src/resource/string';
import { getCache } from '@src/utils/cacheUtils';

export const GlobalComment = (props: any) => {
  const { commentData, setCommentData, isMobile, editor } = props;

  const [globalCommentEditor, setGlobalCommentEditor] = useState(null);
  const [commentValue, setCommentValue] = useState('');

  return (
    <div className="editor-global-comment" style={{ margin: '12px', paddingBottom: 30 }}>
      <div className="global-comment-header" style={{ padding: '0 8px', margin: '8px 0', width: '100%' }}>
        {}
        <div className="global-comment-reply" style={{ color: '#7d7d7d' }}>
          <div
            className="reply-wrap"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              width: 'fit-content',
            }}
            onMouseDown={e => {
              e.preventDefault();

              if (globalCommentEditor) {
                const globalCommentEditorDom = ReactEditor.toDOMNode(globalCommentEditor, globalCommentEditor);
                console.log('[scrollIntoView] globalCommentEditorDom :>> ', globalCommentEditor, globalCommentEditorDom);

                const containerWrapDom = document.getElementById(`editor-content-wrap-${editor.docId}`);
                const offsetTop =
                  (globalCommentEditorDom.closest('.comment-section-wrapper') as HTMLElement)?.offsetTop + globalCommentEditorDom.offsetTop;
                const height = globalCommentEditorDom?.getBoundingClientRect().height;
                if (typeof offsetTop === 'number' && typeof height === 'number' && containerWrapDom) {
                  containerWrapDom.scroll({ behavior: 'smooth', top: offsetTop - height });
                }
              }
            }}
          >
            <CommentOutlined style={{ fontSize: '24px' }} />
            <span style={{ marginLeft: '8px' }}>{f('reply')}</span>
          </div>
        </div>
      </div>
      <div className="global-comment-header__br" style={{ background: '#1466DE', height: '1px', margin: '16px 8px' }}></div>
      <div className="global-comment-content">{getCommentContents(commentData)}</div>
      <GlobalCommentEditor
        setEditor={setGlobalCommentEditor}
        commentData={commentData}
        globalCommentEditor={globalCommentEditor}
        setCommentData={setCommentData}
        commentValue={commentValue}
        setCommentValue={setCommentValue}
        isMobile={isMobile}
      />
    </div>
  );
};

type commentGroupType = {
  [rangeId: string]: {
    anchorId: string;
    refContent: string;
    selection: Selection | null;
    commentDataArr: any[];
  };
};

const getCommentContents = (commentData: any) => {
  const { docId, editor, WIPCommentRangeId } = useContext(TripdocsSdkContext);

  const [isReplyingComment, setIsReplyingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);

  const groupRangeId = (commentData: any[]) => {
    const commentGroup: commentGroupType = {};
    commentData.forEach(item => {
      const { rangeId } = item;
      if (!rangeId) return;
      if (!commentGroup[rangeId]) {
        try {
          const { selection, refContent, anchorId } = rangeId.startsWith('global-comment_')
            ? { selection: null, refContent: null, anchorId: null }
            : JSON.parse(rangeId);
          commentGroup[rangeId] = {
            anchorId,
            refContent,
            selection,
            commentDataArr: [item],
          };
        } catch (error) {
          console.error(error);
        }
      } else {
        commentGroup[rangeId].commentDataArr = [...commentGroup[rangeId].commentDataArr, item];
      }
    });
    console.log('[groupRangeId] commentGroup :>> ', commentGroup, WIPCommentRangeId, commentGroup[WIPCommentRangeId]);
    if (commentGroup[WIPCommentRangeId]) {
      delete commentGroup[WIPCommentRangeId];
    }
    return Object.values(commentGroup);
  };

  const commentGroup = groupRangeId(commentData);

  console.log('commentGroup :>> ', commentGroup);

  return useMemo(
    () =>
      commentGroup.map((content: any, index) => {
        const { refContent, anchorId, selection, commentDataArr } = content;
        const isGlobalComment =
          JSON.stringify(selection) === '{"anchor":{"path":[0,0],"offset":0},"focus":{"path":[0,0],"offset":0}}' &&
          refContent === f('globalComment') &&
          anchorId === '0';

        console.log(
          'isGlobalComment :>> ',
          isGlobalComment,
          JSON.stringify(selection) === '{"anchor":{"path":[0,0],"offset":0},"focus":{"path":[0,0],"offset":0}}',
          refContent,
          f('globalComment'),
          anchorId === '0'
        );
        return (
          <div
            className={cx(
              'comment-section-wrapper',
              css`
                & {
                  .comment-ref-content ~ .inline-side-comment__content {
                    border-left: 1px dashed #d0d0d0;
                    margin-left: 1px;
                  }
                  .inline-side-comment__content:only-child {
                    margin-left: 2px;
                  }

                  .inline-side-comment__editor {
                    margin: 24px 0 10px 0;
                  }
                }
              `
            )}
            style={{ position: 'relative', margin: '16px' }}
          >
            {refContent ? (
              <>
                <a
                  className={cx(
                    'content-detail-wording-detail',
                    css`
                      & {
                        font-family: PingFangSC-Regular;
                        font-size: 12px;
                        line-height: 16px;
                        position: absolute;
                        right: 20px;
                        top: 28px;
                        color: #bfbfbf;
                        cursor: pointer;
                        z-index: 10;
                      }
                      &:hover {
                        text-decoration: none;
                        outline: 0;
                        color: #999999;
                      }
                    `
                  )}
                  onClick={e => {
                    if (anchorId && anchorId !== '0') {
                      console.log('[anchorId,]', anchorId);
                      const canScroll = scrollToViewByAnchorId(docId)(anchorId);
                      if (!canScroll) {
                        message.config({
                          top: 100,
                          maxCount: 1,
                        });
                        message.destroy();
                        message.warn(f('anchorNotFound'));
                      }
                    }
                  }}
                >
                  {anchorId && anchorId !== '0' && f('jumpToAnchor')}
                </a>
                <div
                  className={cx(
                    'comment-ref-content',
                    css`
                      & {
                        height: 24px;
                        padding: 0 12px;
                        border-left: ${!isGlobalComment ? `3px solid #1466de` : `none`};
                        background: ${isGlobalComment ? `rgba(222, 162, 20, 0.20)` : `rgba(20, 102, 222, 0.06)`};
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                      }
                    `
                  )}
                >
                  <span
                    title={refContent}
                    className={css`
                      & {
                        font-family: PingFangSC-Regular;
                        font-size: 12px;
                        color: #999999;
                        line-height: 16px;
                      }
                    `}
                  >
                    {refContent}
                  </span>
                </div>
              </>
            ) : null}
            {commentDataArr.map((content, index) => {
              return (
                <CommentContent
                  key={index}
                  editor={editor}
                  text={refContent}
                  content={content}
                  index={index}
                  rangeId={content.rangeId}
                  commentId={content.commentId}
                  editingCommentId={editingCommentId}
                  setEditingCommentId={setEditingCommentId}
                  isReplyingComment={isReplyingComment}
                  setIsReplyingComment={setIsReplyingComment}
                  isShowHoveringCommentButton={true}
                  contentCollapseLength={100}
                />
              );
            })}
          </div>
        );
      }),
    [JSON.stringify(commentGroup), JSON.stringify(commentData), editingCommentId, isReplyingComment, WIPCommentRangeId]
  );
};

function scrollToViewByAnchorId(docId = 'default') {
  return (anchorId: string) => {
    const { SlateEditor: Editor, editor, ReactEditor } = window.tripdocs.editorsMap[docId];
    const curNodeEntry = Editor.nodes(editor, {
      at: [],
      match: (n: any) => n?.anchorId === anchorId,
    }).next().value;
    if (curNodeEntry) {
      const anchorItemEl = ReactEditor.toDOMNode(editor, curNodeEntry[0]);
      const anchorItemElRect = anchorItemEl.getBoundingClientRect();
      const isInViewport = anchorItemElRect && anchorItemElRect.top >= 0 && anchorItemElRect.bottom <= window.innerHeight;
      const scrollWrap: HTMLElement = getCache(docId, 'editorWrapDom');
      if (scrollWrap && anchorItemEl && !isInViewport) {
        scrollWrap.scrollTo({ top: anchorItemEl.offsetTop - 20, behavior: 'smooth' });
      }

      console.log('[scrollToViewByAnchorId] anchorItemEl :>> ', anchorItemEl);
      $(anchorItemEl).on('webkitAnimationEnd animationEnd', function () {
        $(this).removeClass('anchor-target');
      });
      $(anchorItemEl).addClass('anchor-target');
      return true;
    }
    return false;
  };
}
