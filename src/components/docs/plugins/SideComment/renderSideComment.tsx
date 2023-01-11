import { css, cx } from '@emotion/css';
import Avatar from 'antd/lib/avatar/avatar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Editor, Node, Path, Range, Text } from '@src/components/slate-packages/slate';
import { v4 as anchorId } from 'uuid';
import { TripdocsSdkContext } from '../../../../Docs';
import { hashCode, intToRGB } from '../../../../utils/hexColorUtils';
import { createRandomId } from '../../../../utils/randomId';
import { bodySelectAll } from '../../../../utils/selectionUtils';
import { Editable, ReactEditor, Slate, withReact } from '../../../slate-packages/slate-react';
import { IconBtn } from '../Components';
import { getNodesByRangeId } from './commentOps';
import { deleteCommentByCommentId, deleteCommentByRangeId } from './deleteSideComment';
import { CommentContentProps, insertSideComment } from './insertSideComment';
import { updateSideComment } from './updateSideComment';
import { message, Tooltip, Image } from 'antd';
import { createEditor, Transforms } from '../../../slate-packages/slate';
import { CommentCallbackActionType, ELTYPE } from '../config';
import { withHistory } from '../../../slate-packages/slate-history';
import { deserialize, InlineSlateEditor } from './inlineSlateEditor';
import { rangesMap, timeFormat } from './utils';
import { ArrowDownOutlined, CaretDownOutlined, CaretLeftOutlined } from '@ant-design/icons';
import { getCache } from '@src/utils/cacheUtils';
import { f } from '@src/resource/string';
import { EditorContainerInnerPortal } from '@src/utils/createPortal';
import { SlateInlineImage } from '../InlineImage/inlineImagePlugins';

const PortalByRow = ({ children, sideCommentRowNum, editor }: any) => {
  const container = ReactEditor.toDOMNode(editor, Node.get(editor, [sideCommentRowNum]));
  return ReactDOM.createPortal(children, container);
};

export const getInlineElList = (string: any) => {
  if (!string) {
    return [];
  }
  const mentionArr: any = [...string.matchAll(/\@\[\[(.*?)\]\]/g)].map((item: any) => item[1]);
  console.log('getMentionedMemberList string', string, mentionArr);
  return mentionArr;
};

export const replaceInlineElements = (string: string = '') => {
  const inlineElArr = [];
  const textArr = string?.split(/[\!\@]\[\[.*?\]\]/);
  string?.replace(/([\!\@])\[\[(.*?)\]\]/g, (_, $1, $2) => {
    console.log('match', _, $1, $2);
    if ($2.startsWith('{')) {
      if ($1 === '!') {
        const element = JSON.parse($2);
        inlineElArr.push({
          type: ELTYPE.INLINEIMAGE,
          source: element?.source,
          linkSource: element?.linkSource,
          width: element?.width,
          height: element?.height,
        });
      } else if ($1 === '@') {
        inlineElArr.push({ type: ELTYPE.MENTION, data: JSON.parse($2) });
      }
    }
    return '';
  });
  console.log('[inlineElArr[', textArr, inlineElArr);

  const leaves = [];
  if (textArr.length - 1 === inlineElArr.length) {
    for (let i = 0; i < inlineElArr.length; i++) {
      leaves.push(<>{textArr[i]}</>);
      const inline = inlineElArr[i];
      if (inline.type === ELTYPE.INLINEIMAGE) {
        console.log('inlineElArr[i].data', inline, inlineElArr[i].data);
        leaves.push(
          <SlateInlineImage
            attributes={{}}
            children={<div />}
            element={{ source: inline.source, linkSource: inline.linkSource, width: inline.width, height: inline.height }}
            editor={null}
          />
        );
      } else if (inline.type === ELTYPE.MENTION) {
        leaves.push(
          <span
            className={css`
              color: #555555;
              background-color: rgba(0, 0, 0, 0.05);
              border-radius: 4px;
              padding: 0 3px;
              margin: 0 3px;
            `}
          >
            @{inline.data?.sn}
          </span>
        );
      }
    }
    leaves.push(<>{textArr[textArr.length - 1]}</>);
  }
  return leaves;
};

