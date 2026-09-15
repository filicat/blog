# AGENTS.md — 项目说明（给 AI 协作者）

个人静态站点，线上 **https://blog-akm.pages.dev** ，Cloudflare Pages 托管，push 到 `main` 自动构建部署。

内容两块：**哑铃减脂计划**（`/plan/`）与 **Java 面试笔记**（`/notes/`）。

技术栈：Astro v7（纯静态输出，无 SSR、无 UI 框架 island）+ **MultiTerm 主题**（MIT，见 `LICENSE-multiterm.txt`）：Tailwind v4、Astro Expressive Code、MDX、KaTeX、Rehype/Remark 插件链、Pagefind 全文搜索、RSS + sitemap、Satori 社交卡片、20 套 Shiki 配色的运行时切换。

主题源码：<https://github.com/stelcodes/multiterm-astro>（本站是移植 + 按本站路由适配，不是原样克隆）。

## 目录与职责

| 路径 | 作用 |
| --- | --- |
| `src/site.config.ts` | **站点配置唯一来源**：域名、标题、作者、字体、分页条数、`trailingSlashes`、导航、配色（`themes.mode/include/default/overrides`）、社交链接、Giscus |
| `src/content.config.ts` | 内容契约：`notes`、`home` 两个集合的 glob loader 与 frontmatter schema |
| `src/content/notes/**/*.md` | 笔记正文，**新增笔记只在这里加文件**，章/节/篇三级中文目录 |
| `src/content/home.md` | 可选：存在时首页渲染头像 + 简介横幅。**当前不存在**（不替用户编造个人简介） |
| `src/pages/index.astro` | 首页：两张入口卡（计划 / 笔记）+ 「最近更新」（最多 3 篇） |
| `src/pages/notes/index.astro` | 笔记目录页（`/notes/`）：把 `notes-plan.ts` 路线图与实际文件比对，显示章/节/篇、已写/待写与完成度 |
| `src/pages/notes/[...slug].astro` | 笔记详情路由（`/notes/<章>/<节>/<篇>/`），`data-pagefind-body`，含目录侧栏、相邻笔记、系列、评论区 |
| `src/pages/plan.astro` | 哑铃减脂计划页（`/plan/`）。正文逐字移植，**版式不要动**，见「约定与红线」 |
| `src/pages/404.astro` | 404 页（产出 `dist/404.html`，它关闭了 Pages 的任意路径回落，**不可删除**）；用 `noindex` |
| `src/pages/rss.xml.ts` | RSS（`/rss.xml`），样式表 `public/rss.xsl` |
| `src/pages/robots.txt.ts` | robots.txt，指向 `sitemap-index.xml` |
| `src/pages/social-cards/[...slug].png.ts` | og:image 社交卡片；`__default.png` 是兜底，其余按笔记 id |
| `src/pages/tags/[tag]/[...page].astro`、`src/pages/series/[slug].astro` | 标签 / 系列聚合页。笔记没写 `tags`/`series` 时不产生任何页面（当前即是） |
| `src/pages/giscus/[theme].css.ts` | Giscus 主题样式表。**当前 `giscus: undefined`，该路由只是待用** |
| `src/layouts/Layout.astro` | 全站 layout（主题版）：`<head>`、canonical/og、配色变量内联、`Header`/`Footer`。props：`title`、`description?`、`tags?`、`author?`、`noindex?` |
| `src/layouts/BareLayout.astro` | **plan 页专用孤岛 layout**：只引 `plan.css`，不引主题层。见「约定与红线」 |
| `src/styles/global.css` | 主题全局样式：Tailwind v4 `@theme`（`--theme-*` → `--color-accent` 等）、字体栈、`@view-transition`、`.prose` 正文排版 |
| `src/styles/plan.css` | plan 页样式，逐字照搬。**不要改** |
| `src/components/` | 主题组件（Header/Footer/PostPreview/PostInfo/TableOfContents/Tags/Search/SelectTheme/…）+ 本站原有的 `ExerciseCard.astro`、`SectionTitle.astro` |
| `src/plugins/` | remark/rehype 插件：description、reading-time、directive、admonitions、unknown-directives、gemoji、math、pixelated、title-figure |
| `src/utils.ts` | `getSortedPosts`（过滤 draft）、`dateString`、`resolveThemeColorStyles`、Tags/Series 分组 |
| `src/data/notes-plan.ts` | 笔记路线图（12 章 / 104 篇，对齐 D1–D14）。「目录结构」以这个文件为准（空目录 git 不追踪） |
| `src/data/plan.ts` | plan 页的 21 条动作数据（动作名/重量/步骤/要领/避坑/示意图 SVG） |
| `public/` | 原样拷贝：`favicon.svg`、`_redirects`（`/blog` → `/` 301）、`rss.xsl` |

