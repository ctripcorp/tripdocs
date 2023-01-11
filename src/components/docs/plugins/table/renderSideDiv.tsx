import { css, cx } from '@emotion/css';
import { Editor, Path } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import React, { CSSProperties, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { addSelection, removeSelection } from './selection';
import { colDivBarMargin, rowDivBarMargin, tableMargin } from './tableElement';
import $ from 'jquery';
import { Overlay } from '../OverlayComponents/Overlay';
import { GeneralOverlayButton } from '../OverlayComponents/Overlay/GeneralOverlayButton';
import { IconBtn } from '../Components';
import { f } from '@src/resource/string';
import { opsTable } from './tableOperation';
import TableAddBtnOverlay from '../OverlayComponents/TableOverlay';
import _ from 'lodash';
import { TripdocsSdkContext } from '@src/Docs';
import { getEditorEventEmitter } from '@src/components/docs/plugins/table/selection';

type ActivationType = 'none' | 'half' | 'full';

export function RowSideDiv(props) {
  const { editor, isShowBar, tableRef, getTableNode, selCells, setSelCells } = props;

  const tableDom = (tableRef as any)?.current?.childNodes[2].childNodes[0].childNodes[1];
  const [rowDomArr, setRowDomArr] = useState(Array.from(tableDom?.children || []));

  const [overlayRefDom, setOverlayRefDom] = useState(null);
  const [overlayRefRect, setOverlayRefRect] = useState(null);

  const [tableOverlayHover, toggleTableOverlayHover] = useReducer((state, action) => action === 'on', false);
  const [isOverSideDiv, toggleIsOverSideDiv] = useReducer((state, action) => action === 'on', false);
  const [showOverlay, toggleShowOverlay] = useReducer((state, action) => action === 'on', false);

  const [overlayPlacement, setOverlayPlacement] = useState<null | 'leftTop' | 'leftBottom'>(null);
  const [hoveringIndex, setHoveringIndex] = useState(-1);

  const [activationArr, setActivationArr] = useState<ActivationType[]>([]);

  useEffect(() => {
    console.log('[selCells]', selCells);
    const rowMap = {};
    const arr = [];
    const tableSlateNode = getTableNode();

    selCells.forEach(cellEntry => {
      const [node, path] = cellEntry;
      const rowIndex = path[2];
      rowMap[rowIndex] ? rowMap[rowIndex]++ : (rowMap[rowIndex] = 1);
    });
    for (let i in rowMap) {
      arr[i] = rowMap[i] === tableSlateNode.column ? 'full' : rowMap[i] === 0 ? 'none' : 'half';
    }
    setActivationArr(arr);
  }, [JSON.stringify(selCells.map((cell: Path) => cell[1]))]);

  useEffect(() => {
    if (tableOverlayHover || isOverSideDiv) {
      toggleShowOverlay('on');
    }
    if (!tableOverlayHover && !isOverSideDiv) {
      toggleShowOverlay('off');
    }
  }, [tableOverlayHover, isOverSideDiv]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      console.log('Body height changed:', entries[0].target.clientHeight);
      const target = entries[0].target;

      if (target?.children?.length) {
        const tableSlateNode = getTableNode();
        const rows = tableSlateNode?.children;
        console.log(
          'ROWS',
          Array.from(tableDom?.children)?.map((item: any) => item.offsetHeight),
          tableSlateNode,
          rows
        );
        setRowDomArr(Array.from(tableDom.children || []));
      }
    });

    tableDom && resizeObserver.observe(tableDom);
    return () => {
      tableDom && resizeObserver.unobserve(tableDom);
    };
  }, [tableDom]);

  const { isReadOnly } = useContext(TripdocsSdkContext);

  return (
    <>
      <div
        data-ignore-slate
        className="row-div-bar-inner ignore-toggle-readonly"
        style={{
          display: isShowBar ? 'block' : 'none',
          borderBottom: '1px solid #DFDFDF',
          zIndex: 100,
        }}
        contentEditable={false}
        onMouseMove={_.debounce(e => {
          toggleIsOverSideDiv('on');
        })}
        onMouseLeave={e => {
          setTimeout(() => {
            toggleIsOverSideDiv('off');
          }, 400);
        }}
      >
        {rowDomArr?.map((tr: any, index: number) => (
          <AbstractSideDiv
            index={index}
            editor={editor}
            type={'row'}
            divStyle={{ width: '14px', height: tr?.getBoundingClientRect?.()?.height || tr?.clientHeight }}
            activationArr={activationArr}
            isOverSideDiv={isOverSideDiv}
            toggleIsOverSideDiv={toggleIsOverSideDiv}
            getTableNode={getTableNode}
            setSelCells={setSelCells}
            setOverlayPlacement={setOverlayPlacement}
            setOverlayRefDom={setOverlayRefDom}
            setOverlayRefRect={setOverlayRefRect}
            setHoveringIndex={setHoveringIndex}
          />
        ))}
      </div>
      {!isReadOnly && overlayPlacement && (
        <TableAddBtnOverlay
          show={showOverlay}
          docId={editor?.docId || ''}
          placement={overlayPlacement}
          overlayRefDom={overlayRefDom}
          left={overlayRefRect?.left}
          distance={14}
          offset={{ left: 0, top: -14 }}
          overlayStyle={{ border: '1px solid #dee0e3' }}
          tableRef={tableRef}
        >
          <div
            className={cx(
              'overlay-button-wrap',
              css`
                display: flex;
                justify-content: space-between;
                align-items: center;
              `
            )}
            onMouseEnter={() => toggleTableOverlayHover('on')}
            onMouseLeave={() => {
              setTimeout(() => toggleTableOverlayHover('off'), 400);
            }}
          >
            <GeneralOverlayButton
              title={f('tableInsertRow')}
              tooltipPlacement="topRight"
              hoverStyle="color"
              style={{ width: '20px', height: '20px' }}
              icon={<IconBtn className="Tripdocs-add" style={{ fontSize: '14px' }} />}
              onMouseDown={e => {
                const tableSlateNode = getTableNode();
                const curIndex = hoveringIndex;
                if (tableSlateNode && curIndex !== -1) {
                  const isTopZone = overlayPlacement === 'leftTop';
                  const tablePath = ReactEditor.findPath(editor, tableSlateNode);
                  const startPath = [tablePath[0], 1, curIndex, 0, 0, 0];
                  const point = { path: startPath, offset: 0 };
                  const range = { anchor: point, focus: point };
                  if (isTopZone) {
                    opsTable(editor, 'insertRowReverse', range);
                  } else {
                    opsTable(editor, 'insertRow', range);
                  }
                }
              }}
            />
          </div>
        </TableAddBtnOverlay>
      )}
    </>
  );
}

