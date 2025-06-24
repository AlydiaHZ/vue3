import { activeSub } from './effect'
import { type Dependency, type Link, link, propagate } from './system'
import { isArray } from '@vue/shared'

class Dep implements Dependency {
  subsHead: Link
  subsTail: Link
}

type KeyToDepMap = Map<any, Dep>

const targetMap: WeakMap<object, KeyToDepMap> = new WeakMap()

export function track(target: object, key: any): void {
  if (!activeSub) return

  let depsMap = targetMap.get(target)

  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  let dep = depsMap.get(key)

  if (!dep) {
    dep = new Dep()
    depsMap.set(key, dep)
  }

  link(dep, activeSub)
}

export function trigger(target: object, key: any): void {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const targetArray = isArray(target)
  if (targetArray && key === 'length') {
    /**
     * 更新数据的 length
     * 更新前：length = 4 => ['a','b','c','d']
     * 更新前：length = 2 => ['a','b']
     * 得出结论：要通知 访问了 c 和 d 的 effect 重新执行，就是访问了>= length 的索引
     * depsMap = {
     *   0:Dep,
     *   1:Dep,
     *   2:Dep,
     *   3:Dep,
     *   length:Dep
     * }
     */
    const length = target.length
    depsMap.forEach((dep, depKey) => {
      if (depKey >= length || depKey === 'length') {
        /**
         * 通知 >= length 的 effect 重新执行
         * 和 访问了 length 的 effect 重新执行
         */
        propagate(dep.subsHead)
      }
    })
  } else {
    // 不是数组，或者是数组更新的不是 length
    const dep = depsMap.get(key)
    if (!dep) return

    propagate(dep.subsHead)
  }
}