const SideCommentCreator = (props: any) => {
  const {
    editor,
    docId,
    sideCommentRowNum,
    setSideCommentRowNum,
    rangeId,
    curUserName,
    WIPCommentRangeId,
    setWIPCommentRangeId,
    identicalSelectionRangeId,
    setIdenticalSelectionRangeId,
    editorClientRect,
    containerClientRect,
  } = props;

  const sideCommentWidth = 280;
  const sideCommentRightThreshold = sideCommentWidth + 10;

  const [value, setValue] = useState([
    {
      type: ELTYPE.PARAGRAPH,
      children: [
        {
          text: '',
        },
      ],
    },
  ]);
  const [sideCommentRight, setSideCommentRight] = useState(-sideCommentWidth);
  const [commentValue, setCommentValue] = useState('');
  const creatorRef = useRef();

  useEffect(() => {
    const editorRight = editorClientRect.right;
    const containerRight = containerClientRect.right - 20;
    console.log('[con]', containerRight - editorRight < sideCommentRightThreshold, containerRight, editorRight, sideCommentRightThreshold);
    if (containerRight - editorRight < sideCommentRightThreshold) {
      setSideCommentRight(editorRight - containerRight);
    } else {
      setSideCommentRight(-sideCommentWidth);
    }
  }, [sideCommentRowNum]);

  useEffect(() => {
    let count = 0;
    const creatorMouseUpHandler = e => {
      if (!creatorRef || !creatorRef.current) {
        return;
      }
      let _con: any = creatorRef.current;
      if (!_con.contains(e.target) && sideCommentRowNum > 0) {
        if (count >= 1) {
          setSideCommentRowNum(-1);
          setWIPCommentRangeId(null);
          const nodesEntryArr = getNodesByRangeId(editor, rangeId);
          if (identicalSelectionRangeId) {
            setIdenticalSelectionRangeId(null);
          } else {
            deleteCommentByRangeId(editor, rangeId, nodesEntryArr, docId);
          }
          count = 0;
        } else {
          ++count;
        }
      }
    };
    document.addEventListener('mouseup', creatorMouseUpHandler);
    return () => {
      document.removeEventListener('mouseup', creatorMouseUpHandler);
    };
  }, []);

  const editorDom = document.getElementById(`editorarea-${docId}`);
  let curRowTop = 0;
  const curRow = editor?.children[sideCommentRowNum];
  if (curRow && curRow.type === ELTYPE.CARD) {
    console.log('curRow', curRow, curRow.children[1]);
    curRowTop = ReactEditor.toDOMNode(editor, curRow.children[1])?.getBoundingClientRect().top;
  } else {
    curRowTop = ReactEditor.toDOMNode(editor, curRow)?.getBoundingClientRect().top;
  }

  const top = curRowTop + 10 - editorDom.getBoundingClientRect().top;

  const commentValueLength = commentValue?.replace(/[\!\@]\[\[(.*?)\]\]/g, '').length;
  return (
    <EditorContainerInnerPortal docId={docId}>
      <div
        ref={creatorRef}
        className="comment-creator ignore-toggle-readonly"
        data-ignore-slate
        style={{
          position: 'absolute',
          right: sideCommentRight,
          top: top,
          width: sideCommentWidth,
          height: 'fit-content',
          background: '#fff',
          borderRadius: '2px',
          padding: '16px',
          boxShadow: '0 1px 4px -2px rgba(0,0,0,.13), 0 2px 8px 0 rgba(0,0,0,.08), 0 8px 16px 4px rgba(0,0,0,.04)',
          fontSize: '14px',
          zIndex: 1080,
        }}
      >
        <InlineSlateEditor value={value} setValue={setValue} setCommentValue={setCommentValue} />
        <div style={{ position: 'absolute', right: '16px' }}>
          <span style={{ color: commentValueLength > 500 ? '#f04f4f' : null }}>{commentValueLength}</span>
          /500
        </div>
        <button
          className="ignore-toggle-readonly"
          style={{
            borderRadius: '4px',
            color: commentValue === '' || commentValueLength > 500 ? '#bdbdbd' : '#595959',
            background: '#fafafa',
            border: '1px solid #d9d9d9',
            padding: '0 8px',
            marginTop: '5px',
            outline: 'none',
            cursor: commentValue === '' || commentValueLength > 500 ? 'not-allowed' : 'pointer',
          }}
          data-ignore-slate
          disabled={commentValue === '' || commentValueLength > 500}
          onClick={() => {
            const commentId = anchorId();
            const value = getInlineElList(commentValue);

            if (identicalSelectionRangeId) {
              setIdenticalSelectionRangeId(null);
              insertSideComment(
                editor,
                docId,
                {
                  userName: curUserName,
                  content: commentValue,
                  commentId,
                  rangeId: identicalSelectionRangeId,
                  time: timeFormat(),
                  mentionedMemberList: value,
                },
                false,
                null
              );
            } else {
              insertSideComment(
                editor,
                docId,
                {
                  userName: curUserName,
                  content: commentValue,
                  commentId,
                  rangeId,
                  time: timeFormat(),
                  mentionedMemberList: value,
                },
                false,
                null
              );
            }
            setSideCommentRowNum(-1);
            setWIPCommentRangeId(null);
          }}
        >
          {f('submit')}
        </button>
      </div>
    </EditorContainerInnerPortal>
  );
};

