"use strict";

const APP_CONFIG = {
  storageKeys: {
    theme: "vertu-brand-guide.theme",
    language: "vertu-brand-guide.language",
  },
  defaults: {
    theme: "dark",
    language: "bi",
  },
  language: {
    supported: ["en", "zh", "bi"],
    alias: {
      cn: "zh",
      chinese: "zh",
    },
    i18n: {
      ui: {
        openSidebar: {
          en: "Open sidebar",
          zh: "打开侧边栏",
          bi: "Open sidebar · 打开侧边栏",
        },
        closeSidebar: {
          en: "Close sidebar",
          zh: "关闭侧边栏",
          bi: "Close sidebar · 关闭侧边栏",
        },
        toggleTheme: {
          en: "Toggle theme",
          zh: "切换主题",
          bi: "Toggle theme · 切换主题",
        },
        sidebarNavigation: {
          en: "Sidebar navigation",
          zh: "侧边导航",
          bi: "Sidebar navigation · 侧边导航",
        },
        copyReady: {
          en: "Copy",
          zh: "复制",
          bi: "Copy · 复制",
        },
        copied: {
          en: "Copied!",
          zh: "已复制！",
          bi: "Copied! · 已复制！",
        },
        copyCodeLabel: {
          en: "Copy code snippet",
          zh: "复制代码片段",
          bi: "Copy code snippet · 复制代码片段",
        },
        copyColor: {
          en: "Copy color: {name} {value}",
          zh: "复制色值：{name} {value}",
          bi: "Copy color: {name} {value} · 复制色值：{name} {value}",
        },
        copyPantone: {
          en: "Copy Pantone reference {value}",
          zh: "复制潘通参考 {value}",
          bi: "Copy Pantone reference {value} · 复制潘通参考 {value}",
        },
        copyHint: {
          en: "Click to copy",
          zh: "点击复制",
          bi: "Click to copy · 点击复制",
        },
        logoBoxOnBlack: {
          en: "On Black — Primary",
          zh: "黑底 · 主视觉",
          bi: "On Black — Primary · 黑底 · 主视觉",
        },
        logoBoxOnLight: {
          en: "On Light — Reversed",
          zh: "浅底 · 反白应用",
          bi: "On Light — Reversed · 浅底 · 反白应用",
        },
        logoBoxOnCharcoal: {
          en: "Gold on Charcoal",
          zh: "金色 · 深灰底",
          bi: "Gold on Charcoal · 金色 · 深灰底",
        },
        logoBoxOnGold: {
          en: "Black on Gold",
          zh: "黑色 · 金底",
          bi: "Black on Gold · 黑色 · 金底",
        },
        downloadLogoBlackAlt: {
          en: "Downloadable black VERTU logo preview",
          zh: "可下载的黑色 VERTU 标志预览",
          bi: "Downloadable black VERTU logo preview · 可下载的黑色 VERTU 标志预览",
        },
        downloadLogoWhiteAlt: {
          en: "Downloadable white VERTU logo preview",
          zh: "可下载的白色 VERTU 标志预览",
          bi: "Downloadable white VERTU logo preview · 可下载的白色 VERTU 标志预览",
        },
        downloadLogoGoldAlt: {
          en: "Downloadable gold VERTU logo preview",
          zh: "可下载的金色 VERTU 标志预览",
          bi: "Downloadable gold VERTU logo preview · 可下载的金色 VERTU 标志预览",
        },
        footerBrandLogoAlt: {
          en: "VERTU logo",
          zh: "VERTU 标志",
          bi: "VERTU logo · VERTU 标志",
        },
        photoHeroAlt: {
          en: "Agent Q photography",
          zh: "Agent Q 手机摄影",
          bi: "Agent Q photography · Agent Q 手机摄影",
        },
        photoDetailAlt: {
          en: "Quantum Flip photography",
          zh: "Quantum Flip 产品摄影",
          bi: "Quantum Flip photography · Quantum Flip 产品摄影",
        },
        photoColourAlt: {
          en: "Signature S+ photography",
          zh: "Signature S+ 产品摄影",
          bi: "Signature S+ photography · Signature S+ 产品摄影",
        },
        cropCorrectDarkAlt: {
          en: "Correct crop: dark background with centered product",
          zh: "正确裁切：深色背景与居中产品",
          bi: "Correct crop: dark background with centered product · 正确裁切：深色背景与居中产品",
        },
        cropCorrectMaterialAlt: {
          en: "Correct crop: material texture clearly visible",
          zh: "正确裁切：材质纹理清晰可见",
          bi: "Correct crop: material texture clearly visible · 正确裁切：材质纹理清晰可见",
        },
        cropAvoidAlt: {
          en: "Avoid: over-cropped hero shot",
          zh: "避免：过度裁切的产品主图",
          bi: "Avoid: over-cropped hero shot · 避免：过度裁切的产品主图",
        },
        colorTagPrimary: {
          en: "Primary",
          zh: "主色",
          bi: "Primary · 主色",
        },
        colorTagSignature: {
          en: "Signature",
          zh: "标志色",
          bi: "Signature · 标志色",
        },
        colorTagAccent: {
          en: "Accent",
          zh: "强调色",
          bi: "Accent · 强调色",
        },
        colorTagLight: {
          en: "Light",
          zh: "浅色",
          bi: "Light · 浅色",
        },
        colorTagSurface: {
          en: "Surface",
          zh: "表面色",
          bi: "Surface · 表面色",
        },
        colorTagDeep: {
          en: "Deep",
          zh: "深色",
          bi: "Deep · 深色",
        },
        colorTagNeutral: {
          en: "Neutral",
          zh: "中性",
          bi: "Neutral · 中性",
        },
        colorRoleBackgroundsTypography: {
          en: "Backgrounds · Typography",
          zh: "背景 · 排版",
          bi: "Backgrounds · Typography · 背景 · 排版",
        },
        colorRoleAccentsHeadlinesCtas: {
          en: "Accents · Headlines · CTAs",
          zh: "强调色 · 标题 · 行动按钮",
          bi: "Accents · Headlines · CTAs · 强调色 · 标题 · 行动按钮",
        },
        colorRoleRubyKeyEmphasis: {
          en: "Ruby Key · Emphasis",
          zh: "红宝石 · 重点",
          bi: "Ruby Key · Emphasis · 红宝石 · 重点",
        },
        colorRoleTextOnDarkUi: {
          en: "Text on dark · Light UI",
          zh: "深色文本 · 浅色界面",
          bi: "Text on dark · Light UI · 深色文本 · 浅色界面",
        },
        colorRoleElevatedSurfaces: {
          en: "Elevated surfaces",
          zh: "浮层背景",
          bi: "Elevated surfaces · 浮层背景",
        },
        colorRoleHoverBorders: {
          en: "Hover states · Borders",
          zh: "悬停状态 · 边框",
          bi: "Hover states · Borders · 悬停状态 · 边框",
        },
        colorRoleBodyMetadata: {
          en: "Body text · Metadata",
          zh: "正文 · 元信息",
          bi: "Body text · Metadata · 正文 · 元信息",
        },
        colorRoleGradientsAtmospheric: {
          en: "Gradients · Atmospheric",
          zh: "渐变 · 氛围",
          bi: "Gradients · Atmospheric · 渐变 · 氛围",
        },
        languageButtonEnglish: {
          en: "Select English language mode",
          zh: "切换到英文模式",
          bi: "Select English language mode · 切换到英文模式",
        },
        languageButtonChinese: {
          en: "Select Chinese language mode",
          zh: "切换到中文模式",
          bi: "Select Chinese language mode · 切换到中文模式",
        },
        languageButtonBilingual: {
          en: "Select bilingual mode",
          zh: "切换到中英双语模式",
          bi: "Select bilingual mode · 切换到中英双语模式",
        },
        languageSelectLabel: {
          en: "Select language",
          zh: "选择语言",
          bi: "Select language · 选择语言",
        },
        logoBoxOnBlackAlt: {
          en: "VERTU logo on black background",
          zh: "VERTU 标志 · 黑色背景",
          bi: "VERTU logo on black background · VERTU 标志 · 黑色背景",
        },
        logoBoxOnLightAlt: {
          en: "VERTU logo on light background",
          zh: "VERTU 标志 · 浅色背景",
          bi: "VERTU logo on light background · VERTU 标志 · 浅色背景",
        },
        logoBoxOnCharcoalAlt: {
          en: "VERTU logo on charcoal background",
          zh: "VERTU 标志 · 深灰背景",
          bi: "VERTU logo on charcoal background · VERTU 标志 · 深灰背景",
        },
        logoBoxOnGoldAlt: {
          en: "VERTU logo on gold background",
          zh: "VERTU 标志 · 金色背景",
          bi: "VERTU logo on gold background · VERTU 标志 · 金色背景",
        },
        photoCellHero: {
          en: "Hero · Clean background",
          zh: "主图 · 简洁背景",
          bi: "Hero · Clean background · 主图 · 简洁背景",
        },
        photoCellDetail: {
          en: "Detail · Material texture",
          zh: "细节 · 材质纹理",
          bi: "Detail · Material texture · 细节 · 材质纹理",
        },
        photoCellColour: {
          en: "Colour · Material contrast",
          zh: "色彩 · 材质对比",
          bi: "Colour · Material contrast · 色彩 · 材质对比",
        },
        typeMetaRegularItalic: {
          en: "Regular 400 & Italic",
          zh: "常规 400 与斜体",
          bi: "Regular 400 & Italic · 常规 400 与斜体",
        },
        typeMetaHeadlinesHeroQuotes: {
          en: "Headlines · Hero · Quotes",
          zh: "标题 · 头图 · 引言",
          bi: "Headlines · Hero · Quotes · 标题 · 头图 · 引言",
        },
        typeMetaMin24Px: {
          en: "Min: 24px",
          zh: "最小：24px",
          bi: "Min: 24px · 最小：24px",
        },
        typeMetaBodyWeights: {
          en: "400, 500, 600",
          zh: "400, 500, 600",
          bi: "400, 500, 600",
        },
        typeMetaBodyLabels: {
          en: "Body · Nav · UI · Labels",
          zh: "正文 · 导航 · UI · 标签",
          bi: "Body · Nav · UI · Labels · 正文 · 导航 · UI · 标签",
        },
        typeMetaMin14Px: {
          en: "Min: 14px",
          zh: "最小：14px",
          bi: "Min: 14px · 最小：14px",
        },
        typeMetaSpecsMetadataCodes: {
          en: "Specs · Labels · Metadata · Product codes",
          zh: "规格 · 标签 · 元数据 · 产品代码",
          bi: "Specs · Labels · Metadata · Product codes · 规格 · 标签 · 元数据 · 产品代码",
        },
        playgroundFontLabel: {
          en: "Font",
          zh: "字体",
          bi: "Font · 字体",
        },
        playgroundSizeLabel: {
          en: "Size",
          zh: "字号",
          bi: "Size · 字号",
        },
        playgroundWeightLabel: {
          en: "Weight",
          zh: "字重",
          bi: "Weight · 字重",
        },
        playgroundTrackingLabel: {
          en: "Tracking",
          zh: "字间距",
          bi: "Tracking · 字间距",
        },
        typeScaleHero: {
          en: "Hero",
          zh: "头图",
          bi: "Hero · 头图",
        },
        typeScaleH1: {
          en: "H1",
          zh: "H1",
          bi: "H1",
        },
        typeScaleH2: {
          en: "H2",
          zh: "H2",
          bi: "H2",
        },
        typeScaleBody: {
          en: "Body",
          zh: "正文",
          bi: "Body · 正文",
        },
        typeScaleCaption: {
          en: "Caption",
          zh: "说明",
          bi: "Caption · 说明",
        },
        typeScaleLabel: {
          en: "Label",
          zh: "标签",
          bi: "Label · 标签",
        },
        motionBreatheName: {
          en: "Breathe",
          zh: "呼吸",
          bi: "Breathe · 呼吸",
        },
        motionRevealName: {
          en: "Reveal",
          zh: "渐显",
          bi: "Reveal · 渐显",
        },
        motionRefineName: {
          en: "Refine",
          zh: "精炼",
          bi: "Refine · 精炼",
        },
        motionBreatheValue: {
          en: "ease-in-out · 2–4s | Ambient, looping states",
          zh: "ease-in-out · 2–4 秒 | 环境性循环态",
          bi: "ease-in-out · 2–4s | Ambient, looping states · ease-in-out · 2–4 秒 · 环境性循环态",
        },
        motionRevealValue: {
          en: "ease-out · 250–400ms | Scroll-triggered entries",
          zh: "ease-out · 250–400 毫秒 | 滚动触发展示",
          bi: "ease-out · 250–400ms | Scroll-triggered entries · ease-out · 250–400 毫秒 · 滚动触发展示",
        },
        motionRefineValue: {
          en: "ease · 150–250ms | Hover, focus, micro-interactions",
          zh: "ease · 150–250 毫秒 | 悬停、焦点、微交互",
          bi: "ease · 150–250ms | Hover, focus, micro-interactions · ease · 150–250 毫秒 · 悬停、焦点、微交互",
        },
        spacingMicro: {
          en: "Micro — tight label gaps",
          zh: "微小 — 标签间距紧凑",
          bi: "Micro — tight label gaps · 微小 — 标签间距紧凑",
        },
        spacingBaseUnit: {
          en: "Base unit — icon padding",
          zh: "基准单位 — 图标内边距",
          bi: "Base unit — icon padding · 基准单位 — 图标内边距",
        },
        spacingSmall: {
          en: "Small — card internal padding",
          zh: "小 — 卡片内边距",
          bi: "Small — card internal padding · 小 — 卡片内边距",
        },
        spacingMedium: {
          en: "Medium — section sub-gaps",
          zh: "中 — 子区块间距",
          bi: "Medium — section sub-gaps · 中 — 子区块间距",
        },
        spacingLarge: {
          en: "Large — between subsections",
          zh: "大 — 分区间距",
          bi: "Large — between subsections · 大 — 分区间距",
        },
        spacingXL: {
          en: "XL — section padding",
          zh: "特大 — 区块内边距",
          bi: "XL — section padding · 特大 — 区块内边距",
        },
        spacingXXL: {
          en: "XXL — hero/section padding (brand page)",
          zh: "超大 — 头图/区块内边距（页面）",
          bi: "XXL — hero/section padding (brand page) · 超大 — 头图/区块内边距（页面）",
        },
        componentOutlinedPrimaryLabel: {
          en: "Outlined — Primary",
          zh: "描边 — 主按钮",
          bi: "Outlined — Primary · 描边 — 主按钮",
        },
        componentFilledCtaLabel: {
          en: "Filled — CTA",
          zh: "填充 — 行动按钮",
          bi: "Filled — CTA · 填充 — 行动按钮",
        },
        componentGhostLabel: {
          en: "Outlined — Ghost (on dark)",
          zh: "描边 — 幽灵按钮（深色）",
          bi: "Outlined — Ghost (on dark) · 描边 — 幽灵按钮（深色）",
        },
        componentExploreCollection: {
          en: "Explore Collection",
          zh: "探索系列",
          bi: "Explore Collection · 探索系列",
        },
        componentAddToBag: {
          en: "Add to Bag",
          zh: "加入购物袋",
          bi: "Add to Bag · 加入购物袋",
        },
        componentLearnMore: {
          en: "Learn More",
          zh: "了解更多",
          bi: "Learn More · 了解更多",
        },
        accessibilityForeground: {
          en: "Foreground",
          zh: "前景色",
          bi: "Foreground · 前景色",
        },
        accessibilityBackground: {
          en: "Background",
          zh: "背景色",
          bi: "Background · 背景色",
        },
        accessibilityRatio: {
          en: "Ratio",
          zh: "对比度",
          bi: "Ratio · 对比度",
        },
        accessibilitySample: {
          en: "Sample",
          zh: "样例",
          bi: "Sample · 样例",
        },
        accessibilityAa: {
          en: "AA",
          zh: "AA",
          bi: "AA",
        },
        accessibilityAaa: {
          en: "AAA",
          zh: "AAA",
          bi: "AAA",
        },
        accessibilityPass: {
          en: "PASS",
          zh: "通过",
          bi: "PASS · 通过",
        },
        accessibilityStatusLabel: {
          en: "WCAG 2.2 AA PASS",
          zh: "WCAG 2.2 AA 通过",
          bi: "WCAG 2.2 AA PASS · WCAG 2.2 AA 通过",
        },
        accessibilityContrastTarget: {
          en: "Contrast Target: 16.2:1 (Cream on Black)",
          zh: "对比度目标：16.2:1（奶油色背景）",
          bi: "Contrast Target: 16.2:1 (Cream on Black) · 对比度目标：16.2:1（奶油色背景）",
        },
        accessibilityFail: {
          en: "FAIL",
          zh: "未通过",
          bi: "FAIL · 未通过",
        },
        footerBrandGuideTitle: {
          en: "VERTU Brand Guidelines",
          zh: "VERTU 品牌指南",
          bi: "VERTU Brand Guidelines · VERTU 品牌指南",
        },
        footerCopyright: {
          en: "© 2026 VERTU. All rights reserved.",
          zh: "© 2026 VERTU。保留所有权利。",
          bi: "© 2026 VERTU. All rights reserved. · © 2026 VERTU。保留所有权利。",
        },
        cropGood: {
          en: "Correct",
          zh: "正确",
          bi: "Correct · 正确",
        },
        cropAvoid: {
          en: "Avoid",
          zh: "避免",
          bi: "Avoid · 避免",
        },
        genVariantWhite: {
          en: "White (Dark BG)",
          zh: "白色（深色背景）",
          bi: "White · 白色（深色背景）",
        },
        genVariantBlack: {
          en: "Black (Light BG)",
          zh: "黑色（浅色背景）",
          bi: "Black · 黑色（浅色背景）",
        },
        genVariantGold: {
          en: "Gold (Premium)",
          zh: "金色（高端）",
          bi: "Gold · 金色（高端）",
        },
        logoBackgroundColorLabel: {
          en: "Background color",
          zh: "背景色",
          bi: "Background color · 背景色",
        },
      },
      toast: {
        copyHex: {
          en: "Color copied to clipboard",
          zh: "色值已复制",
          bi: "Color copied to clipboard · 已复制色值",
        },
        copyPantone: {
          en: "Pantone reference copied",
          zh: "潘通参考已复制",
          bi: "Pantone reference copied · 潘通参考已复制",
        },
        copyCode: {
          en: "Code snippet copied",
          zh: "代码片段已复制",
          bi: "Code snippet copied · 代码片段已复制",
        },
        guideDownload: {
          en: "Downloading brand guide HTML",
          zh: "正在下载品牌指南 HTML",
          bi: "Downloading brand guide HTML · 正在下载品牌指南 HTML",
        },
        assetDownload: {
          en: "Downloading",
          zh: "正在下载",
          bi: "Downloading · 正在下载",
        },
        copyFailed: {
          en: "Copy failed. Please copy manually.",
          zh: "复制失败，请手动复制。",
          bi: "Copy failed. Please copy manually. · 复制失败，请手动复制。",
        },
        logoSourceUnavailable: {
          en: "Logo source image did not load. Please refresh the page and try again.",
          zh: "标志源图未加载成功，请刷新页面后重试。",
          bi: "Logo source image did not load. Please refresh the page and try again. · 标志源图未加载成功，请刷新页面后重试。",
        },
        logoDownloadFailed: {
          en: "Logo download failed. Please try again.",
          zh: "标志下载失败，请重试。",
          bi: "Logo download failed. Please try again. · 标志下载失败，请重试。",
        },
        logoContrastInvalid: {
          en: "Contrast check failed for {variant}. Choose a stronger contrasting background or enable Transparent.",
          zh: "{variant} 与当前背景对比不足。请切换更有对比度的背景或启用透明。",
          bi: "Contrast check failed for {variant}. Choose a stronger contrasting background or enable Transparent. · {variant} 与当前背景对比不足。请切换更有对比度的背景或启用透明。",
        },
        logoDownloadStart: {
          en: "Rendering logo for download…",
          zh: "正在生成标志下载文件…",
          bi: "Rendering logo for download… · 正在生成标志下载文件…",
        },
        logoGenerated: {
          en: "Generated & Downloaded!",
          zh: "已生成并下载！",
          bi: "Generated & Downloaded! · 已生成并下载！",
        },
        assetUnavailable: {
          en: "Asset file is not available",
          zh: "资产文件不可用",
          bi: "Asset file is not available · 资产文件不可用",
        },
      },
    },
  },
  timing: {
    toastDurationMs: 2000,
    codeCopyResetMs: 1600,
    chartAnimationDelayMs: 100,
    gaugeNeedleDelayMs: 300,
    coverHeaderOffsetPx: 56,
  },
  files: {
    "dl-logo-black": {
      name: "VERTU-Logo-Black.png",
      type: "asset",
      ariaLabel: {
        en: "Download black VERTU logo (PNG)",
        zh: "下载黑色 VERTU 标志（PNG）",
        bi: "Download black VERTU logo (PNG) · 下载黑色 VERTU 标志（PNG）",
      },
    },
    "dl-logo-white": {
      name: "VERTU-Logo-White.png",
      type: "asset",
      ariaLabel: {
        en: "Download white VERTU logo (PNG)",
        zh: "下载白色 VERTU 标志（PNG）",
        bi: "Download white VERTU logo (PNG) · 下载白色 VERTU 标志（PNG）",
      },
    },
    "dl-logo-gold": {
      name: "VERTU-Logo-Gold.png",
      type: "asset",
      ariaLabel: {
        en: "Download gold VERTU logo (PNG)",
        zh: "下载金色 VERTU 标志（PNG）",
        bi: "Download gold VERTU logo (PNG) · 下载金色 VERTU 标志（PNG）",
      },
    },
    "dl-pptx": {
      name: "VERTU-Template.pptx",
      type: "asset",
      ariaLabel: {
        en: "Download presentation template package (PPTX)",
        zh: "下载演示文稿模板包（PPTX）",
        bi: "Download presentation template package (PPTX) · 下载演示文稿模板包（PPTX）",
      },
    },
    "dl-docx": {
      name: "VERTU-Letterhead.docx",
      type: "asset",
      ariaLabel: {
        en: "Download letterhead template (DOCX)",
        zh: "下载信纸模板（DOCX）",
        bi: "Download letterhead template (DOCX) · 下载信纸模板（DOCX）",
      },
    },
    "dl-guide": {
      name: "vertu-brand-guide.html",
      type: "guide",
      ariaLabel: {
        en: "Download this brand guide (HTML)",
        zh: "下载该品牌指南（HTML）",
        bi: "Download this brand guide (HTML) · 下载该品牌指南（HTML）",
      },
    },
  },
  playback: {
    defaultFont: "'Playfair Display',serif",
    defaultSize: 48,
    defaultWeight: 400,
    defaultTracking: 0,
    sizeMin: 12,
    sizeMax: 96,
    weightMin: 300,
    weightMax: 700,
    trackMin: -5,
    trackMax: 30,
    logoPaddingMin: 8,
    logoPaddingMax: 300,
    logoRetryLimit: 20,
    logoCanvasWidth: 800,
    logoTargetScaleFactor: 1,
    logoDownloadDpr: 2,
    logoDefaultBgColor: null, // resolved at runtime from CSS --v-black
    logoVariantBackgroundDefaults: null, // resolved at runtime from CSS variables
    getLogoDefaultBgColor() {
      return this.logoDefaultBgColor || (this.logoDefaultBgColor = cssVar("--v-black") || "#080808");
    },
    getLogoVariantBg(variant) {
      if (!this.logoVariantBackgroundDefaults) {
        this.logoVariantBackgroundDefaults = {
          white: cssVar("--v-black") || "#080808",
          black: cssVar("--v-cream") || "#F2EDE5",
          gold: cssVar("--v-charcoal") || "#111111",
        };
      }
      return this.logoVariantBackgroundDefaults[variant] || this.getLogoDefaultBgColor();
    },
    logoVariantContrastPolicy: {
      white: {
        maxBackgroundLuminance: 0.82,
      },
      black: {
        minBackgroundLuminance: 0.2,
      },
      gold: {
        maxBackgroundLuminance: 0.94,
      },
    },
    socialDefaults: {
      headline: { en: "Crafted Beyond Measure", zh: "\u8D85\u8D8A\u5320\u5FC3" },
      subline: { en: "VERTU England", zh: "VERTU \u82F1\u683C\u5170" },
    },
  },
};

