import { Italic } from '@src/components/docs/plugins/Components';
import React from 'react';

export const renderLeaf = (props: any) => <Leaf {...props} />;

const Leaf: any = ({ attributes, children, leaf }: any) => {
  if (leaf.modifiedOld) {
    children = <span style={{ backgroundColor: '#ffbbbb', textDecoration: 'line-through' }}>{children}</span>;
  }
  if (leaf.modifiedNew) {
    children = <span style={{ backgroundColor: '#aaeeaa', textDecoration: 'none', display: 'inline-block' }}>{children}</span>;
  }
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.code) {
    children = (
      <code
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '2px',
          padding: '0 2px',
          margin: '2px 4px',
        }}
      >
        {children}
      </code>
    );
  }
  if (leaf.italic) {
    children = <Italic>{children}</Italic>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  if (leaf.strikethrough) {
    children = <del>{children}</del>;
  }
  return (
    <span {...attributes} contentEditable={false} suppressContentEditableWarning={true}>
      {children}
    </span>
  );
};
