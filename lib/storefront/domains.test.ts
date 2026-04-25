import assert from "node:assert/strict";
import test from "node:test";
import {
  getDnsProviderHostValue,
  getCustomDomainUrl,
  getEffectiveStorefrontVerificationRecords,
  getRegistrableStorefrontDomain,
  isInternalStorefrontHost,
  isValidStorefrontHostname,
  normalizeStorefrontHostname,
} from "@/lib/storefront/domains";

test("normalizeStorefrontHostname strips protocol, path, and port", () => {
  assert.equal(
    normalizeStorefrontHostname("https://WWW.Example.com:8443/booking?x=1"),
    "www.example.com",
  );
});

test("isValidStorefrontHostname accepts public hostnames and rejects invalid ones", () => {
  assert.equal(isValidStorefrontHostname("www.example.com"), true);
  assert.equal(isValidStorefrontHostname("localhost"), false);
  assert.equal(isValidStorefrontHostname("bad host"), false);
});

test("isInternalStorefrontHost recognizes app-owned hosts", () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  process.env.NEXT_PUBLIC_APP_URL = "https://app.locaryx.com";

  try {
    assert.equal(isInternalStorefrontHost("app.locaryx.com"), true);
    assert.equal(isInternalStorefrontHost("preview.vercel.app"), true);
    assert.equal(isInternalStorefrontHost("agency-client.ma"), false);
  } finally {
    process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
  }
});

test("getCustomDomainUrl always returns an https URL", () => {
  assert.equal(getCustomDomainUrl("WWW.Example.com", "/"), "https://www.example.com/");
});

test("getRegistrableStorefrontDomain handles common compound suffixes", () => {
  assert.equal(getRegistrableStorefrontDomain("www.example.com"), "example.com");
  assert.equal(getRegistrableStorefrontDomain("www.agency.com.ma"), "agency.com.ma");
});

test("getDnsProviderHostValue returns provider-friendly host labels", () => {
  assert.equal(getDnsProviderHostValue("tizguivalley.com", "tizguivalley.com"), "@");
  assert.equal(getDnsProviderHostValue("www.example.com", "www.example.com"), "www");
  assert.equal(getDnsProviderHostValue("www.example.com", "_vercel.www.example.com"), "_vercel.www");
});

test("getEffectiveStorefrontVerificationRecords hides conflicting apex CNAME hints", () => {
  const records = getEffectiveStorefrontVerificationRecords("tizguivalley.com", [
    {
      type: "A",
      domain: "tizguivalley.com",
      value: "76.76.21.21",
      source: "config",
    },
    {
      type: "CNAME",
      domain: "tizguivalley.com",
      value: "cname.vercel-dns.com",
      source: "config",
    },
    {
      type: "TXT",
      domain: "_vercel.tizguivalley.com",
      value: "vc-domain-verify=abc",
      source: "verification",
    },
  ]);

  assert.deepEqual(
    records.map((record) => record.type),
    ["A", "TXT"],
  );
});
