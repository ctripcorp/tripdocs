import { Path } from '@src/components/slate-packages/slate';

export const isSameLineSelection = (selection: any): boolean => {
  if (!selection || !selection.focus || !selection.anchor) {
    return false;
  }
  const { focus, anchor } = selection;
  if (anchor.path.length !== focus.path.length) {
    return false;
  }
  return Path.equals(anchor.path.slice(0, -1), focus.path.slice(0, -1));
};
