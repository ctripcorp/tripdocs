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
import ExcalidrawModal from './ExcalidrawModal';

export const ExcalidrawEditor = ({ editor }) => {
  const imageContainerRef = useRef<HTMLImageElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isSelected, setSelected] = useState(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [elements, setElements] = useState([]);
  useEffect(() => {
    console.log('[excalidrawSetIsModalOpen]');
    const excalidrawSetIsModalOpen = elements => {
      setElements(elements);
      setModalOpen(true);
    };
    getEditorEventEmitter(editor.docId).on('excalidrawSetIsModalOpen', excalidrawSetIsModalOpen, editor.docId);
  }, []);

  const deleteNode = useCallback(() => {
    getEditorEventEmitter(editor.docId).emit('excalidrawSetIsModalClose', editor.docId);
    setModalOpen(false);

    return false;
  }, [editor]);

  const setData = newData => {
    return false;
  };

  return (
    <ExcalidrawModal
      initialElements={elements}
      isShown={isModalOpen}
      onDelete={deleteNode}
      onHide={() => {
        getEditorEventEmitter(editor.docId).emit('excalidrawSetIsModalClose', editor.docId);
        setModalOpen(false);
      }}
      onSave={newData => {
        getEditorEventEmitter(editor.docId).emit('excalidrawSetIsModalClose', editor.docId, newData);

        setModalOpen(false);
      }}
      closeOnClickOutside={true}
    />
  );
};