export function ColSideDiv(props) {
  const { editor, tableRef, isShowBar, getTableNode, selCells, setSelCells, colArr } = props;

  const colDivBarInnerRef = useRef(null);
  const [overlayRefDom, setOverlayRefDom] = useState(null);
  const [overlayRefRect, setOverlayRefRect] = useState(null);

  const [tableOverlayHover, toggleTableOverlayHover] = useReducer((state, action) => action === 'on', false);
  const [isOverSideDiv, toggleIsOverSideDiv] = useReducer((state, action) => action === 'on', false);
  const [showOverlay, toggleShowOverlay] = useReducer((state, action) => action === 'on', false);

  const [overlayPlacement, setOverlayPlacement] = useState<null | 'topLeft' | 'topRight'>(null);
  const [hoveringIndex, setHoveringIndex] = useState(-1);

  const [activationArr, setActivationArr] = useState<ActivationType[]>([]);

  useEffect(() => {
    console.log('[selCells]', selCells);
    const colMap = {};
    const arr = [];
    const tableSlateNode = getTableNode();

    selCells.forEach(cellEntry => {
      const [node, path] = cellEntry;
      const colIndex = path[3];
      colMap[colIndex] ? colMap[colIndex]++ : (colMap[colIndex] = 1);
    });
    for (let i in colMap) {
      arr[i] = colMap[i] === tableSlateNode.row ? 'full' : colMap[i] === 0 ? 'none' : 'half';
    }
    setActivationArr(arr);
  }, [JSON.stringify(selCells.map((cell: Path) => cell[1]))]);

  useEffect(() => {
    if (tableOverlayHover || isOverSideDiv) {
      toggleShowOverlay('on');
    }
    if (!tableOverlayHover && !isOverSideDiv) {
      toggleShowOverlay('off');
    }
  }, [tableOverlayHover, isOverSideDiv]);
  const { isReadOnly } = useContext(TripdocsSdkContext);

  return (
    <>
      <div
        ref={colDivBarInnerRef}
        data-ignore-slate
        className="col-div-bar-inner ignore-toggle-readonly"
        style={{
          display: isShowBar ? 'flex' : 'none',
          borderRight: '1px solid #DFDFDF',
        }}
        onMouseMove={_.debounce(e => {
          toggleIsOverSideDiv('on');
        })}
        onMouseLeave={e => {
          setTimeout(() => {
            toggleIsOverSideDiv('off');
          }, 400);
        }}
      >
        {colArr?.map((colWidth: any, index: number) => (
          <AbstractSideDiv
            index={index}
            editor={editor}
            type={'column'}
            divStyle={{ height: '14px', width: colWidth }}
            activationArr={activationArr}
            getTableNode={getTableNode}
            setSelCells={setSelCells}
            setOverlayPlacement={setOverlayPlacement}
            setOverlayRefDom={setOverlayRefDom}
            setOverlayRefRect={setOverlayRefRect}
            setHoveringIndex={setHoveringIndex}
            scrollContainerRefDom={colDivBarInnerRef?.current?.closest('.table-inner-wrap')}
          />
        ))}
      </div>
      {!isReadOnly && overlayPlacement && (
        <TableAddBtnOverlay
          show={showOverlay}
          docId={editor?.docId || ''}
          placement={overlayPlacement}
          overlayRefDom={overlayRefDom}
          left={overlayRefRect?.left}
          distance={14}
          offset={{ left: 0, top: -10 }}
          overlayStyle={{ border: '1px solid #dee0e3' }}
          tableRef={tableRef}
        >
          <div
            className={cx(
              'overlay-button-wrap',
              css`
                display: flex;
                justify-content: space-between;
                align-items: center;
              `
            )}
            onMouseEnter={() => toggleTableOverlayHover('on')}
            onMouseLeave={() => {
              setTimeout(() => toggleTableOverlayHover('off'), 400);
            }}
          >
            <GeneralOverlayButton
              title={f('tableInsertColumn')}
              tooltipPlacement="top"
              hoverStyle="color"
              style={{ width: '20px', height: '20px' }}
              icon={<IconBtn className="Tripdocs-add" style={{ fontSize: '14px' }} />}
              onMouseDown={e => {
                const tableSlateNode = getTableNode();
                const curIndex = hoveringIndex;
                if (tableSlateNode && curIndex !== -1) {
                  const isLeftZone = overlayPlacement === 'topLeft';
                  const tablePath = ReactEditor.findPath(editor, tableSlateNode);
                  const startPath = [...tablePath, 0, curIndex, 0, 0];
                  const point = { path: startPath, offset: 0 };
                  const range = { anchor: point, focus: point };
                  console.log('[overlayPlacement]', overlayPlacement, isLeftZone, curIndex, range);
                  if (isLeftZone) {
                    opsTable(editor, 'insertColReverse', range);
                  } else {
                    opsTable(editor, 'insertCol', range);
                  }
                }
              }}
            />
          </div>
        </TableAddBtnOverlay>
      )}
    </>
  );
}

