import {
  Descendant,
  Editor,
  Element,
  Node,
  NodeEntry,
  Operation,
  Path,
  PathRef,
  PointRef,
  Range,
  RangeRef,
  Text,
  Transforms,
} from './'
import { createRandomId } from '../../../utils/randomId';
import { DIRTY_PATHS, FLUSHING } from './utils/weak-maps'
import { getEditorEventEmitter } from '@src/components/docs/plugins/table/selection';
import { getCache, setCache } from '@src/utils/cacheUtils';



export const createEditor = (docId = ''): Editor => {
  const editor: Editor = {
    docId,
    children: [],
    operations: [],
    selection: null,
    marks: null,
    isInline: () => false,
    isVoid: () => false,
    onChange: () => { },

    apply: (op: Operation) => {

      for (const ref of Editor.pathRefs(editor)) {
        PathRef.transform(ref, op)
      }

      for (const ref of Editor.pointRefs(editor)) {
        PointRef.transform(ref, op)
      }

      for (const ref of Editor.rangeRefs(editor)) {
        RangeRef.transform(ref, op)
      }

      const set = new Set()
      const dirtyPaths: Path[] = []

      const add = (path: Path | null) => {
        if (path) {
          const key = path.join(',')

          if (!set.has(key)) {
            set.add(key)
            dirtyPaths.push(path)
          }
        }
      }

      const oldDirtyPaths = DIRTY_PATHS.get(editor) || []
      const newDirtyPaths = getDirtyPaths(op)

      for (const path of oldDirtyPaths) {
        const newPath = Path.transform(path, op)
        add(newPath)
      }

      for (const path of newDirtyPaths) {
        add(path)
      }


      DIRTY_PATHS.set(editor, dirtyPaths)
      Transforms.transform(editor, op)
      editor.operations.push(op)
      Editor.normalize(editor)

      
      if (op.type === 'set_selection') {
        editor.marks = null
        getEditorEventEmitter(editor.docId).emit('editorSelection', editor.docId, op.newProperties);
      }

      if (!FLUSHING.get(editor)) {
        FLUSHING.set(editor, true)

        Promise.resolve().then(() => {
          
          const stack: any[] = getCache(editor.docId, 'changeEditorStack') || []
          if (stack.length > 3) {
            stack.shift()
          }
          stack.push({
            content: editor.children,
            operations: editor.operations
          })
          setCache(editor.docId, 'changeEditorStack', stack)
          FLUSHING.set(editor, false)
          editor.onChange()
          editor.operations = []
        })
      }
    },

    addMark: (key: string, value: any) => {
      const { selection } = editor

      if (selection) {
        if (Range.isExpanded(selection)) {
          Transforms.setNodes(
            editor,
            { [key]: value },
            { match: Text.isText, split: true }
          )
        } else {
          const marks = {
            ...(Editor.marks(editor) || {}),
            [key]: value,
          }

          editor.marks = marks
          if (!FLUSHING.get(editor)) {
            editor.onChange()
          }
        }
      }
    },

    deleteBackward: (unit: 'character' | 'word' | 'line' | 'block') => {
      const { selection } = editor

      if (selection && Range.isCollapsed(selection)) {
        Transforms.delete(editor, { unit, reverse: true })
      }
    },

    deleteForward: (unit: 'character' | 'word' | 'line' | 'block') => {
      const { selection } = editor

      if (selection && Range.isCollapsed(selection)) {
        Transforms.delete(editor, { unit })
      }
    },

    deleteFragment: (direction?: 'forward' | 'backward') => {
      const { selection } = editor

      if (selection && Range.isExpanded(selection)) {
        Transforms.delete(editor, { reverse: direction === 'backward' })
      }
    },

    getFragment: () => {
      const { selection } = editor

      if (selection) {
        return Node.fragment(editor, selection)
      }
      return []
    },

    insertBreak: () => {
      Transforms.splitNodes(editor, { always: true })
    },

    insertFragment: (fragment: Node[]) => {
      Transforms.insertFragment(editor, fragment)
    },

    insertNode: (node: Node) => {
      Transforms.insertNodes(editor, node)
    },

    insertText: (text: string) => {
      const { selection, marks } = editor

      if (selection) {
        
        
        if (Range.isCollapsed(selection)) {
          const inline = Editor.above(editor, {
            match: (n: any) => Editor.isInline(editor, n),
            mode: 'highest',
          })

          if (inline) {
            const [, inlinePath] = inline

            if (Editor.isEnd(editor, selection.anchor, inlinePath)) {
              const point = Editor.after(editor, inlinePath)!
              Transforms.setSelection(editor, {
                anchor: point,
                focus: point,
              })
            }
          }
        }

        if (marks) {
          const node = { text, ...marks }
          Transforms.insertNodes(editor, node)
        } else {
          Transforms.insertText(editor, text)
        }

        editor.marks = null
      }
    },

    normalizeNode: (entry: NodeEntry) => {
      const [node, path] = entry

      
      if (Text.isText(node)) {
        return
      }

      
      if (Element.isElement(node) && node.children.length === 0) {
        const child = { text: '' }
        Transforms.insertNodes(editor, child, {
          at: path.concat(0),
          voids: true,
        })
        return
      }

      
      const shouldHaveInlines = Editor.isEditor(node)
        ? false
        : Element.isElement(node) &&
        (editor.isInline(node) ||
          node.children.length === 0 ||
          Text.isText(node.children[0]) ||
          editor.isInline(node.children[0]))

      
      
      let n = 0

      for (let i = 0; i < node.children.length; i++, n++) {
        const currentNode = Node.get(editor, path)
        if (Text.isText(currentNode)) continue
        const child = node.children[i] as Descendant
        const prev = currentNode.children[n - 1] as Descendant
        const isLast = i === node.children.length - 1
        const isInlineOrText =
          Text.isText(child) ||
          (Element.isElement(child) && editor.isInline(child))

        
        
        
        
        if (isInlineOrText !== shouldHaveInlines) {
          Transforms.removeNodes(editor, { at: path.concat(n), voids: true })
          n--
        } else if (Element.isElement(child)) {
          
          if (editor.isInline(child)) {
            if (prev == null || !Text.isText(prev)) {
              const newChild = { text: '' }
              Transforms.insertNodes(editor, newChild, {
                at: path.concat(n),
                voids: true,
              })
              n++
            } else if (isLast) {
              const newChild = { text: '' }
              Transforms.insertNodes(editor, newChild, {
                at: path.concat(n + 1),
                voids: true,
              })
              n++
            }
          }
        } else {
          
          if (prev != null && Text.isText(prev)) {
            if (Text.equals(child, prev, { loose: true })) {
              Transforms.mergeNodes(editor, { at: path.concat(n), voids: true })
              n--
            } else if (prev.text === '') {
              Transforms.removeNodes(editor, {
                at: path.concat(n - 1),
                voids: true,
              })
              n--
            } else if (child.text === '') {
              Transforms.removeNodes(editor, {
                at: path.concat(n),
                voids: true,
              })
              n--
            }
          }
        }
      }
    },

    removeMark: (key: string) => {
      const { selection } = editor

      if (selection) {
        if (Range.isExpanded(selection)) {
          Transforms.unsetNodes(editor, key, {
            match: Text.isText,
            split: true,
          })
        } else {
          const marks = { ...(Editor.marks(editor) || {}) }
          delete marks[key]
          editor.marks = marks
          if (!FLUSHING.get(editor)) {
            editor.onChange()
          }
        }
      }
    },
  }

  return editor
}



