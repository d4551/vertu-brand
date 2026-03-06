import { GUIDE_BRAND_RELEASE } from "./template-catalog";
import type { GuideLanguage } from "./view-state";

/**
 * Localized copy for English and Simplified Chinese.
 */
export interface LocalizedCopy {
  en: string;
  zh: string;
}

/**
 * Localized UI copy keyed by the source HTML authoring keys.
 */
export const UI_COPY = {
  accessibilityAa: { en: "AA", zh: "AA" },
  accessibilityAaa: { en: "AAA", zh: "AAA" },
  accessibilityBackground: { en: "Background", zh: "背景色" },
  accessibilityContrastTarget: {
    en: "Contrast Target: 16.2:1 (Cream on Black)",
    zh: "对比度目标：16.2:1（奶油色背景）",
  },
  accessibilityFail: { en: "FAIL", zh: "未通过" },
  accessibilityForeground: { en: "Foreground", zh: "前景色" },
  accessibilityPass: { en: "PASS", zh: "通过" },
  accessibilityRatio: { en: "Ratio", zh: "对比度" },
  accessibilitySample: { en: "Sample", zh: "样例" },
  accessibilityStatusLabel: { en: "WCAG 2.2 AA PASS", zh: "WCAG 2.2 AA 通过" },
  closeSidebar: { en: "Close sidebar", zh: "关闭侧边栏" },
  colorRoleAccentsHeadlinesCtas: { en: "Accents · Headlines · CTAs", zh: "强调色 · 标题 · 行动按钮" },
  colorRoleBackgroundsTypography: { en: "Backgrounds · Typography", zh: "背景 · 排版" },
  colorRoleBodyMetadata: { en: "Body text · Metadata", zh: "正文 · 元信息" },
  colorDistribution10: { en: "10% Gold", zh: "10% 金色" },
  colorDistribution20: { en: "20% Charcoal", zh: "20% 深灰" },
  colorDistribution5: { en: "5% Ruby", zh: "5% 红宝石" },
  colorDistribution65: { en: "65% VERTU Black", zh: "65% VERTU 黑" },
  colorRoleElevatedSurfaces: { en: "Elevated surfaces", zh: "浮层背景" },
  colorRoleGradientsAtmospheric: { en: "Gradients · Atmospheric", zh: "渐变 · 氛围" },
  colorRoleHoverBorders: { en: "Hover states · Borders", zh: "悬停状态 · 边框" },
  colorRoleRubyKeyEmphasis: { en: "Ruby Key · Emphasis", zh: "红宝石 · 重点" },
  colorRoleTextOnDarkUi: { en: "Text on dark · Light UI", zh: "深色文本 · 浅色界面" },
  colorTagAccent: { en: "Accent", zh: "强调色" },
  colorTagDeep: { en: "Deep", zh: "深色" },
  colorTagLight: { en: "Light", zh: "浅色" },
  colorTagNeutral: { en: "Neutral", zh: "中性" },
  colorTagPrimary: { en: "Primary", zh: "主色" },
  colorTagSignature: { en: "Signature", zh: "标志色" },
  colorTagSurface: { en: "Surface", zh: "表面色" },
  componentAddToBag: { en: "Add to Bag", zh: "加入购物袋" },
  componentExploreCollection: { en: "Explore Collection", zh: "探索系列" },
  componentFilledCtaLabel: { en: "Filled — CTA", zh: "填充 — 行动按钮" },
  componentOutlinedPrimaryLabel: { en: "Outlined — Primary", zh: "描边 — 主按钮" },
  copied: { en: "Copied!", zh: "已复制！" },
  copyCodeLabel: { en: "Copy code snippet", zh: "复制代码片段" },
  copyColor: { en: "Copy color: {name} {value}", zh: "复制色值：{name} {value}" },
  copyHint: { en: "Click to copy", zh: "点击复制" },
  copyPantone: { en: "Copy Pantone reference {value}", zh: "复制潘通参考 {value}" },
  copyReady: { en: "Copy", zh: "复制" },
  cropAvoid: { en: "Avoid", zh: "避免" },
  cropAvoidAlt: { en: "Avoid: over-cropped hero shot", zh: "避免：过度裁切的产品主图" },
  cropCorrectDarkAlt: {
    en: "Correct crop: dark background with centered product",
    zh: "正确裁切：深色背景与居中产品",
  },
  cropCorrectMaterialAlt: {
    en: "Correct crop: material texture clearly visible",
    zh: "正确裁切：材质纹理清晰可见",
  },
  cropGood: { en: "Correct", zh: "正确" },
  downloadDocxAria: { en: "Download the premium letterhead DOCX template", zh: "下载高端信纸 DOCX 模板" },
  downloadGuideAria: {
    en: "Download the HTML guide snapshot",
    zh: "下载 HTML 指南快照",
  },
  downloadLogoBlackAlt: { en: "Downloadable black VERTU logo preview", zh: "可下载的黑色 VERTU 标志预览" },
  downloadLogoBlackAria: {
    en: "Download the black VERTU logo PNG for light backgrounds",
    zh: "下载适用于浅色背景的黑色 VERTU 标志 PNG",
  },
  downloadLogoGoldAlt: { en: "Downloadable gold VERTU logo preview", zh: "可下载的金色 VERTU 标志预览" },
  downloadLogoGoldAria: {
    en: "Download the gold VERTU logo PNG for premium dark applications",
    zh: "下载适用于高端深色场景的金色 VERTU 标志 PNG",
  },
  downloadLogoWhiteAlt: { en: "Downloadable white VERTU logo preview", zh: "可下载的白色 VERTU 标志预览" },
  downloadLogoWhiteAria: {
    en: "Download the white VERTU logo PNG for dark backgrounds",
    zh: "下载适用于深色背景的白色 VERTU 标志 PNG",
  },
  downloadPptxAria: { en: "Download the 9-slide presentation PPTX template", zh: "下载 9 页演示文稿 PPTX 模板" },
  footerBrandGuideTitle: { en: "VERTU Brand Guidelines", zh: "VERTU 品牌指南" },
  footerBrandLogoAlt: { en: "VERTU logo", zh: "VERTU 标志" },
  footerCopyright: { en: "© 2026 VERTU. All rights reserved.", zh: "© 2026 VERTU。保留所有权利。" },
  genVariantBlack: { en: "Black (Light BG)", zh: "黑色（浅色背景）" },
  genVariantGold: { en: "Gold (Premium)", zh: "金色（高端）" },
  genVariantWhite: { en: "White (Dark BG)", zh: "白色（深色背景）" },
  guideDescription: {
    en: "Official reference for VERTU visual identity, expression standards, downloadable assets, and implementation guidance.",
    zh: "VERTU 官方品牌参考，涵盖视觉识别、表达规范、下载资源与实施指引。",
  },
  guideCoverClassificationLabel: { en: "Classification", zh: "密级" },
  guideCoverClassificationValue: GUIDE_BRAND_RELEASE.classification,
  guideCoverDateLabel: { en: "Date", zh: "日期" },
  guideCoverDateValue: GUIDE_BRAND_RELEASE.date,
  guideCoverScrollLabel: { en: "Scroll to the guide content", zh: "滚动至指南内容" },
  guideCoverScrollPrompt: { en: "Scroll", zh: "向下滚动" },
  guideCoverSubtitle: {
    en: "Visual identity, expression standards, downloadable assets, and implementation guidance for the VERTU brand system.",
    zh: "面向 VERTU 品牌系统的视觉识别、表达规范、下载资产与实施指引。",
  },
  guideCoverTitleAccent: { en: "Design", zh: "设计" },
  guideCoverTitlePrefix: { en: "Brand", zh: "品牌" },
  guideCoverTitleSuffix: { en: "Guide", zh: "指南" },
  guideCoverVersionLabel: { en: "Version", zh: "版本" },
  guideCoverVersionValue: { en: GUIDE_BRAND_RELEASE.version, zh: GUIDE_BRAND_RELEASE.version },
  guideDocumentTitle: { en: "VERTU Brand Guide", zh: "VERTU 品牌指南" },
  guideLoadingState: { en: "Loading next section", zh: "正在加载下一章节" },
  guideTitle: { en: "Brand Guide", zh: "品牌指南" },
  guideHomeLabel: { en: "Return to the brand guide cover", zh: "返回品牌指南封面" },
  invalidSectionMessage: {
    en: "The requested section was not found. The guide opened on the overview instead.",
    zh: "未找到请求的章节，系统已改为打开总览页。",
  },
  languageBilingual: { en: "Bilingual", zh: "双语" },
  languageBilingualShort: { en: "BI", zh: "双语" },
  languageEnglish: { en: "English", zh: "英文" },
  languageEnglishShort: { en: "EN", zh: "EN" },
  languageLabel: { en: "Language", zh: "语言" },
  languageSelectLabel: { en: "Select guide language", zh: "选择指南语言" },
  languageChinese: { en: "Chinese", zh: "中文" },
  languageChineseShort: { en: "CN", zh: "中文" },
  logoBackgroundColorLabel: { en: "Background color", zh: "背景色" },
  logoPaddingLabel: { en: "Logo padding", zh: "标志留白" },
  logoTransparentLabel: { en: "Transparent background", zh: "透明背景" },
  logoVariantLabel: { en: "Logo variant", zh: "标志变体" },
  logoBoxOnBlack: { en: "On Black — Primary", zh: "黑底 · 主视觉" },
  logoBoxOnBlackAlt: { en: "VERTU logo on black background", zh: "VERTU 标志 · 黑色背景" },
  logoBoxOnCharcoal: { en: "Gold on Charcoal", zh: "金色 · 深灰底" },
  logoBoxOnCharcoalAlt: { en: "VERTU logo on charcoal background", zh: "VERTU 标志 · 深灰背景" },
  logoBoxOnGold: { en: "Black on Gold", zh: "黑色 · 金底" },
  logoBoxOnGoldAlt: { en: "VERTU logo on gold background", zh: "VERTU 标志 · 金色背景" },
  logoBoxOnLight: { en: "On Light — Reversed", zh: "浅底 · 反白应用" },
  logoBoxOnLightAlt: { en: "VERTU logo on light background", zh: "VERTU 标志 · 浅色背景" },
  logoGeneratorPreview: { en: "Logo generator preview", zh: "标志生成器预览" },
  motionBreatheName: { en: "Breathe", zh: "呼吸" },
  motionBreatheValue: { en: "ease-in-out · 2–4s | Ambient, looping states", zh: "ease-in-out · 2–4 秒 | 环境性循环态" },
  motionRefineName: { en: "Refine", zh: "精炼" },
  motionRefineValue: {
    en: "ease · 150–250ms | Hover, focus, micro-interactions",
    zh: "ease · 150–250 毫秒 | 悬停、焦点、微交互",
  },
  motionRevealName: { en: "Reveal", zh: "渐显" },
  motionRevealValue: {
    en: "ease-out · 250–400ms | Scroll-triggered entries",
    zh: "ease-out · 250–400 毫秒 | 滚动触发展示",
  },
  openSidebar: { en: "Open sidebar", zh: "打开侧边栏" },
  pantone10124Label: { en: "Premium Metallic", zh: "高级金属色" },
  pantone1935Label: { en: "Ruby", zh: "红宝石" },
  pantone7527Label: { en: "Cream", zh: "奶油白" },
  pantone871Label: { en: "Metallic Gold · Primary", zh: "金属金 · 主色" },
  pantone872Label: { en: "Metallic Gold · Rich", zh: "金属金 · 浓郁版" },
  pantoneBlack6Label: { en: "VERTU Black", zh: "VERTU 黑" },
  pantoneWarmGray5Label: { en: "Titanium", zh: "钛灰" },
  photoCellColour: { en: "Colour · Material contrast", zh: "色彩 · 材质对比" },
  photoCellDetail: { en: "Detail · Material texture", zh: "细节 · 材质纹理" },
  photoCellHero: { en: "Hero · Clean background", zh: "主图 · 简洁背景" },
  photoColourAlt: { en: "Signature S+ photography", zh: "Signature S+ 产品摄影" },
  photoDetailAlt: { en: "Quantum Flip photography", zh: "Quantum Flip 产品摄影" },
  photoHeroAlt: { en: "Agent Q photography", zh: "Agent Q 手机摄影" },
  playgroundFontLabel: { en: "Font", zh: "字体" },
  playgroundSizeLabel: { en: "Size", zh: "字号" },
  playgroundTrackingLabel: { en: "Tracking", zh: "字间距" },
  playgroundWeightLabel: { en: "Weight", zh: "字重" },
  sectionNavigationLabel: { en: "Guide sections", zh: "指南章节" },
  sidebarNavigation: { en: "Sidebar navigation", zh: "侧边导航" },
  skipToMainContent: { en: "Skip to main content", zh: "跳转到主内容" },
  themeDark: { en: "Dark", zh: "深色" },
  themeDarkShort: { en: "Dark", zh: "深色" },
  themeLabel: { en: "Theme", zh: "主题" },
  themeLight: { en: "Light", zh: "浅色" },
  themeLightShort: { en: "Light", zh: "浅色" },
  themeSystem: { en: "System", zh: "跟随系统" },
  themeSystemShort: { en: "Auto", zh: "自动" },

  /* Photography keywords (S6) */
  photoKeywordTactile: { en: "Tactile", zh: "触感" },
  photoKeywordLowKey: { en: "Low-key", zh: "低调光影" },
  photoKeywordMaterialFirst: { en: "Material-first", zh: "材质为先" },
  photoKeywordWarmHighlights: { en: "Warm highlights", zh: "暖色高光" },
  photoKeywordQuietDrama: { en: "Quiet drama", zh: "静谧戏剧性" },

  /* Image spec cards (S13) */
  imgSpecWebIcon: { en: "WEB", zh: "WEB" },
  imgSpecWebTitle: { en: "Web: Hero & Banner", zh: "网页：头图与横幅" },
  imgSpecWebDetail: {
    en: "Format: WebP (fallback JPEG)\nResolution: 2560×1440 @2x\nMax file: 250KB (hero), 120KB (card)\nQuality: 82–88% JPEG / 80% WebP\nColour profile: sRGB",
    zh: "格式：WebP（备选 JPEG）\n分辨率：2560×1440 @2x\n最大文件：250KB（头图）120KB（卡片）\n质量：82–88% JPEG / 80% WebP\n色彩配置：sRGB",
  },
  imgSpecPdpIcon: { en: "PDP", zh: "PDP" },
  imgSpecPdpTitle: { en: "Product Detail Pages", zh: "产品详情页" },
  imgSpecPdpDetail: {
    en: "Format: WebP / AVIF\nResolution: 1600×1600 @2x square\nBackground: #080808 (VERTU Black)\nMax file: 180KB per image\nZoom: Supply 4000×4000 source",
    zh: "格式：WebP / AVIF\n分辨率：1600×1600 @2x 正方形\n背景：#080808（VERTU 黑）\n最大文件：180KB/张\n放大：需提供 4000×4000 源文件",
  },
  imgSpecSocIcon: { en: "SOC", zh: "SOC" },
  imgSpecSocTitle: { en: "Social Media", zh: "社交媒体" },
  imgSpecSocDetail: {
    en: "Instagram: 1080×1350 (4:5 portrait)\nWeChat: 900×500 (article cover)\nWeibo: 1080×1080 (square)\nStories/Reels: 1080×1920 (9:16)\nFormat: JPEG, max 500KB",
    zh: "Instagram：1080×1350（4:5 纵向）\n微信：900×500（文章封面）\n微博：1080×1080（正方形）\n限时动态/Reels：1080×1920（9:16）\n格式：JPEG，最大 500KB",
  },
  imgSpecPrtIcon: { en: "PRT", zh: "PRT" },
  imgSpecPrtTitle: { en: "Print & Packaging", zh: "印刷与包装" },
  imgSpecPrtDetail: {
    en: "Resolution: 300 DPI minimum\nColour: CMYK + spot (PMS 871 C)\nFormat: TIFF (uncompressed)\nBleed: 3mm all sides\nEmbed ICC profile: Fogra39",
    zh: "分辨率：最低 300 DPI\n颜色：CMYK + 专色（PMS 871 C）\n格式：TIFF（无压缩）\n出血：四边各 3mm\n嵌入 ICC 配置文件：Fogra39",
  },

  /* Aspect ratio labels (S13) */
  aspectHero: { en: "16:9 Hero", zh: "16:9 头图" },
  aspectProduct: { en: "1:1 Product", zh: "1:1 产品" },
  aspectSocial: { en: "4:5 Social", zh: "4:5 社交" },
  aspectStories: { en: "9:16 Stories", zh: "9:16 限时动态" },
  aspectCinematic: { en: "21:9 Cinematic", zh: "21:9 影院比例" },
  socialPackEvent: { en: "Campaign Pack — Event", zh: "传播套件 — 私享活动" },
  socialPackLabel: { en: "Campaign Pack", zh: "传播套件" },
  socialPackLaunch: { en: "Campaign Pack — Launch", zh: "传播套件 — 新品发布" },
  socialPackSignature: { en: "Campaign Pack — Signature", zh: "传播套件 — 品牌常青" },
  socialAssetKindAnnouncement: { en: "Announcement Card", zh: "公告卡片" },
  socialAssetKindDocsHeader: { en: "Docs / Blog Header", zh: "文档 / 博客头图" },
  socialAssetKindEventInvite: { en: "Event Invite", zh: "活动邀请函" },
  socialAssetKindIgPost: { en: "Instagram Post", zh: "Instagram 帖子" },
  socialAssetKindIgStory: { en: "Instagram Story", zh: "Instagram 限时动态" },
  socialAssetKindLabel: { en: "Asset type", zh: "素材类型" },
  socialAssetKindLinkedin: { en: "LinkedIn Post", zh: "LinkedIn 帖子" },
  socialAssetKindOgCard: { en: "Open Graph Card", zh: "Open Graph 卡片" },
  socialAssetKindQuote: { en: "Quote Card", zh: "引言卡片" },
  socialAssetKindXHeader: { en: "X / Twitter Header", zh: "X / Twitter 页眉" },
  socialApprovedAssetAgentQ: { en: "Approved Asset — Agent Q", zh: "批准素材 — Agent Q" },
  socialApprovedAssetLabel: { en: "Approved asset", zh: "批准素材" },
  socialApprovedAssetQuantumFlip: { en: "Approved Asset — Quantum Flip", zh: "批准素材 — Quantum Flip" },
  socialApprovedAssetSignature: { en: "Approved Asset — Signature Black/Red", zh: "批准素材 — Signature 黑红系列" },
  socialToolkitAutoRefresh: {
    en: "The preview refreshes through the server-owned toolkit as preset inputs change.",
    zh: "当预设输入变化时，预览会通过服务端拥有的素材工具包自动刷新。",
  },
  socialToolkitLoadPreview: { en: "Load preview", zh: "加载预览" },
  socialToolkitPreviewAria: { en: "Campaign toolkit preview", zh: "传播套件预览" },
  socialToolkitPreviewIdle: {
    en: "Choose a campaign pack to load the server-rendered preview and download manifest.",
    zh: "选择传播套件以加载服务端渲染预览和下载清单。",
  },
  templateLibraryIntro: {
    en: "Generated templates now come from one typed catalog shared by the guide UI and the build pipeline.",
    zh: "模板现已统一由一个类型化目录驱动，供指南界面与构建流程共同使用。",
  },
  templateLibraryLabel: { en: "Template Library", zh: "模板库" },
  socialToolkitErrorTitle: { en: "Invalid social asset request", zh: "社会化素材请求无效" },
  socialToolkitErrorBody: {
    en: "The requested social asset could not be resolved: {reason} ({value}).",
    zh: "无法解析所请求的素材请求：{reason}（{value}）。",
  },
  socialToolkitErrorMissingValue: { en: "missing", zh: "缺失" },
  socialToolkitReasonInvalidApprovedAsset: { en: "Approved asset is not supported", zh: "批准素材不受支持" },
  socialToolkitReasonInvalidAssetForPreset: { en: "Asset type is not allowed for this preset", zh: "该预设不允许此素材类型" },
  socialToolkitReasonInvalidAssetKind: { en: "Asset type is invalid", zh: "素材类型无效" },
  socialToolkitReasonInvalidCarouselFrame: { en: "Carousel frame is invalid", zh: "轮播帧无效" },
  socialToolkitReasonInvalidPack: { en: "Campaign pack is invalid", zh: "传播套件无效" },
  socialToolkitReasonInvalidPreset: { en: "Preset is invalid", zh: "预设无效" },
  socialToolkitReasonInvalidTheme: { en: "Theme is invalid", zh: "主题无效" },
  socialToolkitLabelCampaignPack: { en: "Campaign Pack", zh: "传播套件" },
  socialToolkitLabelSingleAssets: { en: "Single Assets", zh: "单张素材" },
  socialToolkitLabelNoAssets: { en: "No assets are configured for this preset.", zh: "当前预设未配置素材。" },
  socialToolkitLabelDownloadManifest: { en: "Download Manifest", zh: "下载清单" },
  socialToolkitLabelDownload: { en: "Download", zh: "下载" },
  socialToolkitLabelPreview: { en: "Preview", zh: "预览" },
  socialToolkitLabelDimensions: { en: "Dimensions", zh: "尺寸" },
  socialToolkitLabelStepSelect: { en: "Select Preset", zh: "选择预设" },
  socialToolkitLabelStepReview: { en: "Review Assets", zh: "审阅素材" },
  socialToolkitLabelStepExport: { en: "Export Pack", zh: "导出清单" },
  socialToolkitLabelCarouselFrames: { en: "Carousel Frames", zh: "轮播帧" },
  socialToolkitLabelFrame: { en: "Frame", zh: "轮播页" },
  socialToolkitAssetsTableCaption: { en: "Campaign assets available for export", zh: "可导出的传播素材列表" },
  socialThemeDark: { en: "Dark — Black + Gold", zh: "深色 — 黑金配色" },
  socialThemeGold: { en: "Gold — Gold + Black", zh: "金色 — 金黑配色" },
  socialThemeLight: { en: "Light — Ivory + Gold", zh: "浅色 — 象牙白与金色" },
  socialThemeLabel: { en: "Social media theme", zh: "社交媒体主题" },
  spacingBaseUnit: { en: "Base unit — icon padding", zh: "基准单位 — 图标内边距" },
  spacingLarge: { en: "Large — between subsections", zh: "大 — 分区间距" },
  spacingMedium: { en: "Medium — section sub-gaps", zh: "中 — 子区块间距" },
  spacingMicro: { en: "Micro — tight label gaps", zh: "微小 — 标签间距紧凑" },
  spacingSmall: { en: "Small — card internal padding", zh: "小 — 卡片内边距" },
  spacingXL: { en: "XL — section padding", zh: "特大 — 区块内边距" },
  spacingXXL: { en: "XXL — hero/section padding (brand page)", zh: "超大 — 头图/区块内边距（页面）" },
  templateLibraryAria: { en: "Template library", zh: "模板库" },
  templateLibraryDownload: { en: "Download", zh: "下载" },
  templateLibraryIntro: {
    en: "Generated templates now come from one typed catalog shared by the guide UI and the build pipeline.",
    zh: "模板现已统一由一个类型化目录驱动，供指南界面与构建流程共同使用。",
  },
  templateLibraryTitle: { en: "Template Library", zh: "模板库" },
  templateGuideSnapshotCoverageLabel: { en: "Coverage", zh: "覆盖范围" },
  templateGuideSnapshotCoverageValue: { en: "Bilingual", zh: "双语" },
  templateGuideSnapshotDescription: {
    en: "Generated from the live SSR shell so saved guide downloads stay aligned with the current application UI.",
    zh: "由实时 SSR 外壳生成，确保下载的指南快照与当前应用界面保持一致。",
  },
  templateGuideSnapshotFormatLabel: { en: "Format", zh: "格式" },
  templateGuideSnapshotHighlightArchive: {
    en: "Best used as a shareable HTML snapshot instead of a separate legacy shell",
    zh: "适合作为可分享的 HTML 快照，而非独立的旧版外壳",
  },
  templateGuideSnapshotHighlightShell: {
    en: "Includes the same cover, sidebar, navigation, and request-state contract as the live guide",
    zh: "包含与实时指南一致的封面、侧栏、导航与请求状态契约",
  },
  templateGuideSnapshotName: { en: "HTML Guide Snapshot", zh: "HTML 指南快照" },
  templateGuideSnapshotSurfaceLabel: { en: "Surface", zh: "内容" },
  templateGuideSnapshotSurfaceValue: { en: "SSR shell", zh: "SSR 外壳" },
  toggleLanguageTo: { en: "Switch guide language to {value}", zh: "切换指南语言为{value}" },
  toggleTheme: { en: "Select guide theme", zh: "选择指南主题" },
  toggleThemeTo: { en: "Switch guide theme to {value}", zh: "切换指南主题为{value}" },
  typeMetaBodyLabels: { en: "Body · Nav · UI · Labels", zh: "正文 · 导航 · UI · 标签" },
  typeMetaBodyWeights: { en: "400, 500, 600", zh: "400, 500, 600" },
  typeMetaHeadlinesHeroQuotes: { en: "Headlines · Hero · Quotes", zh: "标题 · 头图 · 引言" },
  typeMetaMin14Px: { en: "Min: 14px", zh: "最小：14px" },
  typeMetaMin24Px: { en: "Min: 24px", zh: "最小：24px" },
  typeMetaRegularItalic: { en: "Regular 400 & Italic", zh: "常规 400 与斜体" },
  typeMetaSpecsMetadataCodes: {
    en: "Specs · Labels · Metadata · Product codes",
    zh: "规格 · 标签 · 元数据 · 产品代码",
  },
  typeScaleBody: { en: "Body", zh: "正文" },
  typeScaleH1: { en: "H1", zh: "H1" },
  typeScaleHero: { en: "Hero", zh: "头图" },
  typeScaleLabel: { en: "Label", zh: "标签" },
} as const satisfies Record<string, LocalizedCopy>;

