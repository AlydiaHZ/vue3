import { activeSub } from './effect'
import { Link, link, propagate } from './system'

export class RefImpl<T = any> {
  _value: T

  subsHead: Link
  subsTail: Link

  constructor(value: T) {
    this._value = value
  }

  get value() {
    trackRef(this)
    return this._value
  }

  set value(newValue) {
    this._value = newValue
    triggerRef(this)
  }
}

export function ref(value: unknown) {
  return new RefImpl(value)
}

/**
 * 收集订阅
 * @param dep
 */
export function trackRef(dep: RefImpl) {
  if (activeSub) link(dep, activeSub)
}

/**
 * 触发 ref 关联的所有 effect
 * @param dep
 */
export function triggerRef(dep: RefImpl) {
  if (dep.subsHead) {
    propagate(dep.subsHead)
  }
}
