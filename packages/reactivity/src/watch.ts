import { ReactiveEffect } from './effect'
import { isRef, Ref } from './ref'
import { ComputedRef } from './computed'
import { isFunction, isObject } from '@vue/shared'
import { isReactive } from './reactive'

export type OnCleanup = (cleanupFn: () => void) => void
export type WatchEffect = (onCleanup: OnCleanup) => void
export type WatchSource<T = any> = Ref<T, any> | ComputedRef<T> | (() => T)
export type WatchCallback<V = any, OV = any> = (
  value: V,
  oldValue: OV,
  onCleanup?: OnCleanup,
) => any

export interface WatchOptions<Immediate = boolean> {
  immediate?: Immediate
  deep?: boolean | number
  once?: boolean
}

export function watch(
  source: WatchSource | WatchSource[] | WatchEffect | object,
  cb?: WatchCallback | null,
  options: WatchOptions = {},
) {
  let { immediate, once, deep } = options

  if (once) {
    const _cb = cb
    cb = (...args) => {
      _cb(...args)
      stop()
    }
  }
  let getter: () => any
  if (isRef(source)) {
    getter = () => source.value
  } else if (isReactive(source)) {
    getter = () => source
    if (!deep) deep = true
  } else if (isFunction(source)) {
    getter = source as () => any
  }

  if (deep) {
    const baseGetter = getter
    const depth = deep === true ? Infinity : deep
    getter = () => traverse(baseGetter(), depth)
  }

  let oldValue: any

  let cleanup = null

  function onCleanup(cb) {
    cleanup = cb
  }

  function job() {
    if (cleanup) {
      // 清理上一次的副作用
      cleanup()
      cleanup = null
    }

    // 执行 effect.run 拿到 getter 的返回值，不能直接执行 getter，因为要收集依赖
    const newValue = effect.run()
    // 执行用户回调，把 newValue 和 oldValue 传进去
    cb(newValue, oldValue, onCleanup)
    // 下一次的 oldValue 就等于这一次的 newValue
    oldValue = newValue
  }

  const effect = new ReactiveEffect(getter)

  effect.scheduler = job

  if (immediate) {
    job()
  } else {
    // 拿到 oldValue,并且收集依赖
    oldValue = effect.run()
  }

  function stop() {
    effect.stop()
  }

  return stop
}

function traverse(
  value: unknown,
  depth: number = Infinity,
  seen: Set<unknown> = new Set(),
) {
  if (depth <= 0 || !isObject(value) || seen.has(value)) return value

  depth--
  seen.add(value)

  for (const key in value) {
    traverse(value[key], depth, seen)
  }

  return value
}
