import { patchClass } from './modules/patchClass'
import { RendererOptions } from './renderer'
import { isOn } from './general'
import { patchStyle } from './modules/patchStyle'
import { patchEvent } from './modules/patchEvent'
import { patchAttr } from './modules/patchAttr'

type DOMRendererOptions = RendererOptions<Node, Element>

/**
 * 1. class
 * 2. style
 * 3. event
 * 4. attrs
 * @param el
 * @param key
 * @param prevValue
 * @param nextValue
 */
export const patchProp: DOMRendererOptions['patchProp'] = (
  el,
  key,
  prevValue,
  nextValue,
) => {
  if (key === 'class') {
    patchClass(el, nextValue)
  } else if (key === 'style') {
    patchStyle(el, prevValue, nextValue)
  } else if (isOn(key)) {
    patchEvent(el, key, nextValue)
  } else {
    patchAttr(el, key, nextValue)
  }
}
