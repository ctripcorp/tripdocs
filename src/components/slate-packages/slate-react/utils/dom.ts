




import DOMNode = globalThis.Node;
import DOMComment = globalThis.Comment;
import DOMElement = globalThis.Element;
import DOMText = globalThis.Text;
import DOMRange = globalThis.Range;
import DOMSelection = globalThis.Selection;
import DOMStaticRange = globalThis.StaticRange;

export { DOMNode, DOMComment, DOMElement, DOMText, DOMRange, DOMSelection, DOMStaticRange };

declare global {
  interface Window {
    Selection: typeof Selection['constructor'];
    DataTransfer: typeof DataTransfer['constructor'];
    Node: typeof Node['constructor'];
  }
}

export type DOMPoint = [Node, number];



export const getDefaultView = (value: any): Window | null => {
  return (value && value.ownerDocument && value.ownerDocument.defaultView) || null;
};



export const isDOMComment = (value: any): value is DOMComment => {
  return isDOMNode(value) && value.nodeType === 8;
};



export const isDOMElement = (value: any): value is DOMElement => {
  return isDOMNode(value) && value.nodeType === 1;
};



export const isDOMNode = (value: any): value is DOMNode => {
  const window = getDefaultView(value);
  return !!window && value instanceof window.Node;
};



export const isDOMSelection = (value: any): value is DOMSelection => {
  const window = value && value.anchorNode && getDefaultView(value.anchorNode);
  return !!window && value instanceof window.Selection;
};



export const isDOMText = (value: any): value is DOMText => {
  return isDOMNode(value) && value.nodeType === 3;
};



export const isPlainTextOnlyPaste = (event: ClipboardEvent) => {
  return (
    event.clipboardData &&
    event.clipboardData.getData('text/plain') !== '' &&
    event.clipboardData.types.length === 1
  );
};



export const normalizeDOMPoint = (domPoint: DOMPoint): DOMPoint => {
  let [node, offset] = domPoint;

  
  
  if (isDOMElement(node) && node.childNodes.length) {
    let isLast = offset === node.childNodes.length;
    let index = isLast ? offset - 1 : offset;
    [node, index] = getEditableChildAndIndex(node, index, isLast ? 'backward' : 'forward');
    
    isLast = index < offset;

    
    
    while (isDOMElement(node) && node.childNodes.length) {
      const i = isLast ? node.childNodes.length - 1 : 0;
      node = getEditableChild(node, i, isLast ? 'backward' : 'forward');
    }

    
    offset = isLast && node.textContent != null ? node.textContent.length : 0;
  }

  
  return [node, offset];
};



export const hasShadowRoot = () => {
  return !!(window.document.activeElement && window.document.activeElement.shadowRoot);
};



export const getEditableChildAndIndex = (
  parent: DOMElement,
  index: number,
  direction: 'forward' | 'backward'
): [DOMNode, number] => {
  const { childNodes } = parent;
  let child = childNodes[index];
  let i = index;
  let triedForward = false;
  let triedBackward = false;

  
  
  while (
    isDOMComment(child) ||
    (isDOMElement(child) && child.childNodes.length === 0) ||
    (isDOMElement(child) && child.getAttribute('contenteditable') === 'false')
  ) {
    if (triedForward && triedBackward) {
      break;
    }

    if (i >= childNodes.length) {
      triedForward = true;
      i = index - 1;
      direction = 'backward';
      continue;
    }

    if (i < 0) {
      triedBackward = true;
      i = index + 1;
      direction = 'forward';
      continue;
    }

    child = childNodes[i];
    index = i;
    i += direction === 'forward' ? 1 : -1;
  }

  return [child, index];
};



export const getEditableChild = (
  parent: DOMElement,
  index: number,
  direction: 'forward' | 'backward'
): DOMNode => {
  const [child] = getEditableChildAndIndex(parent, index, direction);
  return child;
};



export const getPlainText = (domNode: DOMNode) => {
  let text = '';

  if (isDOMText(domNode) && domNode.nodeValue) {
    return domNode.nodeValue;
  }

  if (isDOMElement(domNode)) {
    for (const childNode of Array.from(domNode.childNodes)) {
      text += getPlainText(childNode);
    }

    const display = getComputedStyle(domNode).getPropertyValue('display');

    if (display === 'block' || display === 'list' || domNode.tagName === 'BR') {
      text += '\n';
    }
  }

  return text;
};


const catchSlateFragment = /data-slate-fragment="(.+?)"/m;
export const getSlateFragmentAttribute = (dataTransfer: DataTransfer): string | void => {
  const htmlData = dataTransfer.getData('text/html');
  const [, fragment] = htmlData.match(catchSlateFragment) || [];
  return fragment;
};


export const getClipboardData = (dataTransfer: DataTransfer): DataTransfer => {
  if (!dataTransfer.getData('application/x-slate-fragment')) {
    const fragment = getSlateFragmentAttribute(dataTransfer);
    if (fragment) {
      const clipboardData = new DataTransfer();
      dataTransfer.types.forEach(type => {
        clipboardData.setData(type, dataTransfer.getData(type));
      });
      clipboardData.setData('application/x-slate-fragment', fragment);
      return clipboardData;
    }
  }
  return dataTransfer;
};
