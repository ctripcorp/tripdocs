import { produce } from 'immer'
import isPlainObject  from 'is-plain-object'
import { ExtendedType, Operation, Path, Point, PointEntry } from '..'



export interface BaseRange {
  anchor: Point
  focus: Point
}

export type Range = ExtendedType<'Range', BaseRange>

export interface RangeInterface {
  edges: (
    range: Range,
    options?: {
      reverse?: boolean
    }
  ) => [Point, Point]
  end: (range: Range) => Point
  equals: (range: Range, another: Range) => boolean
  includes: (range: Range, target: Path | Point | Range) => boolean
  intersection: (range: Range, another: Range) => Range | null
  isBackward: (range: Range) => boolean
  isCollapsed: (range: Range) => boolean
  isExpanded: (range: Range) => boolean
  isForward: (range: Range) => boolean
  isRange: (value: any) => value is Range
  points: (range: Range) => Generator<PointEntry, void, undefined>
  start: (range: Range) => Point
  transform: (
    range: Range,
    op: Operation,
    options?: {
      affinity?: 'forward' | 'backward' | 'outward' | 'inward' | null
    }
  ) => Range | null
}

export const Range: RangeInterface = {
  

  edges(
    range: Range,
    options: {
      reverse?: boolean
    } = {}
  ): [Point, Point] {
    const { reverse = false } = options
    const { anchor, focus } = range
    return Range.isBackward(range) === reverse
      ? [anchor, focus]
      : [focus, anchor]
  },

  

  end(range: Range): Point {
    const [, end] = Range.edges(range)
    return end
  },

  

  equals(range: Range, another: Range): boolean {
    return (
      Point.equals(range.anchor, another.anchor) &&
      Point.equals(range.focus, another.focus)
    )
  },

  

  includes(range: Range, target: Path | Point | Range): boolean {
    if (Range.isRange(target)) {
      if (
        Range.includes(range, target.anchor) ||
        Range.includes(range, target.focus)
      ) {
        return true
      }

      const [rs, re] = Range.edges(range)
      const [ts, te] = Range.edges(target)
      return Point.isBefore(rs, ts) && Point.isAfter(re, te)
    }

    const [start, end] = Range.edges(range)
    let isAfterStart = false
    let isBeforeEnd = false

    if (Point.isPoint(target)) {
      isAfterStart = Point.compare(target, start) >= 0
      isBeforeEnd = Point.compare(target, end) <= 0
    } else {
      isAfterStart = Path.compare(target, start.path) >= 0
      isBeforeEnd = Path.compare(target, end.path) <= 0
    }

    return isAfterStart && isBeforeEnd
  },

  

  intersection(range: Range, another: Range): Range | null {
    const { anchor, focus, ...rest } = range
    const [s1, e1] = Range.edges(range)
    const [s2, e2] = Range.edges(another)
    const start = Point.isBefore(s1, s2) ? s2 : s1
    const end = Point.isBefore(e1, e2) ? e1 : e2

    if (Point.isBefore(end, start)) {
      return null
    } else {
      return { anchor: start, focus: end, ...rest }
    }
  },

  

  isBackward(range: Range): boolean {
    const { anchor, focus } = range
    return Point.isAfter(anchor, focus)
  },

  

  isCollapsed(range: Range): boolean {
    const { anchor, focus } = range
    return Point.equals(anchor, focus)
  },

  

  isExpanded(range: Range): boolean {
    return !Range.isCollapsed(range)
  },

  

  isForward(range: Range): boolean {
    return !Range.isBackward(range)
  },

  

  isRange(value: any): value is Range {
    return (
      isPlainObject(value) &&
      Point.isPoint(value.anchor) &&
      Point.isPoint(value.focus)
    )
  },

  

  *points(range: Range): Generator<PointEntry, void, undefined> {
    yield [range.anchor, 'anchor']
    yield [range.focus, 'focus']
  },

  

  start(range: Range): Point {
    const [start] = Range.edges(range)
    return start
  },

  

  transform(
    range: Range | null,
    op: Operation,
    options: {
      affinity?: 'forward' | 'backward' | 'outward' | 'inward' | null
    } = {}
  ): Range | null {
    return produce(range, r => {
      if (r === null) {
        return null
      }
      const { affinity = 'inward' } = options
      let affinityAnchor: 'forward' | 'backward' | null
      let affinityFocus: 'forward' | 'backward' | null

      if (affinity === 'inward') {
        
        
        
        const isCollapsed = Range.isCollapsed(r)
        if (Range.isForward(r)) {
          affinityAnchor = 'forward'
          affinityFocus = isCollapsed ? affinityAnchor : 'backward'
        } else {
          affinityAnchor = 'backward'
          affinityFocus = isCollapsed ? affinityAnchor : 'forward'
        }
      } else if (affinity === 'outward') {
        if (Range.isForward(r)) {
          affinityAnchor = 'backward'
          affinityFocus = 'forward'
        } else {
          affinityAnchor = 'forward'
          affinityFocus = 'backward'
        }
      } else {
        affinityAnchor = affinity
        affinityFocus = affinity
      }
      const anchor = Point.transform(r.anchor, op, { affinity: affinityAnchor })
      const focus = Point.transform(r.focus, op, { affinity: affinityFocus })

      if (!anchor || !focus) {
        return null
      }

      r.anchor = anchor
      r.focus = focus
    })
  },
}
