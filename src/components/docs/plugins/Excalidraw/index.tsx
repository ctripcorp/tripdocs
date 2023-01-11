import React, { useCallback, useEffect, useRef, useState } from 'react';

import { v4 as anchorId } from 'uuid';
import { Transforms, Node, Path } from '@src/components/slate-packages/slate';
import { insertCard } from '../Card';
import { ELTYPE } from '../config';
import initialData from './initialData';
import Sidebar from './Sidebar/Sidebar';
import ExcalidrawImage from './ExcalidrawImage';
import ImageResizer from './ImageResizer';
import { getEditorEventEmitter } from '../table/selection';

import './index.less';
import Excalidraw, { exportToCanvas, exportToSvg, exportToBlob } from '@excalidraw/excalidraw';
import { ReactEditor } from '@src/components/slate-packages/slate-react';

import $ from 'jquery';
import { SlateInlineImage } from '../InlineImage/inlineImagePlugins';

export const ExcalidrawDomNode = ({ attributes, children, element, editor, newProps }) => {
  const imageContainerRef = useRef<HTMLImageElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isSelected, setSelected] = useState(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [elements, setElements] = useState(element.elements.length ? element.elements : initialData.elements);
  const excalidrawSetIsModalClose = elements => {
    getEditorEventEmitter(editor.docId).off('excalidrawSetIsModalClose', excalidrawSetIsModalClose, editor.docId);
    if (elements) {
      setElements(elements);
      const buttonPath = ReactEditor.findPath(editor, ReactEditor.toSlateNode(editor, buttonRef.current.parentNode));
      Transforms.setNodes(
        editor,
        { elements: elements },
        {
          at: buttonPath,
        }
      );
    }
  };
  const scrollRefClick = event => {
    const buttonElem = buttonRef.current;
    const eventTarget = event.target;

    if (isResizing) {
      return true;
    }

    if (buttonElem !== null && buttonElem.contains(eventTarget)) {
      event.preventDefault();

      event.stopPropagation();
      if (!event.shiftKey) {
      }
      setSelected(!isSelected);
      if (event.detail > 1) {
        getEditorEventEmitter(editor.docId).on('excalidrawSetIsModalClose', excalidrawSetIsModalClose, editor.docId);
        getEditorEventEmitter(editor.docId).emit('excalidrawSetIsModalOpen', editor.docId, elements);
      }
      return true;
    } else {
      setSelected(false);
    }

    return false;
  };

  useEffect(() => {
    getEditorEventEmitter(editor.docId).on('scrollRefClick', scrollRefClick, editor.docId);
    return () => {
      getEditorEventEmitter(editor.docId).off('scrollRefClick', scrollRefClick, editor.docId);
    };
  }, [isSelected]);

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const onResizeEnd = (nextWidth, nextHeight) => {
    getEditorEventEmitter(editor.docId).off('scrollRefClick', scrollRefClick, editor.docId);
    setTimeout(() => {
      setIsResizing(false);
      const $imageContainerRef = $(imageContainerRef.current);
      const width = nextWidth + 'px';
      const height = nextHeight + 'px';
      const $editoImage = $imageContainerRef.closest('.editor-image');
      const editoImagePath = ReactEditor.findPath(editor, ReactEditor.toSlateNode(editor, $editoImage[0]));

      Transforms.setNodes(editor, { width: width, height: height } as Partial<Node>, {
        at: editoImagePath,
      });

      getEditorEventEmitter(editor.docId).on('scrollRefClick', scrollRefClick, editor.docId);
    }, 200);
  };

  console.log('[scrollRefClick]isSelected', isSelected, isResizing);
  return (
    <span className="editor-image-container">
      <div className="ignore-toggle-readonly" contentEditable={false} data-ignore-slate={true}>
        {elements.length > 0 && (
          <div {...attributes} className="editor-image">
            <button data-ignore-slate={true} ref={buttonRef} className={`ignore-toggle-readonly excalidraw-button ${isSelected ? 'selected' : ''}`}>
              <ExcalidrawImage
                imageContainerRef={imageContainerRef}
                className="image"
                elements={elements}
                width={element.width}
                height={element.height}
              />
              {(isSelected || isResizing) && (
                <ImageResizer
                  showCaption={true}
                  setShowCaption={() => null}
                  imageRef={imageContainerRef}
                  editor={editor}
                  onResizeStart={onResizeStart}
                  onResizeEnd={onResizeEnd}
                />
              )}
            </button>
          </div>
        )}
      </div>
    </span>
  );
};

export const ExcalidrawSlateNode = (editor: any, selectionFocusPath: Path = editor.selection.focus.path) => {
  console.log('[ExcalidrawSlateNode]', editor.selection);
  Transforms.insertNodes(
    editor,
    {
      type: ELTYPE.EXCALIDRAW,
      width: '200px',
      height: '200px',
      elements: [],
      children: [{ text: '123' }],
    } as Node,
    { at: editor.selection }
  );
};

export const withExcalidraw = (editor: any) => {
  const { isVoid, insertData, deleteBackward, deleteForward, deleteFragment, isInline, apply, setFragmentData } = editor;
  editor.isInline = (element: Element) => {
    return (element as any).type === ELTYPE.EXCALIDRAW ? true : isInline(element);
  };
  editor.isVoid = (element: any) => {
    return element.type === ELTYPE.EXCALIDRAW ? true : isVoid(editor);
  };
  return editor;
};
export function normalizeExcalidraw(editor, entry) {
  const [node, path] = entry;

  return false;
}
