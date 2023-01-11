import { CodeSandboxCircleFilled, LeftOutlined } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { Divider, Dropdown } from 'antd';
import $ from 'jquery';
import _, { transform } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useContext } from 'react';
import { Path, Node, BaseElement, Text, Point } from '@src/components/slate-packages/slate';
import { Editor, Range, Transforms } from '@src/components/slate-packages/slate';
import { TripdocsSdkContext } from '../../../../Docs';
import { useWindowUnloadEffect } from '../../../../utils/apiOperations/hooks/useWindowUnloadEffect';
import tableMenu from '../../../DropdownMenu/tableMenu';
import { ReactEditor, useSelected, useFocused } from '../../../slate-packages/slate-react';
import { ELTYPE, TABBABLE_TYPES } from '../config';
import { addRemoveSelectionListener, addSelection, removeSelection } from './selection';
import {
  CACHED_SEL_CELLS,
  SEL_CELLS,
  RESIZING_ROW,
  RESIZING_ROW_MIN_HEIGHT,
  RESIZING_ROW_ORIGIN_HEIGHT,
  RESIZING_COL_MIN_WIDTH,
  RESIZING_COL_ORIGIN_WIDTH,
  RESIZING_COL,
  ACTIVE_TABLE,
} from '@src/utils/weak-maps';
import ResizeMask from './ResizeMask';
import { ColSideDiv, IntersectionPointDiv, RowSideDiv } from './renderSideDiv';
import { getParentPathByType } from '../pluginsUtils/getPathUtils';
import { opsTable } from './tableOperation';
import { getCache, setCache } from '@src/utils/cacheUtils';
import { getEditorEventEmitter } from '@src/components/docs/plugins/table/selection';
import { Overlay } from '../OverlayComponents/Overlay';
import { f } from '@src/resource/string';
import { GeneralOverlayButton } from '../OverlayComponents/Overlay/GeneralOverlayButton';
import { IconBtn, IconButton } from './../Components';
import { handleTableOps } from '../StaticToolbar/buttons';
import { isTableUnbordered } from '../StaticToolbar/renderStaticToolbar';
import { EditorContainerPortal } from '@src/utils/createPortal';
import { getCurrentLineEnd } from '@src/utils/selectionUtils';

let selCells_stop = false;

export const tableMargin = { left: 14, top: 14 };
export const rowDivBarMargin = {
  left: 0,
  top: tableMargin.top,
};
export const colDivBarMargin = {
  top: 0,
  left: tableMargin.left,
};

export function testActiveTable(editor, activeTableRow) {
  const cells = SEL_CELLS.get(editor);
  return (
    (cells?.length > 0 && cells?.[0]?.[1]?.[0] === activeTableRow) ||
    (editor?.selection &&
      ReactEditor.hasRange(editor, editor.selection) &&
      editor.selection.focus?.path?.length >= 4 &&
      editor.selection?.focus?.path[0] === activeTableRow)
  );
}

