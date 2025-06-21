import { activeSub } from './effect'
import { type Dependency, type Link, link, propagate } from './system'
import { hasChanged, isObject } from '@vue/shared'
import { reactive } from './reactive'
import { ReactiveFlags } from './constants'

export interface Ref<T = any, S = T> {
  get value(): T

  set value(_: S)
}

class RefImpl<T = any> implements Dependency {
  _value: T

  subsHead: Link
  subsTail: Link

  public readonly [ReactiveFlags.IS_REF] = true

  constructor(value: T) {
    this._value = isObject(value) ? (reactive(value as object) as T) : value
  }

  get value() {
    trackRef(this)
    return this._value
  }

  set value(newValue) {
    if (hasChanged(newValue, this._value)) {
      this._value = isObject(newValue)
        ? (reactive(newValue as object) as T)
        : newValue
      triggerRef(this)
    }
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

export function isRef(r: any): r is Ref {
  return r ? r[ReactiveFlags.IS_REF] === true : false
}
