import assert from "node:assert/strict";
import test from "node:test";
import type { StorefrontVerificationRecord } from "@/lib/storefront/domains";
import { mergeVerificationRecords } from "@/lib/storefront/verification-records";

test("mergeVerificationRecords preserves verification records while deduplicating exact duplicates", () => {
  const verificationRecord: StorefrontVerificationRecord = {
    type: "TXT",
    domain: "_vercel.www.example.com",
    value: "vc-domain-verify=example",
    reason: "Verification challenge",
    source: "verification",
  };
  const configRecord: StorefrontVerificationRecord = {
    type: "CNAME",
    domain: "www.example.com",
    value: "cname.vercel-dns.com",
    reason: "Routing target",
    source: "config",
  };

  const merged = mergeVerificationRecords(
    [verificationRecord, configRecord],
    [verificationRecord],
  );

  assert.deepEqual(merged, [verificationRecord, configRecord]);
});

test("mergeVerificationRecords keeps distinct sources when records differ", () => {
  const configRecord: StorefrontVerificationRecord = {
    type: "CNAME",
    domain: "www.example.com",
    value: "cname.vercel-dns.com",
    source: "config",
  };
  const verificationRecord: StorefrontVerificationRecord = {
    type: "CNAME",
    domain: "www.example.com",
    value: "another.target.vercel-dns.com",
    source: "verification",
  };

  const merged = mergeVerificationRecords([configRecord], [verificationRecord]);

  assert.deepEqual(merged, [configRecord, verificationRecord]);
});
