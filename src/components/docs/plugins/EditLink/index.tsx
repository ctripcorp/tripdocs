import { Button, Input, Menu, Tooltip, Popover } from 'antd';
import isUrl from 'is-url';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Editor, Range, Transforms, Node } from '@src/components/slate-packages/slate';
import { TripdocsSdkContext } from '../../../../Docs';
import { HistoryEditor } from '../../../slate-packages/slate-history';
import { ReactEditor, useSlate } from '../../../slate-packages/slate-react';
import { COLOR_DEFAULT, IconBtn } from '../Components';
import { ELTYPE } from '../config';
import { isSameLineSelection } from '../pluginsUtils/selectionUtils';
import './index.less';
import { css, cx } from '@emotion/css';
import { getCache } from '@src/utils/cacheUtils';
import { f } from '@src/resource/string';
import { Overlay } from '../OverlayComponents/Overlay';
import { EditorContainerPortal, Portal } from '@src/utils/createPortal';

export interface LinkEditor extends Editor {
  insertData: (data: any) => void;
  setFragmentData: (data: any) => void;
}

export const withEditLink = (editor: Editor & ReactEditor) => {
  const { insertData, insertText, isInline, isVoid, setFragmentData, deleteBackward } = editor;

  editor.isInline = (element: any) => {
    return element.type === ELTYPE.LINK ? true : isInline(element);
  };

  editor.deleteBackward = (unit: any) => {
    deleteBackward(unit);
  };
  editor.insertText = (text: string) => {
    if (text && isUrl(text)) {
      wrapLink(editor, text, editor.selection);
    } else {
      insertText(text);
    }
  };

  editor.insertData = (data: any) => {
    const text = data.getData('text/plain');
    console.log(' withEditLink insertData *******');
    if (text && isUrl(text)) {
      wrapLink(editor, text, editor.selection);
    } else {
      insertData(data);
    }
  };

  editor.setFragmentData = (data: DataTransfer) => {
    console.log('withEditLink setFragment', data);
    setFragmentData(data);
  };

  return editor;
};

export const insertEditLink = (editor: ReactEditor, href: string, selection: any) => {
  console.log('insertEditLink *******', editor, href, selection);

  if (selection) {
    wrapLink(editor, href, selection);
  }
};

export const isEditLinkActive = (editor: Editor) => {
  const [link] = Editor.nodes(editor, { match: (n: any) => n.type === ELTYPE.LINK });
  return !!link;
};

export const unwrapEditLink = (editor: Editor) => {
  Transforms.unwrapNodes(editor, { match: (n: any) => n.type === ELTYPE.LINK });
};

export const delLinks = (editor: any, element: any, node: any) => {
  const { text } = element;
  const path = ReactEditor.findPath(editor, ReactEditor.toSlateNode(editor, node));
  console.log('delLinks', editor, element, node, path);
  Transforms.unwrapNodes(editor, { at: path, match: (n: any) => n.type === ELTYPE.LINK });
};

export const setLinks = (editor: any, element: any, node: any, text: string) => {
  const path = ReactEditor.findPath(editor, ReactEditor.toSlateNode(editor, node));
  console.log('setLinks', editor, element, node, path);

  Transforms.setNodes(editor, element, { at: path, match: (n: any) => n.type === ELTYPE.LINK });
  editor.apply({ type: 'insert_text', path: path.concat([0]), offset: 0, text });
  Transforms.delete(editor, {
    at: {
      focus: { path: path.concat([0]), offset: text.length },
      anchor: { path: path.concat([0]), offset: element.children[0].text.length + text.length },
    },
  });
};

export const addHttp = (url: string) => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `http://${url}`;
  }
  return url;
};

