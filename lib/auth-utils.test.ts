import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { normalizeClientIp, normalizeEmail, safeEqual } from "./auth-utils";

describe("normalizeEmail", () => {
  it("trims and lowercases email addresses", () => {
    assert.equal(normalizeEmail("  USER@Example.COM "), "user@example.com");
  });
});

describe("normalizeClientIp", () => {
  it("prefers the first x-forwarded-for entry", () => {
    const ip = normalizeClientIp({
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    });
    assert.equal(ip, "203.0.113.10");
  });

  it("falls back to x-real-ip", () => {
    const ip = normalizeClientIp({
      "x-real-ip": "198.51.100.12",
    });
    assert.equal(ip, "198.51.100.12");
  });
});

describe("safeEqual", () => {
  it("returns true for identical strings", () => {
    assert.equal(safeEqual("launch-secret", "launch-secret"), true);
  });

  it("returns false for different strings", () => {
    assert.equal(safeEqual("launch-secret", "other-secret"), false);
  });

  it("returns false for different lengths", () => {
    assert.equal(safeEqual("short", "a-much-longer-value"), false);
  });
});
