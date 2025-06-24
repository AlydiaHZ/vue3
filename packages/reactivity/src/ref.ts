import { activeSub } from './effect'
import { type Dependency, type Link, link, propagate } from './system'
import { hasChanged, isObject } from '@vue/shared'
import { reactive } from './reactive'
import { ReactiveFlags } from './constants'
import { ComputedRef } from './computed'

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

class ObjectRefImpl<T extends object, K extends keyof T> {
  [ReactiveFlags.IS_REF] = true

  constructor(
    public _object: T,
    public _key: K,
  ) {}

  get value() {
    return this._object[this._key]
  }

  set value(newVal) {
    this._object[this._key] = newVal
  }
}

export function unref<T>(ref: Ref<T> | ComputedRef<T>): T {
  return isRef(ref) ? ref.value : ref
}

export function isRef(r: any): r is Ref {
  return r ? r[ReactiveFlags.IS_REF] === true : false
}

export function toRef(target: Record<string, any>, key: string) {
  return new ObjectRefImpl(target, key)
}

export function toRefs(target: Record<string, any>) {
  const res = {}

  for (const key in target) {
    res[key] = new ObjectRefImpl(target, key)
  }

  return res
}

export function proxyRefs<T extends object>(target: T) {
  return new Proxy(target, {
    get(...args) {
      const res = Reflect.get(...args)
      return unref(res as any)
    },
    set(target, key, newValue, receiver) {
      const oldValue = target[key]

      if (isRef(oldValue) && !isRef(newValue)) {
        oldValue.value = newValue
        return true
      }

      return Reflect.set(target, key, newValue, receiver)
    },
  })
}