const log = {
  warn(context, message, data) {
    console.warn(`[VERTU:${context}]`, message, data ?? "");
  },
  error(context, message, data) {
    console.error(`[VERTU:${context}]`, message, data ?? "");
  },
};

const htmlElement = document.documentElement;
const mainScrollArea = document.getElementById("mainScrollArea");
const prefersReducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let prefersReducedMotion = prefersReducedMotionQuery.matches;

const scrollBar = document.getElementById("scrollProgress");
const toastContainer = document.getElementById("toastContainer");
const toastMessage = document.getElementById("toastMessage");
const coverElement = document.querySelector(".cover");
const mobileHeaderElement = document.querySelector(".navbar");
let toastTimer;
let currentLanguage = APP_CONFIG.defaults.language;
const assetAvailabilityCache = new Map();
let lastDrawerTrigger = null;
let scrollRafId = null;
let logoRetryAttempts = 0;
let revealObserver = null;
let mainScrollAreaFallbackTabbables = [];
let isThemeStorageBound = false;
let isDrawerListenerBound = false;
const drawerInputCached = document.getElementById("brand-drawer");
let scrollTrackingListenersBound = false;
let isLogoGeneratorBound = false;
let activeSectionId = null;
let smoothAnchorController = null;
let copyHandlerController = null;
const FOCUSABLE_ELEMENT_SELECTOR =
  "a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), details:not([disabled]), summary:not([disabled]), iframe, object, embed, [tabindex], [contenteditable='true']";