type AbstractSideDivProps = {
  index: number;
  editor: any;
  type: 'column' | 'row';
  divStyle: CSSProperties;
  activationArr: ActivationType[];
  getTableNode: any;
  setSelCells: any;
  setOverlayPlacement: any;
  setOverlayRefDom: any;
  setOverlayRefRect: any;
  setHoveringIndex: any;
  scrollContainerRefDom?: HTMLElement;
  [key: string]: any;
};

export function AbstractSideDiv(props: AbstractSideDivProps) {
  const {
    index,
    editor,
    type,
    divStyle,
    activationArr,
    getTableNode,
    setSelCells,
    setOverlayPlacement,
    setOverlayRefDom,
    setOverlayRefRect,
    setHoveringIndex,
    scrollContainerRefDom,
  } = props;

  const isColumn = type === 'column';

  const { docId, isReadOnly } = useContext(TripdocsSdkContext);
  const [deleteBtnHover, setDeleteBtnHover] = useState(false);
  const [deleteBtnHidden, setDeleteBtnHidden] = useState(false);
  const [showDeleteBtnOverlay, setShowDeleteBtnOverlay] = useState(false);
  const [startScrollLeft, setStartScrollLeft] = useState(null);
  const [colOffsetLeft, setColOffsetLeft] = useState(0);
  const tableSideDivRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (!editor) return;
      const btn: HTMLElement = document.querySelector('.table-delete-rowcol-overlay');
      if (btn && showDeleteBtnOverlay) {
        console.log('{CLICK}', btn, e.target, btn.contains(e.target), showDeleteBtnOverlay);
        const isTableSideDiv = Array.from(e.target.classList).some((cls: string) => ['table-side-div'].includes(cls));
        if (btn.contains(e.target)) {
          return;
        } else {
          if (!isTableSideDiv) {
            removeSelection(editor, setSelCells);
          }
          setShowDeleteBtnOverlay(false);
        }
      }
    };
    const offShowDeleteBtnOverlay = () => setShowDeleteBtnOverlay(false);
    if (!isReadOnly) {
      document.addEventListener('mousedown', handleClickOutside);
      getEditorEventEmitter(docId).on('removeTableRowColDelete', offShowDeleteBtnOverlay, docId);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      getEditorEventEmitter(docId).off('removeTableRowColDelete', offShowDeleteBtnOverlay, docId);
    };
  }, [showDeleteBtnOverlay]);

  useEffect(() => {
    if (!editor) return;
    const tableSlateNode = getTableNode();
    const dom = ReactEditor.toDOMNode(editor, tableSlateNode);
    const selectedCells = dom.querySelectorAll('.selected-cell-td');
    if (deleteBtnHover) {
      selectedCells.forEach(cell => {
        cell.classList.add('delete-btn-hover');
      });
    } else {
      selectedCells.forEach(cell => {
        cell.classList.remove('delete-btn-hover');
      });
    }
    return () => {};
  }, [deleteBtnHover]);

  const handleScrollLeft = useCallback(
    (e: any) => {
      if (!editor) return;
      const { target } = e;
      if (!scrollContainerRefDom || !tableSideDivRef?.current) return;
      const containerRect = scrollContainerRefDom.getBoundingClientRect();
      const sideDivRect = (tableSideDivRef?.current as HTMLElement).getBoundingClientRect();
      const { left: containerLeft, right: containerRight } = containerRect;
      const { left: sideDivLeft, right: sideDivRight, width: sideDivWidth } = sideDivRect;
      const sideDivCenter = (sideDivRight + sideDivLeft) / 2;
      const colOffsetHorizontal = startScrollLeft - target.scrollLeft;

      const isLeftMost = sideDivCenter <= containerLeft;
      const isRightMost = sideDivCenter >= containerRight;
      console.log('handleScrollLeft0', containerLeft, containerRight, sideDivCenter, isLeftMost, isRightMost, colOffsetHorizontal);
      if (isLeftMost || isRightMost) {
        setDeleteBtnHidden(true);
      } else {
        setDeleteBtnHidden(false);
      }
      setColOffsetLeft(colOffsetHorizontal);
    },
    [startScrollLeft, scrollContainerRefDom, tableSideDivRef?.current]
  );

  useEffect(() => {
    if (!editor || !isColumn || !scrollContainerRefDom || !showDeleteBtnOverlay) return;

    scrollContainerRefDom.addEventListener('scroll', handleScrollLeft);

    return () => {
      scrollContainerRefDom.removeEventListener('scroll', handleScrollLeft);
    };
  }, [scrollContainerRefDom, startScrollLeft, showDeleteBtnOverlay]);

  return (
    <>
      <div
        ref={tableSideDivRef}
        key={index}
        data-ignore-slate
        contentEditable={false}
        suppressContentEditableWarning
        className={cx(
          'table-side-div',
          'ignore-toggle-readonly',
          activationArr[index] === 'full' ? 'full-active' : activationArr[index] === 'half' ? 'half-active' : 'none-active',
          deleteBtnHover ? 'delete-btn-hover' : ''
        )}
        style={{
          ...divStyle,
        }}
        onMouseEnter={e => {
          const dom = e.target as HTMLElement;
          const rect = dom.getBoundingClientRect();
          setOverlayRefDom(dom);
          setOverlayRefRect(rect);
        }}
        onMouseMove={e => {
          const dom = e.target as HTMLElement;
          const rect = dom.getBoundingClientRect();
          if (isColumn) {
            const middle = rect.left + rect.width / 2;
            const isLeftZone = e.clientX < middle;

            if (isLeftZone) {
              setOverlayPlacement('topLeft');
            } else {
              setOverlayPlacement('topRight');
            }
          } else if (type === 'row') {
            const middle = rect.top + rect.height / 2;
            const isTopZone = e.clientY < middle;
            if (isTopZone) {
              setOverlayPlacement('leftTop');
            } else {
              setOverlayPlacement('leftBottom');
            }
          }
          setHoveringIndex(index);
        }}
        onMouseLeave={e => {
          setOverlayRefDom(null);
          setOverlayRefRect(null);
        }}
        onMouseDown={e => {
          e.stopPropagation();
          e.preventDefault();
          const tableSlateNode = getTableNode();

          if (tableSlateNode && index !== -1) {
            const tablePath = ReactEditor.findPath(editor, tableSlateNode);
            const tableEntry = Editor.node(editor, tablePath);
            const len = isColumn ? (tableSlateNode.children as Array<any>).length : (tableSlateNode.children as Array<any>)[0].children.length;
            const startPath = isColumn ? [...tablePath, 0, index] : [tablePath[0], 1, index, 0];
            const endPath = isColumn ? [...tablePath, len - 1, index] : [tablePath[0], 1, index, len - 1];
            addSelection(editor, tableEntry, startPath, endPath, setSelCells);
          }
          setTimeout(() => {
            setShowDeleteBtnOverlay(true);
          });
          const scrollLeft = scrollContainerRefDom?.scrollLeft;
          if (typeof scrollLeft === 'number') {
            setStartScrollLeft(scrollLeft);
          }
          setColOffsetLeft(0);
          getEditorEventEmitter(editor.docId).emit('removeTableRowColDelete', editor.docId);
        }}
      ></div>

      {!isReadOnly && (
        <Overlay
          show={showDeleteBtnOverlay}
          docId={editor?.docId || ''}
          overlayRefDom={tableSideDivRef?.current}
          placement={isColumn ? 'top' : 'topRight'}
          offset={{
            top: 4,
            left: isColumn ? colOffsetLeft : 14,
          }}
          zIndex={210}
          overlayStyle={{ border: '1px solid #dee0e3', display: deleteBtnHidden ? 'none' : null }}
        >
          <GeneralOverlayButton
            className={cx(
              'table-delete-rowcol-overlay',
              css`
                &:hover {
                  color: #f5222d;
                }
              `
            )}
            title={f(isColumn ? 'tableDeleteSelectedColumn' : 'tableDeleteSelectedRow')}
            tooltipPlacement="top"
            hoverStyle="background"
            style={{ width: '20px', height: '20px' }}
            icon={<IconBtn className="Tripdocs-delete" style={{ fontSize: '14px' }} />}
            onMouseEnter={e => setDeleteBtnHover(true)}
            onMouseLeave={e => setDeleteBtnHover(false)}
            onMouseDown={e => {
              const tableSlateNode = getTableNode();
              const curIndex = index;
              if (tableSlateNode && curIndex !== -1) {
                const tablePath = ReactEditor.findPath(editor, tableSlateNode);

                if (isColumn) {
                  const startPath = [...tablePath, 0, curIndex, 0, 0];
                  const point = { path: startPath, offset: 0 };
                  const range = { anchor: point, focus: point };
                  opsTable(editor, 'deleteCol', range);
                } else {
                  const startPath = [...tablePath, curIndex, 0, 0, 0];
                  const point = { path: startPath, offset: 0 };
                  const range = { anchor: point, focus: point };
                  opsTable(editor, 'deleteRow', range);
                }
                setDeleteBtnHover(false);
                setShowDeleteBtnOverlay(false);
              }
            }}
          />
        </Overlay>
      )}
    </>
  );
}

