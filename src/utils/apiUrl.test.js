import { describe, it, expect } from "vitest";
import {
  buildApiUrl,
  resolveApiBaseUrl,
  DEFAULT_LOCAL_API_BASE_URL,
  DEFAULT_REMOTE_API_BASE_URL,
} from "./apiUrl";
import { normalizeSeoTitle } from "./seoTitle";

describe("resolveApiBaseUrl", () => {
  it("uses the local backend on server-side rendering", () => {
    expect(resolveApiBaseUrl({ isServer: true })).toBe(
      DEFAULT_LOCAL_API_BASE_URL,
    );
  });

  it("uses the configured API base when provided", () => {
    expect(
      resolveApiBaseUrl({
        env: { VITE_API_BASE_URL: "https://example.com" },
        isServer: true,
      }),
    ).toBe("https://example.com/api");
  });

  it("uses the remote API base in the browser by default", () => {
    expect(resolveApiBaseUrl({ hostname: "mobilesx.in" })).toBe(
      DEFAULT_REMOTE_API_BASE_URL,
    );
  });

  it("uses MobilesX as the canonical brand label in SEO titles", () => {
    expect(normalizeSeoTitle("Xiaomi 14 | MobilesX")).toBe(
      "Xiaomi 14 | MobilesX",
    );
  });
});

describe("buildApiUrl", () => {
  it("builds the public price history URL on the configured API base", () => {
    expect(
      buildApiUrl(
        "/public/smartphone/123/price-history?variant_id=7&store=mobilesx",
        "https://api.example.com/api",
      ),
    ).toBe(
      "https://api.example.com/api/public/smartphone/123/price-history?variant_id=7&store=mobilesx",
    );
  });
});
