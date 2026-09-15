# AGENTS.md — 项目说明（给 AI 协作者）

个人静态站点，线上 **https://blog-akm.pages.dev** ，Cloudflare Pages 托管，push 到 `main` 自动构建部署。

技术栈：Astro（纯静态输出，无 SSR、无 UI 框架 / 无 hydration）。

**允许极少量原生 JS**，目前只有 `src/layouts/Layout.astro` 里的两段，别再加别的：`<head>` 里一段 `is:inline` 的首屏主题脚本（防闪白，必须内联、必须同步），`<body>` 末尾一段打包脚本（主题切换按钮 + 代码复制按钮的接线）。判断标准是：**关掉 JS 页面必须照常可读**——所有按钮都由脚本注入，脚本不跑就没有按钮，也不会留下死按钮。引入任何框架（React/Vue/Svelte island、Alpine、htmx）都不行。

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
| `src/layouts/Layout.astro` | 全站 `<head>`、canonical、og、`theme.css` 引入、首屏主题内联脚本、顶部站点导航、右下角主题切换按钮、末尾的主题/复制脚本。props：`title`、`description?`、`noindex?`、`nav?`（默认 true；计划页传 false，见「约定与红线」） |
| `src/styles/plan.css` | 原站样式，逐字照搬，全局生效（`:root` 变量、表格、打印样式都在这里）。**不要改** |
| `src/styles/prose.css` | markdown 正文排版：行宽（`.wrap.reading`）、字号阶梯、段距、`.back` 返回胶囊，只在文章/笔记详情页引入 |
| `src/styles/theme.css` | 全局主题层：深色模式的变量覆盖、字体栈与阴影 token、顶部站点导航、主题切换按钮、代码复制按钮、计划页返回胶囊。**新增交互件、改深色配色都改这里** |
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

- 计划页（`plan.astro` + `plan.css` + `src/data/plan.ts`）是从独立 HTML 逐字移植的，`.wrap` 子树里**一个元素都不能多、不能少**。改它之前先说清楚改了什么、为什么；验证方法见下
- **计划页不参与站点导航**：`Layout` 的 `nav={false}` 让它不渲染 `.site-nav`（顶栏会进文档流，把整页元素下移）。计划页的「返回首页」入口由 `Layout` 在 `nav={false}` 时渲染成 `.home-float`——`position:fixed`，不参与文档流，所以不影响任何 rect 与 `scrollHeight`
- **所有 hover 位移/变色一律包 `@media (hover: hover)`**，位移再叠 `(prefers-reduced-motion: no-preference)`：触屏设备不该有点击前的浮起态，减少动效偏好下只留变色。`theme.css` 的 `prefers-reduced-motion` 块只关 `transition`
- **正文字体栈（`--font-sans`）只挂 `.prose` / `.entry` / `.site-nav` / `.home-float` / `.notfound`，绝不改 `body` 字体**：`plan.css` 给 `body` 定了字体，覆盖它会让计划页每个字形的度量变化、1154 个 rect 全部抖动
- **正文行宽用 `.wrap.reading`（`max-width:700px`）控制，不要改 `.wrap`**：`plan.css` 的 `.wrap{max-width:960px}` 是逐字照搬的，且计划页要多列宽版
- 字号阶梯（`prose.css`，正文 16.5px / 1.85，约 38 汉字/行）：h1 28 / h2 22 / h3 18 / h4 17 / 正文 16.5 / 行内 code 0.92em / pre 14 / 元信息与胶囊类 12.5
- 新页面复用 `plan.css` 的 CSS 变量（`--orange` `--teal` `--blue` `--dark` `--gray` `--card` `--line` `--bg`），不要另起一套配色；阴影统一用 `--shadow-1/2/3`
- **反白块要「底色 + 文字色」成对走变量**（如 404 的 `.home`：`background: var(--dark); color: var(--bg)`）。写死 `background: var(--dark); color: #fff` 在深色下会变成浅底白字（`--dark` 在深色里是浅色 ink），对比度掉到 1.21
- **主题机制**：`Layout.astro` 的 `<head>` 里那段内联脚本在首屏前把 `<html data-theme="light|dark">` 定下来（`localStorage.theme` 优先，没存过就跟 `prefers-color-scheme`；没手动选过时还会跟着系统变）。深色只在 `theme.css` 的 `html[data-theme='dark']` 里改写变量，所以**浅色是默认且必须与改动前逐像素一致**
- **不要在 `plan.css` / `prose.css` / 页面 `<style>` 里写死浅色面**（`#fff`、`#fafbfd` 这类）：深色下要把它们指向 `theme.css` 里定义的变量。`plan.css` 还有一批写死的浅色（`.toc a`、`.rule-item`、`th`、`.day`、`.hint`、`.donut::before` 等），深色覆盖集中在 `theme.css` 的「把写死的浅色面改走变量」那一段
- 代码块底色来自 Shiki 的行内 `github-dark`（`#24292e`），**浅色深色都是这个底**，别去覆盖 `.prose pre` 的背景
- 打印必须是浅色：`theme.css` 的 `@media print` 块把深色变量回落成浅色值，新增深色变量时要同步补进那个块
- 不要删 `src/pages/404.astro`：删掉后 Pages 会把**任意路径**（包括拼错的 `.css`）回落成首页并返回 200
- 文章的 `date` 决定首页排序，改动会改变首页顺序
- 新增站点页面 = 在 `src/pages/` 加文件（URL 即文件路径）；但**文章必须走 `src/content/blog/`、笔记必须走 `src/content/notes/`**，不要为内容新加 `.astro` 页面
- 笔记目录名/文件名不要中途改名：`id` 即 URL，改名会让已发出去的链接 404
- 笔记是**公开复习博客**：正文和目录页的文案不要写招聘口径——「N 家里 M 家要求 X」这类统计、公司名、薪资、岗位优先级推导，一律不出现；要表达优先级就说知识点本身重要在哪
- 仓库是 public：任何 token、密钥、账号凭据都不得写入文件

