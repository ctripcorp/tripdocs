import { getCache } from '@src/utils/cacheUtils';
import storage from '../../../../utils/storage';
import { Transforms, Node, Range } from '../../../slate-packages/slate';
import { ELTYPE } from '../config';

const insertShare = (editor: any, character: any) => {
  const content = Node.string(Node.get(editor, [Range.start(editor.selection).path[0]]));
  Transforms.move(editor);

  const senderUser = getCache(editor.docId, 'options')?.userInfo || {};

  const data = {
    targetUser: character,
    senderUser: senderUser,
    title: (Node.get(editor, [0, 0]) as any).text,
    href: document.location.href,
    content: content,
    format: '',
  };
};
