import { describe, expect, test } from "bun:test";

import { app } from "../src/server/app";
import { toGuideRequestUrl } from "../src/shared/config";
import { findInteractiveElementsMissingAriaLabels } from "../src/shared/markup";
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
    expect(html).toContain('aria-label="中文"');
    expect(html).toContain('aria-label="英文"');
    expect(html).toContain('aria-label="双语"');
    expect(html).toContain('aria-label="选择指南主题"');
    expect(html).toContain('aria-label="标志变体"');
    expect(html).toContain('aria-label="社交媒体格式"');
    expect(html).toContain('aria-label="社交媒体主题"');
    expect(html).toContain('aria-label="标语"');
    expect(html).toContain('aria-label="副标语（选填）"');
    expect(html).toContain("标志生成器预览");
    expect(html).toContain("社交媒体模板预览");
    expect(html).toContain("Instagram 帖子（1080×1080）");
    expect(html).toContain('placeholder="超越匠心"');
    expect(html).toContain("正在加载下一章节");
    expect(html).toContain('aria-label="下载适用于浅色背景的黑色 VERTU 标志 PNG"');
    expect(html).toContain('aria-label="以 1080×1080 PNG 下载深色 Instagram 帖子预设"');
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
});
