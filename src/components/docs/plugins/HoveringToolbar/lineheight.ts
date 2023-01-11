import { Editor, Element as SlateElement, Transforms } from '@src/components/slate-packages/slate';
import { ELTYPE, TABBABLE_TYPES } from '../config';

export const isLineHeightActive = (editor: any, lineHeight: '1.75' | '1' | '1.15' | '1.5' | '2' | '2.5' | '3', selection: any) => {
  try {
    if (lineHeight === '1.75') {
      const [match] = Editor.nodes(editor, {
        at: selection,
        mode: 'highest',
        match: (n: any) => {
          if (n.lineHeight === '1.75') {
            return n.lineHeight === '1.75';
          }
          return [...TABBABLE_TYPES].includes(n?.type) && !Editor.isEditor(n) && SlateElement.isElement(n) && !(n as any).lineHeight;
        },
      });
      return !!match;
    }
    const [match] = Editor.nodes(editor, {
      match: (n: any) => n.lineHeight === lineHeight,
    });
    return !!match;
  } catch (e) {}
};
