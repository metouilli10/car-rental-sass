import type { StorefrontVerificationRecord } from "@/lib/storefront/domains";

function getVerificationRecordKey(record: StorefrontVerificationRecord) {
  return [record.type, record.domain, record.value, record.source || ""].join("::");
}

export function mergeVerificationRecords(
  ...groups: Array<StorefrontVerificationRecord[] | null | undefined>
) {
  const seen = new Set<string>();
  const merged: StorefrontVerificationRecord[] = [];

  for (const group of groups) {
    for (const record of group || []) {
      const key = getVerificationRecordKey(record);
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      merged.push(record);
    }
  }

  return merged;
}