export const wrapLink = (editor: ReactEditor, href: string, selection: any) => {
  if (isEditLinkActive(editor)) {
    unwrapEditLink(editor);
  }

  const isCollapsed = selection && ReactEditor.hasRange(editor, selection) && Range.isCollapsed(selection);
  const link = {
    type: ELTYPE.LINK,
    href,
    isInit: true,
    children: isCollapsed ? [{ text: href || '链接' }] : [],
  };

  if (isCollapsed) {
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true, at: selection });
    Transforms.collapse(editor, { edge: 'end' });
  }
};

interface SlateElementProps {
  attributes: any;
  element: any;
  children: any;
  editor: any;
  ref: any;
  editorId: any;
}

export const EditLink = (props: SlateElementProps) => {
  const { attributes, element, children, editor, editorId } = props;
  const { href = '', isInit } = element;
  const text = element?.children?.[0]?.text || '';
  const [vText, setVText] = useState(text);
  const [vHref, setVHref] = useState(href);
  const [isShow, setIsShow] = useState(false);
  const editWrapRef = useRef();
  const linkRef = useRef();
  const [isEdit, setIsEdit] = useState(isInit);
  const { docId, isReadOnly } = useContext(TripdocsSdkContext);
  const isInElectron: boolean = getCache(docId, 'options')?.isInElectron;
  const [isSingleLine, setIsSingleLine] = useState(true);
  const [overlayRefDom, setOverlayRefDom] = useState(null);
  const [overlayRefRect, setOverlayRefRect] = useState(null);

  useEffect(() => {
    const dom = editor && ReactEditor.toDOMNode(editor, element);
    if (dom) {
      const rect = dom.getBoundingClientRect();
      setOverlayRefDom(dom);
      setOverlayRefRect(rect);
      const singleLineHeight = getComputedStyle(dom).lineHeight;
      const domHeight = rect.height;
      if (domHeight > parseInt(singleLineHeight)) {
        setIsSingleLine(false);
      }
    }
  }, [editor, element]);

  const openLink = useCallback(() => {
    if (isInElectron) {
      console.log('[openLink] isInElectron', href);
      window.tripdocs.editorsMap[docId]?.api?.linkClickCallBack(href || '');
    } else {
      let newWindow = window.open(href, '_blank');
      newWindow.sessionStorage.clear();
      newWindow.opener = null;
    }
  }, [href, isReadOnly]);

  useEffect(() => {
    setVText(text);
    setVHref(href ? href : '');
  }, [text, href]);

  useEffect(() => {
    if (isInit && attributes.ref.current) {
      HistoryEditor.withoutSaving(editor, () => {
        Transforms.setNodes(editor, { isInit: false } as any, {
          at: ReactEditor.findPath(editor, ReactEditor.toSlateNode(editor, attributes.ref.current)),
        });
      });
    }
  }, [isInit]);

  useEffect(() => {
    if (isEdit && attributes.ref.current && !isReadOnly) {
      const el: any = editWrapRef.current;
      const container = document.getElementById(editorId);
      const containerRect = container.getBoundingClientRect();
      const dom = attributes.ref.current;

      const rect = dom.getBoundingClientRect();
      el.style.top = `${rect.bottom + window.pageYOffset - containerRect.top + 83}px`;
      el.style.zIndex = 9999;
      let leftOffset = rect.left + window.pageXOffset + 300 - window.innerWidth;
      if (leftOffset < 0) {
        leftOffset = 0;
      }
      el.style.left = `${rect.left + window.pageXOffset - containerRect.left - leftOffset}px`;
    }
  }, [isEdit, attributes.ref.current]);

  const scroll = () => {
    const link: Element = linkRef?.current;
    if (link) {
      if (document.body.getBoundingClientRect().bottom - link.getBoundingClientRect().bottom < 200) {
        const scrollWrap: HTMLElement = getCache(docId, 'editorWrapDom');
        if (scrollWrap) {
          const scrollY = scrollWrap.scrollTop;
          scrollWrap.scrollTo({ top: scrollY + 150, behavior: 'smooth' });
        }
      }
    }
  };

  const handleClickOutside = useCallback(
    (event: any) => {
      const link: Element = linkRef?.current;
      const editWrap: Element = editWrapRef?.current;

      if ((link && link.contains(event.target)) || (editWrap && editWrap.contains(event.target))) {
        setIsShow(true);
        scroll();
      } else {
        setIsShow(false);
      }
    },
    [linkRef?.current, editWrapRef?.current]
  );

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isReadOnly]);

  return (
    <a
      ref={linkRef}
      data-link
      data-href={href}
      data-slate-node="element"
      title={isReadOnly ? vHref : null}
      style={{
        fontStyle: 'normal',
        wordBreak: 'break-all',
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        color: isShow ? '#275b8c' : '#0269c8',
        borderBottom: ' 1px solid #d1e9ff',
        textDecoration: 'none',
        cursor: isReadOnly ? 'pointer' : 'text',
        margin: '0 2px',
      }}
      href={href}
      onClick={e => {
        if (isReadOnly) {
          e.preventDefault();
        }
      }}
      onMouseDownCapture={e => {
        if (e.button === 2) {
          return;
        }
        if (isReadOnly) {
          e.preventDefault();
          openLink();
        }
      }}
    >
      {}
      <span {...attributes}>
        {children}
        <span className={'ignore-toggle-readonly'} data-ignore-slate contentEditable={false} style={{ userSelect: 'none' }}>
          {'\uFEFF'}
        </span>
      </span>

      {isEdit && !isReadOnly && (
        <Portal editorId={editorId}>
          <div
            ref={editWrapRef}
            className="component-edit-link"
            onMouseDown={e => {
              e.stopPropagation();
            }}
            style={{ width: isEdit ? 350 : 96 }}
          >
            <div className="edit-wrap">
              <InputRow txt={f('text')} placeholder={f('textHint')} value={vText} callback={v => setVText(v)} editor={editor} autoFocus={!vText} />
              <Hint show={vText.length === 0} text={f('textHint')} />
              <InputRow
                txt={f('link')}
                placeholder={'http://'}
                value={vHref}
                callback={v => setVHref(v ? v : '')}
                editor={editor}
                autoFocus={!!vText}
                trim={true}
              />
              <Hint show={vHref ? vHref?.length === 0 : true} text={f('linkHint')} />
              <div
                className="row"
                style={{
                  justifyContent: 'flex-end',
                }}
              >
                <Button
                  className="btn"
                  type="default"
                  style={{ marginRight: '10px' }}
                  onMouseDown={e => {
                    e.preventDefault();
                    setIsEdit(false);
                    setIsShow(false);
                    setVHref(href ? href : '');
                    setVText(text);
                  }}
                >
                  {f('cancel')}
                </Button>

                <Button
                  disabled={(vText ? vText?.length === 0 : true) || (vHref ? vHref?.length === 0 : true)}
                  className="btn"
                  type="primary"
                  onMouseDown={e => {
                    e.preventDefault();
                    if ((vText ? vText?.length === 0 : true) || (vHref ? vHref?.length === 0 : true)) return;
                    setLinks(editor, { ...element, ...{ href: addHttp(vHref) } }, attributes.ref.current, vText);
                    setIsEdit(false);
                    setIsShow(false);
                  }}
                >
                  {f('complete')}
                </Button>
              </div>
              <div
                className="mask"
                onMouseDown={e => {
                  e.preventDefault();
                  setIsEdit(false);
                  setIsShow(false);
                  setVHref(href ? href : '');
                  setVText(text);
                }}
              />
            </div>
          </div>
        </Portal>
      )}
      <Overlay
        show={!isEdit && isShow}
        docId={editor?.docId || ''}
        overlayRefDom={overlayRefDom}
        left={overlayRefRect?.left}
        placement={isReadOnly ? 'top' : isSingleLine ? 'bottom' : 'bottomLeft'}
        distance={isReadOnly ? 40 : 5}
        offset={{ left: isReadOnly || isSingleLine ? null : 50, top: 0 }}
        bordered
      >
        {isReadOnly ? null : (
          <div className="component-link-buttons" style={{ width: 96 }}>
            <div className="wrap">
              <VisitButton
                onClick={(e: any) => {
                  openLink();
                }}
              />
              <EditButton
                className="href"
                onClick={(e: any) => {
                  setIsEdit(true);
                  scroll();
                }}
              />
              <CancelButton
                onClick={() => {
                  delLinks(editor, element, attributes.ref.current);
                }}
              />
            </div>
          </div>
        )}
      </Overlay>
    </a>
  );
};

