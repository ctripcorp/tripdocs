import { Path, Point, Range } from '..'



export type Location = Path | Point | Range

export interface LocationInterface {
  isLocation: (value: any) => value is Location
}

export const Location: LocationInterface = {
  

  isLocation(value: any): value is Location {
    return Path.isPath(value) || Point.isPoint(value) || Range.isRange(value)
  },
}



export type Span = [Path, Path]

export interface SpanInterface {
  isSpan: (value: any) => value is Span
}

export const Span: SpanInterface = {
  

  isSpan(value: any): value is Span {
    return (
      Array.isArray(value) && value.length === 2 && value.every(Path.isPath)
    )
  },
}
