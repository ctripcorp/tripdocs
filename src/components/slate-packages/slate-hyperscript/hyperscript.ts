import isPlainObject from 'is-plain-object'
import { Element } from "@src/components/slate-packages/slate"
import {
  createAnchor,
  createCursor,
  createEditor,
  createElement,
  createFocus,
  createFragment,
  createSelection,
  createText
} from './creators'
import { handleSlateError } from '@src/components/docs/plugins/ErrorHandle/handleSlateError'



const DEFAULT_CREATORS = {
  anchor: createAnchor,
  cursor: createCursor,
  editor: createEditor,
  element: createElement,
  focus: createFocus,
  fragment: createFragment,
  selection: createSelection,
  text: createText,
}



type HyperscriptCreators<T = any> = Record<
  string,
  (tagName: string, attributes: { [key: string]: any }, children: any[]) => T
>



type HyperscriptShorthands = Record<string, Record<string, any>>



const createHyperscript = (
  options: {
    creators?: HyperscriptCreators
    elements?: HyperscriptShorthands
  } = {}
) => {
  const { elements = {} } = options
  const elementCreators = normalizeElements(elements)
  const creators = {
    ...DEFAULT_CREATORS,
    ...elementCreators,
    ...options.creators,
  }

  const jsx = createFactory(creators)
  return jsx
}



const createFactory = <T extends HyperscriptCreators>(creators: T) => {
  const jsx = <S extends keyof T & string>(
    tagName: S,
    attributes?: Object,
    ...children: any[]
  ): ReturnType<T[S]> => {
    const creator = creators[tagName]

    if (!creator) {
      handleSlateError( `No hyperscript creator found for tag: <${tagName}>`)
      return
    }

    if (attributes == null) {
      attributes = {}
    }

    if (!isPlainObject(attributes)) {
      children = [attributes].concat(children)
      attributes = {}
    }

    children = children.filter(child => Boolean(child)).flat()
    const ret = creator(tagName, attributes, children)
    return ret
  }

  return jsx
}



const normalizeElements = (elements: HyperscriptShorthands) => {
  const creators: HyperscriptCreators<Element> = {}

  for (const tagName in elements) {
    const props = elements[tagName]

    if (typeof props !== 'object') {
      handleSlateError( 
        `Properties specified for a hyperscript shorthand should be an object, but for the custom element <${tagName}>  tag you passed: ${props}`
      )
      return
    }

    creators[tagName] = (
      tagName: string,
      attributes: { [key: string]: any },
      children: any[]
    ) => {
      return createElement('element', { ...props, ...attributes }, children)
    }
  }

  return creators
}

export { createHyperscript }
export type { HyperscriptCreators, HyperscriptShorthands }

