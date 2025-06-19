// 用来保存当前正在执行的 effect
import { Link } from './system'

export let activeSub

export class ReactiveEffect<T = any> {
  // 依赖项链表的头节点
  deps: Link | undefined
  // 依赖项链表的尾节点
  depsTail: Link | undefined

  constructor(public fn: () => T) {}

  run(): T {
    // 先将当前的 effect 保存起来，用来处理嵌套的逻辑
    const prevSub = activeSub

    // 每次执行 fn 之前，把 this 放到 activeSub上面
    activeSub = this
    this.depsTail = undefined

    try {
      return this.fn()
    } finally {
      // 执行完成后，恢复之前的activeSub
      activeSub = prevSub
    }
  }

  /**
   * 通知更新的方法，如果依赖的数据发生了变化，会调用这个函数
   */
  notify() {
    this.scheduler()
  }

  /**
   * 默认调用 run，如果用户传了，那以用户的为主，实例属性的优先级，优于原型属性
   */
  scheduler() {
    this.run()
  }
}

export function effect<T = any>(fn: () => T, options?: any) {
  const e = new ReactiveEffect(fn)

  Object.assign(e, options)

  e.run()

  const runner = e.run.bind(e)
  runner.effect = e
  return runner
}
