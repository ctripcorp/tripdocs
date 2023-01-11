import { Node } from '@src/components/slate-packages/slate';
import { createRandomId, createUUID } from '@src/utils/randomId';
import _ from 'lodash';
import { createCard } from '../Card';
import { ELTYPE } from '../config';

export const pasteTable = (row: any, column: any, totalWidth: any, tableArr: any[], tableRows: any[]) => {
  const realCellWidth = Math.floor(((totalWidth as number) / column) as number);

  let table: any = [
    {
      type: ELTYPE.PARAGRAPH,
      children: [
        {
          text: '',
        },
      ],
    },
    {
      id: createUUID(),
      type: ELTYPE.TABLE,
      row: row,
      column: column,
      hwEach: [],

      children: [],
    },
    {
      type: ELTYPE.PARAGRAPH,
      children: [
        {
          text: '',
        },
      ],
    },
  ];
  let _unbordered = null;
  let collaboratedCells = [];

  console.log('[row]', row, column, tableArr);

  for (let i = 0; i < row; i++) {
    let rowItem = tableRows[i];
    let tableRow = {
      type: ELTYPE.TABLE_ROW,
      height: rowItem?.height || '33px',
      children: [] as any,
    };
    let arr = [];

    for (let j = 0; j < column; j++) {
      let _item = tableArr[i][j] || {};
      let readonly = !!tableArr[i][j]?.readonly;
      let rowspan = _.isNil(tableArr[i][j]?.rowspan) ? 1 : tableArr[i][j]?.rowspan;
      let colspan = _.isNil(tableArr[i][j]?.colspan) ? 1 : tableArr[i][j]?.colspan;
      console.log(readonly, 'colspan', colspan, 'rowspan', rowspan);
      let width = !readonly ? realCellWidth * colspan + 'px' : realCellWidth + 'px';
      let height = !readonly ? 37 * rowspan + 'px' : 0;

      if (Number.parseInt(colspan) * Number.parseInt(rowspan) > 1) {
        collaboratedCells.push([i, j, Number.parseInt(rowspan), Number.parseInt(colspan)]);
      }

      let cellBackgroundColor = _item.cellBackgroundColor;
      colspan = _item.colspan;
      height = _item.height;
      width = _item.width;
      rowspan = _item.rowspan;
      let text = _item.text;
      let textAlign = _item.textAlign;
      let unbordered = _item.unbordered;
      let verticalAlign = _item.verticalAlign;
      if (unbordered) _unbordered = unbordered;

      const createEmptyText = (text?) => {
        text = text || '';
        return [
          {
            type: 'paragraph',
            tabLevel: 0,
            align: 'left',
            children: [
              {
                text: text,
              },
            ],
          },
        ];
      };

      const trimBreaks = function (children: any) {
        return children.map((child: any) => {
          if (child.text && (/^[\t\r\n\f]+$/.test(child.text) || encodeURIComponent(child.text) === '%EF%BB%BF%0A')) {
            return { ...child, text: '' };
          } else if (child.children && child.children.length > 0) {
            return { ...child, children: trimBreaks(child.children) };
          } else {
            return child;
          }
        });
      };

      if (Array.isArray(text)) {
        text = trimBreaks(text);
      } else {
        text = createEmptyText(text);
      }

      console.log('TTTTTTTEXT: ', Array.isArray(text), text);

      console.log('[_item]', _item);
      const tableCell = {
        type: ELTYPE.TABLE_CELL,
        key: createRandomId(),

        cellBackgroundColor,

        unbordered,
        verticalAlign,

        colspan,
        rowspan,

        children: text,
      };
      if (colspan === 1 && rowspan === 1) {
        delete tableCell.rowspan;
        delete tableCell.colspan;
      }

      if (!readonly) {
        if (tableCell.children && tableCell.children[0] && tableCell.children[0].children && tableCell.children[0].children[0]) {
          delete tableCell.children[0]?.children[0]?.readonly;
        }
      }

      tableRow.children.push(tableCell);
      arr.push(realCellWidth + 'px');
    }

    table[1].hwEach.push(arr);
    table[1].children.push(tableRow);
  }

  for (let i = 0; i < collaboratedCells.length; i++) {
    const [row, col, rowspan, colspan] = collaboratedCells[i];
    const colNode = table[1].children[row].children[col];
    console.log('colNode', colNode);
    for (let j = 0; j < rowspan; j++) {
      for (let k = 0; k < colspan; k++) {
        if (j === 0 && k === 0) {
          continue;
        } else if (j === 0) {
          table[1].children[row].children[col + k].rowspan = rowspan;
          table[1].children[row].children[col + k].colspan = 0;
        } else if (k === 0) {
          table[1].children[row + j].children[col].rowspan = 0;
          table[1].children[row + j].children[col].colspan = colspan;
        } else {
          table[1].children[row + j].children[col + k].rowspan = 0;
          table[1].children[row + j].children[col + k].colspan = 0;
        }
      }
    }
  }

  return table;
};

