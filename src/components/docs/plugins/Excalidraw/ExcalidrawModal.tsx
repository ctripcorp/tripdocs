import './ExcalidrawModal.css';

import Excalidraw from '@excalidraw/excalidraw';
import * as React from 'react';
import { ReactPortal, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import Button from './Button';
import Modal from './Modal';

export type ExcalidrawElementFragment = {
  isDeleted?: boolean;
};

type Props = {
  closeOnClickOutside?: boolean;

  initialElements: ReadonlyArray<ExcalidrawElementFragment>;

  isShown?: boolean;

  onDelete: () => boolean;

  onHide: () => void;

  onSave: (elements: ReadonlyArray<ExcalidrawElementFragment>) => void;
};

export default function ExcalidrawModal({ closeOnClickOutside = false, onSave, initialElements, isShown = false, onHide, onDelete }: Props) {
  const excalidrawRef = useRef(null);
  const excaliDrawModelRef = useRef(null);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [elements, setElements] = useState<ReadonlyArray<ExcalidrawElementFragment>>(initialElements);

  useEffect(() => {
    if (excaliDrawModelRef.current !== null) {
      excaliDrawModelRef.current.focus();
    }
  }, []);

  useEffect(() => {
    let modalOverlayElement = null;
    const clickOutsideHandler = (event: MouseEvent) => {
      const target = event.target;
      if (excaliDrawModelRef.current !== null && !excaliDrawModelRef.current.contains(target) && closeOnClickOutside) {
        onDelete();
      }
    };
    if (excaliDrawModelRef.current !== null) {
      modalOverlayElement = excaliDrawModelRef.current?.parentElement;
      if (modalOverlayElement !== null) {
        modalOverlayElement?.addEventListener('click', clickOutsideHandler);
      }
    }

    return () => {
      if (modalOverlayElement !== null) {
        modalOverlayElement?.removeEventListener('click', clickOutsideHandler);
      }
    };
  }, [closeOnClickOutside, onDelete]);

  const save = () => {
    if (elements.filter(el => !el.isDeleted).length > 0) {
      onSave(elements);
    } else {
      onDelete();
    }
    onHide();
  };

  const discard = () => {
    if (elements.filter(el => !el.isDeleted).length === 0) {
      onDelete();
    } else {
      setDiscardModalOpen(true);
    }
  };

  function ShowDiscardDialog(): JSX.Element {
    return (
      <Modal
        title="提示"
        onClose={() => {
          setDiscardModalOpen(false);
        }}
        closeOnClickOutside={true}
      >
        放弃这次改动吗?
        <div className="ExcalidrawModal__discardModal">
          <Button
            onClick={() => {
              setDiscardModalOpen(false);
              onHide();
            }}
          >
            确定
          </Button>{' '}
          <Button
            onClick={() => {
              setDiscardModalOpen(false);
            }}
          >
            取消
          </Button>
        </div>
      </Modal>
    );
  }

  useEffect(() => {
    excalidrawRef?.current?.updateScene({ elements: initialElements });
  }, [initialElements]);

  if (isShown === false) {
    return null;
  }

  const onChange = els => {
    setElements(els);
  };

  const _Excalidraw = Excalidraw.$$typeof != null ? Excalidraw : Excalidraw.default;

  return createPortal(
    <div className="ExcalidrawModal__overlay" role="dialog">
      <div className="ExcalidrawModal__modal" ref={excaliDrawModelRef} tabIndex={-1}>
        <div className="ExcalidrawModal__row">
          {discardModalOpen && <ShowDiscardDialog />}
          <_Excalidraw
            onChange={onChange}
            initialData={{
              appState: { isLoading: false },
              elements: initialElements,
            }}
          />
          <div className="ExcalidrawModal__actions">
            <button className="action-button" onClick={discard}>
              取消
            </button>
            <button className="action-button" onClick={save}>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