const normalizeTheme = (theme) => (theme === "light" ? "light" : "dark");
const cssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const toSafeNumber = (value, fallback) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const parseClampedNumber = (value, fallback, min, max, parser = Number) => {
  const parsed = parser(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return clamp(parsed, min, max);
};
const hexColorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const normalizeHexColor = (value, fallback) => {
  const raw = String(value || "").trim().toLowerCase();
  if (hexColorPattern.test(raw)) {
    return raw.length === 4
      ? `#${raw.slice(1).split("").map((char) => `${char}${char}`).join("")}`
      : raw;
  }
  return fallback || APP_CONFIG.playback.getLogoDefaultBgColor();
};
const focusIfFocusable = (element) => {
  if (!(element instanceof HTMLElement) || !element.isConnected) {
    return false;
  }

  element.focus({ preventScroll: true });
  return true;
};

const setOutputValue = (element, value) => {
  const normalized = String(value ?? "");
  if (element instanceof HTMLOutputElement) {
    element.value = normalized;
    return;
  }
  if (element) {
    element.textContent = normalized;
  }
};

function getStoredValue(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (err) {
    log.warn("storage", "Failed to read localStorage", { key, err });
    return null;
  }
}

function interpolateTemplate(template, values = {}) {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value || ""));
  }, template);
}

