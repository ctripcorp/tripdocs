import isPlainObject from 'is-plain-object'
import { Operation } from "@src/components/slate-packages/slate"



export interface History {
  redos: Operation[][]
  undos: Operation[][]
}

export const History = {
  

  isHistory(value: any): value is History {
    return (
      isPlainObject(value) &&
      Array.isArray(value.redos) &&
      Array.isArray(value.undos) &&
      (value.redos.length === 0 || Operation.isOperationList(value.redos[0])) &&
      (value.undos.length === 0 || Operation.isOperationList(value.undos[0]))
    )
  },
}
