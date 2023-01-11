import { Transforms } from '@src/components/slate-packages/slate';
import { ELTYPE } from '../config';
import { deserializeMD } from './deserializeMD';

export const withDeserializeMD = (editor: any) => {
  const { insertData } = editor;

  editor.insertData = (data: { getData: (arg0: string) => any }) => {
    const content = data.getData('text/plain');

    if (content.indexOf('#') === 0) {
      const fragment: any = deserializeMD(editor, content);

      if (!fragment.length) return;

      if (fragment[0].type) {
        Transforms.setNodes(editor, { type: fragment[0].type } as any);
      }

      Transforms.insertFragment(editor, [...fragment, { type: ELTYPE.PARAGRAPH, children: [{ text: '' }] }]);
      return;
    }

    insertData(data);
  };

  return editor;
};
