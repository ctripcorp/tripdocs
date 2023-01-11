import { css, cx } from '@emotion/css';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { Editor, Node } from '@src/components/slate-packages/slate';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ELTYPE, HEADING_TYPES, LIST_TYPES } from '../config';
import { OlList, UlList } from '../OLULList/OlList';
import { getEditorEventEmitter } from '../table/selection';
import $ from 'jquery';
import { getCache } from '@src/utils/cacheUtils';
import _ from 'lodash';
import { Popover, Radio, Tooltip } from 'antd';
import { f } from '@src/resource/string';
import { ArrowRightOutlined, CaretDownOutlined, SettingOutlined } from '@ant-design/icons';
import { IconBtn } from '../Components';
import scrollIntoView from 'scroll-into-view-if-needed';
import './index.less';
import sessStorage from '@src/utils/sessStorage';
import { TODOList } from '../TodoList/todoList';

type DocTocTitleProps = {
  showCollapseBtn: boolean;
  isAnchorCollapsed: boolean;
  handleDeepestHeading: (e) => void;
  deepestDisplayAnchor: 3 | 4 | 5 | 6;
  setIsAnchorCollapsed: Function;
  tocPlacement: 'left' | 'right';
};

const DocTocTitle = (props: DocTocTitleProps) => {
  const { showCollapseBtn, isAnchorCollapsed, handleDeepestHeading, deepestDisplayAnchor, setIsAnchorCollapsed, tocPlacement } = props;
  return (
    <>
      <div
        className={cx('doc-directory-title')}
        style={{
          gridTemplateAreas: showCollapseBtn ? '1 1 1 1' : null,
        }}
      >
        <div className="outline-title">
          <span className="outline-title-btn">
            {showCollapseBtn && (
              <div className="document-outline-btn-collapse" style={{ justifySelf: 'center' }}>
                <Tooltip title={f('collapseAnchor')} placement="bottom">
                  <IconBtn
                    className={tocPlacement === 'left' ? 'Tripdocs-drop_left' : 'Tripdocs-drop_right'}
                    onMouseDown={e => {
                      e.preventDefault();
                      setIsAnchorCollapsed(true);
                    }}
                  />
                </Tooltip>
              </div>
            )}
          </span>
          <span className="outline-title-text">{`${f('documentOutline')}`}</span>
        </div>
        <div></div>
        <div className="document-outline-btn-setting" style={{ justifySelf: 'center' }}>
          <Popover
            placement="bottom"
            trigger={['click']}
            content={
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div style={{ lineHeight: '40px' }}>{`${f('deepestAnchorLevel')}`}</div>
                <Radio.Group
                  onChange={handleDeepestHeading}
                  value={deepestDisplayAnchor}
                  className={css`
                    & {
                      z-index: 1070;
                    }
                  `}
                >
                  <Radio.Button
                    disabled
                    value="title"
                    style={{
                      cursor: 'default',
                      color: 'rgba(0, 0, 0, 0.85)',
                      backgroundColor: '#fff',
                      border: 'none',
                    }}
                  >
                    {`${f('heading')}`}
                  </Radio.Button>
                  <Radio.Button value={3}>3</Radio.Button>
                  <Radio.Button value={4}>4</Radio.Button>
                  <Radio.Button value={5}>5</Radio.Button>
                  <Radio.Button value={6}>6</Radio.Button>
                </Radio.Group>
              </div>
            }
          >
            <Tooltip title={f('outlineSetting')} placement="bottom">
              <SettingOutlined />
            </Tooltip>
          </Popover>
        </div>
      </div>
      {}
    </>
  );
};

