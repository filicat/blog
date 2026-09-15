import type { SiteConfig } from '~/types'

const config: SiteConfig = {
  // 站点根 URL：canonical / og:url / sitemap / RSS 都取自它，必须与线上域名一致
  site: 'https://blog-akm.pages.dev',
  // 站点名，标题后缀、RSS、页脚都用到
  title: '训练与减脂笔记',
  description:
    '哑铃减脂完整计划（172cm / 72kg 零基础，含饮食方案、热身、训练 A/B、小空间有氧、一周安排、重量对照、进度追踪），以及 Java 面试复习笔记。',
  author: 'akm',
  // SEO 关键词
  tags: ['Java', '面试', '笔记', '减脂', '哑铃'],
  // 社交卡片（/social-cards/*.png）用的方形头像；文件不存在时卡片只显示标题
  socialCardAvatarImage: './src/content/avatar.jpg',
  // 全站字体，字体文件在 src/styles/global.css 里引入
  font: 'JetBrains Mono Variable',
  // 每页文章数；首页「最近更新」只显示一半
  pageSize: 6,
  // URL 是否带尾斜杠。本站既有链接全部带（/plan/、/notes/），所以为 true
  trailingSlashes: true,
  navLinks: [
    { name: '首页', url: '/' },
    { name: '笔记', url: '/notes/' },
    { name: '计划', url: '/plan/' },
  ],
  themes: {
    // 'select' = 顶栏调色板按钮，读者自选配色；另有 'single' | 'light-dark-auto'
    mode: 'select',
    default: 'catppuccin-mocha',
    // 每个主题的约 30 个颜色变量都会内联进每个页面的 <head>，别把 60 个全开
    include: [
      'catppuccin-latte',
      'catppuccin-mocha',
      'dracula',
      'everforest-dark',
      'everforest-light',
      'github-dark-default',
      'github-light-default',
      'gruvbox-dark-medium',
      'gruvbox-light-medium',
      'light-plus',
      'min-dark',
      'min-light',
      'nord',
      'one-dark-pro',
      'rose-pine-dawn',
      'rose-pine-moon',
      'solarized-dark',
      'solarized-light',
      'tokyo-night',
      'vesper',
    ],
    // 单个主题的颜色覆盖：值可以是字面色（#rgb/rgb/hsl）或另一个 themeKey。
    // 下面这些是正文可读性修正：默认 token 映射自 Shiki 的 TextMate scope，
    // 浅色主题里常出现标题/链接对比度只有 2–4:1 的情况，统一沿明度轴压到 ≥4.5:1。
    overrides: {
      // catppuccin-latte：21 个 token 对比度不足（最低 2.31:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'catppuccin-latte': {
        accent: '#ba0d33', // was #d20f39 (4.8:1) → 5.82:1
        link: '#2747fc', // was #7287fd (2.81:1) → 5.47:1
        list: '#116c71', // was #179299 (3.31:1) → 5.45:1
        italic: '#ba0d33', // was #d20f39 (4.8:1) → 5.82:1
        heading1: '#ba0d33', // was #d20f39 (4.8:1) → 5.82:1
        heading2: '#a73e01', // was #fe640b (2.64:1) → 5.57:1
        heading3: '#895712', // was #df8e1d (2.31:1) → 5.41:1
        heading4: '#2d701e', // was #40a02b (2.96:1) → 5.39:1
        heading5: '#156a78', // was #209fb5 (2.78:1) → 5.52:1
        heading6: '#2747fc', // was #7287fd (2.81:1) → 5.47:1
        note: '#0a54e5', // was #1e66f5 (4.34:1) → 5.44:1
        tip: '#2d701e', // was #40a02b (2.96:1) → 5.39:1
        important: '#ad1a86', // was #ea76cb (2.34:1) → 5.68:1
        caution: '#895712', // was #df8e1d (2.31:1) → 5.41:1
        warning: '#ba0d33', // was #d20f39 (4.8:1) → 5.82:1
        blue: '#0a54e5', // was #1e66f5 (4.34:1) → 5.44:1
        green: '#2d701e', // was #40a02b (2.96:1) → 5.39:1
        red: '#ba0d33', // was #d20f39 (4.8:1) → 5.82:1
        yellow: '#895712', // was #df8e1d (2.31:1) → 5.41:1
        magenta: '#ad1a86', // was #ea76cb (2.34:1) → 5.68:1
        cyan: '#116c71', // was #179299 (3.31:1) → 5.45:1
      },
      // dracula：2 个 token 对比度不足（最低 4.53:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'dracula': {
        warning: '#ff7979', // was #ff5555 (4.53:1) → 5.6:1
        red: '#ff7979', // was #ff5555 (4.53:1) → 5.6:1
      },
      // everforest-dark：11 个 token 对比度不足（最低 3.84:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'everforest-dark': {
        accent: '#ec9c9d', // was #e67e80 (4.55:1) → 5.82:1
        link: '#d9a0bb', // was #d699b6 (5.4:1) → 5.76:1
        list: '#ec9c9d', // was #e67e80 (4.55:1) → 5.82:1
        italic: '#abb4ad', // was #859289 (3.84:1) → 5.86:1
        heading1: '#ec9c9d', // was #e67e80 (4.55:1) → 5.82:1
        heading2: '#e89e7e', // was #e69875 (5.41:1) → 5.71:1
        heading6: '#d9a0bb', // was #d699b6 (5.4:1) → 5.76:1
        important: '#d9a0bb', // was #d699b6 (5.4:1) → 5.76:1
        warning: '#ec9c9d', // was #e67e80 (4.55:1) → 5.82:1
        red: '#ec9c9d', // was #e67e80 (4.55:1) → 5.82:1
        magenta: '#d9a0bb', // was #d699b6 (5.4:1) → 5.76:1
      },
      // everforest-light：22 个 token 对比度不足（最低 2.12:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'everforest-light': {
        foreground: '#5a676f', // was #5c6a72 (5.18:1) → 5.4:1
        accent: '#c30b08', // was #f85552 (3.04:1) → 5.77:1
        link: '#b22686', // was #df69ba (2.83:1) → 5.54:1
        list: '#c30b08', // was #f85552 (3.04:1) → 5.77:1
        italic: '#5e695c', // was #939f91 (2.56:1) → 5.33:1
        heading1: '#c30b08', // was #f85552 (3.04:1) → 5.77:1
        heading2: '#a34908', // was #f57d26 (2.48:1) → 5.54:1
        heading3: '#835e00', // was #dfa000 (2.12:1) → 5.46:1
        heading4: '#5c6901', // was #8da101 (2.69:1) → 5.6:1
        heading5: '#2a6b8e', // was #3a94c5 (3.13:1) → 5.42:1
        heading6: '#b22686', // was #df69ba (2.83:1) → 5.54:1
        note: '#2a6b8e', // was #3a94c5 (3.13:1) → 5.42:1
        tip: '#5c6901', // was #8da101 (2.69:1) → 5.6:1
        important: '#b22686', // was #df69ba (2.83:1) → 5.54:1
        caution: '#835e00', // was #dfa000 (2.12:1) → 5.46:1
        warning: '#c30b08', // was #f85552 (3.04:1) → 5.77:1
        blue: '#2a6b8e', // was #3a94c5 (3.13:1) → 5.42:1
        green: '#5c6901', // was #8da101 (2.69:1) → 5.6:1
        red: '#c30b08', // was #f85552 (3.04:1) → 5.77:1
        yellow: '#835e00', // was #dfa000 (2.12:1) → 5.46:1
        magenta: '#b22686', // was #df69ba (2.83:1) → 5.54:1
        cyan: '#247154', // was #35a77c (2.79:1) → 5.46:1
      },
      // github-light-default：7 个 token 对比度不足（最低 4.93:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'github-light-default': {
        note: '#0964d0', // was #0969da (5.19:1) → 5.61:1
        important: '#7c47dd', // was #8250df (5.05:1) → 5.52:1
        warning: '#cb212d', // was #cf222e (5.36:1) → 5.53:1
        blue: '#0964d0', // was #0969da (5.19:1) → 5.61:1
        red: '#cb212d', // was #cf222e (5.36:1) → 5.53:1
        magenta: '#7c47dd', // was #8250df (5.05:1) → 5.52:1
        cyan: '#19747b', // was #1b7c83 (4.93:1) → 5.49:1
      },
      // gruvbox-dark-medium：10 个 token 对比度不足（最低 2.69:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'gruvbox-dark-medium': {
        link: '#ab9f93', // was #928374 (4.02:1) → 5.7:1
        note: '#61abaf', // was #458588 (3.48:1) → 5.58:1
        tip: '#a5a41c', // was #98971a (4.76:1) → 5.57:1
        important: '#c992ab', // was #b16286 (3.48:1) → 5.75:1
        warning: '#ec817c', // was #cc241d (2.69:1) → 5.61:1
        blue: '#61abaf', // was #458588 (3.48:1) → 5.58:1
        green: '#a5a41c', // was #98971a (4.76:1) → 5.57:1
        red: '#ec817c', // was #cc241d (2.69:1) → 5.61:1
        magenta: '#c992ab', // was #b16286 (3.48:1) → 5.75:1
        cyan: '#7eab7f', // was #689d6a (4.65:1) → 5.63:1
      },
      // gruvbox-light-medium：19 个 token 对比度不足（最低 2.19:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'gruvbox-light-medium': {
        accent: '#aa3803', // was #af3a03 (5.4:1) → 5.65:1
        link: '#6b5f54', // was #928374 (3.24:1) → 5.46:1
        heading1: '#aa3803', // was #af3a03 (5.4:1) → 5.65:1
        heading2: '#aa3803', // was #af3a03 (5.4:1) → 5.65:1
        heading3: '#aa3803', // was #af3a03 (5.4:1) → 5.65:1
        heading4: '#aa3803', // was #af3a03 (5.4:1) → 5.65:1
        heading5: '#aa3803', // was #af3a03 (5.4:1) → 5.65:1
        heading6: '#aa3803', // was #af3a03 (5.4:1) → 5.65:1
        note: '#36676a', // was #458588 (3.73:1) → 5.6:1
        tip: '#646311', // was #98971a (2.73:1) → 5.55:1
        important: '#92496a', // was #b16286 (3.73:1) → 5.47:1
        caution: '#7f5a13', // was #d79921 (2.19:1) → 5.49:1
        warning: '#ba211a', // was #cc241d (4.82:1) → 5.57:1
        blue: '#36676a', // was #458588 (3.73:1) → 5.6:1
        green: '#646311', // was #98971a (2.73:1) → 5.55:1
        red: '#ba211a', // was #cc241d (4.82:1) → 5.57:1
        yellow: '#7f5a13', // was #d79921 (2.19:1) → 5.49:1
        magenta: '#92496a', // was #b16286 (3.73:1) → 5.47:1
        cyan: '#456a46', // was #689d6a (2.8:1) → 5.44:1
      },
      // light-plus：9 个 token 对比度不足（最低 2.56:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'light-plus': {
        tip: '#007a00', // was #00bc00 (2.56:1) → 5.55:1
        important: '#b705b7', // was #bc05bc (5.4:1) → 5.65:1
        caution: '#6c6f00', // was #949800 (3.11:1) → 5.37:1
        warning: '#c52f2f', // was #cd3131 (5.15:1) → 5.49:1
        green: '#007a00', // was #00bc00 (2.56:1) → 5.55:1
        red: '#c52f2f', // was #cd3131 (5.15:1) → 5.49:1
        yellow: '#6c6f00', // was #949800 (3.11:1) → 5.37:1
        magenta: '#b705b7', // was #bc05bc (5.4:1) → 5.65:1
        cyan: '#04708a', // was #0598bc (3.37:1) → 5.69:1
      },
      // min-dark：6 个 token 对比度不足（最低 3.2:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'min-dark': {
        note: '#5899e1', // was #2472c8 (3.39:1) → 5.54:1
        important: '#d072d0', // was #bc3fbc (3.59:1) → 5.49:1
        warning: '#de7676', // was #cd3131 (3.2:1) → 5.46:1
        blue: '#5899e1', // was #2472c8 (3.39:1) → 5.54:1
        red: '#de7676', // was #cd3131 (3.2:1) → 5.46:1
        magenta: '#d072d0', // was #bc3fbc (3.59:1) → 5.49:1
      },
      // min-light：12 个 token 对比度不足（最低 1.32:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'min-light': {
        link: '#c42929', // was #d32f2f (4.98:1) → 5.68:1
        note: '#6b6b6b', // was #e0e0e0 (1.32:1) → 5.33:1
        tip: '#447500', // was #77cc00 (2.02:1) → 5.54:1
        important: '#874bc3', // was #9966cc (4.1:1) → 5.49:1
        caution: '#965b08', // was #f29718 (2.28:1) → 5.53:1
        warning: '#c42929', // was #d32f2f (4.98:1) → 5.68:1
        blue: '#6b6b6b', // was #e0e0e0 (1.32:1) → 5.33:1
        green: '#447500', // was #77cc00 (2.02:1) → 5.54:1
        red: '#c42929', // was #d32f2f (4.98:1) → 5.68:1
        yellow: '#965b08', // was #f29718 (2.28:1) → 5.53:1
        magenta: '#874bc3', // was #9966cc (4.1:1) → 5.49:1
        cyan: '#2b765d', // was #4dbf99 (2.28:1) → 5.45:1
      },
      // nord：6 个 token 对比度不足（最低 3.05:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'nord': {
        note: '#99b3cd', // was #81a1c1 (4.64:1) → 5.76:1
        important: '#c4a7bf', // was #b48ead (4.41:1) → 5.73:1
        warning: '#d9a2a8', // was #bf616a (3.05:1) → 5.76:1
        blue: '#99b3cd', // was #81a1c1 (4.64:1) → 5.76:1
        red: '#d9a2a8', // was #bf616a (3.05:1) → 5.76:1
        magenta: '#c4a7bf', // was #b48ead (4.41:1) → 5.73:1
      },
      // one-dark-pro：16 个 token 对比度不足（最低 3.76:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'one-dark-pro': {
        accent: '#e68991', // was #e06c75 (4.38:1) → 5.57:1
        italic: '#cf8ce2', // was #c678dd (4.75:1) → 5.67:1
        heading1: '#e68991', // was #e06c75 (4.38:1) → 5.57:1
        heading2: '#e68991', // was #e06c75 (4.38:1) → 5.57:1
        heading3: '#e68991', // was #e06c75 (4.38:1) → 5.57:1
        heading4: '#e68991', // was #e06c75 (4.38:1) → 5.57:1
        heading5: '#e68991', // was #e06c75 (4.38:1) → 5.57:1
        heading6: '#e68991', // was #e06c75 (4.38:1) → 5.57:1
        note: '#53aaf1', // was #4aa5f0 (5.29:1) → 5.59:1
        important: '#d28ce7', // was #c162de (4.05:1) → 5.76:1
        caution: '#d4975e', // was #d18f52 (5.17:1) → 5.59:1
        warning: '#e98991', // was #e05561 (3.76:1) → 5.63:1
        blue: '#53aaf1', // was #4aa5f0 (5.29:1) → 5.59:1
        red: '#e98991', // was #e05561 (3.76:1) → 5.63:1
        yellow: '#d4975e', // was #d18f52 (5.17:1) → 5.59:1
        magenta: '#d28ce7', // was #c162de (4.05:1) → 5.76:1
      },
      // rose-pine-dawn：9 个 token 对比度不足（最低 2.05:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'rose-pine-dawn': {
        note: '#3f6c74', // was #56949f (3.14:1) → 5.33:1
        important: '#715a8c', // was #907aa9 (3.47:1) → 5.43:1
        caution: '#8b560e', // was #ea9d34 (2.05:1) → 5.6:1
        warning: '#9a4a61', // was #b4637a (3.84:1) → 5.45:1
        blue: '#3f6c74', // was #56949f (3.14:1) → 5.33:1
        red: '#9a4a61', // was #b4637a (3.84:1) → 5.45:1
        yellow: '#8b560e', // was #ea9d34 (2.05:1) → 5.6:1
        magenta: '#715a8c', // was #907aa9 (3.47:1) → 5.43:1
        cyan: '#af3c36', // was #d7827e (2.6:1) → 5.46:1
      },
      // rose-pine-moon：4 个 token 对比度不足（最低 4.29:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'rose-pine-moon': {
        tip: '#54a3c3', // was #3e8fb0 (4.29:1) → 5.52:1
        warning: '#ec7395', // was #eb6f92 (5.38:1) → 5.55:1
        green: '#54a3c3', // was #3e8fb0 (4.29:1) → 5.52:1
        red: '#ec7395', // was #eb6f92 (5.38:1) → 5.55:1
      },
      // solarized-dark：22 个 token 对比度不足（最低 3.25:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'solarized-dark': {
        foreground: '#91a0a2', // was #839496 (4.75:1) → 5.54:1
        accent: '#55a7e0', // was #268bd2 (4.08:1) → 5.71:1
        link: '#91a0a2', // was #839496 (4.75:1) → 5.54:1
        list: '#91a0a2', // was #839496 (4.75:1) → 5.54:1
        italic: '#e279ac', // was #d33682 (3.3:1) → 5.41:1
        heading1: '#55a7e0', // was #268bd2 (4.08:1) → 5.71:1
        heading2: '#55a7e0', // was #268bd2 (4.08:1) → 5.71:1
        heading3: '#55a7e0', // was #268bd2 (4.08:1) → 5.71:1
        heading4: '#55a7e0', // was #268bd2 (4.08:1) → 5.71:1
        heading5: '#55a7e0', // was #268bd2 (4.08:1) → 5.71:1
        heading6: '#55a7e0', // was #268bd2 (4.08:1) → 5.71:1
        note: '#55a7e0', // was #268bd2 (4.08:1) → 5.71:1
        tip: '#92a800', // was #859900 (4.69:1) → 5.59:1
        important: '#e279ac', // was #d33682 (3.3:1) → 5.41:1
        caution: '#c49500', // was #b58900 (4.68:1) → 5.47:1
        warning: '#e87775', // was #dc322f (3.25:1) → 5.24:1
        blue: '#55a7e0', // was #268bd2 (4.08:1) → 5.71:1
        green: '#92a800', // was #859900 (4.69:1) → 5.59:1
        red: '#e87775', // was #dc322f (3.25:1) → 5.24:1
        yellow: '#c49500', // was #b58900 (4.68:1) → 5.47:1
        magenta: '#e279ac', // was #d33682 (3.3:1) → 5.41:1
        cyan: '#2eb1a7', // was #2aa198 (4.75:1) → 5.69:1
      },
      // solarized-light：22 个 token 对比度不足（最低 2.93:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'solarized-light': {
        foreground: '#55686f', // was #657b83 (4.13:1) → 5.41:1
        accent: '#1d699e', // was #268bd2 (3.41:1) → 5.46:1
        link: '#55686f', // was #657b83 (4.13:1) → 5.41:1
        list: '#55686f', // was #657b83 (4.13:1) → 5.41:1
        italic: '#b4276b', // was #d33682 (4.21:1) → 5.65:1
        heading1: '#1d699e', // was #268bd2 (3.41:1) → 5.46:1
        heading2: '#1d699e', // was #268bd2 (3.41:1) → 5.46:1
        heading3: '#1d699e', // was #268bd2 (3.41:1) → 5.46:1
        heading4: '#1d699e', // was #268bd2 (3.41:1) → 5.46:1
        heading5: '#1d699e', // was #268bd2 (3.41:1) → 5.46:1
        heading6: '#1d699e', // was #268bd2 (3.41:1) → 5.46:1
        note: '#1d699e', // was #268bd2 (3.41:1) → 5.46:1
        tip: '#5d6b00', // was #859900 (2.97:1) → 5.46:1
        important: '#b4276b', // was #d33682 (4.21:1) → 5.65:1
        caution: '#7d5f00', // was #b58900 (2.98:1) → 5.55:1
        warning: '#bd2320', // was #dc322f (4.29:1) → 5.68:1
        blue: '#1d699e', // was #268bd2 (3.41:1) → 5.46:1
        green: '#5d6b00', // was #859900 (2.97:1) → 5.46:1
        red: '#bd2320', // was #dc322f (4.29:1) → 5.68:1
        yellow: '#7d5f00', // was #b58900 (2.98:1) → 5.55:1
        magenta: '#b4276b', // was #d33682 (4.21:1) → 5.65:1
        cyan: '#1d706a', // was #2aa198 (2.93:1) → 5.44:1
      },
      // tokyo-night：1 个 token 对比度不足（最低 4.18:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'tokyo-night': {
        heading6: '#8990af', // was #747ca1 (4.18:1) → 5.43:1
      },
      // vesper：6 个 token 对比度不足（最低 3.7:1），统一沿明度轴调到 ≥4.5:1（叠 12% 底纹后仍达标），色相与饱和度不变
      'vesper': {
        note: '#3e89dc', // was #2472c8 (3.91:1) → 5.27:1
        important: '#c85cc8', // was #bc3fbc (4.15:1) → 5.27:1
        warning: '#d85e5e', // was #cd3131 (3.7:1) → 5.15:1
        blue: '#3e89dc', // was #2472c8 (3.91:1) → 5.27:1
        red: '#d85e5e', // was #cd3131 (3.7:1) → 5.15:1
        magenta: '#c85cc8', // was #bc3fbc (4.15:1) → 5.27:1
      },
    },
  },
  // 页脚社交链接，留空即不显示
  socialLinks: {
    rss: true,
  },
  // 评论（Giscus）：留 undefined 即关闭；启用见 AGENTS.md
  giscus: undefined,
}

export default config
