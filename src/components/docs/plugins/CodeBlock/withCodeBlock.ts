import { ELTYPE } from '../config';

export const withCodeBlock = (editor: any) => {
  const { isVoid, apply } = editor;

  editor.isVoid = (element: any) => {
    return element.type === ELTYPE.CODE_BLOCK ? true : isVoid(element);
  };

  editor.apply = op => {
    apply(op);
  };
  return editor;
};
