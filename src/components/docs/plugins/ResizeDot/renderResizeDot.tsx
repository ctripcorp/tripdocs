import { css, cx } from '@emotion/css';
import React from 'react';
import './index.less';

interface ResizeDotProps {
  elementId: string;
  isResizing: boolean;
  visible: boolean;
  metrics: { width: number; height: number };
  onMouseDown: (e) => void;
  onMouseUp: (e) => void;
  onMouseMove: (e) => void;
}

export default function ResizeDot(props: ResizeDotProps) {
  const { elementId, visible, isResizing, metrics, onMouseDown, onMouseUp, onMouseMove } = props;

  return (
    <>
      {isResizing && !!metrics.width && !!metrics.width ? (
        <div
          contentEditable={false}
          data-ignore-slate
          className={cx(
            'resize-metric',
            'ignore-toggle-readonly',
            css`
              width: 100%;
              height: 100%;
              min-width: 50px;
              white-space: nowrap;
              overflow: hidden;
              display: flex;
              justify-content: center;
              align-items: center;
            `
          )}
        >
          {metrics.width} x {metrics.height}
        </div>
      ) : null}
      <div
        id={elementId + '_point1'}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        className={'dot'}
        data-visible={visible}
        data-id="point1"
      ></div>
      <div
        id={elementId + '_point2'}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        className={'dot'}
        data-visible={visible}
        data-id="point2"
      ></div>
      <div
        id={elementId + '_point3'}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        className={'dot'}
        data-visible={visible}
        data-id="point3"
      ></div>
      <div
        id={elementId + '_point4'}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        className={'dot'}
        data-visible={visible}
        data-id="point4"
      ></div>
    </>
  );
}
