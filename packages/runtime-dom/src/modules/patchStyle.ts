import { isString } from '@vue/shared'

type Style = string | Record<string, string | string[]> | null

/**
 * 设置 style
 * @param el
 * @param prev
 * @param next
 */
export function patchStyle(el: Element, prev: Style, next: Style): void {
  const style = (el as HTMLElement).style
  const isCssString = isString(next)
  if (next && !isCssString) {
    if (prev) {
      if (!isString(prev)) {
        // { color: 'red' }
        for (const key in prev) {
          if (next[key] == null) style[key] = null
        }
      } else {
        // 'color: red'
        for (const prevStyle of prev.split(';')) {
          const key = prevStyle.slice(0, prevStyle.indexOf(':')).trim()
          if (next[key] == null) style[key] = null
        }
      }
    }
    for (const key in next) {
      style[key] = next[key]
    }
  } else {
    if (isCssString) {
      if (prev !== next) {
      }
    } else if (prev) {
      el.removeAttribute('style')
    }
  }
}
