import type { RemarkPlugin } from '@astrojs/markdown-remark'
import getReadingTime from 'reading-time'
import { toString } from 'mdast-util-to-string'

const remarkReadingTime: RemarkPlugin = (_options?) => {
  return function (tree, { data }) {
    if (data.astro?.frontmatter) {
      const textOnPage = toString(tree)
      const readingTime = getReadingTime(textOnPage)
      // readingTime.text 是英文的 "3 min read"，这里改成本站的「约 3 分钟」
      data.astro.frontmatter.minutesRead = `约 ${Math.ceil(readingTime.minutes)} 分钟`
    }
  }
}

export default remarkReadingTime
