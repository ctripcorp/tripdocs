import React, { useCallback, useEffect, useRef, useState } from 'react';
import './Sidebar.less';
const Sidebar = props => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div id="mySidebar" className={`sidebar ${open ? 'open' : ''}`}>
        <button className="closebtn" onClick={() => setOpen(false)}>
          x
        </button>
        <div className="sidebar-links">
          <button>Dummy Home</button>
          <button>Dummy About</button>{' '}
        </div>
      </div>
      <div className={`${open ? 'sidebar-open' : ''}`}>
        <button
          className="openbtn"
          onClick={() => {
            setOpen(!open);
          }}
        >
          Open Sidebar
        </button>
        {props.children}
      </div>
    </>
  );
};
export default Sidebar;