## 验证方法

- **计划页保真**：headless browser 打开原始文件（`~/文档/deepseek_html_20260914_3c76d1.html`）与页面 `/plan/`，对 `.wrap` 子树逐元素比对 `tag.class`、`getBoundingClientRect`、直接文本，再加 `document.documentElement.scrollHeight` 与 `.wrap` 自身 rect。**基线是「零差异」**：`.wrap` 内 1154 个元素全部相等、`scrollHeight` 相等（1365×768 下 3497、390×844 下 3679，随字体环境变化，关键是两页相等）
  - 计划页的返回入口故意不算差异：它在 `.wrap` **外**、`position:fixed`，既不进比对范围也不影响 `scrollHeight`
  - 比对时跳过 `tagName` 为 `SCRIPT`/`STYLE` 的元素，且只比 rect 与文本、不比属性（Astro 会加 `data-astro-cid-*`）
  - 视口要用 `page.setViewport()` 设；`browser.open({viewport})` 挂在 CDP 连接上时不一定生效（曾出现 390 宽视口读出 733 宽的 `.wrap`，两页同值但都没真变）
  - 刚打开的标签页布局可能还没落定（尤其 `file://` 那个），一次跑出 362 处差异而复测为 0 的情况出现过。差异成片出现时，先隔 300ms 复测再下结论；只信 `.wrap` 宽高、`scrollHeight`、字体栈三项都对得上的那一次读数
