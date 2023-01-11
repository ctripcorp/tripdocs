import { handleSlateError } from '@src/components/docs/plugins/ErrorHandle/handleSlateError'
import { Editor, Location, Point, Range, Transforms } from '..'

export interface SelectionTransforms {
  collapse: (
    editor: Editor,
    options?: {
      edge?: 'anchor' | 'focus' | 'start' | 'end'
    }
  ) => void
  deselect: (editor: Editor) => void
  move: (
    editor: Editor,
    options?: {
      distance?: number
      unit?: 'offset' | 'character' | 'word' | 'line'
      reverse?: boolean
      edge?: 'anchor' | 'focus' | 'start' | 'end'
    }
  ) => void
  select: (editor: Editor, target: Location) => void
  setPoint: (
    editor: Editor,
    props: Partial<Point>,
    options?: {
      edge?: 'anchor' | 'focus' | 'start' | 'end'
    }
  ) => void
  setSelection: (editor: Editor, props: Partial<Range>) => void
}

export const SelectionTransforms: SelectionTransforms = {
  

  collapse(
    editor: Editor,
    options: {
      edge?: 'anchor' | 'focus' | 'start' | 'end'
    } = {}
  ): void {
    const { edge = 'anchor' } = options
    const { selection } = editor

    if (!selection) {
      return
    } else if (edge === 'anchor') {
      Transforms.select(editor, selection.anchor)
    } else if (edge === 'focus') {
      Transforms.select(editor, selection.focus)
    } else if (edge === 'start') {
      const [start] = Range.edges(selection)
      Transforms.select(editor, start)
    } else if (edge === 'end') {
      const [, end] = Range.edges(selection)
      Transforms.select(editor, end)
    }
  },

  

  deselect(editor: Editor): void {
    const { selection } = editor

    if (selection) {
      editor.apply({
        type: 'set_selection',
        properties: selection,
        newProperties: null,
      })
    }
  },

  

  move(
    editor: Editor,
    options: {
      distance?: number
      unit?: 'offset' | 'character' | 'word' | 'line'
      reverse?: boolean
      edge?: 'anchor' | 'focus' | 'start' | 'end'
    } = {}
  ): void {
    const { selection } = editor
    const { distance = 1, unit = 'character', reverse = false } = options
    let { edge = null } = options

    if (!selection) {
      return
    }

    if (edge === 'start') {
      edge = Range.isBackward(selection) ? 'focus' : 'anchor'
    }

    if (edge === 'end') {
      edge = Range.isBackward(selection) ? 'anchor' : 'focus'
    }

    const { anchor, focus } = selection
    const opts = { distance, unit }
    const props: Partial<Range> = {}

    if (edge == null || edge === 'anchor') {
      const point = reverse
        ? Editor.before(editor, anchor, opts)
        : Editor.after(editor, anchor, opts)

      if (point) {
        props.anchor = point
      }
    }

    if (edge == null || edge === 'focus') {
      const point = reverse
        ? Editor.before(editor, focus, opts)
        : Editor.after(editor, focus, opts)

      if (point) {
        props.focus = point
      }
    }

    Transforms.setSelection(editor, props)
  },

  

  select(editor: Editor, target: Location): void {
    const { selection } = editor
    target = Editor.range(editor, target)

    if (selection) {
      Transforms.setSelection(editor, target)
      return
    }

    if (!Range.isRange(target)) {
      handleSlateError( 
        `When setting the selection and the current selection is \`null\` you must provide at least an \`anchor\` and \`focus\`, but you passed: ${JSON.stringify(
          target
        )}`, editor
      )
    }

    editor.apply({
      type: 'set_selection',
      properties: selection,
      newProperties: target,
    })
  },

  

  setPoint(
    editor: Editor,
    props: Partial<Point>,
    options: {
      edge?: 'anchor' | 'focus' | 'start' | 'end'
    } = {}
  ): void {
    const { selection } = editor
    let { edge = 'both' } = options

    if (!selection) {
      return
    }

    if (edge === 'start') {
      edge = Range.isBackward(selection) ? 'focus' : 'anchor'
    }

    if (edge === 'end') {
      edge = Range.isBackward(selection) ? 'anchor' : 'focus'
    }

    const { anchor, focus } = selection
    const point = edge === 'anchor' ? anchor : focus

    Transforms.setSelection(editor, {
      [edge === 'anchor' ? 'anchor' : 'focus']: { ...point, ...props },
    })
  },

  

  setSelection(editor: Editor, props: Partial<Range>): void {
    const { selection } = editor
    const oldProps: Partial<Range> | null = {}
    const newProps: Partial<Range> = {}

    if (!selection) {
      return
    }

    for (const k in props) {
      if (
        (k === 'anchor' &&
          props.anchor != null &&
          !Point.equals(props.anchor, selection.anchor)) ||
        (k === 'focus' &&
          props.focus != null &&
          !Point.equals(props.focus, selection.focus)) ||
        (k !== 'anchor' && k !== 'focus' && props[k] !== selection[k])
      ) {
        oldProps[k] = selection[k]
        newProps[k] = props[k]
      }
    }

    if (Object.keys(oldProps).length > 0) {
      editor.apply({
        type: 'set_selection',
        properties: oldProps,
        newProperties: newProps,
      })
    }
  },
}
