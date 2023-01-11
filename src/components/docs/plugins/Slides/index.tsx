import React, { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as anchorId } from 'uuid';
import { Transforms, Node, Path } from '@src/components/slate-packages/slate';
import { insertCard } from '../Card';
import { ELTYPE } from '../config';
import $ from 'jquery';

export const SlidesDomNode = ({ attributes, children, element, editor, newProps }) => {
  return <div> Slides</div>;
};

export const SlidesSlateNode = (editor: any, selectionFocusPath: Path = editor.selection.focus.path) => {};

export const withSlides = (editor: any) => {
  const { isVoid, insertData, deleteBackward, deleteForward, deleteFragment, isInline, apply, setFragmentData } = editor;

  return editor;
};
export function normalizeSlides(editor, entry) {
  const [node, path] = entry;

  return false;
}
