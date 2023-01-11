import isPlainObject from 'is-plain-object'

import {
  Ancestor,
  ExtendedType,
  Location,
  Node,
  NodeEntry,
  Operation,
  Path,
  PathRef,
  Point,
  PointRef,
  Range,
  RangeRef,
  Span,
  Text,
  Transforms,
} from '..'
import {
  DIRTY_PATHS,
  NORMALIZING,
  PATH_REFS,
  POINT_REFS,
  RANGE_REFS,
} from '../utils/weak-maps'
import {
  getWordDistance,
  getCharacterDistance,
  splitByCharacterDistance,
} from '../utils/string'
import { Descendant } from './node'
import { Element } from './element'
import { handleSlateError } from '@src/components/docs/plugins/ErrorHandle/handleSlateError'

export type BaseSelection = Range | null

export type Selection = ExtendedType<'Selection', BaseSelection>



export interface BaseEditor {
  docId?: string
  children: Descendant[]
  selection: Selection
  operations: Operation[]
  marks: Omit<Text, 'text'> | null

  
  isInline: (element: Element) => boolean
  isVoid: (element: Element) => boolean
  normalizeNode: (entry: NodeEntry) => void
  onChange: () => void

  
  addMark: (key: string, value: any) => void
  apply: (operation: Operation) => void
  deleteBackward: (unit: 'character' | 'word' | 'line' | 'block') => void
  deleteForward: (unit: 'character' | 'word' | 'line' | 'block') => void
  deleteFragment: (direction?: 'forward' | 'backward') => void
  getFragment: () => Descendant[]
  insertBreak: () => void
  insertFragment: (fragment: Node[]) => void
  insertNode: (node: Node) => void
  insertText: (text: string) => void
  removeMark: (key: string) => void
}

export type Editor = ExtendedType<'Editor', BaseEditor>

