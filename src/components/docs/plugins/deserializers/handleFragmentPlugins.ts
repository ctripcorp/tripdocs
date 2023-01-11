import { Editor, Node } from '@src/components/slate-packages/slate';
import { createRandomId, createUUID } from '@src/utils/randomId';
import { cloneDeep } from 'lodash';
import { ELTYPE, INLINE_TYPES } from '../config';

export const reorderOL = (fragment: any) => {
  if (!fragment) return [];
  console.log('reorderOL', fragment);
  const result = [];
  const testNull = (str: string) => /null\d*/.test(str);
  const remainingStr = (str: string) => str.replace(/^null/, '');
  const getRandomId = () => 'numbered-list=' + createUUID();
  let prevId = null;
  let prevIsOLLIST = false;
  for (let i = 0; i < fragment.length; i++) {
    let curItem = { ...fragment[i] };
    if (curItem?.type === ELTYPE.OLLIST && testNull(curItem?.id)) {
      if (prevIsOLLIST && prevId) {
        curItem = { ...curItem, id: prevId };
      } else {
        const newId = getRandomId() + remainingStr(curItem.id);
        curItem = { ...curItem, id: newId };
        prevId = newId;
      }
      prevIsOLLIST = true;
    } else {
      prevIsOLLIST = false;
    }
    result.push(curItem);
  }
  return result;
};

export const trimEmptyText = (fragment: any) => {
  console.log('trimEmptyText', fragment);

  return fragment
    .filter(item => !!(typeof item === 'string' ? item.trim() : item))
    .map((item: any) => {
      if (item.children && item.children.length === 1 && item.children[0].text && /^(\r\n|\n|\r|\t)+$/.test(item.children[0].text)) {
        return { ...item, children: [{ text: '' }] };
      }
      return item;
    });
};

