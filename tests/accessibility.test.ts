import { describe, expect, test } from "bun:test";

import { app } from "../src/server/app";
import { toGuideRequestUrl } from "../src/shared/config";
import { findInteractiveElementsMissingAriaLabels } from "../src/shared/markup";
import { SOCIAL_GUIDE_QUERY_PARAMS } from "../src/shared/social-toolkit";
import { GUIDE_LANGUAGES, GUIDE_SECTION_IDS } from "../src/shared/view-state";

describe("accessibility regressions", () => {
  test("ships explicit accessible names for all interactive SSR controls across sections and languages", async () => {
    const results = await Promise.all(
      GUIDE_SECTION_IDS.flatMap((sectionId) =>
        GUIDE_LANGUAGES.map(async (language) => {
          const response = await app.handle(
            new Request(toGuideRequestUrl(`/?section=${sectionId}&lang=${language}&theme=dark`))
          );
          const html = await response.text();

          return {
            language,
            missingLabels: findInteractiveElementsMissingAriaLabels(html),
            sectionId,
          };
        })
      )
    );

    expect(results.filter((result) => result.missingLabels.length > 0)).toEqual([]);
  });

  test("localizes section-level interactive controls on the server", async () => {
    const response = await app.handle(new Request(toGuideRequestUrl("/?section=s15&lang=zh&theme=dark")));
    const html = await response.text();

    expect(html).toContain('aria-label="跳转到主内容"');
    expect(html).toContain('aria-label="滚动至指南内容"');
    /* Cycle buttons announce the next state they will switch to. */
    expect(html).toContain('aria-label="切换指南语言为双语"');
    expect(html).toContain('aria-label="切换指南主题为浅色"');
    expect(html).toContain('aria-label="选择指南主题"');
    expect(html).toContain('aria-label="标志变体"');
    expect(html).toContain('aria-label="传播套件"');
    expect(html).toContain('aria-label="素材类型"');
    expect(html).toContain('aria-label="批准素材"');
    expect(html).toContain('aria-label="社交媒体主题"');
    expect(html).toContain("标志生成器预览");
    expect(html).toContain("传播套件预览");
    expect(html).toContain("正在加载下一章节");
    expect(html).toContain('aria-label="下载适用于浅色背景的黑色 VERTU 标志 PNG"');
    expect(html).not.toContain(">应用<");
    expect(html).not.toContain("HTMX + Elysia");
  });

  test("hydrates code-copy buttons with usable fallback text and names", async () => {
    const response = await app.handle(new Request(toGuideRequestUrl("/?section=s14&lang=bi&theme=dark")));
    const html = await response.text();

    expect(html).toContain('class="code-copy-btn"');
    expect(html).toContain("Copy · 复制");
    expect(html).toContain('aria-label="Copy code snippet · 复制代码片段"');
  });

  test("renders icon-based sidebar controls and stacked content labels without inline overlap copy in bilingual mode", async () => {
    const response = await app.handle(
      new Request(
        toGuideRequestUrl(
          `/?section=s15&lang=bi&theme=dark&${SOCIAL_GUIDE_QUERY_PARAMS.pack}=campaign-event&${SOCIAL_GUIDE_QUERY_PARAMS.asset}=og-card&${SOCIAL_GUIDE_QUERY_PARAMS.approvedAsset}=quantum-flip&${SOCIAL_GUIDE_QUERY_PARAMS.theme}=gold`
        )
      )
    );
    const html = await response.text();

    expect(html).toContain("guide-theme-cycle");
    expect(html).toContain("guide-lang-cycle");
    expect(html).toContain(
      '<span data-lang-en="" class="guide-copy-en" lang="en">Download Manifest</span><span data-lang-cn="" class="guide-copy-zh" lang="zh-Hans">下载清单</span>'
    );
    expect(html).not.toContain(">Download Manifest · 下载清单<");
  });
});