const getDirtyPaths = (op: Operation): Path[] => {
  switch (op.type) {
    case 'insert_text':
    case 'remove_text':
    case 'set_node': {
      const { path } = op
      return Path.levels(path)
    }

    case 'insert_node': {
      const { node, path } = op
      const levels = Path.levels(path)
      const descendants = Text.isText(node)
        ? []
        : Array.from(Node.nodes(node), ([, p]) => path.concat(p))

      return [...levels, ...descendants]
    }

    case 'merge_node': {
      const { path } = op
      const ancestors = Path.ancestors(path)
      const previousPath = Path.previous(path)
      return [...ancestors, previousPath]
    }

    case 'move_node': {
      const { path, newPath } = op

      if (Path.equals(path, newPath)) {
        return []
      }

      const oldAncestors: Path[] = []
      const newAncestors: Path[] = []

      for (const ancestor of Path.ancestors(path)) {
        const p = Path.transform(ancestor, op)
        oldAncestors.push(p!)
      }

      for (const ancestor of Path.ancestors(newPath)) {
        const p = Path.transform(ancestor, op)
        newAncestors.push(p!)
      }

      const newParent = newAncestors[newAncestors.length - 1]
      const newIndex = newPath[newPath.length - 1]
      const resultPath = newParent.concat(newIndex)

      return [...oldAncestors, ...newAncestors, resultPath]
    }

    case 'remove_node': {
      const { path } = op
      const ancestors = Path.ancestors(path)
      return [...ancestors]
    }

    case 'split_node': {
      const { path } = op
      const levels = Path.levels(path)
      const nextPath = Path.next(path)
      return [...levels, nextPath]
    }

    default: {
      return []
    }
  }
}
