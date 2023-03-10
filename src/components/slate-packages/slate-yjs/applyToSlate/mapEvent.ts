import { Editor, Node, NodeOperation } from '@src/components/slate-packages/slate';
import * as Y from 'yjs';
import { SyncElement } from '../model';
import { toSlatePath } from '../utils/convert';


export default function translateMapEvent(
  editor: Editor,
  event: Y.YMapEvent<unknown>
): NodeOperation[] {
  const targetPath = toSlatePath(event.path);
  const targetSyncElement = event.target as SyncElement;
  const targetElement = Node.get(editor, targetPath);

  const keyChanges = Array.from(event.changes.keys.entries());
  const newProperties = Object.fromEntries(
    keyChanges.map(([key, info]) => [
      key,
      info.action === 'delete' ? null : targetSyncElement.get(key),
    ])
  );

  const properties = Object.fromEntries(
    keyChanges.map(([key]) => [key, targetElement[key]])
  );

  return [{ type: 'set_node', newProperties, properties, path: targetPath }];
}
