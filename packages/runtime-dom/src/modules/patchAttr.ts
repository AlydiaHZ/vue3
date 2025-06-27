export function patchAttr(el: Element, key: string, value: any) {
  if (value == undefined) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, value)
  }
}
