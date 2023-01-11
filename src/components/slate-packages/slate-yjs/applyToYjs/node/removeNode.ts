import { RemoveNodeOperation } from '@src/components/slate-packages/slate';
import invariant from 'tiny-invariant';
import { SharedType, SyncNode } from '../../model';
import { getParent } from '../../path';


export default function removeNode(
  doc: SharedType,
  op: RemoveNodeOperation
): SharedType {
  const [parent, index] = getParent(doc, op.path);

  if (SyncNode.getText(parent) !== undefined) {
    throw new TypeError("Can't remove node from text node");
  }

  const children = SyncNode.getChildren(parent);
  invariant(children, 'Parent should have children');
  children.delete(index);

  return doc;
}