/**
 * Localized toast copy for browser enhancements.
 */
export const TOAST_COPY = {
  assetDownload: { en: "Downloading", zh: "正在下载" },
  assetUnavailable: { en: "Asset file is not available", zh: "资产文件不可用" },
  copyCode: { en: "Code snippet copied", zh: "代码片段已复制" },
  copyFailed: { en: "Copy failed. Please copy manually.", zh: "复制失败，请手动复制。" },
  copyHex: { en: "Color copied to clipboard", zh: "色值已复制" },
  copyPantone: { en: "Pantone reference copied", zh: "潘通参考已复制" },
  guideDownload: { en: "Downloading brand guide HTML", zh: "正在下载品牌指南 HTML" },
  logoContrastInvalid: {
    en: "Contrast check failed for {variant}. Choose a stronger contrasting background or enable Transparent.",
    zh: "{variant} 与当前背景对比不足。请切换更有对比度的背景或启用透明。",
  },
  logoDownloadFailed: { en: "Logo download failed. Please try again.", zh: "标志下载失败，请重试。" },
  logoDownloadStart: { en: "Rendering logo for download…", zh: "正在生成标志下载文件…" },
  logoGenerated: { en: "Generated & Downloaded!", zh: "已生成并下载！" },
  logoSourceUnavailable: {
    en: "Logo source image did not load. Please refresh the page and try again.",
    zh: "标志源图未加载成功，请刷新页面后重试。",
  },
} as const satisfies Record<string, LocalizedCopy>;

