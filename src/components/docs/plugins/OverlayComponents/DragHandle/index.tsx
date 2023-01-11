import { HolderOutlined } from '@ant-design/icons';
import { Editor, Transforms, Node } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { TripdocsSdkContext } from '@src/Docs';
import { f } from '@src/resource/string';
import { getCache, setCache } from '@src/utils/cacheUtils';
import { Tooltip } from 'antd';
import React, { useEffect, useReducer, useRef, useState, DragEvent, useContext, useCallback } from 'react';
import { ELTYPE } from '../../config';
import { getInlineImageSelectForPath } from '../../InlineImage/inlineImagePlugins';
import { Overlay } from '../Overlay';
import './index.less';

let dragStop = false;

type DragHandleProps = {
  editor: any;
  isOverElement: boolean;

  docId: string;
  overlayRefDom: HTMLElement;
  findDomToEl?: (dom: Element) => any;
  distance?: number;
};

function DragHandle(props: DragHandleProps) {
  const {
    editor,
    docId,
    isOverElement,
    overlayRefDom,
    distance = 24,
    findDomToEl = (dom: Element) => dom?.closest('[data-slate-node="element"]'),
  } = props;
  const { isReadOnly } = useContext(TripdocsSdkContext);

  const [el, setEl] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const [showDragHandle, toggleShowDragHandle] = useReducer((state, action) => action === 'on', false);
  const [hover, toggleHover] = useReducer((state, action) => action === 'on', false);
  const [drag, toggleDrag] = useReducer((state, action) => action === 'on', false);
  const handleRef = useRef();

  useEffect(() => {
    if (hover || drag || isOverElement) {
      toggleShowDragHandle('on');
    }
    if (!hover && !drag && !isOverElement) {
      toggleShowDragHandle('off');
    }
  }, [hover, drag, isOverElement]);

  useEffect(() => {
    const handle: HTMLElement = handleRef?.current;
    if (!handle || typeof window === 'undefined') {
      return;
    }

    const rect: DOMRect = handle.getBoundingClientRect();
    const [x, y] = [rect.x, rect.y];
    const offset = rect.width + distance;
    const el: HTMLElement = findDomToEl(document.elementFromPoint(x + offset, y));

    if (!el) return;
    setEl(el);
  }, [handleRef?.current]);

  function handleDragStart(e: DragEvent<HTMLDivElement>) {
    e.stopPropagation();
    setTooltipVisible(false);

    ReactEditor.deselect(editor);

    let node = ReactEditor.toSlateNode(editor, el);
    console.log('DragHandle 0', node, el, e);
    if (!node) return;
    let path = ReactEditor.findPath(editor, node);
    const parentEntry = Editor.parent(editor, path);
    if (parentEntry && (parentEntry[0] as any).type === ELTYPE.CARD) {
      [node, path] = [parentEntry[0], parentEntry[1]];
    }
    console.log('DragHandle 0.5', node, path);
    const isInline = [ELTYPE.INLINEIMAGE].includes((node as any)?.type);

    const dt = new DataTransfer();
    if (path) {
      const range = Editor.range(editor, path);
      Transforms.select(editor, range);
      const fragment = isInline ? getInlineInFragment(editor, path) : editor.getFragment();
      console.log('DragHandle 1', isInline, range, path, fragment);
      console.log('DragHandle 1.5', range, Node.fragment(editor, range));

      dt.setData('text/html', JSON.stringify(fragment));
      dt.setData('text/plain', JSON.stringify(fragment));
    }

    const dragDataTransfer = {
      dragData: dt,
      dragOriginalPath: path,
      isInline: isInline,
    };
    setCache(docId, 'drag-data-transfer', dragDataTransfer);
    toggleDrag('on');
    const handle: any = handleRef?.current;
    if (handle) handle.style.opacity = '0.4';
    e.dataTransfer.setData('text/html', JSON.stringify(editor.getFragment()));
    e.dataTransfer.setData('text/plain', JSON.stringify(editor.getFragment()));
    e.dataTransfer.setDragImage(el, 0, 0);
    e.dataTransfer.effectAllowed = 'all';
    ReactEditor.setFragmentData(editor, e.dataTransfer);

    console.log('DragHandle 2', node, e.dataTransfer, dt, editor.getFragment());
  }

  const handleDrag = useCallback(e => {
    const scrollWrap: HTMLElement = getCache(docId, 'editorWrapDom');
    const scrollWrapRect = scrollWrap.getBoundingClientRect();
    dragStop = true;
    if (e.clientY < scrollWrapRect.top + Math.floor(scrollWrapRect.height * 0.15)) {
      dragStop = false;
      scroll(-10);
    }
    if (e.clientY > scrollWrapRect.bottom - Math.floor(scrollWrapRect.height * 0.15)) {
      dragStop = false;
      scroll(10);
    }
  }, []);

  const scroll = useCallback(step => {
    const scrollWrap: HTMLElement = getCache(docId, 'editorWrapDom');
    if (scrollWrap) {
      const scrollY = scrollWrap.scrollTop;
      scrollWrap.scrollTo({ top: scrollY + step });
    }
  }, []);

  function handleDragEnd(e: DragEvent<HTMLDivElement>) {
    console.log('dragEnd', e);
    dragStop = true;
    toggleDrag('off');
    const handle: any = handleRef?.current;
    if (handle) handle.style.opacity = '1';
  }

  return (
    <Overlay show={!isReadOnly && showDragHandle} docId={docId} placement={'leftTop'} overlayRefDom={overlayRefDom} distance={distance}>
      <div
        className="drag-handle"
        draggable={true}
        ref={handleRef}
        onMouseEnter={() => toggleHover('on')}
        onMouseLeave={() => {
          setTooltipVisible(false);
          setTimeout(() => toggleHover('off'), 400);
        }}
        onDragStartCapture={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        <Tooltip
          title={<span style={{ fontSize: 12 }}>{f('dragHandle')}</span>}
          placement="top"
          visible={tooltipVisible}
          onVisibleChange={visible => setTooltipVisible(visible)}
        >
          <div className="drag-handle__container">
            <DragHandleBtn toggleHover={toggleHover} />
          </div>
        </Tooltip>
      </div>
    </Overlay>
  );
}

export function getInlineInFragment(editor, path) {
  const inlineNode = Node.get(editor, path);
  const emptyText = { text: '' };
  const frag = [emptyText, inlineNode, emptyText];
  return frag;
}

function DragHandleBtn(props) {
  return (
    <div className="drag-handle__button">
      <HolderOutlined />
    </div>
  );
}

async function copy(data) {
  console.log('copy');
  const permit = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
  if (permit.state === 'granted' || permit.state === 'prompt') {
    const clipboard = await navigator.clipboard.write(data);
    console.log('clipboard', clipboard);
  }
}

export default DragHandle;