export const EditLinkButton = (props: any) => {
  const { ...attributes } = props;

  const editor = useSlate();
  const sel = editor.selection;

  const isActive = isEditLinkActive(editor);

  const selection = editor.selection;

  const [hover, setHover] = useState(false);
  const MenuItem = Menu.Item;
  return (
    <MenuItem
      {...attributes}
      key="1"
      style={{
        backgroundColor: isActive ? '#e8efff' : hover ? '#EEEEEE' : 'unset',
      }}
      icon={<IconBtn className="Tripdocs-add_link" style={{ fontSize: 16, paddingRight: 10 }}></IconBtn>}
      onMouseEnter={e => {
        setHover(true);
      }}
      onMouseLeave={e => {
        setHover(false);
      }}
      onMouseDown={(event: any) => {
        event.preventDefault();
        if (selection && ReactEditor.hasRange(editor, selection) && min(selection.anchor.path[0], selection.focus.path[0]) !== 0) {
          if (isActive) return unwrapEditLink(editor);

          if (!isSameLineSelection(editor.selection)) {
            return;
          }

          insertEditLink(editor, '', sel);
        }
      }}
    >
      链接
    </MenuItem>
  );
};

const min = (a: any, b: any) => {
  return a > b ? b : a;
};

function CancelButton(props: any) {
  const { onClick } = props;
  return (
    <div className="link-modify-delete" onClick={() => onClick && onClick()}>
      <Tooltip title={f('cancelLink')}>
        <IconBtn className="Tripdocs-fdelete_link"></IconBtn>
      </Tooltip>
    </div>
  );
}

