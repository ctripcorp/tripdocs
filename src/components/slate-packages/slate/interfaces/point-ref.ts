import { Operation, Point } from '..'



export interface PointRef {
  current: Point | null
  affinity: 'forward' | 'backward' | null
  unref(): Point | null
}

export interface PointRefInterface {
  transform: (ref: PointRef, op: Operation) => void
}

export const PointRef: PointRefInterface = {
  

  transform(ref: PointRef, op: Operation): void {
    const { current, affinity } = ref

    if (current == null) {
      return
    }

    const point = Point.transform(current, op, { affinity })
    ref.current = point

    if (point == null) {
      ref.unref()
    }
  },
}
