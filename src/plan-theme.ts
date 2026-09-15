/**
 * plan 页的派生配色：把主题的语义色换算成 plan 版式要用的「角色色」，并在构建期
 * 解出一组满足 WCAG AA（4.6:1）的墨色。
 *
 * 为什么需要这一层：plan 页的版式（英雄区、圆点、色块角标、进度条、周历）到处都在
 * 用颜色承载信息，而 MultiTerm 的 20 套配色只保证「foreground 对 background」可读
 * （见 site.config.ts 的 themes.overrides）。直接把 --theme-accent / --theme-yellow
 * 当文字色用，在某几套配色上会掉到 2:1 左右。这里在构建期对每个主题解一次：
 *
 *   --plan-<角色>-fill   实底色块（角标底、圆点、扇区）—— 保留主题原色
 *   --plan-<角色>-soft   淡底（标签、提示条）—— 角色色 14% 压在页面底色上
 *   --plan-<角色>-ink    该色作为文字 —— 对 fill/soft/各种面板面 均已达标
 *   --plan-<角色>-on     压在 fill 上的文字
 *
 * 求解只沿 HSL 明度轴走，色相饱和度不变；明度走到头仍不达标（高饱和色对同亮度底）
 * 才退化为混黑/白。产物是静态 hex，运行时不计算。
 */
import Color from 'color'
import type { ColorStyles, ThemesWithColorStyles } from '~/types'

/** WCAG AA 正文阈值；比 4.5 抬一点，给 canvas 合成/抗锯齿留余量 */
const TARGET = 4.6

/** 角色 → 主题语义色。a/b/c 对应 plan 版式里的三类动作（主色 / 训练B / 有氧） */
const ROLES = {
  a: 'accent',
  b: 'tip',
  c: 'blue',
  ok: 'green',
  bad: 'red',
  warn: 'yellow',
} as const

type Role = keyof typeof ROLES

/** 求解只需要 6 个角色色 + 前/后景色；主题的完整 31 色不必全带进来（打印用的合成浅色盘就只给这几项） */
type PlanStyles = Pick<ColorStyles, 'background' | 'foreground'> & { [K in (typeof ROLES)[Role]]: string }

/** WCAG 相对亮度 → 对比度；只在这一处用，直接内联亮度公式 */
function contrast(a: Color, b: Color): number {
  const luminance = (color: Color) => {
    const channel = (v: number) => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    }
    const [r, g, blue] = color.rgb().array()
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(blue)
  }
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** 一个颜色对一组背景面的最差对比度 —— 求解就压这个值 */
function worstContrast(color: Color, surfaces: Color[]): number {
  return Math.min(...surfaces.map((surface) => contrast(color, surface)))
}

/** 落盘取整：CSS 里只会出现 8 位色，判定也必须按 8 位色来，否则浮点解会被 hex() 抹掉零点几 */
function quantize(color: Color): Color {
  return Color(color.hex())
}

/** 把 base 沿明度轴向黑/白推，直到对 surfaces 全都达标；推不动再混黑/白 */
function solveInk(base: Color, surfaces: Color[], target = TARGET): Color {
  if (worstContrast(base, surfaces) >= target) return base
  const hsl = base.hsl()
  const origin = hsl.lightness()
  for (const dir of origin < 50 ? [1, -1] : [-1, 1]) {
    for (let step = 1; step <= 100; step++) {
      const lightness = origin + dir * step
      if (lightness < 0 || lightness > 100) break
      const candidate = quantize(base.lightness(lightness))
      if (worstContrast(candidate, surfaces) >= target) return candidate
    }
  }
  for (const dir of origin < 50 ? [1, -1] : [-1, 1]) {
    const pole = Color(dir > 0 ? '#ffffff' : '#000000')
    for (let step = 2; step <= 100; step += 2) {
      const candidate = quantize(base.mix(pole, step / 100))
      if (worstContrast(candidate, surfaces) >= target) return candidate
    }
  }
  return base
}

