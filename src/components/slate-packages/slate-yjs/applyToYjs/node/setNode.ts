import { SetNodeOperation } from '@src/components/slate-packages/slate';
import { SharedType, SyncElement } from '../../model';
import { getTarget } from '../../path';


export default function setNode(
  doc: SharedType,
  op: SetNodeOperation
): SharedType {
  const node = getTarget(doc, op.path) as SyncElement;

  Object.entries(op.newProperties).forEach(([key, value]) => {
    if (key === 'children' || key === 'text') {
      throw new Error(`Cannot set the "${key}" property of nodes!`);
    }

    node.set(key, value);
  });

  Object.entries(op.properties).forEach(([key]) => {
    
    if (!op.newProperties.hasOwnProperty(key)) {
      node.delete(key);
    }
  });

  return doc;
}
