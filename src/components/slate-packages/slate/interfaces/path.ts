import { handleSlateError } from '@src/components/docs/plugins/ErrorHandle/handleSlateError'
import { produce } from 'immer'
import { Operation } from '..'



export type Path = number[]

export interface PathInterface {
  ancestors: (path: Path, options?: { reverse?: boolean }) => Path[]
  common: (path: Path, another: Path) => Path
  compare: (path: Path, another: Path) => -1 | 0 | 1
  endsAfter: (path: Path, another: Path) => boolean
  endsAt: (path: Path, another: Path) => boolean
  endsBefore: (path: Path, another: Path) => boolean
  equals: (path: Path, another: Path) => boolean
  hasPrevious: (path: Path) => boolean
  isAfter: (path: Path, another: Path) => boolean
  isAncestor: (path: Path, another: Path) => boolean
  isBefore: (path: Path, another: Path) => boolean
  isChild: (path: Path, another: Path) => boolean
  isCommon: (path: Path, another: Path) => boolean
  isDescendant: (path: Path, another: Path) => boolean
  isParent: (path: Path, another: Path) => boolean
  isPath: (value: any) => value is Path
  isSibling: (path: Path, another: Path) => boolean
  levels: (
    path: Path,
    options?: {
      reverse?: boolean
    }
  ) => Path[]
  next: (path: Path) => Path
  parent: (path: Path) => Path
  previous: (path: Path) => Path
  relative: (path: Path, ancestor: Path) => Path
  transform: (
    path: Path,
    operation: Operation,
    options?: { affinity?: 'forward' | 'backward' | null }
  ) => Path | null
}

