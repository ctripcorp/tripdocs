import _ from 'lodash';
import React from 'react';
import { Editor, Path, Transforms, Node } from '@src/components/slate-packages/slate';
import { ELTYPE, TABBABLE_TYPES } from '../config';
import './index.less';
import { getParentPathByTypes } from '../pluginsUtils/getPathUtils';

interface SlateElementProps {
  attributes: any;
  element: any;
  children: any;
  editor: any;
  elementUniqueId: any;
}

export const withBlockquote = <T extends Editor>(editor: T) => {
  const e = editor as T;

  const { deleteBackward } = e;

  e.deleteBackward = (unit: any) => {
    console.log('[withBlockquote] deleteBackward', unit);
    const { path, offset } = editor.selection.anchor;

    const parentNode = Node.parent(editor, path) as any;
    if ([ELTYPE.BLOCK_QUOTE].includes(parentNode.type)) {
      const [cellChildrenNodeFirstNode, cellChildrenNodeFirstPath] = Node.first(editor, path.slice(0, -1));

      const text = Node.string(parentNode);
      if (Path.equals(cellChildrenNodeFirstPath, path) && offset === 0 && text.length === 0) {
        console.log('withBlockquote deleteBackward', cellChildrenNodeFirstPath, cellChildrenNodeFirstNode, path);
        Transforms.setNodes(editor, { type: ELTYPE.PARAGRAPH } as any);
        console.log('[withBlockquote] returned ', text);
        return;
      }
    }
    deleteBackward(unit);
  };

  return e;
};

export const BlockQuote = (props: SlateElementProps) => {
  const { attributes, element, children, elementUniqueId } = props;

  return (
    <blockquote
      {...attributes}
      id={elementUniqueId}
      style={{
        lineHeight: element.lineHeight,
        textAlign: element.align ? element.align : 'left',
        display: 'block',
      }}
      className="component-block-quote"
      data-tab-level={element.tabLevel}
      data-line-height={element.lineHeight}
    >
      <span
        style={{
          marginLeft: _.isNumber(element.tabLevel) ? `${Number.parseInt(element.tabLevel) * 20}px` : null,
        }}
      >
        {children}
      </span>
    </blockquote>
  );
};