const InlineSideCommentButton = (props: any) => {
  const { comments, editor, position, isShowHoveringCommentButton } = props;
  const { docId, focusedRangeId, resetFocusedRangeId, setFocusedRangeId, WIPCommentRangeId } = React.useContext(TripdocsSdkContext);

  const [showInlineSideComment, setShowInlineSideComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [isReplyingComment, setIsReplyingComment] = useState(false);

  const sideCommentWidth = 280;

  const [sideCommentRight, setSideCommentRight] = useState(-sideCommentWidth);
  const commentWrapperRef = useRef();

  useEffect(() => {
    if (showInlineSideComment) {
      const editorRight = document.getElementById(`editorarea-${docId}`).getBoundingClientRect().right + 20;
      const containerRight = document.getElementById(`editorContainer-${docId}`).getBoundingClientRect().right;

      if (containerRight - editorRight < sideCommentWidth) {
        setSideCommentRight(editorRight - containerRight);
      } else {
        setSideCommentRight(-sideCommentWidth);
      }

      if (!!WIPCommentRangeId) return;
      const editorContent = document.getElementById(`editor-content-${docId}`);
      const commentItem: HTMLElement =
        focusedRangeId && editorContent?.querySelector(`[data-commentitem-rangeid='${focusedRangeId.replace(/['"\\]/g, '\\$&')}']`);
      const containerWrapDom = document.getElementById(`editor-content-wrap-${docId}`);
      if (commentItem && commentItem.offsetParent) {
        const offsetTop = (commentItem.offsetParent as HTMLElement).offsetTop + commentItem.offsetTop;
        const height = commentItem?.getBoundingClientRect().height;
        console.log('[] 自动滚动到 focused 评论', height, containerWrapDom, offsetTop - height, commentItem, commentItem.offsetParent);
        if (typeof offsetTop === 'number' && typeof height === 'number' && containerWrapDom) {
          containerWrapDom.scroll({ behavior: 'smooth', top: offsetTop - height });
        }
      }
    }
  }, [showInlineSideComment, WIPCommentRangeId]);

  useEffect(() => {
    console.log('1---InlineSideCommentButton---', focusedRangeId);
    if (focusedRangeId) {
      const isCommentIncluded = comments.some(item => item.rangeIdList && item.rangeIdList.includes(focusedRangeId));
      console.log('2---InlineSideCommentButton---', focusedRangeId, isCommentIncluded);
      if (isCommentIncluded) {
        setShowInlineSideComment(true);
      }
    }
  }, [focusedRangeId]);

  useEffect(() => {
    const sideCommentMouseUpHandler = e => {
      if (!commentWrapperRef || !commentWrapperRef.current) {
        return;
      }
      let _con: any = commentWrapperRef.current;

      if (!_con.contains(e.target) && showInlineSideComment) {
        setEditingCommentId(prevEditingCommentId => {
          setIsReplyingComment(prevIsReplyingComment => {
            if (prevIsReplyingComment) {
              deleteCommentByCommentId(editor, prevEditingCommentId, docId, true);
            }
            return false;
          });
          return null;
        });
        setShowInlineSideComment(false);
        resetFocusedRangeId();
      }
    };
    document.addEventListener('mouseup', sideCommentMouseUpHandler);
    return () => {
      document.removeEventListener('mouseup', sideCommentMouseUpHandler);
    };
  }, [showInlineSideComment]);

  const commentsRC = useMemo(() => {
    const rangesMapping = rangesMap(comments);
    console.log('commentData---333', comments, rangesMapping);
    let result = [];
    for (const rangeId in rangesMapping) {
      const filteredCommentContent = rangesMapping[rangeId]?.commentContent?.filter(item => item.rangeId === rangeId);
      const commentItem = (
        <div
          data-ignore-slate
          data-commentitem-rangeid={rangeId}
          key={'comment-item_' + rangeId}
          className={cx(
            'ignore-toggle-readonly',
            'inline-side-comment__item',
            css`
              &:hover {
                background: rgba(0, 0, 0, 0.03);
              }
              & {
                padding: 8px 0;
                background: ${rangeId === focusedRangeId ? `rgba(0,0,0,.03)` : null};
              }
            `
          )}
          onClick={e => {
            if (editingCommentId) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onMouseOver={e => {
            if (editingCommentId) {
              e.preventDefault();
              e.stopPropagation();
            } else {
              setFocusedRangeId(rangeId);
            }
          }}
        >
          <div
            data-ignore-slate
            className={cx(
              'ignore-toggle-readonly',
              'inline-side-comment__text',
              css`
                & {
                  margin: 0 16px;

                  padding-left: 8px;
                  border-left: 4px solid rgba(160, 160, 160, 0.3);
                  color: #a0a0a0;
                  width: ${sideCommentWidth - 24}px;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  overflow: hidden;
                }
              `
            )}
            title={rangesMapping[rangeId]?.text || ''}
          >
            {rangesMapping[rangeId]?.text}
          </div>
          {filteredCommentContent?.map((content: any, index: number, array: any) => {
            return (
              <CommentContent
                key={index}
                editor={editor}
                text={rangesMapping[rangeId]?.text}
                content={content}
                index={index}
                rangeId={rangeId}
                commentId={content.commentId}
                editingCommentId={editingCommentId}
                setEditingCommentId={setEditingCommentId}
                isReplyingComment={isReplyingComment}
                setIsReplyingComment={setIsReplyingComment}
                isShowHoveringCommentButton={isShowHoveringCommentButton}
                contentCollapseLength={50}
              />
            );
          })}
        </div>
      );

      result.push(commentItem);
    }
    return result;
  }, [showInlineSideComment, editingCommentId, JSON.stringify(comments), isReplyingComment]);

  return (
    <>
      <IconBtn
        data-ignore-slate
        contentEditable="false"
        suppressContentEditableWarning={true}
        style={{
          position: 'absolute',
          top: position.top,
          right: '10px',
          userSelect: 'none',
          color: 'rgba(0,0,0,0.85)',
          cursor: 'pointer',
        }}
        className={`Tripdocs-comment_multiple ignore-toggle-readonly`}
        onClick={e => {
          setShowInlineSideComment(true);
          e.stopPropagation();
          e.preventDefault();
        }}
      ></IconBtn>

      {showInlineSideComment && comments && (
        <>
          <div
            ref={commentWrapperRef}
            className="side-comment-wrapper ignore-toggle-readonly"
            data-ignore-slate
            contentEditable="false"
            suppressContentEditableWarning={true}
            style={{
              position: 'absolute',
              top: position.top,
              right: sideCommentRight,
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '0',
              background: '#fff',
              maxHeight: '410px',
              overflowY: 'auto',
              width: sideCommentWidth,
              boxShadow: '0 1px 4px -2px rgba(0,0,0,.13), 0 2px 8px 0 rgba(0,0,0,.08), 0 8px 16px 4px rgba(0,0,0,.04)',
              fontSize: '14px',
              zIndex: 1080,
            }}
            onClick={e => {}}
          >
            {commentsRC}
          </div>
        </>
      )}
    </>
  );
};

export const CommentContent = ({
  editor,
  text,
  content,
  index,
  rangeId,
  editingCommentId,
  setEditingCommentId,
  isReplyingComment,
  setIsReplyingComment,
  isShowHoveringCommentButton,
  contentCollapseLength,
}: any) => {
  const { docId, userInfo } = React.useContext(TripdocsSdkContext);
  const { commentId } = content;
  const [commentValue, setCommentValue] = useState(content.content);
  const editCommentEditorRef = useRef();
  const [isExpanded, setIsExpanded] = useState(true);

  const [value, setValue] = useState(deserialize(commentValue));

  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };

  useEffect(() => {
    console.log('content.content', commentValue);
    setCommentValue(prev => {
      if (prev !== content.content) {
        setValue(deserialize(content.content));
        return content.content;
      } else {
        return prev;
      }
    });
  }, [content.content]);

  const editCommentEditor = useMemo(() => {
    const commentValueLength = commentValue?.replace(/[\@|\!]\[\[(.*?)\]\]/g, '').length;
    return (
      <div
        ref={editCommentEditorRef}
        data-ignore-slate
        className={'inline-side-comment__editor'}
        style={{
          position: 'relative',
          padding: '0 16px',
        }}
      >
        {content.replyTarget && (
          <ReplyTargetContainer docId={docId} editor={editor} replyTarget={content.replyTarget} contentCollapseLength={contentCollapseLength} />
        )}
        <InlineSlateEditor value={value} setValue={setValue} setCommentValue={setCommentValue} />
        <div style={{ position: 'absolute', right: '16px' }}>
          <span style={{ color: commentValueLength > 500 ? '#f04f4f' : null }}>{commentValueLength}</span>
          /500
        </div>
        <button
          className="ignore-toggle-readonly"
          style={{
            borderRadius: '4px',
            color: commentValue === '' || commentValueLength > 500 ? '#bdbdbd' : '#595959',
            background: '#fafafa',
            border: '1px solid #d9d9d9',
            outline: 'none',
            padding: '0 8px',
            marginTop: '5px',
            cursor: commentValue === '' || commentValueLength > 500 ? 'not-allowed' : 'pointer',
            position: 'relative',
          }}
          data-ignore-slate
          disabled={commentValue === '' || commentValueLength > 500}
          onClick={e => {
            updateSideComment(
              editor,
              rangeId,
              {
                ...content,
                content: commentValue,
                mentionedMemberList: getInlineElList(commentValue),
                creator: {
                  headPortrait: getCache(docId, 'options').userInfo.headPortrait,
                },
              },
              docId,
              isReplyingComment
            );
            setEditingCommentId(null);
          }}
        >
          {f('submit')}
        </button>
        <button
          className="ignore-toggle-readonly"
          style={{
            borderRadius: '4px',
            color: '#595959',
            background: '#fafafa',
            border: '1px solid #d9d9d9',
            outline: 'none',
            padding: '0 8px',
            margin: '5px 0 0 10px',
            cursor: 'pointer',
            position: 'relative',
          }}
          data-ignore-slate
          onClick={e => {
            setEditingCommentId(prevEditingCommentId => {
              setIsReplyingComment(prevIsReplyingComment => {
                if (prevIsReplyingComment) {
                  deleteCommentByCommentId(editor, prevEditingCommentId, docId, true);
                }
                return false;
              });
              return null;
            });
          }}
        >
          {f('cancel')}
        </button>
      </div>
    );
  }, [commentId, editingCommentId, commentValue, docId]);
  const { banCommentNesting } = getCache(docId, 'options');
  const commentDisplay = useMemo(
    () => (
      <div
        key={'comment-display_' + index}
        data-ignore-slate
        className={cx(
          'inline-side-comment__content',
          'ignore-toggle-readonly',
          css`
            & {
              display: flex;
              flex-direction: row;
              padding: 10px 16px 0;

              div.comment-action__edit,
              div.comment-action__delete {
                visibility: hidden;
              }
              &:hover {
                div.comment-action__edit,
                div.comment-action__delete {
                  visibility: visible;
                }
              }
            }
          `
        )}
      >
        <div
          data-ignore-slate
          className="inline-side-comment__contentLeft ignore-toggle-readonly bbb"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            margin: '10px 10px 0 0',
          }}
        >
          {!content?.creator?.headPortrait && !(userInfo.userName === content.userName && userInfo.headPortrait) ? (
            <Avatar
              style={{
                backgroundColor:
                  content && content.userName && content.userName !== ''
                    ? `#${intToRGB(hashCode(content.userName))}`
                    : `#${intToRGB(Math.floor(Math.random() * 10000))}`,
              }}
            >
              <span data-ignore-slate contentEditable="false" suppressContentEditableWarning={true}>
                {content.userName?.split('）')[0].slice(-2)}
              </span>
            </Avatar>
          ) : (
            <Avatar src={<Image src={content?.creator?.headPortrait || userInfo.headPortrait} preview={false} style={{ width: 32 }} />} />
          )}
        </div>
        <div
          data-ignore-slate
          contentEditable="false"
          suppressContentEditableWarning={true}
          className="inline-side-comment__contentRight ignore-toggle-readonly"
          style={{ width: '100%' }}
        >
          {}
          <div
            data-ignore-slate
            contentEditable="false"
            suppressContentEditableWarning={true}
            className="inline-side-comment__userName ignore-toggle-readonly"
            onClick={content?.content?.replace(/\@\[\[.*?\]\]/g, '')?.length < contentCollapseLength ? null : toggleExpanded}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <div style={{ color: '#a0a0a0', fontSize: 12 }}>{content?.creator?.displayName || content.userName}</div>
            <div style={{ color: '#bfbfbf', fontSize: 12 }}>
              {}
              {timeFormat(new Date(content.time)) === new Date().getFullYear().toString()
                ? timeFormat(new Date(content.time)).slice(5, 16)
                : timeFormat(new Date(content.time)).slice(2, 16)}
              {}
            </div>
            <div
              className={css`
                position: absolute;
                right: 1rem;
                top: 1rem;
                color: #0a56bb99;
                ${isExpanded ? `transform: rotateZ(180deg);` : null}
                transition: transform 0.3s ease-in-out;
              `}
            >
              {content?.content?.replace(/\@\[\[.*?\]\]/g, '')?.length < contentCollapseLength ? null : <CaretDownOutlined />}
            </div>
          </div>
          {}
          {content.replyTarget && (
            <ReplyTargetContainer docId={docId} editor={editor} replyTarget={content.replyTarget} contentCollapseLength={contentCollapseLength} />
          )}
          <div
            data-ignore-slate
            contentEditable="false"
            suppressContentEditableWarning={true}
            className={cx([
              'inline-side-comment__desc',
              'ignore-toggle-readonly',
              css`
                & {
                  word-break: break-all;
                  display: -webkit-box;
                  -webkit-box-orient: vertical;
                  -webkit-line-clamp: ${isExpanded ? `none` : 1};
                  overflow: hidden;
                  white-space: pre-line;
                }
              `,
            ])}
          >
            {replaceInlineElements(content.content)}
          </div>
          <div
            data-ignore-slate
            contentEditable="false"
            suppressContentEditableWarning={true}
            className={cx(
              'inline-side-comment__action',
              'ignore-toggle-readonly',
              css`
                & {
                  display: flex;
                }
              `
            )}
          >
            {commentId && isShowHoveringCommentButton && (
              <>
                {!(banCommentNesting && content.replyTarget) && (
                  <CommentActionButton
                    action="reply"
                    onClickFn={e => {
                      const replyCommentId = createRandomId();
                      const contentObj = {
                        userName: content.userName,
                        content: '',
                        commentId: replyCommentId,
                        rangeId,
                        time: timeFormat(),
                        mentionedMemberList: [],
                      };
                      const replyTargetObj = { rangeId, ...content };
                      setEditingCommentId(replyCommentId);
                      setIsReplyingComment(true);
                      insertSideComment(editor, docId, contentObj, true, replyTargetObj);
                    }}
                  />
                )}
                {content.userName === userInfo.userName && (
                  <CommentActionButton
                    action="edit"
                    onClickFn={e => {
                      setIsReplyingComment(false);
                      setEditingCommentId(commentId);
                    }}
                  />
                )}
                {content.userName === userInfo.userName && (
                  <CommentActionButton
                    action="delete"
                    onClickFn={e => {
                      deleteCommentByCommentId(editor, commentId, docId, false);
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    ),
    [editingCommentId, commentId, commentValue, isExpanded, isReplyingComment, content.content]
  );

  return commentId === editingCommentId ? editCommentEditor : commentDisplay;
};

const commentActionsMap = function () {
  const cMap = new Map();
  cMap.set('edit', f('edit'));
  cMap.set('delete', f('delete'));
  cMap.set('reply', f('reply'));
  return cMap;
};

export const CommentActionButton = ({ action, onClickFn }: any) => {
  if (!commentActionsMap().has(action)) return;

  return (
    <div
      data-ignore-slate
      contentEditable="false"
      suppressContentEditableWarning={true}
      className={cx([
        `comment-action__${action}`,
        'ignore-toggle-readonly',
        css`
          & {
            color: #a0a0a0;
            margin-right: 8px;
            cursor: pointer;
            user-select: none;
            font-size: 14px;
          }
          &:hover {
            color: #000;
          }
        `,
      ])}
      onClick={onClickFn}
    >
      {' '}
      {commentActionsMap().get(action)}
    </div>
  );
};

export const ReplyTargetContainer = ({ editor, replyTarget, docId, contentCollapseLength }) => {
  const targetCommentId = replyTarget?.commentId;

  let targetObj = null;
  const commentContent = window.tripdocs.editorsMap[docId].commentData;
  commentContent && (targetObj = (commentContent as any).find(item => item.commentId === targetCommentId));

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };
  return (
    <div
      className="comment-content__replyContainer ignore-toggle-readonly"
      style={{
        background: 'rgba(0,0,0,.04)',
        padding: '4px 8px',
        margin: '4px 0',
        color: '#a0a0a0',
        borderRadius: '4px',
      }}
    >
      {!targetObj ? (
        <>{f('commentHasBeenDeleted')}</>
      ) : (
        <>
          {}
          <div
            className="comment-content__userName ignore-toggle-readonly"
            style={{ color: 'rgb(191, 191, 191)', cursor: 'pointer', position: 'relative' }}
            onClick={targetObj?.content?.replace(/\@\[\[.*?\]\]/g, '')?.length < contentCollapseLength ? null : toggleExpanded}
          >
            {f('replyTo')} {targetObj?.userName}
            <div
              className={css`
                position: absolute;
                right: 0.5rem;
                top: 0.3rem;
                color: rgb(143, 149, 158);
                ${isExpanded ? `transform: rotateZ(180deg);` : null}
                transition: transform 0.3s ease-in-out;
              `}
            >
              {targetObj?.content?.replace(/\@\[\[.*?\]\]/g, '')?.length < contentCollapseLength ? null : <CaretDownOutlined />}
            </div>
          </div>
          {}
          <div
            className={cx([
              'comment-content__content',
              css`
                & {
                  word-break: break-all;
                  display: -webkit-box;
                  -webkit-box-orient: vertical;
                  -webkit-line-clamp: ${isExpanded ? 5 : 1};
                  overflow: hidden;
                }
              `,
            ])}
          >
            {replaceInlineElements(targetObj?.content)}
          </div>
        </>
      )}
    </div>
  );
};

export { SideCommentCreator, InlineSideCommentButton };
