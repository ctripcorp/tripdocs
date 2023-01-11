import React, { useContext, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Editor, Element, Node, Text, Range, Path } from '@src/components/slate-packages/slate';
import { ReactEditor, useFocused, useSelected } from '../../../slate-packages/slate-react/index';
import { ELTYPE } from '../config';
import { Transforms } from '../../../slate-packages/slate';
import { actionKey, applyOpt } from '../../../../utils/apiListener';
import { bodySelectAll } from '@src/utils/selectionUtils';
import { TripdocsSdkContext } from '@src/Docs';
import { Avatar, Popover } from 'antd';
import { css, cx } from '@emotion/css';
import { SEL_CELLS } from '@src/utils/weak-maps';
import { createUUID } from '@src/utils/randomId';
import { f } from '@src/resource/string';
import { getCache } from '@src/utils/cacheUtils';

interface SlateElement {
  attributes: any;
  children: any;
  element: any;
  editor: any;
  editorId: string;
}

function MentionInfo(props) {
  const { user } = props;
  return (
    <>
      <div
        className={cx(
          'mention-info-hero',
          css`
            display: flex;
            margin-bottom: 0.5em;
          `
        )}
      >
        <Avatar src={user?.avatarUrl} size={28} />
        <div
          className={cx(
            'mention-item-info',
            css`
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: start;
            `
          )}
        >
          <div
            className={css`
              margin-left: 0.5em;
              font-weight: bold;
            `}
          >
            {user?.displayname || user?.c_name}
          </div>
        </div>
      </div>
      {}
      <div
        className={css`
          display: grid;
          grid-template-columns: 32px 1fr;
          grid-gap: 0.5em;
          grid-template-rows: auto;
        `}
      >
        <div>{f('email')}:</div>
        <div> {user?.ad_email}</div>
        <div>{f('empcode')}:</div>
        <div>{user?.empcode}</div>
        <div>BU: </div>
        <div> {user?.businessname}</div>
        <div>{f('department')}:</div>
        <div>{user?.department}</div>
        <div>{f('positionname')}:</div>
        <div>{user?.positionname}</div>
      </div>
    </>
  );
}

export const MentionElement = ({ attributes, children, element, editorId, editor }: SlateElement): any => {
  const selected = useSelected();
  const focused = useFocused();
  const { docId } = useContext(TripdocsSdkContext);
  const { targetUser, senderUser, id } = element;
  const [isSelected, setIsSelected] = useState(false);
  const selCells = SEL_CELLS.get(editor);
  const [isMe, setIsMe] = useState(false);
  useEffect(() => {
    const options = getCache(docId, 'options');
    const { employee } = options.userInfo;

    if (targetUser.empcode === employee || targetUser.userId === employee) {
      setIsMe(true);
    }
    console.log(options);
  }, []);

  return (
    <>
      <span
        {...attributes}
        contentEditable={false}
        id={element.id}
        className={cx(
          'ignore-toggle-readonly',
          css`
            & {
              padding: 0 8px;
              margin: 0px 3px;
              box-sizing: border-box;
              vertical-align: baseline;
              display: inline-block;
              border-radius: 4px;
              font-size: 13px;
              box-shadow: ${(selected && !selCells?.length) || isSelected ? '0 0 0 2px #B4D5FF' : 'none'};
              &:focus {
                background-color: red;
              }
            }
          `
        )}
        style={{
          background: isMe ? 'rgb(20, 120, 222)' : 'rgb(238, 238, 238)',
          color: isMe ? 'white' : 'black',
        }}
        onClick={(e: any) => {
          e.preventDefault();
          e.stopPropagation();
          const data = {
            id,
            type: 'click',
            targetUser: targetUser,
            senderUser: senderUser,
            title: (Node.get(editor, [0, 0]) as any).text,
            href: document.location.href,
          };
          applyOpt(actionKey.mentionCallback, data, editorId.split('-')[1]);
          const path = ReactEditor.findPath(editor, element);
          Transforms.select(editor, path);
        }}
      >
        <Popover
          content={<MentionInfo user={element?.targetUser} />}
          overlayInnerStyle={{ borderRadius: '4px' }}
          trigger={['click']}
          placement={'rightTop'}
          visible={isSelected}
          onVisibleChange={visible => setIsSelected(visible)}
        >
          <span data-target-user={JSON.stringify(element.targetUser)} style={{ display: 'inline-block', userSelect: 'none' }}>
            {`@${element?.targetUser?.sn}`}
            <span className={cx('ignore-toggle-readonly')} contentEditable={false} style={{ userSelect: 'none', display: 'none' }}>
              {children}
            </span>
          </span>
        </Popover>
      </span>
    </>
  );
};

export const insertMention = (editor: any, character: any, cUser: any, docId: any) => {
  const focusPath = editor.selection.focus.path;
  const postLeafPath = [...focusPath.slice(0, -1), focusPath[focusPath.length - 1] + 2];

  const id = createUUID();
  const mention = {
    type: ELTYPE.MENTION,
    targetUser: character,
    senderUser: cUser,
    id,
    children: [{ text: '' }],
  };
  console.log('insertMention', mention);
  Transforms.insertNodes(editor, mention);

  console.log('{{{postLeafPath}}}', editor, mention, focusPath);
  const content = Node.string(Node.get(editor, [Range.start(editor.selection).path[0]]));
  if (Editor.hasPath(editor, postLeafPath)) {
    Transforms.select(editor, {
      path: postLeafPath,
      offset: 0,
    });
  }

  const senderUser = cUser || {};

  const data = {
    id,
    targetUser: character,
    senderUser: senderUser,
    title: (Node.get(editor, [0, 0]) as any).text,
    href: document.location.href,
    content: content,
    format: '',
    type: 'insert',
  };
  applyOpt(actionKey.mentionCallback, data, docId);
};