export const Path: PathInterface = {
  

  ancestors(path: Path, options: { reverse?: boolean } = {}): Path[] {
    const { reverse = false } = options
    let paths = Path.levels(path, options)

    if (reverse) {
      paths = paths.slice(1)
    } else {
      paths = paths.slice(0, -1)
    }

    return paths
  },

  

  common(path: Path, another: Path): Path {
    const common: Path = []

    for (let i = 0; i < path.length && i < another.length; i++) {
      const av = path[i]
      const bv = another[i]

      if (av !== bv) {
        break
      }

      common.push(av)
    }

    return common
  },

  

  compare(path: Path, another: Path): -1 | 0 | 1 {
    const min = Math.min(path.length, another.length)

    for (let i = 0; i < min; i++) {
      if (path[i] < another[i]) return -1
      if (path[i] > another[i]) return 1
    }

    return 0
  },

  

  endsAfter(path: Path, another: Path): boolean {
    const i = path.length - 1
    const as = path.slice(0, i)
    const bs = another.slice(0, i)
    const av = path[i]
    const bv = another[i]
    return Path.equals(as, bs) && av > bv
  },

  

  endsAt(path: Path, another: Path): boolean {
    const i = path.length
    const as = path.slice(0, i)
    const bs = another.slice(0, i)
    return Path.equals(as, bs)
  },

  

  endsBefore(path: Path, another: Path): boolean {
    const i = path.length - 1
    const as = path.slice(0, i)
    const bs = another.slice(0, i)
    const av = path[i]
    const bv = another[i]
    return Path.equals(as, bs) && av < bv
  },

  

  equals(path: Path, another: Path): boolean {
    
    
    
    return (
      path.length === another.length && path.every((n, i) => n === another[i])
    )
  },

  

  hasPrevious(path: Path): boolean {
    return path[path.length - 1] > 0
  },

  

  isAfter(path: Path, another: Path): boolean {
    return Path.compare(path, another) === 1
  },

  

  isAncestor(path: Path, another: Path): boolean {
    return path.length < another.length && Path.compare(path, another) === 0
  },

  

  isBefore(path: Path, another: Path): boolean {
    return Path.compare(path, another) === -1
  },

  

  isChild(path: Path, another: Path): boolean {
    return (
      path.length === another.length + 1 && Path.compare(path, another) === 0
    )
  },

  

  isCommon(path: Path, another: Path): boolean {
    return path.length <= another.length && Path.compare(path, another) === 0
  },

  

  isDescendant(path: Path, another: Path): boolean {
    return path.length > another.length && Path.compare(path, another) === 0
  },

  

  isParent(path: Path, another: Path): boolean {
    return (
      path.length + 1 === another.length && Path.compare(path, another) === 0
    )
  },

  

  isPath(value: any): value is Path {
    return (
      Array.isArray(value) &&
      (value.length === 0 || typeof value[0] === 'number')
    )
  },

  

  isSibling(path: Path, another: Path): boolean {
    if (path.length !== another.length) {
      return false
    }

    const as = path.slice(0, -1)
    const bs = another.slice(0, -1)
    const al = path[path.length - 1]
    const bl = another[another.length - 1]
    return al !== bl && Path.equals(as, bs)
  },

  

  levels(
    path: Path,
    options: {
      reverse?: boolean
    } = {}
  ): Path[] {
    const { reverse = false } = options
    const list: Path[] = []

    for (let i = 0; i <= path.length; i++) {
      list.push(path.slice(0, i))
    }

    if (reverse) {
      list.reverse()
    }

    return list
  },

  

  next(path: Path): Path {
    if (path.length === 0) {
      handleSlateError( 
        `Cannot get the next path of a root path [${path}], because it has no next index.`
      )
    }

    const last = path[path.length - 1]
    return path.slice(0, -1).concat(last + 1)
  },

  

  parent(path: Path): Path {
    if (path.length === 0) {
      handleSlateError( `Cannot get the parent path of the root path [${path}].`)
    }

    return path.slice(0, -1)
  },

  

  previous(path: Path): Path {
    if (path.length === 0) {
      handleSlateError( 
        `Cannot get the previous path of a root path [${path}], because it has no previous index.`
      )
    }

    const last = path[path.length - 1]

    if (last <= 0) {
      handleSlateError( 
        `Cannot get the previous path of a first child path [${path}] because it would result in a negative index.`
      )
    }

    return path.slice(0, -1).concat(last - 1)
  },

  

  relative(path: Path, ancestor: Path): Path {
    if (!Path.isAncestor(ancestor, path) && !Path.equals(path, ancestor)) {
      handleSlateError( 
        `Cannot get the relative path of [${path}] inside ancestor [${ancestor}], because it is not above or equal to the path.`
      )
    }

    return path.slice(ancestor.length)
  },

  

  transform(
    path: Path | null,
    operation: Operation,
    options: { affinity?: 'forward' | 'backward' | null } = {}
  ): Path | null {
    return produce(path, p => {
      const { affinity = 'forward' } = options

      
      if (!path || path?.length === 0) {
        return
      }

      if (p === null) {
        return null
      }

      switch (operation.type) {
        case 'insert_node': {
          const { path: op } = operation

          if (
            Path.equals(op, p) ||
            Path.endsBefore(op, p) ||
            Path.isAncestor(op, p)
          ) {
            p[op.length - 1] += 1
          }

          break
        }

        case 'remove_node': {
          const { path: op } = operation

          if (Path.equals(op, p) || Path.isAncestor(op, p)) {
            return null
          } else if (Path.endsBefore(op, p)) {
            p[op.length - 1] -= 1
          }

          break
        }

        case 'merge_node': {
          const { path: op, position } = operation

          if (Path.equals(op, p) || Path.endsBefore(op, p)) {
            p[op.length - 1] -= 1
          } else if (Path.isAncestor(op, p)) {
            p[op.length - 1] -= 1
            p[op.length] += position
          }

          break
        }

        case 'split_node': {
          const { path: op, position } = operation

          if (Path.equals(op, p)) {
            if (affinity === 'forward') {
              p[p.length - 1] += 1
            } else if (affinity === 'backward') {
              
            } else {
              return null
            }
          } else if (Path.endsBefore(op, p)) {
            p[op.length - 1] += 1
          } else if (Path.isAncestor(op, p) && path[op.length] >= position) {
            p[op.length - 1] += 1
            p[op.length] -= position
          }

          break
        }

        case 'move_node': {
          const { path: op, newPath: onp } = operation

          
          if (Path.equals(op, onp)) {
            return
          }

          if (Path.isAncestor(op, p) || Path.equals(op, p)) {
            const copy = onp.slice()

            if (Path.endsBefore(op, onp) && op.length < onp.length) {
              copy[op.length - 1] -= 1
            }

            return copy.concat(p.slice(op.length))
          } else if (
            Path.isSibling(op, onp) &&
            (Path.isAncestor(onp, p) || Path.equals(onp, p))
          ) {
            if (Path.endsBefore(op, p)) {
              p[op.length - 1] -= 1
            } else {
              p[op.length - 1] += 1
            }
          } else if (
            Path.endsBefore(onp, p) ||
            Path.equals(onp, p) ||
            Path.isAncestor(onp, p)
          ) {
            if (Path.endsBefore(op, p)) {
              p[op.length - 1] -= 1
            }

            p[onp.length - 1] += 1
          } else if (Path.endsBefore(op, p)) {
            if (Path.equals(onp, p)) {
              p[onp.length - 1] += 1
            }

            p[op.length - 1] -= 1
          }

          break
        }
      }
    })
  },
}