export interface EditorInterface {
  above: <T extends Ancestor>(
    editor: Editor,
    options?: {
      at?: Location
      match?: NodeMatch<T>
      mode?: 'highest' | 'lowest'
      voids?: boolean
    }
  ) => NodeEntry<T> | undefined
  addMark: (editor: Editor, key: string, value: any) => void
  after: (
    editor: Editor,
    at: Location,
    options?: {
      distance?: number
      unit?: 'offset' | 'character' | 'word' | 'line' | 'block'
      voids?: boolean
    }
  ) => Point | undefined
  before: (
    editor: Editor,
    at: Location,
    options?: {
      distance?: number
      unit?: 'offset' | 'character' | 'word' | 'line' | 'block'
      voids?: boolean
    }
  ) => Point | undefined
  deleteBackward: (
    editor: Editor,
    options?: {
      unit?: 'character' | 'word' | 'line' | 'block'
    }
  ) => void
  deleteForward: (
    editor: Editor,
    options?: {
      unit?: 'character' | 'word' | 'line' | 'block'
    }
  ) => void
  deleteFragment: (
    editor: Editor,
    options?: {
      direction?: 'forward' | 'backward'
    }
  ) => void
  edges: (editor: Editor, at: Location) => [Point, Point]
  end: (editor: Editor, at: Location) => Point
  first: (editor: Editor, at: Location) => NodeEntry
  fragment: (editor: Editor, at: Location) => Descendant[]
  hasBlocks: (editor: Editor, element: Element) => boolean
  hasInlines: (editor: Editor, element: Element) => boolean
  hasPath: (editor: Editor, path: Path) => boolean
  hasTexts: (editor: Editor, element: Element) => boolean
  insertBreak: (editor: Editor) => void
  insertFragment: (editor: Editor, fragment: Node[]) => void
  insertNode: (editor: Editor, node: Node) => void
  insertText: (editor: Editor, text: string) => void
  isBlock: (editor: Editor, value: any) => value is Element
  isEditor: (value: any) => value is Editor
  isEnd: (editor: Editor, point: Point, at: Location) => boolean
  isEdge: (editor: Editor, point: Point, at: Location) => boolean
  isEmpty: (editor: Editor, element: Element) => boolean
  isInline: (editor: Editor, value: any) => value is Element
  isNormalizing: (editor: Editor) => boolean
  isStart: (editor: Editor, point: Point, at: Location) => boolean
  isVoid: (editor: Editor, value: any) => value is Element
  last: (editor: Editor, at: Location) => NodeEntry
  leaf: (
    editor: Editor,
    at: Location,
    options?: {
      depth?: number
      edge?: 'start' | 'end'
    }
  ) => NodeEntry<Text>
  levels: <T extends Node>(
    editor: Editor,
    options?: {
      at?: Location
      match?: NodeMatch<T>
      reverse?: boolean
      voids?: boolean
    }
  ) => Generator<NodeEntry<T>, void, undefined>
  marks: (editor: Editor) => Omit<Text, 'text'> | null
  next: <T extends Descendant>(
    editor: Editor,
    options?: {
      at?: Location
      match?: NodeMatch<T>
      mode?: 'all' | 'highest' | 'lowest'
      voids?: boolean
    }
  ) => NodeEntry<T> | undefined
  node: (
    editor: Editor,
    at: Location,
    options?: {
      depth?: number
      edge?: 'start' | 'end'
    }
  ) => NodeEntry
  nodes: <T extends Node>(
    editor: Editor,
    options?: {
      at?: Location | Span
      match?: NodeMatch<T>
      mode?: 'all' | 'highest' | 'lowest'
      universal?: boolean
      reverse?: boolean
      voids?: boolean
    }
  ) => Generator<NodeEntry<T>, void, undefined>
  normalize: (
    editor: Editor,
    options?: {
      force?: boolean
    }
  ) => void
  parent: (
    editor: Editor,
    at: Location,
    options?: {
      depth?: number
      edge?: 'start' | 'end'
    }
  ) => NodeEntry<Ancestor>
  path: (
    editor: Editor,
    at: Location,
    options?: {
      depth?: number
      edge?: 'start' | 'end'
    }
  ) => Path
  pathRef: (
    editor: Editor,
    path: Path,
    options?: {
      affinity?: 'backward' | 'forward' | null
    }
  ) => PathRef
  pathRefs: (editor: Editor) => Set<PathRef>
  point: (
    editor: Editor,
    at: Location,
    options?: {
      edge?: 'start' | 'end'
    }
  ) => Point
  pointRef: (
    editor: Editor,
    point: Point,
    options?: {
      affinity?: 'backward' | 'forward' | null
    }
  ) => PointRef
  pointRefs: (editor: Editor) => Set<PointRef>
  positions: (
    editor: Editor,
    options?: {
      at?: Location
      unit?: 'offset' | 'character' | 'word' | 'line' | 'block'
      reverse?: boolean
      voids?: boolean
    }
  ) => Generator<Point, void, undefined>
  previous: <T extends Node>(
    editor: Editor,
    options?: {
      at?: Location
      match?: NodeMatch<T>
      mode?: 'all' | 'highest' | 'lowest'
      voids?: boolean
    }
  ) => NodeEntry<T> | undefined
  range: (editor: Editor, at: Location, to?: Location) => Range
  rangeRef: (
    editor: Editor,
    range: Range,
    options?: {
      affinity?: 'backward' | 'forward' | 'outward' | 'inward' | null
    }
  ) => RangeRef
  rangeRefs: (editor: Editor) => Set<RangeRef>
  removeMark: (editor: Editor, key: string) => void
  setNormalizing: (editor: Editor, isNormalizing: boolean) => void
  start: (editor: Editor, at: Location) => Point
  string: (
    editor: Editor,
    at: Location,
    options?: {
      voids?: boolean
    }
  ) => string
  unhangRange: (
    editor: Editor,
    range: Range,
    options?: {
      voids?: boolean
    }
  ) => Range
  void: (
    editor: Editor,
    options?: {
      at?: Location
      mode?: 'highest' | 'lowest'
      voids?: boolean
    }
  ) => NodeEntry<Element> | undefined
  withoutNormalizing: (editor: Editor, fn: () => void) => void
}

const IS_EDITOR_CACHE = new WeakMap<object, boolean>()