/**
 * Resolves localized copy for the active language.
 */
export const resolveCopy = <Key extends keyof typeof UI_COPY>(
  key: Key,
  language: GuideLanguage,
  replacements: Record<string, string> = {}
): string => interpolate(language, UI_COPY[key], replacements);

/**
 * Resolves localized copy for a concrete locale without the bilingual inline fallback.
 */
export const resolveLocaleCopy = <Key extends keyof typeof UI_COPY>(
  key: Key,
  language: Extract<GuideLanguage, "en" | "zh">,
  replacements: Record<string, string> = {}
): string => interpolate(language, UI_COPY[key], replacements);

/**
 * Resolves localized toast text for the active language.
 */
export const resolveToastCopy = <Key extends keyof typeof TOAST_COPY>(
  key: Key,
  language: GuideLanguage,
  replacements: Record<string, string> = {}
): string => interpolate(language, TOAST_COPY[key], replacements);

/**
 * Renders bilingual spans so CSS can control EN/ZH visibility.
 */
export const renderLocalizedSpans = (copy: LocalizedCopy): string =>
  `<span data-lang-en="" class="guide-copy-en" lang="en">${copy.en}</span><span data-lang-cn="" class="guide-copy-zh" lang="zh-Hans">${copy.zh}</span>`;

/**
 * Renders visible copy for the active language. Bilingual mode returns
 * stacked EN/ZH spans instead of inline concatenation so compact chrome can
 * expand without overlaps.
 */
export const renderVisibleCopy = <Key extends keyof typeof UI_COPY>(
  key: Key,
  language: GuideLanguage,
  replacements: Record<string, string> = {}
): string =>
  language === "bi"
    ? renderLocalizedSpans({
        en: interpolate("en", UI_COPY[key], replacements),
        zh: interpolate("zh", UI_COPY[key], replacements),
      })
    : interpolate(language, UI_COPY[key], replacements);

const interpolate = (language: GuideLanguage, copy: LocalizedCopy, replacements: Record<string, string>): string => {
  const template = language === "zh" ? copy.zh : language === "bi" ? `${copy.en} · ${copy.zh}` : copy.en;

  return Object.entries(replacements).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), template);
};
