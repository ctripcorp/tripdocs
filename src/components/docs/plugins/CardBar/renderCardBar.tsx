import { Button } from 'antd';
import cx from 'classnames';
import React, { HTMLAttributes } from 'react';
import './index.less';

interface CardbarProps extends HTMLAttributes<HTMLDivElement> {
  delete?: () => void;
}

const exec =
  (func: Function, ...args: any[]) =>
  (e?: React.MouseEvent) => {
    e && e.preventDefault();
    return func(...args);
  };

export const Cardbar: React.FC<CardbarProps> = props => {
  return (
    <div
      data-ignore-slate
      className={cx('cardbar', props.className, 'ignore-toggle-readonly')}
      contentEditable={false}
      style={{ border: '1px solid #e0e0e0' }}
    >
      <Button.Group>
        {props.children}
        {}
      </Button.Group>
    </div>
  );
};
