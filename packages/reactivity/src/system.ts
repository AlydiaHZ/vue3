import { ReactiveEffect } from './effect'

/**
 * 依赖项
 */
interface Dep {
  // 订阅者链表的头节点
  subs: Link | undefined
  // 订阅者链表的尾节点
  subsTail: Link | undefined
}

/**
 * 订阅者
 */
interface Sub {
  // 订阅者链表的头节点
  deps: Link | undefined
  // 订阅者链表的尾节点
  depsTail: Link | undefined
}

/**
 * 链表节点
 */
export interface Link {
  // 订阅者
  sub: Sub
  // 下一个订阅者节点
  nextSub: Link | undefined
  // 上一个订阅者节点
  prevSub: Link | undefined
  // 依赖项
  dep: Dep
  // 下一个依赖项节点
  nextDep: Link | undefined
}

/**
 * 建立链表关系
 * @param dep
 * @param sub
 */
export function link(dep: Dep, sub: ReactiveEffect) {
  //region 尝试复用链表节点
  const currentDep = sub.depsTail
  /**
   * 分两种情况：
   * 如果头节点有，尾节点没有，那么尝试复用头节点
   * 如果尾节点还有 nextDep，尝试复用尾节点的 nextDep
   */
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep
    return
  }
  //endregion

  // 如果 activeSub 有，那就保存起来，等我更新的时候，触发
  const newLink: Link = {
    sub,
    nextSub: undefined,
    prevSub: undefined,
    dep,
    nextDep: undefined,
  }

  //region 将链表节点和 dep 建立关联关系
  /**
   * 关联链表关系，分两种情况
   * 1. 有尾节点 => 尾节点后加
   * 2. 没尾节点 => 第一次关联，头节点加，头尾相同
   */
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink
    newLink.prevSub = dep.subsTail
    dep.subsTail = newLink
  } else {
    dep.subs = newLink
    dep.subsTail = newLink
  }
  //endregion

  //region 将链表节点和 sub 建立关联关系
  /**
   * 关联链表关系，分两种情况
   * 1. 有尾节点 => 尾节点后加
   * 2. 没尾节点 => 第一次关联，头节点加，头尾相同
   */
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = newLink
    sub.depsTail = newLink
  }
  //endregion
}

/**
 * 传播更新的函数
 * @param subs
 */
export function propagate(subs) {
  // 头节点
  let link = subs
  let queueEffect = []
  while (link) {
    queueEffect.push(link.sub)
    link = link.nextSub
  }

  queueEffect.forEach(effect => effect.notify())
}
