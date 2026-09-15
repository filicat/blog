import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

// 笔记：章/节/篇 三级中文目录，URL 前缀 /notes/
// id 就是文件相对路径去掉扩展名（含中文与 `01-` 序号前缀），所以 id 即 URL，改名即 404
const notes = defineCollection({
  loader: glob({
    pattern: ['**/*.md', '**/*.mdx'],
    base: './src/content/notes',
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      published: z.coerce.date(),
      updated: z.coerce.date().optional(),
      draft: z.boolean().optional().default(false),
      description: z.string(),
      author: z.string().optional(),
      series: z.string().optional(),
      tags: z.array(z.string()).optional().default([]),
      coverImage: z
        .strictObject({
          src: image(),
          alt: z.string(),
        })
        .optional(),
      toc: z.boolean().optional().default(true),
    }),
})

// 首页横幅（可选）：存在 src/content/home.md 时首页才渲染头像 + 简介
const home = defineCollection({
  loader: glob({ pattern: ['home.md', 'home.mdx'], base: './src/content' }),
  schema: ({ image }) =>
    z.object({
      avatarImage: z
        .object({
          src: image(),
          alt: z.string().optional().default('头像'),
        })
        .optional(),
      githubCalendar: z.string().optional(),
    }),
})

export const collections = { notes, home }
