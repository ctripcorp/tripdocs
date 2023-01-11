import { ELTYPE } from '@src/components/docs/plugins/config'
import { handleSlateError } from '@src/components/docs/plugins/ErrorHandle/handleSlateError'
import { produce } from 'immer'
import { Editor, Path, Range, Text } from '..'
import { Element, ElementEntry } from './element'



export type BaseNode = Editor | Element | Text
export type Node = Editor | Element | Text

export interface NodeInterface {
  ancestor: (root: Node, path: Path) => Ancestor
  ancestors: (
    root: Node,
    path: Path,
    options?: {
      reverse?: boolean
    }
  ) => Generator<NodeEntry<Ancestor>, void, undefined>
  child: (root: Node, index: number) => Descendant
  children: (
    root: Node,
    path: Path,
    options?: {
      reverse?: boolean
    }
  ) => Generator<NodeEntry<Descendant>, void, undefined>
  common: (root: Node, path: Path, another: Path) => NodeEntry
  descendant: (root: Node, path: Path) => Descendant
  descendants: (
    root: Node,
    options?: {
      from?: Path
      to?: Path
      reverse?: boolean
      pass?: (node: NodeEntry) => boolean
    }
  ) => Generator<NodeEntry<Descendant>, void, undefined>
  elements: (
    root: Node,
    options?: {
      from?: Path
      to?: Path
      reverse?: boolean
      pass?: (node: NodeEntry) => boolean
    }
  ) => Generator<ElementEntry, void, undefined>
  extractProps: (node: Node) => NodeProps
  first: (root: Node, path: Path) => NodeEntry
  fragment: (root: Node, range: Range) => Descendant[]
  get: (root: Node, path: Path) => Node
  has: (root: Node, path: Path) => boolean
  isNode: (value: any) => value is Node
  isNodeList: (value: any) => value is Node[]
  last: (root: Node, path: Path) => NodeEntry
  leaf: (root: Node, path: Path) => Text
  levels: (
    root: Node,
    path: Path,
    options?: {
      reverse?: boolean
    }
  ) => Generator<NodeEntry, void, undefined>
  matches: (node: Node, props: Partial<Node>) => boolean
  nodes: (
    root: Node,
    options?: {
      from?: Path
      to?: Path
      reverse?: boolean
      pass?: (entry: NodeEntry) => boolean
    }
  ) => Generator<NodeEntry, void, undefined>
  parent: (root: Node, path: Path) => Ancestor
  string: (node: Node) => string
  texts: (
    root: Node,
    options?: {
      from?: Path
      to?: Path
      reverse?: boolean
      pass?: (node: NodeEntry) => boolean
    }
  ) => Generator<NodeEntry<Text>, void, undefined>
}

const IS_NODE_LIST_CACHE = new WeakMap<any[], boolean>()

