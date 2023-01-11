import React, { useRef } from 'react'
import { Editor, Element, Node, Path, Text } from "@src/components/slate-packages/slate"
import { ReactEditor, useEditor } from '..'
import { useIsomorphicLayoutEffect } from '../hooks/use-isomorphic-layout-effect'




const String = (props: {
  isLast: boolean
  leaf: Text
  parent: Element
  text: Text
}) => {
  const { isLast, leaf, parent, text } = props
  const editor = useEditor()
  const path = ReactEditor.findPath(editor, text)
  const parentPath = Path.parent(path)

  
  
  if (editor.isVoid(parent)) {
    return <ZeroWidthString length={Node.string(parent).length} />
  }

  
  
  
  if (
    leaf.text === '' &&
    parent.children[parent.children.length - 1] === text &&
    !editor.isInline(parent) &&
    Editor.string(editor, parentPath) === ''
  ) {
    return <ZeroWidthString isLineBreak />
  }

  
  
  
  if (leaf.text === '') {
    return <ZeroWidthString />
  }

  
  
  if (isLast && leaf.text.slice(-1) === '\n') {
    return <TextString isTrailing text={leaf.text} />
  }

  return <TextString text={leaf.text} />
}



const TextString = (props: { text: string; isTrailing?: boolean }) => {
  const { text, isTrailing = false } = props
  const ref: React.RefObject<HTMLSpanElement> = useRef() as any 
  useIsomorphicLayoutEffect(() => {
    
    if (ref.current) {
      let htmlText = ref.current.innerText
      if (isTrailing) {
        htmlText = htmlText.slice(0, -1)
      }
      if (htmlText !== text) {
        ref.current.innerHTML = text + (isTrailing ? '\n' : '')
      }
    }
  })
  return (
    <span data-slate-string ref={ref}>
      {text}
      {isTrailing ? '\n' : null}
    </span>
  )
}



const ZeroWidthString = (props: { length?: number; isLineBreak?: boolean }) => {
  const { length = 0, isLineBreak = false } = props
  const ref: React.RefObject<HTMLSpanElement> = useRef() as any 
  
  
  
  
  
  
  
  
  
  return (
    <span
      data-slate-zero-width={isLineBreak ? 'n' : 'z'}
      data-slate-length={length}
      ref={ref}
    >
      {'\uFEFF'}
      {isLineBreak ? <br /> : null}
    </span>
  )
}

export default String
