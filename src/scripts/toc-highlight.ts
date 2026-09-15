/**
 * 目录的滚动高亮：滚动时把当前所在的小节在目录里加粗上色（`.active-heading`）。
 * 桌面侧栏与移动端抽屉共用；目录项与页面上 h2/h3 锚点必须一一对应，
 * 数量不等说明正文结构变了（拼了别的标题区块），静默跳过而不是乱标。
 */
export function initTocHighlight(list: HTMLElement) {
  const anchors = document.querySelectorAll<HTMLElement>('h2[id], h3[id]')
  const links = list.querySelectorAll<HTMLElement>('li')
  if (anchors.length === 0 || anchors.length !== links.length) return

  const update = () => {
    let highlighted = false
    // 从后往前走，命中的第一个就是当前小节
    for (let i = anchors.length - 1; i >= 0; i--) {
      const hit = !highlighted && window.scrollY > anchors[i].offsetTop - 75
      links[i].classList.toggle('active-heading', hit)
      if (hit) highlighted = true
    }
  }

  window.addEventListener('scroll', update, { passive: true })
  update()
}