export const Editor: EditorInterface = {
  

  above<T extends Ancestor>(
    editor: Editor,
    options: {
      at?: Location
      match?: NodeMatch<T>
      mode?: 'highest' | 'lowest'
      voids?: boolean
    } = {}
  ): NodeEntry<T> | undefined {
    const {
      voids = false,
      mode = 'lowest',
      at = editor.selection,
      match,
    } = options

    if (!at) {
      return
    }

    const path = Editor.path(editor, at)
    const reverse = mode === 'lowest'

    for (const [n, p] of Editor.levels(editor, {
      at: path,
      voids,
      match,
      reverse,
    })) {
      if (!Text.isText(n) && !Path.equals(path, p)) {
        return [n, p]
      }
    }
  },

  

  addMark(editor: Editor, key: string, value: any): void {
    editor.addMark(key, value)
  },

  

  after(
    editor: Editor,
    at: Location,
    options: {
      distance?: number
      unit?: 'offset' | 'character' | 'word' | 'line' | 'block'
      voids?: boolean
    } = {}
  ): Point | undefined {
    const anchor = Editor.point(editor, at, { edge: 'end' })
    const focus = Editor.end(editor, [])
    const range = { anchor, focus }
    const { distance = 1 } = options
    let d = 0
    let target

    for (const p of Editor.positions(editor, {
      ...options,
      at: range,
    })) {
      if (d > distance) {
        break
      }

      if (d !== 0) {
        target = p
      }

      d++
    }

    return target
  },

  

  before(
    editor: Editor,
    at: Location,
    options: {
      distance?: number
      unit?: 'offset' | 'character' | 'word' | 'line' | 'block'
      voids?: boolean
    } = {}
  ): Point | undefined {
    const anchor = Editor.start(editor, [])
    const focus = Editor.point(editor, at, { edge: 'start' })
    const range = { anchor, focus }
    const { distance = 1 } = options
    let d = 0
    let target

    for (const p of Editor.positions(editor, {
      ...options,
      at: range,
      reverse: true,
    })) {
      if (d > distance) {
        break
      }

      if (d !== 0) {
        target = p
      }

      d++
    }

    return target
  },

  

  deleteBackward(
    editor: Editor,
    options: {
      unit?: 'character' | 'word' | 'line' | 'block'
    } = {}
  ): void {
    const { unit = 'character' } = options
    editor.deleteBackward(unit)
  },

  

  deleteForward(
    editor: Editor,
    options: {
      unit?: 'character' | 'word' | 'line' | 'block'
    } = {}
  ): void {
    const { unit = 'character' } = options
    editor.deleteForward(unit)
  },

  

  deleteFragment(
    editor: Editor,
    options: {
      direction?: 'forward' | 'backward'
    } = {}
  ): void {
    const { direction = 'forward' } = options
    editor.deleteFragment(direction)
  },

  

  edges(editor: Editor, at: Location): [Point, Point] {
    return [Editor.start(editor, at), Editor.end(editor, at)]
  },

  

  end(editor: Editor, at: Location): Point {
    return Editor.point(editor, at, { edge: 'end' })
  },

  

  first(editor: Editor, at: Location): NodeEntry {
    const path = Editor.path(editor, at, { edge: 'start' })
    return Editor.node(editor, path)
  },

  

  fragment(editor: Editor, at: Location): Descendant[] {
    const range = Editor.range(editor, at)
    const fragment = Node.fragment(editor, range)
    return fragment
  },
  

  hasBlocks(editor: Editor, element: Element): boolean {
    return element.children.some(n => Editor.isBlock(editor, n))
  },

  

  hasInlines(editor: Editor, element: Element): boolean {
    return element.children.some(
      n => Text.isText(n) || Editor.isInline(editor, n)
    )
  },

  

  hasTexts(editor: Editor, element: Element): boolean {
    return element.children.every(n => Text.isText(n))
  },

  

  insertBreak(editor: Editor): void {
    editor.insertBreak()
  },

  

  insertFragment(editor: Editor, fragment: Node[]): void {
    editor.insertFragment(fragment)
  },

  

  insertNode(editor: Editor, node: Node): void {
    editor.insertNode(node)
  },

  

  insertText(editor: Editor, text: string): void {
    editor.insertText(text)
  },

  

  isBlock(editor: Editor, value: any): value is Element {
    return Element.isElement(value) && !editor.isInline(value)
  },

  

  isEditor(value: any): value is Editor {
    if (!isPlainObject(value)) return false
    const cachedIsEditor = IS_EDITOR_CACHE.get(value)
    if (cachedIsEditor !== undefined) {
      return cachedIsEditor
    }
    const isEditor =
      typeof value.addMark === 'function' &&
      typeof value.apply === 'function' &&
      typeof value.deleteBackward === 'function' &&
      typeof value.deleteForward === 'function' &&
      typeof value.deleteFragment === 'function' &&
      typeof value.insertBreak === 'function' &&
      typeof value.insertFragment === 'function' &&
      typeof value.insertNode === 'function' &&
      typeof value.insertText === 'function' &&
      typeof value.isInline === 'function' &&
      typeof value.isVoid === 'function' &&
      typeof value.normalizeNode === 'function' &&
      typeof value.onChange === 'function' &&
      typeof value.removeMark === 'function' &&
      (value.marks === null || isPlainObject(value.marks)) &&
      (value.selection === null || Range.isRange(value.selection)) &&
      Node.isNodeList(value.children) &&
      Operation.isOperationList(value.operations)
    IS_EDITOR_CACHE.set(value, isEditor)
    return isEditor
  },

  

  isEnd(editor: Editor, point: Point, at: Location): boolean {
    const end = Editor.end(editor, at)
    return Point.equals(point, end)
  },

  

  isEdge(editor: Editor, point: Point, at: Location): boolean {
    return Editor.isStart(editor, point, at) || Editor.isEnd(editor, point, at)
  },

  

  isEmpty(editor: Editor, element: Element): boolean {
    const { children } = element
    const [first] = children
    return (
      children.length === 0 ||
      (children.length === 1 &&
        Text.isText(first) &&
        first.text === '' &&
        !editor.isVoid(element))
    )
  },

  

  isInline(editor: Editor, value: any): value is Element {
    return Element.isElement(value) && editor.isInline(value)
  },

  

  isNormalizing(editor: Editor): boolean {
    const isNormalizing = NORMALIZING.get(editor)
    return isNormalizing === undefined ? true : isNormalizing
  },

  

  isStart(editor: Editor, point: Point, at: Location): boolean {
    
    if (point.offset !== 0) {
      return false
    }

    const start = Editor.start(editor, at)
    return Point.equals(point, start)
  },

  

  isVoid(editor: Editor, value: any): value is Element {
    return Element.isElement(value) && editor.isVoid(value)
  },

  

  last(editor: Editor, at: Location): NodeEntry {
    const path = Editor.path(editor, at, { edge: 'end' })
    return Editor.node(editor, path)
  },

  

  leaf(
    editor: Editor,
    at: Location,
    options: {
      depth?: number
      edge?: 'start' | 'end'
    } = {}
  ): NodeEntry<Text> {
    const path = Editor.path(editor, at, options)
    const node = Node.leaf(editor, path)
    return [node, path]
  },

  

  *levels<T extends Node>(
    editor: Editor,
    options: {
      at?: Location
      match?: NodeMatch<T>
      reverse?: boolean
      voids?: boolean
    } = {}
  ): Generator<NodeEntry<T>, void, undefined> {
    const { at = editor.selection, reverse = false, voids = false } = options
    let { match } = options

    if (match == null) {
      match = () => true
    }

    if (!at) {
      return
    }

    const levels: NodeEntry<T>[] = []
    const path = Editor.path(editor, at)

    for (const [n, p] of Node.levels(editor, path)) {
      if (!match(n, p)) {
        continue
      }

      levels.push([n, p])

      if (!voids && Editor.isVoid(editor, n)) {
        break
      }
    }

    if (reverse) {
      levels.reverse()
    }

    yield* levels
  },

  

  marks(editor: Editor): Omit<Text, 'text'> | null {
    const { marks, selection } = editor

    if (!selection) {
      return null
    }

    if (marks) {
      return marks
    }

    if (Range.isExpanded(selection)) {
      const [match] = Editor.nodes(editor, { match: Text.isText })

      if (match) {
        const [node] = match as NodeEntry<Text>
        const { text, ...rest } = node
        return rest
      } else {
        return {}
      }
    }

    const { anchor } = selection
    const { path } = anchor
    let [node] = Editor.leaf(editor, path)

    if (anchor.offset === 0) {
      const prev = Editor.previous(editor, { at: path, match: Text.isText })
      const block = Editor.above(editor, {
        match: (n:any)  => Editor.isBlock(editor, n),
      })

      if (prev && block) {
        const [prevNode, prevPath] = prev
        const [, blockPath] = block

        if (Path.isAncestor(blockPath, prevPath)) {
          node = prevNode as Text
        }
      }
    }

    const { text, ...rest } = node
    return rest
  },

  

  next<T extends Descendant>(
    editor: Editor,
    options: {
      at?: Location
      match?: NodeMatch<T>
      mode?: 'all' | 'highest' | 'lowest'
      voids?: boolean
    } = {}
  ): NodeEntry<T> | undefined {
    const { mode = 'lowest', voids = false } = options
    let { match, at = editor.selection } = options

    if (!at) {
      return
    }

    const pointAfterLocation = Editor.after(editor, at, { voids })

    if (!pointAfterLocation) return

    const [, to] = Editor.last(editor, [])

    const span: Span = [pointAfterLocation.path, to]

    if (Path.isPath(at) && at.length === 0) {
      handleSlateError( `Cannot get the next node from the root node!`, editor)
    }

    if (match == null) {
      if (Path.isPath(at)) {
        const [parent] = Editor.parent(editor, at)
        match = n => parent.children.includes(n)
      } else {
        match = () => true
      }
    }

    const [next] = Editor.nodes(editor, { at: span, match, mode, voids })
    return next
  },

  

  node(
    editor: Editor,
    at: Location,
    options: {
      depth?: number
      edge?: 'start' | 'end'
    } = {}
  ): NodeEntry {
    const path = Editor.path(editor, at, options)
    const node = Node.get(editor, path)
    return [node, path]
  },

  

  *nodes<T extends Node>(
    editor: Editor,
    options: {
      at?: Location | Span
      match?: NodeMatch<T>
      mode?: 'all' | 'highest' | 'lowest'
      universal?: boolean
      reverse?: boolean
      voids?: boolean
    } = {}
  ): Generator<NodeEntry<T>, void, undefined> {
    const {
      at = editor.selection,
      mode = 'all',
      universal = false,
      reverse = false,
      voids = false,
    } = options
    let { match } = options

    if (!match) {
      match = () => true
    }

    if (!at) {
      return
    }

    let from
    let to

    if (Span.isSpan(at)) {
      from = at[0]
      to = at[1]
    } else {
      const first = Editor.path(editor, at, { edge: 'start' })
      const last = Editor.path(editor, at, { edge: 'end' })
      from = reverse ? last : first
      to = reverse ? first : last
    }

    const nodeEntries = Node.nodes(editor, {
      reverse,
      from,
      to,
      pass: ([n]) => (voids ? false : Editor.isVoid(editor, n)),
    })

    const matches: NodeEntry<T>[] = []
    let hit: NodeEntry<T> | undefined

    for (const [node, path] of nodeEntries) {
      const isLower = hit && Path.compare(path, hit[1]) === 0

      
      if (mode === 'highest' && isLower) {
        continue
      }

      if (!match(node, path)) {
        
        
        
        if (universal && !isLower && Text.isText(node)) {
          return
        } else {
          continue
        }
      }

      
      if (mode === 'lowest' && isLower) {
        hit = [node, path]
        continue
      }

      
      const emit: NodeEntry<T> | undefined =
        mode === 'lowest' ? hit : [node, path]

      if (emit) {
        if (universal) {
          matches.push(emit)
        } else {
          yield emit
        }
      }

      hit = [node, path]
    }

    
    if (mode === 'lowest' && hit) {
      if (universal) {
        matches.push(hit)
      } else {
        yield hit
      }
    }

    
    
    if (universal) {
      yield* matches
    }
  },
  

  normalize(
    editor: Editor,
    options: {
      force?: boolean
    } = {}
  ): void {
    const { force = false } = options
    const getDirtyPaths = (editor: Editor) => {
      return DIRTY_PATHS.get(editor) || []
    }

    if (!Editor.isNormalizing(editor)) {
      return
    }

    if (force) {
      const allPaths = Array.from(Node.nodes(editor), ([, p]) => p)
      DIRTY_PATHS.set(editor, allPaths)
    }

    if (getDirtyPaths(editor).length === 0) {
      return
    }

    Editor.withoutNormalizing(editor, () => {
      
      for (const dirtyPath of getDirtyPaths(editor)) {
        if (Node.has(editor, dirtyPath)) {
          const entry = Editor.node(editor, dirtyPath)
          const [node, _] = entry

          
          if (Element.isElement(node) && node.children.length === 0) {
            editor.normalizeNode(entry)
          }
        }
      }

      const max = getDirtyPaths(editor).length * 42 
      let m = 0

      while (getDirtyPaths(editor).length !== 0) {
        if (m > max) {
          handleSlateError( `
            Could not completely normalize the editor after ${max} iterations! This is usually due to incorrect normalization logic that leaves a node in an invalid state.
          `, editor)
        }

        const dirtyPath = getDirtyPaths(editor).pop()!

        
        if (Node.has(editor, dirtyPath)) {
          const entry = Editor.node(editor, dirtyPath)
          editor.normalizeNode(entry)
        }
        m++
      }
    })
  },

  

  parent(
    editor: Editor,
    at: Location,
    options: {
      depth?: number
      edge?: 'start' | 'end'
    } = {}
  ): NodeEntry<Ancestor> {
    const path = Editor.path(editor, at, options)
    const parentPath = Path.parent(path)
    const entry = Editor.node(editor, parentPath)
    return entry as NodeEntry<Ancestor>
  },

  

  path(
    editor: Editor,
    at: Location,
    options: {
      depth?: number
      edge?: 'start' | 'end'
    } = {}
  ): Path {
    const { depth, edge } = options

    if (Path.isPath(at)) {
      if (edge === 'start') {
        const [, firstPath] = Node.first(editor, at)
        at = firstPath
      } else if (edge === 'end') {
        const [, lastPath] = Node.last(editor, at)
        at = lastPath
      }
    }

    if (Range.isRange(at)) {
      if (edge === 'start') {
        at = Range.start(at)
      } else if (edge === 'end') {
        at = Range.end(at)
      } else {
        at = Path.common(at.anchor.path, at.focus.path)
      }
    }

    if (Point.isPoint(at)) {
      at = at.path
    }

    if (depth != null) {
      at = at.slice(0, depth)
    }

    return at
  },

  hasPath(editor: Editor, path: Path): boolean {
    return Node.has(editor, path)
  },

  

  pathRef(
    editor: Editor,
    path: Path,
    options: {
      affinity?: 'backward' | 'forward' | null
    } = {}
  ): PathRef {
    const { affinity = 'forward' } = options
    const ref: PathRef = {
      current: path,
      affinity,
      unref() {
        const { current } = ref
        const pathRefs = Editor.pathRefs(editor)
        pathRefs.delete(ref)
        ref.current = null
        return current
      },
    }

    const refs = Editor.pathRefs(editor)
    refs.add(ref)
    return ref
  },

  

  pathRefs(editor: Editor): Set<PathRef> {
    let refs = PATH_REFS.get(editor)

    if (!refs) {
      refs = new Set()
      PATH_REFS.set(editor, refs)
    }

    return refs
  },

  

  point(
    editor: Editor,
    at: Location,
    options: {
      edge?: 'start' | 'end'
    } = {}
  ): Point {
    const { edge = 'start' } = options

    if (Path.isPath(at)) {
      let path

      if (edge === 'end') {
        const [, lastPath] = Node.last(editor, at)
        path = lastPath
      } else {
        const [, firstPath] = Node.first(editor, at)
        path = firstPath
      }

      const node:any = Node.get(editor, path)

      if (!Text.isText(node)) {
        handleSlateError( 
          `Cannot get the ${edge} point in the node at path [${at}] because it has no ${edge} text node.`, editor
        )
      }
      
      return {
        path, offset: edge === 'end' ?
          node.text ?
            node.text.length :
            node.children && node.children.length ?
              node.children[0]?.text?.length : 0
          : 0
      }
    }

    if (Range.isRange(at)) {
      const [start, end] = Range.edges(at)
      return edge === 'start' ? start : end
    }

    return at
  },

  

  pointRef(
    editor: Editor,
    point: Point,
    options: {
      affinity?: 'backward' | 'forward' | null
    } = {}
  ): PointRef {
    const { affinity = 'forward' } = options
    const ref: PointRef = {
      current: point,
      affinity,
      unref() {
        const { current } = ref
        const pointRefs = Editor.pointRefs(editor)
        pointRefs.delete(ref)
        ref.current = null
        return current
      },
    }

    const refs = Editor.pointRefs(editor)
    refs.add(ref)
    return ref
  },

  

  pointRefs(editor: Editor): Set<PointRef> {
    let refs = POINT_REFS.get(editor)

    if (!refs) {
      refs = new Set()
      POINT_REFS.set(editor, refs)
    }

    return refs
  },

  

  *positions(
    editor: Editor,
    options: {
      at?: Location
      unit?: 'offset' | 'character' | 'word' | 'line' | 'block'
      reverse?: boolean
      voids?: boolean
    } = {}
  ): Generator<Point, void, undefined> {
    const {
      at = editor.selection,
      unit = 'offset',
      reverse = false,
      voids = false,
    } = options

    if (!at) {
      return
    }

    

    const range = Editor.range(editor, at)
    const [start, end] = Range.edges(range)
    const first = reverse ? end : start
    let isNewBlock = false
    let blockText = ''
    let distance = 0 
    let leafTextRemaining = 0
    let leafTextOffset = 0

    
    
    
    
    
    
    for (const [node, path] of Editor.nodes(editor, { at, reverse, voids })) {
      
      if (Element.isElement(node)) {
        
        
        
        if (!voids && editor.isVoid(node)) {
          yield Editor.start(editor, path)
          continue
        }

        
        
        
        if (editor.isInline(node)) continue

        
        if (Editor.hasInlines(editor, node)) {
          
          
          
          

          
          
          
          
          
          
          const e = Path.isAncestor(path, end.path)
            ? end
            : Editor.end(editor, path)
          const s = Path.isAncestor(path, start.path)
            ? start
            : Editor.start(editor, path)

          blockText = Editor.string(editor, { anchor: s, focus: e }, { voids })
          isNewBlock = true
        }
      }

      
      if (Text.isText(node)) {
        const isFirst = Path.equals(path, first.path)

        
        
        
        

        
        if (isFirst) {
          leafTextRemaining = reverse
            ? first.offset
            : node.text.length - first.offset
          leafTextOffset = first.offset 
        } else {
          leafTextRemaining = node.text.length
          leafTextOffset = reverse ? leafTextRemaining : 0
        }

        
        if (isFirst || isNewBlock || unit === 'offset') {
          yield { path, offset: leafTextOffset }
          isNewBlock = false
        }

        
        while (true) {
          
          
          
          if (distance === 0) {
            if (blockText === '') break
            distance = calcDistance(blockText, unit, reverse)
            
            
            blockText = splitByCharacterDistance(
              blockText,
              distance,
              reverse
            )[1]
          }

          
          leafTextOffset = reverse
            ? leafTextOffset - distance
            : leafTextOffset + distance
          leafTextRemaining = leafTextRemaining - distance

          
          
          
          if (leafTextRemaining < 0) {
            distance = -leafTextRemaining
            break
          }

          
          
          
          distance = 0
          yield { path, offset: leafTextOffset }
        }
      }
    }
    
    
    

    
    
    function calcDistance(text: string, unit: string, reverse?: boolean) {
      if (unit === 'character') {
        return getCharacterDistance(text, reverse)
      } else if (unit === 'word') {
        return getWordDistance(text, reverse)
      } else if (unit === 'line' || unit === 'block') {
        return text.length
      }
      return 1
    }
  },

  

  previous<T extends Node>(
    editor: Editor,
    options: {
      at?: Location
      match?: NodeMatch<T>
      mode?: 'all' | 'highest' | 'lowest'
      voids?: boolean
    } = {}
  ): NodeEntry<T> | undefined {
    const { mode = 'lowest', voids = false } = options
    let { match, at = editor.selection } = options

    if (!at) {
      return
    }

    const pointBeforeLocation = Editor.before(editor, at, { voids })

    if (!pointBeforeLocation) {
      return
    }

    const [, to] = Editor.first(editor, [])

    
    
    const span: Span = [pointBeforeLocation.path, to]

    if (Path.isPath(at) && at.length === 0) {
      handleSlateError( `Cannot get the previous node from the root node!`, editor)
    }

    if (match == null) {
      if (Path.isPath(at)) {
        const [parent] = Editor.parent(editor, at)
        match = n => parent.children.includes(n)
      } else {
        match = () => true
      }
    }

    const [previous] = Editor.nodes(editor, {
      reverse: true,
      at: span,
      match,
      mode,
      voids,
    })

    return previous
  },

  

  range(editor: Editor, at: Location, to?: Location): Range {
    if (Range.isRange(at) && !to) {
      return at
    }

    const start = Editor.start(editor, at)
    const end = Editor.end(editor, to || at)
    return { anchor: start, focus: end }
  },

  

  rangeRef(
    editor: Editor,
    range: Range,
    options: {
      affinity?: 'backward' | 'forward' | 'outward' | 'inward' | null
    } = {}
  ): RangeRef {
    const { affinity = 'forward' } = options
    const ref: RangeRef = {
      current: range,
      affinity,
      unref() {
        const { current } = ref
        const rangeRefs = Editor.rangeRefs(editor)
        rangeRefs.delete(ref)
        ref.current = null
        return current
      },
    }

    const refs = Editor.rangeRefs(editor)
    refs.add(ref)
    return ref
  },

  

  rangeRefs(editor: Editor): Set<RangeRef> {
    let refs = RANGE_REFS.get(editor)

    if (!refs) {
      refs = new Set()
      RANGE_REFS.set(editor, refs)
    }

    return refs
  },

  

  removeMark(editor: Editor, key: string): void {
    editor.removeMark(key)
  },

  
  setNormalizing(editor: Editor, isNormalizing: boolean): void {
    NORMALIZING.set(editor, isNormalizing)
  },

  

  start(editor: Editor, at: Location): Point {
    return Editor.point(editor, at, { edge: 'start' })
  },

  

  string(
    editor: Editor,
    at: Location,
    options: {
      voids?: boolean
    } = {}
  ): string {
    const { voids = false } = options
    const range = Editor.range(editor, at)
    const [start, end] = Range.edges(range)
    let text = ''

    for (const [node, path] of Editor.nodes(editor, {
      at: range,
      match: Text.isText,
      voids,
    })) {
      let t = node.text

      if (Path.equals(path, end.path)) {
        t = t.slice(0, end.offset)
      }

      if (Path.equals(path, start.path)) {
        t = t.slice(start.offset)
      }

      text += t
    }

    return text
  },

  

  unhangRange(
    editor: Editor,
    range: Range,
    options: {
      voids?: boolean
    } = {}
  ): Range {
    const { voids = false } = options
    let [start, end] = Range.edges(range)

    
    if (start.offset !== 0 || end.offset !== 0 || Range.isCollapsed(range)) {
      return range
    }

    const endBlock = Editor.above(editor, {
      at: end,
      match: n => Editor.isBlock(editor, n),
    })
    const blockPath = endBlock ? endBlock[1] : []
    const first = Editor.start(editor, start)
    const before = { anchor: first, focus: end }
    let skip = true

    for (const [node, path] of Editor.nodes(editor, {
      at: before,
      match: Text.isText,
      reverse: true,
      voids,
    })) {
      if (skip) {
        skip = false
        continue
      }

      if (node.text !== '' || Path.isBefore(path, blockPath)) {
        end = { path, offset: node.text.length }
        break
      }
    }

    return { anchor: start, focus: end }
  },

  

  void(
    editor: Editor,
    options: {
      at?: Location
      mode?: 'highest' | 'lowest'
      voids?: boolean
    } = {}
  ): NodeEntry<Element> | undefined {
    return Editor.above(editor, {
      ...options,
      match: (n:any)  => Editor.isVoid(editor, n),
    })
  },

  

  withoutNormalizing(editor: Editor, fn: () => void): void {
    const value = Editor.isNormalizing(editor)
    Editor.setNormalizing(editor, false)
    try {
      fn()
    } finally {
      Editor.setNormalizing(editor, value)
    }
    Editor.normalize(editor)
  },
}



export type NodeMatch<T extends Node> =
  | ((node: Node, path: Path) => node is T)
  | ((node: Node, path: Path) => boolean)
