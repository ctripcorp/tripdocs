import React, { useRef } from 'react'
import { Element, Range, Text as SlateText } from "@src/components/slate-packages/slate"
import { ReactEditor, useEditor } from '..'
import { useIsomorphicLayoutEffect } from '../hooks/use-isomorphic-layout-effect'
import {
  ELEMENT_TO_NODE, EDITOR_TO_KEY_TO_ELEMENT,
  NODE_TO_ELEMENT
} from '../utils/weak-maps'
import { RenderLeafProps } from './editable'
import Leaf from './leaf'




const Text = (props: {
  decorations: Range[]
  isLast: boolean
  parent: Element
  renderLeaf?: (props: RenderLeafProps) => JSX.Element
  text: SlateText
}) => {
  const { decorations, isLast, parent, renderLeaf, text } = props
  const editor = useEditor()
  const ref = useRef<HTMLSpanElement>(null)
  const leaves = SlateText.decorations(text, decorations)
  const key = ReactEditor.findKey(editor, text)
  const children = []

  for (let i = 0; i < leaves.length; i++) {
    const leaf = leaves[i]

    children.push(
      <Leaf
        isLast={isLast && i === leaves.length - 1}
        key={`${key.id}-${i}`}
        leaf={leaf}
        text={text}
        parent={parent}
        renderLeaf={renderLeaf}
      />
    )
  }

  
  useIsomorphicLayoutEffect(() => {
    const KEY_TO_ELEMENT = EDITOR_TO_KEY_TO_ELEMENT.get(editor)
    if (ref.current) {
      KEY_TO_ELEMENT?.set(key, ref.current)
      NODE_TO_ELEMENT.set(text, ref.current)
      ELEMENT_TO_NODE.set(ref.current, text)
    } else {
      KEY_TO_ELEMENT?.delete(key)
      NODE_TO_ELEMENT.delete(text)
    }
  })

  return (
    <span data-slate-node="text" ref={ref}>
      {children}
    </span>
  )
}

const MemoizedText = React.memo(Text, (prev, next) => {
  return (
    next.parent === prev.parent &&
    next.isLast === prev.isLast &&
    next.renderLeaf === prev.renderLeaf &&
    next.text === prev.text
  )
})

export default MemoizedText