export const handleLinkInText = (text: string) => {
  const regex = new RegExp(/(?:http|ftp|https):\/\/(?:[\w_-]+(?:(?:\.[\w_-]+)+))(?:[\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/);
  const regexNotEscaped = new RegExp(/(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/g);
  if (regex.test(text)) {
    const textArr = text.split(regex);
    const linkArr = Array.from(text.matchAll(regexNotEscaped), m => m[0]);
    if (textArr.length === linkArr.length + 1) {
      const resArr = [];
      let i = 0;
      for (; i < linkArr.length; i++) {
        resArr.push({ text: textArr[i] });
        resArr.push({
          type: ELTYPE.LINK,
          href: linkArr[i],
          children: [{ text: linkArr[i] }],
        });
      }
      resArr.push({ text: textArr[i] });

      return resArr;
    } else {
      return text;
    }
  } else {
    return text;
  }
};

export const normalizeInlineNodeAtRoot = (fragment: any) => {
  console.log('normalizeInlineNodeAtRoot', fragment);

  if (fragment.length === 1 && fragment[0].text) {
    return fragment;
  }
  const result = [];
  for (let i = 0; i < fragment.length; i++) {
    let curItem = { ...fragment[i] };
    if (curItem.type === undefined && curItem.text === '') {
      continue;
    }
    if (curItem && [undefined, ...INLINE_TYPES].includes(curItem.type)) {
      if (i > 0 && result[result.length - 1].type === ELTYPE.PARAGRAPH) {
        const previousNode = result[result.length - 1];
        previousNode.children.push({ ...curItem });
        continue;
      } else {
        curItem = { type: ELTYPE.PARAGRAPH, children: [{ ...curItem }] };
        result.push(curItem);
      }
    } else {
      result.push(curItem);
    }
  }
  return result;
};
export const normalizeLi = fragment => {
  console.log('normalizeLi', fragment);

  let result = cloneDeep(fragment);
  let newArr = [];
  for (let i = 0; i < result?.length; i++) {
    const el = result[i];
    if (el.type === ELTYPE.OLLIST || el.type === ELTYPE.ULLIST) {
      if (el.children && el.children[0]) {
        if (el.children[0]?.type === ELTYPE.PARAGRAPH) {
          el.children = el.children[0]?.children || [{ text: '' }];
          newArr.push(el);
        } else {
          newArr.push(el);
        }
      } else {
        el.children = [{ text: '' }];
        newArr.push(el);
      }
    } else {
      newArr.push(el);
    }
  }
  return newArr;
};

export const normalizeParagraph = fragment => {
  console.log('normalizeParagraph', fragment);

  let result = cloneDeep(fragment);
  let newArr = [];
  for (let i = 0; i < result.length; i++) {
    const el = result[i];
    if (el.type === ELTYPE.PARAGRAPH) {
      if (el.children && el.children[0]) {
        let newP = cloneDeep(el);
        newP.children = [];

        for (let index = 0; index < el.children.length; index++) {
          const element = el.children[index];

          if (element?.type === ELTYPE.PARAGRAPH) {
            if (newP.children.length) {
              newArr.push(newP);
              newP = cloneDeep(el);
              newP.children = [];
            }
            newArr.push(element);
          } else {
            newP.children.push(element);
          }
        }
        if (newP.children.length) {
          newArr.push(newP);
        }
      } else {
        el.children = [{ text: '' }];
        newArr.push(el);
      }
    } else {
      newArr.push(el);
    }
  }
  return newArr;
};

export const normalizeInlineLink = fragment => {
  console.log('normalizeLink', fragment);

  let result = cloneDeep(fragment);

  const _normalizeLink = (node: any) => {
    if (Array.isArray(node)) {
      node.forEach(item => _normalizeLink(item));
    }
    if (
      !node ||
      !node.children ||
      !node.children.length ||
      node.text ||
      node.children.every(item => item.text || [ELTYPE.LINK, ELTYPE.MENTION].includes(item.type))
    )
      return;

    const children: any[] = node.children;
    let linkIndexArr = [];

    children.forEach((item, index) => {
      console.log('item', item);
      if (item?.type === ELTYPE.LINK) {
        linkIndexArr.push(index);
      }
    });

    const len = linkIndexArr.length;
    if (len > 0) {
      for (let i = len - 1; i >= 0; i--) {
        const linkIndex = linkIndexArr[i];
        const hasLink = linkIndex > 0;
        if (hasLink) {
          console.log('[normalizeLink] hasLink', node, children[linkIndex - 1], children[linkIndex], linkIndex);
          children[linkIndex - 1] = children[linkIndex - 1]?.children
            ? { ...children[linkIndex - 1], children: [...children[linkIndex - 1]?.children, children[linkIndex]] }
            : { ...children[linkIndex - 1], children: [children[linkIndex]] };
          children.splice(linkIndex, 1);
        }
      }
      return;
    }
    _normalizeLink(children);
  };
  _normalizeLink(result);
  console.log('[normalizeLink] result ', result);
  return result;
};

export const resetOL = frag => {
  const res = [];
  for (let i = 0; i < frag.length; i++) {
    const curItem = { ...frag[i] };
    if (curItem?.type === ELTYPE.OLLIST) {
      res.push({ ...curItem, id: 'null' });
    } else {
      res.push(curItem);
    }
  }
  return res;
};

export const updateIdentities = decodedStr => {
  if (typeof decodedStr !== 'string') return '';
  const newStr = decodedStr
    .replace(/"anchorId":".*?"/g, `"anchorId":"${createRandomId()}"`)
    .replace(/"id":".*?"/g, `"id":"${createUUID()}"`)
    .replace(/"elId":".*?"/g, `"elId":"${createUUID()}"`);
  return newStr;
};

export const unwrapSingleCell = (fragment: any) => {
  let res = [];
  if (
    fragment.length === 1 &&
    fragment[0].type === ELTYPE.CARD &&
    fragment[0].children.length === 1 &&
    fragment[0].children[0].type === ELTYPE.TABLE &&
    fragment[0].children[0].children.length === 1 &&
    fragment[0].children[0].children[0].type === ELTYPE.TABLE_ROW &&
    fragment[0].children[0].children[0].children.length === 1 &&
    fragment[0].children[0].children[0].children[0].type === ELTYPE.TABLE_CELL &&
    fragment[0].children[0].children[0].children[0].children.length > 0
  ) {
    res = fragment[0].children[0].children[0].children[0].children;
    return res;
  }
  return fragment;
};

export const unwrapCardElement = (fragment: any, editor: any) => {
  const [isInCard] = Editor.nodes(editor, { match: (n: any) => n.type === ELTYPE.CARD });

  const retrieveText = frag => {
    let res = [];
    const toText = node => {
      if (!node) return { text: '' };
      if (node.type === ELTYPE.INLINEIMAGE) {
        res.push(node);
      }
      if (node.children) {
        node.children.forEach(toText);
      } else if (node.text) {
        res.push({ text: node.text });
      }
    };
    toText(frag);
    return res;
  };
  if (isInCard) {
    if (fragment && fragment.length > 0) {
      return fragment.map(item => (item.type === ELTYPE.CARD ? { type: ELTYPE.PARAGRAPH, children: retrieveText(item) } : item));
    }
  }
  return fragment;
};
