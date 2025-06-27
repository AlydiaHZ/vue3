export interface RendererNode {
  [key: string | symbol]: any
}

export interface RendererElement extends RendererNode {}

export function createRenderer(options) {
  // 提供虚拟节点 渲染到页面上的功能
  const render = (vnode, container) => {}
  return {
    render,
    createApp(rootComponent) {
      return {
        mount(container) {},
      }
    },
  }
}
