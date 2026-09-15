// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'
import mdx from '@astrojs/mdx'
import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import expressiveCode from 'astro-expressive-code'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeUnwrapImages from 'rehype-unwrap-images'
import rehypeKatex from 'rehype-katex'
import remarkDirective from 'remark-directive'
import remarkMath from 'remark-math'
import siteConfig from './src/site.config'
// 以下四个是 MultiTerm 主题自带的自定义插件（见 AGENTS.md「主题来源」）
import remarkDescription from './src/plugins/remark-description' /* 从正文首段填 frontmatter.description */
import remarkReadingTime from './src/plugins/remark-reading-time' /* 正文阅读时长 */
import { remarkAdmonitions } from './src/plugins/remark-admonitions' /* :::tip 之类的提示块 */
import remarkUnknownDirectives from './src/plugins/remark-unknown-directives'
import remarkGemoji from './src/plugins/remark-gemoji' /* :smile: 短代码表情 */
import rehypeTitleFigure from './src/plugins/rehype-title-figure' /* 图片 title 包成 figure */
import rehypePixelated from './src/plugins/rehype-pixelated' /* data-pixelated 图片 */

export default defineConfig({
  site: siteConfig.site,
  trailingSlash: siteConfig.trailingSlashes ? 'always' : 'never',
  prefetch: true,
  markdown: {
    remarkPlugins: [
      [remarkDescription, { maxChars: 200 }],
      remarkReadingTime,
      remarkDirective,
      remarkAdmonitions,
      remarkUnknownDirectives,
      remarkMath,
      remarkGemoji,
    ],
    rehypePlugins: [
      [rehypeHeadingIds, { headingIdCompat: true }],
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
      rehypeTitleFigure,
      [
        rehypeExternalLinks,
        {
          rel: ['noreferrer', 'noopener'],
          target: '_blank',
        },
      ],
      rehypeUnwrapImages,
      rehypePixelated,
      rehypeKatex,
    ],
  },
  image: {
    responsiveStyles: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap(),
    expressiveCode({
      themes: siteConfig.themes.include,
      useDarkModeMediaQuery: false,
      defaultProps: {
        showLineNumbers: false,
        wrap: false,
      },
      plugins: [pluginLineNumbers()],
    }),
    mdx(), // 必须排在 expressive-code 之后
  ],
  experimental: {
    contentIntellisense: true,
  },
})
