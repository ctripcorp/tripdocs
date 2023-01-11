import { Editor, Element } from '@src/components/slate-packages/slate';
import { delChildrenNotAllowComponent, ELEMENTNODE, isNodeChildrenIsTargetType } from '@src/utils/normalize';
import { ELTYPE } from '../config';

export function normalizeFile(editor: Editor, entry: [ELEMENTNODE, number[]]): boolean {
  const [node, path] = entry;

  const { type, children } = node;
  if (Element.isElement(node) && type === ELTYPE.FILE) {
    const componentsOk = [undefined];

    if (!isNodeChildrenIsTargetType(children, [componentsOk])) {
      delChildrenNotAllowComponent(editor, children, componentsOk, path);
      return true;
    }
  }
  return false;
}
