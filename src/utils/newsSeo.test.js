import { describe, expect, it } from "vitest";
import {
  normalizeLegacySiteUrls,
} from "./publicUrl";
import { sanitizeNewsArticleHtml } from "./newsSeo";

describe("normalizeLegacySiteUrls", () => {
  it("rewrites legacy site hosts while retaining paths", () => {
    const legacyOrigin = ["https://", "tryhook.shop"].join("");
    expect(normalizeLegacySiteUrls(`${legacyOrigin}/smartphones/example`)).toBe(
      "https://www.mobilesx.in/smartphones/example",
    );
    expect(
      normalizeLegacySiteUrls(`//www.${legacyOrigin.slice("https://".length)}/news`),
    ).toBe("https://www.mobilesx.in/news");
  });
});

describe("sanitizeNewsArticleHtml", () => {
  it("rewrites legacy site links in article content", () => {
    const legacyOrigin = ["https://", "tryhook.shop"].join("");
    expect(
      sanitizeNewsArticleHtml(
        `<p><a href="${legacyOrigin}/smartphones/example">Phone</a></p>`,
      ),
    ).toBe(
      '<p><a href="https://www.mobilesx.in/smartphones/example">Phone</a></p>',
    );
  });
});
