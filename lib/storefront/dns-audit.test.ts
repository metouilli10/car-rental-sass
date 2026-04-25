import assert from "node:assert/strict";
import test from "node:test";
import {
  buildStorefrontDnsAuditMessage,
  evaluateStorefrontDnsRecord,
} from "@/lib/storefront/dns-audit";
import type { StorefrontVerificationRecord } from "@/lib/storefront/domains";

test("evaluateStorefrontDnsRecord marks exact matches as verified", () => {
  const record: StorefrontVerificationRecord = {
    type: "CNAME",
    domain: "www.example.com",
    value: "target.vercel-dns.com.",
  };

  const evaluated = evaluateStorefrontDnsRecord(record, ["target.vercel-dns.com"]);

  assert.equal(evaluated.status, "verified");
  assert.deepEqual(evaluated.observedValues, ["target.vercel-dns.com"]);
});

test("evaluateStorefrontDnsRecord marks mismatched values distinctly from missing ones", () => {
  const record: StorefrontVerificationRecord = {
    type: "A",
    domain: "example.com",
    value: "76.76.21.21",
  };

  const mismatch = evaluateStorefrontDnsRecord(record, ["216.150.1.1"]);
  const missing = evaluateStorefrontDnsRecord(record, []);

  assert.equal(mismatch.status, "mismatch");
  assert.equal(missing.status, "missing");
});

test("buildStorefrontDnsAuditMessage explains the dominant DNS state", () => {
  assert.match(
    buildStorefrontDnsAuditMessage({
      records: [],
      matchedCount: 1,
      missingCount: 0,
      mismatchCount: 0,
      allVerified: true,
    }),
    /Tous les enregistrements DNS attendus/,
  );

  assert.match(
    buildStorefrontDnsAuditMessage({
      records: [],
      matchedCount: 0,
      missingCount: 0,
      mismatchCount: 2,
      allVerified: false,
    }),
    /ne correspondent pas encore/,
  );
});