const canProbeAssets = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return ["http:", "https:"].includes(window.location.protocol);
};

const canDownloadFile = async (fileName) => {
  if (!fileName) {
    return false;
  }

  if (!canProbeAssets()) {
    return true;
  }

  const cached = assetAvailabilityCache.get(fileName);
  if (typeof cached === "boolean") {
    return cached;
  }

  try {
    const response = await fetch(fileName, {
      method: "HEAD",
      cache: "no-store",
      redirect: "manual",
    });
    const isAvailable = response.ok || response.type === "opaque" || response.status === 0;
    assetAvailabilityCache.set(fileName, isAvailable);
    return isAvailable;
  } catch (err) {
    log.warn("download", "Asset availability check failed", { fileName, err });
    assetAvailabilityCache.set(fileName, false);
    return false;
  }
};

const downloadAssetFile = (fileName) => {
  const anchor = document.createElement("a");
  anchor.href = fileName;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.click();
};

function normalizeLanguage(language) {
  const raw = (String(language || "").toLowerCase()).trim();
  const alias = APP_CONFIG.language.alias[raw];
  const safe = alias || raw;
  return APP_CONFIG.language.supported.includes(safe) ? safe : APP_CONFIG.defaults.language;
}

function getLocalizedMessage(category, language) {
  const lang = normalizeLanguage(language);
  const source = APP_CONFIG.language.i18n?.toast?.[category];
  if (!source) {
    return "";
  }

  const target = source[lang];
  if (target) {
    return target;
  }

  return source.en || source.zh || "";
}

function getLocalizedUiText(category, language) {
  const lang = normalizeLanguage(language);
  const source = APP_CONFIG.language.i18n?.ui?.[category];
  if (!source) {
    return "";
  }

  return source[lang] || source.en || source.zh || "";
}

function getLocalizedAttributeText(category, language, fallback = "", replacements = {}) {
  const template = getLocalizedUiText(category, language);
  if (!template) {
    return fallback;
  }

  return interpolateTemplate(template, replacements);
}

function localizeAttributePairs(language) {
  const lang = normalizeLanguage(language);

  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    const key = element.getAttribute("data-i18n-aria");
    const fallback = element.getAttribute("aria-label") || "";
    const localized = getLocalizedAttributeText(key, lang, fallback, {});
    element.setAttribute("aria-label", localized || fallback);
  });

  document.querySelectorAll("[data-i18n-text]").forEach((element) => {
    const key = element.getAttribute("data-i18n-text");
    const fallback = element.textContent || "";
    const localized = getLocalizedAttributeText(key, lang, fallback, {});
    element.textContent = localized || fallback;
  });

  document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
    const key = element.getAttribute("data-i18n-alt");
    const fallback = element instanceof HTMLImageElement ? element.alt || "" : "";
    const localized = getLocalizedAttributeText(key, lang, fallback, {});
    if (element instanceof HTMLImageElement) {
      element.alt = localized || fallback;
    }
  });
}

function localizeCodeCopyButtons(language) {
  const label = getLocalizedUiText("copyReady", language);
  const codeLabel = getLocalizedUiText("copyCodeLabel", language);

  document.querySelectorAll(".code-copy-btn").forEach((button) => {
    button.textContent = label;
    const codeLanguage = button.closest(".code-header")?.querySelector(".code-lang")?.textContent?.trim() || "";
    const suffix = codeLanguage ? ` (${codeLanguage})` : "";
    button.setAttribute("aria-label", `${codeLabel}${suffix}`.trim());
  });
}

function localizeDownloadButtons(language) {
  Object.keys(APP_CONFIG.files).forEach((id) => {
    const entry = APP_CONFIG.files[id];
    const button = document.getElementById(id);
    if (!button || !entry?.ariaLabel) {
      return;
    }

    const normalized = normalizeLanguage(language);
    const ariaLabel = entry.ariaLabel[normalized] || entry.ariaLabel.en || entry.ariaLabel.zh || "";
    if (ariaLabel) {
      button.setAttribute("aria-label", ariaLabel);
    }
  });
}

function localizeCopyButtons(language) {
  document.querySelectorAll("[data-copy-kind='color']").forEach((button) => {
    const colorName = button.getAttribute("data-copy-name") || button.querySelector(".color-name")?.textContent?.trim() || "";
    const colorValue = button.getAttribute("data-copy-value") || button.getAttribute("data-hex") || "";
    const label = getLocalizedAttributeText("copyColor", language, "", { name: colorName, value: colorValue });
    if (label) {
      button.setAttribute("aria-label", label);
    }
  });

  document.querySelectorAll("[data-copy-kind='pantone']").forEach((button) => {
    const value = button.getAttribute("data-copy-value") || button.querySelector("[data-kopier]")?.dataset?.kopier || "";
    const label = getLocalizedAttributeText("copyPantone", language, "", { value });
    if (label) {
      button.setAttribute("aria-label", label);
    }
  });
}

function setStoredValue(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (err) {
    log.warn("storage", "Failed to write localStorage", { key, err });
  }
}

function showToast(message) {
  if (!toastContainer || !toastMessage) return;

  toastMessage.textContent = message;
  toastContainer.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastContainer.classList.add("hidden");
  }, APP_CONFIG.timing.toastDurationMs);
}

async function copyText(text) {
  if (!text) return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    log.warn("clipboard", "Clipboard API failed, falling back", { err });
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.className = "copy-fallback-input";
  input.setAttribute("aria-hidden", "true");
  input.tabIndex = -1;

  let success = false;
  try {
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, 99999);
    success = document.execCommand("copy");
  } catch (err) {
    log.warn("clipboard", "execCommand copy fallback failed", { err });
    return false;
  } finally {
    if (input.parentNode) {
      input.parentNode.removeChild(input);
    }
  }

  return success;
}

function bindCopyButton(selector, copyGetter, successMessageKey, signal) {
  document.querySelectorAll(selector).forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      const text = copyGetter(button);
      const didCopy = await copyText(text);
      if (didCopy) {
        showToast(getLocalizedMessage(successMessageKey, currentLanguage));
      } else {
        showToast(getLocalizedMessage("copyFailed", currentLanguage));
      }
    }, { signal });
  });
}

function updateScrollProgress() {
  if (!scrollBar) return;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
  scrollBar.style.width = `${pct}%`;
}

function updateThemeButtons(theme) {
  const isDark = theme === "dark";
  // Sync all theme toggles (sidebar + navbar)
  ["themeToggle", "navThemeToggle"].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn instanceof HTMLInputElement) {
      btn.checked = isDark;
    }
    const swapLabel = btn?.closest("label.swap");
    if (swapLabel) {
      swapLabel.setAttribute("aria-checked", String(isDark));
    }
  });
  htmlElement.setAttribute("data-theme", isDark ? "dark" : "light");
}

/** Cached section offsets for scroll-spy — rebuilt on resize/init */
let sectionOffsets = [];

function buildSectionOffsets() {
  sectionOffsets = Array.from(document.querySelectorAll(".guide-section"))
    .filter((s) => s.id)
    .map((s) => ({ id: s.id, top: s.offsetTop }))
    .sort((a, b) => a.top - b.top);
}

/**
 * Deterministic scroll-spy: finds which section's top is at or above
 * the detection line (15% from viewport top). Falls back to first/last section
 * at scroll extremes. No IntersectionObserver — no rootMargin guesswork.
 */
