import { track, trigger } from './dep'
import { hasChanged, isObject } from '@vue/shared'
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
    // 触发更新，set 的时候，通知之前的依赖，重新执行
    const res = Reflect.set(target, key, newValue, receiver)

    // target = reactive({a:ref(0)}) ==> target.a = 1 ==> a.value = 1
    if (isRef(oldValue) && !isRef(newValue)) {
      oldValue.value = newValue
      return res
    }

    if (hasChanged(newValue, oldValue)) trigger(target, key)

    return res
  }
}

export const mutableHandlers: ProxyHandler<object> =
  new MutableReactiveHandler()