- **主题与复制按钮**：
  - 色板：`html[data-theme]` 切换后 `getComputedStyle(document.body).backgroundColor` 必须变（浅 `rgb(245,246,250)` / 深 `rgb(14,16,22)`），且 `localStorage.theme` 持久化、刷新后保持；`meta[name=theme-color]`、按钮文案与 `aria-label` 同步
  - 对比度：对 `body`、`.card`、`.rule-item`、`th`、`.hint`、`.prose code`、`.prose a` 等逐对算 WCAG 对比（脚本里算相对亮度即可），深浅两套的最小值都应 ≥ 4.5（现状：浅色最低 `.entry .tag` 4.79、深色最低 `.entry .more` 6.77）
  - ⚠️ **切主题后必须沉降 ≥ 450ms 再读计算样式**：`.site-nav-links a`、`.back`、胶囊这些带 160ms 颜色过渡，立刻读会拿到过渡起点，body 背景已变而文字色没变，能造出「nav 链接 1.35」这类假失败
  - ⚠️ **每个 URL 新开一个 tab 并 await 它自己的 run**，不要用一个句柄循环读多个 URL：`browser.tab(name)` 取回的可能是别的标签（曾出现 4 个页面读出同一份 404 数据）
  - ⚠️ **背景要按绘制顺序合成，不是按 DOM 祖先链**：`.copy-btn` 绝对定位叠在 `.code-block > pre` 上，沿祖先链会走到 `.card` 的白色；它真实的底是 Shiki 的 `#24292e`。渐变背景（如 `.hero`，计划页 / 首页白色标题压渐变）算不出 backgroundColor，会被误报成白底白字
  - 复制：`page.mouse.click` 真点按钮 → `navigator.clipboard.readText()` 读回，必须与该 `code` 的 `textContent` **逐字节相等**；按钮文案变「已复制」、约 1.6s 后复位
  - ⚠️ `page.evaluate` 跑在 puppeteer 的 **utility（隔离）世界**：在那里 patch `navigator.clipboard` 只对自己可见，按钮仍走真 API。要验证降级分支必须用 CDP `Runtime.evaluate` 指定主世界 context（`contexts.find(c => c.auxData?.isDefault)`），且表达式里不能捕获外层闭包（用 `"(" + fn.toString() + ")()"` 注入）
  - ⚠️ **`tab.run` 不捕获外层闭包**：run 体内引用 cell 里的 `const` 会 `ReferenceError`。把函数整个定义在 run 内部，或改成代码字符串再把外部值 `JSON.stringify` 内插进去
  - ⚠️ **headless 的 `(hover: hover)` 恒为 false**，CDP `Emulation.setEmulatedMedia` 改不动它。验 hover 要另起一个带 blink 旗标的实例（`--headless=new --remote-debugging-port=9222 --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4`），再用 `browser.open({app:{cdp_url}})` 挂上去；`browser.open({app:{path:…}})` 直接指向 chrome 可执行文件会 30s 超时，别用。停 hover 位移可以直接用 CDP 改 `prefers-reduced-motion`（这个媒体特性 CDP 支持）
  - `document.execCommand('copy')` 需要用户激活：要用 `page.mouse.click` 真点（先 `scrollIntoView` + `bringToFront`）才有用，程序化 `btn.click()` 会返回 false
  - 无 JS：CDP `Emulation.setScriptExecutionDisabled`（或 `page.setJavaScriptEnabled(false)` + reload）后，断言 `.copy-btn` 数量为 0、`.theme-toggle` 计算样式 `display:none`（属性 `hidden` 要配 `theme.css` 里的 `.theme-toggle[hidden]{display:none}`，否则作者样式的 `display:flex` 会压过 UA 的 `[hidden]`）、`.site-nav` 的两个链接仍渲染、正文照常、`<html>` 无 `data-theme` 时走浅色变量
- **路由自检**（`curl -H 'Cache-Control: no-cache'`）：`/` 200、`/plan/` 200、`/plan` 308→`/plan/`、`/blog/<slug>/` 200、`/blog`（含 `/blog/`）301→`/`、`/notes/` 200、`/notes/01-Java基础/01-泛型/01-从getClass说起/` 200（中文路径要百分号编码）、`/foo` 404 且返回自定义 404 页（1720 字节）、`/_astro/*.css` 的 `content-type: text/css`
- **已知坑**：本地删掉一篇 markdown 后重建，`.astro/` 内容缓存可能仍含已删条目（首页还列着旧文章、`dist/blog/<slug>/` 还在）。`rm -rf .astro dist` 再 build 即可。CI 是全新克隆，不受影响

## 当前状态

- 路由：`/`（首页：「计划」「笔记」两张入口卡）、`/plan/`（计划）、`/blog/<slug>/`（文章）、`/notes/`（笔记目录与进度）、`/notes/<章>/<节>/<篇>/`（笔记详情）、`/404`
- 全局件（`theme.css` + `Layout.astro`）：深浅色主题（默认跟随系统、右下角可切换并 `localStorage` 持久化、首屏内联脚本防闪白、无 JS 时恒浅色）、顶部站点导航（`sticky`，品牌 → `/`，`aria-current` 标记当前区；计划页 `nav={false}` 不渲染，改为左下角固定返回胶囊 `.home-float`）、代码块右上角复制按钮（`navigator.clipboard` → 失败退 `document.execCommand` → 再失败按钮报「复制失败」；无 JS 时按钮不存在）
- 正文排版（`prose.css`）：详情页用 `.wrap.reading` 收成 700px 单栏、16.5px/1.85（约 38 汉字/行）、h1 28 / h2 22 / h3 18 / h4 17；首页与目录页卡片走 `--font-sans` + `--shadow-1/2/3`，悬停抬 2px（仅在 `hover: hover` 且未开启减少动效时）
- 已发布文章：0 篇。首页目前只显示「计划」「笔记」两张入口卡，加第一篇 markdown 后文章列表自动出现
- 面试笔记：路线图 12 章 / 104 篇，已写 2 篇（`01-Java基础/01-泛型/01-从getClass说起`、`01-Java基础/01-泛型/02-擦除之后`）。进度由 `/notes/` 构建期实时统计
