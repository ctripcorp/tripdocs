import { css } from '@emotion/css';
import { H2 } from '@src/components/docs/plugins/Components';
import { ELTYPE } from '@src/components/docs/plugins/config';
import React, { useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { Element as DefaultElement } from '@src/components/docs/slateEditor';

export const renderElement = (props: any) => {
  const { attributes, children, element } = props;
  const isDeleted = element.deleted;
  return isDeleted ? (
    <div
      className={css`
        text-decoration: line-through;
        position: relative;
        & > * {
          z-index: 10;
          position: relative;
        }
        &::after {
          content: '';
          display: block;
          width: 100%;
          height: 100%;
          left: 0;
          top: 0;
          position: absolute;
          background-color: #ffbbbb;
        }
      `}
    >
      <DefaultElement {...props} />
    </div>
  ) : (
    <DefaultElement {...props} />
  );
};
