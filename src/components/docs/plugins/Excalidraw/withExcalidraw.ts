import { ELTYPE } from '../config';

export const witExcalidraw = (editor: any) => {
  const { isVoid } = editor;

  editor.isVoid = (element: any) => {
    return element.type === ELTYPE.EXCALIDRAW ? true : isVoid(element);
  };
  return editor;
};
