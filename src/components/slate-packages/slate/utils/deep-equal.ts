import isPlainObject  from 'is-plain-object'


export const isDeepEqual = (
  node: Record<string, any>,
  another: Record<string, any>
): boolean => {
  for (const key in node) {
    const a = node[key]
    const b = another[key]
    if (isPlainObject(a) && isPlainObject(b)) {
      if (!isDeepEqual(a, b)) return false
    } else if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
      }
      return true
    } else if (a !== b) {
      return false
    }
  }

  

  for (const key in another) {
    if (node[key] === undefined && another[key] !== undefined) {
      return false
    }
  }

  return true
}
