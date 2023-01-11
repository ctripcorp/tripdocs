import { InsertTextOperation } from '@src/components/slate-packages/slate';
import invariant from 'tiny-invariant';
import { SharedType, SyncElement } from '../../model';
import { getTarget } from '../../path';


export default function insertText(
  doc: SharedType,
  op: InsertTextOperation
): SharedType {
  const node = getTarget(doc, op.path) as SyncElement;
  const nodeText = SyncElement.getText(node);

  invariant(nodeText, 'Apply text operation to non text node');

  nodeText.insert(op.offset, op.text);
  return doc;
}
