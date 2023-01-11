import { Editor, Element, Path, Transforms } from '@src/components/slate-packages/slate';
import { delChildrenNotAllowComponent, ELEMENTNODE, isNodeChildrenIsTargetType } from '@src/utils/normalize';
import { ELTYPE } from '../config';

export function normalizeInlineImage(editor: Editor, entry: [ELEMENTNODE, number[]]): boolean {
  const [node, path] = entry;

  const { type, children } = node;
  if (Element.isElement(node) && type === ELTYPE.INLINEIMAGE) {
    const componentsOk = [undefined];

    if (!isNodeChildrenIsTargetType(children, [componentsOk])) {
      delChildrenNotAllowComponent(editor, children, componentsOk, path);
      return true;
    }
    const parentNodePath = path.slice(0, -1);
    if (Editor.hasPath(editor, parentNodePath)) {
      const end = Editor.end(editor, parentNodePath);
      const isEqual = Path.equals(path, end.path);
      if (isEqual) {
        const tPath = [...parentNodePath, path[path.length - 1] + 1];
        Transforms.insertNodes(editor, { text: '' }, { at: tPath });
      }
    }
  }
  return false;
}
