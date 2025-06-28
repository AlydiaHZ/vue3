import { RendererNode } from './renderer'
import { Ref } from '@vue/reactivity'
import { isArray, isString, ShapeFlags } from '@vue/shared'

export type VNodeRef = string | Ref
export type VNodeTypes = string

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

export type VNodeNormalizedChildren = VNodeChildAtom | VNodeArrayChildren

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
  children: unknown = null,
): VNode {
  let shapeFlag: number

  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT
  }

  if (isString(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }
  const vnode = {
    __v_isVNode: true,
    type,
    props,
    children,
    // 做 diff 用的
    key: props?.key,
    // 虚拟节点要挂载的元素
    el: null,
    shapeFlag: shapeFlag,
  } as VNode
  return vnode
}

export function isVNode(value: any) {
  return value?.__v_isVNode
}

export function isSameVNodeType(n1: VNode, n2: VNode): boolean {
  return n1.type === n2.type && n1.key === n2.key
}
