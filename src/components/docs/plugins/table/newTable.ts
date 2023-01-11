import Item from 'antd/lib/list/Item';
import { ReactEditor } from '../../../slate-packages/slate-react';
import { createCard, insertCard } from '../Card';
import { ELTYPE } from '../config';
import { createRandomId, createUUID } from '../../../../utils/randomId';
import { Node } from '@src/components/slate-packages/slate';
import { getSlateSlection } from '@src/utils/getSelection';

export const newTable = (editor: ReactEditor, row: any, column: any, totalWidth: any, selection: any) => {
  const sel = getSlateSlection(editor.docId);
  const realCellWidth = Math.floor(((totalWidth as number) / column) as number);
  let table: any = [
    {
      id: createUUID(),
      type: ELTYPE.TABLE,
      row: row,
      column: column,
      hwEach: [],
      children: [],
    },
  ];

  for (let i = 0; i < row; i++) {
    let tableRow = {
      type: ELTYPE.TABLE_ROW,
      height: '33px',
      children: [] as any,
    };
    let arr = [];

    for (let j = 0; j < column; j++) {
      const tableCell = {
        type: ELTYPE.TABLE_CELL,
        key: createRandomId(),
        children: [
          {
            type: ELTYPE.PARAGRAPH,
            children: [
              {
                text: '',
              },
            ],
          },
        ],
      };
      tableRow.children.push(tableCell);
      arr.push(realCellWidth.toString() + 'px' || '40px');
    }
    table[0].hwEach.push(arr);
    table[0].children.push(tableRow);
  }
  insertTable(editor, table[0], sel.focus.path);
};

export const insertTable = (editor: ReactEditor, table: any, selection: any) => {
  console.log('[insertTable]', JSON.stringify(table, null, 4));
  insertCard(editor, table, [selection[0]]);
};
