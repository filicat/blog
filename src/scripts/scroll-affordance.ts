/**
 * 浮动控件的渐进增强：元素以 `hidden` 起步（无 JS 时不可见），脚本接管显隐动画。
 * `ScrollUpButton` 与 `MobileToc` 共用。
 */

/** 用过渡而不是 `display` 切换显隐；`show()` 必须先移除 `hidden` 再强制一次重排，否则过渡不触发。 */
export function transitionHiddenElement(
  element: HTMLElement,
  transitionProperty: string,
  transitionClass: string,
) {
  const listener = (e: TransitionEvent) => {
    if (e.target === element && e.propertyName === transitionProperty) {
      element.setAttribute('hidden', 'true')
      element.removeEventListener('transitionend', listener)
    }
  }
  return {
    show() {
      element.removeEventListener('transitionend', listener)
      element.removeAttribute('hidden')
      // Force a browser re-paint
      const _reflow = element.offsetHeight
      element.classList.add(transitionClass)
    },
    hide() {
      element.addEventListener('transitionend', listener)
      element.classList.remove(transitionClass)
    },
  }
}

/**
 * 正文（`article div.prose`）顶到视口最上方时回调 `true`：即已经读进正文。
 * 判定用「视口顶部 5% 这条窄带」（`rootMargin` 的负 bottom），所以此时内容必须落在窄带内。
 */
export function observeProseEnteringTop(
  prose: Element,
  onChange: (entered: boolean) => void,
) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => onChange(entry.isIntersecting))
    },
    // Only consider the top 5% of the viewport
    { rootMargin: `0px 0px -95% 0px` },
  )
  observer.observe(prose)
}

/** 元素完全滚出视口时回调 `true`，重新出现时回调 `false`。 */
export function observeElementLeavesViewport(
  element: Element,
  onChange: (left: boolean) => void,
) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => onChange(!entry.isIntersecting))
  })
  observer.observe(element)
}
