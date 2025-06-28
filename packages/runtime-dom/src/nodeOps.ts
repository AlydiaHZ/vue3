import { RendererOptions } from '@vue/runtime-core'

export const nodeOps: Omit<RendererOptions<Node, Element>, 'patchProp'> = {
  // 插入节点
  insert(el, parent, anchor) {
    parent.insertBefore(el, anchor || null)
  },
  // 创建元素
  createElement(type) {
    return document.createElement(type)
  },
  // 设置内容
  setElementText(el, text) {
    el.textContent = text
  },
  // 移除元素
  remove(el) {
    const parentNode = el.parentNode
    if (parentNode) {
      parentNode.removeChild(el)
    }
  },
  // 创建文本节点
  createText(text) {
    return document.createTextNode(text)
  },
  // 设置文本节点
  setText(node, text) {
    return (node.nodeValue = text)
  },
  // 获取父节点
  parentNode(el) {
    return el.parentNode as Element | null
  },
  // 获取下一个兄弟节点
  nextSibling(el) {
    return el.nextSibling
  },
  // DOM 查询
  querySelector(selector) {
    return document.querySelector(selector)
  },
}
