import { Editor, Operation } from '@src/components/slate-packages/slate';
import * as Y from 'yjs';
import translateArrayEvent from './arrayEvent';
import translateMapEvent from './mapEvent';
import translateTextEvent from './textEvent';


export function translateYjsEvent(
  editor: Editor,
  event: Y.YEvent
): Operation[] {
  if (event instanceof Y.YArrayEvent) {
    return translateArrayEvent(editor, event);
  }

  if (event instanceof Y.YMapEvent) {
    return translateMapEvent(editor, event);
  }

  if (event instanceof Y.YTextEvent) {
    return translateTextEvent(editor, event);
  }

  throw new Error('Unsupported yjs event');
}


export function applyYjsEvents(editor: Editor, events: Y.YEvent[]): void {
  Editor.withoutNormalizing(editor, () => {
    events.forEach((event) =>
      translateYjsEvent(editor, event).forEach(editor.apply)
    );
  });
}
