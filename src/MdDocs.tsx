import React from 'react';
import MdEditor from './components/MdEditor';
import Docs from './Docs';

export default function MdDocs(options: any) {
  return (
    <div
      className="editor-outer-wrapper"
      style={{
        border: '1px solid rgba(0,0,0,0.1)',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
      }}
    >
      <div
        className="editor-outer-wrapper"
        data-ignore-slate
        style={{
          border: '1px solid rgba(0,0,0,0.1)',
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          width: '50%',
          height: '100%',
        }}
      >
        {}
        <MdEditor options={options} onChange={undefined} />
      </div>
      <div
        className="editor-outer-wrapper"
        style={{
          border: '1px solid rgba(0,0,0,0.1)',
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          width: '50%',
          height: '100%',
        }}
      >
        <Docs {...{ ...options, showHelpBlock: false, showGlobalComment: false }} socketUrl="offline" />
      </div>
    </div>
  );
}
