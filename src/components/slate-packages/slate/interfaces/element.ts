import isPlainObject from 'is-plain-object'
import { Editor, Node, Path, Descendant, ExtendedType, Ancestor } from '..'



export interface BaseElement {
  children: Descendant[];
  anchorId?: string;
}

export type Element = ExtendedType<'Element', BaseElement>

export interface ElementInterface {
  isAncestor: (value: any) => value is Ancestor
  isElement: (value: any) => value is Element
  isElementList: (value: any) => value is Element[]
  isElementProps: (props: any) => props is Partial<Element>
  isElementType: <T extends Element>(
    value: any,
    elementVal: string,
    elementKey?: string
  ) => value is T
  matches: (element: Element, props: Partial<Element>) => boolean
}


const isElement = (value: any): value is Element => {
  return (
    isPlainObject(value) &&
    Node.isNodeList(value.children) &&
    !Editor.isEditor(value)
  )
}

export const Element: ElementInterface = {
  

  isAncestor(value: any): value is Ancestor {
    return isPlainObject(value) && Node.isNodeList(value.children)
  },

  

  isElement,
  

  isElementList(value: any): value is Element[] {
    return Array.isArray(value) && value.every(val => Element.isElement(val))
  },

  

  isElementProps(props: any): props is Partial<Element> {
    return (props as Partial<Element>).children !== undefined
  },

  

  isElementType: <T extends Element>(
    value: any,
    elementVal: string,
    elementKey: string = 'type'
  ): value is T => {
    return isElement(value) && value[elementKey] === elementVal
  },

  

  matches(element: Element, props: Partial<Element>): boolean {
    for (const key in props) {
      if (key === 'children') {
        continue
      }

      if (element[key] !== props[key]) {
        return false
      }
    }

    return true
  },
}



export type ElementEntry = [Element, Path]
