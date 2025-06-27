type EventValue = Function

interface Invoker extends EventListener {
  value: EventValue
}

export function addEventListener(
  el: Element,
  event: string,
  handler: Invoker,
): void {
  el.addEventListener(event, handler)
}

export function removeEventListener(
  el: Element,
  event: string,
  handler: Invoker,
): void {
  el.removeEventListener(event, handler)
}

// vei = vue event invokers
const veiKey: unique symbol = Symbol('_vei')

export function patchEvent(
  el: Element & { [veiKey]?: Record<string, Invoker | undefined> },
  rawName: string,
  eventValue: EventValue,
): void {
  const invokers = (el[veiKey] ??= {})
  const existingInvoker = invokers[rawName]
  if (eventValue && existingInvoker) {
    // 换绑
    existingInvoker.value = eventValue
  } else {
    const name: string = rawName.slice(2).toLowerCase()
    if (eventValue) {
      // 赋值
      const invoker = (invokers[rawName] = createInvoker(eventValue))
      addEventListener(el, name, invoker)
    } else if (existingInvoker) {
      // 清空
      removeEventListener(el, name, existingInvoker)
      invokers[rawName] = undefined
    }
  }
}

function createInvoker(eventValue: EventValue): Invoker {
  /**
   * 创建一个事件处理函数，内部调用 invoker.value
   * 如果需要更新事件，那后面直接修改 invoker.value 就完成事件换绑
   */
  const invoker = (e: Event) => invoker.value(e)
  invoker.value = eventValue
  return invoker
}
