import { Path, Node, Editor } from '@src/components/slate-packages/slate';
import { TNode } from 'slate';
import invariant from 'tiny-invariant';
import { ELTYPE } from '../config';

function getParentPath(path: Path, level = 1): [number, Path] {
  if (level > path.length) {
    throw new TypeError('requested ancestor is higher than root');
  }

  return [path[path.length - level], path.slice(0, path.length - level)];
}

export function getParent(editor: Editor, path: Path, level: number = 1): [TNode, Path] {
  if (!path) return null;
  const [idx, parentPath] = getParentPath(path, level);

  const parent = Node.get(editor, parentPath) as TNode;
  invariant(parent, 'Parent node should exists');
  return [parent, parentPath];
}

export function getParentPathByType(editor: Editor, path: Path, type: string): Path | null {
  if (!path) return null;
  const len = path.length;
  for (let i = len - 1; i >= 0; i--) {
    const node: any = Node.has(editor, path.slice(0, i)) && Node.get(editor, path.slice(0, i));
    if (node && node.type === type) {
      return path.slice(0, i);
    }
  }
  return null;
}

export function getParentPathByTypes(editor: Editor, path: Path, types: string[]): Path | null {
  const len = path.length;
  for (let i = len - 1; i >= 0; i--) {
    const node: any = Node.has(editor, path.slice(0, i)) && Node.get(editor, path.slice(0, i));
    if (node && types.includes(node.type)) {
      return path.slice(0, i);
    }
  }
  return null;
}

export function isPathDescendantOfType(editor: Editor, path: Path, parentType: string): boolean {
  const parentPath = getParentPathByType(editor, path, parentType);
  return parentPath ? true : false;
}

export function isPathDescendantOfTable(editor: Editor, path: Path): boolean {
  return isPathDescendantOfType(editor, path, ELTYPE.TABLE);
}

export function isPath(path) {
  for (let i = 0; i < path.length; i++) {
    const num = path[i];
    if (!(isFinite(num) && num >= 0)) {
      return false;
    }
  }
  return true;
}
export function calcPath(path, anther) {
  const newPath = [...path];
  const newAnther = [...anther];
  const relativeLen = path.length - anther.length;
  if (relativeLen > 0) {
    newAnther.unshift(new Array(relativeLen).fill(0));
  } else if (relativeLen < 0) {
    newPath.unshift(new Array(-relativeLen).fill(0));
  }

  const relativePath = [];
  for (let i = 0; i < newPath.length; i++) {
    relativePath.push(newPath[i] + newAnther[i]);
  }
  return relativePath;
}

export function isEquals(path, anther) {
  for (let i = 0; i < path.length; i++) {
    if (path[i] !== anther[i]) {
      return false;
    }
  }
  return true;
}

export function getRelativePath(path, anther) {
  const newPath = [...path];
  const newAnther = [...anther];
  const relativeLen = path.length - anther.length;
  if (relativeLen > 0) {
    newAnther.unshift(new Array(relativeLen).fill(0));
  } else if (relativeLen < 0) {
    return new Array(anther.length).fill(0);
    newPath.unshift(new Array(-relativeLen).fill(0));
  }

  const relativePath = [];
  for (let i = 0; i < newPath.length; i++) {
    if (newPath[i] !== newAnther[i]) {
      relativePath.push(newPath[i] - newAnther[i]);
    } else {
      relativePath.push(0);
    }
  }
  return relativePath;
}