function updateActiveSection() {
  if (!sectionOffsets.length) return;

  const scrollY = window.scrollY;
  const detectionLine = scrollY + window.innerHeight * 0.15;

  // At page bottom, activate last section
  if (scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
    setActiveNavigationSection(sectionOffsets[sectionOffsets.length - 1].id);
    return;
  }

  // Find the last section whose top is at or above the detection line
  let active = sectionOffsets[0].id;
  for (const section of sectionOffsets) {
    if (section.top <= detectionLine) {
      active = section.id;
    } else {
      break;
    }
  }
  setActiveNavigationSection(active);
}

function queueScrollUpdate() {
  if (scrollRafId !== null) return;
  scrollRafId = requestAnimationFrame(() => {
    scrollRafId = null;
    updateScrollProgress();
    updateActiveSection();
    handleMobileHeader();
  });
}

function handleMobileHeader() {
  if (!coverElement || !mobileHeaderElement) {
    return;
  }
  const coverBottom = coverElement.offsetTop + coverElement.offsetHeight;
  if (window.scrollY > coverBottom - APP_CONFIG.timing.coverHeaderOffsetPx) {
    mobileHeaderElement.style.transform = "translateY(0)";
  } else {
    mobileHeaderElement.style.transform = "translateY(-100%)";
  }
}

function setMainScrollAreaInert(isHidden) {
  if (!mainScrollArea) return;
  if (isHidden) {
    mainScrollArea.setAttribute("aria-hidden", "true");
    if ("inert" in mainScrollArea) {
      mainScrollArea.inert = true;
      return;
    }

    if (!mainScrollAreaFallbackTabbables.length) {
      const focusableElements = Array.from(mainScrollArea.querySelectorAll(FOCUSABLE_ELEMENT_SELECTOR));
      focusableElements.forEach((element) => {
        if (element.closest(".drawer") || element.closest(".drawer-side")) {
          return;
        }
        mainScrollAreaFallbackTabbables.push({
          element,
          tabindex: element.getAttribute("tabindex"),
          ariaHidden: element.getAttribute("aria-hidden"),
        });
        element.setAttribute("tabindex", "-1");
        element.setAttribute("aria-hidden", "true");
      });
    }
  } else {
    mainScrollArea.removeAttribute("aria-hidden");
    if ("inert" in mainScrollArea) {
      mainScrollArea.inert = false;
      return;
    }

    mainScrollAreaFallbackTabbables.forEach(({ element, tabindex, ariaHidden }) => {
      if (tabindex === null) {
        element.removeAttribute("tabindex");
      } else {
        element.setAttribute("tabindex", tabindex);
      }
      if (ariaHidden === null) {
        element.removeAttribute("aria-hidden");
      } else {
        element.setAttribute("aria-hidden", ariaHidden);
      }
    });
    if (mainScrollAreaFallbackTabbables.length) {
      mainScrollAreaFallbackTabbables = [];
    }
  }
}

function syncDrawerControls() {
  const drawerInput = drawerInputCached;
  const isOpen = !!drawerInput?.checked;
  const drawerOpenButton = document.getElementById("drawerOpenButton");
  const drawerCloseButton = document.getElementById("drawerCloseButton");
  if (drawerOpenButton) {
    drawerOpenButton.setAttribute("aria-expanded", String(isOpen));
  }
  if (drawerCloseButton) {
    drawerCloseButton.setAttribute("aria-expanded", String(isOpen));
  }
  if (drawerInput && !isOpen && lastDrawerTrigger instanceof HTMLElement) {
    focusIfFocusable(lastDrawerTrigger);
    lastDrawerTrigger = null;
  }
  setMainScrollAreaInert(isOpen);
  if (isOpen && drawerCloseButton instanceof HTMLElement) {
    focusIfFocusable(drawerCloseButton);
  }
}

function setActiveNavigationSection(activeId) {
  activeSectionId = activeId || null;
  let activeLink = null;
  document.querySelectorAll(".menu a[href^=\"#\"]").forEach((link) => {
    const isActive = activeId && link.getAttribute("href") === `#${activeId}`;
    link.classList.toggle("menu-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
      activeLink = link;
    } else {
      link.removeAttribute("aria-current");
    }
  });
  if (activeLink) {
    const scrollContainer = activeLink.closest(".overflow-y-auto");
    if (scrollContainer) {
      const linkRect = activeLink.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      const target = scrollContainer.scrollTop + linkRect.top - containerRect.top - containerRect.height / 2 + linkRect.height / 2;
      scrollContainer.scrollTop = Math.max(0, target);
    }
  }
}

function initTheme() {
  const savedTheme = normalizeTheme(
    getStoredValue(APP_CONFIG.storageKeys.theme) || APP_CONFIG.defaults.theme,
  );
  updateThemeButtons(savedTheme);

  if (!isThemeStorageBound) {
    ["themeToggle", "navThemeToggle"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn instanceof HTMLInputElement) {
        btn.addEventListener("change", (event) => {
          const nextTheme = normalizeTheme(event.target.checked ? "dark" : "light");
          updateThemeButtons(nextTheme);
          setStoredValue(APP_CONFIG.storageKeys.theme, nextTheme);
        });
      }
    });

    window.addEventListener("storage", (event) => {
      if (event.key !== APP_CONFIG.storageKeys.theme) {
        return;
      }
      const syncedTheme = normalizeTheme(event.newValue || APP_CONFIG.defaults.theme);
      updateThemeButtons(syncedTheme);
    });
    isThemeStorageBound = true;
  }
}

function applyLanguage(language) {
  const lang = normalizeLanguage(language);
  currentLanguage = lang;
  const showEnglish = lang === "en" || lang === "bi";
  const showChinese = lang === "zh" || lang === "bi";

  document.documentElement.lang = lang === "zh" ? "zh" : "en";
  document.documentElement.setAttribute("data-lang", lang);

  document.querySelectorAll("[data-lang-en]").forEach((element) => {
    element.hidden = !showEnglish;
    element.setAttribute("aria-hidden", String(!showEnglish));
  });

  document.querySelectorAll("[data-lang-cn]").forEach((element) => {
    element.hidden = !showChinese;
    element.setAttribute("aria-hidden", String(!showChinese));
  });

  localizeCodeCopyButtons(lang);
  localizeCopyButtons(lang);
  localizeDownloadButtons(lang);
  localizeAttributePairs(lang);

  // Sync all language <select> elements
  document.querySelectorAll(".lang-select").forEach((sel) => {
    if (sel.value !== lang) sel.value = lang;
  });

  syncDrawerControls();
}

function initLanguage() {
  const savedLanguage = getStoredValue(APP_CONFIG.storageKeys.language);
  const safeLanguage = normalizeLanguage(savedLanguage || APP_CONFIG.defaults.language);
  applyLanguage(safeLanguage);

  // Bind all language <select> elements
  document.querySelectorAll(".lang-select").forEach((sel) => {
    sel.addEventListener("change", () => {
      const nextLanguage = normalizeLanguage(sel.value);
      applyLanguage(nextLanguage);
      setStoredValue(APP_CONFIG.storageKeys.language, nextLanguage);
    });
  });
}

function initMotionPreference() {
  const applyReducedMotion = () => {
    if (!prefersReducedMotionQuery) {
      return;
    }

    const nextValue = prefersReducedMotionQuery.matches;
    if (nextValue === prefersReducedMotion) {
      return;
    }
    prefersReducedMotion = nextValue;
    if (prefersReducedMotion) {
      document.querySelectorAll(".reveal").forEach((element) => {
        element.classList.add("visible", "vis");
      });
      if (revealObserver) {
        revealObserver.disconnect();
        revealObserver = null;
      }
      return;
    }

    initScrollTracking();
  };

  applyReducedMotion();
  if (typeof prefersReducedMotionQuery.addEventListener === "function") {
    prefersReducedMotionQuery.addEventListener("change", applyReducedMotion);
  } else if (typeof prefersReducedMotionQuery.addListener === "function") {
    prefersReducedMotionQuery.addListener(applyReducedMotion);
  }
}

