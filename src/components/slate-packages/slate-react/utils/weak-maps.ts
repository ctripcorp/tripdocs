import { Node, Ancestor, Editor, Range } from '@src/components/slate-packages/slate';

import { Key } from './key';



export const NODE_TO_INDEX: WeakMap<Node, number> = new WeakMap();
export const NODE_TO_PARENT: WeakMap<Node, Ancestor> = new WeakMap();


export const EDITOR_TO_WINDOW: WeakMap<Editor, Window> = new WeakMap();
export const EDITOR_TO_ELEMENT: WeakMap<Editor, HTMLElement> = new WeakMap();
export const EDITOR_TO_PLACEHOLDER: WeakMap<Editor, string> = new WeakMap();
export const ELEMENT_TO_NODE: WeakMap<HTMLElement, Node> = new WeakMap();
export const NODE_TO_ELEMENT: WeakMap<Node, HTMLElement> = new WeakMap();
export const NODE_TO_KEY: WeakMap<Node, Key> = new WeakMap();
export const EDITOR_TO_KEY_TO_ELEMENT: WeakMap<Editor, WeakMap<Key, HTMLElement>> = new WeakMap();



export const IS_READ_ONLY: WeakMap<Editor, boolean> = new WeakMap();
export const IS_FOCUSED: WeakMap<Editor, boolean> = new WeakMap();
export const IS_DRAGGING: WeakMap<Editor, boolean> = new WeakMap();
export const IS_CLICKING: WeakMap<Editor, boolean> = new WeakMap();



export const EDITOR_TO_ON_CHANGE = new WeakMap<Editor, () => void>();

export const EDITOR_TO_RESTORE_DOM = new WeakMap<Editor, () => void>();



export const PLACEHOLDER_SYMBOL = (Symbol('placeholder') as unknown) as string;
