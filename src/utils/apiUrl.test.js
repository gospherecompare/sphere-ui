import { describe, it, expect } from "vitest";
import {
  resolveApiBaseUrl,
  DEFAULT_LOCAL_API_BASE_URL,
  DEFAULT_REMOTE_API_BASE_URL,
} from "./apiUrl";

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
});
