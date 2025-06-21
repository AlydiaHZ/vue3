import { ReactiveEffect as Effect } from './effect'

/**
 * 依赖项
 */
export interface Dependency {
  subsHead: Link | undefined
  subsTail: Link | undefined
}

export interface Subscriber {
  depsHead: Link | undefined
  depsTail: Link | undefined
}

/**
 * 链表节点
 */
export interface Link {
  sub: Subscriber | Effect
  nextSub: Link | undefined
  prevSub: Link | undefined
  dep: Dependency
  nextDep: Link | undefined
}

let linkPool: Link

/**
 * 节点
 * @param dep 当前的 ref
 * @param sub 临时订阅事件
 */
export function link(dep: Dependency, sub: Subscriber): Link | undefined {
  //region 链表复用
  const currentDep = sub.depsTail

  const nextDep = currentDep === undefined ? sub.depsHead : currentDep.nextDep
  if (nextDep?.dep === dep) {
    sub.depsTail = nextDep
    return
  }

  /**
   * 看一下 linkPool 有没有，如果有，就复用
   */
  let newLink: Link
  if (linkPool) {
    newLink = linkPool
    linkPool = linkPool.nextDep
    newLink.nextDep = nextDep
    newLink.dep = dep
    newLink.sub = sub
  } else {
    // 如果有，就创建新节点
    newLink = {
      sub,
      nextSub: undefined,
      prevSub: undefined,
      dep,
      nextDep,
    }
  }
  //endregion

  //region 将链表节点和 dep 建立关联关系
  // 将节点放入本 ref 的订阅者链表中
  if (dep.subsTail) {
    // 如果有尾节点 => 不是头节点 => 在链表后面加入
    dep.subsTail.nextSub = newLink
    newLink.prevSub = dep.subsTail
    dep.subsTail = newLink
  } else {
    // 如果无尾节点 => 是头节点 => 设置为头节点
    dep.subsHead = newLink
    dep.subsTail = newLink
  }
  //endregion

  //region 将链表节点和 sub 建立关联关系
  // 将节点放入本 ref 的依赖项链表中
  if (sub.depsTail) {
    // 如果有尾节点 => 不是头节点 => 在链表后面加入
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    // 如果无尾节点 => 是头节点 => 设置为头节点
    sub.depsHead = newLink
    sub.depsTail = newLink
  }
  //endregion
}

/**
 * 传播更新的函数
 * @param subs
 */
export function propagate(subs: Link) {
  let link = subs
  let queuedEffect = []
  while (link) {
    const sub = link.sub
    if (!(sub as Effect).tracking) {
      queuedEffect.push(sub)
    }
    link = link.nextSub
  }
  queuedEffect.forEach(effect => effect.notify())
}

/**
 * 开始追踪依赖，将 depsTail，尾节点设置成 undefined
 * @param sub
 */
export function startTracking(sub: Effect): void {
  sub.tracking = true
  sub.depsTail = undefined
}

/**
 * 结束追踪依赖，找到需要清理的依赖，断开关联关系
 * @param sub
 */
export function endTracking(sub: Effect): void {
  sub.tracking = false
  const depsTail = sub.depsTail
  /**
   * depsTail 有，并且还有 nextDep，我们应该把它们的依赖关系清除
   * depsTail 没有，并且头节点有，那就把所有的都清理掉
   */
  if (depsTail) {
    if (depsTail.nextDep) {
      clearTracking(depsTail.nextDep)
      depsTail.nextDep = undefined
    }
  } else if (sub.depsHead) {
    clearTracking(sub.depsHead)
    sub.depsHead = undefined
  }
}

/**
 * 清除追踪
 * @param link
 */
export function clearTracking(link: Link) {
  while (link) {
    const { nextDep, nextSub, dep, prevSub } = link

    /**
     * 如果 prevSub 有，那就把 prevSub = nextSub
     * 如果没有，那就是头节点，那就把 dep.subs 指向当前节点的下一个节点
     */
    if (prevSub) {
      prevSub.nextSub = nextSub
      link.nextSub = undefined
    } else {
      dep.subsHead = nextSub
    }

    /**
     * 如果 nextSub 有，那就把 nextSub = prevSub
     * 如果没有，那就是尾节点，那就把 dep.depsTail 指向当前节点的上一个节点
     */
    if (nextSub) {
      nextSub.prevSub = prevSub
      link.prevSub = undefined
    } else {
      dep.subsTail = prevSub
    }

    link.dep = link.sub = undefined

    // 把不要的节点给 linkPool
    link.nextDep = linkPool
    linkPool = link

    link = nextDep
  }
}
