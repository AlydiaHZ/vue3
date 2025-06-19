import { activeSub } from './effect'
import { Link, link, propagate } from './system'
import { ReactiveFlags } from './constants'

/**
 * 判断是否是ref
 * @param r
 */
export function isRef(r: any) {
  return !!(r && r[ReactiveFlags.IS_REF])
}

/**
 * ref 主函数
 * @param value
 */
export function ref(value?: unknown) {
  if (isRef(value)) {
    return value
  }
  return new RefImpl(value)
}

/**
 * Ref 的类
 */
class RefImpl<T = any> {
  _value: T
  public readonly [ReactiveFlags.IS_REF] = true

  // 头节点
  subs: Link
  // 尾节点
  subsTail: Link

  constructor(value: T) {
    this._value = value
  }

  get value() {
    // 收集依赖
    trackRef(this)
    return this._value
  }

  set value(newValue) {
    // 触发更新
    this._value = newValue
    triggerRef(this)
  }
}

/**
 * 收集依赖，建立 ref 和 effect 之间的链表关系
 * @param dep
 */
export function trackRef(dep: RefImpl) {
  if (activeSub) {
    link(dep, activeSub)
  }
}

/**
 * 触发 ref 关联 effect 重新执行
 * @param dep
 */
export function triggerRef(dep: RefImpl) {
  if (dep.subs) {
    propagate(dep.subs)
  }
}