## 新增一篇面试笔记（标准动作）

1. 在 `src/content/notes/<章>/<节>/<篇>.md` 建文件，**目录和文件名都用中文**（与 `notes-plan.ts` 一致）：

   ```
   src/content/notes/01-Java基础/01-泛型/03-通配符与PECS.md
   → /notes/01-Java基础/01-泛型/03-通配符与PECS/
   ```

   `id` = 相对 `src/content/notes` 的路径去掉扩展名，**含中文**；文件名前缀 `01-`/`02-` 同时决定顺序（按路径字符串排序）。**改名即 404**。

2. frontmatter（schema 在 `src/content.config.ts`，字段名错/缺必填直接构建失败）：

   ```md
   ---
   title: 通配符与 PECS
   description: 一句话摘要，列表与 RSS 都用它
   published: 2026-09-15
   ---
   ```

   可选字段：`updated`、`draft: true`（生产构建不渲染）、`author`、`series`、`tags: []`、`coverImage: { src, alt }`、`toc: false`（关目录侧栏）。
   **日期字段是 `published`，不是 `date`**（主题 schema）。

3. 正文里泛型写成 `` `List<String>` ``（反引号包裹）。裸写 `<String>` 会被 markdown 当 HTML 标签吞掉。
   支持的额外语法：KaTeX（`$…$` / `$$…$$`）、`:::note` 等 admonition、`::github` 卡片除外（插件未启用）。

4. 不在路线图里的篇目也能直接写，目录页会列在该章的「路线图外」；想纳入路线图就在 `src/data/notes-plan.ts` 对应章的 `planned` 里加文件名。

5. `npm run build` → commit → push，Pages 自动部署。

## 命令

- 构建：`npm run build` → `dist/`；`postbuild` 会自动跑 `pagefind --site dist` 生成搜索索引，**构建完才会出现搜索索引，dev 模式下搜索是空的**
- 本地预览：`npm run preview`（只监听 `[::1]:4321`，用 `http://localhost:4321/`）
- **不要用 `npx` 或直接 `node`**：本机 node/npm 的 exec 路径有问题（报 `node: bad option: --use-env-proxy`）。一律走 `npm run <script>` 或 `./node_modules/.bin/<bin>`
- 清缓存重建：`rm -rf .astro dist && npm run build`

## 部署

- Cloudflare Pages **Git 集成**，push 到 `main` 自动构建（build command `npm run build`，输出目录 `dist`），仓库里没有 wrangler 配置
- 刚部署完 curl 可能仍拿到上一版（边缘缓存要几十秒收敛）。复核加 `-H 'Cache-Control: no-cache'`
- `site.config.ts` 里的 `site` 必须与线上域名一致（canonical / og:url / sitemap / RSS 都取自它），**绑自定义域名时要同步改**
- 不要引入 `@astrojs/cloudflare` adapter：纯静态站，Pages 直接托管 `dist/`

## 约定与红线

