import * as React from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from '../Button';
import './index.less';

function PortalImpl({ onCancel, children, onOk, title, linkText, linkHref, visible = true, closeOnClickOutside }: ModalProps) {
  const modalRef: any = useRef<HTMLDivElement>();

  useEffect(() => {
    if (modalRef.current !== null) {
      modalRef.current.focus();
    }
  }, []);

  useEffect(() => {
    let modalOverlayElement: any = null;
    const handler = event => {
      event.preventDefault();
      if (event.keyCode === 27) {
        onCancel && onCancel(event);
      }
    };
    const clickOutsideHandler = (event: MouseEvent) => {
      const target = event.target;
      if (modalRef.current !== null && !modalRef.current.contains(target as Node) && closeOnClickOutside) {
        onCancel && onCancel(event);
      }
    };
    if (modalRef.current !== null) {
      modalOverlayElement = modalRef.current?.parentElement;
      if (modalOverlayElement !== null && visible) {
        modalOverlayElement?.addEventListener('click', clickOutsideHandler);
      }
    }

    if (visible) {
      window.addEventListener('keydown', handler);
    }

    return () => {
      window.removeEventListener('keydown', handler);
      if (modalOverlayElement !== null) {
        modalOverlayElement?.removeEventListener('click', clickOutsideHandler);
      }
    };
  }, [closeOnClickOutside, onCancel, visible]);

  return (
    <div className="t_Modal__overlay" style={{ display: visible ? 'flex' : 'none' }}>
      <div className="t_Modal__modal" ref={modalRef}>
        <div className="t_Modal__header">
          <div className="t_Modal__title">{title}</div>
        </div>
        <button
          type="button"
          aria-label="Close"
          className="t_Modal__close"
          onClick={e => {
            onCancel && onCancel(e);
          }}
        >
          <span className="t_Modal__close-x">
            <div
              role="img"
              aria-label="close"
              className="anticon anticon-close ant-modal-close-icon tripdocs-sdk-iconfont Tripdocs-close"
              style={{ color: 'black' }}
            ></div>
          </span>
        </button>
        <div className="t_Modal__content">{children}</div>
        <div className="t_Modal__footer">
          {linkText ? (
            <Button type="link" href={linkHref}>
              {linkText}
            </Button>
          ) : (
            <span></span>
          )}
          <div>
            <Button
              type="cancel"
              onClick={e => {
                onCancel && onCancel(e);
              }}
            >
              取消
            </Button>
            <Button
              style={{ marginLeft: 10 }}
              type="primary"
              onClick={e => {
                onOk && onOk(e);
              }}
            >
              添加
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
interface ModalProps {
  children: JSX.Element | string | (JSX.Element | string)[];
  closeOnClickOutside?: boolean;
  onCancel?: (e) => void;
  onOk?: (e) => void;
  title: string;
  visible?: boolean;
  linkText: string;
  linkHref: string;
}

export default function Modal(props: ModalProps): JSX.Element {
  return createPortal(<PortalImpl {...props} />, document.body);
}
