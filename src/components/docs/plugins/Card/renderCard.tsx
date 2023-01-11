import { css, cx } from '@emotion/css';
import React, { useEffect } from 'react';
import { Editor, Range, Transforms } from '@src/components/slate-packages/slate';
import { ReactEditor, useFocused, useSelected } from '../../../slate-packages/slate-react';
import { ELTYPE } from '../config';
import $ from 'jquery';
import { MenuOutlined } from '@ant-design/icons';
import { hasTarget } from '@src/components/slate-packages/slate-react/components/editable';
import { getCache } from '@src/utils/cacheUtils';
const CardPreSuf = ({ attributes, children, element }) => {
  if (element.type === ELTYPE.CARD_PRE) {
    return (
      <div
        className="card_pre"
        {...attributes}
        onDragOverCapture={e => {
          console.log('[card_pre] onDragOverCapture', e.target);
          e.dataTransfer.dropEffect = 'none';
          e.preventDefault();
        }}
      >
        {children}
      </div>
    );
  } else {
    return (
      <div
        className="card_suf"
        {...attributes}
        onDragOverCapture={e => {
          console.log('[card_suf] onDragOverCapture', e.target);
          e.dataTransfer.dropEffect = 'none';
          e.preventDefault();
        }}
      >
        {children}
      </div>
    );
  }
};

const _onClick = event => {
  event.preventDefault();
  return false;
};
const _onDoubleClick = event => {
  event.preventDefault();
  return false;
};

const _onDragCapture = event => {
  const { target } = event;
  if (target) {
    const { nodeName } = target;
    if (!['P', 'LI', 'SPAN'].includes(nodeName)) {
      const isDragHandle = (target as HTMLElement)?.closest('.drag-handle');
      if (!isDragHandle) {
        console.log('_onDragCapture: prevented', event);
        event.preventDefault();
        return false;
      }
    }
  }
};

const Card = React.forwardRef(({ attributes, children, element, editor }: any, ref: any) => {
  const selected = useSelected();
  const focused = useFocused();
  let cn = selected && focused ? true : null;

  let fakeSelected = null;

  const isTable = ref.current && ref.current?.childNodes[1]?.childNodes[2]?.childNodes[0]?.tagName === 'TABLE';
  if (ref && ref.current && editor.selection && ReactEditor.hasRange(editor, editor.selection) && Range.isExpanded(editor.selection) && !isTable) {
    let slateNode = ReactEditor.toSlateNode(editor, ref.current?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]);
    if (!slateNode) return;
    let slateNodePath = ReactEditor.findPath(editor, slateNode);
    if (!slateNodePath) return;
    fakeSelected = Range.includes(editor.selection, slateNodePath);
  }

  useEffect(() => {
    let selection = window.getSelection();

    if (selection.rangeCount) {
      let range = selection.getRangeAt(0);
      let results = [];

      $('.card_pre,.card_suf', range.commonAncestorContainer).filter(function () {
        let card_filter = selection.containsNode(this);

        if (card_filter) {
          if ($(this).hasClass('card_pre')) {
            results.push($(this).parent()[0]);
          } else {
            results.push($(this).parent()[0]);
          }
        }
      });
      results = [...new Set(results)];
      $('.fake-selected2').removeClass('fake-selected2');

      $(results).each(function (i, item) {
        $(item).addClass('fake-selected2');
      });
    }
  }, [editor?.selection]);

  return (
    <div
      {...attributes}
      contentEditable={false}
      ref={ref}
      data-ignore-slate
      className={cx('card', 'sider-menu-wrapper', fakeSelected ? `fake-selected` : null)}
      data-activated={cn}
      onClick={_onClick}
      onDoubleClick={_onDoubleClick}
      onDragCapture={_onDragCapture}
      onDragStartCapture={_onDragCapture}
      onDragOverCapture={e => {
        const dragDataTransfer = getCache(editor.docId, 'drag-data-transfer');
        const allowDragging = dragDataTransfer && !!dragDataTransfer.dragData;
        if (!allowDragging) {
          console.log('[card] onDragOverCapture', e.target);
          e.dataTransfer.dropEffect = 'none';
          e.preventDefault();
        }
      }}
      onDragEndCapture={_onDragCapture}
    >
      {children}
      {}
    </div>
  );
});
export { Card, CardPreSuf };
