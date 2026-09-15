# AGENTS.md — 项目说明（给 AI 协作者）

个人静态站点，线上 **https://blog-akm.pages.dev** ，Cloudflare Pages 托管，push 到 `main` 自动构建部署。

技术栈：Astro（纯静态输出，无 SSR、无 client JS）。

## 目录与职责

| 路径 | 作用 |
| --- | --- |
| `src/pages/index.astro` | 首页：站点标题 + 「计划」入口 + 文章列表（`getCollection('blog')`，按 `date` 倒序；没有文章时文章区块不渲染） |
| `src/pages/plan.astro` | 哑铃减脂完整计划页（URL `/plan/`）。正文从一份独立 HTML 逐字移植，**版式不要随意动** |
| `src/pages/404.astro` | 404 页（产出 `dist/404.html`，它关闭了 Pages 的 SPA 全路径回落，**不可删除**） |
| `src/pages/blog/[...slug].astro` | 文章详情路由，URL `/blog/<slug>/`；slug = markdown 文件名去掉扩展名 |
| `src/content.config.ts` | 内容契约：`blog`、`notes` 两个集合的 glob loader 与 frontmatter schema（唯一来源） |
| `src/content/blog/*.md` | 文章正文。**新增文章只在这里加文件** |
| `src/pages/notes/index.astro` | Java 面试笔记目录页（URL `/notes/`）：把 `notes-plan.ts` 的路线图与实际文件比对，显示章/节/篇与进度 |
| `src/pages/notes/[...slug].astro` | 笔记详情路由，URL `/notes/<章>/<节>/<篇>/`；id = 相对于 `src/content/notes` 的路径去掉扩展名（含中文） |
| `src/content/notes/**/*.md` | 笔记正文。**新增笔记只在这里加文件**，目录用中文，章/节/篇三级 |
| `src/data/notes-plan.ts` | 笔记路线图（12 章，对齐 D1–D14 复习计划）。空目录 git 不追踪，所以「目录结构」以这个文件为准 |
| `src/data/plan.ts` | 计划页的 21 条动作数据（动作名/重量/步骤/要领/避坑/示意图 SVG） |
| `src/components/` | `ExerciseCard.astro`（动作卡）、`SectionTitle.astro`（分区标题） |
| `src/layouts/Layout.astro` | 全站 `<head>`、canonical、og。props：`title`、`description?`、`noindex?` |
| `src/styles/plan.css` | 原站样式，逐字照搬，全局生效（`:root` 变量、表格、打印样式都在这里） |
| `src/styles/prose.css` | markdown 正文排版，只在文章页引入 |
| `public/` | 原样拷贝到产物根目录：`favicon.svg`、`_redirects` |
| `dist/`、`.astro/` | 构建产物与缓存，已 gitignore |

## 新增一篇文章（标准动作）

1. 新建 `src/content/blog/<slug>.md`。文件名即 URL：`knee-friendly-cardio.md` → `/blog/knee-friendly-cardio/`。slug 用英文小写连字符。
2. frontmatter 三个字段**全部必填**，schema 在 `src/content.config.ts`，缺失或类型错误会直接构建失败：

   ```md
   ---
   title: 膝友好的有氧替代方案
   description: 一句话摘要，显示在首页列表里
   date: 2026-09-15
   ---
   ```

3. 正文写普通 markdown：`##`/`###`、列表、表格、引用、代码块。图片放 `public/` 下，正文里用 `/图片名.png` 引用（构建期不会被处理，也不会优化）。
4. `npm run build` 本地确认 → `git commit && git push` → Pages 自动部署（约 40 秒）。

首页列表与文章页会自动出现，**不需要改任何页面代码**。

## 新增一篇面试笔记（标准动作）

1. 在 `src/content/notes/<章>/<节>/<篇>.md` 建文件，**目录和文件名都用中文**（与 `notes-plan.ts` 里的路线图一致）：

   ```
   src/content/notes/01-Java基础/01-泛型/02-类型擦除.md
   → /notes/01-Java基础/01-泛型/02-类型擦除/
   ```

   URL 里的文件名前缀 `01-`/`02-` 同时决定目录页顺序（按路径字符串排序）。

2. frontmatter 与文章同构，三个字段**全部必填**：

   ```md
   ---
   title: 类型擦除到底擦了什么
   description: 一句话摘要
   date: 2026-09-15
   ---
   ```

3. 正文里标题/表格中的泛型写成 `` `List<String>` ``（反引号包裹）。裸写 `<String>` 会被 markdown 当成 HTML 标签吞掉，页面上什么都看不到。