function initDrawerControls() {
  const openButton = document.getElementById("drawerOpenButton");
  const closeButton = document.getElementById("drawerCloseButton");
  const drawerOverlay = document.getElementById("drawerOverlay");
  const drawerSide = document.querySelector(".drawer-side");
  const drawerInput = drawerInputCached;
  const fallbackFocusButton = document.getElementById("drawerOpenButton");

  if (!drawerInput) {
    return;
  }

  const openDrawer = (trigger) => {
    drawerInput.checked = true;
    if (trigger instanceof HTMLElement) {
      lastDrawerTrigger = trigger;
    }
    syncDrawerControls();
  };

  const closeDrawer = () => {
    drawerInput.checked = false;
    if (!focusIfFocusable(lastDrawerTrigger)) {
      focusIfFocusable(fallbackFocusButton);
    }
    lastDrawerTrigger = null;
    syncDrawerControls();
  };

  if (isDrawerListenerBound) {
    syncDrawerControls();
    return;
  }

  isDrawerListenerBound = true;

  if (openButton) {
    openButton.addEventListener("click", () => {
      openDrawer(openButton);
    });
  }

  if (closeButton) {
    closeButton.addEventListener("click", closeDrawer);
  }
  if (drawerOverlay) {
    drawerOverlay.addEventListener("click", closeDrawer);
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawerInput.checked) {
      closeDrawer();
    }
  });

  if (drawerSide) {
    drawerSide.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.classList.contains("drawer-side")) {
        closeDrawer();
      }
    });
  }

  drawerInput.addEventListener("change", syncDrawerControls);
  syncDrawerControls();
}

function initCopyHandlers() {
  if (copyHandlerController) copyHandlerController.abort();
  copyHandlerController = new AbortController();
  const signal = copyHandlerController.signal;

  bindCopyButton(".color-card", (card) => card.dataset.copyValue || card.dataset.hex, "copyHex", signal);

  bindCopyButton(".pantone-chip", (chip) => {
    return chip.dataset.copyValue || chip.querySelector(".pantone-label")?.dataset.kopier || "";
  }, "copyPantone", signal);

  document.querySelectorAll(".code-copy-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      const code = button.closest(".mockup-code");
      const pre = code?.querySelector("pre");
      const text = pre ? (pre.innerText || pre.textContent || "") : "";
      const didCopy = await copyText(text);
      if (didCopy) {
        showToast(getLocalizedMessage("copyCode", currentLanguage));
      } else {
        showToast(getLocalizedMessage("copyFailed", currentLanguage));
      }
      const originalText = button.textContent;
      button.textContent = getLocalizedUiText("copied", currentLanguage);
      button.classList.add("copied");
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("copied");
      }, APP_CONFIG.timing.codeCopyResetMs);
    }, { signal });
  });

  Object.keys(APP_CONFIG.files).forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.addEventListener("click", async () => {
      const file = APP_CONFIG.files[id];
      if (!file) return;

      if (file.type === "guide") {
        const blob = new Blob([document.documentElement.outerHTML], {
          type: "text/html;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = file.name;
        anchor.click();
        URL.revokeObjectURL(url);
        showToast(getLocalizedMessage("guideDownload", currentLanguage));
        return;
      }

      const available = await canDownloadFile(file.name);
      if (!available) {
        showToast(`${getLocalizedMessage("assetUnavailable", currentLanguage)}: ${file.name}`);
        return;
      }

      downloadAssetFile(file.name);
      const actionLabel = getLocalizedMessage("assetDownload", currentLanguage);
      showToast(`${actionLabel}: ${file.name}`);
    });
  });
}

function initScrollTracking() {
  if (revealObserver) {
    revealObserver.disconnect();
    revealObserver = null;
  }

  // Build deterministic section offsets for scroll-spy
  buildSectionOffsets();

  if (prefersReducedMotion) {
    document.querySelectorAll(".reveal").forEach((el) => {
      el.classList.add("visible", "vis");
    });
  } else {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible", "vis");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        threshold: 0.01,
        rootMargin: "0px 0px 120px 0px",
      },
    );

    document.querySelectorAll(".reveal").forEach((element) => {
      revealObserver.observe(element);
    });
  }

  if (!scrollTrackingListenersBound) {
    window.addEventListener("scroll", queueScrollUpdate, { passive: true });
    window.addEventListener("resize", () => {
      buildSectionOffsets();
      queueScrollUpdate();
    }, { passive: true });
    scrollTrackingListenersBound = true;
  }
  queueScrollUpdate();
}

function initSmoothAnchors() {
  if (smoothAnchorController) smoothAnchorController.abort();
  smoothAnchorController = new AbortController();
  const signal = smoothAnchorController.signal;

  document.querySelectorAll('.menu a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      const target = href ? document.querySelector(href) : null;
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });

      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      target.addEventListener("blur", () => {
        target.removeAttribute("tabindex");
      }, { once: true });

      if (drawerInputCached && drawerInputCached.checked) {
        drawerInputCached.checked = false;
        syncDrawerControls();
      }
    }, { signal });
  });
}

function initTypePlayground() {
  const typeFont = document.getElementById("typeFont");
  const typeSize = document.getElementById("typeSize");
  const typeWeight = document.getElementById("typeWeight");
  const typeTrack = document.getElementById("typeTrack");

  const typePreview = document.getElementById("typePreview");
  const typeSizeVal = document.getElementById("typeSizeVal");
  const typeWeightVal = document.getElementById("typeWeightVal");
  const typeTrackVal = document.getElementById("typeTrackVal");

  if (!typePreview || !typeFont || !typeSize || !typeWeight || !typeTrack) {
    return;
  }

  typeFont.value = typeFont.value || APP_CONFIG.playback.defaultFont;
  typeSize.value = String(parseClampedNumber(typeSize.value, APP_CONFIG.playback.defaultSize, APP_CONFIG.playback.sizeMin, APP_CONFIG.playback.sizeMax));
  typeWeight.value = String(parseClampedNumber(typeWeight.value, APP_CONFIG.playback.defaultWeight, APP_CONFIG.playback.weightMin, APP_CONFIG.playback.weightMax, Number));
  typeTrack.value = String(parseClampedNumber(typeTrack.value, APP_CONFIG.playback.defaultTracking, APP_CONFIG.playback.trackMin, APP_CONFIG.playback.trackMax, Number));

  const update = () => {
    const font = typeFont.value || APP_CONFIG.playback.defaultFont;
    const size = parseClampedNumber(typeSize.value, APP_CONFIG.playback.defaultSize, APP_CONFIG.playback.sizeMin, APP_CONFIG.playback.sizeMax, Number);
    const weight = parseClampedNumber(typeWeight.value, APP_CONFIG.playback.defaultWeight, APP_CONFIG.playback.weightMin, APP_CONFIG.playback.weightMax, Number);
    const tracking = parseClampedNumber(typeTrack.value, APP_CONFIG.playback.defaultTracking, APP_CONFIG.playback.trackMin, APP_CONFIG.playback.trackMax, Number);
    const trackingEm = (tracking / 10).toFixed(1);

    typeSize.value = String(size);
    typeWeight.value = String(weight);
    typeTrack.value = String(tracking);

    typePreview.style.fontFamily = font;
    typePreview.style.fontSize = `${size}px`;
    typePreview.style.fontWeight = `${weight}`;
    typePreview.style.letterSpacing = `${trackingEm}em`;

    setOutputValue(typeSizeVal, `${size}px`);
    setOutputValue(typeWeightVal, `${weight}`);
    setOutputValue(typeTrackVal, `${trackingEm}em`);
  };

  typeFont.addEventListener("change", update);
  typeSize.addEventListener("input", update);
  typeWeight.addEventListener("input", update);
  typeTrack.addEventListener("input", update);

  update();
}

function initScrollProgress() {
  updateScrollProgress();
}

function initAnimationObservers() {
  if (prefersReducedMotion) return;

  const animateObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      if (entry.target.classList.contains("color-chart-container")) {
        const segments = entry.target.querySelectorAll(".color-chart-segment");
        segments.forEach((seg) => {
          const targetWidth = window.getComputedStyle(seg).width;
          seg.style.width = "0px";
          setTimeout(() => {
            seg.style.width = targetWidth;
          }, APP_CONFIG.timing.chartAnimationDelayMs);
        });
      }

      if (entry.target.classList.contains("gauge-container")) {
        const needle = entry.target.querySelector(".gauge-needle");
        if (needle) {
          needle.style.transform = "rotate(0deg)";
          setTimeout(() => {
            needle.style.transform = "rotate(155deg)";
          }, APP_CONFIG.timing.gaugeNeedleDelayMs);
        }
      }

      animateObserver.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll(".color-chart-container, .gauge-container").forEach((el) => {
    animateObserver.observe(el);
  });
}

function applyDefaultState() {
  initTheme();
  initMotionPreference();
  initLanguage();
  initDrawerControls();
  initCopyHandlers();
  initScrollTracking();
  initSmoothAnchors();
  initTypePlayground();
  initScrollProgress();
  initAnimationObservers();
}

applyDefaultState();


