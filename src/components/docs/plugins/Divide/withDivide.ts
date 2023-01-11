import { ELTYPE } from '../config';
export const withDivide = (editor: any) => {
  const { isVoid } = editor;

  editor.isVoid = (element: any) => {
    return element.type === ELTYPE.DIVIDE ? true : isVoid(element);
  };
  return editor;
};
