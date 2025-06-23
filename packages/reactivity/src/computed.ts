import { hasChanged, isFunction } from '@vue/shared'
import {
  Dependency,
  endTracking,
  link,
  Link,
  startTracking,
  Subscriber,
} from './system'
import { ReactiveFlags } from './constants'
import { activeSub, setActiveSub } from './effect'
import { Ref } from './ref'

interface BaseComputedRef<T, S = T> extends Ref<T, S> {
  effect: ComputedRefImpl
}

export interface ComputedRef<T = any> extends BaseComputedRef<T> {
  readonly value: T
}

export type ComputedGetter<T> = (oldValue?: T) => T
export type ComputedSetter<T> = (newValue: T) => void

export interface WritableComputedOptions<T, S = T> {
  get: ComputedGetter<T>
  set: ComputedSetter<S>
}

export class ComputedRefImpl<T = any> implements Dependency, Subscriber {
  _value: T | undefined = undefined
  // Dependency
  subsHead: Link | undefined
  subsTail: Link | undefined
  // Subscriber
  depsHead: Link | undefined
  depsTail: Link | undefined;

  [ReactiveFlags.IS_REF] = true
  tracking: Boolean | undefined = false
  dirty = true

  constructor(
    public fn: ComputedGetter<T>,
    private readonly setter: ComputedSetter<T> | undefined,
  ) {}

  get value(): T {
    if (this.dirty) {
      this.update()
    }
    // 要和 sub 做关联关系
    if (activeSub) link(this, activeSub)

    return this._value
  }

  set value(newValue) {
    if (this.setter) {
      this._value = newValue
    } else {
      console.warn('readonly')
    }
  }

  update(): boolean {
    const prevSub: Subscriber | undefined = activeSub

    // 每次执行 fn 之前，把 this 放到 activeSub 上面
    setActiveSub(this)
    startTracking(this)
    try {
      const oldValue = this._value
      this._value = this.fn()
      return hasChanged(oldValue, this._value)
    } finally {
      // 执行完成后，恢复之前的 activeSub
      setActiveSub(prevSub)
      endTracking(this)
    }
  }
}

/**
 * 计算属性
 * @param getterOrOptions
 */
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>,
) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T> | undefined

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}
