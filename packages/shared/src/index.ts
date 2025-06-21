export function isObject(value: any) {
  return typeof value === 'object' && value !== null
}

export function hasChanged<T>(newValue: T, oldValue: T): Boolean {
  return !Object.is(newValue, oldValue)
}
