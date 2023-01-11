import { Editor, Operation } from '@src/components/slate-packages/slate';
import { getCache } from '@src/utils/cacheUtils';
import invariant from 'tiny-invariant';
import * as Y from 'yjs';
import { applyYjsEvents } from '../applyToSlate';
import applySlateOps from '../applyToYjs';
import { SharedType, slateYjsOriginSymbol } from '../model';
import { toSlateDoc } from '../utils';

const IS_REMOTE: WeakSet<Editor> = new WeakSet();
const LOCAL_OPERATIONS: WeakMap<Editor, Set<Operation>> = new WeakMap();
const SHARED_TYPES: WeakMap<Editor, SharedType> = new WeakMap();

export interface YjsEditor extends Editor {
  sharedType: SharedType;

  destroy: () => void;
}

export const YjsEditor = {
  
  synchronizeValue: (e: YjsEditor): void => {
    Editor.withoutNormalizing(e, () => {
      e.children = toSlateDoc(e.sharedType);
      e.onChange();
    });
  },

  
  sharedType: (editor: YjsEditor): SharedType => {
    const sharedType = SHARED_TYPES.get(editor);
    invariant(sharedType, 'YjsEditor without attached shared type');
    return sharedType;
  },

  
  isRemote: (editor: YjsEditor): boolean => {
    return IS_REMOTE.has(editor);
  },

  
  asRemote: (editor: YjsEditor, fn: () => void): void => {
    const wasRemote = YjsEditor.isRemote(editor);
    IS_REMOTE.add(editor);

    fn();

    if (!wasRemote) {
      IS_REMOTE.delete(editor);
    }
  },

  
  destroy: (editor: YjsEditor): void => {
    editor.destroy();
  },
};

function localOperations(editor: YjsEditor): Set<Operation> {
  const operations = LOCAL_OPERATIONS.get(editor);
  invariant(operations, 'YjsEditor without attached local operations');
  return operations;
}

function trackLocalOperations(editor: YjsEditor, operation: Operation): void {
  if (!YjsEditor.isRemote(editor)) {
    localOperations(editor).add(operation);
  }
}


function applyLocalOperations(editor: YjsEditor): void {
  const editorLocalOperations = localOperations(editor);

  applySlateOps(
    YjsEditor.sharedType(editor),
    Array.from(editorLocalOperations),
    slateYjsOriginSymbol
  );

  editorLocalOperations.clear();
}


function applyRemoteYjsEvents(editor: YjsEditor, events: Y.YEvent[]): void {
  Editor.withoutNormalizing(editor, () =>
    YjsEditor.asRemote(editor, () =>
      applyYjsEvents(
        editor,
        events.filter(
          (event) => event.transaction.origin !== slateYjsOriginSymbol
        )
      )
    )
  );
}

export function withYjs<T extends Editor>(
  editor: T,
  sharedType: SharedType,
  { synchronizeValue = true }: WithYjsOptions = {}
): T & YjsEditor {
  const e = editor as T & YjsEditor;

  e.sharedType = sharedType;
  SHARED_TYPES.set(editor, sharedType);
  LOCAL_OPERATIONS.set(editor, new Set());

  if (synchronizeValue) {
    setTimeout(() => YjsEditor.synchronizeValue(e), 0);
  }

  const applyEvents = (events: Y.YEvent[]) => applyRemoteYjsEvents(e, events);
  sharedType.observeDeep(applyEvents);

  const { apply, onChange, destroy } = e;
  e.apply = (op: Operation) => {
    trackLocalOperations(e, op);
    apply(op);
  };

  e.onChange = () => {
    applyLocalOperations(e);
    onChange();
  };

  e.destroy = () => {
    sharedType.unobserveDeep(applyEvents);
    if (destroy) {
      destroy();
    }
  };

  return e;
}

export type WithYjsOptions = {
  synchronizeValue?: boolean;
};
