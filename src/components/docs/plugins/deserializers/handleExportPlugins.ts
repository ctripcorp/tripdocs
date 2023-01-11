import { Editor, Transforms, Range } from '@src/components/slate-packages/slate';
import { ELTYPE } from '../config';
import { insertOl } from '../OLULList/OlList';

export function htmlExportFirstTablevel(fragment: any[], editor: any, firstElement: any, path: any[]) {
  if (!fragment.length) return;

  console.log('[insertFragment]', JSON.stringify(fragment, null, 4));

  if (Number.isInteger(firstElement.tabLevel) && firstElement.tabLevel > 0) {
    Transforms.insertFragment(editor, fragment);
    Transforms.setNodes(editor, { tabLevel: firstElement.tabLevel } as Partial<any>, {
      at: [path[0]],
    });
  } else {
    Transforms.insertFragment(editor, fragment);
  }
}

export function htmlExportFirstHeadingAndList(fragment: any[], editor: any, node: any, path: any[], lastPath: number) {
  if (!fragment.length) return;

  if (Range.isCollapsed(editor.selection) && node.text === '') {
    let [nodePre, pathPre]: any = Editor.previous(editor, {
      at: [path[0]],
    });

    console.log('[previous node]', nodePre, pathPre);
    if ([ELTYPE.CARD].includes(nodePre.type)) {
    } else {
      Transforms.removeNodes(editor, { at: path.slice(0, -1) });
    }

    Transforms.insertNodes(editor, fragment, { select: true });
  } else {
    Transforms.insertNodes(editor, fragment, { select: true });
  }
}

export function htmlExportListAndText(fragment: any[], editor: any, path1: number) {
  if (!fragment.length) return;
  console.log('[htmlExportListAndText]', fragment[fragment.length - 1].children);
  let rel = {
    anchor: {
      path: [path1 + fragment.length - 1, 0],
      offset: Array.isArray(fragment[fragment.length - 1].children) ? fragment[fragment.length - 1].children[0].text.length : 0,
    },
    focus: {
      path: [path1 + fragment.length - 1, 0],
      offset: Array.isArray(fragment[fragment.length - 1].children) ? fragment[fragment.length - 1].children[0].text.length : 0,
    },
  };

  for (let index = 0; index < 2; index++) {
    const el = fragment[index];
    if (index === 0) {
      Transforms.insertText(editor, el.text || el.children[0].text);
    } else {
      console.log('allIsText', el, editor.selection, index);
      insertOl(editor, fragment.slice(1), { isCopyList: true });
    }
  }
  Transforms.setSelection(editor, rel);
}
