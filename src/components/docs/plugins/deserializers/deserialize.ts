import { Editor, Node } from '@src/components/slate-packages/slate';
import { jsx } from '@src/components/slate-packages/slate-hyperscript';
import { v4 as anchorId } from 'uuid';
import { createCard } from '../Card';
import { defaultLanguage } from '../CodeBlock/renderCodeBlock';
import { ELTYPE, HEADING_TYPES, INLINE_TYPES, LIST_TYPES } from '../config';
import { pasteTableForHTML } from '../table/pasteTable';
import { ELEMENT_TAGS, TEXT_TAGS } from './deserializeTags';
import $ from 'jquery';
import isUrl from 'is-url';
import { createUUID } from '@src/utils/randomId';
import { isImageBase64 } from '../InlineImage/utils';

function lJsx(type: any, attrs: Object, child: any): any {
  const nodeText = jsx(type, attrs, child);
  return nodeText;
}

export function allIsText(fragment: any[], id?) {
  return fragment.every(el => {
    if (id) el.id = id;
    return [ELTYPE.PARAGRAPH, ...HEADING_TYPES, ...LIST_TYPES, undefined].includes(el.type);
  });
}

const getTargetUser = (el: any) => {
  const ret = el.getAttribute('data-target-user') || '';
  return ret;
};

export const hasChildrenWithLink = (children: any) => {
  return Array.from(children).some((child: any) => child.nodeName === 'A' || (child.getAttribute && child.getAttribute('data-link') === 'true'));
};

export const deserializeHTMLToText = (el: any): any => {
  const { nodeType: elNodeType, nodeName: elNodeName } = el;

  if (elNodeType === 3) {
    return el.textContent;
  } else if (elNodeType !== 1) {
    return null;
  } else if (elNodeName === 'BR') {
    return '\n';
  }
  if (Array.isArray(el.children)) {
    return Array.from(el.children).map(deserializeHTMLToText).flat();
  }
  return el.innerText === '\n' ? '' : el.innerText?.replace('\n', '');
};

export const isInTable = editor => {
  let ret = null;
  if (editor.selection) {
    ret = Editor.above(editor, {
      match: (n: any) => n.type === ELTYPE.TABLE,
    });
  }
  return ret;
};

type DeserializeOptions = {
  isInTable?: boolean;
  docWidth?: number;
};

