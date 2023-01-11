import { Editor, Transforms, Text } from '@src/components/slate-packages/slate';
import { ReactEditor } from '@src/components/slate-packages/slate-react';
import { SEL_CELLS } from '@src/utils/weak-maps';
import { ELTYPE } from '../config';

const COLOR_STYLE = ['fontColor', 'backgroundColor'];

export type ColorFormat = 'fontColor' | 'backgroundColor' | 'cellBackgroundColor';

export const colorArray = [
  ...Array.from([0, 67, 102, 153, 183, 204, 217, 239, 243, 255]).map(value => `rgb(${value}, ${value}, ${value})`),
  ...[
    [152, 0, 0],
    [255, 0, 0],
    [255, 153, 0],
    [255, 255, 0],
    [0, 255, 0],
    [0, 255, 255],
    [74, 134, 232],
    [0, 0, 255],
    [153, 0, 255],
    [255, 0, 255],
    [230, 184, 175],
    [244, 204, 204],
    [252, 229, 205],
    [255, 242, 204],
    [217, 234, 211],
    [208, 224, 227],
    [201, 218, 248],
    [207, 226, 243],
    [217, 210, 233],
    [234, 209, 220],
    [221, 126, 107],
    [234, 153, 153],
    [249, 203, 156],
    [255, 229, 153],
    [182, 215, 168],
    [162, 196, 201],
    [164, 194, 244],
    [159, 197, 232],
    [180, 167, 214],
    [213, 166, 189],
    [204, 65, 37],
    [224, 102, 102],
    [246, 178, 107],
    [255, 217, 102],
    [147, 196, 125],
    [118, 165, 175],
    [109, 158, 235],
    [111, 168, 220],
    [142, 124, 195],
    [194, 123, 160],
    [166, 28, 0],
    [204, 0, 0],
    [230, 145, 56],
    [241, 194, 50],
    [106, 168, 79],
    [69, 129, 142],
    [60, 120, 216],
    [61, 133, 198],
    [103, 78, 167],
    [166, 77, 121],
    [133, 32, 12],
    [153, 0, 0],
    [180, 95, 6],
    [191, 144, 0],
    [56, 118, 29],
    [19, 79, 92],
    [17, 85, 204],
    [11, 83, 148],
    [53, 28, 117],
    [116, 27, 71],
    [91, 15, 0],
    [102, 0, 0],
    [120, 63, 4],
    [127, 96, 0],
    [39, 78, 19],
    [12, 52, 61],
    [28, 69, 135],
    [7, 55, 99],
    [32, 18, 77],
    [76, 17, 48],
  ].map(value => `rgb(${value[0]}, ${value[1]}, ${value[2]})`),
];

const colorNames = [
  '黑色',
  '深灰色 4',
  '深灰色 3',
  '深灰色 2',
  '深灰色 1',
  '灰色',
  '浅灰色 1',
  '浅灰色 2',
  '浅灰色 3',
  '白色',
  '浆果红',
  '红色',
  '橙色',
  '黄色',
  '绿色',
  '青色',
  '矢车菊蓝',
  '蓝色',
  '紫色',
  '洋红色',
  '浅浆果红色 3',
  '浅红色 3',
  '浅橙色 3',
  '浅黄色 3',
  '浅绿色 3',
  '浅青色 3',
  '浅矢车菊蓝色 3',
  '浅蓝色 3',
  '浅紫色 3',
  '浅洋红色 3',
  '浅浆果红色 2',
  '浅红色 2',
  '浅橙色 2',
  '浅黄色 2',
  '浅绿色 2',
  '浅青色 2',
  '浅矢车菊蓝色 2',
  '浅蓝色 2',
  '浅紫色 2',
  '浅洋红色 2',
  '浅浆果红色 1',
  '浅红色 1',
  '浅橙色 1',
  '浅黄色 1',
  '浅绿色 1',
  '浅青色 1',
  '浅矢车菊蓝色 1',
  '浅蓝色 1',
  '浅紫色 1',
  '浅洋红色 1',
  '深浆果红色 1',
  '深红色 1',
  '深橙色 1',
  '深黄色 1',
  '深绿色 1',
  '深青色 1',
  '深矢车菊蓝色 1',
  '深蓝色 1',
  '深紫色 1',
  '深洋红色 1',
  '深浆果红色 2',
  '深红色 2',
  '深橙色 2',
  '深黄色 2',
  '深绿色 2',
  '深青色 2',
  '深矢车菊蓝色 2',
  '深蓝色 2',
  '深紫色 2',
  '深洋红色 2',
  '深浆果红色 3',
  '深红色 3',
  '深橙色 3',
  '深黄色 3',
  '深绿色 3',
  '深青色 3',
  '深矢车菊蓝色 3',
  '深蓝色 3',
  '深紫色 3',
  '深洋红色 3',
];

let map = {};

colorArray.forEach((str, index) => {
  map = { ...map, [str]: colorNames[index] };
});

export const colorNamesMap = map;

export const colorChoice = (editor: ReactEditor, format: any, color: any) => {
  const selCells = SEL_CELLS.get(editor);

  if (COLOR_STYLE.includes(format)) {
    if (selCells && selCells.length > 0) {
      selCells.forEach(entry => {
        const [, path] = entry;
        console.log('[colorChoice] toggleMark', format, entry);
        if ((format === 'backgroundColor' && color === 'rgb(255, 255, 255)') || (format === 'fontColor' && color === 'rgb(0, 0, 0)')) {
          Transforms.setNodes(editor, { [format]: null }, { at: path, match: Text.isText, split: true });
        } else {
          Transforms.setNodes(editor, { [format]: color }, { at: path, match: Text.isText, split: true });
        }
      });
    } else {
      if ((format === 'backgroundColor' && color === 'rgb(255, 255, 255)') || (format === 'fontColor' && color === 'rgb(0, 0, 0)')) {
        Editor.removeMark(editor, format);
      } else {
        Editor.addMark(editor, format, color);
        console.log(Editor.fragment(editor, editor.selection));
      }
    }
  } else if (format === 'cellBackgroundColor' && editor.selection) {
    if (selCells?.length > 0) {
      for (let cell of selCells) {
        Transforms.setNodes(editor, { cellBackgroundColor: color } as any, { at: cell[1] });
      }
    } else {
      editor.selection &&
        ReactEditor.hasRange(editor, editor.selection) &&
        editor.selection.focus.path.length === 6 &&
        Transforms.setNodes(editor, { cellBackgroundColor: color } as any, { at: editor.selection.focus.path.slice(0, 4) });
    }

    console.log(editor.selection, format, editor.children);
  }
};
