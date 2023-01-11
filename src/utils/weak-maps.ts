import { Editor, Node, NodeEntry } from '@src/components/slate-packages/slate';

export const CACHED_SEL_CELLS: WeakMap<Editor, NodeEntry[]> = new WeakMap();
export const SEL_CELLS: WeakMap<Editor, NodeEntry[]> = new WeakMap();
export const ACTIVE_TABLE: WeakMap<Editor, NodeEntry> = new WeakMap();

export const RESIZING_ROW: WeakMap<Editor, NodeEntry> = new WeakMap();
export const RESIZING_ROW_ORIGIN_HEIGHT: WeakMap<Editor, number> = new WeakMap();
export const RESIZING_ROW_MIN_HEIGHT: WeakMap<Editor, number> = new WeakMap();

export const RESIZING_COL: WeakMap<Editor, NodeEntry> = new WeakMap();
export const RESIZING_COL_ORIGIN_WIDTH: WeakMap<Editor, number> = new WeakMap();
export const RESIZING_COL_MIN_WIDTH: WeakMap<Editor, number> = new WeakMap();

export const INLINE_IMAGE_COMMENTS: WeakMap<Editor, Map<String, NodeEntry>> = new WeakMap();
