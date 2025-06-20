import { RefImpl } from './ref'
import { ReactiveEffect } from 'vue'

/**
 * 依赖项
 */
interface Dep {
  subsHead: Link | undefined
  subsTail: Link | undefined
}

/**
 * 订阅者
 */
interface Sub {
  subsHead: Link | undefined
  subsTail: Link | undefined
}

/**
 * 链表节点
 */
export interface Link {
  sub: ReactiveEffect
  nextSub: Link | undefined
  prevSub: Link | undefined
  dep: Dep
  nextDep: Link | undefined
  prevDep: Link | undefined
}

/**
 *
 * @param dep 当前的 ref
 * @param sub 临时订阅事件
 */
export function link(dep: RefImpl, sub: ReactiveEffect) {
  // 新建节点
  const newLink: Link = {
    sub,
    nextSub: undefined,
    prevSub: undefined,
    dep,
    nextDep: undefined,
    prevDep: undefined,
  }

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
}

/**
 * 传播更新的函数
 * @param subs
 */
export function propagate(subs: Link) {
  let link = subs
  let queuedEffect = []
  while (link) {
    queuedEffect.push(link.sub)
    link = link.nextSub
  }
  queuedEffect.forEach(effect => effect.notify())
}
