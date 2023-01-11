import React from 'react'
import { Element, Text } from "@src/components/slate-packages/slate"
import { PLACEHOLDER_SYMBOL } from '../utils/weak-maps'
import { RenderLeafProps } from './editable'
import String from './string'




const Leaf = (props: {
  isLast: boolean
  leaf: Text
  parent: Element
  renderLeaf?: (props: RenderLeafProps) => JSX.Element
  text: Text
}) => {
  const {
    leaf,
    isLast,
    text,
    parent,
    renderLeaf = (props: RenderLeafProps) => <DefaultLeaf {...props} />,
  } = props

  let children = (
    <String isLast={isLast} leaf={leaf} parent={parent} text={text} />
  )

  if (leaf[PLACEHOLDER_SYMBOL]) {
    children = (
      <React.Fragment>
        <span
          contentEditable={false}
          style={{
            pointerEvents: 'none',
            display: 'inline-block',
            width: '0',
            maxWidth: '100%',
            whiteSpace: 'nowrap',
            opacity: '0.333',
            userSelect: 'none',
            fontStyle: 'normal',
            fontWeight: 'normal',
            textDecoration: 'none',
          }}
        >
          {(leaf as any).placeholder as React.ReactNode}
        </span>
        {children}
      </React.Fragment>
    )
  }

  
  
  
  const attributes: {
    'data-slate-leaf': true
  } = {
    'data-slate-leaf': true,
  }

  return renderLeaf({ attributes, children, leaf, text })
}

const MemoizedLeaf = React.memo(Leaf, (prev, next) => {
  return (
    next.parent === prev.parent &&
    next.isLast === prev.isLast &&
    next.renderLeaf === prev.renderLeaf &&
    next.text === prev.text &&
    Text.matches(next.leaf, prev.leaf)
  )
})



export const DefaultLeaf = (props: RenderLeafProps) => {
  const { attributes, children } = props
  return <span {...attributes}>{children}</span>
}

export default MemoizedLeaf