export const deserialize = (el: HTMLElement, fragId?: any, imageTags?: any, options?: DeserializeOptions): null | string | Node | Node[] => {
  const { nodeType: elNodeType, nodeName: elNodeName } = el;
  const { isInTable = false, docWidth = 610 } = options || {};

  const whitespaceCharsRegex = new RegExp(/[\t\r\n\f]+/, 'g');
  console.log('【deserializing】', el, elNodeName, elNodeType, el.textContent && el.textContent.replaceAll(/^[\t\r\n\f]+|[\t\r\n\f]+$/g, ''));

  if (elNodeType === 3) {
    return el.textContent && el.textContent.replaceAll(/^[\t\r\n\f]+|[\t\r\n\f]+$/g, '');
  } else if (elNodeType !== 1) {
    return null;
  } else if (elNodeName === 'BR') {
    return '\n';
  }

  const targetUser = getTargetUser(el);

  if (targetUser) {
    return [
      { text: '' },
      lJsx(
        'element',
        {
          type: ELTYPE.MENTION,
          targetUser: JSON.parse(targetUser),
        },
        [{ text: '' }]
      ),
      { text: '' },
    ];
  }

  let curEl = el;
  let preWrapSpanFlag = true;

  if (elNodeName === 'PRE') {
    for (let i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i] && el.childNodes[i].nodeName === 'CODE') {
        curEl = el.childNodes[i] as HTMLElement;
        preWrapSpanFlag = false;
      }
    }
  }

  if (elNodeName === 'P' && el.childNodes[0] && el.childNodes[0].nodeName === 'IMG') {
    curEl = el.childNodes[0] as HTMLElement;
  }

  const { nodeName } = curEl;

  if (elNodeName === 'TABLE') {
    console.log('[isInTable]', isInTable);
    if (isInTable) {
      return deserializeHTMLToText(curEl);
    } else {
      const table = pasteTableForHTML(curEl, deserialize, fragId, imageTags, docWidth);
      return table;
    }
  }

  let children: any = Array.from(curEl.childNodes)
    .map((item: any) => {
      return deserialize(item, fragId, imageTags, { isInTable: isInTable, docWidth: docWidth });
    })
    .filter(item => {
      return !!item;
    })
    .flat();

  if (TEXT_TAGS[el.nodeName] && Array.isArray(children[0])) {
    children = children[0];
  }
  if (elNodeName === 'OL' || elNodeName === 'UL') {
    return [...children];
  }

  const hasLink = hasChildrenWithLink(curEl.childNodes);

  if (nodeName === 'BODY' && !hasLink) {
    let fragmentChild: any[] = children;
    if (Array.isArray(children)) {
      fragmentChild = fragmentChild.filter(item => {
        if (typeof item === 'string' && item.match(/^[\t\r\n\f]+$/)) {
          return false;
        }
        return true;
      });
    }
    return lJsx('fragment', {}, fragmentChild);
  }

  if (nodeName === 'DIV' && $(curEl).hasClass('ant-alert') && !$(curEl).hasClass('alert-card-icon-container')) {
    console.log('[parent]', curEl, $(curEl).data('alter-type'));

    let alertType = $(curEl).data('alter-type') || 'success';
    let alert_message = $(curEl).find('.ant-alert-message').text() || '';
    let alert_description = $(curEl).find('.ant-alert-description').text() || '';
    let cardCenter = {
      type: ELTYPE.ALERTS,
      alertType: alertType,
      children: [
        {
          type: ELTYPE.ALERTMESSAGE,
          children: [{ text: alert_message }],
        },
        {
          type: ELTYPE.ALERTDESCRIPTION,
          children: [{ text: alert_description }],
        },
      ],
    };
    const element = createCard(cardCenter);
    return lJsx('element', element, element.children);
  }

  if ((nodeName === 'CODE' && children.length > 1) || (nodeName === 'PRE' && preWrapSpanFlag)) {
    let codeTextContent = '';
    let codeLanguage = defaultLanguage;
    const codeblockId = encodeURI(anchorId());

    curEl.childNodes.forEach((item: any, index: any) => {
      if (index === 0 && item.firstChild && $(item?.firstChild).hasClass('code-block-language-bar')) {
        const lang = item.textContent.toLowerCase();
        codeLanguage = lang;
      } else if (item) {
        codeTextContent += item.textContent;
      }
    });
    codeTextContent = codeTextContent.trimEnd();
    const element = {
      type: ELTYPE.CODE_BLOCK,
      children: [{ text: codeTextContent }],
      code: codeTextContent,
      'data-codeblock-id': codeblockId,
      'data-card-value': encodeURI(`{"data": { "mode": "${codeLanguage}", "code": "${encodeURI(codeTextContent)}", "id": "${codeblockId}" }}`),
    };
    return lJsx('element', element, element.children);
  }

  if (nodeName === 'IMG' || nodeName === 'V:IMAGEDATA') {
    console.log('imgplugins withHtml insertData ', curEl.getAttribute('src'));
    if (curEl.getAttribute('src')?.match(/file:\/\//)) {
      const src = el.getAttribute('src');
      if (imageTags && imageTags[src]) {
        el.setAttribute('src', imageTags[src]);
      }
      const attrs = ELEMENT_TAGS[nodeName]({ el });
      const imgEl = {
        ...attrs,
        children: [{ text: '' }],
        id: createUUID(),
      };
      const card = nodeName === 'V:IMAGEDATA' ? imgEl : createParagraph(imgEl);
      console.log('imgplugins withHtml insertData card', card, attrs);
      return jsx('element', card, card.children);
    }

    if (isImageBase64(curEl.getAttribute('src')) || curEl.getAttribute('src').indexOf('http') === 0) {
      let imageContainer = curEl.parentElement.parentElement;
      let width = imageContainer.style.width;
      let height = imageContainer.style.height;
      let textAlign = curEl?.parentElement?.parentElement?.parentElement?.parentElement?.style?.textAlign || 'center';
      const element = {
        align: textAlign,
        width: width,
        height: height,
        type: ELTYPE.INLINEIMAGE,
        children: [{ text: '' }],
        id: createUUID(),
        linkSource: curEl.getAttribute('src'),
      };

      const niu = createParagraph(element);

      const ell = lJsx('element', niu, niu.children);
      console.log('======ell======', ell);
      return ell;
    } else {
      console.error('图片粘贴失败');
      return lJsx('element', { type: ELTYPE.PARAGRAPH }, [{ text: '' }]);
    }
  }

  if (
    (nodeName === 'SPAN' && el.getAttribute('class') === 'card_pre') ||
    (nodeName === 'SPAN' && el.getAttribute('class') === 'card_suf') ||
    (nodeName === 'SPAN' && el.getAttribute('class') === 'ant-select-selection-item') ||
    (nodeName === 'SPAN' && el.getAttribute('data-is-caret')) ||
    (nodeName === 'DIV' && el.getAttribute('class')?.startsWith('Tripdocs-')) ||
    el.getAttribute('data-ignore-paste')
  ) {
    console.log('不应该被拷贝的内容', el);
    return null;
  }

  if (nodeName === 'SPAN') {
    if (isUrl(el.innerText)) {
      return lJsx('element', { type: ELTYPE.LINK, href: el.innerText }, [{ text: el.innerText }]);
    }

    if (el.getAttribute('data-fontcolor')) {
      return children.map((child: any) => {
        return lJsx('text', { fontColor: el.getAttribute('data-fontcolor') }, child);
      });
    }
    if (el.getAttribute('data-backgroundcolor')) {
      return children.map((child: any) => {
        return lJsx('text', { backgroundColor: el.getAttribute('data-backgroundcolor') }, child);
      });
    }

    const searchClosestNonSpanParent = el => {
      if (el?.nodeName !== 'SPAN') {
        return el;
      }
      return searchClosestNonSpanParent(el.parentNode);
    };

    const closestNonSpanParent = searchClosestNonSpanParent(curEl);
    if (TEXT_TAGS[closestNonSpanParent?.nodeName]) {
      const attrs = TEXT_TAGS[closestNonSpanParent?.nodeName](el);
      console.log('[deserializing TEXT_TAGS]', { el }, children);
      console.dir(el);
      const result = children.map((child: any) => {
        if (Array.isArray(child?.children)) {
          return child?.children?.map((item: any) => {
            if (INLINE_TYPES.includes(item?.type) || (typeof item?.type === 'undefined' && typeof item?.text === 'string')) {
              return item;
            }
          });
        }

        return lJsx('text', attrs, child && typeof child === 'string' ? child.replaceAll(whitespaceCharsRegex, '') : el.innerText);
      });
      return result;
    }

    return children.map((leaf: any) => {
      if (leaf && typeof leaf === 'object' && typeof leaf.text !== 'string') {
        return lJsx('element', leaf, leaf.children);
      }

      return leaf;
    });
  }

  if (ELEMENT_TAGS[nodeName]) {
    const attrs = ELEMENT_TAGS[nodeName]({ el, children, fragId });
    let emptyRegex = new RegExp(/[\t\r\f]+/, 'g');
    console.log(
      '[deserializing ELEMENT_TAGS]',
      attrs,
      curEl,
      children.map(child => encodeURIComponent(child && typeof child === 'string' && child.replaceAll(emptyRegex, '')))
    );

    if (Array.isArray(children) && children.length === 0) {
      return lJsx('element', attrs, attrs.children ? attrs.children : [{ text: deserializeHTMLToText(el) }]);
    }

    const newChildren =
      attrs && attrs.children
        ? attrs.children
        : children.map(child => (child && typeof child === 'string' ? child.replaceAll(emptyRegex, '') : child));

    const filteredNewChildren = (newChildren && newChildren.filter(Boolean)) || [{ text: '' }];
    return lJsx('element', attrs, filteredNewChildren);
  }

  if (TEXT_TAGS[nodeName]) {
    console.log('[TEXT_TAGS]', children);

    if (children.some(child => child && typeof child.type !== 'undefined')) {
      const attrs = TEXT_TAGS[nodeName] ? TEXT_TAGS[nodeName](el) : {};
      return children.map((leaf: any) => {
        if (typeof leaf === 'object' && typeof leaf.text !== 'string') {
          return lJsx('element', leaf, leaf.children);
        }

        return lJsx('text', attrs, leaf);
      });
    }

    return children.map((child: any) => {
      if (typeof child === 'string') {
        const attrs = TEXT_TAGS[nodeName] ? TEXT_TAGS[nodeName](el) : {};
        return lJsx('text', attrs, child);
      }
      if (child?.type === undefined && child?.text) {
        return child;
      }
      if (!child) {
        return createParagraph('');
      }

      return deserialize(child, fragId, imageTags, { isInTable: isInTable, docWidth: docWidth });
    });
  }

  if (['DIV', 'SPAN', 'TD', 'TH', 'FONT', 'V:SHAPE', 'O:WRAPBLOCK'].includes(elNodeName)) {
    return children;
  }

  return null;
};

export function createParagraph(element: any) {
  return {
    type: ELTYPE.PARAGRAPH,
    children: element ? [{ text: '' }, element, { text: '' }] : [{ text: '' }],
  };
}
