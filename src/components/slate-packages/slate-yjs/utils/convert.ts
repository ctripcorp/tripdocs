import { Element, Node, Path, Text } from '@src/components/slate-packages/slate';
import * as Y from 'yjs';
import { SharedType, SyncElement } from '../model';


export function toSlateNode(element: SyncElement): Node {
  const text = SyncElement.getText(element);
  const children = SyncElement.getChildren(element);

  const node: Partial<Node> = {};
  if (text !== undefined) {
    (node as any).text = text.toString();
  }
  if (children !== undefined) {
    (node as any).children = children.map(toSlateNode);
  }

  Array.from(element.entries()).forEach(([key, value]) => {
    if (key !== 'children' && key !== 'text') {
      node[key] = value;
    }
  });

  return node as Node;
}


export function toSlateDoc(doc: SharedType): Node[] {
  return doc.map(toSlateNode);
}


export function toSyncElement(node: Node): SyncElement {
  const element: SyncElement = new Y.Map();

  if (Element.isElement(node)) {
    const childElements = node.children.map(toSyncElement);
    const childContainer = new Y.Array();
    childContainer.insert(0, childElements);
    element.set('children', childContainer);
  }

  if (Text.isText(node)) {
    const textElement = new Y.Text(node.text);
    element.set('text', textElement);
  }

  Object.entries(node).forEach(([key, value]) => {
    if (key !== 'children' && key !== 'text') {
      element.set(key, value);
    }
  });

  return element;
}


export function toSharedType(sharedType: SharedType, doc: Node[]): void {
  sharedType.insert(0, doc.map(toSyncElement));
}


export function toSlatePath(path: (string | number)[]): Path {
  return path.filter((node) => typeof node === 'number') as Path;
}