// --- Interactive Logo Generator ---
function initLogoGenerator() {
  if (isLogoGeneratorBound) {
    return;
  }
  const canvas = document.getElementById("gen-canvas");
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const selectVariant = document.getElementById("gen-variant");
  const inputPadding = document.getElementById("gen-padding");
  const inputBgColor = document.getElementById("gen-bgcolor");
  const inputTransparent = document.getElementById("gen-transparent");
  const btnDownload = document.getElementById("gen-download-btn");
  const inputPaddingMinLabel = document.getElementById("gen-padding-min-label");
  const inputPaddingMaxLabel = document.getElementById("gen-padding-max-label");
  const contrastFeedback = document.getElementById("gen-contrast-feedback");

  const sources = {
    black: document.getElementById("src-logo-black"),
    white: document.getElementById("src-logo-white"),
    gold: document.getElementById("src-logo-gold"),
  };

  const playback = APP_CONFIG.playback;
  const targetWidth = playback.logoCanvasWidth;
  const maxRetryCount = playback.logoRetryLimit;
  const dpr = playback.logoDownloadDpr;
  const logoVariantLabelKeys = {
    white: "genVariantWhite",
    black: "genVariantBlack",
    gold: "genVariantGold",
  };

  const getActiveVariant = () => {
    const raw = selectVariant?.value || "white";
    if (Object.prototype.hasOwnProperty.call(sources, raw)) {
      return raw;
    }
    return "white";
  };

  const getBackgroundColor = () => {
    const fallbackColor = playback.getLogoDefaultBgColor();
    return normalizeHexColor(inputBgColor?.value || fallbackColor, fallbackColor);
  };

  const parseHexChannel = (value) => {
    const safeValue = Number.parseInt(value, 16);
    const channel = Number.isFinite(safeValue) ? safeValue : 0;
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  const getColorLuminance = (hexColor) => {
    const normalizedColor = normalizeHexColor(hexColor, playback.getLogoDefaultBgColor());
    const r = parseHexChannel(normalizedColor.slice(1, 3));
    const g = parseHexChannel(normalizedColor.slice(3, 5));
    const b = parseHexChannel(normalizedColor.slice(5, 7));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const isBackgroundAccessibleForVariant = (variant, backgroundColor, isTransparent) => {
    if (isTransparent) {
      return true;
    }
    const policy = playback.logoVariantContrastPolicy?.[variant];
    if (!policy) {
      return true;
    }
    const luminance = getColorLuminance(backgroundColor);
    if (typeof policy.minBackgroundLuminance === "number" && luminance < policy.minBackgroundLuminance) {
      return false;
    }
    if (typeof policy.maxBackgroundLuminance === "number" && luminance > policy.maxBackgroundLuminance) {
      return false;
    }
    return true;
  };

  const showContrastToast = (variant) => {
    if (contrastFeedback) {
      const variantLabel = getLocalizedUiText(
        logoVariantLabelKeys[variant] || "logoBackgroundColorLabel",
        currentLanguage,
      );
      const template = getLocalizedMessage("logoContrastInvalid", currentLanguage);
      contrastFeedback.textContent = interpolateTemplate(template, { variant: variantLabel });
      contrastFeedback.classList.remove("text-success");
      contrastFeedback.classList.add("text-error");
    }
    const variantLabel = getLocalizedUiText(
      logoVariantLabelKeys[variant] || "logoBackgroundColorLabel",
      currentLanguage,
    );
    const template = getLocalizedMessage("logoContrastInvalid", currentLanguage);
    showToast(interpolateTemplate(template, { variant: variantLabel }));
  };

  const clearContrastFeedback = () => {
    if (contrastFeedback) {
      contrastFeedback.textContent = "";
      contrastFeedback.classList.remove("text-success", "text-error");
    }
  };

  const enforceVariantBackground = () => {
    if (!inputBgColor || inputTransparent?.checked) {
      return;
    }
    const selectedVariant = getActiveVariant();
    const defaultColor = playback.getLogoVariantBg(selectedVariant);
    if (defaultColor) {
      inputBgColor.value = normalizeHexColor(defaultColor, playback.getLogoDefaultBgColor());
    }
  };

  const draw = async () => {
    if (!selectVariant || !inputPadding || !inputBgColor || !inputTransparent) {
      return false;
    }

    const selectedVariant = getActiveVariant();
    const selectedSource = sources[selectedVariant];
    if (!selectedSource) {
      showToast(getLocalizedMessage("logoDownloadFailed", currentLanguage));
      return false;
    }

    const safePadding = parseClampedNumber(
      parseInt(inputPadding.value, 10),
      playback.logoPaddingMin,
      playback.logoPaddingMin,
      playback.logoPaddingMax,
      Number,
    );
    const isTransparent = inputTransparent.checked;
    const bgColor = getBackgroundColor();
    if (!isBackgroundAccessibleForVariant(selectedVariant, bgColor, isTransparent)) {
      showContrastToast(selectedVariant);
      return false;
    }
    if (contrastFeedback) {
      clearContrastFeedback();
    }
    const resolvedSource = selectedSource;
    if (inputBgColor && inputBgColor.value !== bgColor) {
      inputBgColor.value = bgColor;
    }

    if (!resolvedSource.complete || resolvedSource.naturalWidth === 0 || resolvedSource.naturalHeight === 0) {
      if (logoRetryAttempts >= maxRetryCount) {
        showToast(getLocalizedMessage("logoSourceUnavailable", currentLanguage));
        logoRetryAttempts = 0;
        return false;
      }
      logoRetryAttempts += 1;
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          draw().then(resolve);
        });
      });
    }

    logoRetryAttempts = 0;

    const imgW = resolvedSource.naturalWidth;
    const imgH = resolvedSource.naturalHeight;
    const scale = (targetWidth - safePadding * 2) / Math.max(imgW, 1);
    const targetHeight = Math.max(1, Math.round((imgH * scale) + (safePadding * 2)));
    const scaledDevicePixelRatio = Math.max(
      1,
      window.devicePixelRatio * Number(dpr || 1),
    );

    canvas.width = Math.max(1, Math.round(targetWidth * scaledDevicePixelRatio));
    canvas.height = Math.max(1, Math.round(targetHeight * scaledDevicePixelRatio));
    canvas.style.width = `${targetWidth}px`;
    canvas.style.height = `${targetHeight}px`;

    ctx.setTransform(scaledDevicePixelRatio, 0, 0, scaledDevicePixelRatio, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else {
      ctx.clearRect(0, 0, targetWidth, targetHeight);
    }

    const drawW = imgW * scale;
    const drawH = imgH * scale;
    try {
      ctx.drawImage(resolvedSource, safePadding, safePadding, drawW, drawH);
    } catch (err) {
      log.error("logo", "Canvas drawImage failed", { err });
      showToast(getLocalizedMessage("logoDownloadFailed", currentLanguage));
      return false;
    }

    return true;
  };

  let isDownloading = false;
  const requestDownload = async () => {
    if (!btnDownload || !inputTransparent || isDownloading) {
      return;
    }

    isDownloading = true;
    btnDownload.disabled = true;
    const downloadVariant = getActiveVariant();
    const variantTag = inputTransparent.checked ? "transparent" : "solid";

    try {
      const isRendered = await draw();
      if (!isRendered) {
        return;
      }
      if (!canvas.width || !canvas.height || typeof canvas.toDataURL !== "function") {
        showToast(getLocalizedMessage("logoDownloadFailed", currentLanguage));
        return;
      }

      const href = canvas.toDataURL("image/png");
      const anchor = document.createElement("a");
      anchor.download = `VERTU-Logo-${downloadVariant}-${variantTag}.png`;
      anchor.href = href;
      showToast(getLocalizedMessage("logoDownloadStart", currentLanguage));
      anchor.click();
      showToast(getLocalizedMessage("logoGenerated", currentLanguage));
    } catch (err) {
      log.error("logo", "Logo download failed", { err });
      showToast(getLocalizedMessage("logoDownloadFailed", currentLanguage));
    } finally {
      isDownloading = false;
      btnDownload.disabled = false;
    }
  };

  if (inputPaddingMinLabel && inputPaddingMaxLabel) {
    inputPaddingMinLabel.textContent = `${playback.logoPaddingMin}px`;
    inputPaddingMaxLabel.textContent = `${playback.logoPaddingMax}px`;
  }
  if (inputPadding) {
    inputPadding.min = String(playback.logoPaddingMin);
    inputPadding.max = String(playback.logoPaddingMax);
    inputPadding.value = String(clamp(
      parseClampedNumber(
        inputPadding.value,
        playback.logoPaddingMin,
        playback.logoPaddingMin,
        playback.logoPaddingMax,
        Number,
      ),
      playback.logoPaddingMin,
      playback.logoPaddingMax,
    ));
  }

  if (inputBgColor && !inputBgColor.value) {
    inputBgColor.value = playback.getLogoDefaultBgColor();
  }
  enforceVariantBackground();
  if (selectVariant) {
    selectVariant.addEventListener("change", () => {
      enforceVariantBackground();
      draw();
    });
    [inputPadding, inputBgColor, inputTransparent].forEach((control) => {
      if (!control) {
        return;
      }
      control.addEventListener("input", draw);
      control.addEventListener("change", draw);
    });
  }

  if (btnDownload) {
    btnDownload.addEventListener("click", requestDownload);
  }

  Object.keys(sources).forEach((variant) => {
    const source = sources[variant];
    if (!source) {
      return;
    }
    source.addEventListener("error", () => {
      if (variant === getActiveVariant()) {
        showToast(getLocalizedMessage("logoSourceUnavailable", currentLanguage));
      }
    });
    if (source.complete) {
      return;
    }
    source.addEventListener("load", draw);
  });

  // Re-render when global theme changes (background may relate to theme)
  const logoThemeObs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === 'data-theme') { draw(); break; }
    }
  });
  logoThemeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  isLogoGeneratorBound = true;
  draw();
}

