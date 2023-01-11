import { Editor } from '@src/components/slate-packages/slate';
import { ErrorMsg } from './types';

export const SLATE_ERRORS: WeakMap<Editor, ErrorMsg[]> = new WeakMap();

export const ACTIVE_EDITOR: WeakMap<Window, Editor> = new WeakMap();

export const IS_RECOVERING_CONTENT: WeakMap<Editor, boolean> = new WeakMap();
