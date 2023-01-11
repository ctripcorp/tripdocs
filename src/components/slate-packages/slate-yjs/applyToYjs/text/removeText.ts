import { RemoveTextOperation } from '@src/components/slate-packages/slate';
import { SharedType, SyncElement } from '../../model';
import { getTarget } from '../../path';


export default function removeText(
  doc: SharedType,
  op: RemoveTextOperation
): SharedType {
  const node = getTarget(doc, op.path) as SyncElement;
  const nodeText = SyncElement.getText(node)!;
  nodeText.delete(op.offset, op.text.length);
  return doc;
}
