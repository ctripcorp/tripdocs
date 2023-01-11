import { css, cx } from '@emotion/css';
import React, { useContext, useEffect, useState } from 'react';

interface Caret {
  color: string;
  isForward: boolean;
  name: string;
}

const Caret: React.FC<Caret> = leaf => {
  const {
    data: { name, alphaColor: color },
    isMe,
    isMobile,
    isForward,
  } = leaf as any;

  const cursorStyles = {
    position: 'absolute',
    top: 0,
    left: '-3px',

    userSelect: 'none',
    transform: 'translateY(-100%)',
    fontSize: 10,
    color: 'white',
    whiteSpace: 'nowrap',
    background: isMe ? '#000' : color,
    borderRadius: '4px',
    padding: '0 4px',
  };

  const [show, setShow] = useState(false);
  const [displayTooltip, setDisplayTooltip] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(!show);
    }, 600);

    return () => {
      clearTimeout(timeout);
    };
  }, [show]);

  const caretStyles: any = {
    position: 'absolute',
    userSelect: 'none',
    height: '1.2em',
    width: 2,

    background: isMe ? (show ? '#000' : 'transparent') : color,
  };

  return (
    <>
      <span
        contentEditable={false}
        style={
          {
            ...caretStyles,
            top: !isForward ? 0 : null,
            left: !isForward ? 0 : null,
            bottom: isForward ? 0 : null,
            right: isForward ? 0 : null,
            pointerEvents: isMobile ? 'none' : null,
          } as any
        }
        data-ignore-slate
        data-is-caret
        className={cx(
          'ignore-toggle-readonly',
          css`
            & * {
              user-select: none;
            }
          `
        )}
        onMouseEnter={e => {
          setDisplayTooltip(true);
        }}
        onClick={e => {
          setDisplayTooltip(true);
        }}
      >
        <span contentEditable={false} data-ignore-slate style={{ position: 'relative', ...caretStyles }}>
          {!isMe && (
            <span
              contentEditable={false}
              data-ignore-slate
              className={cx(
                'ignore-toggle-readonly',
                css`
                  transition: all 0.3s ease-in-out;
                `
              )}
              style={
                {
                  ...cursorStyles,
                  width: displayTooltip ? 'fit-content' : '7px',
                  height: displayTooltip ? 'auto' : '7px',
                  borderRadius: '4px',
                } as any
              }
              onMouseEnter={e => {
                setDisplayTooltip(true);
              }}
              onMouseLeave={e => {
                setTimeout(() => {
                  setDisplayTooltip(false);
                }, 600);
              }}
            >
              {displayTooltip ? name : null}
            </span>
          )}
        </span>
      </span>
    </>
  );
};

export default Caret;
