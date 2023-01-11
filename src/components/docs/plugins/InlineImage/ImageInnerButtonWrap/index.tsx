import { css, cx } from '@emotion/css';
import { TripdocsSdkContext } from '@src/Docs';
import { TooltipPlacement } from 'antd/lib/tooltip';
import React, { useContext, useEffect, useReducer, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { IconBtn } from '../../Components';
import { Overlay } from '../../OverlayComponents/Overlay';
import './index.less';

export const ImageInnerButton = (props: any) => {
  const { icon, cb } = props;
  return (
    <div className="image-inner-button" onMouseDownCapture={cb} contentEditable={false} style={{ userSelect: 'none' }}>
      {icon}
    </div>
  );
};

export const ImageInnerButtonWrap = (props: any) => {
  const { editor, setPreviewVisible } = props;

  const { isReadOnly, isMobile } = useContext(TripdocsSdkContext);

  return (
    <div className={cx('image-inner-button-wrap', isMobile ? '.imageContainer-mobile' : null)} contentEditable={false} style={{ userSelect: 'none' }}>
      {}
      <ImageInnerButton
        icon={<IconBtn className="Tripdocs-zoom_in" />}
        cb={e => {
          e.preventDefault();
          e.stopPropagation();
          setPreviewVisible(true);
        }}
      />
    </div>
  );
};