export function IntersectionPointDiv(props) {
  const { editor, tableRef, tableDom, selCells, getTableNode, setSelCells, isShowBar } = props;

  const [active, setActive] = useState<boolean>(false);

  useEffect(() => {
    let act = false;
    const tableSlateNode = getTableNode();
    const total = tableSlateNode.column * tableSlateNode.row;
    if (selCells.length === total) {
      act = true;
    }
    setActive(act);
  }, [JSON.stringify(selCells.map((cell: Path) => cell[1]))]);

  return (
    <div
      data-ignore-slate
      contentEditable={false}
      suppressContentEditableWarning
      className={cx('intersection-point', 'ignore-toggle-readonly', active ? 'active' : null)}
      style={{
        display: isShowBar ? 'flex' : 'none',
      }}
      onMouseDown={e => {
        e.stopPropagation();
        const tableSlateNode = getTableNode();
        if (tableSlateNode) {
          const tablePath = ReactEditor.findPath(editor, tableSlateNode);
          const tableEntry = Editor.node(editor, tablePath);
          const colLen = (tableSlateNode.children as Array<any>).length;
          const rowLen = (tableSlateNode.children as Array<any>)[0].children.length;

          const startPath = [tablePath[0], 1, 0, 0];
          const endPath = [tablePath[0], 1, colLen - 1, rowLen - 1];
          addSelection(editor, tableEntry, startPath, endPath, setSelCells);
        }
        getEditorEventEmitter(editor.docId).emit('removeTableRowColDelete', editor.docId);
      }}
    ></div>
  );
}
