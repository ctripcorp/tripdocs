import React from 'react';
import '@src/style/iconfont/Tripdocs.css';
import _ from 'lodash';
import { useRef } from 'react';

import { ELTYPE } from './plugins/config';
import { SlateInlineImage } from './plugins/InlineImage/inlineImagePlugins';
import { MentionElement } from './plugins/Mention/mention';

export const InlineElement: any = (props: any) => {
  let { attributes, children, element } = props;
  let newProps = Object.assign({}, props);
  delete newProps.setIsModalVisible;
  delete newProps.setModalTitle;

  switch (element.type) {
    case ELTYPE.MENTION:
      return <MentionElement {...newProps} />;
    case ELTYPE.INLINEIMAGE:
      return <SlateInlineImage {...newProps} textAlign={element.align ? element.align : 'center'} />;
    default:
      children = (
        <p
          {...attributes}
          style={{
            lineHeight: element.lineHeight ? element.lineHeight : 1.75,
            textAlign: element.align ? element.align : 'left',
            marginLeft: _.isNumber(element.tabLevel) ? `${Number.parseInt(element.tabLevel) * 2}rem` : null,
          }}
          data-tab-level={element.tabLevel}
          data-line-height={element.lineHeight}
        >
          {children}
        </p>
      );
      break;
  }
  return children;
};
