import { css, cx } from '@emotion/css';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { f } from '@src/resource/string';
import { min } from 'lodash';
import React from 'react';
import { COLOR_DEFAULT } from '../Components';
import { ColorButton } from './buttons';
import { colorArray, colorChoice, ColorFormat } from './color';

const DEFAULT_COLOR = {
  FONT: 'rgb(0, 0, 0)',
  BACKGROUND: 'rgb(255, 255, 255)',
};

const getDefaultColor = (colorFormat: ColorFormat) => {
  return colorFormat === 'fontColor' ? DEFAULT_COLOR.FONT : DEFAULT_COLOR.BACKGROUND;
};

export const dropdownMenuColor = (editor: any, colorFormat: ColorFormat, callback: any, curSelectedColor: string) => (
  <div
    style={{
      backgroundColor: 'white',
      border: '1px solid #dee0e3',
      borderRadius: '4px',
      boxShadow: '0 0 15px 0 rgba(0, 0, 0, 0.2)',
      userSelect: 'none',
    }}
  >
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
      }}
    >
      {}
      <div
        className={cx(
          'default-color-button',
          css`
            cursor: pointer;
            margin-bottom: 5px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            width: 100%;
            height: 26px;
            border-radius: 4px;
            &:hover {
              background-color: ${COLOR_DEFAULT.HOVER_BG_COLOR};
            }
          `
        )}
        onMouseDown={event => {
          event.preventDefault();
          event.stopPropagation();
          event.nativeEvent.stopImmediatePropagation();
          const { selection } = editor;
          if (selection && ReactEditor.hasRange(editor, selection) && min([selection.anchor.path[0], selection.focus.path[0]]) !== 0) {
            const defaultColor = getDefaultColor(colorFormat);
            colorChoice(editor, colorFormat, defaultColor);
            callback && callback(defaultColor);
          }
        }}
      >
        <div
          className={cx(
            css`
              border-radius: 4px;
              border: solid 1px #dee0e3;
              margin-left: 2px;
              background-color: ${getDefaultColor(colorFormat)};
              width: 20px;
              height: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              overflow: hidden;
              position: relative;
            `,
            colorFormat === 'backgroundColor'
              ? css`
                  &::before {
                    content: '|';
                    color: red;
                    position: absolute;
                    transform: rotate(-45deg) scale(2.5);
                    font-weight: 100;
                  }
                `
              : null
          )}
        />
        <span style={{ marginLeft: '8px' }}>{f('default')}</span>
      </div>
      <div
        style={{
          display: 'flex',
          width: 220,
          height: 196,
          flexFlow: 'wrap',
        }}
      >
        {colorArray.map((colorItem: string, index: number) => (
          <ColorButton
            editor={editor}
            format={colorFormat}
            color={colorItem}
            key={index}
            callback={callback}
            curSelectedColor={curSelectedColor}
          ></ColorButton>
        ))}
      </div>
    </div>
  </div>
);
