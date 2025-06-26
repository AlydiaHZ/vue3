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

  createComment(text: string): HostNode

  setText(node: HostNode, text: string): void

  setElementText(node: HostElement, text: string): void

  parentNode(node: HostNode): HostElement | null

  nextSibling(node: HostNode): HostNode | null

  querySelector?(selector: string): HostElement | null

  setScopeId?(el: HostElement, id: string): void

  cloneNode?(node: HostNode): HostNode
}
