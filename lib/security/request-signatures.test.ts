import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { matchesFileSignature } from "./request-signatures";

describe("matchesFileSignature", () => {
  it("accepts valid jpeg signatures", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    assert.equal(matchesFileSignature(jpeg, "image/jpeg"), true);
  });

  it("accepts valid png signatures", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    assert.equal(matchesFileSignature(png, "image/png"), true);
  });

  it("accepts valid webp signatures", () => {
    const webp = Buffer.from([
      0x52, 0x49, 0x46, 0x46,
      0x24, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
    ]);
    assert.equal(matchesFileSignature(webp, "image/webp"), true);
  });

  it("accepts valid pdf signatures", () => {
    const pdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
    assert.equal(matchesFileSignature(pdf, "application/pdf"), true);
  });

  it("rejects mismatched content", () => {
    const fakePng = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    assert.equal(matchesFileSignature(fakePng, "image/png"), false);
  });
});