const TableElement = React.forwardRef(({ element, attributes, editor, children, maxWidth, editorId }: any, ref) => {
  const tableRef = ref as any;
  const tableTargetRef = useRef();
  const [startKey, setStartKey] = useState('');
  const [selCells, setSelCells] = useState([]);
  const [colArr, setColArr] = useState(element.hwEach[0]);
  const [rowArr, setRowArr] = useState([]);
  const [domRowArr, setDomRowArr] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const { docId, isReadOnly, isMobile } = useContext(TripdocsSdkContext);
  const [isFakeSelected, setIsFakeSelected] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isOverElement, setIsOverElement] = useState(false);
  const [isOnTableToolBar, setIsOnTableToolBar] = useState(false);
  const [isShowTableToolbar, setIsShowTableToolbar] = useState(false);

  const [tableResizeMaskRect, setTableResizeMaskRect] = useState({
    height: 0,
    width: 0,
    top: 0,
    left: 0,
  });

  const [tableRect, setTableRect] = useState({
    height: 0,
    width: 0,
    top: 0,
    left: 0,
  });

  const [maskRectSide, setMaskRectSide] = useState<'top' | 'right' | 'bottom' | 'left' | null>(null);
  const [curCell, setCurCell] = useState(null);
  const [startPositionX, setStartPositionX] = useState<number | null>(null);
  const [startPositionY, setStartPositionY] = useState<number | null>(null);
  const [differenceX, setDifferenceX] = useState<number | null>(null);
  const [differenceY, setDifferenceY] = useState<number | null>(null);

  const rowMovingLineRef = useRef(null);
  const colMovingLineRef = useRef(null);

  const [rowMovingLine, setRowMovingLine] = useState({
    top: 0,
  });

  const [colMovingLine, setColMovingLine] = useState({
    left: 0,
  });

  const [overlayRefDom, setOverlayRefDom] = useState(null);
  const [overlayRefRect, setOverlayRefRect] = useState(null);

  const [visible, setVisible] = useState(false);

  const [isShowBar, setIsShowBar] = useState(() => {
    let activeTableRow = -1;
    let isCurTableActive = false;
    if ((tableTargetRef as any).current?.childNodes?.[1]) {
      const curTableNode = ReactEditor.toSlateNode(editor, (tableTargetRef as any).current.childNodes[1]);
      const curTablePath = ReactEditor.findPath(editor, curTableNode);
      activeTableRow = curTablePath[0];
      isCurTableActive = testActiveTable(editor, activeTableRow);
    }
    return isCurTableActive;
  });

  const [isTableBtnWrapScrolled, setIsTableBtnWrapScrolled] = useState(false);

  useEffect(() => {
    if (isOverElement || isOnTableToolBar) {
      setIsShowTableToolbar(true);
    } else {
      setIsShowTableToolbar(false);
    }
  }, [isOverElement, isOnTableToolBar]);

  useEffect(() => {
    const tableDom = tableRef?.current;
    if (!tableDom) return;

    const handleIsShowBar = (e: any) => {
      const { target } = e;
      if (tableDom) {
        const preventDefault = Array.from(target.classList).some((cls: string) =>
          ['general-overlay-button', 'Tripdocs-delete', 'Tripdocs-add'].includes(cls)
        );
        if (tableDom.contains(target) || preventDefault) {
          setIsShowBar(true);
          return;
        } else {
          setIsShowBar(false);
        }
      }
    };

    const handleMouseMove = _.throttle((e: any) => {
      const y = e.clientY;
      const x = e.clientX;
      const rect = tableDom.getBoundingClientRect();
      const { top, left, right, bottom } = rect;

      if (y > top - 27 && y < bottom && x > left - 27 && x < right) {
        setIsOverElement(true);
      } else {
        setIsOverElement(false);
      }
    }, 500);
    document.addEventListener('mousedown', handleIsShowBar);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousedown', handleIsShowBar);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [tableRef?.current]);

  const getTableNode = useCallback(() => {
    return ReactEditor.toSlateNode(editor, (tableTargetRef as any).current.childNodes[1]);
  }, [editor, tableTargetRef]);

  const handleSelCells = useCallback(e => {
    const scrollWrap: HTMLElement = getCache(docId, 'editorWrapDom');
    const scrollWrapRect = scrollWrap.getBoundingClientRect();
    selCells_stop = true;
    if (e.clientY < scrollWrapRect.top + Math.floor(scrollWrapRect.height * 0.15)) {
      selCells_stop = false;
      scroll(-10);
    }
    if (e.clientY > scrollWrapRect.bottom - Math.floor(scrollWrapRect.height * 0.15)) {
      selCells_stop = false;
      scroll(10);
    }
  }, []);

  const scroll = useCallback(step => {
    const scrollWrap: HTMLElement = getCache(docId, 'editorWrapDom');
    if (scrollWrap) {
      const scrollY = scrollWrap.scrollTop;
      scrollWrap.scrollTo({ top: scrollY + step });
    }
  }, []);

  useEffect(() => {
    addRemoveSelectionListener(editor, setSelCells);
  }, []);

  useEffect(() => {
    const dom = editor && ReactEditor.toDOMNode(editor, element);
    if (dom) {
      const tableDom = dom.closest('.table-wrap');
      setOverlayRefDom(tableDom);
      setOverlayRefRect(tableDom?.getBoundingClientRect());
    }
  }, [isShowBar]);

  useEffect(() => {
    if (!editor) return;
    const cachedSelCells = CACHED_SEL_CELLS?.get(editor);

    cachedSelCells?.forEach(cell => {
      const [cellNode, cellPath] = cell;
      const cellDom = ReactEditor.toDOMNode(editor, cellNode);
      if (cellDom) {
        cellDom.classList.remove('selected-cell-td');
      }
    });

    selCells?.forEach(cell => {
      const [cellNode, cellPath] = cell;
      const cellDom = ReactEditor.toDOMNode(editor, cellNode);
      if (cellDom) {
        cellDom.classList.add('selected-cell-td');
      }
    });

    CACHED_SEL_CELLS.set(editor, selCells);
  }, [JSON.stringify(selCells)]);

  const startNode = useMemo(() => {
    if (!editor) return null;

    const [node] = Editor.nodes(editor, {
      match: (n: any) => n.key === startKey,
      at: [],
    });

    return node;
  }, [startKey, editor]);

  const [tableDom, setTableDom] = useState((tableRef as any).current && (tableRef as any).current.childNodes[2].childNodes[0].childNodes[1]);
  const [tableSlateNode, setTableSlateNode] = useState(
    tableDom && !tableDom.getAttribute('data-ignore-slate') && ReactEditor.toSlateNode(editor, tableDom)
  );

  const handleTableCellsMouseMove = useCallback(
    e => {
      if (isReadOnly || !editor) return;

      const cell = (e.target as HTMLBaseElement).closest('td');

      if (cell) {
        const tdSlateNode = ReactEditor.toSlateNode(editor, cell);
        const tdClientBounding = cell.getBoundingClientRect();
        const tbodyDom = (e.target as HTMLBaseElement).closest('tbody');
        if (tbodyDom && tdSlateNode && tdClientBounding) {
          const tbodyClientBounding = tbodyDom.getBoundingClientRect();
          const scrollLeft = (tableRef as any)?.current?.childNodes[2]?.scrollLeft || 0;
          const maskLeft = (tdClientBounding.left || 0) - tbodyClientBounding.left - scrollLeft;
          const maskTop = (tdClientBounding.top || 0) - tbodyClientBounding.top;
          setCurCell(tdSlateNode);
          if (
            tableResizeMaskRect.height !== tdClientBounding.height ||
            tableResizeMaskRect.width !== tdClientBounding.width ||
            tableResizeMaskRect.left !== maskLeft ||
            tableResizeMaskRect.top !== maskTop
          ) {
            setTableResizeMaskRect({
              height: tdClientBounding.height || 0,
              width: tdClientBounding.width || 0,
              left: maskLeft,
              top: maskTop,
            });
          }
          if (
            tableRect.height !== tbodyClientBounding.height ||
            tableRect.width !== tbodyClientBounding.width ||
            tableRect.left !== tbodyClientBounding.left ||
            tableRect.top !== tbodyClientBounding.top
          ) {
            setTableRect({
              height: tbodyClientBounding.height || 0,
              width: tbodyClientBounding.width || 0,
              left: tbodyClientBounding.left || 0,
              top: tbodyClientBounding.top || 0,
            });
          }
        }
      }

      if (cell && startKey) {
        handleSelCells(e);
        const endKey = cell.getAttribute('data-key');
        const cur = (tableRef as any).current && (tableRef as any).current.childNodes[2].childNodes[0].childNodes[1];
        if (tableDom !== cur) {
          setTableDom(cur);
        }

        const [endNode] = Editor.nodes(editor, {
          match: (n: any) => n.key === endKey,
          at: [],
        });

        const startPath = Editor.path(editor, startNode[1]);
        const endPath = endNode ? Editor.path(editor, endNode[1]) : null;

        const getSelection = Editor.range(editor, startPath);

        if (editor.selection && ReactEditor.hasRange(editor, editor.selection) && endKey) {
          const anchor = editor.selection.anchor;
          const focus = editor.selection.focus;

          if (
            anchor.path[0] === getSelection.anchor.path[0] &&
            anchor.path[1] === getSelection.anchor.path[1] &&
            anchor.path[2] === getSelection.anchor.path[2] &&
            anchor.path[3] === getSelection.anchor.path[3] &&
            focus.path[0] === getSelection.focus.path[0] &&
            focus.path[1] === getSelection.focus.path[1] &&
            focus.path[2] === getSelection.focus.path[2] &&
            focus.path[3] === getSelection.focus.path[3] &&
            !(
              (anchor.offset === getSelection.anchor.offset && focus.offset === getSelection.focus.offset) ||
              (anchor.offset === getSelection.focus.offset && focus.offset === getSelection.anchor.offset)
            ) &&
            anchor.offset === focus.offset
          ) {
            return;
          }
        }

        if (!(tableRef as any).current) {
          return;
        }

        if (tableSlateNode) {
          try {
            const tablePath = ReactEditor.findPath(editor, tableSlateNode);
            const tableEntry = Editor.node(editor, tablePath);
            if (startPath && endPath) {
              if (_.isEqual(startPath, endPath) || isReadOnly) {
                removeSelection(editor, setSelCells);
              } else {
                addSelection(editor, tableEntry, startPath, endPath, setSelCells);
              }
            }
          } catch (e) {
            console.log('[handleTableCellsMouseMove] err', e);
          }
        }
      }
    },
    [startKey, editor?.selection, (tableRef as any).current]
  );

  const handleMovingLineMouseMove = useCallback(
    e => {
      const editorDom = getEditorDom();
      editorDom.setPointerCapture(e.pointerId);

      if (!curCell) return;

      if (startPositionY !== null && isDragging) {
        const resizingRowEntry: any = RESIZING_ROW.get(editor);
        const minHeight = RESIZING_ROW_MIN_HEIGHT.get(editor);
        const originHeight = RESIZING_ROW_ORIGIN_HEIGHT.get(editor);
        const diffY = e.pageY - startPositionY;
        const calculatedHeight = Math.floor(originHeight + diffY);
        let isMinValue = false;

        if (minHeight - originHeight >= diffY) {
          isMinValue = true;
        }

        isMinValue ? setDifferenceY(minHeight - originHeight) : setDifferenceY(diffY);

        console.log('[resizingRowEntry 1 ]', curCell, minHeight, resizingRowEntry);

        document.body.style.cursor = 'row-resize';

        const trDOM = ReactEditor.toDOMNode(editor, resizingRowEntry[0]);
        let dataHeight = minHeight + 'px';

        switch (maskRectSide) {
          case 'top':
            if (minHeight && isMinValue) {
            } else {
              dataHeight = calculatedHeight + 'px';
            }
            trDOM.style.height = dataHeight;
            trDOM.setAttribute('data-height', dataHeight);

            break;
          case 'bottom':
            if (minHeight && isMinValue) {
            } else {
              dataHeight = calculatedHeight + 'px';
            }
            trDOM.style.height = dataHeight;
            trDOM.setAttribute('data-height', dataHeight);
            break;
          default:
            break;
        }
        console.log('differenceY]', startPositionY, differenceY);
        return;
      }

      if (startPositionX !== null && isDragging) {
        const minWidth = RESIZING_COL_MIN_WIDTH.get(editor);
        const tdEntry = RESIZING_COL.get(editor);
        console.log('[tdEntry]', tdEntry);
        const tablePath = tdEntry && tdEntry[1] && getParentPathByType(editor, tdEntry[1], ELTYPE.TABLE);
        if (!tablePath) return;
        const tableNode = Editor.node(editor, tablePath);
        const tableDOM = ReactEditor.toDOMNode(editor, tableNode[0]);
        console.log('[col 1 ]', tdEntry);

        const colNumber = tdEntry && tdEntry[1] && tdEntry[1][3];
        const originWidth = RESIZING_COL_ORIGIN_WIDTH.get(editor);
        const diffX = e.pageX - startPositionX;
        const calculatedWidth = Math.floor(originWidth + diffX);
        let isMinValue = false;

        if (minWidth - originWidth + 3 >= diffX) {
          isMinValue = true;
        }
        isMinValue ? setDifferenceX(minWidth - originWidth) : setDifferenceX(diffX);

        console.log('[diffX 1 ]', diffX, maskRectSide);

        document.body.style.cursor = 'col-resize';
        switch (maskRectSide) {
          case 'right':
            setColArr(prev => {
              const res = [...prev];
              if (isMinValue) {
                res.splice(colNumber, 1, minWidth + 'px');
              } else {
                res.splice(colNumber, 1, calculatedWidth + 'px');
              }
              tableDOM?.setAttribute('data-col-arr', JSON.stringify(res));
              return res;
            });

            console.log(`RRRRRR right`, originWidth, calculatedWidth);

            break;
          case 'left':
            setColArr(prev => {
              const res = [...prev];
              if (isMinValue) {
                res.splice(colNumber, 1, minWidth + 'px');
              } else {
                res.splice(colNumber, 1, calculatedWidth + 'px');
              }
              tableDOM?.setAttribute('data-col-arr', JSON.stringify(res));
              return res;
            });
            console.log(`LLLLLL left`, originWidth, calculatedWidth);
            break;
          default:
            break;
        }
        console.log('differenceX]', startPositionX, differenceX);
        return;
      }
    },
    [startPositionY, startPositionX, isDragging, curCell, maskRectSide]
  );

  const handleMovingLineMouseUp = useCallback(
    e => {
      const editorDom = getEditorDom();
      editorDom.releasePointerCapture(e.pointerId);

      console.log(`**MouseUp* start x, start y, dragging`, startPositionX, startPositionY, isDragging);
      if (startPositionY !== null && isDragging) {
        setStartPositionY(null);
        setDifferenceY(null);
        setRowMovingLine({ top: null });
        setIsDragging(false);
        document.body.style.cursor = 'default';

        const resizingRowEntry: any = RESIZING_ROW.get(editor);

        const trDOM = resizingRowEntry && resizingRowEntry[0] && ReactEditor.toDOMNode(editor, resizingRowEntry[0]);
        if (!trDOM) {
          return;
        }
        const dataHeight = trDOM.getAttribute('data-height');
        Transforms.setNodes(editor, { height: dataHeight } as any, { at: resizingRowEntry[1] });

        editorDom.removeEventListener('pointermove', handleMovingLineMouseMove);
        editorDom.removeEventListener('pointerup', handleMovingLineMouseUp);
      }

      if (startPositionX !== null && isDragging) {
        setStartPositionX(null);
        setDifferenceX(null);
        setColMovingLine({ left: -9999 });
        setIsDragging(false);
        document.body.style.cursor = 'default';

        const tdEntry = RESIZING_COL.get(editor);
        const tablePath = tdEntry && tdEntry[1] && getParentPathByType(editor, tdEntry[1], ELTYPE.TABLE);

        if (!tablePath) return;
        const tableNode = Editor.node(editor, tablePath);
        const tableDOM = ReactEditor.toDOMNode(editor, tableNode[0]);
        const dataColArr: string = tableDOM.getAttribute('data-col-arr');

        if (dataColArr) {
          const howWideEach = new Array(element.hwEach?.length || 1).fill(JSON.parse(dataColArr));
          Transforms.setNodes(editor, { hwEach: howWideEach } as Partial<Node>, { at: tablePath });
        }

        editorDom.removeEventListener('pointermove', handleMovingLineMouseMove);
        editorDom.removeEventListener('pointerup', handleMovingLineMouseUp);
      }
    },
    [startPositionY, startPositionX, isDragging]
  );

  const handleResetStartKey = useCallback(() => {
    setStartKey('');
    setCurCell(null);
  }, []);

  const getEditorDom = useCallback(() => {
    const editorDom = document.getElementById(`editorContainer-${docId}`);
    return editorDom;
  }, [docId]);

  useEffect(() => {
    const editorDom = getEditorDom();
    if (isDragging) {
      editorDom.addEventListener('pointermove', handleMovingLineMouseMove);
      editorDom.addEventListener('pointerup', handleMovingLineMouseUp);
    }
    editorDom.addEventListener('pointerup', handleResetStartKey);
    return () => {
      editorDom.removeEventListener('pointermove', handleMovingLineMouseMove);
      editorDom.removeEventListener('pointerup', handleMovingLineMouseUp);
      editorDom.removeEventListener('pointerup', handleResetStartKey);
    };
  }, [isDragging]);

  useEffect(() => {
    const tbodyDom = (tableTargetRef as any).current?.childNodes?.[1];
    if (tbodyDom) {
      const tbodyClientBounding = tbodyDom.getBoundingClientRect();
      if (
        tableRect.height !== tbodyClientBounding.height ||
        tableRect.width !== tbodyClientBounding.width ||
        tableRect.left !== tbodyClientBounding.left ||
        tableRect.top !== tbodyClientBounding.top
      ) {
        setTableRect({
          height: tbodyClientBounding.height || 0,
          width: tbodyClientBounding.width || 0,
          left: tbodyClientBounding.left || 0,
          top: tbodyClientBounding.top || 0,
        });
      }
    }
  }, [differenceX, differenceY]);

  useEffect(() => {
    tableDom && setTableSlateNode(ReactEditor.toSlateNode(editor, tableDom));
  }, [tableDom]);

  useEffect(() => {
    console.log('table element state', element);
    if ((tableRef as any).current) {
      const newColArr = element.hwEach[0];
      console.log('newColArr 1', newColArr, element.column, element.hwEach?.[0]?.length, element);
      setColArr(newColArr);
    }
  }, [element]);

  useEffect(() => {
    const tableEl = (tableTargetRef as any)?.current?.childNodes?.[1];
    const rowPathNum =
      (tableTargetRef as any).current?.childNodes?.[1] &&
      ReactEditor.findPath(editor, ReactEditor.toSlateNode(editor, (tableTargetRef as any).current.childNodes[1]))[0];

    if (element.unbordered) {
      if (editor?.selection?.focus?.path?.length >= 4 && editor.selection.focus.path[0] === rowPathNum) {
        $(tableEl).find('td').css('border', '1px dashed #d9d9d9');
      } else if (element.unbordered) {
        $(tableEl).find('td').css('border', '1px dashed transparent');
      }
    } else {
      $(tableEl).find('td').css('border', '1px solid #d9d9d9');
    }
  }, [element.unbordered, element.column, element.row, editor && editor.selection, (tableTargetRef as any).current]);

  useEffect(() => {
    console.log('[useEffect isDragging]', isDragging);
  }, [isDragging]);

  useEffect(() => {
    if (selCells.length === 0) {
      return;
    }
    if (
      !editor?.selection ||
      ((tableRef as any).current &&
        editor.selection &&
        ReactEditor.hasRange(editor, editor.selection) &&
        tableSlateNode &&
        ReactEditor.findPath(editor, tableSlateNode)[0] !== editor?.selection.focus.path[0])
    ) {
      removeSelection(editor, setSelCells);
    }
  }, [editor?.selection, ReactEditor.isFocused(editor)]);

  useEffect(() => {
    if ((tableRef as any).current && !isReadOnly) {
      const thisTableDom = tableDom;
      if (selCells.length > 0) {
        $(thisTableDom).find('.sider-menu-btn').css('display', 'none');

        $(thisTableDom).addClass('transparent-selection');
        $(document).find('.hovering-toolbar-wrap').css('display', 'none');
      } else {
        $(thisTableDom).removeClass('transparent-selection');
      }
    }
    if (selCells?.length) {
      Transforms.collapse(editor, { edge: 'start' });
    }
  }, [selCells, editor?.selection, tableDom]);

  useWindowUnloadEffect(() => {
    removeSelection(editor, setSelCells);
  }, false);

  useEffect(() => {
    const observerRoot = (tableTargetRef as any).current?.parentNode;
    const observerTarget = (tableTargetRef as any).current;
    const overflowShadowContainer = (tableRef as any).current.parentNode;
    overflowShadowContainer.classList.add('overflow-shadow-container');
    overflowShadowContainer.classList.add('card-table-wrap');
    const options = {
      root: observerRoot,
      threshold: 1,
    };

    new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio !== 1) {
        overflowShadowContainer.classList.add('is-overflowing', 'is-scrolled-left');
      } else {
        overflowShadowContainer.classList.remove('is-overflowing');
      }
    }, options).observe(observerTarget);

    let handleScrollX = e => {
      if (e.target.scrollLeft < 1) {
        overflowShadowContainer.classList.add('is-scrolled-left');
      } else {
        overflowShadowContainer.classList.remove('is-scrolled-left');
      }
      if (Math.abs(e.target.scrollLeft + e.target.offsetWidth - observerTarget.offsetWidth) <= 1) {
        overflowShadowContainer.classList.add('is-scrolled-right');
      } else {
        overflowShadowContainer.classList.remove('is-scrolled-right');
      }
    };

    observerRoot.addEventListener('scroll', handleScrollX);

    return () => {
      observerRoot.removeEventListener('scroll', handleScrollX);
    };
  }, []);

  const handleScrollTop = useCallback(
    (e?: any) => {
      const scrollContainerRefDom: HTMLElement = document.getElementById(`editor-content-wrap-${docId}`);
      const table: HTMLElement = tableRef?.current;

      if (!scrollContainerRefDom || !table) return;
      const containerRect = scrollContainerRefDom.getBoundingClientRect();
      const tableRect = (table as HTMLElement).getBoundingClientRect();
      const { top: containerTop, bottom: containerBottom } = containerRect;
      const { top: tableTop, bottom: tableBottom, height: height } = tableRect;

      const isScrolled = tableTop < containerTop;

      if (isScrolled) {
        setIsTableBtnWrapScrolled(true);
      } else {
        setIsTableBtnWrapScrolled(false);
      }
    },
    [tableRef?.current]
  );

  useEffect(() => {
    if (!isShowBar || !isShowTableToolbar) return;
    handleScrollTop();
    const scrollContainerRefDom = document.getElementById(`editor-content-wrap-${docId}`);

    scrollContainerRefDom.addEventListener('scroll', handleScrollTop);

    return () => {
      scrollContainerRefDom.removeEventListener('scroll', handleScrollTop);
    };
  }, [isShowBar, isShowTableToolbar]);

  const isSelectionMergedCell = isMergedCell(editor);

  const editorContainerWrap = getCache(editor?.docId, 'editorWrapDom');
  const editorContainerWrapRect = editorContainerWrap?.getBoundingClientRect();

  const tableBtnWrap = useMemo(
    () => (
      <div
        className={cx(
          'overlay-button-wrap',
          css`
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2px;
          `
        )}
        onMouseEnter={() => {
          setIsOnTableToolBar(true);
        }}
        onMouseLeave={() => {
          setTimeout(() => {
            setIsOnTableToolBar(false);
          }, 400);
        }}
      >
        <GeneralOverlayButton
          title={f('tableInsertUp')}
          icon={<IconBtn className="Tripdocs-add_row_below" style={{ fontSize: '15px' }} />}
          onMouseDown={e => {
            e.preventDefault();
            e.stopPropagation();
            handleTableOps(editor, 'insertRowReverse');
          }}
        />
        <GeneralOverlayButton
          title={f('tableInsertDown')}
          icon={<IconBtn className="Tripdocs-add_row_above" style={{ fontSize: '15px' }} />}
          onMouseDown={e => {
            e.preventDefault();
            e.stopPropagation();
            handleTableOps(editor, 'insertRow');
          }}
        />
        <GeneralOverlayButton
          title={f('tableDeleteSelectedRow')}
          hoverStyle="danger"
          icon={<IconBtn className="Tripdocs-delete_row" style={{ fontSize: '15px' }} />}
          onMouseDown={e => {
            e.preventDefault();
            handleTableOps(editor, 'deleteRow');
          }}
        />
        <Divider type="vertical" />
        <GeneralOverlayButton
          title={f('tableInsertLeft')}
          icon={<IconBtn className="Tripdocs-add_col_before" style={{ fontSize: '15px' }} />}
          onMouseDown={e => {
            e.preventDefault();
            e.stopPropagation();
            handleTableOps(editor, 'insertColReverse');
          }}
        />
        <GeneralOverlayButton
          title={f('tableInsertRight')}
          icon={<IconBtn className="Tripdocs-add_col_after" style={{ fontSize: '15px' }} />}
          onMouseDown={e => {
            e.preventDefault();
            e.stopPropagation();
            handleTableOps(editor, 'insertCol');
          }}
        />
        <GeneralOverlayButton
          title={f('tableDeleteSelectedColumn')}
          hoverStyle="danger"
          icon={<IconBtn className="Tripdocs-delete_col" style={{ fontSize: '15px' }} />}
          onMouseDown={e => {
            e.preventDefault();
            e.stopPropagation();
            handleTableOps(editor, 'deleteCol');
          }}
        />
        <Divider type="vertical" />
        <GeneralOverlayButton
          title={isTableUnbordered(editor) ? `${f('showBorder')}` : `${f('hideBorder')}`}
          icon={
            <IconButton active={isTableUnbordered(editor)} style={{ borderRadius: '4px', height: '100%', width: '100%' }}>
              <IconBtn className={`Tripdocs-no_border`}></IconBtn>
            </IconButton>
          }
          onMouseDown={(e: any) => {
            e.preventDefault();
            e.stopPropagation();
            const sel = editor.selection;
            if (sel && sel.focus.path.length > 3) {
              const [tableNode, tablePath]: any = Editor.node(editor, [sel.focus.path[0], 1]);
              if (tableNode.unbordered) {
                Transforms.setNodes(editor, { unbordered: null } as Partial<Node>, { at: tablePath });
              } else {
                Transforms.setNodes(editor, { unbordered: true } as Partial<Node>, { at: tablePath });
              }
            }
          }}
        />
        {!isMobile && (
          <GeneralOverlayButton
            title={f('copyTable')}
            icon={<IconBtn className="Tripdocs-duplicate" style={{ fontSize: '15px' }} />}
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();
              removeSelection(editor, setSelCells);
              const path = ReactEditor.findPath(editor, element);
              if (path) {
                const cardPath = getParentPathByType(editor, path, ELTYPE.CARD);
                const range = Editor.range(editor, cardPath);
                const start = Editor.end(editor, Editor.previous(editor, { at: range })[1]);
                const end = Editor.start(editor, Editor.next(editor, { at: range })[1]);
                Transforms.select(editor, { anchor: start, focus: end });
                console.log('1111 [copy]', range, cardPath);
                setTimeout(() => {
                  document.execCommand('copy');
                  Transforms.deselect(editor);
                });
              }
            }}
          />
        )}
        <GeneralOverlayButton
          title={f('deleteTable')}
          hoverStyle="danger"
          icon={<IconBtn className="Tripdocs-delete_table" style={{ fontSize: '15px' }} />}
          onMouseDown={e => {
            e.preventDefault();
            const path = ReactEditor.findPath(editor, element);
            if (path) {
              Transforms.removeNodes(editor, { at: path });
            }
          }}
        />

        {selCells?.length > 0 || isSelectionMergedCell ? <Divider type="vertical" /> : null}
        {selCells?.length > 0 && (
          <GeneralOverlayButton
            title={f('tableMerge')}
            icon={<IconBtn className="Tripdocs-combine" style={{ fontSize: '15px' }} />}
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();
              handleTableOps(editor, 'mergeCell');
            }}
          />
        )}
        {isSelectionMergedCell ? (
          <GeneralOverlayButton
            title={f('tableUnmerge')}
            icon={<IconBtn className="Tripdocs-split" style={{ fontSize: '15px' }} />}
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();
              handleTableOps(editor, 'unmergeCell');
            }}
          />
        ) : null}
      </div>
    ),
    [editor, element, selCells?.length, isSelectionMergedCell]
  );

  return (
    <div
      data-ignore-slate
      contentEditable={false}
      ref={tableRef}
      className={cx(
        'table-wrap',
        isMobile
          ? ''
          : css`
              &:not(:hover) .table-inner-wrap {
                &::-webkit-scrollbar,
                &::-webkit-scrollbar-track,
                &::-webkit-scrollbar-thumb {
                  visibility: ${isFocused ? null : 'hidden'};
                }
              }
            `
      )}
      style={{
        position: 'relative',
        margin: '0 0 0 -10px',
        userSelect: isReadOnly ? null : 'none',
        overflow: 'hidden',
      }}
      onDragStartCapture={e => {
        const target: any = e.target;
        const isDraggable = target.getAttribute('draggable');
        console.log('[table] onDragStartCapture', target, isDraggable);
        if (!isDraggable) {
          e.preventDefault();
        }
      }}
      onDragCapture={e => {
        const dragDataTransfer = getCache(editor?.docId, 'drag-data-transfer');
        const allowDragging = dragDataTransfer && !!dragDataTransfer.dragData;
        if (!allowDragging) {
          console.log('[table] onDragCapture', e.target);
          e.preventDefault();
        }
      }}
      onDragOverCapture={e => {
        const dragDataTransfer = getCache(editor?.docId, 'drag-data-transfer');
        const allowDragging = dragDataTransfer && !!dragDataTransfer.dragData;
        if (!allowDragging) {
          console.log('[table] onDragOverCapture', e.target);
          e.dataTransfer.dropEffect = 'none';
          e.preventDefault();
        }
      }}
      onDragEndCapture={e => {
        console.log('[table] onDragEndCapture', e.target);
        e.preventDefault();
      }}
      onMouseDown={(e: any) => {
        console.log('Mouse Down TableWrap', e.target?.classList.contains('table-side-div'));
        if (isReadOnly) return;

        const innerWrap = (e.currentTarget as HTMLElement)?.getElementsByClassName('table-inner-wrap')?.[0];
        if (innerWrap && e.target === innerWrap) {
          e.preventDefault();
          const tablePath = ReactEditor.findPath(editor, element);
          const linePath = tablePath.slice(0, -1);

          const [lineNode]: any = Editor.node(editor, linePath);
          const lastTextLength = lineNode.children[lineNode.children.length - 1]?.text?.length || 0;
          const end = Editor.end(editor, {
            path: [...linePath, lineNode.children.length - 1, 0],
            offset: lastTextLength,
          });
          Transforms.select(editor, end);
          return;
        }
        const cell = (e.target as HTMLBaseElement).closest('td');
        const key = cell?.getAttribute('data-key') || '';
        let btnNum = e.button;

        if (editor && (tableTargetRef as any).current?.childNodes?.[1]) {
          const curTableNode = ReactEditor.toSlateNode(editor, (tableTargetRef as any).current.childNodes[1]);
          const curTablePath = ReactEditor.findPath(editor, curTableNode);
          ACTIVE_TABLE.set(editor, [curTableNode, curTablePath]);
        }

        if (btnNum === 2 || e.target?.classList.contains('table-side-div')) {
          e.preventDefault();
          return;
        }

        removeSelection(editor, setSelCells);
        setStartKey(key);
      }}
      onMouseMove={handleTableCellsMouseMove}
      onMouseLeave={e => {
        setCurCell(null);

        if (selCells.length > 0 && e.buttons === 1) {
          removeSelection(editor, setSelCells);
          setIsShowBar(false);
        }
        setIsFocused(false);
      }}
      onMouseEnter={e => {
        if (editor && editor.selection && ReactEditor.hasRange(editor, editor.selection) && Range.isExpanded(editor.selection) && e.buttons === 1) {
          e.preventDefault();
          console.log('MOUSE ENTER');
          setIsFakeSelected(true);
        }
        setIsFocused(true);
      }}
    >
      <div
        data-ignore-slate
        className="row-div-bar ignore-toggle-readonly"
        style={{
          position: 'absolute',
          left: rowDivBarMargin.left,
          top: rowDivBarMargin.top,
          width: 15,
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none',
          msUserSelect: 'none',
          MozUserSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        contentEditable={false}
      >
        <RowSideDiv
          editor={editor}
          isShowBar={isReadOnly ? false : isShowBar}
          tableRef={tableRef}
          getTableNode={getTableNode}
          selCells={selCells}
          setSelCells={setSelCells}
        />
        <div
          data-ignore-slate
          ref={rowMovingLineRef}
          className="table-row-moving-line"
          style={{
            top: rowMovingLine?.top || 0,
            display: !rowMovingLine?.top ? 'none' : 'block',
            left: isShowBar ? 0 : tableMargin.left,
            width: isShowBar ? tableRect?.width + tableMargin.left : tableRect?.width || 0,
            position: 'absolute',

            marginTop: Math.round(differenceY) || 0,
          }}
          contentEditable={false}
        ></div>
      </div>
      <IntersectionPointDiv
        editor={editor}
        tableDom={tableDom}
        getTableNode={getTableNode}
        selCells={selCells}
        setSelCells={setSelCells}
        isShowBar={isReadOnly ? false : isShowBar}
      />
      <div
        data-ignore-slate
        className={cx(
          'table-inner-wrap',
          isFocused ? `table-focused` : null,
          css`
            position: absolute;
            margin: 0 0 10px 14px;
            padding-top: 14px;
            display: block;
            overflow-y: hidden;
            overflow-x: auto;
            position: relative;
            z-index: 1;
          `
        )}
        style={{ userSelect: isReadOnly ? null : 'none' }}
        contentEditable={false}
      >
        <table
          ref={tableTargetRef}
          className={cx('table-element', isFakeSelected ? `table-fake-selected` : null, selCells?.length ? `table-hideselection` : null)}
          style={{
            position: 'relative',
            tableLayout: 'fixed',
            marginBottom: '3px',
            marginRight: '1px',
            width: 'max-content',
            userSelect: isReadOnly ? null : 'none',
          }}
          contentEditable={false}
        >
          <colgroup data-ignore-slate className="ignore-toggle-readonly" style={{ userSelect: 'none' }} contentEditable={false}>
            {colArr.map(colWidth => (
              <col data-ignore-slate width={Number.parseInt(colWidth) || '40px'}></col>
            ))}
          </colgroup>
          <Dropdown
            overlay={visible ? tableMenu(editor?.selection, setVisible) : <></>}
            trigger={isReadOnly ? [] : ['contextMenu']}
            visible={visible}
            onVisibleChange={flag => setVisible(flag)}
            overlayStyle={{
              position: 'absolute',
              boxShadow: '0 0 15px 0 rgba(0, 0, 0, 0.2)',
              overflow: 'auto',
              zIndex: 1000,
              maxHeight: window.innerHeight,
            }}
            getPopupContainer={() => (tableRef as any).current.parentNode}
          >
            <tbody
              {...attributes}
              style={{ userSelect: 'auto' }}
              contentEditable={false}
              onDrag={e => {
                e.preventDefault();
              }}
              onContextMenuCapture={e => {
                const target = e.target as HTMLElement;
                if (editor && target) {
                  try {
                    let node: any = ReactEditor.toSlateNode(editor, target);
                    if (Text.isText(node)) {
                      const nodeEntry = Editor.parent(editor, ReactEditor.findPath(editor, node));
                      nodeEntry && (node = nodeEntry[0]);
                    } else if (node && node.type === ELTYPE.TABLE_CELL && node.children?.length > 0) {
                      node = node.children[node.children.length - 1];
                    }
                    console.log('[tbody] onContextMenu node', node);
                    if (node && node.type && [...TABBABLE_TYPES].includes(node.type)) {
                      const path = ReactEditor.findPath(editor, node);
                      console.log('[tbody] onContextMenu', e, path, node);
                      Transforms.select(editor, path);
                      Transforms.collapse(editor, { edge: 'end' });
                    } else if (node && node.type && [ELTYPE.IMAGE].includes(node.type)) {
                      e.stopPropagation();
                      e.preventDefault();
                    }
                  } catch (err) {
                    console.log('[tbody] onContextMenu', err);
                  }
                }
              }}
              onMouseDown={e => {}}
            >
              {children}
            </tbody>
          </Dropdown>
        </table>
        <div
          className="col-div-bar ignore-toggle-readonly"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'flex',
            userSelect: 'none',
            msUserSelect: 'none',
            MozUserSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          data-ignore-slate
          contentEditable={false}
        >
          <ColSideDiv
            editor={editor}
            isShowBar={isReadOnly ? false : isShowBar}
            tableRef={tableRef}
            getTableNode={getTableNode}
            selCells={selCells}
            setSelCells={setSelCells}
            colArr={colArr}
          />
          <div
            data-ignore-slate
            ref={colMovingLineRef}
            className="table-col-moving-line"
            style={{
              top: isShowBar ? 0 : tableMargin.top,
              left: colMovingLine?.left || -9999,
              height: isShowBar ? tableRect?.height + tableMargin.top : tableRect?.height || 0,
              position: 'absolute',
              marginLeft: Math.round(differenceX) || 0,
            }}
          ></div>
        </div>
      </div>

      {editor?.selection && ReactEditor.hasRange(editor, editor.selection) && Range.isExpanded(editor.selection) ? null : (
        <ResizeMask
          rowMovingLineRef={rowMovingLineRef}
          colMovingLineRef={colMovingLineRef}
          editor={editor}
          tableRect={tableRect}
          curCell={curCell}
          setMaskRectSide={setMaskRectSide}
          tableResizeMaskRect={tableResizeMaskRect}
          startPositionX={startPositionX}
          startPositionY={startPositionY}
          setStartPositionX={setStartPositionX}
          setStartPositionY={setStartPositionY}
          differenceX={differenceX}
          differenceY={differenceY}
          setRowMovingLine={setRowMovingLine}
          setColMovingLine={setColMovingLine}
          rowMovingLine={rowMovingLine}
          colMovingLine={colMovingLine}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          startKey={startKey}
        />
      )}

      {!isReadOnly && isTableBtnWrapScrolled && isShowBar && isShowTableToolbar && editorContainerWrapRect && overlayRefRect && (
        <EditorContainerPortal docId={docId}>
          <div
            className={cx(css`
              display: flex;
              z-index: 200;
              padding: 2px;
              background-color: white;
              border-radius: 4px;
              box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
              border: 1px solid #dee0e3;
              position: absolute;
            `)}
            style={{
              position: 'fixed',
              top: editorContainerWrapRect?.top + 20,
              left: overlayRefRect.left + overlayRefRect.width / 2,
              transform: 'translateX(-50%)',
            }}
          >
            {tableBtnWrap}
          </div>
        </EditorContainerPortal>
      )}
      <Overlay
        bordered
        show={!isReadOnly && !isTableBtnWrapScrolled && isShowBar && isShowTableToolbar}
        docId={docId}
        placement="top"
        distance={60}
        overlayRefDom={overlayRefDom}
        left={overlayRefRect?.left}
      >
        {tableBtnWrap}
      </Overlay>
    </div>
  );
});

function isMergedCell(editor) {
  if (!editor || !editor.selection) return false;
  const cellPath = getParentPathByType(editor, editor.selection.anchor.path, ELTYPE.TABLE_CELL);
  if (!cellPath) return false;
  const cellNode: any = Node.get(editor, cellPath);
  if (!cellNode) return false;
  return (cellNode.colspan >= 1 && cellNode.rowspan > 1) || (cellNode.colspan > 1 && cellNode.rowspan >= 1);
}

export default TableElement;
