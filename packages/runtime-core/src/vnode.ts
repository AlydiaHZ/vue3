import { RendererNode } from './renderer'
import { Ref } from '@vue/reactivity'

export type VNodeRef = string | Ref
export type VNodeTypes = string | VNode

export type VNodeProps = {
  key?: PropertyKey
  ref?: VNodeRef
  ref_for?: boolean
  ref_key?: string
}
type VNodeChildAtom =
  | VNode
  | string
  | number
  | boolean
  | null
  | undefined
  | void

export type VNodeArrayChildren = Array<VNodeArrayChildren | VNodeChildAtom>

export type VNodeChild = VNodeChildAtom | VNodeArrayChildren

export type VNodeNormalizedChildren = string | VNodeArrayChildren | null

export interface VNode<
  HostNode = RendererNode,
  ExtraProps = { [key: string]: any },
> {
  __v_isVNode: true

  type: VNodeTypes
  props: (VNodeProps & ExtraProps) | null
  key: PropertyKey | null
  children: VNodeNormalizedChildren

  // DOM
  el: HostNode | null

  // optimization only
  shapeFlag: number
}

/**
 * 创建虚拟节点的底层方法
 * @param type 节点类型
 * @param props 节点属性
 * @param children 子节点
 */
export function createVNode(
  type: VNodeTypes,
  props: VNodeProps,
  children,
): VNode {
  const vnode: VNode = {
    __v_isVNode: true,
    type,
    props,
    children,
    // 做 diff 用的
    key: props?.key,
    // 虚拟节点要挂载的元素
    el: null,
    shapeFlag: 9,
  }

  return vnode
}
