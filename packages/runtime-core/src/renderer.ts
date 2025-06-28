import { ShapeFlags } from '@vue/shared'
import { isSameVNodeType, VNode, VNodeArrayChildren } from './vnode'

export interface RendererNode {
  [key: string | symbol]: any
}

export interface RendererElement extends RendererNode {}

export interface RendererOptions<
  HostNode = RendererNode,
  HostElement = RendererElement,
> {
  patchProp(el: HostElement, key: string, prevValue: any, nextValue: any): void

  insert(el: HostNode, parent: HostElement, anchor?: HostNode | null): void

  remove(el: HostNode): void

  createElement(type: string): HostElement

  createText(text: string): HostNode

  setText(node: HostNode, text: string): void

  setElementText(node: HostElement, text: string): void

  parentNode(node: HostNode): HostElement | null

  nextSibling(node: HostNode): HostNode | null

  querySelector?(selector: string): HostElement | null

  setScopeId?(el: HostElement, id: string): void

  cloneNode?(node: HostNode): HostNode
}

export interface RendererElement extends RendererNode {}

export function createRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement,
>(options: RendererOptions<HostNode, HostElement>) {
  return baseCreateRenderer(options)
}

function baseCreateRenderer(options: RendererOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
  } = options

  const patch = (n1: VNode, n2: VNode, container: RendererElement) => {
    /**
     * 更新和挂载，都用这个函数
     * @param n1 老节点，之前的，如果有，表示要个 n2 做 diff，更新，如果没有，表示直接挂载 n2
     * @param n2 新节点
     * @param container 要挂载的容器
     */
    if (n1 === n2) return

    if (n1 && !isSameVNodeType(n1, n2)) {
      // 如果两个节点不是同一个类型，那就卸载 n1 直接挂载 n2
      unmount(n1)
      n1 = null
    }

    if (n1 == null) {
      // 挂载
      mountElement(n2, container)
    } else {
      // 更新
      patchElement(n1, n2)
    }
  }

  const patchProps = (
    el: RendererElement,
    oldProps: Record<string, unknown>,
    newProps: Record<string, unknown>,
  ) => {
    /**
     * 1. 删除老的 props
     * 2. 新增 props
     */
    if (oldProps) {
      // 删除老的 props
      for (const key in oldProps) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }

    if (newProps) {
      // 删除老的 props
      for (const key in newProps) {
        hostPatchProp(el, key, oldProps?.[key], newProps[key])
      }
    }
  }

  const patchChildren = (n1: VNode, n2: VNode) => {
    const el = n2.el

    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 新节点是 文本
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 老节点是 数组
        unmountChildren(n1.children as VNode[])
      }
      if (n1.children !== n2.children) {
        // 老节点是 文本
        hostSetElementText(el, n2.children as string)
      }
    } else {
      // 老的有可能是 数组 或者 null
      // 新的有可能是 数组 或者 null
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 老的是文本
        // 老节点是 文本 | 新节点是 数组
        hostSetElementText(el, '')
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(n2.children as VNode[], el)
        }
      } else {
        // 老的数组 或者 null
        // 新的数组 或者 null
        if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 老的是数组
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 新的也是数组
            // TODO
          } else {
            // 新的不是数组，卸载老的数组
            unmountChildren(n1.children as VNode[])
          }
        } else {
          // 老的是 null，挂载新的
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(n2.children as VNode[], el)
          }
        }
      }
    }
  }

  const patchElement = (n1: VNode, n2: VNode) => {
    /**
     * 复用 DOM 元素
     * 更新 props
     * 更新 children
     */
    // 复用 DOM 元素
    const el = (n2.el = n1.el)

    // 更新 props
    const oldProps = n1.props
    const newProps = n2.props
    patchProps(el, oldProps, newProps)

    // 更新 children
    patchChildren(n1, n2)
  }

  const mountElement = (vnode: VNode, container: RendererElement) => {
    /**
     * 1. 创建一个 DOM 节点
     * 2. 设置 props
     * 3. 挂载子节点
     */
    const { type, props, children, shapeFlag } = vnode
    // 创建 DOM 元素 type = div p span
    const el = hostCreateElement(type)
    vnode.el = el
    // 处理 props
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 子节点是文本
      hostSetElementText(el, children as string)
    } else {
      // 子节点是数组
      if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(children as VNode[], el)
      }
    }
    hostInsert(el, container)
  }

  const mountChildren = (children: VNodeArrayChildren, el: RendererElement) => {
    for (const child of children) patch(null, child as VNode, el)
  }

  const unmountChildren = (children: VNodeArrayChildren) => {
    for (const child of children) unmount(child as VNode)
  }

  const unmount = (vnode: VNode) => {
    const { children, shapeFlag } = vnode
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(children as VNode[])
    }
    hostRemove(vnode.el)
  }

  const render = (vnode: VNode, container: RendererElement) => {
    if (vnode == null) {
      if (container._vnode) {
        // 卸载
        unmount(container._vnode)
      }
    } else {
      // 挂载 & 更新
      patch(container._vnode || null, vnode, container)
    }

    container._vnode = vnode
  }
  return {
    render,
  }
}
