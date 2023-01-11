import { css } from '@emotion/css';
import React from 'react';
import { formatFileSize } from './filePlugins';

function Progress({ innerBarId, filename, size }) {
  const formattedSize = formatFileSize(size);
  return (
    <div
      contentEditable={false}
      className={css`
        user-select: none;
        margin: 12px 0;
        padding: 10px 5px 0;
        border-radius: 4px;
        color: rgb(9, 109, 217);
        box-shadow: 0px 0px 2px 0px #ddd;
        border-radius: 4px;
      `}
    >
      <div
        contentEditable={false}
        className={css`
          user-select: none;
          width: 100%;
          height: 30px;
          &:before {
            content: '📄';
            margin-right: 8px;
          }
        `}
      >
        {filename}
        <span
          contentEditable={false}
          className={css`
            margin-left: 10px;
            color: #a0a0a0;
            font-size: 12px;
          `}
        >
          {formattedSize}
        </span>
      </div>
      <div
        contentEditable={false}
        className={css`
          user-select: none;
          width: 100%;
          height: 2px;
          background-color: rgba(37, 119, 227, 0.1);
        `}
      >
        <div
          id={innerBarId}
          contentEditable={false}
          className={css`
            user-select: none;
            width: 0%;
            height: 2px;
            transition: width 0.2s ease-in;
            background-color: rgb(37, 119, 227);
          `}
        ></div>
      </div>
    </div>
  );
}

export default Progress;