/** 在两个候选墨色里挑对 fill 更稳的那个，再求解 */
function solveOnFill(fill: Color, surfaces: Color[], candidates: Color[]): Color {
  const best = candidates
    .map(quantize)
    .reduce((acc, candidate) =>
      worstContrast(candidate, surfaces) > worstContrast(acc, surfaces) ? candidate : acc,
    )
  return solveInk(best, surfaces)
}

/** 混合比例按百分比取整，避免浮点噪声进 CSS；结果同时按 8 位色取整 */
function mix(base: Color, other: Color, percent: number): Color {
  return quantize(base.mix(other, Math.round(percent) / 100))
}

/** 同色相挪明度：做「同色深浅」用，不会像混色那样把颜色带脏 */
function shiftLightness(base: Color, dir: number, amount: number): Color {
  return quantize(base.lightness(Math.min(100, Math.max(0, base.hsl().lightness() + dir * amount))))
}

function hex(color: Color): string {
  return color.hex()
}

/** 单个角色的 4 个 token；墨色要对「页面底 + 各面板面 + 自己的淡底」都达标 */
function roleTokens(role: Role, styles: PlanStyles, surfaces: Color[]): string[] {
  const fill = Color(styles[ROLES[role]])
  const soft = mix(Color(styles.background), fill, 14)
  const ink = solveInk(fill, [...surfaces, soft])
  const on = solveOnFill(fill, [fill], [Color(styles.background), Color(styles.foreground)])
  return [
    `--plan-${role}-fill: ${hex(fill)};`,
    `--plan-${role}-soft: ${hex(soft)};`,
    `--plan-${role}-ink: ${hex(ink)};`,
    `--plan-${role}-on: ${hex(on)};`,
  ]
}