4. 如果这一篇不在路线图里，直接在 `src/data/notes-plan.ts` 对应章的 `planned` 数组里加文件名；忘了加也不会丢——目录页会把它列在该章的「路线图外」分组里。

5. `npm run build` → commit → push，Cloudflare Pages 自动部署。

**不需要改 `src/pages/notes/*`**：目录页每次构建都从 `notes-plan.ts` + 实际文件重新算进度。

## 命令

- 构建：`npm run build` → `dist/`
- 本地预览：`npm run preview`
- **不要用 `npx` 或直接 `node`**：本机 node/npm 的 exec 路径有问题（报 `node: bad option: --use-env-proxy`）。一律走 `npm run <script>` 或 `./node_modules/.bin/<bin>`

## 部署

- 方式：Cloudflare Pages **Git 集成**。push 到 `main` → 自动构建部署。线上域名 `https://blog-akm.pages.dev`
- 构建配置存在 Pages 项目侧（build command `npm run build`，输出目录 `dist`），仓库里没有 wrangler 配置
- 刚部署完 curl 可能仍拿到上一版（边缘缓存收敛要几十秒，**已多次遇到**）。复核加 `-H 'Cache-Control: no-cache'`，或直接请求部署专属 URL `https://<short_id>.blog-akm.pages.dev/`
- `astro.config.mjs` 里的 `site` 必须与线上域名一致（canonical / og:url 取自它）。**绑自定义域名时要同步改**
- 不要引入 `@astrojs/cloudflare` adapter：本站纯静态，Pages 直接托管 `dist/`；加 adapter 会走 Pages Functions，收益为零

## 约定与红线

- 计划页（`plan.astro` + `plan.css` + `src/data/plan.ts`）是从独立 HTML 逐字移植的。改它之前先说清楚改了什么、为什么；验证方法见下
- 新页面复用 `plan.css` 的 CSS 变量（`--orange` `--teal` `--blue` `--dark` `--gray` `--card` `--line` `--bg`），不要另起一套配色
- 不要删 `src/pages/404.astro`：删掉后 Pages 会把**任意路径**（包括拼错的 `.css`）回落成首页并返回 200
- 文章的 `date` 决定首页排序，改动会改变首页顺序
- 新增站点页面 = 在 `src/pages/` 加文件（URL 即文件路径）；但**文章必须走 `src/content/blog/`、笔记必须走 `src/content/notes/`**，不要为内容新加 `.astro` 页面
- 笔记目录名/文件名不要中途改名：`id` 即 URL，改名会让已发出去的链接 404
- 笔记是**公开复习博客**：正文和目录页的文案不要写招聘口径——「N 家里 M 家要求 X」这类统计、公司名、薪资、岗位优先级推导，一律不出现；要表达优先级就说知识点本身重要在哪
- 仓库是 public：任何 token、密钥、账号凭据都不得写入文件

## 验证方法

- **计划页保真**：headless browser 打开原始文件与线上页面，比对 `document.body.innerText`、关键选择器计数、所有元素的 `getBoundingClientRect`。原始文件在 `~/文档/deepseek_html_20260914_3c76d1.html`。已知的唯一故意差异：`nav.toc` 里多了「首页」链接（因为计划页已从 `/` 迁到 `/plan/`）
- **路由自检**（`curl -H 'Cache-Control: no-cache'`）：`/` 200、`/plan/` 200、`/plan` 308→`/plan/`、`/blog/<slug>/` 200、`/blog`（含 `/blog/`）301→`/`、`/notes/` 200、`/notes/01-Java基础/01-泛型/01-从getClass说起/` 200（中文路径要百分号编码）、`/foo` 404 且返回自定义 404 页（1720 字节）、`/_astro/*.css` 的 `content-type: text/css`
- **已知坑**：本地删掉一篇 markdown 后重建，`.astro/` 内容缓存可能仍含已删条目（首页还列着旧文章、`dist/blog/<slug>/` 还在）。`rm -rf .astro dist` 再 build 即可。CI 是全新克隆，不受影响

## 当前状态

- 路由：`/`（首页：「计划」「笔记」两张入口卡）、`/plan/`（计划）、`/blog/<slug>/`（文章）、`/notes/`（笔记目录与进度）、`/notes/<章>/<节>/<篇>/`（笔记详情）、`/404`
- 已发布文章：0 篇。首页目前只显示「计划」「笔记」两张入口卡，加第一篇 markdown 后文章列表自动出现
- 面试笔记：路线图 12 章 / 104 篇，已写 1 篇（`01-Java基础/01-泛型/01-从getClass说起`）。进度由 `/notes/` 构建期实时统计
