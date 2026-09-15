import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		date: z.coerce.date(),
	}),
});

// 学习笔记：章/节/篇 三级中文目录，URL 前缀 /notes/；id 就是文件路径去掉扩展名
const notes = defineCollection({
	loader: glob({
		pattern: '**/*.md',
		base: './src/content/notes',
		generateId: ({ entry }) => entry.replace(/\.md$/, ''),
	}),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		date: z.coerce.date(),
	}),
});

export const collections = { blog, notes };
