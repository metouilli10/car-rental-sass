import { resolve4, resolveCname, resolveTxt } from "node:dns/promises";
import type { StorefrontVerificationRecord } from "@/lib/storefront/domains";
import { normalizeStorefrontHostname } from "@/lib/storefront/domains";

export type StorefrontDnsAudit = {
  records: StorefrontVerificationRecord[];
  matchedCount: number;
  missingCount: number;
  mismatchCount: number;
  allVerified: boolean;
};

function normalizeDnsValue(value: string) {
  return value.trim().toLowerCase().replace(/\.+$/, "");
}

export function evaluateStorefrontDnsRecord(
  record: StorefrontVerificationRecord,
  observedValues: string[],
) {
  const normalizedObservedValues = observedValues.map(normalizeDnsValue);
  const expected = normalizeDnsValue(record.value);
  const hasExactMatch = normalizedObservedValues.includes(expected);

  let status: StorefrontVerificationRecord["status"] = "missing";
  if (hasExactMatch) {
    status = "verified";
  } else if (normalizedObservedValues.length > 0) {
    status = "mismatch";
  }

  return {
    ...record,
    status,
    observedValues: normalizedObservedValues,
  } satisfies StorefrontVerificationRecord;
}

async function resolveObservedValues(record: StorefrontVerificationRecord) {
  const domain = normalizeStorefrontHostname(record.domain);

  try {
    switch (record.type.toUpperCase()) {
      case "A":
        return (await resolve4(domain)).map(normalizeDnsValue);
      case "CNAME":
        return (await resolveCname(domain)).map(normalizeDnsValue);
      case "TXT":
        return (await resolveTxt(domain)).map((value) => normalizeDnsValue(value.join("")));
      default:
        return [];
    }
  } catch {
    return [];
  }
}

export async function auditStorefrontDnsRecords(records: StorefrontVerificationRecord[]) {
  const audited = await Promise.all(
    records.map(async (record) => {
      const observedValues = await resolveObservedValues(record);
      return evaluateStorefrontDnsRecord(record, observedValues);
    }),
  );

  const matchedCount = audited.filter((record) => record.status === "verified").length;
  const missingCount = audited.filter((record) => record.status === "missing").length;
  const mismatchCount = audited.filter((record) => record.status === "mismatch").length;

  return {
    records: audited,
    matchedCount,
    missingCount,
    mismatchCount,
    allVerified: audited.length > 0 && matchedCount === audited.length,
  } satisfies StorefrontDnsAudit;
}

export function buildStorefrontDnsAuditMessage(audit: StorefrontDnsAudit) {
  if (audit.allVerified) {
    return "Tous les enregistrements DNS attendus sont visibles depuis l'application.";
  }

  if (audit.mismatchCount > 0) {
    return `Certains DNS répondent, mais ${audit.mismatchCount} enregistrement(s) ne correspondent pas encore à la valeur attendue.`;
  }

  if (audit.missingCount > 0) {
    return `${audit.missingCount} enregistrement(s) DNS attendu(s) ne sont pas encore visibles.`;
  }

  return "La vérification DNS est en attente.";
}
