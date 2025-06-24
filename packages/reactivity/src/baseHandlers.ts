import { track, trigger } from './dep'
import { hasChanged, isArray, isObject } from '@vue/shared'
import { isRef } from './ref'
import { reactive } from './reactive'

class BaseReactiveHandler implements ProxyHandler<object> {
  get(target: object, key: string | symbol, receiver: any) {
    // 收集依赖，绑定 target 中某一个 key 和 sub 之间的关系
    track(target, key)

    const res = Reflect.get(target, key, receiver)
    if (isRef(res)) return res.value
    // 如果传来的是个 reactive({a: {b: 0}})
    if (isObject(res)) return reactive(res)
    return res
  }
}

class MutableReactiveHandler extends BaseReactiveHandler {
  set(target: any, key: string | symbol, newValue: any, receiver: any) {
    const oldValue = target[key]

    const targetIsArray = isArray(target)
    const oldLength = targetIsArray ? target.length : 0

    // target = reactive({a:ref(0)}) ==> target.a = 1 ==> a.value = 1
    if (isRef(oldValue) && !isRef(newValue)) {
      oldValue.value = newValue
      return true
    }
    // 触发更新，set 的时候，通知之前的依赖，重新执行
    const res = Reflect.set(target, key, newValue, receiver)

    if (hasChanged(newValue, oldValue)) trigger(target, key)

    /**
     * 隐式更新 length
     * 更新前：length = 4 => ['a', 'b', 'c', 'd']
     * 更新后：length = 5 => ['a', 'b', 'c', 'd', 'e']
     * 更新动作，以 push 为例，追加有个 e
     */
    const newLength = targetIsArray ? target.length : 0

    if (targetIsArray && newLength !== oldLength && key !== 'length') {
      trigger(target, 'length')
    }

    return res
  }
}

export const mutableHandlers: ProxyHandler<object> =
  new MutableReactiveHandler()
