import { Operation, Path } from '..'



export interface PathRef {
  current: Path | null
  affinity: 'forward' | 'backward' | null
  unref(): Path | null
}

export interface PathRefInterface {
  transform: (ref: PathRef, op: Operation) => void
}

export const PathRef: PathRefInterface = {
  

  transform(ref: PathRef, op: Operation): void {
    const { current, affinity } = ref

    if (current == null) {
      return
    }

    const path = Path.transform(current, op, { affinity })
    ref.current = path

    if (path == null) {
      ref.unref()
    }
  },
}