document.addEventListener('DOMContentLoaded', initLogoGenerator);

// --- Social Media Template Generator ---
const SOCIAL_FORMATS = {
  'ig-post':   { w: 1080, h: 1080,  label: 'Instagram-Post' },
  'ig-story':  { w: 1080, h: 1920,  label: 'Instagram-Story' },
  'linkedin':  { w: 1200, h: 627,   label: 'LinkedIn-Post' },
  'x-header':  { w: 1500, h: 500,   label: 'X-Header' },
};

let _socialThemesCache = null;
const getSocialThemes = () => {
  if (!_socialThemesCache) {
    const v = (name, fallback) => cssVar(name) || fallback;
    _socialThemesCache = {
      dark:  { bg: v("--v-black", "#080808"), logo: "white", headline: v("--v-cream", "#F2EDE5"), sub: v("--v-titanium", "#B5AFA7"), rule: v("--v-gold", "#D4B978"), watermark: v("--v-gold", "#D4B978") },
      light: { bg: v("--v-ivory", "#FAF7F2"), logo: "black", headline: v("--ink", "#1A1816"), sub: v("--ink-soft", "#58534C"), rule: v("--v-gold", "#D4B978"), watermark: v("--v-gold-deep", "#C4A55E") },
      gold:  { bg: v("--v-gold", "#D4B978"), logo: "black", headline: v("--v-black", "#080808"), sub: v("--v-charcoal", "#111111"), rule: v("--v-black", "#080808"), watermark: v("--v-charcoal", "#111111") },
    };
  }
  return _socialThemesCache;
};

let isSocialGeneratorBound = false;

function initSocialGenerator() {
  if (isSocialGeneratorBound) { return; }
  const canvas = document.getElementById('social-canvas');
  if (!canvas) { return; }
  const ctx = canvas.getContext('2d');
  if (!ctx) { return; }

  const selectFormat   = document.getElementById('social-format');
  const selectTheme    = document.getElementById('social-theme');
  const inputHeadline  = document.getElementById('social-headline');
  const inputSubline   = document.getElementById('social-subline');
  const btnDownload    = document.getElementById('social-download-btn');

  const logoSources = {
    black: document.getElementById('src-logo-black'),
    white: document.getElementById('src-logo-white'),
    gold:  document.getElementById('src-logo-gold'),
  };

  const PREVIEW_MAX = 480;
  const FONT_SERIF = "'Playfair Display', 'Times New Roman', serif";
  const FONT_MONO  = "'IBM Plex Mono', 'Courier New', monospace";

  /** Shared canvas renderer — used by both preview and full-res export */
  const renderSocialToCtx = (targetCtx, W, H, theme, minFontScale) => {
    const socialDefaults = APP_CONFIG.playback.socialDefaults;
    const langKey = currentLanguage === "zh" ? "zh" : "en";
    const headline = inputHeadline?.value.trim() || socialDefaults.headline[langKey];
    const subline  = inputSubline?.value.trim()  || socialDefaults.subline[langKey];
    const margin = Math.round(W * 0.09);
    const logoH  = Math.round(H * 0.10);
    const logoY  = Math.round(H * 0.30);

    // Background
    targetCtx.fillStyle = theme.bg;
    targetCtx.fillRect(0, 0, W, H);

    // Logo
    const logoImg = logoSources[theme.logo];
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      const logoW = Math.round(logoH * (logoImg.naturalWidth / logoImg.naturalHeight));
      targetCtx.drawImage(logoImg, Math.round((W - logoW) / 2), logoY, logoW, logoH);
    }

    // Gold rule
    const ruleY = Math.round(logoY + logoH + H * 0.055);
    targetCtx.strokeStyle = theme.rule;
    targetCtx.lineWidth = Math.max(minFontScale, Math.round(H * 0.003));
    targetCtx.beginPath();
    targetCtx.moveTo(margin, ruleY);
    targetCtx.lineTo(W - margin, ruleY);
    targetCtx.stroke();

    // Headline
    const headlineFontSize = Math.max(minFontScale * 10, Math.round(H * 0.065));
    targetCtx.fillStyle = theme.headline;
    targetCtx.font = `${headlineFontSize}px ${FONT_SERIF}`;
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'top';
    targetCtx.fillText(headline, W / 2, ruleY + H * 0.04, W - margin * 2);

    // Subline
    const subFontSize = Math.max(minFontScale * 8, Math.round(H * 0.032));
    targetCtx.fillStyle = theme.sub;
    targetCtx.font = `${subFontSize}px ${FONT_MONO}`;
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'top';
    targetCtx.fillText(subline, W / 2, ruleY + H * 0.04 + headlineFontSize * 1.3, W - margin * 2);

    // Bottom watermark
    const wmFontSize = Math.max(minFontScale * 6, Math.round(H * 0.022));
    targetCtx.fillStyle = theme.watermark;
    targetCtx.font = `${wmFontSize}px ${FONT_MONO}`;
    targetCtx.textAlign = 'right';
    targetCtx.textBaseline = 'bottom';
    targetCtx.fillText('VERTU  \u00B7  www.vertu.com', W - margin, H - Math.round(H * 0.04));
  };

  const draw = (overrideFormat, overrideTheme) => {
    const formatKey = overrideFormat || selectFormat?.value || 'ig-post';
    const themeKey  = overrideTheme  || selectTheme?.value  || 'dark';
    const fmt   = SOCIAL_FORMATS[formatKey] || SOCIAL_FORMATS['ig-post'];
    const theme = getSocialThemes()[themeKey] || getSocialThemes()['dark'];

    const scale = Math.min(PREVIEW_MAX / fmt.w, PREVIEW_MAX / fmt.h, 1);
    canvas.width  = Math.round(fmt.w * scale);
    canvas.height = Math.round(fmt.h * scale);
    canvas.style.width  = canvas.width  + 'px';
    canvas.style.height = canvas.height + 'px';

    renderSocialToCtx(ctx, canvas.width, canvas.height, theme, 1);
  };

  const downloadCanvas = (formatKey, themeKey) => {
    const fmt = SOCIAL_FORMATS[formatKey] || SOCIAL_FORMATS['ig-post'];
    const theme = getSocialThemes()[themeKey] || getSocialThemes()['dark'];

    const fullCanvas = document.createElement('canvas');
    fullCanvas.width  = fmt.w;
    fullCanvas.height = fmt.h;
    const fCtx = fullCanvas.getContext('2d');
    if (!fCtx) { return; }

    renderSocialToCtx(fCtx, fmt.w, fmt.h, theme, 2);

    fullCanvas.toBlob((blob) => {
      if (!blob) { return; }
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `VERTU-Social-${fmt.label}-${themeKey}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  // Live preview listeners
  [selectFormat, selectTheme].forEach((el) => {
    if (el) { el.addEventListener('change', () => draw()); }
  });
  [inputHeadline, inputSubline].forEach((el) => {
    if (el) { el.addEventListener('input', () => draw()); }
  });

  // Main download button
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      downloadCanvas(selectFormat?.value || 'ig-post', selectTheme?.value || 'dark');
    });
  }

  // Preset quick-download buttons
  document.querySelectorAll('.social-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const fmt   = btn.dataset.format || 'ig-post';
      const theme = btn.dataset.theme  || 'dark';
      downloadCanvas(fmt, theme);
    });
  });

  // Wait for logo images to load
  Object.values(logoSources).forEach((img) => {
    if (!img) { return; }
    if (img.complete) { draw(); return; }
    img.addEventListener('load', () => draw());
  });

  // Re-render when global theme changes
  const themeObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === 'data-theme') { draw(); break; }
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  isSocialGeneratorBound = true;
  draw();
}

document.addEventListener('DOMContentLoaded', initSocialGenerator);
