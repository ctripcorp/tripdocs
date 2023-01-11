import React, { useContext, useReducer, useRef, useState } from 'react';
import { Editor, Transforms } from '@src/components/slate-packages/slate';
import { ReactEditor, useEditor, useFocused, useSelected } from '../../../slate-packages/slate-react';
import DragHandle from '../OverlayComponents/DragHandle';
import { TripdocsSdkContext } from '@src/Docs';

export const Divide = ({ attributes, children, element }) => {
  return <Hr attributes={attributes} element={element} children={children} />;
};

const Hr = ({ attributes, children, element }) => {
  const editor = useEditor();
  const selected = useSelected();
  const focused = useFocused();

  let cn = selected && focused ? 'card-hr hr-activated' : 'card-hr';
  const divideRef = useRef(null);

  const [isOverElement, setIsOverElement] = useState(false);

  const { docId } = useContext(TripdocsSdkContext);

  return (
    <>
      <div
        contentEditable={false}
        data-ignore-slate={true}
        data-activated={cn}
        style={{ userSelect: 'none' }}
        className={'ignore-toggle-readonly'}
        onClick={() => {
          console.log('ref:deom', divideRef, divideRef.current);

          let SlateNode = ReactEditor.toSlateNode(editor, divideRef.current);
          let SlatePath = ReactEditor.findPath(editor, SlateNode);
          console.log('-----', SlatePath);
          let [, lastPath] = Editor.last(editor, [SlatePath[0]]);
          console.log('+++++', lastPath);
          Transforms.select(editor, lastPath);
        }}
        onMouseOver={() => {
          setIsOverElement(true);
        }}
        onMouseLeave={() => {
          setTimeout(() => {
            setIsOverElement(false);
          }, 400);
        }}
      >
        <div {...attributes} className="card-hr">
          <hr />
          <span ref={divideRef} style={{ display: 'none' }}>
            {children}
          </span>
        </div>
      </div>
      <DragHandle editor={editor} isOverElement={isOverElement} docId={docId} overlayRefDom={divideRef?.current && divideRef?.current.parentNode} />
    </>
  );
};