export const pasteTableForHTML = (parent: any, deserialize2, fragId, imageTags, docWidth) => {
  console.log('pasteTableForHTML parent', parent);
  let tableArr: any[] = [];
  let tableRows: any[] = [];

  deserialize(parent, tableArr, null, deserialize2, fragId, tableRows, imageTags);
  console.log('tableRows', tableRows);
  console.log('pasteTableForHTML tableArr', tableArr);

  tableArr = validTable(tableArr);
  let colNum = tableArr[0]?.length;
  const table = pasteTable(tableArr.length, colNum, docWidth, tableArr, tableRows);
  console.log('[insertTable]2', JSON.stringify(table[1], null, 4));
  const card = createCard(table[1]);

  return card;
};

const isNullTD = 'isNullTD';
const isPlaceHolder = 'isPlaceHolder';

const fillterForWordTable = texts => {
  const fn = text => {
    return text.filter(item => {
      if (!item) {
        return false;
      }
      if (item.children && item.children.length > 0) {
        if (item.type == 'edit-link' && item.href == null) {
          item.type = ELTYPE.PARAGRAPH;
        }
        return (item.children = fn(item.children));
      } else if (item.type == 'edit-link' && item.children.length == 0) {
        return false;
      } else if (item !== '\n' && item != '\n  ') {
        return true;
      } else {
        return false;
      }
    });
  };
  const ret = fn(texts);
  console.log('[ret]', ret);
  return ret;
};

const pttopx = (pt, type) => {
  let ret = pt;
  if (pt.indexOf('pt') !== -1) {
    let num = Math.floor(pt.replace('pt', ''));
    if (type == 'height') {
      if (num < 33) num = 33;
    } else if (type == 'width') {
      if (num < 41) num = 41;
    } else {
    }
    ret = num + 'px';
  }
  return ret;
};

