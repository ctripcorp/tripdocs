import { css, cx } from '@emotion/css';
import { TooltipPlacement } from 'antd/lib/tooltip';
import React, { CSSProperties, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import './index.less';

export const OverlayContainerPortal = ({ children, docId }: any) => {
  const containerEl: any = document.getElementById(`overlayContainer-${docId}`);
  if (!containerEl) {
    return null;
  }
  return ReactDOM.createPortal(children, containerEl);
};

export interface OverlayProps {
  show: boolean;
  children: any;
  docId: string;
  overlayRefDom: HTMLElement;
  bordered?: boolean;
  placement?: TooltipPlacement;
  distance?: number;
  offset?: { top: number; left: number };
  overlayStyle?: CSSProperties;
  overlayWrapStyle?: CSSProperties;
  overlayWrapClassName?: string;
  left?: any;
  top?: any;
  zIndex?: number;
}

export const Overlay = (props: OverlayProps) => {
  const {
    show,
    children,
    docId,
    distance = 28,
    left,
    top,
    overlayRefDom,
    placement = 'top',
    bordered = false,
    offset = { left: 0, top: 0 },
    overlayStyle,
    overlayWrapStyle,
    overlayWrapClassName,
    zIndex = 200,
  } = props;

  const [overlayPos, setOverlayPos] = useState({ left: -999999999, top: -999999999 });

  useEffect(() => {
    if (!overlayRefDom) return;
    const editorContainerWrapEl = document.getElementById(`editor-content-wrap-${docId}`);
    if (!editorContainerWrapEl) return;
    const editorContainerWrapElRect = editorContainerWrapEl.getBoundingClientRect();
    const [wrapLeft, wrapTop] = [editorContainerWrapElRect?.left || 0, editorContainerWrapElRect?.top || 0];

    const { left, top, bottom, right } = overlayRefDom.getBoundingClientRect();

    let domPos: { left: number; top: number };

    switch (placement) {
      case 'top':
        domPos = {
          left: (right + left) / 2 - wrapLeft,
          top: top - wrapTop + editorContainerWrapEl.scrollTop - distance,
        };
        break;
      case 'right':
        domPos = {
          left: right - wrapLeft + distance,
          top: (top + bottom) / 2 - wrapTop + editorContainerWrapEl.scrollTop,
        };
        break;
      case 'bottom':
        domPos = {
          left: (right + left) / 2 - wrapLeft,
          top: bottom - wrapTop + editorContainerWrapEl.scrollTop + distance,
        };
        break;
      case 'left':
        domPos = {
          left: left - wrapLeft - distance,
          top: (top + bottom) / 2 - wrapTop + editorContainerWrapEl.scrollTop,
        };
        break;
      case 'leftTop':
        domPos = {
          left: left - wrapLeft - distance,
          top: top - wrapTop + editorContainerWrapEl.scrollTop,
        };
        break;
      case 'leftBottom':
        domPos = {
          left: left - wrapLeft - distance,
          top: bottom - wrapTop + editorContainerWrapEl.scrollTop,
        };
        break;
      case 'topLeft':
        domPos = {
          left: left - wrapLeft,
          top: top - wrapTop + editorContainerWrapEl.scrollTop - distance,
        };
        break;
      case 'topRight':
        domPos = {
          left: right - wrapLeft,
          top: top - wrapTop + editorContainerWrapEl.scrollTop - distance,
        };
        break;
      case 'rightTop':
        domPos = {
          left: right - wrapLeft + distance,
          top: top - wrapTop + editorContainerWrapEl.scrollTop,
        };
        break;
      case 'rightBottom':
        domPos = {
          left: right - wrapLeft + distance,
          top: bottom - wrapTop + editorContainerWrapEl.scrollTop,
        };
        break;
      case 'bottomLeft':
        domPos = {
          left: left - wrapLeft,
          top: bottom - wrapTop + editorContainerWrapEl.scrollTop + distance,
        };
        break;
      case 'bottomRight':
        domPos = {
          left: right - wrapLeft,
          top: bottom - wrapTop + editorContainerWrapEl.scrollTop + distance,
        };
        break;
    }

    domPos && setOverlayPos(domPos);
  }, [show, overlayRefDom, left, top, placement]);

  return (
    <>
      {show ? (
        <OverlayContainerPortal docId={docId}>
          <div
            className={cx('overlay-tmp-wrap', overlayWrapClassName)}
            style={{
              ...overlayWrapStyle,
              left: overlayPos.left + offset.left,
              top: overlayPos.top + offset.top,

              zIndex: zIndex,
            }}
          >
            <div
              className={cx('overlay-tmp', bordered ? 'overlay-tmp-bordered' : null)}
              style={{
                ...overlayStyle,
                transform: ['left', 'right'].includes(placement) ? 'translateY(-50%)' : 'translateX(-50%)',
              }}
            >
              {children}
            </div>
          </div>
        </OverlayContainerPortal>
      ) : null}
    </>
  );
};