const OutlineAnchor = (props: any) => {
  const { editor, docId, scrollRef, deepestDisplayAnchor, isLarge, isMobile, isShowAnchor, maxWidth } = props;
  const [focusedAnchorItemIndex, setFocusedAnchorItemIndex] = useState(-1);

  const [headingTagList, setHeadingTagList] = useState([]);
  const [unseenArr, setUnseenArr] = useState([]);
  const [descendantMap, setDescendantMap] = useState({});

  useEffect(() => {
    const focusedAnchorItem = $(`#editorContainer-${docId} .anchor-container .anchor-item-group .focused-anchor-item`)[0];
    if (focusedAnchorItem) {
      scrollIntoView(focusedAnchorItem, {
        block: 'nearest',
        scrollMode: 'if-needed',
        inline: 'center',
      });
    }
  }, [focusedAnchorItemIndex]);

  const listener = useCallback(
    deepest => () => {
      let hTagList = [];

      const editor = window.tripdocs.editorsMap[docId].editor;
      if (typeof window !== 'undefined' && window.document.getElementById(`editorContainer-${docId}`) && editor) {
        const childrenArr = editor.children.slice();
        childrenArr.shift();

        hTagList = childrenArr.filter(
          (element, index) =>
            getText(element) !== '' &&
            ((HEADING_TYPES.includes(element.type) && HEADING_TYPES.indexOf(element.type) < deepest) ||
              (HEADING_TYPES.includes(element.oldType) && LIST_TYPES.includes(element.type) && HEADING_TYPES.indexOf(element.oldType) < deepest))
        );
      }

      let descendantUnseenArr = [];
      let map = _.cloneDeep(descendantMap);
      hTagList.forEach((item, index, arr) => {
        const headTabLevel = getHeadTablevel(item.type, item.oldType);
        if (descendantMap[index]) {
          descendantUnseenArr = descendantMap[index];
        } else {
          for (let i = index + 1; i < arr.length; i++) {
            const cur = arr[i];
            if (getHeadTablevel(cur.type, cur.oldType) > headTabLevel) {
              descendantUnseenArr.push(i);
            } else {
              break;
            }
          }
        }
        map[index] = descendantUnseenArr;
        descendantUnseenArr = [];
      });
      console.log('ROA - hTagList: ', map);

      getEditorEventEmitter(docId).emit('outline/updateIsExpanded', docId, JSON.stringify([]), true);
      setUnseenArr([]);
      setDescendantMap(map);
      setHeadingTagList(hTagList);
    },
    [editor, docId]
  );

  useEffect(() => {
    if (editor && docId) {
      getEditorEventEmitter(docId).on('updateOutlineAnchor', listener(deepestDisplayAnchor), docId);
    }
    return () => {
      getEditorEventEmitter(docId).off('updateOutlineAnchor', listener(deepestDisplayAnchor), docId);
    };
  }, [editor && editor.docId, deepestDisplayAnchor]);

  const callback = useCallback(
    _.throttle(() => {
      const editorContent = document.getElementById(`editor-content-wrap-${docId}`);

      if (headingTagList.length > 0 && editorContent) {
        const headingDoms = headingTagList.map(heading => Node.isNode(heading) && ReactEditor.toDOMNode(editor, heading));
        const editorContainerScrollTop = editorContent.scrollTop;
        const editorContainerScrollBottom = editorContainerScrollTop + editorContent.clientHeight / 2;
        let firstHead = headingDoms[0];
        let firstHeadingIndex = 0;
        for (let i = 0; i < headingDoms.length; i++) {
          const headingDom = headingDoms[i];
          const headingDomHeight = headingDom?.getBoundingClientRect?.()?.height || 32;
          if (getText(headingTagList[i]).length > 0) {
            const scrollTop = headingDom?.offsetTop + Math.floor(headingDomHeight / 2);
            if (scrollTop > editorContainerScrollTop) {
              firstHead = headingDom;
              firstHeadingIndex = i;
              break;
            }
          }
        }
        const headingDom = headingDoms[firstHeadingIndex];
        const headingDomHeight = headingDom?.getBoundingClientRect?.()?.height || 32;
        const scrollBottom = headingDom?.offsetTop - Math.floor(headingDomHeight / 2);
        if (scrollBottom >= editorContainerScrollBottom && firstHeadingIndex > 0) {
          firstHeadingIndex = firstHeadingIndex - 1;
        }

        const endHeadingDom = headingDoms[headingDoms.length - 1];
        const endHeadingDomHeight = endHeadingDom?.getBoundingClientRect?.()?.height || 32;
        if (endHeadingDom && endHeadingDom.offsetTop - Math.floor(endHeadingDomHeight) < editorContainerScrollTop) {
          firstHeadingIndex = headingDoms.length - 1;
        }

        const anchorItemIndex = firstHeadingIndex;

        if (anchorItemIndex !== -1) {
          setFocusedAnchorItemIndex(anchorItemIndex);
        }
      }
    }, 100),
    [headingTagList]
  );

  useEffect(() => {
    const root = document.querySelector(`#editor-content-wrap-${docId}`);
    if (!root) return;
    root.addEventListener('scroll', callback);
    if (focusedAnchorItemIndex == -1) {
      callback();
    }

    return () => {
      root.removeEventListener('scroll', callback);
    };
  }, [headingTagList]);

  const getHeadTablevel = useCallback((type, oldType) => {
    let ret = {};
    ret[ELTYPE.HEADING_ONE] = 1;
    ret[ELTYPE.HEADING_TWO] = 2;
    ret[ELTYPE.HEADING_THREE] = 3;
    ret[ELTYPE.HEADING_FOUR] = 4;
    ret[ELTYPE.HEADING_FIVE] = 5;
    ret[ELTYPE.HEADING_SIX] = 6;
    return (typeof ret[type] === 'number' && ret[type]) || (typeof ret[oldType] === 'number' && ret[oldType]) || 1;
  }, []);

  const getText = useCallback(el => {
    if (el && el.text) return el.text;
    if (el && el.children) return getText(el.children);
    if (el && Array.isArray(el)) return el.reduce((prev: any, item: any) => '' + prev + getText(item), '');
    return '';
  }, []);

  const wrapTextWithStyle = useCallback((item, txt: string) => {
    const text = txt.replace(/^\s*/, '');
    if (!item?.type) return text;
    const { type } = item;
    let styled = text;
    switch (type) {
      case 'bulleted-list':
        if (isMobile) {
          styled = <li style={{ lineHeight: 1.75 }}>{text}</li>;
        } else {
          styled = (
            <UlList prop={{ attributes: {}, element: { ...item } }} isInAnchor={true} lineHeight={1.75}>
              {text}
            </UlList>
          );
        }
        break;
      case 'numbered-list':
        if (isMobile) {
          styled = <span style={{ lineHeight: 1.75, marginLeft: '-0.2em' }}>{item.num + '. ' + text}</span>;
        } else {
          styled = (
            <OlList prop={{ attributes: {}, element: { ...item } }} isInAnchor={true} lineHeight={1.75}>
              {text}
            </OlList>
          );
        }

        break;
      case 'todo-list':
        styled = (
          <TODOList isMobile={isMobile} prop={{ attributes: {}, element: { ...item } }} isInAnchor={true}>
            {text}
          </TODOList>
        );
        break;
    }
    return styled;
  }, []);

  const isAnchorDrawer = !isLarge && isShowAnchor;
  const editorContainer = document.getElementById(`editorContainer-${docId}`);
  const editorContainerWidth = editorContainer?.getBoundingClientRect().width;

  const anchorItemWidth = isAnchorDrawer ? `250px` : maxWidth;

  return (
    <>
      <div className="anchor-item-group" style={{ paddingLeft: '6px', paddingRight: '6px' }}>
        {headingTagList.length === 0 ? (
          <div
            className={cx(
              'anchor-instruction',
              css`
                width: ${anchorItemWidth};
                max-width: 244px;
                height: 100%;
                position: relative;
                margin: 0 auto;
                padding-left: 6px;
              `
            )}
          >
            <div
              className={cx(
                'anchor-instruction-wrap',
                css`
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  white-space: nowrap;
                  line-height: 2;
                  color: #afafaf;
                  font-size: 14px;
                  padding-left: 6px;
                  @media screen and (max-width: 1360px) {
                    font-size: 12px;
                  }
                `
              )}
            >
              <div>{f('emptyAnchorPlaceholder1')}</div>
              <div>{f('emptyAnchorPlaceholder2')}</div>
            </div>
          </div>
        ) : (
          headingTagList.map((item, index, arr) => {
            const anchorItemText = item?.children && item?.children.map(leaf => getText(leaf)).join('');
            const headTabLevel = getHeadTablevel(item.type, item.oldType);
            return (
              <div
                className={cx(
                  'anchor-item',
                  index === focusedAnchorItemIndex && !(anchorItemText.length === 0 || unseenArr.includes(index)) ? 'focused-anchor-item' : null,
                  css`
                    & {
                      min-width: 200px;
                      width: ${anchorItemWidth};
                      white-space: nowrap;
                      text-overflow: ellipsis;
                      overflow: hidden;
                      user-select: none;
                      color: rgb(143, 149, 158);
                      cursor: pointer;
                      font-size: 13px;
                      margin-left: 22px;
                      line-height: 1.75;
                      position: relative;
                      &:hover {
                        color: #2577e3;
                      }

                      ol,
                      ul,
                      dl {
                        margin-top: 0;
                        margin-bottom: 0;
                      }
                    }
                  `
                )}
                title={anchorItemText}
                style={{
                  display: anchorItemText.length === 0 || unseenArr.includes(index) ? 'none' : null,
                  paddingLeft: 0.2 + headTabLevel * (isMobile ? 0.5 : 1) + 'em',

                  fontWeight: index === focusedAnchorItemIndex ? 'bold' : null,
                }}
                onMouseDown={() => {
                  setFocusedAnchorItemIndex(index);
                  ReactEditor.deselect(editor);
                  const originItem = headingTagList[index];
                  const anchorItemEl = ReactEditor.toDOMNode(editor, originItem);
                  console.log('[outlineAnchor] scrollIntoView anchorItemEl', anchorItemEl);

                  scrollRef.current.scrollTo({ top: anchorItemEl.offsetTop - 20 });

                  $(anchorItemEl).on('webkitAnimationEnd animationEnd', function () {
                    $(this).removeClass('anchor-target');
                  });
                  $(anchorItemEl).addClass('anchor-target');
                }}
              >
                <CollapseBtn
                  docId={docId}
                  headTabLevel={headTabLevel}
                  index={index}
                  arr={arr}
                  getHeadTablevel={getHeadTablevel}
                  unseenArr={unseenArr}
                  setUnseenArr={setUnseenArr}
                  descendantMap={descendantMap}
                />
                {wrapTextWithStyle(item, anchorItemText)}
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

function CollapseBtn(props) {
  const { docId, headTabLevel, index, arr, getHeadTablevel, unseenArr, setUnseenArr, descendantMap } = props;

  const [isExpanded, setIsExpanded] = useState(unseenArr.includes(index) || true);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    const handleUpdateIsExpanded = (unseenArrStr: string, refreshAll?: boolean) => {
      const arr = JSON.parse(unseenArrStr);
      if (arr.includes(index) || refreshAll) {
        setIsExpanded(true);
      }
    };
    getEditorEventEmitter(docId).on('outline/updateIsExpanded', handleUpdateIsExpanded, docId);
    return () => {
      getEditorEventEmitter(docId).off('outline/updateIsExpanded', handleUpdateIsExpanded, docId);
    };
  }, []);

  useEffect(() => {
    const descendants = descendantMap[index];
    if (!descendants || isMounted.current) return;
    const newUnseenArr = unseenArr.filter(item => !descendants.includes(item));
    console.log('ROA - newUnseenArr init', newUnseenArr);
    descendants && descendants.length && setUnseenArr(newUnseenArr);
  }, [descendantMap]);

  const _onMouseDown = e => {
    e.preventDefault();
    e.stopPropagation();
    const descendants = descendantMap[index];
    console.log('ROA - descendants', descendantMap, index, descendants, unseenArr);
    if (!descendants || !descendants.length) {
      return;
    }
    if (isExpanded) {
      const newUnseenArr = _.uniqWith([...unseenArr, ...descendants], _.isEqual);
      console.log('ROA - newUnseenArr0', newUnseenArr);
      setUnseenArr(newUnseenArr);
      setIsExpanded(false);
    } else {
      const newUnseenArr = unseenArr.filter(item => !descendants.includes(item));
      getEditorEventEmitter(docId).emit('outline/updateIsExpanded', docId, JSON.stringify(unseenArr.filter(item => descendants.includes(item))));

      console.log('ROA - newUnseenArr1', newUnseenArr);
      setUnseenArr(newUnseenArr);
      setIsExpanded(true);
    }

    console.log('ROA - res', isExpanded, unseenArr, index);
  };

  return (
    <div
      data-ignore-slate
      className={cx(
        `collapse-btn-${headTabLevel}`,
        css`
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-left: -18px;
          margin-top: 4px;
          width: 16px;
          height: 16px;

          .anticon-caret-down {
            font-size: 12px;
            color: #adadad;
          }
        `
      )}
      style={{
        display: descendantMap[index]?.length > 0 ? 'flex' : 'none',
        transform: isExpanded ? null : 'rotate(-90deg)',
      }}
      onMouseDown={_onMouseDown}
    >
      {}
      <CaretDownOutlined />
    </div>
  );
}

export { OutlineAnchor, DocTocTitle };
