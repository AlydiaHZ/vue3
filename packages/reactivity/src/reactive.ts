import { isObject } from '@vue/shared'
import { mutableHandlers } from './baseHandlers'

export function reactive(target: object) {
  return createReactiveObject(target)
}

// 1.1 保存 target 和 响应式对象之间的关联关系
const reactiveMap = new WeakMap()
// 2.1 保存所有使用 reactive 创建出来的响应式对象
const reactiveSet = new WeakSet()

function createReactiveObject(target: object) {
  // reactive 必须接受一个对象
  if (!isObject(target)) return target

  // 1.2 防止一个 target 被多次 reactive
  const existedProxy = reactiveMap.get(target)
  if (existedProxy) return existedProxy

  // 2.2 防止一个 响应式对象再次被 reactive
  if (isReactive(target)) return target

  // 创建 target 的代理对象
  const proxy = new Proxy(target, mutableHandlers)

  // 1.3 保存 target 和 proxy之间的关联关系
  reactiveMap.set(target, proxy)
  // 2.3 保存所有 reactive 中
  reactiveSet.add(proxy)
  return proxy
}

export function isReactive(target: object) {
  return reactiveSet.has(target)
}
