import React from 'react';
import './index.less';
export default function Button(props) {
  const { type, href, width = 120, height = 40, style, children, className = '', onClick } = props;
  function getButtonClass(props) {
    const { type, disabled } = props;
    let typeClass = 't_Button__basic';
    if (disabled) {
      if (type === 'primary') {
        return typeClass + ' t_Button__disabled_primary';
      }
      return typeClass + ' t_Button__default_disabled';
    }
    switch (type) {
      case 'primary':
        typeClass += ' t_Button__primary';
        break;
      case 'cancel':
        typeClass += ' t_Button__cancel';
        break;

      default:
        break;
    }
    return typeClass;
  }
  if (type === 'link') {
    return (
      <a target="_blank" href={href} className="t_Button__basic t_Button__link">
        {children}
      </a>
    );
  }

  return (
    <button
      onClick={e => {
        onClick && onClick(e);
      }}
      style={{ width: width, height: height, ...style }}
      className={getButtonClass(props) + ' ' + className}
    >
      {children}
    </button>
  );
}
