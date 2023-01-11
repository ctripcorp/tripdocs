import { cx } from '@emotion/css';
import {
  RESIZING_ROW,
  SEL_CELLS,
  RESIZING_ROW_MIN_HEIGHT,
  RESIZING_ROW_ORIGIN_HEIGHT,
  RESIZING_COL,
  RESIZING_COL_MIN_WIDTH,
  RESIZING_COL_ORIGIN_WIDTH,
} from '@src/utils/weak-maps';
import ReactDOM from 'react-dom';
import { tableMargin } from './tableElement';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { Path, Editor, Node } from '@src/components/slate-packages/slate';
import { TripdocsSdkContext } from '@src/Docs';
import { ELTYPE } from '../config';
import { getParentPathByType } from '../pluginsUtils/getPathUtils';

const tdPaddingAndBorder = 4 + 1;

function ResizeMask(props) {
  const {
    editor,
    tableRect,
    setMaskRectSide,
    tableResizeMaskRect,
    curCell,
    startPositionX,
    startPositionY,
    setStartPositionX,
    setStartPositionY,
    differenceY,
    differenceX,
    isDragging,
    setIsDragging,
    setRowMovingLine,
    setColMovingLine,
    rowMovingLine,
    colMovingLine,
    startKey,
  } = props;

  const { isReadOnly } = useContext(TripdocsSdkContext);

  useEffect(() => {
    if (differenceY === null) {
      setRowMovingLine({
        top: null,
      });
    }

    if (differenceX === null) {
      setColMovingLine({
        left: -9999,
      });
    }
  }, [differenceY, differenceX]);

  function getNodeOfDomHeight(node: any) {
    if (node.type === ELTYPE.CARD) {
      if (node.children?.[1]) {
        const innerNode = node.children[1];
        let margins = 0;
        const dom = ReactEditor.toDOMNode(editor, innerNode);
        console.log('[contentNodes dom]', dom);
        if ([ELTYPE.IMAGE].includes(innerNode.type)) {
          margins = 16 * 2;
        }
        return dom.clientHeight + margins;
      }
    } else {
      const dom = ReactEditor.toDOMNode(editor, node);
      return dom.clientHeight;
    }
  }
  return isReadOnly ? null : (
    <>
      <div
        suppressContentEditableWarning
        className={cx('table-resize-mask', 'ignore-toggle-readonly')}
        contentEditable="false"
        style={{
          background: 'rgba(200,245,233,.5)',
          height: tableResizeMaskRect.height,
          width: tableResizeMaskRect.width,
          left: tableResizeMaskRect.left + tableMargin.left,
          top: tableResizeMaskRect.top + tableMargin.top,
          display: SEL_CELLS.get(editor) && SEL_CELLS.get(editor).length > 0 ? 'none' : null,
        }}
      >
        <div
          data-ignore-slate
          suppressContentEditableWarning
          contentEditable="false"
          className={cx('table-resize-top', 'ignore-toggle-readonly')}
          style={{
            left: 0,
            top: -3,
            cursor: rowMovingLine.display === 'none' ? 'default' : null,
          }}
          onMouseEnter={e => {
            if (isDragging || startKey) return;
            const thisDom: any = e.target;
            if (thisDom) {
              const thisDomRect = thisDom.getBoundingClientRect();
              const calcultedTop = thisDomRect.top + 3 - tableRect.top;

              if (calcultedTop < 1) {
                setRowMovingLine({ top: null });
                thisDom.style.cursor = 'default';
              } else {
                setRowMovingLine({
                  top: Math.round(calcultedTop),
                });
                thisDom.style.cursor = 'row-resize';
              }
            }
          }}
          onMouseLeave={(e: any) => {
            if (!isDragging) {
              setRowMovingLine({ top: null });
            }
            e.target.style.cursor = 'default';
          }}
          onMouseDown={e => {
            if (differenceY !== null) return;
            const thisDom: any = e.target;
            if (thisDom) {
              const thisDomRect = thisDom.getBoundingClientRect();
              if (thisDomRect) {
                const calcultedTop = thisDomRect.top + 3 - tableRect.top;
                if (calcultedTop < 1) {
                  e.preventDefault();
                  return;
                }
                setStartPositionY(thisDomRect.top + 3);
                setIsDragging(true);
                setMaskRectSide('top');
                if (curCell) {
                  const tdSlateNodePath = ReactEditor.findPath(editor, curCell);
                  const trSlateNodePath = Path.parent(tdSlateNodePath);

                  const prevTrSlateNodePath = Path.hasPrevious(trSlateNodePath) && Path.previous(trSlateNodePath);

                  if (prevTrSlateNodePath) {
                    const trEntry: any = Editor.node(editor, prevTrSlateNodePath);
                    let minHeight = 33;
                    const tdNodes = trEntry[0]?.children;
                    tdNodes.forEach(tdNode => {
                      const tdDOM = ReactEditor.toDOMNode(editor, tdNode);
                      if (!tdDOM) return;
                      let tdHeight = 0;
                      const contentNodes = tdNode.children;
                      if (!contentNodes) return;
                      contentNodes.forEach(node => {
                        console.log('[contentNodes top]', node);
                        tdHeight += getNodeOfDomHeight(node);
                      });

                      console.log('settingMINHEIGHT :>> ', minHeight);

                      if (tdHeight > minHeight) {
                        minHeight = tdHeight + tdPaddingAndBorder * 2;
                      }
                    });
                    RESIZING_ROW.set(editor, trEntry);
                    RESIZING_ROW_ORIGIN_HEIGHT.set(editor, ReactEditor.toDOMNode(editor, trEntry[0])?.clientHeight || minHeight);
                    RESIZING_ROW_MIN_HEIGHT.set(editor, minHeight);
                  }
                }
              }
            }
          }}
        ></div>
        <div
          data-ignore-slate
          suppressContentEditableWarning
          contentEditable="false"
          className={cx('table-resize-right', 'ignore-toggle-readonly')}
          style={{
            left: tableResizeMaskRect.width - 3,
            top: 0,
          }}
          onMouseEnter={e => {
            if (isDragging || startKey) return;
            const thisDom: any = e.target;
            if (thisDom) {
              const thisDomRect = thisDom.getBoundingClientRect();
              setColMovingLine({
                left: Math.round(thisDomRect.left + 3 - tableRect.left),
              });
              thisDom.style.cursor = 'col-resize';
            }
          }}
          onMouseLeave={(e: any) => {
            if (!isDragging) {
              setColMovingLine({ left: -9999 });
            }
            e.target.style.cursor = 'default';
          }}
          onMouseDown={e => {
            const thisDom: any = e.target;
            if (thisDom) {
              const thisDomRect = thisDom.getBoundingClientRect();
              if (thisDomRect) {
                setStartPositionX(thisDomRect.right);
                setIsDragging(true);
                setMaskRectSide('right');
                if (curCell) {
                  const tdSlateNodePath = ReactEditor.findPath(editor, curCell);

                  if (tdSlateNodePath) {
                    const tdEntry = Editor.node(editor, tdSlateNodePath);
                    let isColCell = false;
                    let col = 1;
                    let entry: any = tdEntry;
                    let path = entry[1];
                    const tablePath = getParentPathByType(editor, tdSlateNodePath, ELTYPE.TABLE);
                    if (!tablePath) return;
                    const tableNode: any = Node.has(editor, tablePath) && Node.get(editor, tablePath);
                    const hwEach = tableNode.hwEach[0];
                    let originWidth = Number.parseInt(hwEach[path[3]]) || 40;
                    if (entry[0] && entry[0].colspan > 1) {
                      isColCell = true;
                      col = entry[0].colspan;
                    }
                    if (isColCell) {
                      for (let i = 1; i < col; i++) {
                        path = Path.next(path);
                        entry = Editor.node(editor, path);
                      }
                      originWidth = Number.parseInt(hwEach[path[3]]);
                    }
                    let minWidth = 40;
                    RESIZING_COL.set(editor, entry);
                    RESIZING_COL_ORIGIN_WIDTH.set(editor, originWidth >= minWidth ? originWidth : minWidth);
                    RESIZING_COL_MIN_WIDTH.set(editor, minWidth);

                    const tableDOM = ReactEditor.toDOMNode(editor, tableNode);
                    tableDOM?.setAttribute('data-col-arr', JSON.stringify(hwEach));
                  }
                }
              }
            }
          }}
        ></div>
        <div
          data-ignore-slate
          suppressContentEditableWarning
          contentEditable="false"
          className={cx('table-resize-bottom', 'ignore-toggle-readonly')}
          style={{
            left: 0,
            top: tableResizeMaskRect.height - 3,
          }}
          onMouseEnter={e => {
            if (isDragging || startKey) return;
            const thisDom: any = e.target;
            if (thisDom) {
              const thisDomRect = thisDom.getBoundingClientRect();
              setRowMovingLine({
                top: Math.round(thisDomRect.top + 3 - tableRect.top),
              });
              thisDom.style.cursor = 'row-resize';
            }
          }}
          onMouseLeave={(e: any) => {
            if (!isDragging) {
              setRowMovingLine({ top: null });
            }
            e.target.style.cursor = 'default';
          }}
          onMouseDown={e => {
            if (differenceY !== null) return;
            const thisDom: any = e.target;
            if (thisDom) {
              const thisDomRect = thisDom.getBoundingClientRect();
              if (thisDomRect) {
                setStartPositionY(thisDomRect.top - 3);
                setIsDragging(true);
                setMaskRectSide('bottom');
                if (curCell) {
                  const tdSlateNodePath = ReactEditor.findPath(editor, curCell);
                  const trSlateNodePath = Path.parent(tdSlateNodePath);

                  if (trSlateNodePath) {
                    const trEntry: any = Editor.node(editor, trSlateNodePath);
                    let entry = trEntry;
                    let path = trSlateNodePath;
                    let isColCell = false;
                    let row = 1;
                    const tdEntry: any = Editor.node(editor, tdSlateNodePath);
                    if (tdEntry[0] && tdEntry[0].rowspan > 1) {
                      isColCell = true;
                      row = tdEntry[0].rowspan;
                    }
                    if (isColCell) {
                      for (let i = 1; i < row; i++) {
                        path = Path.next(path);
                        entry = Editor.node(editor, path);
                      }
                    }

                    let minHeight = 33;
                    const tdNodes = entry[0]?.children;
                    tdNodes.forEach(tdNode => {
                      const tdDOM = ReactEditor.toDOMNode(editor, tdNode);
                      if (!tdDOM) return;
                      let tdHeight = 0;
                      const contentNodes = tdNode.children;
                      if (!contentNodes) return;
                      contentNodes.forEach(node => {
                        console.log('[contentNodes bottom]', node);
                        tdHeight += getNodeOfDomHeight(node);
                      });

                      console.log('settingMINHEIGHT :>> ', minHeight);

                      if (tdHeight > minHeight) {
                        minHeight = tdHeight + tdPaddingAndBorder * 2;
                      }
                    });

                    RESIZING_ROW.set(editor, entry);
                    RESIZING_ROW_ORIGIN_HEIGHT.set(editor, ReactEditor.toDOMNode(editor, entry[0])?.clientHeight || minHeight);
                    RESIZING_ROW_MIN_HEIGHT.set(editor, minHeight);
                  }
                }
              }
            }
          }}
        ></div>
        <div
          data-ignore-slate
          suppressContentEditableWarning
          contentEditable="false"
          className={cx('table-resize-left', 'ignore-toggle-readonly')}
          style={{
            left: -3,
            top: 0,
            cursor: colMovingLine.display === 'none' ? 'default' : null,
          }}
          onMouseEnter={e => {
            if (isDragging || startKey) return;
            const thisDom: any = e.target;
            if (thisDom) {
              const thisDomRect = thisDom.getBoundingClientRect();
              const calculatedLeft = thisDomRect.left + 3 - tableRect.left;
              console.log('*******************************************', calculatedLeft);
              if (calculatedLeft < 1) {
                setColMovingLine({ left: -9999 });
                thisDom.style.cursor = 'default';
              } else {
                setColMovingLine({
                  left: Math.round(calculatedLeft),
                });
                thisDom.style.cursor = 'col-resize';
              }
            }
          }}
          onMouseLeave={(e: any) => {
            if (!isDragging) {
              setColMovingLine({ left: -9999 });
            }
            e.target.style.cursor = 'default';
          }}
          onMouseDown={e => {
            const thisDom: any = e.target;
            if (thisDom) {
              const thisDomRect = thisDom.getBoundingClientRect();
              if (thisDomRect) {
                const calculatedLeft = thisDomRect.left + 3 - tableRect.left;
                if (calculatedLeft < 1) {
                  e.preventDefault();
                  return;
                }
                setStartPositionX(thisDomRect.right);
                setIsDragging(true);
                setMaskRectSide('left');
                if (curCell) {
                  const tdSlateNodePath = ReactEditor.findPath(editor, curCell);
                  const prevTdSlateNodePath = Path.hasPrevious(tdSlateNodePath) && Path.previous(tdSlateNodePath);
                  if (prevTdSlateNodePath) {
                    const tdEntry = Editor.node(editor, prevTdSlateNodePath);
                    let entry: any = tdEntry;
                    let path = entry[1];
                    const tablePath = getParentPathByType(editor, prevTdSlateNodePath, ELTYPE.TABLE);
                    if (!tablePath) return;
                    const tableNode: any = Node.has(editor, tablePath) && Node.get(editor, tablePath);
                    const hwEach = tableNode.hwEach[0];
                    let originWidth = Number.parseInt(hwEach[path[3]]) || 40;
                    let minWidth = 40;
                    RESIZING_COL.set(editor, tdEntry);
                    RESIZING_COL_ORIGIN_WIDTH.set(editor, originWidth >= minWidth ? originWidth : minWidth);
                    RESIZING_COL_MIN_WIDTH.set(editor, minWidth);

                    const tableDOM = ReactEditor.toDOMNode(editor, tableNode);
                    tableDOM?.setAttribute('data-col-arr', JSON.stringify(hwEach));
                  }
                }
              }
            }
          }}
        ></div>
      </div>
    </>
  );
}

export default ResizeMask;
