// 临时需要执行的订阅事件
import { endTracking, Link, startTracking, Subscriber } from './system'

export class ReactiveEffect<T = any> implements Subscriber {
  depsHead: Link | undefined
  depsTail: Link | undefined
  tracking: boolean = false
  dirty: boolean = false
  // 表示这个 effect 是否激活
  active: boolean = true

  constructor(public fn: () => T) {}

  run(): T {
    if (!this.active) {
      return this.fn()
    }
    const prevSub: Subscriber | undefined = activeSub

    // 每次执行 fn 之前，把 this 放到 activeSub 上面
    setActiveSub(this)
    startTracking(this)
    try {
      return this.fn()
    } finally {
      // 执行完成后，恢复之前的 activeSub
      setActiveSub(prevSub)
      endTracking(this)
    }
  }

  /**
   * 通知更新的方法，如果依赖的数据发生变化，会调用这个函数
   */
  notify() {
    this.scheduler()
  }

  /**
   * 默认调用 run，如果用户传了，那以用户的为主
   */
  scheduler() {
    this.run()
  }

  stop() {
    if (this.active) {
      // 清理依赖
      startTracking(this)
      endTracking(this)
      this.active = false
    }
  }
}

/**
 * 订阅 ref
 * @param fn 订阅事件
 * @param options
 */
export function effect<T = any>(fn: () => T, options?: any) {
  const e = new ReactiveEffect(fn)
  // scheduler
  Object.assign(e, options)

  e.run()

  // 绑定函数的 this
  const runner = e.run.bind(e)
  // 把 effect 的实例，放到函数属性中
  runner.effect = e
  return runner
}

export let activeSub: Subscriber | undefined = undefined

export function setActiveSub(sub: Subscriber | undefined): void {
  activeSub = sub
}
