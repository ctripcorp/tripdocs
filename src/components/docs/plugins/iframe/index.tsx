import { ReactEditor } from '@src/components/slate-packages/slate-react';
import React from 'react';
import { insertCard } from '../Card';
import { ELTYPE } from '../config';
import './index.less';

export const insertIFrame = (editor: ReactEditor, type, link) => {
  insertCard(editor, {
    type,
    linkSource: link,
    children: [
      {
        text: '',
      },
    ],
  });
};

export default function ComIfram({ attributes, element, children }) {
  return (
    <div {...attributes} className="com_iframe ignore-toggle-readonly" contentEditable={false}>
      <iframe
        allowFullScreen={true}
        style={{ background: '#ccc' }}
        height={(640 / 16) * 9 - 10}
        width={640 - 10}
        className={'ignore-toggle-readonly'}
        src={element.linkSource}
        data-ignore-slate
      ></iframe>
      <span style={{ display: 'none' }}> {children}</span>
    </div>
  );
}
