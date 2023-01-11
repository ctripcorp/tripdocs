
import { useCallback, useContext, useEffect, useState } from 'react';
import { NodeEntry, Path, Range, Text } from '@src/components/slate-packages/slate';
import { Cursor } from '../model';
import { relativePositionToAbsolutePosition } from '../cursor/utils';
import { CursorEditor } from './cursorEditor';
import { getCache, setCache } from '@src/utils/cacheUtils';
import { TripdocsSdkContext } from '@src/Docs';

export const useCursors = (
  editor: CursorEditor
): {
  decorate: (entry: NodeEntry) => Range[];
  cursors: Cursor[];
} => {
  const [cursors, setCursorData] = useState<Cursor[]>([]);
  const { isMobile, isDrag } = useContext(TripdocsSdkContext);

  useEffect(() => {
    editor.awareness.on('update', () => {
      const drag = getCache(editor.docId, 'drag')
      const newCursorData = Array.from(editor.awareness.getStates())
        .filter(([clientId]) => (isMobile || drag) ? true : clientId !== editor.sharedType.doc?.clientID)
        .map(([clientId, awareness]) => {
          let anchor = null;
          let focus = null;

          if (awareness.anchor) {
            anchor = relativePositionToAbsolutePosition(
              editor.sharedType,
              awareness.anchor
            );
          }

          if (awareness.focus) {
            focus = relativePositionToAbsolutePosition(
              editor.sharedType,
              awareness.focus
            );
          }

          return { anchor, focus, data: awareness, isMe: clientId === editor.sharedType.doc?.clientID };
        })
        .filter((cursor) => cursor.anchor && cursor.focus);
      if (getCache(editor.docId, 'newCursorData') === undefined || JSON.stringify(newCursorData) !== JSON.stringify(getCache(editor.docId, 'newCursorData'))) {
        setCache(editor.docId, 'newCursorData', newCursorData)
        setCursorData(newCursorData as unknown as Cursor[]);
      }
    });
  }, [editor]);
  useEffect(() => {
    if (!editor?.awareness?.getStates()) {
      return
    }
    const newCursorData = Array.from(editor.awareness.getStates())
      
      .filter(([clientId]) => (isMobile || isDrag) ? true : clientId !== editor.sharedType.doc?.clientID)
      .map(([clientId, awareness]) => {
        let anchor = null;
        let focus = null;

        if (awareness.anchor) {
          anchor = relativePositionToAbsolutePosition(
            editor.sharedType,
            awareness.anchor
          );
        }

        if (awareness.focus) {
          focus = relativePositionToAbsolutePosition(
            editor.sharedType,
            awareness.focus
          );
        }

        return { anchor, focus, data: awareness, isMe: clientId === editor.sharedType.doc?.clientID };
      })
      .filter((cursor) => cursor.anchor && cursor.focus);
    setCache(editor.docId, 'drag', isDrag)
    setCache(editor.docId, 'newCursorData', newCursorData)
    setCursorData(newCursorData as unknown as Cursor[]);
  }, [isDrag])


  const decorate = useCallback(
    ([node, path]: NodeEntry) => {
      const ranges: any[] = [];

      if (Text.isText(node) && cursors?.length) {
        cursors.forEach((cursor) => {
          if (Range.includes(cursor, path)) {
            const { focus, anchor, data, isMe } = cursor;

            const isFocusNode = Path.equals(focus.path, path);
            const isAnchorNode = Path.equals(anchor.path, path);
            const isForward = Range.isForward({ anchor, focus });

            ranges.push({
              data,
              isMe,
              isForward,
              isCaret: isFocusNode,
              anchor: {
                path,
                
                offset: isAnchorNode
                  ? anchor.offset
                  : isForward
                    ? 0
                    : node.text.length,
              },
              focus: {
                path,
                
                offset: isFocusNode
                  ? focus.offset
                  : isForward
                    ? node.text.length
                    : 0,
              },
            });
          }
        });
      }

      return ranges;
    },
    [cursors]
  );

  return { decorate, cursors };
};

export default useCursors;