- **plan 页是孤岛**：`plan.astro` 走 `BareLayout.astro`（只引 `plan.css`），**绝不能让它吃到主题层**——Tailwind preflight（`*{margin:0;padding:0;border:0}` + `html{line-height:1.5}`）会当场毁掉它的排版。新增全局样式时先确认不会漏进 plan 页
- **`src/styles/plan.css` 不要改**；plan 页 `.wrap` 子树里**一个参与文档流的元素都不能多/少**
- plan 页的「返回首页」是 `.wrap` **外**的 `position:fixed` 胶囊 `.home-float`（样式在 `BareLayout.astro` 里，含它用的变量与 `.copy-btn` 规则）。**不要把它塞进 `.wrap`**
- plan 页是**浅色单主题**：深色适配需要再补 130 行变量补丁，收益不值，别顺手加
- **字体：英数等宽 JetBrains Mono Variable，中文回落系统 CJK 黑体**（`global.css` 的 `--default-font-family` / `--default-mono-font-family`）。不引 CJK webfont（5–20MB 或要做子集化），代价是中文不等宽
- **绝不在 `BareLayout`/`plan.astro` 里改 `body` 字体**：`plan.css` 自带 `body{font-family:…}`，覆盖它会让每个字形度量变化、1154 个 rect 全抖
- **配色机制**：`site.config.ts` 的 `themes.include` 里每个主题 → `Layout.astro` 构建期用 `resolveThemeColorStyles()` 解析成 31 个 `--theme-*` → 内联 `<style is:inline>` 写成 `:root[data-theme="<id>"] { … }`（**20 个主题的变量会内联进每个页面**，别把 60 个全开）→ `global.css` 的 `@theme` 把它们映射成 Tailwind token（`text-accent`、`bg-foreground/5`、`text-heading1`…）。模式 `select`（读者用顶栏调色板按钮自选，`localStorage` 持久化）/ `single` / `light-dark-auto`
- 写样式**只用主题 token**（`text-accent`、`bg-foreground/3`、`border-accent/30`、`text-heading2`…），不要另起一套 hex 配色；`overrides` 里可以给某个主题单独改某个 key（值可写颜色，也可写另一个 themeKey）。**改 overrides 前先读下面「配色与对比度」一节**（18 主题 / 205 条对照度的让步，别当垃圾改回去）
- JS 是渐进增强：关掉 JS 页面必须照常可读（搜索/配色按钮由 custom element 启用，脚本不跑就是 `disabled`）。**不要引入 UI 框架**
- 不要删 `src/pages/404.astro`：删掉后 Pages 会把**任意路径**（含拼错的 `.css`）回落成首页并返回 200
- **集合只有 `notes` 与 `home`**：`blog` 集合已删除，文章改走 `notes`（`/blog` 与 `/blog/` 在 `public/_redirects` 里 301 到 `/`）。不要为内容新加 `.astro` 页面
- 路径别名 `~/*` → `src/*`（`tsconfig.json` 里配了 `paths` 与 `verbatimModuleSyntax`）；`import type` 必须显式写 `type`
- 笔记是**公开复习博客**：正文与页面文案不写招聘口径——「N 家里 M 家要求 X」这类统计、公司名、薪资、岗位优先级推导，一律不出现；要表达优先级就说知识点本身重要在哪
- 仓库是 public：任何 token、密钥、账号凭据都不得写入文件
- 提交信息：`feat: …` / `fix: …`，中文描述
- **有意未启用**：Giscus 评论（`giscus: undefined`；启用需开 Discussions + 装 Giscus app + 配 `giscus.json`）、`home` 横幅（没写 `src/content/home.md`）、`addendum` 集合、`remarkGithubCard`（构建期打 GitHub API，脆弱）、`remarkCharacterDialogue`。`socialCardAvatarImage` 指向不存在的 `./src/content/avatar.jpg`，社交卡片因此只有标题（代码里有 `fs.existsSync` 兜底）

## 配色与对比度（`themes.overrides`）

20 套配色里有 18 套带手写 `overrides`（合计 **205 条 token**），目的只有一个：**让正文与彩色文字在本站真实背景上满足 WCAG AA（正常文本 ≥4.5:1）**。

生成规则：

- 只沿 HSL **明度**步进（浅底 −0.01、深底 +0.01），**色相与饱和度不动**——映射到同主题其它 token 会把 `everforest-light`、`one-dark-pro` 压成单色
- 判定要同时满足：① 纯背景 ≥4.55:1 ② 叠上 12% 同色底纹后仍 ≥4.55:1（留余量）
- 每主题一行注释 + 每条 `k: '#hex', // was <旧值> (x:1) → y:1`
- **文字一律不用半透明色**：`text-foreground/60` 之类会随底纹衰减，已全量清除
- **彩色文字不叠异色/较强底纹**：徽标要么「无底纹 + 同色边框」，要么「中性底纹（`bg-foreground/8`）+ foreground 文字」

重生成流程（**必须从默认值出发**）：

1. 把 `site.config.ts` 的 `overrides` 临时清空成 `{}` → `npm run build` → 从产物里读每个主题的默认 `--theme-*`（`Layout.astro` 已把 `:root[data-theme="X"]{…}` 内联进 HTML）
2. 用默认值扫描 → 生成新 overrides → 写回 → 再构建

跳第 1 步会把上一轮已修正的值当默认值，未触发修正的键全丢。

测量坑：

- 同一个 `page.evaluate` 里 `setAttribute('data-theme', t)` 后立刻读样式会读到**上一个主题**；必须另起一次 evaluate 且等 420–450ms（还有 160ms 颜色过渡）
- 比色要用 **canvas 合成法**（把祖先链背景色依次 `fillRect` 再取像素）；`getComputedStyle().color` 对 `oklab(… / 0.6)` 会给假数据
- 扫描面：`/`、`/notes/`、一篇详情页 × 每个主题 × 每个「直接含文本」的可见节点

## 验证方法

