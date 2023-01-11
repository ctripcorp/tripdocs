import { HolderOutlined } from '@ant-design/icons';
import { Editor, Transforms, Node } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { TripdocsSdkContext } from '@src/Docs';
import { f } from '@src/resource/string';
import { setCache } from '@src/utils/cacheUtils';
import { Tooltip } from 'antd';
import React, { useEffect, useReducer, useRef, useState, DragEvent, useContext, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ELTYPE } from '../../config';
import { getInlineImageSelectForPath } from '../../InlineImage/inlineImagePlugins';
import { Overlay, OverlayContainerPortal, OverlayProps } from '../Overlay';
import './index.less';

function TableAddBtnOverlay(props: OverlayProps & { tableRef: any }) {
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
    tableRef,
    ...rest
  } = props;

  const { isReadOnly } = useContext(TripdocsSdkContext);
  const [tableOverlayStyle, setTableOverlayStyle] = useState({});

  useEffect(() => {
    const tableEl = tableRef.current;

    if (!overlayRefDom || !tableEl) return;
    const editorContainerWrapEl = document.getElementById(`editor-content-wrap-${docId}`);
    const editorContainerWrapElRect = editorContainerWrapEl.getBoundingClientRect();
    const [wrapLeft, wrapTop] = [editorContainerWrapElRect?.left || 0, editorContainerWrapElRect?.top || 0];

    const tableElRect = tableEl.getBoundingClientRect();
    const { left, top, bottom, right } = overlayRefDom.getBoundingClientRect();

    if (
      (placement === 'topRight' && right - wrapLeft - 5 > tableElRect.right) ||
      (placement === 'topLeft' && left - wrapLeft + 5 < tableElRect.left)
    ) {
      setTableOverlayStyle({ display: 'none' });
    } else {
      setTableOverlayStyle({ display: null });
    }
  }, [show, overlayRefDom, left, top, placement]);

  return (
    <Overlay {...props} overlayStyle={{ ...overlayStyle, ...tableOverlayStyle }}>
      {children}
    </Overlay>
  );
}

export default TableAddBtnOverlay;
