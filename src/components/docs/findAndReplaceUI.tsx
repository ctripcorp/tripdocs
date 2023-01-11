import { CloseOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

export const FindAndReplace = (props: any) => {
  const { open, callback, editor, find, replace, replaceAll, highlightRanges, getNum, setFindSelection, searchText, replaceText } = props;

  const [visible, setVisible] = useState(false);

  const [thisSearch, setSearch] = useState('');

  const [thisReplace, setReplace] = useState('');

  const searchTextRef = useRef(null);

  const replaceTextRef = useRef(null);

  useEffect(() => {
    setVisible(open);
  }, [open]);

  const countFind = () => {
    const first = highlightRanges.length === 0 ? 0 : getNum() + 1;
    const last = highlightRanges.length;
    const display = first.toString() + '/' + last.toString();
    return <span>{display}</span>;
  };

  const countFindDisplay = countFind();

  return (
    <div
      style={{
        position: 'fixed',
        top: 70,
        right: 10,
        height: 150,
        width: 400,
        display: visible ? 'flex' : 'none',
        flexDirection: 'column',
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: '#EEEEEE',
        boxShadow: '0px 5px 20px 0px rgba(0, 0, 0, 0.2)',
        borderRadius: '5px',
        backgroundColor: 'white',
      }}
    >
      <div
        style={{
          flex: 1,
          margin: '15px 10px 5px 10px',
          display: 'flex',
        }}
      >
        <div
          style={{
            flex: 1,
            marginRight: 10,
            display: 'flex',
          }}
        >
          <div
            style={{
              width: 50,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            查找
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Input
              ref={searchTextRef}
              value={thisSearch}
              onChange={e => {
                setSearch(e.target.value);
                searchText(e.target.value);
              }}
              suffix={countFindDisplay}
            ></Input>
          </div>
        </div>
        <div
          style={{
            width: 30,
            display: 'flex',
            justifyContent: 'right',
            alignItems: 'center',
          }}
        >
          <Button
            type="link"
            style={{
              right: 0,
              width: 10,
              marginLeft: 'auto',
              marginRight: 10,

              fontSize: 16,
            }}
            icon={<CloseOutlined />}
            onClick={() => {
              callback();
              setSearch('');
              searchText('');
              setReplace('');
              replaceText('');
              setFindSelection(null);
              (searchTextRef.current as any).value = '';
              (replaceTextRef.current as any).value = '';
            }}
          ></Button>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          margin: '5px 50px 5px 10px',
          display: 'flex',
        }}
      >
        <div
          style={{
            width: 50,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          替换
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Input
            ref={replaceTextRef}
            value={thisReplace}
            onChange={e => {
              setReplace(e.target.value);
              replaceText(e.target.value);
            }}
          ></Input>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          margin: 10,
          display: 'flex',
        }}
      >
        <div
          style={{
            width: 50,
          }}
        ></div>
        <div
          style={{
            flex: 1,
            display: 'flex',
          }}
        >
          <Button
            style={{
              margin: '0px 20px 5px 0px',
            }}
            onClick={e => {
              e.preventDefault();
              const selection = find(editor);
              setFindSelection(selection);
            }}
            disabled={thisSearch ? false : true}
          >
            查找
          </Button>
          <Button
            style={{
              margin: '0px 15px 5px 15px',
            }}
            onClick={e => {
              e.preventDefault();
              replace(editor, thisReplace);
            }}
            disabled={thisSearch ? (thisReplace ? false : true) : true}
          >
            替换
          </Button>
          <Button
            style={{
              margin: '0px 0px 5px 20px',
            }}
            onClick={e => {
              e.preventDefault();
              replaceAll(editor, thisReplace);
            }}
            disabled={thisSearch ? (thisReplace ? false : true) : true}
          >
            全部替换
          </Button>
        </div>
        <div
          style={{
            width: 30,
          }}
        ></div>
      </div>
    </div>
  );
};
