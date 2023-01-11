import { Editor } from "@src/components/slate-packages/slate"
import { History } from './history'



export const HISTORY = new WeakMap<Editor, History>()
export const SAVING = new WeakMap<Editor, boolean | undefined>()
export const MERGING = new WeakMap<Editor, boolean | undefined>()



export interface HistoryEditor extends Editor {
  history: History
  undo: () => void
  redo: () => void
}

export const HistoryEditor = {
  

  isHistoryEditor(value: any): value is HistoryEditor {
    return Editor.isEditor(value) && History.isHistory((value as any).history)
  },

  

  isMerging(editor: HistoryEditor): boolean | undefined {
    return MERGING.get(editor)
  },

  

  isSaving(editor: HistoryEditor): boolean | undefined {
    return SAVING.get(editor)
  },

  

  redo(editor: HistoryEditor): void {
    editor.redo()
  },

  

  undo(editor: HistoryEditor): void {
    editor.undo()
  },

  

  withoutMerging(editor: HistoryEditor, fn: () => void): void {
    const prev = HistoryEditor.isMerging(editor)
    MERGING.set(editor, false)
    fn()
    MERGING.set(editor, prev)
  },

  

  withoutSaving(editor: HistoryEditor, fn: () => void): void {
    const prev = HistoryEditor.isSaving(editor)
    SAVING.set(editor, false)
    fn()
    SAVING.set(editor, prev)
  },
}
