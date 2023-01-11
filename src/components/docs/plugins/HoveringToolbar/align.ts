import { Editor, Element as SlateElement, Range, Transforms } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { SEL_CELLS } from '@src/utils/weak-maps';
import { ELTYPE, TABBABLE_TYPES } from '../config';

export const alignToggle = (editor: any, format: any, selection: any) => {
  try {
    Transforms.unsetNodes(editor, 'align', { at: selection });
    console.log('[at]selection', selection);

    const selectedCells = SEL_CELLS.get(editor);
    if (selectedCells && selectedCells.length > 0) {
      alignCells(selectedCells, function (at) {
        console.log('[at]', at, format);
        Transforms.setNodes(
          editor,
          {
            align: format,
          } as Partial<SlateElement>,
          {
            at: at,
          }
        );
      });
    } else {
      Transforms.setNodes(
        editor,
        {
          align: format,
        } as Partial<SlateElement>,
        {
          at: selection,
        }
      );
    }
  } catch (e) {}
};

export const isAlignActive = (editor: any, format: any, selection: any) => {
  try {
    let fo = format.split('-')[1];

    if (!selection && ReactEditor.hasRange(editor, selection) && fo === 'left') {
      return true;
    }

    const [match] = Editor.nodes(editor, {
      match: (n: any) => {
        if (TABBABLE_TYPES.includes(n.type)) {
          return n.align ? n.align === fo : fo === 'left';
        }
        return false;
      },
      at: selection,
    });

    return !!match;
  } catch (e) {
    console.log('isAlignActive e:', e);
  }
};

const alignCells = (selectedCells, fn) => {
  console.log('[at] getSelectionCells', selectedCells);

  console.log('[at] selectNodes', selectedCells);
  if (selectedCells && selectedCells.length > 0) {
    for (let [node, path] of selectedCells) {
      console.log('[at]path', path);

      fn({
        anchor: {
          offset: 0,
          path: path,
        },
        focus: {
          offset: 0,
          path: path,
        },
      });
    }
  }
};

export const setVerticalAlign = (editor: any, valign: 'top' | 'middle' | 'bottom', selection: any) => {
  try {
    const selectedCells = SEL_CELLS.get(editor);
    if (selectedCells && selectedCells.length > 0) {
      for (let [node, path] of selectedCells) {
        Transforms.setNodes(editor, { verticalAlign: valign } as Partial<SlateElement>, { at: path });
      }
      return;
    }
    const sel = selection;

    const selectNodes = Editor.nodes(editor, {
      at: [],
      match: (n: any) => {
        return n.type === ELTYPE.TABLE_CELL && !!n.selectedCell;
      },
    });
    let cellsPath: any = [];
    for (const [, path] of selectNodes) {
      cellsPath.push(path);
    }

    let start: any;
    let end: any;
    let thisSelection: any;

    if (cellsPath.length !== 0) {
      let row = 0;
      let x = 0,
        xmin = 9999999;
      let y = 0,
        ymin = 9999999;
      for (const path of cellsPath) {
        row = path[0];
        if (path[1] > x) {
          x = path[1];
        }
        if (path[2] > y) {
          y = path[2];
        }
        if (path[1] < xmin) {
          xmin = path[1];
        }
        if (path[2] < ymin) {
          ymin = path[2];
        }
      }
      start = { path: [row, xmin, ymin, 0, 0], offset: 0 };
      end = { path: [row, x, y, 0, 0], offset: 0 };
      thisSelection = { anchor: start, focus: end };
    } else {
      if (sel && sel.anchor && sel.focus) {
        thisSelection = sel;
      } else {
        return;
      }
    }

    const cells = Editor.nodes(editor, {
      at: thisSelection,
      match: (n: any) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        (n as any).type === ELTYPE.TABLE_CELL &&
        ((n as any).colspan !== null || (n as any).rowspan !== null),
    });
    for (let [node, path] of cells) {
      Transforms.setNodes(editor, { verticalAlign: valign } as Partial<SlateElement>, { at: path });
    }
  } catch (e) {}
};

export const isVerticalAlignActive = (editor: any, valign: 'top' | 'middle' | 'bottom', selection: any) => {
  try {
    const selectedCells = SEL_CELLS.get(editor);
    if (selectedCells && selectedCells.length > 0) {
      if (valign === 'top') {
        const [match] = Editor.nodes(editor, {
          at: selectedCells[0][1],
          match: (n: any) => {
            if (n.verticalAlign === valign) {
              return n.verticalAlign === valign;
            }
            return !Editor.isEditor(n) && SlateElement.isElement(n) && !(n as any).verticalAlign && ELTYPE.TABLE_CELL === ((n as any).type as string);
          },
        });
        return !!match;
      }

      const [match] = Editor.nodes(editor, {
        at: selectedCells[0][1],
        match: (n: any) => n.verticalAlign === valign,
      });
      return !!match;
    }
    if (valign === 'top') {
      const [match] = Editor.nodes(editor, {
        at: selection,
        match: (n: any) => {
          if (n.verticalAlign === valign) {
            return n.verticalAlign === valign;
          }
          return !Editor.isEditor(n) && SlateElement.isElement(n) && !(n as any).verticalAlign && ELTYPE.TABLE_CELL === ((n as any).type as string);
        },
      });
      return !!match;
    }
    const [match] = Editor.nodes(editor, {
      match: (n: any) => n.verticalAlign === valign,
    });
    return !!match;
  } catch (e) {}
};