function themeTokens(styles: PlanStyles): string[] {
  const background = Color(styles.background)
  const foreground = Color(styles.foreground)

  // 版式里的面：卡片、淡面板、表头、进度槽、分隔线 —— 全部由前景色往页面上叠
  const surface = mix(background, foreground, 4)
  const panel = mix(background, foreground, 2)
  const panel2 = mix(background, foreground, 6)
  const track = mix(background, foreground, 10)
  const line = mix(background, foreground, 16)
  const pageSurfaces = [background, surface, panel, panel2, track]

  // 角色的淡底：周历的彩色格子等。继承下来的正文会落在这些面上，
  // 所以 --plan-ink / --plan-muted 的求解面必须含它们。
  const roles = Object.keys(ROLES) as Role[]
  const softs = roles.map((role) => mix(background, Color(styles[ROLES[role]]), 14))
  const inkSurfaces = [...pageSurfaces, ...softs]

  const tokens = [
    `--plan-surface: ${hex(surface)};`,
    `--plan-panel: ${hex(panel)};`,
    `--plan-panel-2: ${hex(panel2)};`,
    `--plan-track: ${hex(track)};`,
    `--plan-line: ${hex(line)};`,
    `--plan-ink: ${hex(solveInk(foreground, inkSurfaces))};`,
    `--plan-muted: ${hex(solveInk(mix(background, foreground, 78), inkSurfaces))};`,
  ]

  for (const role of roles) {
    tokens.push(...roleTokens(role, styles, pageSurfaces))
  }

  // 英雄区：整块用主色实底，同色深浅只用来做渐变与角标底。
  const heroAccent = Color(styles[ROLES.a])
  const inkCandidates = [background, foreground, Color('#ffffff'), Color('#000000')]
  let heroFill = heroAccent
  let heroInk = solveOnFill(heroFill, [heroFill], inkCandidates)
  // 主色若当底色时压不住任何墨色（中亮度色很常见），就把主色本身沿明度挪开墨色，
  // 否则这一块放什么字都不达标。
  if (contrast(heroInk, heroFill) < TARGET) {
    const away = contrast(heroInk, Color('#000000')) > contrast(heroFill, Color('#000000')) ? -1 : 1
    for (let step = 1; step <= 60; step++) {
      const candidate = shiftLightness(heroFill, away, step)
      if (candidate.hex() === heroFill.hex()) break
      heroFill = candidate
      heroInk = solveOnFill(heroFill, [heroFill], inkCandidates)
      if (contrast(heroInk, heroFill) >= TARGET) break
    }
  }
  // 角标底 / 渐变末端只往「远离墨色」的一侧挪，且挪到对比度刚好还达标为止，
  // 保证渐变任意一点的底色都还撑得住墨色。
  const awayFromInk = contrast(heroInk, shiftLightness(heroFill, 1, 4)) > contrast(heroInk, shiftLightness(heroFill, -1, 4)) ? 1 : -1
  const shade = (cap: number) => {
    let amount = 0
    for (let step = 1; step <= cap; step++) {
      if (contrast(heroInk, shiftLightness(heroFill, awayFromInk, step)) < TARGET) break
      amount = step
    }
    return shiftLightness(heroFill, awayFromInk, amount)
  }
  const heroChip = shade(12)
  const heroStop = shade(22)
  const heroSurfaces = [heroFill, heroChip, heroStop]
  // 右上角的装饰光晕是「同色墨的极淡叠加」，会抬高背景亮度从而吃掉对比度：
  // 反过来解出最大叠加比例，保证叠完墨色仍然达标。
  const over = (fg: Color, bg: Color, alpha: number) => {
    const f = fg.rgb().array()
    const b = bg.rgb().array()
    return Color.rgb(f.map((v, i) => v * alpha + b[i] * (1 - alpha)))
  }
  let glow = 0
  for (let ratio = 20; ratio >= 0; ratio--) {
    if (heroSurfaces.every((s) => contrast(heroInk, quantize(over(heroInk, s, ratio / 100))) >= TARGET)) {
      glow = ratio
      break
    }
  }
  const glowSurfaces = glow ? heroSurfaces.map((s) => quantize(over(heroInk, s, glow / 100))) : []
  const heroMuted = solveInk(mix(heroInk, heroFill, 18), [...heroSurfaces, ...glowSurfaces])
  tokens.push(
    `--plan-hero-fill: ${hex(heroFill)};`,
    `--plan-hero-chip: ${hex(heroChip)};`,
    `--plan-hero-stop: ${hex(heroStop)};`,
    `--plan-hero-ink: ${hex(heroInk)};`,
    `--plan-hero-muted: ${hex(heroMuted)};`,
    `--plan-hero-glow: ${glow}%;`,
  )

  return tokens
}

/**
 * 打印用的合成浅色盘。plan 页的主题 token 挂在每个主题的 `:root[data-theme]` 上，
 * 打印时不能再按主题走（深色主题会把整页印成黑底），所以固定一套浅色。
 * 这套盘**同样过一遍 themeTokens**，所以和主题盘受同一套对比度保证；
 * 块写在样式表最后、同特异性下后者胜，不需要 !important。
 */
const PRINT_STYLES: PlanStyles = {
  background: '#ffffff',
  foreground: '#1a1a2e',
  accent: '#ff6b35',
  tip: '#2ec4b6',
  blue: '#4c6ef5',
  green: '#16a34a',
  red: '#e5484d',
  yellow: '#f59e0b',
}

/** 生成 plan 页内联的 `--plan-*` 定义表 */
export function planThemeCss(resolved: ThemesWithColorStyles): string {
  const lines: string[] = []
  for (const [themeId, styles] of Object.entries(resolved)) {
    if (!styles) continue
    lines.push(`:root[data-theme="${themeId}"] {`)
    lines.push(...themeTokens(styles))
    lines.push('}')
  }
  lines.push('@media print {')
  lines.push('  /* 深色主题会把整页印成黑底：打印时连页面底色一起按死在浅色 */')
  lines.push('  body {')
  lines.push(`    background: ${PRINT_STYLES.background};`)
  lines.push('    color: var(--plan-ink);')
  lines.push('  }')
  lines.push('  :root[data-theme] {')
  lines.push(...themeTokens(PRINT_STYLES))
  lines.push('  }')
  lines.push('}')
  return lines.join('\n')
}
