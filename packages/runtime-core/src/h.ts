/*
// type only
h('div')

// type + props
h('div', {})

// type + omit props + children
// Omit props does NOT support named slots
h('div', []) // array
h('div', 'foo') // text
h('div', h('br')) // vnode
h(Component, () => {}) // default slot

// type + props + children
h('div', {}, []) // array
h('div', {}, 'foo') // text
h('div', {}, h('br')) // vnode
h(Component, {}, () => {}) // default slot
h(Component, {}, {}) // named slots

// named slots without props requires explicit `null` to avoid ambiguity
h(Component, null, {})
**/

import { isArray, isObject } from '@vue/shared'
import { createVNode } from './vnode'

export function h(type: any, propsOrChildren?: any, children?: any) {
  /**
   * h 函数，主要的作用是对一个 createVNode 做一个参数归一化
   */
  let l = arguments.length

  if (l === 2) {
    if (isArray(propsOrChildren)) {
      // h('div', []) // array
      return createVNode(type, null, propsOrChildren)
    }
    if (isObject(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        // h('div', h('br')) // vnode
        return createVNode(type, null, [propsOrChildren])
      }
      // h('div', {}) // props
      return createVNode(type, propsOrChildren, children)
    }
    // h('div', 'foo') // text
    return createVNode(type, null, propsOrChildren)
  } else {
    if (l > 3) {
      // h('div', {}, h('br'), h('br')) // vnode
      children = [...arguments].slice(2)
    } else if (l === 3 && isVNode(children)) {
      // h('div', {}, h('br')) // vnode
      children = [children]
    }
    return createVNode(type, propsOrChildren, children)
  }
}

function isVNode(value: any) {
  return value?.__v_isVNode
}
