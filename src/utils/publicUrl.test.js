import { describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_ORIGIN,
  toCanonicalPageUrl,
} from "./publicUrl";

describe("toCanonicalPageUrl", () => {
  it("uses the apex origin for relative page paths", () => {
    expect(toCanonicalPageUrl("/news/article")).toBe(
      "https://mobilesx.in/news/article",
    );
  });

  it("keeps apex-domain URLs on the apex origin", () => {
    expect(toCanonicalPageUrl("https://mobilesx.in/news/article?ref=home")).toBe(
      `${DEFAULT_SITE_ORIGIN}/news/article`,
    );
  });

  it("normalizes legacy www URLs to the apex origin", () => {
    const legacyUrl = ["https://www.", "mobilesx.in/news/article?ref=home"].join("");
    expect(toCanonicalPageUrl(legacyUrl)).toBe(
      "https://mobilesx.in/news/article",
    );
  });
});
