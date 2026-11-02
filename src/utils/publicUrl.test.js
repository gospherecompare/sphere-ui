import { describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_ORIGIN,
  toCanonicalPageUrl,
} from "./publicUrl";

describe("toCanonicalPageUrl", () => {
  it("uses the www origin for relative page paths", () => {
    expect(toCanonicalPageUrl("/news/article")).toBe(
      "https://www.mobilesx.in/news/article",
    );
  });

  it("converts apex-domain URLs to the www origin", () => {
    expect(toCanonicalPageUrl("https://mobilesx.in/news/article?ref=home")).toBe(
      `${DEFAULT_SITE_ORIGIN}/news/article`,
    );
  });
});
