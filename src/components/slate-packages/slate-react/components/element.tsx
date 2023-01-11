import * as direction from 'direction'
import React, { useRef } from 'react'
import { Editor, Element as SlateElement, Node, NodeEntry, Range } from "@src/components/slate-packages/slate"
import { ReactEditor, useEditor, useReadOnly } from '..'
import { useIsomorphicLayoutEffect } from '../hooks/use-isomorphic-layout-effect'
import { SelectedContext } from '../hooks/use-selected'
import {
  ELEMENT_TO_NODE, EDITOR_TO_KEY_TO_ELEMENT, NODE_TO_ELEMENT, NODE_TO_INDEX, NODE_TO_PARENT
} from '../utils/weak-maps'
import Children from './children'
import { RenderElementProps, RenderLeafProps } from './editable'
import Text from './text'




const Element = (props: {
  decorate: (entry: NodeEntry, editorState: any) => Range[]
  decorations: Range[]
  element: SlateElement
  renderElement?: (props: RenderElementProps) => JSX.Element
  renderLeaf?: (props: RenderLeafProps) => JSX.Element
  selection: Range | null,
  editorState: any
}) => {
  
  const {
    decorate,
    decorations,
    element,
    renderElement = (p: RenderElementProps) => <DefaultElement {...p} />,
    renderLeaf,
    selection,
    editorState,
  } = props
  const ref = useRef<HTMLElement>(null)
  const editor = useEditor()
  const readOnly = useReadOnly()
  const isInline = editor.isInline(element)
  const key = ReactEditor.findKey(editor, element)

  let children: JSX.Element | null = (
    <Children
      decorate={decorate}
      decorations={decorations}
      node={element}
      renderElement={renderElement}
      renderLeaf={renderLeaf}
      selection={selection}
      editorState={editorState}
    />
  )

  
  
  const attributes: {
    'data-slate-node': 'element'
    'data-slate-void'?: true
    'data-slate-inline'?: true
    contentEditable?: false
    dir?: 'rtl'
    ref: any
  } = {
    'data-slate-node': 'element',
    ref,
  }

  if (isInline) {
    attributes['data-slate-inline'] = true
  }

  
  
  if (!isInline && Editor.hasInlines(editor, element)) {
    const text = Node.string(element)
    const dir = direction(text)

    if (dir === 'rtl') {
      attributes.dir = dir
    }
  }

  
  if (Editor.isVoid(editor, element)) {
    attributes['data-slate-void'] = true

    if (!readOnly && isInline) {
      attributes.contentEditable = false
    }

    const Tag = isInline ? 'span' : 'div'
    const [[text]] = Node.texts(element)

    children = readOnly ? null : (
      <Tag
        data-slate-spacer
        style={{
          height: '0',
          color: 'transparent',
          outline: 'none',
          position: 'absolute',
        }}
      >
        <Text decorations={[]} isLast={false} parent={element} text={text} />
      </Tag>
    )

    NODE_TO_INDEX.set(text, 0)
    NODE_TO_PARENT.set(text, element)
  }

  
  useIsomorphicLayoutEffect(() => {
    const KEY_TO_ELEMENT = EDITOR_TO_KEY_TO_ELEMENT.get(editor)
    if (ref.current) {
      KEY_TO_ELEMENT?.set(key, ref.current)
      NODE_TO_ELEMENT.set(element, ref.current)
      ELEMENT_TO_NODE.set(ref.current, element)
    } else {
      KEY_TO_ELEMENT?.delete(key)
      NODE_TO_ELEMENT.delete(element)
    }
  })

  return (
    <SelectedContext.Provider value={!!selection}>
      {renderElement({ attributes, children, element, editorState })}
    </SelectedContext.Provider>
  )
}

const MemoizedElement = React.memo(Element, (prev, next) => {
  return (
    prev.decorate === next.decorate &&
    prev.element === next.element &&
    prev.renderElement === next.renderElement &&
    prev.renderLeaf === next.renderLeaf &&
    isRangeListEqual(prev.decorations, next.decorations) &&
    (prev.selection === next.selection ||
      (!!prev.selection &&
        !!next.selection &&
        Range.equals(prev.selection, next.selection)))
  )
})



export const DefaultElement = (props: RenderElementProps) => {
  const { attributes, children, element } = props
  const editor = useEditor()
  const Tag = editor.isInline(element) ? 'span' : 'div'
  return (
    <Tag {...attributes} style={{ position: 'relative' }}>
      {children}
    </Tag>
  )
}



const isRangeListEqual = (list: Range[], another: Range[]): boolean => {
  if (list.length !== another.length) {
    return false
  }

  for (let i = 0; i < list.length; i++) {
    const range = list[i]
    const other = another[i]

    if (!Range.equals(range, other)) {
      return false
    }
  }

  return true
}

export default MemoizedElement
