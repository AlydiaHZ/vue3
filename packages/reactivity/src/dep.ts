import { activeSub } from './effect'
import { type Dependency, type Link, link, propagate } from './system'

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
  const dep = depsMap.get(key)

  if (!depsMap || !dep) return

  propagate(dep.subsHead)
}