- **plan 页保真基线**：headless browser 打开原始文件（`~/文档/deepseek_html_20260914_3c76d1.html`，`file://` URL 需百分号编码）与页面 `/plan/`，对 `.wrap` 子树逐元素比对 `tag.class`、`getBoundingClientRect`、直接文本，再加 `document.documentElement.scrollHeight` 与 `.wrap` 自身 rect。**基线是「零差异」**：`.wrap` 内 **1154 个元素**全等、`scrollHeight` 相等（1365×768 下 3497、390×844 下 3679；随字体环境变化，关键是两页相等）
  - `.home-float` 故意不算差异：它在 `.wrap` **外**且 `position:fixed`
  - 跳过 `SCRIPT`/`STYLE`，只比 rect 与文本（Astro 会加 `data-astro-cid-*`）
  - ⚠️ 视口用 `page.setViewport()`；`browser.open({viewport})` 挂在 CDP 上时不一定生效
  - ⚠️ 刚打开的标签页（尤其 `file://`）布局可能没落定，差异成片时先隔 300ms 复测；只信 `.wrap` 宽高、`scrollHeight`、字体栈三项都对得上的那次读数
- **配色**：切主题后 `getComputedStyle(document.body).backgroundColor` 必须变；**沉降 ≥450ms 再读**（160ms 颜色过渡会造假失败，且要 `localStorage['data-theme-hash']` 一致才生效）
- **搜索（Pagefind）**：
  - `Search.astro` 在生产构建里 `import('@pagefind/default-ui')` → `new PagefindUI({ bundlePath: '/pagefind/', … })`，索引由 `postbuild` 生成，dev 模式无索引
  - 界面词条是**手写显式 `translations`**（取自 Pagefind 官方 zh-cn 翻译）：`@pagefind/default-ui` 自带的语言探测在本站（`lang="zh-CN"`）**总是退回英文**，实测 `zh-CN`/`zh-cn`/`zh` 三种 `lang` 输出都是 `Search`，别指望它自动判断
  - ⚠️ **「搜索卡在正在搜索…」的头号假阳性来自测试浏览器，不是站点 bug**：omp 托管 Chromium 的 UA 伪装 shim 会把**页面脚本创建的每个 worker 包成 `blob:` worker**，blob 基址下 Pagefind 的 `fetch('/pagefind/pagefind-entry.json')` 直接 `Failed to parse URL`，UI 永远停在 `正在搜索 [TERM]...` 且**无任何 console 报错**。判定：页面里 `new Worker('/x.js')` 上报的 `self.location.href` 是 `blob:` 即被包了（用 `page.browser().on('targetcreated')` 看 worker URL，或 CDP attach 后用 `Debugger.getScriptSource` 取脚本内容，会看到 window 伪装 shim）
  - 所以验证搜索必须**自带一个未注入 shim 的浏览器**再走 CDP 附加：
    `/home/lhf/.omp/puppeteer/chrome/linux-*/chrome-linux64/chrome --headless=new --no-sandbox --remote-debugging-port=9333 --user-data-dir=/tmp/cleanprof about:blank`
    然后 `browser.open({ app: { cdp_url: 'http://127.0.0.1:9333' } })`。此浏览器里 Ctrl+K → `泛型` 应得到 `找到 2 个 泛型 的相关结果`（8 个链接，首条 href `/notes/01-Java基础/01-泛型/01-从getClass说起/`），无匹配词应得到 `未找到 … 的相关结果`
- **路由自检**（`curl -H 'Cache-Control: no-cache'`）：`/` 200、`/notes/` 200、`/notes/01-Java基础/01-泛型/01-从getClass说起/` 200（中文路径百分号编码）、`/plan/` 200 且 **HTML 里不含 Tailwind/主题 CSS 引用**、`/rss.xml` 与 `/robots.txt` 200、`/social-cards/__default.png` 200 且 `content-type: image/png`、`/blog` 301 → `/`、`/foo` 404 且返回自定义 404 页
- ⚠️ `tab.run` 不捕获外层闭包（要 `JSON.stringify` 内插或整个定义在 run 内）；每个 URL 新开 tab 并 await 自己的 run
- ⚠️ 本地删掉 markdown 后重建，`.astro/` 缓存可能仍含已删条目。`rm -rf .astro dist` 再 build（CI 全新克隆不受影响）

## 当前状态

- 路由：`/`（首页两张入口卡 + 最近更新）、`/notes/`（目录与进度）、`/notes/<章>/<节>/<篇>/`（详情）、`/plan/`（孤岛）、`/rss.xml`、`/robots.txt`、`/social-cards/*.png`、`/404`
- 笔记：路线图 12 章 / 104 篇，已写 2 篇（`01-Java基础/01-泛型/01-从getClass说起`、`01-Java基础/01-泛型/02-擦除之后`）。进度由 `/notes/` 构建期实时统计
- 文章（原 `blog` 集合）：0 篇，集合已删
- 主题：20 套配色，默认 `catppuccin-mocha`，顶栏调色板按钮切换；其中 18 套带对比度 `overrides`（205 条）；搜索走 Pagefind（构建期索引），界面词条中文硬编码；无 JS 时搜索/配色按钮为 `disabled`，正文照常可读
