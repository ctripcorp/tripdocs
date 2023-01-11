import * as slate from '@src/components/slate-packages/slate';

export type Node = Editor | Element | Text;
export type Editor = slate.Editor;
export type Element = slate.Element & { type: string };
export type Text = slate.Text;