export const Node: NodeInterface = {
  

  ancestor(root: Node, path: Path): Ancestor {
    const node = Node.get(root, path)

    if (Text.isText(node)) {
      handleSlateError( 
        `Cannot get the ancestor node at path [${path}] because it refers to a text node instead: ${node}`
      )
    }

    return node as any
  },

  

  *ancestors(
    root: Node,
    path: Path,
    options: {
      reverse?: boolean
    } = {}
  ): Generator<NodeEntry<Ancestor>, void, undefined> {
    for (const p of Path.ancestors(path, options)) {
      const n = Node.ancestor(root, p)
      const entry: NodeEntry<Ancestor> = [n, p]
      yield entry
    }
  },

  

  child(root: Node, index: number): Descendant {
    if (Text.isText(root)) {
      handleSlateError( 
        `Cannot get the child of a text node: ${JSON.stringify(root)}`
      )
    }

    const c = (root as any).children[index] as Descendant

    if (c == null) {
      handleSlateError( 
        `Cannot get child at index \`${index}\` in node: ${JSON.stringify(
          root
        )}`
      )
    }

    return c
  },

  

  *children(
    root: Node,
    path: Path,
    options: {
      reverse?: boolean
    } = {}
  ): Generator<NodeEntry<Descendant>, void, undefined> {
    const { reverse = false } = options
    const ancestor = Node.ancestor(root, path)
    const { children } = ancestor
    let index = reverse ? children.length - 1 : 0

    while (reverse ? index >= 0 : index < children.length) {
      const child = Node.child(ancestor, index)
      const childPath = path.concat(index)
      yield [child, childPath]
      index = reverse ? index - 1 : index + 1
    }
  },

  

  common(root: Node, path: Path, another: Path): NodeEntry {
    const p = Path.common(path, another)
    const n = Node.get(root, p)
    return [n, p]
  },

  

  descendant(root: Node, path: Path): Descendant {
    const node = Node.get(root, path)

    if (Editor.isEditor(node)) {
      handleSlateError( 
        `Cannot get the descendant node at path [${path}] because it refers to the root editor node instead: ${node}`
      )
    }

    return node
  },

  

  *descendants(
    root: Node,
    options: {
      from?: Path
      to?: Path
      reverse?: boolean
      pass?: (node: NodeEntry) => boolean
    } = {}
  ): Generator<NodeEntry<Descendant>, void, undefined> {
    for (const [node, path] of Node.nodes(root, options)) {
      if (path.length !== 0) {
        
        
        yield [node, path] as NodeEntry<Descendant>
      }
    }
  },

  

  *elements(
    root: Node,
    options: {
      from?: Path
      to?: Path
      reverse?: boolean
      pass?: (node: NodeEntry) => boolean
    } = {}
  ): Generator<ElementEntry, void, undefined> {
    for (const [node, path] of Node.nodes(root, options)) {
      if (Element.isElement(node)) {
        yield [node, path]
      }
    }
  },

  

  extractProps(node: Node): NodeProps {
    if (Element.isAncestor(node)) {
      const { children, ...properties } = node

      return properties
    } else {
      const { text, ...properties } = node

      return properties
    }
  },

  

  first(root: Node, path: Path): NodeEntry {
    const p = path.slice()
    let n = Node.get(root, p)

    while (n) {
      if (Text.isText(n) || n.children.length === 0) {
        break
      } else {
        n = n.children[0]
        p.push(0)
      }
    }

    return [n, p]
  },

  

  fragment(root: Node, range: Range): Descendant[] {
    if (Text.isText(root)) {
      handleSlateError( 
        `Cannot get a fragment starting from a root text node: ${JSON.stringify(
          root
        )}`
      )
    }

    const newRoot = produce({ children: (root as any).children }, r => {
      const [start, end] = Range.edges(range)
      const nodeEntries = Node.nodes(r, {
        reverse: true,
        pass: ([, path]) => !Range.includes(range, path),
      })

      for (const [, path] of nodeEntries) {
        if (!Range.includes(range, path)) {
          const parent = Node.parent(r, path)
          const index = path[path.length - 1]
          parent.children.splice(index, 1)
        }

        if (Path.equals(path, end.path)) {
          const leaf = Node.leaf(r, path)
          leaf.text = leaf.text.slice(0, end.offset)
        }

        if (Path.equals(path, start.path)) {
          const leaf = Node.leaf(r, path)
          leaf.text = leaf.text.slice(start.offset)
        }
      }

      if (Editor.isEditor(r)) {
        r.selection = null
      }
    })

    return newRoot.children
  },

  

  get(root: Node, path: Path): Node {
    let node = root

    for (let i = 0; i < path.length; i++) {
      const p = path[i]

      if (Text.isText(node) || !node.children[p]) {
        handleSlateError( 
          `Cannot find a descendant at path [${path}] in node: ${JSON.stringify(
            root
          )}`
        )
      }

      node = (node as any).children[p]
    }

    return node
  },

  

  has(root: Node, path: Path): boolean {
    let node = root

    for (let i = 0; i < path.length; i++) {
      const p = path[i]

      if (Text.isText(node) || !node.children[p]) {
        return false
      }

      node = node.children[p]
    }

    return true
  },

  

  isNode(value: any): value is Node {
    return (
      Text.isText(value) || Element.isElement(value) || Editor.isEditor(value)
    )
  },

  

  isNodeList(value: any): value is Node[] {
    if (!Array.isArray(value)) {
      return false
    }
    const cachedResult = IS_NODE_LIST_CACHE.get(value)
    if (cachedResult !== undefined) {
      return cachedResult
    }
    const isNodeList = value.every(val => Node.isNode(val))
    IS_NODE_LIST_CACHE.set(value, isNodeList)
    return isNodeList
  },

  

  last(root: Node, path: Path): NodeEntry {
    const p = path.slice()
    let n = Node.get(root, p)

    while (n) {
      if (Text.isText(n) || n.children.length === 0) {
        break
      } else {
        const i = n.children.length - 1
        n = n.children[i]
        p.push(i)
      }
    }

    return [n, p]
  },

  

  leaf(root: Node, path: Path): Text {
    const node = Node.get(root, path)

    if (!Text.isText(node)) {
      
      if(Element.isElement(node)) {
        const nodeType =(node as any).type;
        if(nodeType && [ELTYPE.CARD_SUF, ELTYPE.CARD_PRE].includes(nodeType) ) {
          
          return (node as any).children[0];
        }
      }

      handleSlateError( 
        `Cannot get the leaf node at path [${path}] because it refers to a non-leaf node: ${node}`
      )
    }

    return node as any
  },

  

  *levels(
    root: Node,
    path: Path,
    options: {
      reverse?: boolean
    } = {}
  ): Generator<NodeEntry, void, undefined> {
    for (const p of Path.levels(path, options)) {
      const n = Node.get(root, p)
      yield [n, p]
    }
  },

  

  matches(node: Node, props: Partial<Node>): boolean {
    return (
      (Element.isElement(node) &&
        Element.isElementProps(props) &&
        Element.matches(node, props)) ||
      (Text.isText(node) &&
        Text.isTextProps(props) &&
        Text.matches(node, props))
    )
  },

  

  *nodes(
    root: Node,
    options: {
      from?: Path
      to?: Path
      reverse?: boolean
      pass?: (entry: NodeEntry) => boolean
    } = {}
  ): Generator<NodeEntry, void, undefined> {
    const { pass, reverse = false } = options
    const { from = [], to } = options
    const visited = new Set()
    let p: Path = []
    let n = root

    while (true) {
      if (to && (reverse ? Path.isBefore(p, to) : Path.isAfter(p, to))) {
        break
      }

      if (!visited.has(n)) {
        yield [n, p]
      }

      
      if (
        !visited.has(n) &&
        !Text.isText(n) &&
        n.children.length !== 0 &&
        (pass == null || pass([n, p]) === false)
      ) {
        visited.add(n)
        let nextIndex = reverse ? n.children.length - 1 : 0

        if (Path.isAncestor(p, from)) {
          nextIndex = from[p.length]
        }

        p = p.concat(nextIndex)
        n = Node.get(root, p)
        continue
      }

      
      if (p.length === 0) {
        break
      }

      
      if (!reverse) {
        const newPath = Path.next(p)

        if (Node.has(root, newPath)) {
          p = newPath
          n = Node.get(root, p)
          continue
        }
      }

      
      if (reverse && p[p.length - 1] !== 0) {
        const newPath = Path.previous(p)
        p = newPath
        n = Node.get(root, p)
        continue
      }

      
      p = Path.parent(p)
      n = Node.get(root, p)
      visited.add(n)
    }
  },

  

  parent(root: Node, path: Path): Ancestor {
    const parentPath = Path.parent(path)
    const p:any = Node.get(root, parentPath)

    if (Text.isText(p)) {
      handleSlateError( 
        `Cannot get the parent of path [${path}] because it does not exist in the root.`
      )
    }

    return p
  },

  

  string(node: Node): string {
    if (Text.isText(node)) {
      return node.text
    } else {
      return node.children.map(Node.string).join('')
    }
  },

  

  *texts(
    root: Node,
    options: {
      from?: Path
      to?: Path
      reverse?: boolean
      pass?: (node: NodeEntry) => boolean
    } = {}
  ): Generator<NodeEntry<Text>, void, undefined> {
    for (const [node, path] of Node.nodes(root, options)) {
      if (Text.isText(node)) {
        yield [node, path]
      }
    }
  },
}



export type Descendant = Element | Text



export type Ancestor = Editor | Element



export type NodeEntry<T extends Node = Node> = [T, Path]


export type NodeProps =
  | Omit<Editor, 'children'>
  | Omit<Element, 'children'>
  | Omit<Text, 'text'>