function InputRow(props: any) {
  const { txt, placeholder, value, callback, editor, autoFocus, trim } = props;

  const inputRef = useRef();

  useEffect(() => {
    if (autoFocus) {
      ReactEditor.blur(editor);
      setTimeout(() => {
        inputRef && inputRef.current && (inputRef.current as HTMLElement).focus();
      }, 100);
    }
  }, []);

  return (
    <div className="row">
      <span className="txt">{txt}</span>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        className={cx(
          'input',
          css`
            &,
            &:focus,
            &:hover {
              ${value.length === 0 ? `box-shadow: 0 0 0 2px rgba(255, 77, 79, .2); border-color: #ff4d4f;` : null}
            }
          `
        )}
        value={value}
        onChange={e => {
          if (trim) {
            callback(e.target.value?.trim());
          } else {
            callback(e.target.value);
          }
        }}
      />
    </div>
  );
}

function Hint(props: any) {
  const { show, text } = props;
  return (
    <div className="row" style={{ margin: 0, fontSize: '12px' }}>
      <span className="txt"></span>
      <span style={{ color: show ? '#ff4d4f' : null, visibility: show ? 'visible' : 'hidden', marginLeft: '-6px' }}>{text}</span>
    </div>
  );
}

function VisitButton(props: any) {
  const { onClick } = props;
  return (
    <div className="link-modify-edit" onClick={() => onClick && onClick()}>
      <Tooltip title={f('visitLink')}>
        <IconBtn className="Tripdocs-upper_right"></IconBtn>
      </Tooltip>
    </div>
  );
}

function EditButton(props: any) {
  const { onClick } = props;
  return (
    <div className="link-modify-edit" onClick={() => onClick && onClick()}>
      <Tooltip title={f('editLink')}>
        <IconBtn className="Tripdocs-edit"></IconBtn>
      </Tooltip>
    </div>
  );
}
