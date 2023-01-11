import { css, cx } from '@emotion/css';
import React, { useEffect, useState } from 'react';
import { Tooltip } from 'antd';
import { TooltipPlacement } from 'antd/lib/tooltip';
import './GeneralOverlayButton.less';

type GeneralOverlayButtonProps = {
  title: string;
  icon: any;
  tooltipPlacement?: TooltipPlacement;
  hoverStyle?: 'background' | 'color' | 'danger';
  className?: string;
  [key: string]: any;
};

export const GeneralOverlayButton = (props: GeneralOverlayButtonProps) => {
  const { title, icon, tooltipPlacement = 'top', hoverStyle = 'background', className, ...rest } = props;
  return (
    <Tooltip title={title} placement={tooltipPlacement}>
      <div className={cx('general-overlay-button', `hover-${hoverStyle}`, className)} {...rest}>
        {icon}
      </div>
    </Tooltip>
  );
};
