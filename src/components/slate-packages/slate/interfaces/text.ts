import isPlainObject  from 'is-plain-object'
import { Range } from '..'
import { ExtendedType } from './custom-types'
import { isDeepEqual } from '../utils/deep-equal'



export interface BaseText {
  text: string
}

export type Text = ExtendedType<'Text', BaseText>

export interface TextInterface {
  equals: (text: Text, another: Text, options?: { loose?: boolean }) => boolean
  isText: (value: any) => value is Text
  isTextList: (value: any) => value is Text[]
  isTextProps: (props: any) => props is Partial<Text>
  matches: (text: Text, props: Partial<Text>) => boolean
  decorations: (node: Text, decorations: Range[]) => Text[]
}

export const Text: TextInterface = {
  
  equals(
    text: Text,
    another: Text,
    options: { loose?: boolean } = {}
  ): boolean {
    const { loose = false } = options

    function omitText(obj: Record<any, any>) {
      const { text, anchorId, ...rest } = obj

      return rest
    }

    return isDeepEqual(
      loose ? omitText(text) : text,
      loose ? omitText(another) : another
    )
  },

  

  isText(value: any): value is Text {
    return isPlainObject(value) && typeof value.text === 'string'
  },

  

  isTextList(value: any): value is Text[] {
    return Array.isArray(value) && value.every(val => Text.isText(val))
  },

  

  isTextProps(props: any): props is Partial<Text> {
    return (props as Partial<Text>).text !== undefined
  },

  

  matches(text: Text, props: Partial<Text>): boolean {
    for (const key in props) {
      if (key === 'text') {
        continue
      }

      if (!text.hasOwnProperty(key) || text[key] !== props[key]) {
        return false
      }
    }

    return true
  },

  

  decorations(node: Text, decorations: Range[]): Text[] {
    let leaves: Text[] = [{ ...node }]

    for (const dec of decorations) {
      const { anchor, focus, ...rest } = dec
      const [start, end] = Range.edges(dec)
      const next = []
      let o = 0

      for (const leaf of leaves) {
        const { length } = leaf.text
        const offset = o
        o += length

        
        if (start.offset <= offset && end.offset >= o) {
          Object.assign(leaf, rest)
          next.push(leaf)
          continue
        }

        
        if (
          (start.offset !== end.offset &&
            (start.offset === o || end.offset === offset)) ||
          start.offset > o ||
          end.offset < offset ||
          (end.offset === offset && offset !== 0)
        ) {
          next.push(leaf)
          continue
        }

        
        
        
        let middle = leaf
        let before
        let after

        if (end.offset < o) {
          const off = end.offset - offset
          after = { ...middle, text: middle.text.slice(off) }
          middle = { ...middle, text: middle.text.slice(0, off) }
        }

        if (start.offset > offset) {
          const off = start.offset - offset
          before = { ...middle, text: middle.text.slice(0, off) }
          middle = { ...middle, text: middle.text.slice(off) }
        }

        Object.assign(middle, rest)

        if (before) {
          next.push(before)
        }

        next.push(middle)

        if (after) {
          next.push(after)
        }
      }

      leaves = next
    }

    return leaves
  },
}
