import test from "node:test";
import assert from "node:assert/strict";
import { messagesAr, messagesFr } from "./messages";

function leafPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") {
    return [];
  }
  const out: string[] = [];
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      out.push(path);
    } else if (v && typeof v === "object") {
      out.push(...leafPaths(v, path));
    }
  }
  return out;
}

test("messagesFr and messagesAr have identical leaf key paths", () => {
  const fr = new Set(leafPaths(messagesFr));
  const ar = new Set(leafPaths(messagesAr));

  const missingInAr = [...fr].filter((k) => !ar.has(k)).sort();
  const extraInAr = [...ar].filter((k) => !fr.has(k)).sort();

  assert.deepEqual(
    missingInAr,
    [],
    `Arabic missing keys (${missingInAr.length}): ${missingInAr.slice(0, 30).join(", ")}${
      missingInAr.length > 30 ? "…" : ""
    }`
  );
  assert.deepEqual(
    extraInAr,
    [],
    `Arabic has extra keys (${extraInAr.length}): ${extraInAr.slice(0, 30).join(", ")}${
      extraInAr.length > 30 ? "…" : ""
    }`
  );
});
