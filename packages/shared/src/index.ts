export function isObject(value: unknown): value is Object {
  return typeof value === 'object' && value !== null
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function'
}

export const isArray: typeof Array.isArray = Array.isArray

export function hasChanged<T>(newValue: T, oldValue: T): boolean {
  return !Object.is(newValue, oldValue)
}
