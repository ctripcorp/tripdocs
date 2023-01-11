import { Editor, Element } from '@src/components/slate-packages/slate';
import { delChildrenNotAllowComponent, ELEMENTNODE, isNodeChildrenIsTargetType } from '@src/utils/normalize';
import { ELTYPE, HEADING_TYPES } from '../config';

export function normalizeTodoList(editor: Editor, entry: [ELEMENTNODE, number[]]): boolean {
  const [node, path] = entry;

  const { type, children } = node;
  if (Element.isElement(node) && type === ELTYPE.TODO_LIST) {
    const componentsOk = [undefined, ...HEADING_TYPES, ELTYPE.LINK, ELTYPE.MENTION, ELTYPE.INLINEIMAGE];

    if (!isNodeChildrenIsTargetType(children, [componentsOk])) {
      delChildrenNotAllowComponent(editor, children, componentsOk, path);
      return true;
    }
  }
  return false;
}
