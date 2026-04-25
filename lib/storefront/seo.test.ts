import assert from "node:assert/strict";
import test from "node:test";
import { getCanonicalStorefrontUrl } from "@/lib/storefront/seo";

test("getCanonicalStorefrontUrl prefers the custom hostname when available", () => {
  assert.equal(
    getCanonicalStorefrontUrl({
      agencySlug: "atlas-rent",
      customHostname: "www.atlasrent.ma",
    }),
    "https://www.atlasrent.ma/",
  );
});

test("getCanonicalStorefrontUrl falls back to the Locaryx slug URL", () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://app.locaryx.com";

  try {
    assert.equal(
      getCanonicalStorefrontUrl({
        agencySlug: "atlas-rent",
      }),
      "https://app.locaryx.com/atlas-rent",
    );
  } finally {
    process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
  }
});
