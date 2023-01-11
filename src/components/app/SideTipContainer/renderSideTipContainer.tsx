import { cx, css } from '@emotion/css';
import { Editor } from '@src/components/slate-packages/slate';
import { Tooltip } from 'antd';
import { COLOR_ACTIVE, COLOR_DEFAULT, IconBtn } from '../../docs/plugins/Components';
import React, { useContext, useState } from 'react';
import './index.less';
import { TripdocsSdkContext } from '@src/Docs';
import { f } from '@src/resource/string';
interface SideTipContainerProps {
  editor: Editor;
  docId: string;
  editorContainerScrollTop: number;
  isMobile: boolean;
  scrollRef: any;
  showHelpBlock: boolean;
  setIsShowHotkeyHelper: Function;
}

const SideTipContainer = (props: SideTipContainerProps) => {
  const { editor, docId, showHelpBlock, editorContainerScrollTop, isMobile, scrollRef, setIsShowHotkeyHelper } = props;

  return (
    <div
      className="side-tip-container"
      style={{
        position: 'sticky',
        display: 'flex',
        width: '100%',
        height: 0,
        bottom: isMobile ? '90px' : '60px',
        paddingRight: '24px',
        color: '#a0a0a0',
        fontSize: '18px',
        justifyContent: 'flex-end',
        zIndex: 1020,
      }}
    >
      <ToTopButton isMobile={isMobile} scrollRef={scrollRef} editorContainerScrollTop={editorContainerScrollTop}></ToTopButton>
      {showHelpBlock ? <HelpBlock setIsShowHotkeyHelper={setIsShowHotkeyHelper} /> : null}
    </div>
  );
};

const ToTopButton = (props: any) => {
  const { isMobile, scrollRef, editorContainerScrollTop } = props;
  return editorContainerScrollTop > window.innerHeight ? (
    <Tooltip title={f('toTop')} placement="top" mouseEnterDelay={0} mouseLeaveDelay={0}>
      <div
        className={cx(
          'to-top-button',
          css`
            & {
              margin-right: ${isMobile ? '0.5em' : '15px'};
              display: flex;
              justify-content: center;
              align-items: center;
              background: #ffffff;
              box-shadow: 0px 2px 4px 0px rgba(188, 188, 188, 0.5);
              height: 34px;
              width: 34px;
              border-radius: 17px;
              cursor: pointer;
              z-index: 100;
              color: #000;
              &:hover {
                color: ${COLOR_ACTIVE.COLOR};
              }
            }
          `
        )}
        onMouseDown={e => {
          e.preventDefault();
          scrollRef?.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <IconBtn className="Tripdocs-back_to_top" style={{ fontSize: '16px' }} />
      </div>
    </Tooltip>
  ) : null;
};

const HelpBlock = (props: any) => {
  const { isMobile, setIsShowHotkeyHelper } = props;

  const { isInElectron, docId } = useContext(TripdocsSdkContext);

  const [isHover, setIsHover] = useState(false);

  return (
    <div className="help-block">
      <div
        className="help-button-wrap"
        style={{
          opacity: isHover ? 1 : 0,
          transform: `translateY(${isHover ? `0` : `50px`})`,
          pointerEvents: isHover ? null : `none`,
          transition: 'all 0.3s ease-in-out',
          transitionProperty: 'transform, opacity',
        }}
        onMouseEnter={() => {
          setIsHover(true);
        }}
      >
        <HelpButton
          icon="keyboard"
          title={f('hotkey')}
          onClick={() => {
            setIsShowHotkeyHelper(true);
          }}
        />
      </div>
      <div
        className={cx(
          'more-tip-button',
          css`
            & {
              margin-right: ${isMobile ? '0.5em' : '15px'};
              display: flex;
              justify-content: center;
              align-items: center;
              background: #ffffff;
              box-shadow: 0px 2px 4px 0px rgba(188, 188, 188, 0.5);
              height: 34px;
              width: 34px;
              border-radius: 17px;
              cursor: pointer;
              z-index: 120;
              color: #000;
              &:hover {
                color: ${COLOR_ACTIVE.COLOR};
              }
            }
          `
        )}
        onMouseEnter={() => {
          setIsHover(true);
        }}
        onMouseLeave={() => {
          setIsHover(false);
        }}
        onMouseDown={e => {
          e.preventDefault();
          setIsHover(prev => !prev);
        }}
      >
        {isHover ? (
          <IconBtn className="Tripdocs-close" style={{ fontSize: '16px' }} />
        ) : (
          <IconBtn className="Tripdocs-more" style={{ fontSize: '16px' }} />
        )}
      </div>
    </div>
  );
};

const HelpButton = (props: any) => {
  const { title, icon, onClick } = props;
  return (
    <Tooltip title={title} placement="left" mouseEnterDelay={0.2} mouseLeaveDelay={0}>
      <div className="help-button" onClick={onClick}>
        <IconBtn className={`Tripdocs-${icon}`} style={{ fontSize: '16px' }} />
      </div>
    </Tooltip>
  );
};

export { SideTipContainer };
