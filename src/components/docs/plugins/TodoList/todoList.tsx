import classNames from 'classnames';
import React, { useContext, useState } from 'react';
import { Editor, Element as SlateElement, Point, Range, Transforms, Node } from '@src/components/slate-packages/slate';
import { ELTYPE } from '../config';
import './todoList.less';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { CalendarOutlined } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { TripdocsSdkContext } from '@src/Docs';

export const withTodolists = (editor: any) => {
  const { deleteBackward, deleteFragment } = editor;

  editor.deleteBackward = (...args: any) => {
    const { selection } = editor;

    if (selection && ReactEditor.hasRange(editor, selection) && Range.isCollapsed(selection)) {
      const [match] = Editor.nodes(editor, {
        match: (n: any) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === ELTYPE.TODO_LIST,
      });

      if (match) {
        const [, path] = match;
        const start = Editor.start(editor, path);

        if (Point.equals(selection.anchor, start)) {
          Transforms.setNodes(
            editor,
            {
              type: ELTYPE.PARAGRAPH,
            } as Partial<SlateElement>,
            {
              match: (n: any) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === ELTYPE.TODO_LIST,
            }
          );
          return;
        }
      }
    }

    deleteBackward(...args);
  };

  return editor;
};

interface todoListProps {
  attributes: any;
  children: any;
  element: any;
  editor: any;
}

export const TODOList: React.FC<any> = (props: any) => {
  const {
    prop: { attributes, element },
    className = '',
    editor,
    children,
    elementUniqueId,
    textAlign,
    isInAnchor = false,
    isMobile = false,
    lineHeight,
  } = props;
  const { oldType = '', todoChecked = '', align = 'left' } = element;

  let tabLevel: any = 0;
  if (!Number.isNaN(element.tabLevel)) {
    tabLevel = element.tabLevel;
  }

  const { isReadOnly } = useContext(TripdocsSdkContext);
  const [isActive, setIsActive] = useState(false);

  return (
    <ol
      {...attributes}
      onMouseEnter={e => {
        setIsActive(true);
      }}
      onMouseLeave={e => {
        setIsActive(false);
      }}
      className={`todo-list-wrap ${!isInAnchor ? oldType : ''}`}
      style={{
        lineHeight,
        textAlign: textAlign,
        marginLeft: isInAnchor ? (isMobile ? '-0.2rem' : '1rem') : '0rem',
      }}
    >
      <span
        className={cx('todo-list-checkbox', todoChecked ? 'todo-list-checkbox-done' : null, 'ignore-toggle-readonly')}
        contentEditable={false}
        style={{
          userSelect: 'none',
          left: isInAnchor ? '-1rem' : tabLevel ? `${Number.parseInt(tabLevel) * 2 + 0.5}rem` : '0.5rem',
          width: isInAnchor ? '12px' : null,
          height: isInAnchor ? '12px' : null,
        }}
        onClick={e => {
          if (!editor || isReadOnly) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          const elPath = ReactEditor.findPath(editor, element);
          console.log('click', [element, todoChecked, element.tabLevel, Number.parseInt(element.tabLevel) * 20]);

          if (!todoChecked) {
            Transforms.setNodes(editor, { todoChecked: true } as Partial<Node>, { at: elPath });
          } else {
            Transforms.setNodes(editor, { todoChecked: false } as Partial<Node>, { at: elPath });
          }
        }}
      ></span>
      <li
        id={elementUniqueId}
        data-name={'todo-list-item' + (todoChecked ? '-done' : '')}
        className={classNames([
          'todo-list-item',
          todoChecked ? 'todo-list-item-done' : null,
          css`
            &::before {
              margin-left: ${isInAnchor ? '0 !important' : null};
              margin-right: ${isInAnchor ? '5px !important' : null};
            }
          `,
          css(
            isInAnchor
              ? `
            &{
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
              white-space: nowrap;
            }
        `
              : ``
          ),
        ])}
        data-tab-level={tabLevel}
        style={{
          textAlign: align ? align : 'left',
          paddingLeft: isInAnchor ? null : tabLevel ? `${Number.parseInt(tabLevel) * 2 + 2}rem` : '2rem',
          listStyleType: 'none',
          backgroundColor: isActive && !isInAnchor ? `#f6f6f6` : null,
          backgroundClip: 'content-box',
          borderRadius: '4px',
        }}
        data-oldtype={oldType}
        data-li-name={oldType ? 'slate-heading' : ''}
      >
        {children}
      </li>
      {}
      {false && isActive && (
        <div
          data-ignore-slate
          className={cx(
            'ignore-toggle-readonly',
            'todo-menu-wrap',
            css`
              position: absolute;
              right: 1.5em;
              bottom: 3px;
              display: flex;
              cursor: pointer;
              align-items: center;
              & > .todo-menu-item {
                width: 18px;
                height: 18px;
                border-radius: 4px;
                &:hover {
                  background: #b6b6b6;
                }
                &:not(:last-child) {
                  margin-right: 1.5em;
                }
              }
            `
          )}
        >
          <div className="todo-menu-item todo-mention" onMouseDown={() => {}}>
            @
          </div>
          <div className="todo-menu-item todo-calendar">
            <CalendarOutlined />
          </div>
        </div>
      )}
    </ol>
  );
};
