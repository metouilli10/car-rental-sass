import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  compactSearchToken,
  getBookingReference,
  normalizeSearchQuery,
} from "./search-utils";

describe("normalizeSearchQuery", () => {
  it("trims, lowercases, and collapses whitespace", () => {
    assert.equal(normalizeSearchQuery("  Ali   BEN  "), "ali ben");
  });
});

describe("compactSearchToken", () => {
  it("removes separators commonly used in quick search input", () => {
    assert.equal(compactSearchToken(" #ab-12 34 "), "ab1234");
  });
});

describe("getBookingReference", () => {
  it("builds the short booking code displayed in the UI", () => {
    assert.equal(getBookingReference("cm8xyzab123456"), "#123456");
  });
});
