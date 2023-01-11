import { Editor, Operation, Path, Range } from "@src/components/slate-packages/slate"
import { ELTYPE } from '../../docs/plugins/config'
import { HistoryEditor } from './history-editor'




export const withHistory = <T extends Editor>(editor: T) => {
  const e = editor as T & HistoryEditor
  const { apply } = e
  e.history = { undos: [], redos: [] }

  e.redo = () => {
    const { history } = e
    const { redos } = history
    
    history.redos = history.redos.filter((batch) => {
      return !(
        batch[0].type === "set_node" &&
        (
          Object.keys(batch[0].newProperties as object).includes("selectedRow")
        )
      );
    })
    
    if (redos.length > 0) {
      const batch = redos[redos.length - 1]

      HistoryEditor.withoutSaving(e, () => {
        Editor.withoutNormalizing(e, () => {
          for (const op of batch) {
            e.apply(op)
          }
        })
      })

      history.redos.pop()
      history.undos.push(batch)
    }
  }

  e.undo = () => {
    const { history } = e
    

    console.log('history.undos', history.undos)

    history.undos = history.undos.filter((batch) => {
      
      return !(
        batch[0].type === "set_node" &&
        (
          Object.keys(batch[0].newProperties as object).includes("selectedRow") ||
          Object.keys(batch[0].newProperties as object).includes("selectedCell") ||
          Object.keys(batch[0].newProperties as object).includes("data-card-value")
        )
      )
      
    })
    

    const { undos } = history;
    

    let isSelection = true
    while (isSelection) {

      if (undos.length > 0) {

        const batch = undos[undos.length - 1]

        HistoryEditor.withoutSaving(e, () => {
          Editor.withoutNormalizing(e, () => {
            const inverseOps = batch.map(Operation.inverse).reverse()

            for (const op of inverseOps) {
              if (op?.type !== 'set_selection') {
                const isAutoInsert = batch[0]?.type === "insert_node" &&
                  (op as any)?.node?.type === ELTYPE.PARAGRAPH && JSON.stringify((op as any)?.node?.children || []) === '[{"text":""}]' &&
                  op.path[0] === editor.children.length - 1
                if (!isAutoInsert) {
                  isSelection = false
                }
              }
              
              let isSkip = false
              if (op.type === "set_selection") {
                const mySelection = {
                  ...editor.selection, ...op.newProperties as {}
                }
                
                isSkip = Range.isExpanded(mySelection)
              }

              
              if (
                isSkip || op === inverseOps[inverseOps.length - 1] &&
                op.type === 'set_selection' &&
                op.newProperties == null
              ) {
                continue
              } else {
                
                e.apply(op)
              }
            }
          })
        })

        history.redos.push(batch)
        history.undos.pop()
      } else {
        isSelection = false
      }
    }

  }

  e.apply = (op: Operation) => {
    const { operations, history } = e
    const { undos } = history
    const lastBatch = undos[undos.length - 1]
    const lastOp = lastBatch && lastBatch[lastBatch.length - 1]
    const overwrite = shouldOverwrite(op, lastOp)
    let save = HistoryEditor.isSaving(e)
    let merge = HistoryEditor.isMerging(e)

    if (save == null) {
      save = shouldSave(op, lastOp)
    }

    if (save) {
      if (merge == null) {
        if (lastBatch == null) {
          merge = false
        } else if (operations.length !== 0) {
          merge = true
        } else {
          merge = shouldMerge(op, lastOp) || overwrite
        }
      }

      if (lastBatch && merge) {
        if (overwrite) {
          lastBatch.pop()
        }

        lastBatch.push(op)
      } else {
        const batch = [op]
        let isSkip
        
        
        
        
        
        
        if (op.type === "set_node") {
          const newOp:any = op
          isSkip =  Object.keys(op.newProperties).length===1 &&!!newOp?.newProperties?.num
        }
        !isSkip&&  undos.push(batch)
        

      }

      while (undos.length > 100) {
        undos.shift()
      }

      if (shouldClear(op)) {
        history.redos = []
      }
    }

    apply(op)
  }

  return e
}



const shouldMerge = (op: Operation, prev: Operation | undefined): boolean => {
  if (op.type === 'set_selection') {
    return true
  }

  if (
    prev &&
    op.type === 'insert_text' &&
    prev.type === 'insert_text' &&
    op.offset === prev.offset + prev.text.length &&
    Path.equals(op.path, prev.path)
  ) {
    return true
  }

  if (
    prev &&
    op.type === 'remove_text' &&
    prev.type === 'remove_text' &&
    op.offset + op.text.length === prev.offset &&
    Path.equals(op.path, prev.path)
  ) {
    return true
  }

  return false
}



const shouldSave = (op: Operation, prev: Operation | undefined): boolean => {
  if (op.type === 'set_selection' && op.newProperties == null) {
    return false
  }

  return true
}



const shouldOverwrite = (
  op: Operation,
  prev: Operation | undefined
): boolean => {
  if (prev && op.type === 'set_selection' && prev.type === 'set_selection') {
    return true
  }

  return false
}



const shouldClear = (op: Operation): boolean => {
  if (op.type === 'set_selection') {
    return false
  }

  return true
}