export const deserialize = (el: any, tableArr: any[], rowNum: number = 0, deserialize2, fragId, tableRows, imageTags) => {
  const { nodeType: elNodeType, nodeName: elNodeName } = el;

  console.log('newTable deserialize start', el, elNodeName);

  if (elNodeType === 3) {
    return el.textContent;
  } else if (elNodeType !== 1) {
    return null;
  } else if (elNodeName === 'BR') {
    return '\n';
  }

  if (elNodeName === 'TABLE') {
    const tableItems = Array.from(el.childNodes).filter((item: any) => item.nodeName === 'TBODY');
    if (!tableItems || !tableItems.length) return;
    const thead: any = Array.from(el.childNodes).filter((item: any) => item.nodeName === 'THEAD')[0];
    let theadTr = thead?.childNodes?.[0];
    const tbody: any = tableItems[0];
    if (theadTr) {
      theadTr.outerHTML = theadTr.outerHTML.replace(/\<th\>/g, '<td>').replace(/\<\\th\>/g, '<\\td>');
      tbody.insertBefore(theadTr, tbody.firstChild);
    }

    return deserialize(tbody, tableArr, 0, deserialize2, fragId, tableRows, imageTags);
  }

  if (['TBODY'].includes(elNodeName)) {
    let childNodes = Array.from(el.childNodes);
    childNodes = childNodes.filter((child: any) => child.nodeType != 3);
    console.log('TABLE TAKING', elNodeName, el, el.parentNode, childNodes);
    Array.from(childNodes).map((item, index) => {
      return deserialize(item, tableArr, index, deserialize2, fragId, tableRows, imageTags);
    });
  }
  if (elNodeName === 'TR') {
    tableRows.push({
      height: pttopx(el.style.height, 'height') || '33px',
    });

    Array.from(el.childNodes).map((item: any, realColIndex: number) => {
      const { nodeName } = item;

      if (nodeName === 'TD' || nodeName === 'TH') {
        const rowspan = item.getAttribute('rowspan') ? parseInt(item.getAttribute('rowspan')) : 1;
        const colspan = item.getAttribute('colspan') ? parseInt(item.getAttribute('colspan')) : 1;

        if (!tableArr[rowNum]) {
          tableArr[rowNum] = [];
        }
        if (!(rowspan * colspan)) {
          console.error('copy table error rowspan * colspan', rowspan * colspan);
          return false;
        }
        let colIndex = tableArr[rowNum].length;
        for (let i = 0; i < tableArr[rowNum].length; i++) {
          const el = tableArr[rowNum][i];
          if (!el) {
            console.error('copy table error colIndex', tableArr[rowNum], rowNum, i);
            colIndex = i;
            break;
          }
        }

        let texts = deserialize2(item, fragId, imageTags, { isInTable: true });
        console.log('[deserialize2]', texts);
        texts = texts
          ? texts.map((item: any) => {
              if (item?.type === undefined) {
                if (typeof item === 'string') {
                  return {
                    type: 'paragraph',
                    children: [
                      {
                        text: item,
                      },
                    ],
                  };
                } else if (typeof item === 'object') {
                  if (typeof item.children === 'undefined' && !!item.text) {
                    return {
                      type: 'paragraph',
                      children: [{ ...item, type: undefined }],
                    };
                  } else if (Node.isNode(item)) {
                    return {
                      type: 'paragraph',
                      children: [
                        {
                          text: Node.string(item),
                        },
                      ],
                    };
                  }
                }
              } else if (Object.values(ELTYPE).includes(item.type)) {
                return item;
              }

              return {
                type: 'paragraph',
                children: [{ text: '' }],
              };
            })
          : [];
        texts = texts
          ? fillterForWordTable(texts)
          : [
              {
                type: 'paragraph',
                tabLevel: 0,
                align: 'left',
                children: [
                  {
                    text: '',
                  },
                ],
              },
            ];

        let textAlign = '';
        textAlign = item.getElementsByTagName('p') && item.getElementsByTagName('p')[0] && item.getElementsByTagName('p')[0].style.textAlign;

        tableArr[rowNum][colIndex] = {
          text: texts,

          rowspan,
          colspan,
          cellBackgroundColor: item.style.backgroundColor,
          width: pttopx(item.style.width, 'width') || '145px',
          height: pttopx(item.style.height, 'height'),
          unbordered: item.style.border,
          textAlign: textAlign,
          verticalAlign: item.style.verticalAlign,
        };

        console.log('[texts]', item, texts, rowspan, colspan);

        if (colspan > 0) {
          let yCount = 1;
          while (yCount < colspan) {
            tableArr[rowNum][colIndex + yCount] = isNullTD;
            yCount += 1;
          }
        }

        if (rowspan) {
          let count = 1;
          while (count < rowspan) {
            console.log('************rowspan**********', tableArr[rowNum + count], rowspan);
            if (!tableArr[rowNum + count]) {
              tableArr[rowNum + count] = [];
            }

            if (colspan >= 1) {
              let yCount = 0;
              while (yCount < colspan) {
                tableArr[rowNum + count][colIndex + yCount] = isNullTD;
                yCount += 1;
              }
            }

            count += 1;
          }
        }
      }

      for (let k = 0; k < tableArr.length; k++) {
        const arr = tableArr[k];
        if (arr.includes(isNullTD)) {
          for (let l = 0; l < arr.length; l++) {
            const cell = arr[l];
            if (cell === isNullTD) {
              arr[l] = { text: '', readonly: true };
            }
          }
        }
      }
      return null;
    });
  }
};

const validTable = table => {
  console.log('validTable0 :>> ', table);
  let maxColumn = table.reduce((max, row) => (row.length > max ? row.length : max), 0);
  table = table.filter(row => row.length === maxColumn);
  console.log('validTable :>> ', table, maxColumn);
  return table;
};
