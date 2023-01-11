import { Editor, Element } from '@src/components/slate-packages/slate';
import { ReactEditor } from '../../../slate-packages/slate-react/index';
import { ELTYPE } from '../config';

export const withMention = <T extends Editor>(editor: T) => {
  const e = editor as T & ReactEditor;

  const { isInline, isVoid, deleteBackward } = e;

  e.isInline = (element: Element) => {
    return (element as any).type === ELTYPE.MENTION ? true : isInline(element);
  };

  e.isVoid = (element: Element) => {
    return (element as any).type === ELTYPE.MENTION ? true : isVoid(element);
  };

  e.deleteBackward = (unit: any) => {
    deleteBackward(unit);
  };

  return e;
};
