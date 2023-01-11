import { TripdocsSdkContext } from '@src/Docs';
import { hashCode, intToRGB } from '@src/utils/hexColorUtils';
import { createRandomId } from '@src/utils/randomId';
import storage from '@src/utils/storage';
import { Avatar, Button, Image } from 'antd';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ELTYPE, getGlobalCommentRangeId } from '../config';
import { InlineSlateEditor, renderLeaf } from '../SideComment/inlineSlateEditor';
import { css, cx } from '@emotion/css';
import { insertSideComment } from '../SideComment/insertSideComment';
import { timeFormat } from '../SideComment/utils';
import { Transforms } from '@src/components/slate-packages/slate';
import { f } from '@src/resource/string';

const GlobalCommentEditor = (props: any) => {
  const { commentData, setCommentData, commentValue, setCommentValue, isMobile, setEditor, globalCommentEditor } = props;

  const { editor, docId, userInfo } = useContext(TripdocsSdkContext);
  const displayName = userInfo?.displayName || userInfo?.userName || 'UNKNOWN（佚名）';
  const headPortrait = userInfo?.headPortrait;
  useEffect(() => {
    editor && console.log('commentValue :>> ', editor.selection, window?.tripdocs.editorsMap, commentValue);
  }, [commentValue]);

  const [inlineEditorValue, setInlineEditorValue] = useState([
    {
      type: ELTYPE.PARAGRAPH,
      children: [{ text: '' }],
    },
  ]);

  const commentValueLength = commentValue?.replace(/[\!\@]\[\[(.*?)\]\]/g, '').length;

  return (
    <>
      <div className={cx('comment-section-wrapper', 'ignore-toggle-readonly')} style={{ position: 'relative', margin: isMobile ? 0 : '16px' }}>
        <div
          key={'global-comment-editor_' + docId}
          data-ignore-slate
          className="inline-side-comment__content ignore-toggle-readonly"
          style={{
            display: 'flex',
            flexDirection: 'row',
            margin: '38px 0 16px 2px',
            padding: isMobile ? '0 16px 0 0' : '0 16px',
          }}
        >
          <div
            data-ignore-slate
            className="inline-side-comment__contentLeft ignore-toggle-readonly"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              margin: '10px 10px 0 0',
            }}
          >
            {!headPortrait ? (
              <Avatar
                style={{
                  backgroundColor:
                    displayName && displayName !== '' ? `#${intToRGB(hashCode(displayName))}` : `#${intToRGB(Math.floor(Math.random() * 10000))}`,
                }}
              >
                <span data-ignore-slate contentEditable="false" suppressContentEditableWarning={true}>
                  {displayName?.split('）')[0].slice(-3, -1)}
                </span>
              </Avatar>
            ) : (
              <Avatar src={<Image src={headPortrait} preview={false} style={{ width: 32 }} />} />
            )}
          </div>
          <div
            data-ignore-slate
            style={{ flex: 1, position: 'relative', maxWidth: '70vw' }}
            id="global-comment-editor-wrap"
            className="inline-side-comment__contentRight ignore-toggle-readonly"
          >
            <InlineSlateEditor
              setEditor={setEditor}
              isGlobalComment
              value={inlineEditorValue}
              setValue={setInlineEditorValue}
              setCommentValue={setCommentValue}
            />
            <div style={{ position: 'absolute', right: '16px' }}>
              <span style={{ color: commentValueLength > 500 ? '#f04f4f' : null }}>{commentValueLength}</span>
              /500
            </div>
          </div>
        </div>
      </div>
      <Button
        data-ignore-slate
        id="global-comment-reply-button"
        disabled={commentValue === '' || commentValueLength > 500}
        style={{
          margin: isMobile ? '0 0 0 42px' : '0 0 0 76px',
          color: commentValue === '' || commentValueLength > 500 ? '#bdbdbd' : '#595959',
          cursor: commentValue === '' || commentValueLength > 500 ? 'not-allowed' : 'pointer',
        }}
        onClick={e => {
          const commentId = 'global-comment_' + new Date().getTime();
          const curComment = {
            userName: displayName,
            content: commentValue,
            mentionedUserList: [],
            rangeId: commentId,
            commentId: commentId,
            replyTarget: null,
            time: new Date().getTime(),
          };
          globalCommentEditor && Transforms.deselect(globalCommentEditor);
          setCommentData([...commentData, curComment]);
          setCommentValue('');
          setInlineEditorValue([
            {
              type: ELTYPE.PARAGRAPH,
              children: [{ text: '' }],
            },
          ]);
          insertSideComment(
            editor,
            docId,
            {
              userName: userInfo.userName,
              content: commentValue,
              commentId: createRandomId(),
              rangeId: getGlobalCommentRangeId(),
              time: timeFormat(),
              mentionedMemberList: inlineEditorValue,
            },
            false,
            null
          );
        }}
      >
        {f('reply')}
      </Button>
    </>
  );
};

export default GlobalCommentEditor;
