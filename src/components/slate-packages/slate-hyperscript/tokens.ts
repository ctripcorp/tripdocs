import { Node, Path, Text } from "@src/components/slate-packages/slate"



const ANCHOR: WeakMap<Node, [number, AnchorToken]> = new WeakMap()



const FOCUS: WeakMap<Node, [number, FocusToken]> = new WeakMap()



export class Token { }



export class AnchorToken extends Token {
  offset?: number
  path?: Path

  constructor(
    props: {
      offset?: number
      path?: Path
    } = {}
  ) {
    super()
    const { offset, path } = props
    this.offset = offset
    this.path = path
  }
}



export class FocusToken extends Token {
  offset?: number
  path?: Path

  constructor(
    props: {
      offset?: number
      path?: Path
    } = {}
  ) {
    super()
    const { offset, path } = props
    this.offset = offset
    this.path = path
  }
}



export const addAnchorToken = (text: Text, token: AnchorToken) => {
  const offset = text.text.length
  ANCHOR.set(text, [offset, token])
}



export const getAnchorOffset = (
  text: Text
): [number, AnchorToken] | undefined => {
  return ANCHOR.get(text)
}



export const addFocusToken = (text: Text, token: FocusToken) => {
  const offset = text.text.length
  FOCUS.set(text, [offset, token])
}



export const getFocusOffset = (
  text: Text
): [number, FocusToken] | undefined => {
  return FOCUS.get(text)
}
