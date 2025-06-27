export function patchClass(el, value) {
  if (value != undefined) {
    el.className = value
  } else {
    el.removeAttribute('class')
  }
}
